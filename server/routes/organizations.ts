import { Router, Response } from 'express';
import { adminDb, ServerTimestamp } from '../firebaseAdmin';
import { AuthedRequest, requireAuth } from '../middleware/auth';

const router = Router();

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

router.get('/current', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = req.auth!.orgId;
    const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
    const usageSnap = await adminDb.doc(`usage_stats/${orgId}_${monthKey()}`).get();
    const invitesSnap = await adminDb
      .collection(`organizations/${orgId}/invitations`)
      .where('status', '==', 'pending')
      .get();

    const org = orgSnap.exists ? { id: orgSnap.id, ...orgSnap.data() } : null;
    const usage = usageSnap.exists ? usageSnap.data() : null;
    const security = {
      twoFactorEnabled: !!(req.auth as any)?.twoFactorEnabled,
      pendingInvitations: invitesSnap.size,
      superAdminSession: req.auth!.isSuperAdmin,
      role: req.auth!.role,
    };

    res.json({ ok: true, org, usage, security });
  } catch (error: any) {
    console.error('[organizations.current] failed', error);
    res.status(500).json({ error: error?.message || 'Failed to load organization.' });
  }
});

router.patch('/current', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = req.auth!.orgId;
    const patch = req.body || {};
    const safePatch: Record<string, unknown> = {};

    if (typeof patch.name === 'string' && patch.name.trim()) {
      safePatch.name = patch.name.trim();
    }
    if (typeof patch.whatsappNumber === 'string') {
      safePatch.whatsappNumber = patch.whatsappNumber.trim();
      safePatch.whatsappConnected = !!patch.whatsappNumber.trim();
    }

    if (Object.keys(safePatch).length === 0) {
      return res.status(400).json({ error: 'No supported fields to update.' });
    }

    safePatch.updatedAt = ServerTimestamp();
    await adminDb.doc(`organizations/${orgId}`).set(safePatch, { merge: true });
    const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
    res.json({ ok: true, org: { id: orgSnap.id, ...orgSnap.data() } });
  } catch (error: any) {
    console.error('[organizations.current.patch] failed', error);
    res.status(500).json({ error: error?.message || 'Failed to update organization.' });
  }
});

export default router;
