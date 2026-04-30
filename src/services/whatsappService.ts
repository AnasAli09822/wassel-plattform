import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Operation Types for error handling as per guidelines
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
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const whatsappService = {
  // Contacts
  subscribeToContacts: (callback: (contacts: any[]) => void) => {
    const q = query(collection(db, 'contacts'), orderBy('lastActivity', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(contacts);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contacts'));
  },

  addContact: async (contactData: any) => {
    try {
      return await addDoc(collection(db, 'contacts'), {
        ...contactData,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        tags: contactData.tags || []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contacts');
    }
  },

  // Broadcasts
  createBroadcast: async (broadcastData: any) => {
    try {
      return await addDoc(collection(db, 'broadcasts'), {
        ...broadcastData,
        status: 'draft',
        sentCount: 0,
        openCount: 0,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'broadcasts');
    }
  },

  subscribeToBroadcasts: (callback: (broadcasts: any[]) => void) => {
    const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const broadcasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(broadcasts);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'broadcasts'));
  },

  // Real-time Chat
  subscribeToMessages: (chatId: string, callback: (messages: any[]) => void) => {
    const path = `chats/${chatId}/messages`;
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    }, (error) => handleFirestoreError(error, OperationType.GET, path));
  },

  sendMessage: async (chatId: string, messageData: any) => {
    const path = `chats/${chatId}/messages`;
    try {
      await addDoc(collection(db, path), {
        ...messageData,
        status: 'sent',
        createdAt: serverTimestamp()
      });
      // Update last activity on contact
      await updateDoc(doc(db, 'contacts', chatId), {
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
