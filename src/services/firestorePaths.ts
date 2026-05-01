// Canonical Firestore path builders. ALL tenant data must flow through these
// helpers — never hard-code a path with `orgId` interpolation in components.
// Keeping paths in one place is the contract that the security rules rely on.

const ORG_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function assertOrgId(orgId: string | undefined | null): asserts orgId is string {
  if (!orgId || !ORG_ID_REGEX.test(orgId)) {
    throw new Error('Invalid or missing orgId — refusing to access tenant collection.');
  }
}

export const paths = {
  users: () => 'users',
  user: (uid: string) => `users/${uid}`,

  organizations: () => 'organizations',
  organization: (orgId: string) => {
    assertOrgId(orgId);
    return `organizations/${orgId}`;
  },

  contacts: (orgId: string) => `${paths.organization(orgId)}/contacts`,
  contact: (orgId: string, contactId: string) => `${paths.contacts(orgId)}/${contactId}`,

  chats: (orgId: string) => `${paths.organization(orgId)}/chats`,
  chat: (orgId: string, chatId: string) => `${paths.chats(orgId)}/${chatId}`,
  messages: (orgId: string, chatId: string) => `${paths.chat(orgId, chatId)}/messages`,
  message: (orgId: string, chatId: string, msgId: string) =>
    `${paths.messages(orgId, chatId)}/${msgId}`,

  automations: (orgId: string) => `${paths.organization(orgId)}/automations`,
  automation: (orgId: string, autoId: string) => `${paths.automations(orgId)}/${autoId}`,

  automationRuns: (orgId: string) => `${paths.organization(orgId)}/automation_runs`,
  automationRun: (orgId: string, runId: string) => `${paths.automationRuns(orgId)}/${runId}`,

  broadcasts: (orgId: string) => `${paths.organization(orgId)}/broadcasts`,
  broadcast: (orgId: string, bId: string) => `${paths.broadcasts(orgId)}/${bId}`,

  templates: (orgId: string) => `${paths.organization(orgId)}/templates`,
  template: (orgId: string, tId: string) => `${paths.templates(orgId)}/${tId}`,

  usage: () => 'usage_stats',
  usageRecord: (orgId: string, month: string) => `${paths.usage()}/${orgId}_${month}`,

  // Server-only collections (rules deny client access).
  systemIntegrations: () => 'system_integrations',
  webhookEvents: () => 'webhook_events',
};
