import React from 'react';
import type { AuditLogEntity } from '@travel-platform/shared';
import { ScrollText, RefreshCw, Clock, User, Shield } from 'lucide-react';

export interface AuditLogViewProps {
  logs: AuditLogEntity[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  isLoading = false,
  onRefresh
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Platform System Audit Logs ({logs.length})
          </h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Trail</span>
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Immutable record of administrative actions, manual ticket fulfillments, payment reconciliations, and cancellation decisions.
      </p>

      {logs.length === 0 ? (
        <div className="text-xs text-slate-400 bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
          No audit log entries recorded.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          {logs.map((log) => {
            const isCancellation = log.action.includes('CANCELLATION');
            const isTicket = log.action.includes('TICKET');
            const isPayment = log.action.includes('PAYMENT') || log.action.includes('RECONCIL');

            let badgeClass = 'bg-slate-100 text-slate-700';
            if (isCancellation) badgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
            if (isTicket) badgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            if (isPayment) badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200';

            return (
              <div key={log.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${badgeClass}`}>
                      {log.action}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {log.entityType}: <span className="font-mono text-slate-800">{log.entityId}</span>
                    </span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[11px] self-end sm:self-auto flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {log.actorUserId?.includes('admin') ? (
                      <Shield className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className="font-medium text-slate-600">{log.actorUserId || 'system'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{log.createdAt.slice(0, 19).replace('T', ' ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
