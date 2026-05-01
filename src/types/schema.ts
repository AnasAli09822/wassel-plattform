// Canonical entity types for the Wassel multi-tenant platform.
// Every operational record carries `orgId` so it lives inside its tenant scope.

import type { Timestamp, FieldValue } from 'firebase/firestore';

export type ISODateString = string;
export type FirestoreDate = Timestamp | FieldValue | ISODateString | null;

export type Role = 'owner' | 'admin' | 'agent';
export type PlanId = 'free' | 'pro' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'trial';
export type AutomationStatus = 'active' | 'draft' | 'paused';
export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type AutomationRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  orgId: string;
  role: Role;
  isSuperAdmin?: boolean;
  createdAt: FirestoreDate;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  planId: PlanId;
  status: OrgStatus;
  whatsappConnected: boolean;
  whatsappNumber?: string;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  // Encrypted access token (never expose to client). Stored only on server-side mirror.
  whatsappAccessTokenRef?: string;
  // Per-tenant n8n webhook override (optional). Otherwise master webhook is used.
  n8nWebhookOverride?: string;
  subscriptionId?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Contact {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  lastActivity: FirestoreDate;
  createdAt: FirestoreDate;
}

export interface Chat {
  id: string;
  orgId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  unreadCount: number;
  isAutomated: boolean;
  lastMessagePreview?: string;
  lastMessageAt: FirestoreDate;
  assignedAgentId?: string;
  createdAt: FirestoreDate;
}

export interface Message {
  id: string;
  orgId: string;
  chatId: string;
  direction: MessageDirection;
  body: string;
  mediaUrl?: string;
  status: MessageStatus;
  sentBy?: 'human' | 'automation' | 'system';
  agentId?: string;
  automationRunId?: string;
  whatsappMessageId?: string;
  errorReason?: string;
  createdAt: FirestoreDate;
}

export type AutomationTriggerType =
  | 'contact_created'
  | 'message_received'
  | 'keyword_match'
  | 'tag_added'
  | 'broadcast_sent'
  | 'webhook'
  | 'time_schedule';

export type AutomationActionType =
  | 'action_whatsapp'
  | 'action_email'
  | 'action_tag'
  | 'action_webhook'
  | 'action_assign'
  | 'logic_delay'
  | 'logic_condition';

export interface AutomationStep {
  id: string;
  type: AutomationTriggerType | AutomationActionType | string;
  title: string;
  description?: string;
  config: Record<string, unknown>;
}

export interface AutomationMetrics {
  triggers: number;
  completions: number;
  failures?: number;
  lastRunAt?: FirestoreDate;
}

export interface Automation {
  id: string;
  orgId: string;
  name: string;
  status: AutomationStatus;
  steps: AutomationStep[];
  metrics: AutomationMetrics;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface AutomationRun {
  id: string;
  orgId: string;
  automationId: string;
  status: AutomationRunStatus;
  triggerType: string;
  triggerPayload: Record<string, unknown>;
  contactId?: string;
  startedAt: FirestoreDate;
  finishedAt?: FirestoreDate;
  steps?: Array<{ stepId: string; status: AutomationRunStatus; output?: unknown; error?: string }>;
  error?: string;
}

export interface Broadcast {
  id: string;
  orgId: string;
  name: string;
  templateId?: string;
  message: string;
  audienceTagFilter?: string[];
  audienceContactIds?: string[];
  status: BroadcastStatus;
  scheduledAt?: FirestoreDate;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  failedCount: number;
  createdAt: FirestoreDate;
}

export interface Template {
  id: string;
  orgId: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  body: string;
  variables: string[];
  metaApprovalStatus?: 'pending' | 'approved' | 'rejected' | 'draft';
  metaTemplateName?: string;
  createdAt: FirestoreDate;
}

export interface UsageRecord {
  id: string; // `${orgId}_${YYYY-MM}`
  orgId: string;
  month: string; // YYYY-MM
  messagesSent: number;
  contactsCreated: number;
  automationsRun: number;
  broadcastsSent: number;
  limitMessages: number;
  updatedAt: FirestoreDate;
}

// ---------------- Server-side only collections ----------------

// /system_integrations/{provider}  — readable only by Super Admins.
export interface SystemIntegration {
  id: string;
  provider: 'n8n_master' | 'whatsapp_cloud_api' | 'openai' | 'gemini' | 'stripe';
  apiUrl?: string;
  // Reference to a secret stored in a vault (e.g. GCP Secret Manager) — never the raw key.
  secretRef?: string;
  active: boolean;
  updatedAt: FirestoreDate;
}

// /webhook_events/{eventId} — raw inbound events (audit trail) before dispatch.
export interface WebhookEvent {
  id: string;
  orgId?: string;
  source: 'whatsapp' | 'n8n' | 'meta' | 'stripe' | 'unknown';
  type: string;
  payload: Record<string, unknown>;
  signatureValid: boolean;
  receivedAt: FirestoreDate;
  processedAt?: FirestoreDate;
  error?: string;
}
