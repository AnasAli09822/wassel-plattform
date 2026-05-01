// n8n master-workflow webhook client. Tenants never see n8n; the platform
// fires a webhook with the tenant context and lets n8n's master workflow
// handle the heavy lifting (LLM calls, branching logic, WhatsApp send).
//
// Each call is signed with HMAC-SHA256 over the JSON body so n8n can
// validate authenticity (`X-Wassel-Signature` header).

import crypto from 'crypto';

export interface N8nDispatchInput {
  orgId: string;
  triggerType: string;
  payload: Record<string, unknown>;
  context: Record<string, unknown>;
  // Idempotency key — n8n master workflow should de-duplicate.
  idempotencyKey: string;
  // Optional per-tenant override (for enterprise plans with their own n8n).
  webhookOverride?: string;
}

export interface N8nDispatchResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export class N8nClient {
  private masterUrl: string;
  private signingSecret: string;
  private timeoutMs: number;

  constructor(opts: { masterUrl?: string; signingSecret?: string; timeoutMs?: number } = {}) {
    this.masterUrl = opts.masterUrl ?? process.env.N8N_MASTER_WEBHOOK_URL ?? '';
    this.signingSecret = opts.signingSecret ?? process.env.N8N_SIGNING_SECRET ?? '';
    this.timeoutMs = opts.timeoutMs ?? Number(process.env.N8N_TIMEOUT_MS ?? 15_000);
  }

  private sign(body: string): string {
    if (!this.signingSecret) return '';
    return crypto.createHmac('sha256', this.signingSecret).update(body).digest('hex');
  }

  async dispatch(input: N8nDispatchInput): Promise<N8nDispatchResult> {
    const url = input.webhookOverride || this.masterUrl;
    if (!url) {
      throw new Error('No n8n webhook URL configured (N8N_MASTER_WEBHOOK_URL).');
    }
    const body = JSON.stringify({
      version: 1,
      orgId: input.orgId,
      triggerType: input.triggerType,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
      context: input.context,
      dispatchedAt: new Date().toISOString(),
    });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wassel-Signature': this.sign(body),
          'X-Wassel-OrgId': input.orgId,
          'X-Wassel-Idempotency-Key': input.idempotencyKey,
        },
        body,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
      return { ok: res.ok, status: res.status, body: parsed };
    } finally {
      clearTimeout(t);
    }
  }
}

export const n8nClient = new N8nClient();
