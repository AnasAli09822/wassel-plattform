import { Router, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, ServerTimestamp } from '../firebaseAdmin';
import { AuthedRequest, requireAuth, resolveTargetOrgId } from '../middleware/auth';

const router = Router();

function canManageTeam(req: AuthedRequest) {
  return req.auth?.isSuperAdmin || req.auth?.role === 'owner' || req.auth?.role === 'admin';
}

function canDeleteMember(req: AuthedRequest) {
  return req.auth?.isSuperAdmin || req.auth?.role === 'owner';
}

function ensureOrgAccess(req: AuthedRequest, orgId: string) {
  return req.auth?.isSuperAdmin || req.auth?.orgId === orgId;
}

router.get('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = resolveTargetOrgId(req);
    if (!orgId || !ensureOrgAccess(req, orgId)) {
      return res.status(403).json({ error: 'Cross-tenant access denied.' });
    }

    const [usersSnap, invitesSnap] = await Promise.all([
      adminDb.collection('users').where('orgId', '==', orgId).get(),
      adminDb.collection(`organizations/${orgId}/invitations`).orderBy('createdAt', 'desc').get(),
    ]);

    res.json({
      ok: true,
      users: usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      invitations: invitesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error: any) {
    console.error('[team.list] failed', error);
    res.status(500).json({ error: error?.message || 'Failed to load team.' });
  }
});

router.post('/invitations', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = resolveTargetOrgId(req);
    if (!orgId || !ensureOrgAccess(req, orgId)) {
      return res.status(403).json({ error: 'Cross-tenant access denied.' });
    }
    if (!canManageTeam(req)) {
      return res.status(403).json({ error: 'Insufficient role.' });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const role = String(req.body?.role || 'agent');
    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    if (!['owner', 'admin', 'agent'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (role === 'owner' && !(req.auth?.isSuperAdmin || req.auth?.role === 'owner')) {
      return res.status(403).json({ error: 'Only owners can invite another owner.' });
    }

    const existingUser = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUser.empty) {
      const user = existingUser.docs[0].data() as any;
      if (user.orgId === orgId) {
        return res.status(409).json({ error: 'User already belongs to this organization.' });
      }
    }

    const invitationRef = adminDb.collection(`organizations/${orgId}/invitations`).doc();
    await invitationRef.set({
      orgId,
      email,
      name,
      role,
      status: 'pending',
      createdByUid: req.auth!.uid,
      createdAt: ServerTimestamp(),
      updatedAt: ServerTimestamp(),
    });

    res.status(201).json({ ok: true, invitationId: invitationRef.id });
  } catch (error: any) {
    console.error('[team.invite] failed', error);
    res.status(500).json({ error: error?.message || 'Failed to create invitation.' });
  }
});

router.patch('/members/:userId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = resolveTargetOrgId(req);
    if (!orgId || !ensureOrgAccess(req, orgId)) {
      return res.status(403).json({ error: 'Cross-tenant access denied.' });
    }
    if (!canManageTeam(req)) {
      return res.status(403).json({ error: 'Insufficient role.' });
    }

    const userRef = adminDb.doc(`users/${req.params.userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const current = userSnap.data() as any;
    if (current.orgId !== orgId && !req.auth?.isSuperAdmin) {
      return res.status(403).json({ error: 'Cross-tenant access denied.' });
    }

    const nextRole = req.body?.role;
    if (nextRole === 'owner' && !(req.auth?.isSuperAdmin || req.auth?.role === 'owner')) {
      return res.status(403).json({ error: 'Only owners can assign owner role.' });
    }

    const patch: Record<string, unknown> = {
      updatedAt: ServerTimestamp(),
    };
    if (typeof req.body?.name === 'string' && req.body.name.trim()) patch.name = req.body.name.trim();
    if (typeof nextRole === 'string' && ['owner', 'admin', 'agent'].includes(nextRole)) patch.role = nextRole;

    await userRef.update(patch);
    res.json({ ok: true });
  } catch (error: any) {
    console.error('[team.member.update] failed', error);
    res.status(500).json({ error: error?.message || 'Failed to update member.' });
  }
});

router.delete('/members/:userId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = resolveTargetOrgId(req);
    if (!orgId || !ensureOrgAccess(req, orgId)) {
      return res.status(403).json({ error: 'Cross-tenant access denied.' });
    }
    if (!canDeleteMember(req)) {
      return res.status(403).json({ error: 'Insufficient role.' });
    }

    const userRef = adminDb.doc(`users/${req.params.userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const current = userSnap.data() as any;
    if (current.orgId !== orgId && !req.auth?.isSuperAdmin) {
      return res.status(403).json({ error: 'Cross-tenant access denied.' });
    }
    if (current.uid === req.auth?.uid) {
      return res.status(400).json({ error: 'You cannot delete your own membership.' });
    }

    await userRef.delete();
    await adminDb.doc(`organizations/${orgId}`).set(
      { updatedAt: ServerTimestamp(), memberCount: FieldValue.increment(-1) },
      { merge: true },
    );

    res.json({ ok: true });
  } catch (error: any) {
    console.error('[team.member.delete] failed', error);
    res.status(500).json({ error: error?.message || 'Failed to delete member.' });
  }
});

export default router;
