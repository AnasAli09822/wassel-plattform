import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where, increment, limit as fbLimit,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type {
  Automation, AutomationStep, AutomationStatus, AutomationRun, AutomationRunStatus,
} from '../../types/schema';

export interface AutomationInput {
  name: string;
  status?: AutomationStatus;
  steps?: AutomationStep[];
}

export const automationsService = {
  subscribe(orgId: string, cb: (automations: Automation[]) => void) {
    const path = paths.automations(orgId);
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Automation))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },

  async list(orgId: string): Promise<Automation[]> {
    const path = paths.automations(orgId);
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Automation));
    } catch (e) {
      logFirestoreError(e, OperationType.LIST, path);
    }
  },

  async listActiveByTrigger(orgId: string, triggerType: string): Promise<Automation[]> {
    const path = paths.automations(orgId);
    try {
      const snap = await getDocs(query(
        collection(db, path),
        where('status', '==', 'active'),
      ));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Automation))
        .filter((a) => a.steps?.[0]?.type === triggerType);
    } catch (e) {
      logFirestoreError(e, OperationType.LIST, path);
    }
  },

  async get(orgId: string, autoId: string): Promise<Automation | null> {
    const path = paths.automation(orgId, autoId);
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Automation) : null;
    } catch (e) {
      logFirestoreError(e, OperationType.GET, path);
    }
  },

  async create(orgId: string, input: AutomationInput): Promise<string> {
    const path = paths.automations(orgId);
    try {
      const ref = await addDoc(collection(db, path), {
        orgId,
        name: input.name,
        status: input.status ?? 'draft',
        steps: input.steps ?? [],
        metrics: { triggers: 0, completions: 0, failures: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (e) {
      logFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async update(orgId: string, autoId: string, patch: Partial<AutomationInput>): Promise<void> {
    const path = paths.automation(orgId, autoId);
    try {
      await updateDoc(doc(db, path), { ...patch, updatedAt: serverTimestamp() });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async setStatus(orgId: string, autoId: string, status: AutomationStatus): Promise<void> {
    return automationsService.update(orgId, autoId, { status });
  },

  async remove(orgId: string, autoId: string): Promise<void> {
    const path = paths.automation(orgId, autoId);
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      logFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async incrementMetric(
    orgId: string,
    autoId: string,
    field: 'triggers' | 'completions' | 'failures',
    by = 1,
  ): Promise<void> {
    const path = paths.automation(orgId, autoId);
    try {
      await updateDoc(doc(db, path), {
        [`metrics.${field}`]: increment(by),
        'metrics.lastRunAt': serverTimestamp(),
      });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  // ---------- Automation runs ----------

  async createRun(
    orgId: string,
    automationId: string,
    triggerType: string,
    triggerPayload: Record<string, unknown>,
    contactId?: string,
  ): Promise<string> {
    const path = paths.automationRuns(orgId);
    try {
      const ref = await addDoc(collection(db, path), {
        orgId,
        automationId,
        status: 'pending' as AutomationRunStatus,
        triggerType,
        triggerPayload,
        contactId: contactId ?? null,
        startedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (e) {
      logFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateRun(
    orgId: string,
    runId: string,
    patch: Partial<AutomationRun>,
  ): Promise<void> {
    const path = paths.automationRun(orgId, runId);
    try {
      await updateDoc(doc(db, path), patch as any);
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  subscribeRuns(orgId: string, automationId: string, cb: (runs: AutomationRun[]) => void) {
    const path = paths.automationRuns(orgId);
    const q = query(
      collection(db, path),
      where('automationId', '==', automationId),
      orderBy('startedAt', 'desc'),
      fbLimit(50),
    );
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AutomationRun))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },
};
