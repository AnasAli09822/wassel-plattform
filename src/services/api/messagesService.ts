import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, increment, limit as fbLimit,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { paths } from '../firestorePaths';
import { logFirestoreError, OperationType } from '../errors';
import type { Chat, Message, MessageDirection, MessageStatus } from '../../types/schema';

export interface OutboundMessageInput {
  body: string;
  mediaUrl?: string;
  agentId?: string;
  automationRunId?: string;
  sentBy?: 'human' | 'automation' | 'system';
}

export const messagesService = {
  subscribeChats(orgId: string, cb: (chats: Chat[]) => void) {
    const path = paths.chats(orgId);
    const q = query(collection(db, path), orderBy('lastMessageAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },

  subscribeMessages(orgId: string, chatId: string, cb: (msgs: Message[]) => void, max = 200) {
    const path = paths.messages(orgId, chatId);
    const q = query(collection(db, path), orderBy('createdAt', 'asc'), fbLimit(max));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))),
      (e) => logFirestoreError(e, OperationType.LIST, path),
    );
  },

  async ensureChat(orgId: string, chat: Omit<Chat, 'createdAt' | 'lastMessageAt' | 'unreadCount'> & {
    unreadCount?: number;
  }): Promise<void> {
    const path = paths.chat(orgId, chat.id);
    try {
      const existing = await getDoc(doc(db, path));
      if (!existing.exists()) {
        await setDoc(doc(db, path), {
          orgId,
          contactId: chat.contactId,
          contactName: chat.contactName,
          contactPhone: chat.contactPhone,
          isAutomated: chat.isAutomated ?? false,
          assignedAgentId: chat.assignedAgentId ?? null,
          unreadCount: chat.unreadCount ?? 0,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
      }
    } catch (e) {
      logFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async appendMessage(
    orgId: string,
    chatId: string,
    direction: MessageDirection,
    payload: OutboundMessageInput,
    initialStatus: MessageStatus = direction === 'outbound' ? 'queued' : 'delivered',
  ): Promise<string> {
    const msgPath = paths.messages(orgId, chatId);
    const chatPath = paths.chat(orgId, chatId);
    try {
      const ref = await addDoc(collection(db, msgPath), {
        orgId,
        chatId,
        direction,
        body: payload.body,
        mediaUrl: payload.mediaUrl ?? null,
        status: initialStatus,
        sentBy: payload.sentBy ?? (direction === 'outbound' ? 'human' : 'system'),
        agentId: payload.agentId ?? null,
        automationRunId: payload.automationRunId ?? null,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, chatPath), {
        lastMessageAt: serverTimestamp(),
        lastMessagePreview: payload.body.slice(0, 140),
        ...(direction === 'inbound' ? { unreadCount: increment(1) } : {}),
      });
      return ref.id;
    } catch (e) {
      logFirestoreError(e, OperationType.WRITE, msgPath);
    }
  },

  async markStatus(
    orgId: string,
    chatId: string,
    messageId: string,
    status: MessageStatus,
    extra?: { whatsappMessageId?: string; errorReason?: string },
  ): Promise<void> {
    const path = paths.message(orgId, chatId, messageId);
    try {
      await updateDoc(doc(db, path), {
        status,
        ...(extra?.whatsappMessageId ? { whatsappMessageId: extra.whatsappMessageId } : {}),
        ...(extra?.errorReason ? { errorReason: extra.errorReason } : {}),
      });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async markRead(orgId: string, chatId: string): Promise<void> {
    const path = paths.chat(orgId, chatId);
    try {
      await updateDoc(doc(db, path), { unreadCount: 0 });
    } catch (e) {
      logFirestoreError(e, OperationType.UPDATE, path);
    }
  },
};
