import type { AuditLogEntity } from '@travel-platform/shared';
import { getRepository } from '../../repositories';

export interface LogActionParams {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  async logAction(params: LogActionParams): Promise<AuditLogEntity> {
    const entry: AuditLogEntity = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      createdAt: new Date().toISOString()
    };

    return await getRepository().audit.logAction(entry);
  },

  async getRecentLogs(limit: number = 50): Promise<AuditLogEntity[]> {
    return await getRepository().audit.listLogs(limit);
  },

  async listLogs(limit: number = 50): Promise<AuditLogEntity[]> {
    return await getRepository().audit.listLogs(limit);
  },

  async clearStore(): Promise<void> {
    await getRepository().clear();
  }
};
