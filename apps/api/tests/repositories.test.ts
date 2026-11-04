import { describe, it, expect, beforeEach } from 'vitest';
import { getRepository } from '../src/repositories';
import type { IAppRepository } from '../src/repositories/types';
import type { BookingEntity, FlightOffer } from '@travel-platform/shared';

describe('Repository Layer Contract & Persistence', () => {
  let repo: IAppRepository;

  beforeEach(async () => {
    repo = getRepository({});
    await repo.clear();
  });

  describe('User Repository', () => {
    it('creates and retrieves user by id and email', async () => {
      const created = await repo.users.createUser({
        id: 'usr-test-1',
        email: 'traveler@example.com',
        fullName: 'John Traveler',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });

      expect(created.id).toBe('usr-test-1');
      expect(created.email).toBe('traveler@example.com');

      const byId = await repo.users.getUserById('usr-test-1');
      expect(byId?.email).toBe('traveler@example.com');

      const byEmail = await repo.users.getUserByEmail('traveler@example.com');
      expect(byEmail?.id).toBe('usr-test-1');

      const updated = await repo.users.updateUser('usr-test-1', { fullName: 'John Updated' });
      expect(updated.fullName).toBe('John Updated');
    });
  });

  describe('Agency & Membership Repository', () => {
    it('creates agency and associates customer', async () => {
      const agency = await repo.agencies.createAgency({
        id: 'ag-test-1',
        name: 'Horizon Travels',
        ownerUserId: 'owner-1',
        status: 'ACTIVE'
      });
      expect(agency.id).toBe('ag-test-1');

      const member = await repo.agencies.createMember({
        id: 'mem-test-1',
        agencyId: agency.id,
        customerUserId: 'cust-1',
        status: 'ACTIVE',
        associatedAt: new Date().toISOString()
      });
      expect(member.status).toBe('ACTIVE');

      const active = await repo.agencies.getActiveMembershipForCustomer('cust-1');
      expect(active?.agencyId).toBe(agency.id);
    });

    it('manages invitation lifecycle with token hashing', async () => {
      const invitation = await repo.agencies.createInvitation({
        id: 'inv-1',
        agencyId: 'ag-test-1',
        email: 'client@example.com',
        invitedByUserId: 'owner-1',
        tokenHash: 'hashed-token-xyz',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString()
      });

      const found = await repo.agencies.getInvitationByTokenHash('hashed-token-xyz');
      expect(found?.id).toBe('inv-1');

      const accepted = await repo.agencies.updateInvitationStatus('inv-1', 'ACCEPTED');
      expect(accepted.status).toBe('ACCEPTED');
    });
  });

  describe('Booking Repository', () => {
    const mockOffer: FlightOffer = {
      id: 'offer-repo-1',
      supplierId: 'mock-supplier',
      supplierOfferReference: 'ref-123',
      originAirport: { id: 'jfk', iataCode: 'JFK', name: 'JFK Airport', city: 'New York', country: 'USA' },
      destinationAirport: { id: 'lhr', iataCode: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
      departureAt: new Date().toISOString(),
      arrivalAt: new Date().toISOString(),
      totalDurationMinutes: 420,
      stopCount: 0,
      segments: [],
      cabinClass: 'ECONOMY',
      baseFare: 500,
      markupAmount: 50,
      totalAmount: 550,
      currency: 'USD',
      inventorySource: 'MOCK',
      expiresAt: new Date().toISOString()
    };

    const mockBooking: BookingEntity = {
      id: 'book-repo-1',
      bookingReference: 'BK-REPO-001',
      customerUserId: 'cust-1',
      createdByUserId: 'cust-1',
      supplierId: 'mock-supplier',
      inventorySource: 'MOCK',
      supplierBookingReference: 'SUPP-001',
      pnr: 'PNR001',
      bookingStatus: 'PENDING',
      currency: 'USD',
      baseFare: 500,
      markupAmount: 50,
      totalAmount: 550,
      idempotencyKey: 'idem-repo-1',
      flightOffer: mockOffer,
      passengers: [
        {
          id: 'pax-1',
          passengerType: 'ADULT',
          firstName: 'Alice',
          lastName: 'Smith',
          dateOfBirth: '1990-01-01'
        }
      ],
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('creates, retrieves and updates booking by id, reference and idempotency key', async () => {
      const created = await repo.bookings.createBooking(mockBooking);
      expect(created.id).toBe('book-repo-1');

      const byRef = await repo.bookings.getBookingByReference('BK-REPO-001');
      expect(byRef?.id).toBe('book-repo-1');

      const byIdem = await repo.bookings.getBookingByIdempotencyKey('idem-repo-1');
      expect(byIdem?.id).toBe('book-repo-1');

      const updated = await repo.bookings.updateBooking('book-repo-1', { bookingStatus: 'TICKETED' });
      expect(updated.bookingStatus).toBe('TICKETED');

      const list = await repo.bookings.listBookingsForCustomer('cust-1');
      expect(list.length).toBe(1);
    });
  });

  describe('Payments & Tickets Repository', () => {
    it('creates payment attempt, updates status, and issues tickets', async () => {
      const payment = await repo.payments.createPayment({
        id: 'pay-repo-1',
        bookingId: 'book-repo-1',
        paymentReference: 'PAY-REPO-001',
        amount: 550,
        currency: 'USD',
        status: 'PROCESSING',
        scenario: 'SUCCESS',
        idempotencyKey: 'idem-pay-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      expect(payment.status).toBe('PROCESSING');

      const updated = await repo.payments.updatePayment('pay-repo-1', { status: 'SUCCEEDED' });
      expect(updated.status).toBe('SUCCEEDED');

      const tickets = await repo.tickets.createTickets([
        {
          id: 'tkt-repo-1',
          bookingId: 'book-repo-1',
          passengerId: 'pax-1',
          passengerName: 'Alice Smith',
          ticketNumber: '001-DEMO-1234567890',
          issuanceMethod: 'AUTOMATIC_SIMULATED',
          issuedAt: new Date().toISOString()
        }
      ]);
      expect(tickets.length).toBe(1);

      const byBooking = await repo.tickets.getTicketsByBookingId('book-repo-1');
      expect(byBooking.length).toBe(1);
      expect(byBooking[0].ticketNumber).toBe('001-DEMO-1234567890');
    });
  });

  describe('Cancellations & Audit Repository', () => {
    it('creates cancellation request and logs audit events', async () => {
      const cancelReq = await repo.cancellations.createCancellationRequest({
        id: 'cancel-repo-1',
        bookingId: 'book-repo-1',
        bookingReference: 'BK-REPO-001',
        requestedByUserId: 'cust-1',
        reason: 'Change of plans',
        status: 'PENDING',
        previousBookingStatus: 'TICKETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      expect(cancelReq.status).toBe('PENDING');

      const audit = await repo.audit.logAction({
        id: 'aud-repo-1',
        actorUserId: 'admin-1',
        action: 'CANCELLATION_REVIEWED',
        entityType: 'CANCELLATION_REQUEST',
        entityId: 'cancel-repo-1',
        createdAt: new Date().toISOString()
      });
      expect(audit.action).toBe('CANCELLATION_REVIEWED');

      const logs = await repo.audit.listLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
