// Firebase Admin SDK bootstrap. The admin SDK bypasses Firestore security
// rules — keep its surface tightly scoped (used only by trusted server code).

import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function loadCredential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      const parsed = JSON.parse(inline);
      return cert(parsed);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
  }
  // GOOGLE_APPLICATION_CREDENTIALS path or workload identity (Cloud Run / GCE).
  return applicationDefault();
}

if (getApps().length === 0) {
  initializeApp({
    credential: loadCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore(
  process.env.FIRESTORE_DATABASE_ID || '(default)' as any,
);

export const ServerTimestamp = () =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('firebase-admin/firestore').FieldValue.serverTimestamp();
