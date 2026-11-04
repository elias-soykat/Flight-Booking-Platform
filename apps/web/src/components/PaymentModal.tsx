import React, { useState } from 'react';
import type { BookingEntity, SimulationScenario } from '@travel-platform/shared';
import { CreditCard, ShieldCheck, AlertCircle, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export interface PaymentModalProps {
  booking: BookingEntity;
  onPay: (scenario: SimulationScenario) => Promise<void>;
  onClose: () => void;
  isProcessing?: boolean;
  errorMessage?: string | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  booking,
  onPay,
  onClose,
  isProcessing = false,
  errorMessage = null
}) => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>('SUCCESS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPay(selectedScenario);
  };

  const scenarios: Array<{
    id: SimulationScenario;
    label: string;
    description: string;
    icon: typeof CheckCircle2;
    color: string;
  }> = [
    {
      id: 'SUCCESS',
      label: 'Success (Normal Flow)',
      description: 'Simulates successful authorization and automatically issues mock 13-digit tickets',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'DECLINE',
      label: 'Decline (Insufficient Funds / Card Issuer)',
      description: 'Simulates bank card decline; keeps booking intact so user can safely retry',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      id: 'TIMEOUT',
      label: 'Timeout (Gateway Network Timeout)',
      description: 'Simulates network uncertainty (UNKNOWN state); routes transaction to admin reconciliation queue',
      icon: Clock,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      id: 'INSUFFICIENT_FUNDS',
      label: 'Insufficient Funds',
      description: 'Simulates cardholder insufficient funds rejection error',
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">Simulated Payment Processing</h2>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                [DEMO / MOCK]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Booking Ref: {booking.bookingReference} &bull; PNR: {booking.pnr}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount to Charge */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider block">
                Guaranteed Price to Authorize
              </span>
              <span className="text-xs text-indigo-700">
                Immutable snapshot ({booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600">
                ${booking.totalAmount}
              </span>
              <span className="text-xs font-semibold text-slate-500 block">{booking.currency}</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Scenario Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Test Simulation Scenario:
            </label>
            <div className="space-y-2">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isSelected = selectedScenario === sc.id;
                return (
                  <label
                    key={sc.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="simulationScenario"
                      value={sc.id}
                      checked={isSelected}
                      onChange={() => setSelectedScenario(sc.id)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{sc.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {sc.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Simulated Disclaimer */}
          <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Zero-cost sandbox mode active. No actual banking or payment gateway communication occurs.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isProcessing ? 'Simulating Authorization...' : 'Authorize Simulated Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

