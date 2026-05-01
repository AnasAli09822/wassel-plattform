// Client-side n8n dispatcher.
// IMPORTANT: the frontend does NOT call n8n directly — it asks the platform
// backend (`/api/automations/dispatch`) which validates auth, resolves tenant
// context, and forwards to n8n on the client's behalf. This keeps n8n URLs
// and credentials hidden from the browser.

import { auth } from '../firebaseConfig';

export interface DispatchPayload {
  orgId: string;
  triggerType: string;
  contactId?: string;
  payload: Record<string, unknown>;
  // Optional: target a specific automation. When omitted the backend will fan
  // out to every active automation matching `triggerType`.
  automationId?: string;
}

export interface DispatchResult {
  ok: boolean;
  runIds: string[];
  errors?: string[];
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function authHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in.');
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export const n8nDispatcher = {
  async dispatch(input: DispatchPayload): Promise<DispatchResult> {
    const res = await fetch(`${API_BASE}/automations/dispatch`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Dispatch failed (${res.status}): ${text}`);
    }
    return res.json();
  },

  async sendBroadcast(orgId: string, broadcastId: string): Promise<DispatchResult> {
    const res = await fetch(`${API_BASE}/broadcasts/${broadcastId}/send`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ orgId }),
    });
    if (!res.ok) throw new Error(`Broadcast send failed (${res.status})`);
    return res.json();
  },
};
