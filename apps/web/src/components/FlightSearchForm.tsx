import { useState } from 'react';
import { AIRPORT_FIXTURES, type CabinClass, type FlightSearchQuery } from '@travel-platform/shared';
import { Search, ArrowLeftRight, Calendar, Users, Briefcase, AlertCircle } from 'lucide-react';

interface FlightSearchFormProps {
  onSearch: (criteria: FlightSearchQuery) => void;
  initialOrigin?: string;
  initialDestination?: string;
}

export const FlightSearchForm = ({
  onSearch,
  initialOrigin = 'JFK',
  initialDestination = 'LHR'
}: FlightSearchFormProps) => {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departureDate, setDepartureDate] = useState('2026-12-01');
  const [returnDate, setReturnDate] = useState('2026-12-10');
  const [passengerCount, setPassengerCount] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>('ECONOMY');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (origin === destination) {
      setValidationError('Origin and destination must be different');
      return;
    }

    if (tripType === 'round-trip' && returnDate && returnDate < departureDate) {
      setValidationError('Return date must be on or after departure date');
      return;
    }

    onSearch({
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      passengerCount,
      cabinClass
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Trip Type Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTripType('one-way')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tripType === 'one-way'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          One-way
        </button>
        <button
          type="button"
          onClick={() => setTripType('round-trip')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tripType === 'round-trip'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Round-trip
        </button>
      </div>

      {validationError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Origin */}
        <div className="md:col-span-3">
          <label htmlFor="origin-select" className="block text-xs font-semibold text-slate-500 mb-1">
            From (Origin)
          </label>
          <select
            id="origin-select"
            aria-label="From"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
          >
            {AIRPORT_FIXTURES.map((apt) => (
              <option key={apt.iataCode} value={apt.iataCode}>
                {apt.iataCode} - {apt.city} ({apt.name})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center pt-5">
          <button
            type="button"
            onClick={handleSwapAirports}
            title="Swap Origin and Destination"
            className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div className="md:col-span-3">
          <label htmlFor="destination-select" className="block text-xs font-semibold text-slate-500 mb-1">
            To (Destination)
          </label>
          <select
            id="destination-select"
            aria-label="To"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
          >
            {AIRPORT_FIXTURES.map((apt) => (
              <option key={apt.iataCode} value={apt.iataCode}>
                {apt.iataCode} - {apt.city} ({apt.name})
              </option>
            ))}
          </select>
        </div>

        {/* Departure Date */}
        <div className="md:col-span-2">
          <label htmlFor="departure-date" className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Departure Date</span>
          </label>
          <input
            id="departure-date"
            aria-label="Departure Date"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        {/* Return Date */}
        <div className="md:col-span-3">
          <label htmlFor="return-date" className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Return Date</span>
          </label>
          <input
            id="return-date"
            aria-label="Return Date"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={tripType === 'one-way'}
            className={`w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none ${
              tripType === 'one-way' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
            }`}
          />
        </div>
      </div>

      {/* Secondary Controls: Passengers & Cabin Class */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <label htmlFor="pax-count" className="text-xs font-semibold text-slate-600">Travelers:</label>
            <input
              id="pax-count"
              type="number"
              min="1"
              max="9"
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <label htmlFor="cabin-select" className="text-xs font-semibold text-slate-600">Class:</label>
            <select
              id="cabin-select"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as CabinClass)}
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-sm font-medium bg-white"
            >
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span>Search Flights</span>
        </button>
      </div>
    </form>
  );
};
