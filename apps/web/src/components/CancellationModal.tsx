import React, { useState } from 'react';
import type { BookingEntity } from '@travel-platform/shared';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export interface CancellationModalProps {
  booking: BookingEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) {
    return null;
  }

  const isMinLength = reason.trim().length >= 5;
  const isBusy = isLoading || submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMinLength || isBusy) return;

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(booking.id, reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit cancellation request';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const offer = booking.flightOffer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase mb-1">
                [DEMO / MOCK CANCELLATION REQUEST]
              </span>
              <h3 className="text-lg font-bold text-slate-900">Request Flight Cancellation</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Simulation Disclaimer Note */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong className="font-bold">MVP Simulation Note:</strong> Submitting this request transitions the reservation to <span className="font-mono font-bold">CANCELLATION_PENDING</span>. In this prototype, cancellations require administrative review. No real banking refund or live GDS cancellation is triggered.
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Booking Reference:</span>
              <span className="font-mono font-bold text-slate-900">{booking.bookingReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Airline Mock PNR:</span>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {booking.pnr}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Itinerary:</span>
              <span className="font-semibold text-slate-800">
                {offer.originAirport.iataCode} → {offer.destinationAirport.iataCode} ({offer.segments?.[0]?.airline?.name || 'Mock Airline'})
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500 font-medium">Original Total Fare:</span>
              <span className="font-bold text-indigo-600">${booking.totalAmount} {booking.currency}</span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="cancellationReason" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="cancellationReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for cancellation (e.g. Schedule emergency, medical reason)..."
              disabled={isBusy}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors placeholder:text-slate-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Must be at least 5 characters</span>
              <span className={reason.trim().length >= 5 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {reason.trim().length} chars
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMinLength || isBusy}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit Cancellation Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
