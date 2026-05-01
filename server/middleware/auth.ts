import type { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from '../firebaseAdmin';

export interface AuthedRequest extends Request {
  auth?: {
    uid: string;
    email?: string;
    orgId: string;
    role: 'owner' | 'admin' | 'agent';
    isSuperAdmin: boolean;
  };
}

// Verifies the Firebase ID token, loads the user profile, and attaches the
// resolved tenant context to the request. Requests without a valid token are
// rejected with 401; requests for users without an orgId get 403.
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.header('authorization') || '';
    const match = /^Bearer\s+(.+)$/.exec(header);
    if (!match) return res.status(401).json({ error: 'Missing bearer token.' });

    const decoded = await adminAuth.verifyIdToken(match[1]);
    const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    if (!userSnap.exists) {
      return res.status(403).json({ error: 'User profile not found.' });
    }
    const profile = userSnap.data() as any;
    if (!profile.orgId) {
      return res.status(403).json({ error: 'User has no tenant.' });
    }
    req.auth = {
      uid: decoded.uid,
      email: decoded.email,
      orgId: profile.orgId,
      role: profile.role || 'agent',
      isSuperAdmin: !!profile.isSuperAdmin,
    };
    next();
  } catch (e) {
    console.error('[auth] token verify failed', e);
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// Confirms that a body or param `orgId` matches the auth context. Super
// Admins may operate cross-tenant. This is the contract that prevents
// `?orgId=victim_org` smuggling.
export function requireOrgScope(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'Unauthenticated.' });
  const target = (req.body?.orgId || req.params?.orgId || req.query?.orgId) as string | undefined;
  if (!target) return res.status(400).json({ error: 'orgId is required.' });
  if (target !== req.auth.orgId && !req.auth.isSuperAdmin) {
    return res.status(403).json({ error: 'Cross-tenant access denied.' });
  }
  (req as any).orgId = target;
  next();
}

export function requireRole(roles: Array<'owner' | 'admin' | 'agent'>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'Unauthenticated.' });
    if (req.auth.isSuperAdmin) return next();
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Insufficient role.' });
    }
    next();
  };
}
