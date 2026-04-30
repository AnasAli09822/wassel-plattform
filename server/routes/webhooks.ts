// Inbound webhook receivers.
//
//  POST /api/webhooks/whatsapp   ← Meta Cloud API
//  GET  /api/webhooks/whatsapp   ← Meta verification handshake
//  POST /api/webhooks/n8n        ← n8n master workflow callbacks
//
// All bodies are recorded into /webhook_events/* for auditing before being
// processed. Signature verification protects every endpoint.

import { Router, Request, Response } from 'express';
import { adminDb, ServerTimestamp } from '../firebaseAdmin';
import { verifyMetaSignature, verifyHmac } from '../utils/crypto';
import { resolveTenantByWhatsapp } from '../services/tenantResolver';
import { automationEngine } from '../services/automationEngine';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// ---------- Meta verification handshake (GET) ----------
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).end();
});

// ---------- Inbound WhatsApp event (POST) ----------
router.post('/whatsapp', async (req: Request, res: Response) => {
  // We need the raw body to verify the X-Hub-Signature-256 header. The
  // mounted JSON parser stores it on `req.rawBody` (see server/index.ts).
  const raw = (req as any).rawBody as Buffer | undefined;
  const sig = req.header('x-hub-signature-256');
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  const valid = appSecret ? verifyMetaSignature(raw ?? '', sig, appSecret) : true;

  const eventDoc = adminDb.collection('webhook_events').doc();
  await eventDoc.set({
    source: 'whatsapp',
    type: 'message_event',
    payload: req.body ?? {},
    signatureValid: valid,
    receivedAt: ServerTimestamp(),
  });

  if (!valid) {
    await eventDoc.update({ error: 'signature_invalid', processedAt: ServerTimestamp() });
    return res.status(401).json({ error: 'Invalid signature.' });
  }

  // Acknowledge immediately — Meta retries aggressively on slow responses.
  res.status(200).json({ ok: true });

  // Process asynchronously.
  void processWhatsappEvent(eventDoc.id, req.body).catch((e) => {
    console.error('[webhooks.whatsapp] processing failed', e);
    eventDoc.update({ error: String(e?.message ?? e), processedAt: ServerTimestamp() });
  });
});

async function processWhatsappEvent(eventId: string, body: any): Promise<void> {
  const entries = body?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};
      const phoneNumberId = value?.metadata?.phone_number_id;
      const displayPhone = value?.metadata?.display_phone_number;
      const tenant = await resolveTenantByWhatsapp(phoneNumberId, displayPhone);
      if (!tenant) {
        console.warn('[webhooks.whatsapp] no tenant for phoneNumberId=%s', phoneNumberId);
        continue;
      }
      if (tenant.status !== 'active') continue;

      // Status updates (delivered/read).
      for (const status of value?.statuses ?? []) {
        // Status events are recorded but do not trigger automations; the
        // chat message document is updated by the dispatcher when n8n
        // reports the WhatsApp message id.
        await adminDb.doc(`webhook_events/${eventId}`).update({
          [`statusUpdates.${status.id}`]: status.status,
        });
      }

      // Inbound text/media messages.
      for (const msg of value?.messages ?? []) {
        const fromPhone = msg.from;
        const text = msg?.text?.body ?? msg?.button?.text ?? msg?.interactive?.body?.text ?? '';
        const contactName = value?.contacts?.[0]?.profile?.name ?? fromPhone;

        // Upsert contact + chat (chatId = contactId for 1:1 mapping).
        const contactsRef = adminDb.collection(`organizations/${tenant.orgId}/contacts`);
        const existingQ = await contactsRef.where('phone', '==', fromPhone).limit(1).get();
        let contactId: string;
        if (existingQ.empty) {
          const newRef = await contactsRef.add({
            orgId: tenant.orgId,
            name: contactName,
            phone: fromPhone,
            tags: [],
            source: 'whatsapp',
            metadata: {},
            createdAt: ServerTimestamp(),
            lastActivity: ServerTimestamp(),
          });
          contactId = newRef.id;
        } else {
          contactId = existingQ.docs[0].id;
          await existingQ.docs[0].ref.update({ lastActivity: ServerTimestamp() });
        }

        const chatRef = adminDb.doc(`organizations/${tenant.orgId}/chats/${contactId}`);
        await chatRef.set(
          {
            orgId: tenant.orgId,
            contactId,
            contactName,
            contactPhone: fromPhone,
            isAutomated: true,
            unreadCount: FieldValue.increment(1),
            lastMessagePreview: text.slice(0, 140),
            lastMessageAt: ServerTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        await chatRef.collection('messages').add({
          orgId: tenant.orgId,
          chatId: contactId,
          direction: 'inbound',
          body: text,
          status: 'delivered',
          sentBy: 'system',
          whatsappMessageId: msg.id,
          createdAt: ServerTimestamp(),
        });

        // Fire automations.
        const lower = text.toLowerCase().trim();
        await automationEngine.fanOut({
          orgId: tenant.orgId,
          triggerType: 'message_received',
          payload: { text, fromPhone, whatsappMessageId: msg.id },
          contactId,
        });

        // Keyword-match trigger uses the same payload but a different type.
        if (lower) {
          await automationEngine.fanOut({
            orgId: tenant.orgId,
            triggerType: 'keyword_match',
            payload: { text: lower, fromPhone, whatsappMessageId: msg.id },
            contactId,
          });
        }
      }
    }
  }
  await adminDb.doc(`webhook_events/${eventId}`).update({ processedAt: ServerTimestamp() });
}

// ---------- n8n callback (POST) ----------
router.post('/n8n', async (req: Request, res: Response) => {
  const raw = (req as any).rawBody as Buffer | undefined;
  const sig = req.header('x-wassel-signature');
  const secret = process.env.N8N_SIGNING_SECRET || '';
  const valid = secret ? verifyHmac(raw ?? '', sig, secret) : true;

  const eventDoc = adminDb.collection('webhook_events').doc();
  await eventDoc.set({
    source: 'n8n',
    type: req.body?.type ?? 'callback',
    orgId: req.body?.orgId ?? null,
    payload: req.body ?? {},
    signatureValid: valid,
    receivedAt: ServerTimestamp(),
  });

  if (!valid) {
    await eventDoc.update({ error: 'signature_invalid', processedAt: ServerTimestamp() });
    return res.status(401).json({ error: 'Invalid signature.' });
  }

  const { orgId, runId, status, error, steps, output, type, message } = req.body || {};
  try {
    if (type === 'run.completed' && orgId && runId) {
      await automationEngine.markRunCompleted(
        orgId,
        runId,
        status === 'success' ? 'success' : 'failed',
        { steps, error, output },
      );
    }
    // n8n-driven outbound message echo (so the dashboard sees it live).
    if (type === 'message.sent' && orgId && message?.chatId && message?.body) {
      const chatRef = adminDb.doc(`organizations/${orgId}/chats/${message.chatId}`);
      await chatRef.collection('messages').add({
        orgId,
        chatId: message.chatId,
        direction: 'outbound',
        body: message.body,
        status: 'sent',
        sentBy: 'automation',
        automationRunId: runId ?? null,
        whatsappMessageId: message.whatsappMessageId ?? null,
        createdAt: ServerTimestamp(),
      });
      await chatRef.update({
        lastMessagePreview: String(message.body).slice(0, 140),
        lastMessageAt: ServerTimestamp(),
      });
    }
    await eventDoc.update({ processedAt: ServerTimestamp() });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[webhooks.n8n] processing failed', e);
    await eventDoc.update({ error: String(e?.message ?? e), processedAt: ServerTimestamp() });
    res.status(500).json({ error: e?.message ?? 'Processing failed.' });
  }
});

export default router;
