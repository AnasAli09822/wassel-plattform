// Outbound WhatsApp Cloud API client used by the platform when n8n is not
// the right place to send (e.g. dashboard live-chat agent typing). For
// automation-driven sends, n8n itself calls the Cloud API directly.

import { decryptSecret } from '../utils/crypto';

export interface WhatsappSendInput {
  toPhoneNumber: string;
  body: string;
  phoneNumberId: string;
  encryptedAccessToken: string;
}

export async function sendWhatsappText({
  toPhoneNumber,
  body,
  phoneNumberId,
  encryptedAccessToken,
}: WhatsappSendInput): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const accessToken = decryptSecret(encryptedAccessToken);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhoneNumber,
        type: 'text',
        text: { body },
      }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, messageId: json?.messages?.[0]?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
