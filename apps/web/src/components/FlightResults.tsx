import type { FlightOffer, FlightSearchCriteria } from '@travel-platform/shared';
import { FlightCard } from './FlightCard';
import { PlaneTakeoff, AlertCircle } from 'lucide-react';

interface FlightResultsProps {
  offers: FlightOffer[];
  searchCriteria: FlightSearchCriteria | null;
  onSelectOffer: (offer: FlightOffer) => void;
  isLoading?: boolean;
}

export const FlightResults = ({
  offers,
  searchCriteria,
  onSelectOffer,
  isLoading = false
}: FlightResultsProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto mb-4" />
        <p className="text-base font-semibold text-slate-800">Searching simulated flight inventory...</p>
        <p className="text-xs text-slate-500 mt-1">Applying real-time markup and deterministic route fixtures</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No flights found for this route</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
          {searchCriteria
            ? `No mock flight schedules available between ${searchCriteria.origin} and ${searchCriteria.destination}.`
            : 'Please run a flight search to view available options.'}
        </p>
        <div className="mt-4 p-3 bg-slate-50 rounded-xl inline-block text-xs text-slate-500 text-left">
          <p className="font-semibold text-slate-700 mb-1">Supported Demo Routes:</p>
          <p>&bull; JFK &harr; LHR (New York &harr; London)</p>
          <p>&bull; LHR &harr; DXB (London &harr; Dubai)</p>
          <p>&bull; DXB &harr; SIN (Dubai &harr; Singapore)</p>
          <p>&bull; SFO &harr; ORD (San Francisco &harr; Chicago)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="w-5 h-5 text-slate-900" />
          <h2 className="text-lg font-bold text-slate-900">
            Available Flights ({offers.length})
          </h2>
          {searchCriteria && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {searchCriteria.origin} &rarr; {searchCriteria.destination}
            </span>
          )}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Deterministic mock inventory &bull; 10% platform markup applied
        </span>
      </div>

      {/* Flight Cards Stack */}
      <div className="space-y-4">
        {offers.map((offer) => (
          <FlightCard key={offer.id} offer={offer} onSelect={onSelectOffer} />
        ))}
      </div>
    </div>
  );
};
