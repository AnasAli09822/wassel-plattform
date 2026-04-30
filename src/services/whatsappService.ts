// Legacy facade kept for backwards compatibility with components that
// imported `whatsappService` directly. New code should import from
// `services/api/*` modules — they enforce tenant scoping at every call.

import { contactsService } from './api/contactsService';
import { broadcastsService } from './api/broadcastsService';
import { messagesService } from './api/messagesService';

export const whatsappService = {
  subscribeToContacts: (orgId: string, cb: (contacts: any[]) => void) =>
    contactsService.subscribe(orgId, cb),

  addContact: (orgId: string, contactData: any) =>
    contactsService.create(orgId, contactData),

  createBroadcast: (orgId: string, data: any) =>
    broadcastsService.create(orgId, data),

  subscribeToBroadcasts: (orgId: string, cb: (b: any[]) => void) =>
    broadcastsService.subscribe(orgId, cb),

  subscribeToMessages: (orgId: string, chatId: string, cb: (msgs: any[]) => void) =>
    messagesService.subscribeMessages(orgId, chatId, cb),

  sendMessage: (orgId: string, chatId: string, messageData: any) =>
    messagesService.appendMessage(orgId, chatId, 'outbound', messageData),
};
