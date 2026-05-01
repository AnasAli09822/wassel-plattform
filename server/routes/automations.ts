import { Router, Response } from 'express';
import { requireAuth, requireOrgScope, requireRole, AuthedRequest } from '../middleware/auth';
import { automationEngine } from '../services/automationEngine';
import { adminDb, ServerTimestamp } from '../firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Manually trigger an automation (or fan out to all matching active ones).
// Used by the dashboard UI to "test" an automation, and by the broadcast
// pipeline to enqueue per-contact runs.
router.post(
  '/dispatch',
  requireAuth,
  requireOrgScope,
  requireRole(['owner', 'admin']),
  async (req: AuthedRequest, res: Response) => {
  const { triggerType, payload, contactId, automationId } = req.body || {};
  const orgId = (req as any).orgId as string;

  if (!triggerType || typeof triggerType !== 'string') {
    return res.status(400).json({ error: 'triggerType is required.' });
  }
  if (typeof payload !== 'object' || payload === null) {
    return res.status(400).json({ error: 'payload must be an object.' });
  }

  try {
    const summary = await automationEngine.fanOut({
      orgId,
      triggerType,
      payload,
      contactId,
      automationId,
    });
    res.json(summary);
  } catch (e: any) {
    console.error('[automations.dispatch]', e);
    res.status(500).json({ error: e?.message ?? 'Dispatch failed.' });
  }
});

// Send a broadcast: expand audience -> create runs for each recipient.
// Exposed via the broadcastsRouter; this handler is shared.
export const broadcastSendHandler = async (req: AuthedRequest, res: Response) => {
  const orgId = ((req as any).orgId as string) || req.auth!.orgId;
  const { broadcastId } = req.params;

  const bRef = adminDb.doc(`organizations/${orgId}/broadcasts/${broadcastId}`);
  const bSnap = await bRef.get();
  if (!bSnap.exists) return res.status(404).json({ error: 'Broadcast not found.' });
  const broadcast: any = bSnap.data();

  // Resolve audience.
  let contacts: Array<{ id: string; phone: string; name: string }> = [];
  if (Array.isArray(broadcast.audienceContactIds) && broadcast.audienceContactIds.length) {
    const reads = await Promise.all(
      broadcast.audienceContactIds.map((id: string) =>
        adminDb.doc(`organizations/${orgId}/contacts/${id}`).get()),
    );
    contacts = reads
      .filter((s) => s.exists)
      .map((s) => ({ id: s.id, ...(s.data() as any) }));
  } else if (Array.isArray(broadcast.audienceTagFilter) && broadcast.audienceTagFilter.length) {
    const snap = await adminDb
      .collection(`organizations/${orgId}/contacts`)
      .where('tags', 'array-contains-any', broadcast.audienceTagFilter)
      .get();
    contacts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } else {
    const snap = await adminDb.collection(`organizations/${orgId}/contacts`).get();
    contacts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  await bRef.update({
    status: 'sending',
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    startedAt: ServerTimestamp(),
  });

  // Fan-out as `broadcast_sent` triggers — one run per contact. Caps the
  // concurrency so we don't exhaust n8n.
  const CONCURRENCY = Number(process.env.BROADCAST_CONCURRENCY || 10);
  const errors: string[] = [];
  let sent = 0;

  for (let i = 0; i < contacts.length; i += CONCURRENCY) {
    const slice = contacts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      slice.map((c) =>
        automationEngine.fanOut({
          orgId,
          triggerType: 'broadcast_sent',
          payload: { broadcastId, message: broadcast.message, templateId: broadcast.templateId },
          contactId: c.id,
        }).catch((e: any) => ({ ok: false, runIds: [], errors: [e?.message ?? String(e)] })),
      ),
    );
    for (const r of results) {
      if (r.ok) sent += 1; else errors.push(...r.errors);
    }
    await bRef.update({
      sentCount: FieldValue.increment(slice.length),
    });
  }

  await bRef.update({
    status: errors.length === contacts.length ? 'failed' : 'sent',
    failedCount: errors.length,
    finishedAt: ServerTimestamp(),
  });

  res.json({ ok: true, totalContacts: contacts.length, ok_runs: sent, errors });
};

export default router;
