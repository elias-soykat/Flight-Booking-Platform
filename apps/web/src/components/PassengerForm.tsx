import React, { useState } from 'react';
import type { FlightOffer, PassengerInput, PassengerType, UserRole } from '@travel-platform/shared';
import { User, AlertCircle, Calendar, ShieldCheck, X } from 'lucide-react';

export interface AssociatedCustomer {
  customerUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface PassengerFormProps {
  offer: FlightOffer;
  userRole: UserRole;
  associatedCustomers?: AssociatedCustomer[];
  onSubmit: (data: {
    passengers: PassengerInput[];
    customerUserId?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  offer,
  userRole,
  associatedCustomers = [],
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    associatedCustomers.length > 0 ? associatedCustomers[0]!.customerUserId : ''
  );

  const [passengers, setPassengers] = useState<PassengerInput[]>([
    {
      passengerType: 'ADULT',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: ''
    }
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handlePassengerChange = (
    index: number,
    field: keyof PassengerInput,
    value: string
  ) => {
    const updated = [...passengers];
    updated[index] = {
      ...updated[index]!,
      [field]: value
    };
    setPassengers(updated);

    // Clear field-specific error
    if (errors[`${index}_${field}`]) {
      const nextErrors = { ...errors };
      delete nextErrors[`${index}_${field}`];
      setErrors(nextErrors);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (userRole === 'AGENCY_OWNER' && associatedCustomers.length > 0 && !selectedCustomerId) {
      newErrors.customer = 'Please select a customer to book on behalf of';
    }

    passengers.forEach((p, idx) => {
      if (!p.firstName.trim()) {
        newErrors[`${idx}_firstName`] = 'First name is required';
      }
      if (!p.lastName.trim()) {
        newErrors[`${idx}_lastName`] = 'Last name is required';
      }
      if (!p.dateOfBirth.trim()) {
        newErrors[`${idx}_dateOfBirth`] = 'Date of birth is required';
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dateOfBirth)) {
        newErrors[`${idx}_dateOfBirth`] = 'Format must be YYYY-MM-DD';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      customerUserId: userRole === 'AGENCY_OWNER' ? selectedCustomerId || undefined : undefined,
      passengers
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Passenger & Booking Checkout</h2>
            <span className="bg-amber-400 text-slate-900 text-xs font-black px-2 py-0.5 rounded tracking-wide uppercase">
              [DEMO / MOCK]
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Flight: {offer.originAirport.iataCode} → {offer.destinationAirport.iataCode} ({offer.cabinClass})
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Price Breakdown Snapshot Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Guaranteed Price Snapshot
            </div>
            <div className="text-sm text-slate-700 mt-1">
              Base Fare: <span className="font-semibold text-slate-900">${offer.baseFare}</span> +
              Platform Markup: <span className="font-semibold text-slate-900">${offer.markupAmount}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-indigo-600">${offer.totalAmount} Total</span>
            <span className="text-xs text-slate-500 block">{offer.currency}</span>
          </div>
        </div>

        {/* Agency Owner: Customer Selector */}
        {userRole === 'AGENCY_OWNER' && (
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 space-y-2">
            <label htmlFor="agencyCustomerSelect" className="block text-sm font-semibold text-indigo-950">
              Book on behalf of Customer
            </label>
            <p className="text-xs text-indigo-700">
              Select one of your actively associated customers. They will own the travel ticket.
            </p>
            {associatedCustomers.length > 0 ? (
              <select
                id="agencyCustomerSelect"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {associatedCustomers.map((cust) => (
                  <option key={cust.customerUserId} value={cust.customerUserId}>
                    {cust.firstName ? `${cust.firstName} ${cust.lastName || ''} (${cust.email})` : cust.email}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                No active associated customers found. You can only book flights for customers associated with your agency.
              </div>
            )}
            {errors.customer && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.customer}
              </p>
            )}
          </div>
        )}

        {/* Passenger Forms */}
        <div className="space-y-6">
          {passengers.map((pax, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Passenger {idx + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`pax-type-${idx}`} className="text-xs text-slate-500">
                    Type:
                  </label>
                  <select
                    id={`pax-type-${idx}`}
                    value={pax.passengerType}
                    onChange={(e) =>
                      handlePassengerChange(idx, 'passengerType', e.target.value as PassengerType)
                    }
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="ADULT">Adult (12+ yrs)</option>
                    <option value="CHILD">Child (2-11 yrs)</option>
                    <option value="INFANT">Infant (Under 2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`pax-fn-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id={`pax-fn-${idx}`}
                    type="text"
                    value={pax.firstName}
                    placeholder="e.g. Jane"
                    onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors[`${idx}_firstName`] && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors[`${idx}_firstName`]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`pax-ln-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id={`pax-ln-${idx}`}
                    type="text"
                    value={pax.lastName}
                    placeholder="e.g. Doe"
                    onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors[`${idx}_lastName`] && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors[`${idx}_lastName`]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`pax-dob-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth * (YYYY-MM-DD)
                  </label>
                  <div className="relative">
                    <input
                      id={`pax-dob-${idx}`}
                      type="date"
                      value={pax.dateOfBirth}
                      onChange={(e) => handlePassengerChange(idx, 'dateOfBirth', e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                  {errors[`${idx}_dateOfBirth`] && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors[`${idx}_dateOfBirth`]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`pax-pass-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Passport Number (Optional)
                  </label>
                  <input
                    id={`pax-pass-${idx}`}
                    type="text"
                    value={pax.passportNumber || ''}
                    placeholder="e.g. A12345678"
                    onChange={(e) => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? 'Confirming Reservation...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};
