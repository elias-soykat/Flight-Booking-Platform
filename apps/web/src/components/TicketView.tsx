import React, { useState } from 'react';
import type { BookingEntity, TicketEntity } from '@travel-platform/shared';
import { Plane, Calendar, User, Ticket, Copy, Printer, ArrowLeft } from 'lucide-react';

export interface TicketViewProps {
  booking: BookingEntity;
  tickets: TicketEntity[];
  onBack?: () => void;
}

export const TicketView: React.FC<TicketViewProps> = ({
  booking,
  tickets,
  onBack
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (ticketNumber: string) => {
    navigator.clipboard?.writeText(ticketNumber);
    setCopiedId(ticketNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print?.();
  };

  const offer = booking.flightOffer;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Demo Disclaimer */}
      <div className="bg-amber-500 text-slate-950 p-4 rounded-2xl shadow-md flex items-center justify-between gap-4 font-bold text-xs uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
          <span>[DEMO / MOCK - NOT A VALID AIRLINE TICKET]</span>
        </div>
        <span className="text-[10px] bg-slate-950 text-amber-400 px-2.5 py-1 rounded-full font-black">
          FOR EVALUATION ONLY
        </span>
      </div>

      {/* Main E-Ticket Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-slate-900 text-white p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-black tracking-tight">Electronic Flight Ticket</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Issued by TravelHub MVP &bull; Free-Tier Open-Source Monolith
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Supplier PNR
              </span>
              <span className="text-xl font-mono font-black text-amber-400">{booking.pnr}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Booking Ref
              </span>
              <span className="text-base font-mono font-bold text-white">{booking.bookingReference}</span>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Flight Itinerary ({offer.cabinClass})</span>
            <span>Supplier Booking Ref: {booking.supplierBookingReference}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="text-3xl font-black text-slate-900">{offer.originAirport.iataCode}</div>
              <div className="text-xs text-slate-500">{offer.originAirport.city} ({offer.originAirport.name})</div>
              <div className="text-xs font-semibold text-slate-700 mt-1.5 flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{offer.departureAt.slice(0, 10)} {offer.departureAt.slice(11, 16)} UTC</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500 font-medium">{offer.totalDurationMinutes} mins</span>
              <div className="flex items-center gap-2 my-1 text-slate-300">
                <div className="w-10 h-0.5 bg-slate-300" />
                <Plane className="w-4 h-4 text-indigo-600" />
                <div className="w-10 h-0.5 bg-slate-300" />
              </div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase">
                {offer.stopCount === 0 ? 'Non-Stop Direct' : `${offer.stopCount} Stop`}
              </span>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-3xl font-black text-slate-900">{offer.destinationAirport.iataCode}</div>
              <div className="text-xs text-slate-500">{offer.destinationAirport.city} ({offer.destinationAirport.name})</div>
              <div className="text-xs font-semibold text-slate-700 mt-1.5 flex items-center gap-1 justify-center sm:justify-end">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{offer.arrivalAt.slice(0, 10)} {offer.arrivalAt.slice(11, 16)} UTC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issued Tickets List */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Passenger E-Tickets ({tickets.length})
          </h3>

          <div className="space-y-3">
            {tickets.map((tkt) => (
              <div
                key={tkt.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{tkt.passengerName}</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200">
                      {tkt.issuanceMethod}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>Issued: {tkt.issuedAt.slice(0, 10)}</span>
                    <span>&bull;</span>
                    <span>Baggage: {offer.segments[0]?.baggageAllowance || '1x23kg'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ticket Number</span>
                    <span className="font-mono text-sm font-black text-slate-900 tracking-wide">
                      {tkt.ticketNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tkt.ticketNumber)}
                    title="Copy Ticket Number"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors ml-1"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copiedId === tkt.ticketNumber && (
                    <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bookings</span>
            </button>
          ) : <div />}

          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Itinerary (Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

