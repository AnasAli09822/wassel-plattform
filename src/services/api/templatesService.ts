import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type { Template } from '../../types/schema';

export interface TemplateInput {
  name: string;
  category: Template['category'];
  language: string;
  body: string;
  variables?: string[];
}

export const templatesService = {
  subscribe(orgId: string, cb: (t: Template[]) => void) {
    const path = paths.templates(orgId);
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },

  async list(orgId: string): Promise<Template[]> {
    const path = paths.templates(orgId);
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
    } catch (e) {
      logFirestoreError(e, OperationType.LIST, path);
    }
  },

  async create(orgId: string, input: TemplateInput): Promise<string> {
    const path = paths.templates(orgId);
    try {
      const ref = await addDoc(collection(db, path), {
        orgId,
        name: input.name,
        category: input.category,
        language: input.language,
        body: input.body,
        variables: input.variables ?? [],
        metaApprovalStatus: 'draft',
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (e) {
      logFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async update(orgId: string, id: string, patch: Partial<TemplateInput>): Promise<void> {
    const path = paths.template(orgId, id);
    try {
      await updateDoc(doc(db, path), patch as any);
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async remove(orgId: string, id: string): Promise<void> {
    const path = paths.template(orgId, id);
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      logFirestoreError(e, OperationType.DELETE, path);
    }
  },
};
