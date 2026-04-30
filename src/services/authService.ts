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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
      
      // Sync user profile to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      let userDoc;
      
      try {
        userDoc = await getDoc(userDocRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
      
      if (!userDoc?.exists()) {
        try {
          const orgId = user.uid; // Org Id logic
          const profile = {
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || '',
            role: 'owner',
            orgId: orgId,
            createdAt: new Date().toISOString(),
            isSuperAdmin: user.email === 'alhajans664@gmail.com'
          };
          await setDoc(userDocRef, profile);
          
          // Also create default organization
          const orgRef = doc(db, 'organizations', orgId);
          await setDoc(orgRef, {
            id: orgId,
            name: user.displayName ? `${user.displayName}'s Org` : 'My Organization',
            ownerId: user.uid,
            planId: 'free',
            status: 'active',
            whatsappConnected: false,
            createdAt: new Date().toISOString()
          });

          return user;
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      
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
