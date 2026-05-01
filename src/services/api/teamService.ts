import { apiFetch } from './client';

export interface TeamMemberInput {
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'agent';
}

export interface TeamPayload {
  ok: boolean;
  users: any[];
  invitations: any[];
}

export const teamService = {
  list(orgId?: string) {
    const suffix = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
    return apiFetch<TeamPayload>(`/team${suffix}`);
  },

  invite(input: TeamMemberInput, orgId?: string) {
    return apiFetch<{ ok: boolean; invitationId: string }>('/team/invitations', {
      method: 'POST',
      body: JSON.stringify({ ...input, ...(orgId ? { orgId } : {}) }),
    });
  },

  updateMember(userId: string, patch: Partial<TeamMemberInput>, orgId?: string) {
    return apiFetch<{ ok: boolean }>(`/team/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...patch, ...(orgId ? { orgId } : {}) }),
    });
  },

  removeMember(userId: string, orgId?: string) {
    const suffix = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
    return apiFetch<{ ok: boolean }>(`/team/members/${userId}${suffix}`, {
      method: 'DELETE',
    });
  },
};
