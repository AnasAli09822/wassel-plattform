import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type { Organization } from '../../types/schema';
import { apiFetch } from './client';

export const organizationService = {
  async getCurrent(): Promise<{ org: Organization | null; usage: any; security: any }> {
    return apiFetch('/organizations/current');
  },

  async get(orgId: string): Promise<Organization | null> {
    const path = paths.organization(orgId);
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null;
    } catch (e) {
      logFirestoreError(e, OperationType.GET, path);
    }
  },

  subscribe(orgId: string, cb: (org: Organization | null) => void) {
    const path = paths.organization(orgId);
    return onSnapshot(
      doc(db, path),
      (snap) => cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null),
      (e) => logFirestoreError(e, OperationType.GET, path),
    );
  },

  async update(orgId: string, patch: Partial<Organization>): Promise<void> {
    const path = paths.organization(orgId);
    // Defensive: never let a client-side caller overwrite ownership / status fields directly.
    const { ownerId: _o, status: _s, whatsappAccessTokenRef: _t, ...safe } = patch as any;
    try {
      await updateDoc(doc(db, path), { ...safe, updatedAt: serverTimestamp() });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async updateCurrent(patch: Partial<Organization>): Promise<{ ok: boolean; org: Organization }> {
    return apiFetch('/organizations/current', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },
};
