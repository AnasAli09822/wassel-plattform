import { apiFetch } from './client';
import type { UsageRecord } from '../../types/schema';

const DEFAULT_LIMITS: Record<string, number> = {
  free: 1_000,
  pro: 50_000,
  enterprise: 1_000_000,
};

export const usageService = {
  async getCurrent(): Promise<UsageRecord | null> {
    const data = await apiFetch<{ ok: boolean; usage: UsageRecord | null }>('/organizations/current');
    return data.usage;
  },

  async hasQuota(planId = 'free'): Promise<boolean> {
    const usage = await usageService.getCurrent();
    if (!usage) return true;
    const limit = usage.limitMessages ?? DEFAULT_LIMITS[planId] ?? DEFAULT_LIMITS.free;
    return usage.messagesSent < limit;
  },
};
