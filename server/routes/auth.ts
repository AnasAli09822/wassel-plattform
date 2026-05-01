import { Router, Request, Response } from 'express';
import { adminDb, ServerTimestamp } from '../firebaseAdmin';
import { verifyBearerToken } from '../middleware/auth';

const router = Router();

function superAdminEmails(): Set<string> {
  return new Set(
    (process.env.PLATFORM_SUPERADMINS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function findPendingInvitation(email: string) {
  const snap = await adminDb
    .collectionGroup('invitations')
    .where('email', '==', email.toLowerCase())
    .where('status', '==', 'pending')
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

router.post('/bootstrap', async (req: Request, res: Response) => {
  try {
    const decoded = await verifyBearerToken(req);
    const email = (decoded.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Authenticated email is required.' });
    }

    const isSuperAdmin = superAdminEmails().has(email);
    const userRef = adminDb.doc(`users/${decoded.uid}`);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      const current = existingUser.data() as any;
      const patch: Record<string, unknown> = {};
      if (current.email !== email) patch.email = email;
      if ((current.name || '') !== (decoded.name || '')) patch.name = decoded.name || current.name || 'User';
      if ((current.photoURL || '') !== (decoded.picture || '')) patch.photoURL = decoded.picture || current.photoURL || '';
      if (!!current.isSuperAdmin !== isSuperAdmin) patch.isSuperAdmin = isSuperAdmin;
      if (Object.keys(patch).length > 0) {
        patch.updatedAt = ServerTimestamp();
        await userRef.update(patch);
      }
      const refreshed = await userRef.get();
      return res.json({ ok: true, profile: refreshed.data() });
    }

    const invitation = await findPendingInvitation(email);
    const invited = invitation?.data() as any | undefined;
    const orgId = invited?.orgId || decoded.uid;
    const role = invited?.role || 'owner';
    const profile = {
      uid: decoded.uid,
      name: decoded.name || invited?.name || 'User',
      email,
      photoURL: decoded.picture || '',
      role,
      orgId,
      isSuperAdmin,
      twoFactorEnabled: false,
      createdAt: ServerTimestamp(),
      updatedAt: ServerTimestamp(),
    };

    await userRef.set(profile);

    if (invitation) {
      await invitation.ref.update({
        status: 'accepted',
        acceptedByUid: decoded.uid,
        acceptedAt: ServerTimestamp(),
      });
    } else {
      const orgRef = adminDb.doc(`organizations/${orgId}`);
      const orgSnap = await orgRef.get();
      if (!orgSnap.exists) {
        await orgRef.set({
          id: orgId,
          name: decoded.name ? `${decoded.name}'s Org` : 'My Organization',
          ownerId: decoded.uid,
          planId: 'free',
          status: 'active',
          whatsappConnected: false,
          createdAt: ServerTimestamp(),
          updatedAt: ServerTimestamp(),
        });
      }
    }

    res.json({ ok: true, profile });
  } catch (error: any) {
    console.error('[auth.bootstrap] failed', error);
    res.status(401).json({ error: error?.message || 'Bootstrap failed.' });
  }
});

export default router;
