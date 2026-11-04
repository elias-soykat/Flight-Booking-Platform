import type {
  FlightSearchCriteria,
  FlightOffer,
  FlightSegment,
  FareValidationResult,
  CreateReservationRequest,
  ReservationResult,
  TicketIssuanceResult,
  SupplierCancellationResult,
  CabinClass
} from '@travel-platform/shared';
import {
  AIRPORT_FIXTURES,
  AIRLINE_FIXTURES,
  DEFAULT_CURRENCY,
  DEFAULT_MARKUP_PERCENTAGE,
  MOCK_INVENTORY_SOURCE
} from '@travel-platform/shared';
import type { FlightSupplierAdapter } from './adapter';

interface RouteDefinition {
  origin: string;
  destination: string;
  airlineCodes: string[];
  baseDurationMinutes: number;
  baseFareUSD: number;
  isDirect: boolean;
  transitAirport?: string;
}

const SUPPORTED_ROUTES: RouteDefinition[] = [
  { origin: 'JFK', destination: 'LHR', airlineCodes: ['AA', 'BA'], baseDurationMinutes: 420, baseFareUSD: 450, isDirect: true },
  { origin: 'LHR', destination: 'JFK', airlineCodes: ['BA', 'AA'], baseDurationMinutes: 480, baseFareUSD: 460, isDirect: true },
  { origin: 'LHR', destination: 'DXB', airlineCodes: ['EK', 'BA'], baseDurationMinutes: 430, baseFareUSD: 520, isDirect: true },
  { origin: 'DXB', destination: 'LHR', airlineCodes: ['EK', 'BA'], baseDurationMinutes: 470, baseFareUSD: 530, isDirect: true },
  { origin: 'DXB', destination: 'SIN', airlineCodes: ['EK', 'SQ'], baseDurationMinutes: 450, baseFareUSD: 480, isDirect: true },
  { origin: 'SIN', destination: 'DXB', airlineCodes: ['SQ', 'EK'], baseDurationMinutes: 460, baseFareUSD: 490, isDirect: true },
  { origin: 'SIN', destination: 'HND', airlineCodes: ['SQ', 'JL'], baseDurationMinutes: 410, baseFareUSD: 550, isDirect: true },
  { origin: 'HND', destination: 'SIN', airlineCodes: ['JL', 'SQ'], baseDurationMinutes: 430, baseFareUSD: 560, isDirect: true },
  { origin: 'JFK', destination: 'CDG', airlineCodes: ['AF', 'DL'], baseDurationMinutes: 440, baseFareUSD: 490, isDirect: true },
  { origin: 'CDG', destination: 'JFK', airlineCodes: ['AF', 'DL'], baseDurationMinutes: 500, baseFareUSD: 510, isDirect: true },
  { origin: 'SFO', destination: 'ORD', airlineCodes: ['UA', 'AA'], baseDurationMinutes: 250, baseFareUSD: 220, isDirect: true },
  { origin: 'ORD', destination: 'SFO', airlineCodes: ['UA', 'AA'], baseDurationMinutes: 270, baseFareUSD: 230, isDirect: true },
  // 1-Stop Connecting Routes
  { origin: 'JFK', destination: 'DXB', airlineCodes: ['BA', 'EK'], baseDurationMinutes: 890, baseFareUSD: 780, isDirect: false, transitAirport: 'LHR' },
  { origin: 'DXB', destination: 'JFK', airlineCodes: ['EK', 'BA'], baseDurationMinutes: 940, baseFareUSD: 790, isDirect: false, transitAirport: 'LHR' },
  { origin: 'LHR', destination: 'SIN', airlineCodes: ['EK', 'SQ'], baseDurationMinutes: 920, baseFareUSD: 850, isDirect: false, transitAirport: 'DXB' }
];

const CABIN_MULTIPLIERS: Record<CabinClass, number> = {
  ECONOMY: 1.0,
  PREMIUM_ECONOMY: 1.5,
  BUSINESS: 2.8,
  FIRST: 4.5
};

export class MockFlightSupplier implements FlightSupplierAdapter {
  readonly supplierId = 'mock-supplier-global';
  readonly supplierName = 'Deterministic Travel Simulator';

  // Cache to store offers for detail retrieval and fare validation
  private offerCache = new Map<string, FlightOffer>();

  async searchFlights(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
    const route = SUPPORTED_ROUTES.find(
      r => r.origin === criteria.origin && r.destination === criteria.destination
    );

    if (!route) {
      return [];
    }

    const originApt = AIRPORT_FIXTURES.find(a => a.iataCode === criteria.origin);
    const destApt = AIRPORT_FIXTURES.find(a => a.iataCode === criteria.destination);
    if (!originApt || !destApt) return [];

    const offers: FlightOffer[] = [];
    const multiplier = CABIN_MULTIPLIERS[criteria.cabinClass] || 1.0;
    const baseUnitFare = Math.round(route.baseFareUSD * multiplier);

    // Generate 3 deterministic time-slot options (Morning 08:00, Afternoon 14:00, Evening 19:30)
    const timeSlots = [
      { depTime: '08:00', priceVariance: 0 },
      { depTime: '14:30', priceVariance: 35 },
      { depTime: '19:45', priceVariance: -20 }
    ];

    timeSlots.forEach((slot, index) => {
      const airlineCode = route.airlineCodes[index % route.airlineCodes.length] || 'BA';
      const airline = AIRLINE_FIXTURES.find(al => al.code === airlineCode) || AIRLINE_FIXTURES[0]!;

      const departureIso = `${criteria.departureDate}T${slot.depTime}:00Z`;
      const depDateObj = new Date(departureIso);
      const arrDateObj = new Date(depDateObj.getTime() + route.baseDurationMinutes * 60 * 1000);
      const arrivalIso = arrDateObj.toISOString();

      const perPaxBase = baseUnitFare + slot.priceVariance;
      const totalBaseFare = Math.round(perPaxBase * criteria.passengerCount * 100) / 100;
      const markupAmount = Math.round(totalBaseFare * DEFAULT_MARKUP_PERCENTAGE * 100) / 100;
      const totalAmount = Math.round((totalBaseFare + markupAmount) * 100) / 100;

      const offerRef = `MOCK-${criteria.origin}-${criteria.destination}-${criteria.departureDate.replace(/-/g, '')}-${index + 1}`;
      const offerId = `off-${criteria.origin.toLowerCase()}-${criteria.destination.toLowerCase()}-${criteria.departureDate}-${index + 1}`;

      const segments: FlightSegment[] = [];

      if (route.isDirect || !route.transitAirport) {
        segments.push({
          id: `seg-${offerId}-1`,
          flightNumber: `${airline.code}-${100 + (index * 123) % 800}`,
          airline,
          originAirport: originApt,
          destinationAirport: destApt,
          departureAt: departureIso,
          arrivalAt: arrivalIso,
          durationMinutes: route.baseDurationMinutes,
          baggageAllowance: criteria.cabinClass === 'BUSINESS' || criteria.cabinClass === 'FIRST' ? '2x32kg' : '1x23kg'
        });
      } else {
        const transitApt = AIRPORT_FIXTURES.find(a => a.iataCode === route.transitAirport)!;
        const leg1Duration = Math.floor(route.baseDurationMinutes * 0.45);
        const layoverMinutes = 90;
        const leg2Duration = route.baseDurationMinutes - leg1Duration - layoverMinutes;

        const leg1ArrObj = new Date(depDateObj.getTime() + leg1Duration * 60 * 1000);
        const leg2DepObj = new Date(leg1ArrObj.getTime() + layoverMinutes * 60 * 1000);

        segments.push({
          id: `seg-${offerId}-1`,
          flightNumber: `${airline.code}-${200 + index * 10}`,
          airline,
          originAirport: originApt,
          destinationAirport: transitApt,
          departureAt: departureIso,
          arrivalAt: leg1ArrObj.toISOString(),
          durationMinutes: leg1Duration,
          baggageAllowance: '1x23kg'
        });

        segments.push({
          id: `seg-${offerId}-2`,
          flightNumber: `${airline.code}-${201 + index * 10}`,
          airline,
          originAirport: transitApt,
          destinationAirport: destApt,
          departureAt: leg2DepObj.toISOString(),
          arrivalAt: arrivalIso,
          durationMinutes: leg2Duration,
          baggageAllowance: '1x23kg'
        });
      }

      const offer: FlightOffer = {
        id: offerId,
        supplierId: this.supplierId,
        supplierOfferReference: offerRef,
        originAirport: originApt,
        destinationAirport: destApt,
        departureAt: departureIso,
        arrivalAt: arrivalIso,
        totalDurationMinutes: route.baseDurationMinutes,
        stopCount: route.isDirect ? 0 : 1,
        segments,
        cabinClass: criteria.cabinClass,
        baseFare: totalBaseFare,
        markupAmount,
        totalAmount,
        currency: DEFAULT_CURRENCY,
        inventorySource: MOCK_INVENTORY_SOURCE,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min hold
      };

      this.offerCache.set(offerRef, offer);
      this.offerCache.set(offerId, offer);
      offers.push(offer);
    });

    return offers;
  }

  async getOfferDetails(offerRef: string): Promise<FlightOffer | null> {
    return this.offerCache.get(offerRef) || null;
  }

  async validateFare(offerRef: string, _passengerCount: number): Promise<FareValidationResult> {
    const offer = await this.getOfferDetails(offerRef);
    if (!offer) {
      return { valid: false, priceChanged: false, availabilityChanged: true, reason: 'Offer expired or not found' };
    }
    return {
      valid: true,
      priceChanged: false,
      availabilityChanged: false
    };
  }

  async createReservation(request: CreateReservationRequest): Promise<ReservationResult> {
    const offer = await this.getOfferDetails(request.offerReference);
    if (!offer) {
      return { success: false, failureReason: 'Selected flight offer no longer available' };
    }

    // Generate mock 6-character alphanumeric PNR (e.g. 7X9K2P)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const supplierBookingReference = `SIM-${Date.now()}-${pnr}`;

    return {
      success: true,
      supplierBookingReference,
      pnr
    };
  }

  async issueTicket(supplierBookingRef: string): Promise<TicketIssuanceResult> {
    // Generate mock 13-digit ticket numbers with 001-DEMO prefix
    const ticketNumber = `001-DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return {
      success: true,
      ticketNumbers: [ticketNumber]
    };
  }

  async cancelReservation(supplierBookingRef: string): Promise<SupplierCancellationResult> {
    return {
      success: true,
      cancellationReference: `CANC-${supplierBookingRef}`
    };
  }
}
