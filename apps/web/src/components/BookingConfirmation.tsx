import React from 'react';
import type { BookingEntity, BookingPassengerEntity } from '@travel-platform/shared';
import { CheckCircle2, Plane, Calendar, User, ArrowRight, ShieldCheck, Copy } from 'lucide-react';


export interface BookingConfirmationProps {
  booking: BookingEntity;
  onViewAllBookings: () => void;
  onNewSearch: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onViewAllBookings,
  onNewSearch
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPnr = () => {
    navigator.clipboard?.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const offer = booking.flightOffer;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Success Banner */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="inline-block bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase mb-1">
              [DEMO / MOCK RESERVATION]
            </span>
            <h2 className="text-2xl font-black tracking-tight">Booking Confirmed!</h2>
            <p className="text-emerald-100 text-sm">
              Your mock flight reservation has been successfully created with supplier PNR.
            </p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm sm:text-right border border-white/20">
          <div className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Status</div>
          <div className="text-lg font-black tracking-wide">{booking.bookingStatus}</div>
        </div>
      </div>

      {/* Main Reservation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* PNR & Reference Bar */}
        <div className="p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Booking Reference
            </div>
            <div className="text-xl font-mono font-bold text-white mt-0.5">
              {booking.bookingReference}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Airline Mock PNR
              </div>
              <div className="text-2xl font-mono font-black text-amber-400 tracking-wider">
                {booking.pnr}
              </div>
            </div>
            <button
              onClick={handleCopyPnr}
              title="Copy PNR"
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copied && <span className="text-xs text-emerald-400 font-medium">Copied!</span>}
          </div>
        </div>

        {/* Itinerary */}
        <div className="p-6 border-b border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plane className="w-4 h-4 text-indigo-600" />
              Flight Details ({offer.cabinClass})
            </h3>
            <span className="text-xs text-slate-500">
              Supplier: {booking.supplierBookingReference}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-black text-slate-900">{offer.originAirport.iataCode}</div>
              <div className="text-xs text-slate-500">{offer.originAirport.city}</div>
              <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {offer.departureAt.slice(0, 10)} {offer.departureAt.slice(11, 16)} UTC
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500 font-medium">{offer.totalDurationMinutes} mins</span>
              <div className="flex items-center gap-2 my-1 text-slate-300">
                <div className="w-12 h-0.5 bg-slate-300" />
                <Plane className="w-4 h-4 text-indigo-600" />
                <div className="w-12 h-0.5 bg-slate-300" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 uppercase">
                {offer.stopCount === 0 ? 'Direct Non-Stop' : `${offer.stopCount} Stop(s)`}
              </span>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-2xl font-black text-slate-900">{offer.destinationAirport.iataCode}</div>
              <div className="text-xs text-slate-500">{offer.destinationAirport.city}</div>
              <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1 justify-center sm:justify-end">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {offer.arrivalAt.slice(0, 10)} {offer.arrivalAt.slice(11, 16)} UTC
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Passengers ({booking.passengers.length})
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {booking.passengers.map((pax: BookingPassengerEntity) => (
              <div key={pax.id} className="p-3.5 bg-white flex items-center justify-between text-sm">

                <div>
                  <span className="font-semibold text-slate-900">
                    {pax.firstName} {pax.lastName}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    ({pax.passengerType} &bull; DOB: {pax.dateOfBirth})
                  </span>
                </div>
                {pax.passportNumber && (
                  <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Pass: {pax.passportNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Snapshot */}
        <div className="p-6 bg-slate-50 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Guaranteed Price Snapshot (Immutable)
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Base Fare</span>
            <span className="font-semibold text-slate-900">${booking.baseFare} {booking.currency}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Platform Markup (10%)</span>
            <span className="font-semibold text-slate-900">${booking.markupAmount} {booking.currency}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
            <span className="text-base font-bold text-slate-900">Total Charged</span>
            <span className="text-2xl font-black text-indigo-600">
              ${booking.totalAmount} Total
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-white border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={onNewSearch}
            className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Search More Flights
          </button>
          <button
            onClick={onViewAllBookings}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
