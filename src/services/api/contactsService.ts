import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where, limit as fbLimit,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type { Contact } from '../../types/schema';

export interface ContactInput {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export const contactsService = {
  subscribe(orgId: string, cb: (contacts: Contact[]) => void, opts?: { limit?: number }) {
    const path = paths.contacts(orgId);
    const ref = collection(db, path);
    const q = opts?.limit
      ? query(ref, orderBy('lastActivity', 'desc'), fbLimit(opts.limit))
      : query(ref, orderBy('lastActivity', 'desc'));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },

  async list(orgId: string): Promise<Contact[]> {
    const path = paths.contacts(orgId);
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('lastActivity', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact));
    } catch (e) {
      logFirestoreError(e, OperationType.LIST, path);
    }
  },

  async get(orgId: string, contactId: string): Promise<Contact | null> {
    const path = paths.contact(orgId, contactId);
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Contact) : null;
    } catch (e) {
      logFirestoreError(e, OperationType.GET, path);
    }
  },

  async findByPhone(orgId: string, phone: string): Promise<Contact | null> {
    const path = paths.contacts(orgId);
    try {
      const snap = await getDocs(
        query(collection(db, path), where('phone', '==', phone), fbLimit(1)),
      );
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Contact;
    } catch (e) {
      logFirestoreError(e, OperationType.LIST, path);
    }
  },

  async create(orgId: string, input: ContactInput): Promise<string> {
    const path = paths.contacts(orgId);
    try {
      const ref = await addDoc(collection(db, path), {
        orgId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? '',
        tags: input.tags ?? [],
        notes: input.notes ?? '',
        source: input.source ?? 'manual',
        metadata: input.metadata ?? {},
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      });
      return ref.id;
    } catch (e) {
      logFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async update(orgId: string, contactId: string, patch: Partial<ContactInput>): Promise<void> {
    const path = paths.contact(orgId, contactId);
    try {
      await updateDoc(doc(db, path), { ...patch, lastActivity: serverTimestamp() });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async remove(orgId: string, contactId: string): Promise<void> {
    const path = paths.contact(orgId, contactId);
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      logFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async addTag(orgId: string, contactId: string, tag: string): Promise<void> {
    const existing = await contactsService.get(orgId, contactId);
    if (!existing) return;
    const tags = Array.from(new Set([...(existing.tags ?? []), tag]));
    await contactsService.update(orgId, contactId, { tags });
  },
};
