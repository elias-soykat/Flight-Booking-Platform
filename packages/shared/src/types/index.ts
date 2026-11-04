export type UserRole = 'CUSTOMER' | 'AGENCY_OWNER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export type AgencyStatus = 'ACTIVE' | 'SUSPENDED';
export type AgencyMembershipStatus = 'ACTIVE' | 'INACTIVE';
export type AgencyInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type PassengerType = 'ADULT' | 'CHILD' | 'INFANT';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'TICKETED'
  | 'CANCELLATION_PENDING'
  | 'CANCELLED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'RECONCILED';

export type TicketIssuanceMethod = 'AUTOMATIC_SIMULATED' | 'ADMIN_MANUAL';

export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SimulationScenario = 'SUCCESS' | 'DECLINE' | 'TIMEOUT' | 'INSUFFICIENT_FUNDS';

export interface Airport {
  id: string;
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  id: string;
  code: string;
  name: string;
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: Airline;
  originAirport: Airport;
  destinationAirport: Airport;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  baggageAllowance: string;
}

export interface FlightOffer {
  id: string;
  supplierId: string;
  supplierOfferReference: string;
  originAirport: Airport;
  destinationAirport: Airport;
  departureAt: string;
  arrivalAt: string;
  totalDurationMinutes: number;
  stopCount: number;
  segments: FlightSegment[];
  cabinClass: CabinClass;
  baseFare: number;
  markupAmount: number;
  totalAmount: number;
  currency: string;
  inventorySource: 'MOCK';
  expiresAt: string;
}

export interface FlightSearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengerCount: number;
  cabinClass: CabinClass;
}

export interface FareValidationResult {
  valid: boolean;
  priceChanged: boolean;
  oldBaseFare?: number;
  newBaseFare?: number;
  availabilityChanged: boolean;
  reason?: string;
}

export interface CreateReservationRequest {
  offerReference: string;
  passengers: Array<{
    passengerType: PassengerType;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passportNumber?: string;
  }>;
}

export interface ReservationResult {
  success: boolean;
  supplierBookingReference?: string;
  pnr?: string;
  failureReason?: string;
}

export interface TicketIssuanceResult {
  success: boolean;
  ticketNumbers: string[];
  failureReason?: string;
}

export interface SupplierCancellationResult {
  success: boolean;
  cancellationReference?: string;
  failureReason?: string;
}
