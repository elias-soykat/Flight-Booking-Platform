import type { FlightOffer } from '@travel-platform/shared';
import { Plane, Clock, Luggage, ArrowRight } from 'lucide-react';

interface FlightCardProps {
  offer: FlightOffer;
  onSelect: (offer: FlightOffer) => void;
}

export const FlightCard = ({ offer, onSelect }: FlightCardProps) => {
  const primarySegment = offer.segments[0];
  const airline = primarySegment?.airline || { name: 'Airline', code: 'XX' };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Top Banner: Airline & Demo Tag */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {airline.code}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{airline.name}</h3>
            <p className="text-xs text-slate-500 font-mono">
              {offer.segments.map(s => s.flightNumber).join(' / ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wide">
            [DEMO / MOCK]
          </span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
            {offer.cabinClass}
          </span>
        </div>
      </div>

      {/* Middle: Itinerary Flight Times & Airports */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Origin */}
        <div className="md:col-span-3 text-left">
          <p className="text-2xl font-extrabold text-slate-900">{formatTime(offer.departureAt)}</p>
          <p className="text-sm font-bold text-slate-700">{offer.originAirport.iataCode}</p>
          <p className="text-xs text-slate-400 truncate">{offer.originAirport.city}</p>
        </div>

        {/* Flight duration and stops visualization */}
        <div className="md:col-span-4 text-center px-2">
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDuration(offer.totalDurationMinutes)}</span>
          </div>

          <div className="relative flex items-center justify-center my-1">
            <div className="w-full h-[2px] bg-slate-200 absolute" />
            <div className="z-10 bg-white px-2">
              <Plane className="w-4 h-4 text-slate-400 transform rotate-90" />
            </div>
          </div>

          <p className={`text-xs font-semibold ${offer.stopCount === 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
            {offer.stopCount === 0 ? 'Non-stop Direct' : `${offer.stopCount} Stop(s)`}
          </p>
        </div>

        {/* Destination */}
        <div className="md:col-span-3 text-left md:text-right">
          <p className="text-2xl font-extrabold text-slate-900">{formatTime(offer.arrivalAt)}</p>
          <p className="text-sm font-bold text-slate-700">{offer.destinationAirport.iataCode}</p>
          <p className="text-xs text-slate-400 truncate">{offer.destinationAirport.city}</p>
        </div>

        {/* Baggage Indicator */}
        <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-1.5 text-xs text-slate-600">
          <Luggage className="w-4 h-4 text-slate-400" />
          <span>{primarySegment?.baggageAllowance || '1x23kg'}</span>
        </div>
      </div>

      {/* Bottom Bar: Fare Breakdown & Selection Button */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Base: ${offer.baseFare.toFixed(2)}</span>
            <span>&bull;</span>
            <span>Markup: ${offer.markupAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-extrabold text-slate-900">${offer.totalAmount.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">{offer.currency} Total</span>
          </div>
        </div>

        <button
          onClick={() => onSelect(offer)}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Select Flight</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
