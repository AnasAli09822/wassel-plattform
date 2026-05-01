import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { apiFetch } from './api/client';

// Operation Types for error handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    userId: auth.currentUser?.uid
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const authService = {
  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Explicitly set persistence to local
      await setPersistence(auth, browserLocalPersistence);
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await apiFetch<{ ok: boolean; profile: unknown }>('/auth/bootstrap', { method: 'POST' });
      return user;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  logout: () => signOut(auth),

  getUserProfile: async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
