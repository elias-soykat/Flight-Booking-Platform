import type {
  FlightSearchCriteria,
  FlightOffer,
  FareValidationResult,
  CreateReservationRequest,
  ReservationResult,
  TicketIssuanceResult,
  SupplierCancellationResult
} from '@travel-platform/shared';

export interface FlightSupplierAdapter {
  readonly supplierId: string;
  readonly supplierName: string;
  searchFlights(criteria: FlightSearchCriteria): Promise<FlightOffer[]>;
  getOfferDetails(offerRef: string): Promise<FlightOffer | null>;
  validateFare(offerRef: string, passengerCount: number): Promise<FareValidationResult>;
  createReservation(request: CreateReservationRequest): Promise<ReservationResult>;
  issueTicket(supplierBookingRef: string): Promise<TicketIssuanceResult>;
  cancelReservation(supplierBookingRef: string): Promise<SupplierCancellationResult>;
}
