// Resolves the tenant (orgId) responsible for an incoming WhatsApp event.
// We look up the org by `whatsappPhoneNumberId` first (most precise) and
// fall back to `whatsappNumber`. Super Admin-managed integrations live in
// the `system_integrations` collection and are NOT tenant-scoped.

import { adminDb } from '../firebaseAdmin';

export interface ResolvedTenant {
  orgId: string;
  planId: string;
  status: string;
  whatsappNumber?: string;
  whatsappPhoneNumberId?: string;
  n8nWebhookOverride?: string;
  whatsappAccessTokenRef?: string;
}

const cache = new Map<string, { tenant: ResolvedTenant; expiresAt: number }>();
const TTL_MS = 60_000;

export async function resolveTenantByWhatsapp(
  phoneNumberId?: string,
  phoneNumber?: string,
): Promise<ResolvedTenant | null> {
  const cacheKey = phoneNumberId || phoneNumber || '';
  if (!cacheKey) return null;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.tenant;

  let snap = phoneNumberId
    ? await adminDb.collection('organizations')
        .where('whatsappPhoneNumberId', '==', phoneNumberId).limit(1).get()
    : null;

  if ((!snap || snap.empty) && phoneNumber) {
    snap = await adminDb.collection('organizations')
      .where('whatsappNumber', '==', phoneNumber).limit(1).get();
  }
  if (!snap || snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  const tenant: ResolvedTenant = {
    orgId: doc.id,
    planId: data.planId || 'free',
    status: data.status || 'active',
    whatsappNumber: data.whatsappNumber,
    whatsappPhoneNumberId: data.whatsappPhoneNumberId,
    n8nWebhookOverride: data.n8nWebhookOverride,
    whatsappAccessTokenRef: data.whatsappAccessTokenRef,
  };
  cache.set(cacheKey, { tenant, expiresAt: Date.now() + TTL_MS });
  return tenant;
}

export function invalidateTenantCache() {
  cache.clear();
}
