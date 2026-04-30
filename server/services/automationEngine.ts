// Automation engine — server-side orchestrator.
//
// Responsibilities:
//   1. For a given tenant + trigger, find every active automation whose first
//      step matches the trigger.
//   2. Build the execution context (tenant settings, AI persona, active
//      promos, contact data) and dispatch a webhook to the n8n master
//      workflow.
//   3. Persist a run record (`/organizations/{orgId}/automation_runs/...`)
//      and update aggregate metrics on the automation document.
//
// n8n executes the actual steps. When n8n finishes it calls back into our
// /api/webhooks/n8n endpoint which calls `markRunCompleted` below.

import { adminDb, ServerTimestamp } from '../firebaseAdmin';
import { n8nClient } from './n8nClient';
import { resolveTenantByWhatsapp } from './tenantResolver';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export type TriggerType =
  | 'contact_created'
  | 'message_received'
  | 'keyword_match'
  | 'tag_added'
  | 'broadcast_sent'
  | 'webhook'
  | 'time_schedule';

export interface TriggerInput {
  orgId: string;
  triggerType: TriggerType | string;
  payload: Record<string, unknown>;
  contactId?: string;
  // Restricts dispatch to a single automation; otherwise all matching active
  // automations are fanned out.
  automationId?: string;
}

export interface DispatchSummary {
  ok: boolean;
  runIds: string[];
  errors: string[];
}

async function listMatchingAutomations(
  orgId: string,
  triggerType: string,
  automationId?: string,
) {
  if (automationId) {
    const snap = await adminDb.doc(`organizations/${orgId}/automations/${automationId}`).get();
    return snap.exists ? [{ id: snap.id, ...(snap.data() as any) }] : [];
  }
  const snap = await adminDb
    .collection(`organizations/${orgId}/automations`)
    .where('status', '==', 'active')
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((a: any) => a.steps?.[0]?.type === triggerType
      || a.steps?.[0]?.config?.event === triggerType);
}

async function loadTenantContext(orgId: string) {
  const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
  const org: any = orgSnap.exists ? orgSnap.data() : {};
  return {
    orgId,
    orgName: org?.name,
    planId: org?.planId ?? 'free',
    status: org?.status ?? 'active',
    whatsapp: {
      number: org?.whatsappNumber,
      phoneNumberId: org?.whatsappPhoneNumberId,
      // We pass a *reference* to the access token. n8n resolves it from the
      // shared vault — the raw token never travels in webhook bodies.
      accessTokenRef: org?.whatsappAccessTokenRef ?? null,
    },
    n8nWebhookOverride: org?.n8nWebhookOverride ?? null,
  };
}

async function loadContact(orgId: string, contactId?: string) {
  if (!contactId) return null;
  const snap = await adminDb.doc(`organizations/${orgId}/contacts/${contactId}`).get();
  return snap.exists ? { id: snap.id, ...(snap.data() as any) } : null;
}

export const automationEngine = {
  resolveTenantByWhatsapp,

  async fanOut(input: TriggerInput): Promise<DispatchSummary> {
    const summary: DispatchSummary = { ok: true, runIds: [], errors: [] };
    const matches = await listMatchingAutomations(
      input.orgId,
      input.triggerType,
      input.automationId,
    );
    if (matches.length === 0) return summary;

    const [tenantCtx, contact] = await Promise.all([
      loadTenantContext(input.orgId),
      loadContact(input.orgId, input.contactId),
    ]);

    for (const auto of matches) {
      if (auto.status !== 'active' && !input.automationId) continue;

      const idempotencyKey = crypto.randomUUID();
      const runRef = adminDb.collection(
        `organizations/${input.orgId}/automation_runs`,
      ).doc();

      try {
        await runRef.set({
          orgId: input.orgId,
          automationId: auto.id,
          status: 'running',
          triggerType: input.triggerType,
          triggerPayload: input.payload,
          contactId: input.contactId ?? null,
          idempotencyKey,
          startedAt: ServerTimestamp(),
        });

        await adminDb.doc(`organizations/${input.orgId}/automations/${auto.id}`).update({
          'metrics.triggers': FieldValue.increment(1),
          'metrics.lastRunAt': ServerTimestamp(),
        });

        const result = await n8nClient.dispatch({
          orgId: input.orgId,
          triggerType: input.triggerType,
          idempotencyKey,
          payload: input.payload,
          context: {
            tenant: tenantCtx,
            automation: {
              id: auto.id,
              name: auto.name,
              steps: auto.steps,
            },
            contact,
            runId: runRef.id,
          },
          webhookOverride: tenantCtx.n8nWebhookOverride || undefined,
        });

        if (!result.ok) {
          summary.errors.push(`automation:${auto.id} status:${result.status}`);
          await runRef.update({
            status: 'failed',
            error: `n8n dispatch failed: ${result.status}`,
            finishedAt: ServerTimestamp(),
          });
          await adminDb.doc(`organizations/${input.orgId}/automations/${auto.id}`).update({
            'metrics.failures': FieldValue.increment(1),
          });
          continue;
        }

        // The run stays "running" until n8n calls back. The /webhooks/n8n
        // route flips it to success/failed via `markRunCompleted`.
        summary.runIds.push(runRef.id);
      } catch (e: any) {
        summary.ok = false;
        summary.errors.push(`automation:${auto.id} error:${e?.message ?? e}`);
        await runRef.set(
          { status: 'failed', error: String(e?.message ?? e), finishedAt: ServerTimestamp() },
          { merge: true },
        );
      }
    }
    return summary;
  },

  async markRunCompleted(
    orgId: string,
    runId: string,
    outcome: 'success' | 'failed',
    details?: { steps?: unknown[]; error?: string; output?: unknown },
  ): Promise<void> {
    const runRef = adminDb.doc(`organizations/${orgId}/automation_runs/${runId}`);
    const runSnap = await runRef.get();
    if (!runSnap.exists) return;
    const run = runSnap.data() as any;

    await runRef.update({
      status: outcome,
      finishedAt: ServerTimestamp(),
      ...(details?.steps ? { steps: details.steps } : {}),
      ...(details?.error ? { error: details.error } : {}),
      ...(details?.output ? { output: details.output } : {}),
    });

    if (run?.automationId) {
      await adminDb.doc(`organizations/${orgId}/automations/${run.automationId}`).update({
        [`metrics.${outcome === 'success' ? 'completions' : 'failures'}`]: FieldValue.increment(1),
      });
    }
  },
};
