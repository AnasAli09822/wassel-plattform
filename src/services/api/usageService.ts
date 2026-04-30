import {
  doc, getDoc, increment, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type { UsageRecord } from '../../types/schema';

const DEFAULT_LIMITS: Record<string, number> = {
  free: 1_000,
  pro: 50_000,
  enterprise: 1_000_000,
};

const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export const usageService = {
  monthKey: currentMonth,

  async getCurrent(orgId: string, planId = 'free'): Promise<UsageRecord> {
    const month = currentMonth();
    const path = paths.usageRecord(orgId, month);
    try {
      const ref = doc(db, path);
      const snap = await getDoc(ref);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as UsageRecord;
      const initial: UsageRecord = {
        id: `${orgId}_${month}`,
        orgId,
        month,
        messagesSent: 0,
        contactsCreated: 0,
        automationsRun: 0,
        broadcastsSent: 0,
        limitMessages: DEFAULT_LIMITS[planId] ?? DEFAULT_LIMITS.free,
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, initial);
      return initial;
    } catch (e) {
      logFirestoreError(e, OperationType.GET, path);
    }
  },

  async bump(
    orgId: string,
    field: 'messagesSent' | 'contactsCreated' | 'automationsRun' | 'broadcastsSent',
    by = 1,
  ): Promise<void> {
    const month = currentMonth();
    const path = paths.usageRecord(orgId, month);
    try {
      await setDoc(
        doc(db, path),
        { orgId, month, [field]: increment(by), updatedAt: serverTimestamp() },
        { merge: true },
      );
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async hasQuota(orgId: string, planId = 'free'): Promise<boolean> {
    const u = await usageService.getCurrent(orgId, planId);
    return u.messagesSent < u.limitMessages;
  },

  async setPlanLimit(orgId: string, planId: string): Promise<void> {
    const month = currentMonth();
    const path = paths.usageRecord(orgId, month);
    try {
      await updateDoc(doc(db, path), {
        limitMessages: DEFAULT_LIMITS[planId] ?? DEFAULT_LIMITS.free,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },
};
