import React, { useState } from 'react';
import type { CancellationRequestEntity } from '@travel-platform/shared';
import { XCircle, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

export interface CancellationReviewQueueProps {
  cancellations: CancellationRequestEntity[];
  isLoading?: boolean;
  onReview: (requestId: string, decision: 'APPROVE' | 'REJECT', reviewNote?: string) => Promise<void>;
}

export const CancellationReviewQueue: React.FC<CancellationReviewQueueProps> = ({
  cancellations,
  isLoading = false,
  onReview
}) => {
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleNoteChange = (id: string, note: string) => {
    setActiveNotes(prev => ({ ...prev, [id]: note }));
  };

  const handleAction = async (requestId: string, decision: 'APPROVE' | 'REJECT') => {
    setProcessingId(requestId);
    try {
      const note = activeNotes[requestId] || (decision === 'APPROVE' ? 'Approved by admin' : 'Rejected by admin');
      await onReview(requestId, decision, note);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
        <Loader2 className="w-6 h-6 text-rose-600 animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500">Loading cancellation queue...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-bold text-slate-900">
            Cancellation Review Queue ({cancellations.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Pending Operations Review
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Review customer and agency flight cancellation requests. Approval cancels the reservation and simulates supplier inventory release; rejection restores previous booking status.
      </p>

      {cancellations.length === 0 ? (
        <div className="text-xs text-slate-400 bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
          No pending cancellation requests in queue.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {cancellations.map((item) => {
            const isBusy = processingId === item.id;
            return (
              <div key={item.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.bookingReference}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      PREVIOUS: {item.previousBookingStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <div className="font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Stated Reason:</span>
                  </div>
                  <p className="italic text-slate-800">"{item.reason}"</p>
                  <div className="text-[11px] text-slate-400 mt-1">Requested by: {item.requestedByUserId}</div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <input
                    type="text"
                    placeholder="Optional review note (e.g. Non-refundable fare rule applied)..."
                    value={activeNotes[item.id] || ''}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    disabled={isBusy}
                    className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleAction(item.id, 'APPROVE')}
                      disabled={isBusy}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {isBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Cancellation</span>
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'REJECT')}
                      disabled={isBusy}
                      className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 disabled:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {isBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reject Request</span>
                    </button>
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
