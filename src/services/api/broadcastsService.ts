import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type { Broadcast, BroadcastStatus } from '../../types/schema';

export interface BroadcastInput {
  name: string;
  message: string;
  templateId?: string;
  audienceTagFilter?: string[];
  audienceContactIds?: string[];
  scheduledAt?: string;
}

export const broadcastsService = {
  subscribe(orgId: string, cb: (b: Broadcast[]) => void) {
    const path = paths.broadcasts(orgId);
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Broadcast))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },

  async list(orgId: string): Promise<Broadcast[]> {
    const path = paths.broadcasts(orgId);
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Broadcast));
    } catch (e) {
      logFirestoreError(e, OperationType.LIST, path);
    }
  },

  async get(orgId: string, id: string): Promise<Broadcast | null> {
    const path = paths.broadcast(orgId, id);
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Broadcast) : null;
    } catch (e) {
      logFirestoreError(e, OperationType.GET, path);
    }
  },

  async create(orgId: string, input: BroadcastInput): Promise<string> {
    const path = paths.broadcasts(orgId);
    try {
      const ref = await addDoc(collection(db, path), {
        orgId,
        name: input.name,
        message: input.message,
        templateId: input.templateId ?? null,
        audienceTagFilter: input.audienceTagFilter ?? [],
        audienceContactIds: input.audienceContactIds ?? [],
        scheduledAt: input.scheduledAt ?? null,
        status: (input.scheduledAt ? 'scheduled' : 'draft') as BroadcastStatus,
        sentCount: 0,
        deliveredCount: 0,
        openCount: 0,
        failedCount: 0,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (e) {
      logFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async setStatus(orgId: string, id: string, status: BroadcastStatus): Promise<void> {
    const path = paths.broadcast(orgId, id);
    try {
      await updateDoc(doc(db, path), { status });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async remove(orgId: string, id: string): Promise<void> {
    const path = paths.broadcast(orgId, id);
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      logFirestoreError(e, OperationType.DELETE, path);
    }
  },
};
