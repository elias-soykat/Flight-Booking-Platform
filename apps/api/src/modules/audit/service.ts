import crypto from 'node:crypto';
import type { AuditLogEntity } from '@travel-platform/shared';

const auditLogsStore = new Map<string, AuditLogEntity>();

export const auditService = {
  async logAction(entry: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEntity> {
    const id = crypto.randomUUID();
    const log: AuditLogEntity = {
      id,
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.set(id, log);
    return log;
  },

  async listLogs(limit = 50): Promise<AuditLogEntity[]> {
    const logs = Array.from(auditLogsStore.values());
    // Sort descending by createdAt
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs.slice(0, limit);
  },

  // Test helper
  clear(): void {
    auditLogsStore.clear();
  },
};
