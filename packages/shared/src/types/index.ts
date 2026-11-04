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

export interface BookingPassengerEntity {
  id: string;
  passengerType: PassengerType;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
}

export interface BookingEventEntity {
  id: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BookingEntity {
  id: string;
  bookingReference: string;
  customerUserId: string;
  createdByUserId: string;
  agencyId?: string;
  supplierId: string;
  inventorySource: 'MOCK';
  supplierBookingReference: string;
  pnr: string;
  bookingStatus: BookingStatus;
  currency: string;
  baseFare: number;
  markupAmount: number;
  totalAmount: number;
  idempotencyKey: string;
  flightOffer: FlightOffer;
  passengers: BookingPassengerEntity[];
  events: BookingEventEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAttemptEntity {
  id: string;
  bookingId: string;
  paymentReference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  scenario: SimulationScenario;
  failureReason?: string;
  idempotencyKey: string;
  reconciledAt?: string;
  reconciliationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketEntity {
  id: string;
  bookingId: string;
  passengerId: string;
  passengerName: string;
  ticketNumber: string;
  issuanceMethod: TicketIssuanceMethod;
  issuedByUserId?: string;
  issuedAt: string;
}

export interface CancellationRequestEntity {
  id: string;
  bookingId: string;
  bookingReference: string;
  requestedByUserId: string;
  reason: string;
  status: CancellationRequestStatus;
  previousBookingStatus: BookingStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntity {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalAgencies: number;
  totalBookings: number;
  confirmedBookings: number;
  ticketedBookings: number;
  pendingCancellations: number;
  cancelledBookings: number;
  failedPayments: number;
  unreconciledPayments: number;
  operationalInterventionsRequired: number;
}



