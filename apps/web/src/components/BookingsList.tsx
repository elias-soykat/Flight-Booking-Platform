import React from 'react';
import type { BookingEntity, BookingPassengerEntity } from '@travel-platform/shared';
import { Plane, Calendar, User, Ticket, ArrowRight, Loader2 } from 'lucide-react';


export interface BookingsListProps {
  bookings: BookingEntity[];
  isLoading?: boolean;
  onSelectBooking?: (booking: BookingEntity) => void;
  onNewSearch?: () => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  isLoading = false,
  onSelectBooking,
  onNewSearch
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Loading Bookings...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching your flight reservations</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No bookings found</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          You don't have any flight reservations yet. Search and book flights to test the deterministic booking flow.
        </p>
        {onNewSearch && (
          <button
            onClick={onNewSearch}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <Plane className="w-4 h-4" />
            <span>Search Flights</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Your Flight Bookings</h2>
            <span className="bg-amber-400 text-slate-900 text-xs font-black px-2 py-0.5 rounded tracking-wide uppercase">
              [DEMO / MOCK]
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {bookings.length} confirmed itinerary{bookings.length > 1 ? 'ies' : ''} with immutable pricing snapshots
          </p>
        </div>

        {onNewSearch && (
          <button
            onClick={onNewSearch}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 self-start"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Book Another Flight</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bookings.map((booking) => {
          const offer = booking.flightOffer;
          const statusColors: Record<string, string> = {
            CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            TICKETED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
            CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200'
          };
          const badgeClass = statusColors[booking.bookingStatus] || 'bg-slate-100 text-slate-700 border-slate-200';

          return (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Route & Reference Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {booking.bookingReference}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <span>PNR:</span>
                    <span>{booking.pnr}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                    {booking.bookingStatus}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">
                    {offer.originAirport.iataCode} → {offer.destinationAirport.iataCode}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({offer.originAirport.city} to {offer.destinationAirport.city})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{offer.departureAt.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {booking.passengers.length} Passenger{booking.passengers.length > 1 ? 's' : ''} (
                      {booking.passengers.map((p: BookingPassengerEntity) => `${p.firstName} ${p.lastName}`).join(', ')})

                    </span>
                  </div>
                  <div className="text-slate-500">
                    Cabin: <span className="font-semibold text-slate-700">{offer.cabinClass}</span>
                  </div>
                </div>
              </div>

              {/* Right Price & Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 gap-2">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                    Total Fare
                  </span>
                  <span className="text-xl font-black text-indigo-600">
                    ${booking.totalAmount}
                  </span>
                  <span className="text-xs text-slate-500 block">{booking.currency}</span>
                </div>

                {onSelectBooking && (
                  <button
                    onClick={() => onSelectBooking(booking)}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Itinerary</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
