# Wassel Platform Infrastructure

> البنية التحتية الكاملة لمنصة "وصل" — قواعد البيانات، الخادم الخلفي، تكامل n8n، ومحرك الأتمتة.

This document describes how data, security, and automation flow through the
platform end-to-end. It complements `docs/ARCHITECTURE.md` (high-level design)
with the concrete contracts the running code enforces.

---

## 1. High-level Topology

```
   ┌─────────────────────┐         ┌────────────────────────────┐
   │  React Dashboard    │ HTTPS   │  Backend (Express)         │
   │  (Vite, Firebase    │ ──────▶ │  • verifies Firebase ID    │
   │   ID token in       │         │    tokens                  │
   │   Authorization)    │         │  • resolves tenant (orgId) │
   └─────────────────────┘         │  • dispatches to n8n       │
            │                      │  • receives WA + n8n       │
            │ Firestore SDK         │    webhooks                │
            │ (tenant rules)       └────────────────────────────┘
            ▼                                 ▲           ▲
   ┌─────────────────────┐                    │           │
   │  Firestore          │◀───── Admin SDK ───┘           │
   │  (multi-tenant      │                                │
   │   per-org subtree)  │                                │
   └─────────────────────┘                                │
                                                          │
                            ┌──────────────────────┐      │
                            │  n8n Master          │◀─────┘
                            │  Workflow            │  HMAC-signed
                            │  (parameterized)     │  webhook
                            └──────────────────────┘
                                       │
                                       ▼
                        WhatsApp Cloud API · OpenAI · CRMs
```

Key principle: **the browser never talks to n8n, never sees an access token,
and cannot read another tenant's data.** All cross-tenant operations go
through the backend (with Admin SDK + auth checks) and Firestore rules deny
the rest.

---

## 2. Multi-Tenant Data Model (Firestore)

| Path                                                      | Owner        | Notes                                     |
|-----------------------------------------------------------|--------------|-------------------------------------------|
| `users/{uid}`                                             | self / admin | Profile + `orgId` + `role`                |
| `organizations/{orgId}`                                   | tenant owner | Plan, WhatsApp link, n8n override         |
| `organizations/{orgId}/contacts/{contactId}`              | tenant       | Tagged contact records                    |
| `organizations/{orgId}/chats/{chatId}`                    | tenant       | One chat per contact                      |
| `organizations/{orgId}/chats/{chatId}/messages/{msgId}`   | tenant       | Inbound + outbound messages               |
| `organizations/{orgId}/automations/{autoId}`              | tenant admin | Visual automation definitions             |
| `organizations/{orgId}/automation_runs/{runId}`           | server only  | Audit log of every dispatch               |
| `organizations/{orgId}/broadcasts/{bId}`                  | tenant admin | Broadcast definition + counters           |
| `organizations/{orgId}/templates/{tId}`                   | tenant admin | Meta-style message templates              |
| `usage_stats/{orgId_YYYY-MM}`                             | server only  | Quota counters                            |
| `system_integrations/{provider}`                          | super admin  | n8n / OpenAI / Stripe master config       |
| `webhook_events/{id}`                                     | server only  | Raw inbound audit trail                   |

Every operational record carries a top-level `orgId` field. The Firestore
rules at the leaf collections enforce two checks at write time:

1. The caller `belongsToOrg(orgId)` (via the user's profile).
2. `request.resource.data.orgId == orgId` — the document is *tenant-stamped*.

These together make it impossible to write a doc that escapes its tenant
subtree, even if a malicious client forges payloads.

The path layout is centralized in `src/services/firestorePaths.ts`. Components
must use those helpers — never raw string interpolation.

---

## 3. Security Rules (`firestore.rules`)

Highlights of the contract:

- Default-deny catch-all at the bottom.
- `users` are readable only by themselves or super admins. Updates limit
  the diff to `name`, `photoURL`, `orgId`. `role` and `isSuperAdmin` can be
  changed only by a super admin (or, in code, by the Admin SDK).
- `organizations/{orgId}` updates exclude `status` and
  `whatsappAccessTokenRef` for clients — both are owned by the backend.
- `automation_runs` and `usage_stats` are write-locked from clients
  entirely; they're populated by the Admin SDK to preserve the audit trail.
- `system_integrations` and `webhook_events` are super-admin / server only.

Deploy them with:

```bash
firebase deploy --only firestore:rules
```

---

## 4. Backend Service (`server/`)

```
server/
├── index.ts              ← Express bootstrap, CORS, rate limiter
├── firebaseAdmin.ts      ← Admin SDK init (service-account or ADC)
├── middleware/
│   └── auth.ts           ← requireAuth, requireOrgScope, requireRole
├── routes/
│   ├── health.ts         ← GET /api/health
│   ├── webhooks.ts       ← /api/webhooks/whatsapp, /api/webhooks/n8n
│   ├── automations.ts    ← POST /api/automations/dispatch
│   └── broadcasts.ts     ← POST /api/broadcasts/:id/send
├── services/
│   ├── tenantResolver.ts ← phone-number-id → orgId (cached)
│   ├── n8nClient.ts      ← signed webhook out to n8n master
│   ├── automationEngine.ts ← fan-out + run lifecycle
│   └── whatsappSender.ts ← Cloud API send (used outside n8n)
├── utils/
│   └── crypto.ts         ← HMAC verify + AES-256-GCM at rest
└── tsconfig.json
```

### Auth contract

Every privileged route uses `requireAuth`:

1. Extracts `Bearer <ID token>`, verifies via Admin SDK.
2. Loads `users/{uid}` to read `orgId`, `role`, `isSuperAdmin`.
3. Stuffs the result onto `req.auth`.

`requireOrgScope` then asserts the caller's `orgId` matches the body /
params / query value (super admins bypass). This is the line of defense
against "smuggled orgId" attacks like `POST … {orgId: "victim"}`.

### Run it locally

```bash
cp .env.example .env          # fill in the secrets
npm install                   # adds firebase-admin
npm run dev                   # Vite dashboard on :3000
npm run dev:server            # Express backend on :8787
```

---

## 5. Inbound WhatsApp Flow

```
Meta Cloud API
   │  POST /api/webhooks/whatsapp
   ▼
verifyMetaSignature(rawBody, x-hub-signature-256, WHATSAPP_APP_SECRET)
   │
   ├── persist raw event → /webhook_events/{id}
   ├── 200 OK back to Meta (≤5s SLA)
   └── async: per "change":
        ├── tenant = resolveTenantByWhatsapp(phone_number_id)
        ├── upsert /organizations/{orgId}/contacts (by phone)
        ├── append /organizations/{orgId}/chats/{contactId}/messages (inbound)
        └── automationEngine.fanOut("message_received") + ("keyword_match")
```

Notes:

- The handler captures the raw body (`req.rawBody`) so the HMAC signature is
  verified against the exact bytes Meta sent.
- Tenant resolution is cached for 60s per phone-number-id.
- Suspended tenants (`status !== 'active'`) are skipped silently — the audit
  trail stays in `webhook_events` for super admins.

---

## 6. Outbound: Automation Engine + n8n

`server/services/automationEngine.ts` is the orchestrator. The flow:

```
fanOut({ orgId, triggerType, payload, contactId })
   │
   ├── list active automations whose first step matches `triggerType`
   ├── load tenant context (org, plan, whatsapp ref, n8n override)
   ├── load contact (optional)
   │
   └── for each automation:
        ├── create /organizations/{orgId}/automation_runs/{runId}
        │       (status=running, idempotencyKey, triggerPayload)
        ├── increment automation.metrics.triggers
        └── n8nClient.dispatch({
              orgId, triggerType, idempotencyKey,
              payload, context: { tenant, automation, contact, runId }
            })
              POST → N8N_MASTER_WEBHOOK_URL
              Headers:
                X-Wassel-Signature: HMAC-SHA256(body, N8N_SIGNING_SECRET)
                X-Wassel-OrgId: <orgId>
                X-Wassel-Idempotency-Key: <uuid>
```

When n8n finishes a run it calls back into us:

```
POST /api/webhooks/n8n
{
  "type": "run.completed",
  "orgId": "...",
  "runId": "...",
  "status": "success" | "failed",
  "steps": [...],
  "error": "..."
}
```

`automationEngine.markRunCompleted` then:

1. Updates the run document with `finishedAt`, `status`, optional steps/output.
2. Increments `automation.metrics.completions` or `metrics.failures`.

n8n can also push outbound chat messages it sent on the tenant's behalf
(`type: "message.sent"`) so the dashboard sees them live in the inbox.

### Trigger taxonomy

| Trigger              | Source                              | Payload essentials                |
|----------------------|-------------------------------------|-----------------------------------|
| `contact_created`    | dashboard manual / import           | `{contact}`                       |
| `message_received`   | inbound WA webhook                  | `{text, fromPhone, waMessageId}`  |
| `keyword_match`      | inbound WA webhook (lower-cased)    | `{text, fromPhone, waMessageId}`  |
| `tag_added`          | contacts service `addTag`           | `{tag, contactId}`                |
| `broadcast_sent`     | broadcast pipeline (one per contact)| `{broadcastId, message}`          |
| `webhook`            | external webhook hitting n8n master | arbitrary                         |
| `time_schedule`      | scheduled job (cron)                | `{schedule, now}`                 |

The first step of every automation declares its trigger via
`steps[0].type` (or `steps[0].config.event`), and the engine matches on
either form for backwards compatibility with the existing UI.

### Idempotency

Each dispatch carries a UUID in `X-Wassel-Idempotency-Key`. The n8n master
workflow should de-duplicate retries by storing the keys for ~24h.

---

## 7. Broadcasts

`POST /api/broadcasts/:broadcastId/send`:

1. Resolves the audience from `audienceContactIds` (explicit list),
   `audienceTagFilter` (tag intersection), or every contact in the tenant.
2. Sets the broadcast to `sending`.
3. In batches of `BROADCAST_CONCURRENCY` (default 10), fans out per-contact
   `broadcast_sent` triggers into the automation engine.
4. Updates `sentCount` / `failedCount` per batch and finalizes the status.

Because every per-contact dispatch flows through the same automation engine,
the existing run logging, metrics, and n8n callback handling are reused.

---

## 8. Secrets & Encryption

WhatsApp access tokens, refresh tokens, and similar high-impact secrets are
stored encrypted at rest:

- `SECRETS_ENCRYPTION_KEY`: 32 bytes base64-encoded
  (`openssl rand -base64 32`).
- `server/utils/crypto.ts` exposes `encryptSecret` / `decryptSecret`
  (AES-256-GCM with random IV + auth tag).
- The reference (encrypted blob) is stored under
  `organizations/{orgId}.whatsappAccessTokenRef`. Firestore rules forbid
  client updates to that field; only the backend may write it.

For production deployments prefer GCP Secret Manager or AWS Secrets Manager
and store only the secret *name* in Firestore.

---

## 9. Quotas & Usage

`src/services/api/usageService.ts` and `usage_stats/{orgId_YYYY-MM}` track
per-tenant consumption (messages, contacts, automation runs, broadcasts).
Default plan limits are encoded in the service (`free`, `pro`, `enterprise`)
and can be overridden per-tenant by the backend. Quota counters are write-
locked from the dashboard — they're owned by the backend (see rules).

---

## 10. Observability

- Every webhook lands in `/webhook_events/{id}` with `signatureValid`,
  `receivedAt`, `processedAt`, and any `error`.
- Every automation dispatch lands in `/organizations/{orgId}/automation_runs/{id}`
  with the trigger payload + final outcome.
- Aggregate counters live on the automation document
  (`metrics.triggers / completions / failures / lastRunAt`).

A super admin can read everything; tenant users can read their own
subtree and not the global `webhook_events` audit log.

---

## 11. Deployment Checklist

1. `npm install` — pulls `firebase-admin` and the existing deps.
2. Provision a Firebase service account, set
   `GOOGLE_APPLICATION_CREDENTIALS` (file) **or** paste JSON into
   `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. Generate `SECRETS_ENCRYPTION_KEY` and `N8N_SIGNING_SECRET`
   (`openssl rand -base64 32`).
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`.
5. Deploy the backend (Cloud Run / Render / Fly.io). Expose
   `https://<host>/api/webhooks/whatsapp` to Meta and
   `https://<host>/api/webhooks/n8n` to n8n.
6. In the n8n master workflow:
   - Add a webhook node listening on `N8N_MASTER_WEBHOOK_URL`.
   - Verify `X-Wassel-Signature` against `N8N_SIGNING_SECRET`.
   - Read `orgId`, `triggerType`, `context.tenant`, `context.automation`.
   - Resolve the WhatsApp access token from your shared vault by
     `context.tenant.whatsapp.accessTokenRef`.
   - On completion, POST back to `https://<host>/api/webhooks/n8n` with
     `{type: "run.completed", orgId, runId, status, steps, error}`
     signed with the same secret.

This is the only place the platform's n8n credentials live; tenants never
need to know it exists.
