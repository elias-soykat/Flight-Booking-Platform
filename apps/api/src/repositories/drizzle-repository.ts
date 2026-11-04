import { eq, desc, and } from 'drizzle-orm';
import {
  createDbClient,
  users,
  agencies,
  agencyMembers,
  agencyInvitations,
  bookings,
  bookingPassengers,
  bookingEvents,
  payments,
  paymentAttempts,
  tickets,
  cancellationRequests,
  auditLogs
} from '@travel-platform/db';
import type {
  IAppRepository,
  IUserRepository,
  IAgencyRepository,
  IBookingRepository,
  IPaymentRepository,
  ITicketRepository,
  ICancellationRepository,
  IAuditRepository,
  UserEntity,
  AgencyEntity,
  AgencyMemberEntity,
  AgencyInvitationEntity
} from './types';
import type {
  BookingEntity,
  BookingEventEntity,
  PaymentAttemptEntity,
  TicketEntity,
  CancellationRequestEntity,
  AuditLogEntity
} from '@travel-platform/shared';

export class DrizzleRepository implements IAppRepository {
  private db: ReturnType<typeof createDbClient>;

  constructor(connectionString: string) {
    this.db = createDbClient(connectionString);
  }

  public readonly users: IUserRepository = {
    createUser: async (user) => {
      const inserted = await this.db
        .insert(users)
        .values({
          id: user.id,
          email: user.email,
          fullName: user.fullName || null,
          role: user.role,
          status: user.status
        })
        .returning();
      const r = inserted[0];
      return {
        id: r.id,
        email: r.email,
        fullName: r.fullName || undefined,
        role: r.role as any,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    },
    getUserById: async (id) => {
      const rows = await this.db.select().from(users).where(eq(users.id, id));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        email: r.email,
        fullName: r.fullName || undefined,
        role: r.role as any,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    },
    getUserByEmail: async (email) => {
      const rows = await this.db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        email: r.email,
        fullName: r.fullName || undefined,
        role: r.role as any,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    },
    updateUser: async (id, updates) => {
      const updated = await this.db
        .update(users)
        .set({
          fullName: updates.fullName,
          role: updates.role as any,
          status: updates.status as any,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      const r = updated[0];
      return {
        id: r.id,
        email: r.email,
        fullName: r.fullName || undefined,
        role: r.role as any,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    }
  };

  public readonly agencies: IAgencyRepository = {
    createAgency: async (agency) => {
      const inserted = await this.db
        .insert(agencies)
        .values({
          id: agency.id,
          name: agency.name,
          ownerUserId: agency.ownerUserId,
          status: agency.status
        })
        .returning();
      const r = inserted[0];
      return {
        id: r.id,
        name: r.name,
        ownerUserId: r.ownerUserId,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    },
    getAgencyById: async (id) => {
      const rows = await this.db.select().from(agencies).where(eq(agencies.id, id));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        ownerUserId: r.ownerUserId,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    },
    getAgencyByOwner: async (ownerUserId) => {
      const rows = await this.db.select().from(agencies).where(eq(agencies.ownerUserId, ownerUserId));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        ownerUserId: r.ownerUserId,
        status: r.status as any,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    },
    createMember: async (member) => {
      const inserted = await this.db
        .insert(agencyMembers)
        .values({
          id: member.id,
          agencyId: member.agencyId,
          customerUserId: member.customerUserId,
          status: member.status
        })
        .returning();
      const r = inserted[0];
      return {
        id: r.id,
        agencyId: r.agencyId,
        customerUserId: r.customerUserId,
        status: r.status as any,
        associatedAt: r.associatedAt.toISOString()
      };
    },
    getActiveMembershipForCustomer: async (customerUserId) => {
      const rows = await this.db
        .select()
        .from(agencyMembers)
        .where(and(eq(agencyMembers.customerUserId, customerUserId), eq(agencyMembers.status, 'ACTIVE')));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        agencyId: r.agencyId,
        customerUserId: r.customerUserId,
        status: r.status as any,
        associatedAt: r.associatedAt.toISOString()
      };
    },
    createInvitation: async (inv) => {
      const inserted = await this.db
        .insert(agencyInvitations)
        .values({
          id: inv.id,
          agencyId: inv.agencyId,
          email: inv.email,
          invitedByUserId: inv.invitedByUserId,
          tokenHash: inv.tokenHash,
          status: inv.status,
          expiresAt: new Date(inv.expiresAt)
        })
        .returning();
      const r = inserted[0];
      return {
        id: r.id,
        agencyId: r.agencyId,
        email: r.email,
        invitedByUserId: r.invitedByUserId,
        tokenHash: r.tokenHash,
        status: r.status as any,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString()
      };
    },
    getInvitationById: async (id) => {
      const rows = await this.db.select().from(agencyInvitations).where(eq(agencyInvitations.id, id));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        agencyId: r.agencyId,
        email: r.email,
        invitedByUserId: r.invitedByUserId,
        tokenHash: r.tokenHash,
        status: r.status as any,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString()
      };
    },
    getInvitationByTokenHash: async (tokenHash) => {
      const rows = await this.db.select().from(agencyInvitations).where(eq(agencyInvitations.tokenHash, tokenHash));
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        agencyId: r.agencyId,
        email: r.email,
        invitedByUserId: r.invitedByUserId,
        tokenHash: r.tokenHash,
        status: r.status as any,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString()
      };
    },
    updateInvitationStatus: async (id, status) => {
      const updated = await this.db
        .update(agencyInvitations)
        .set({ status: status as any })
        .where(eq(agencyInvitations.id, id))
        .returning();
      const r = updated[0];
      return {
        id: r.id,
        agencyId: r.agencyId,
        email: r.email,
        invitedByUserId: r.invitedByUserId,
        tokenHash: r.tokenHash,
        status: r.status as any,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString()
      };
    },
    listInvitationsForCustomer: async (email) => {
      const rows = await this.db
        .select()
        .from(agencyInvitations)
        .where(eq(agencyInvitations.email, email.toLowerCase()));
      return rows.map((r) => ({
        id: r.id,
        agencyId: r.agencyId,
        email: r.email,
        invitedByUserId: r.invitedByUserId,
        tokenHash: r.tokenHash,
        status: r.status as any,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString()
      }));
    },
    listMembersForAgency: async (agencyId) => {
      const rows = await this.db.select().from(agencyMembers).where(eq(agencyMembers.agencyId, agencyId));
      return rows.map((r) => ({
        id: r.id,
        agencyId: r.agencyId,
        customerUserId: r.customerUserId,
        status: r.status as any,
        associatedAt: r.associatedAt.toISOString()
      }));
    }
  };

  public readonly bookings: IBookingRepository = {
    createBooking: async (booking) => {
      return await this.db.transaction(async (tx) => {
        const [b] = await tx
          .insert(bookings)
          .values({
            id: booking.id,
            bookingReference: booking.bookingReference,
            customerUserId: booking.customerUserId,
            createdByUserId: booking.createdByUserId,
            agencyId: booking.agencyId || null,
            supplierId: booking.supplierId,
            inventorySource: booking.inventorySource,
            supplierBookingReference: booking.supplierBookingReference,
            pnr: booking.pnr,
            bookingStatus: booking.bookingStatus as any,
            currency: booking.currency,
            baseFare: booking.baseFare.toString(),
            markupAmount: booking.markupAmount.toString(),
            totalAmount: booking.totalAmount.toString(),
            idempotencyKey: booking.idempotencyKey,
            flightOfferSnapshot: booking.flightOffer as any
          })
          .returning();

        for (const pax of booking.passengers) {
          await tx.insert(bookingPassengers).values({
            id: pax.id,
            bookingId: b.id,
            passengerType: pax.passengerType as any,
            firstName: pax.firstName,
            lastName: pax.lastName,
            dateOfBirth: pax.dateOfBirth,
            passportDetailsReference: pax.passportNumber || null
          });
        }

        return booking;
      });
    },
    getBookingById: async (id) => {
      const [b] = await this.db.select().from(bookings).where(eq(bookings.id, id));
      if (!b) return null;
      const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, id));
      const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, id));
      return this.mapBookingEntity(b, paxRows, evtRows);
    },
    getBookingByReference: async (ref) => {
      const [b] = await this.db.select().from(bookings).where(eq(bookings.bookingReference, ref));
      if (!b) return null;
      const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, b.id));
      const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, b.id));
      return this.mapBookingEntity(b, paxRows, evtRows);
    },
    getBookingByIdempotencyKey: async (key) => {
      const [b] = await this.db.select().from(bookings).where(eq(bookings.idempotencyKey, key));
      if (!b) return null;
      const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, b.id));
      const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, b.id));
      return this.mapBookingEntity(b, paxRows, evtRows);
    },
    updateBooking: async (id, updates) => {
      const [updated] = await this.db
        .update(bookings)
        .set({
          bookingStatus: updates.bookingStatus ? (updates.bookingStatus as any) : undefined,
          pnr: updates.pnr,
          supplierBookingReference: updates.supplierBookingReference,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, id))
        .returning();
      const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, id));
      const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, id));
      return this.mapBookingEntity(updated, paxRows, evtRows);
    },
    listBookingsForCustomer: async (customerUserId) => {
      const bRows = await this.db.select().from(bookings).where(eq(bookings.customerUserId, customerUserId));
      const result: BookingEntity[] = [];
      for (const b of bRows) {
        const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, b.id));
        const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, b.id));
        result.push(this.mapBookingEntity(b, paxRows, evtRows));
      }
      return result;
    },
    listBookingsForAgency: async (agencyId) => {
      const bRows = await this.db.select().from(bookings).where(eq(bookings.agencyId, agencyId));
      const result: BookingEntity[] = [];
      for (const b of bRows) {
        const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, b.id));
        const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, b.id));
        result.push(this.mapBookingEntity(b, paxRows, evtRows));
      }
      return result;
    },
    listAllBookings: async () => {
      const bRows = await this.db.select().from(bookings);
      const result: BookingEntity[] = [];
      for (const b of bRows) {
        const paxRows = await this.db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, b.id));
        const evtRows = await this.db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, b.id));
        result.push(this.mapBookingEntity(b, paxRows, evtRows));
      }
      return result;
    },
    addBookingEvent: async (event) => {
      const [inserted] = await this.db
        .insert(bookingEvents)
        .values({
          id: event.id,
          bookingId: event.bookingId,
          eventType: event.eventType,
          previousStatus: event.previousStatus,
          newStatus: event.newStatus,
          actorUserId: event.actorUserId || null,
          metadata: event.metadata as any
        })
        .returning();
      return {
        id: inserted.id,
        eventType: inserted.eventType,
        previousStatus: inserted.previousStatus,
        newStatus: inserted.newStatus,
        actorUserId: inserted.actorUserId || undefined,
        metadata: inserted.metadata as any,
        createdAt: inserted.createdAt.toISOString()
      };
    }
  };

  public readonly payments: IPaymentRepository = {
    createPayment: async (payment) => {
      const [p] = await this.db
        .insert(payments)
        .values({
          id: payment.id,
          bookingId: payment.bookingId,
          paymentReference: payment.paymentReference,
          amount: payment.amount.toString(),
          currency: payment.currency,
          paymentStatus: payment.status as any
        })
        .returning();

      await this.db.insert(paymentAttempts).values({
        id: payment.id,
        paymentId: p.id,
        idempotencyKey: payment.idempotencyKey,
        result: payment.scenario,
        failureReason: payment.failureReason || null
      });

      return payment;
    },
    getPaymentById: async (id) => {
      const [p] = await this.db.select().from(payments).where(eq(payments.id, id));
      if (!p) return null;
      return this.mapPaymentEntity(p);
    },
    getPaymentByReference: async (ref) => {
      const [p] = await this.db.select().from(payments).where(eq(payments.paymentReference, ref));
      if (!p) return null;
      return this.mapPaymentEntity(p);
    },
    getPaymentByIdempotencyKey: async (key) => {
      const [attempt] = await this.db.select().from(paymentAttempts).where(eq(paymentAttempts.idempotencyKey, key));
      if (!attempt) return null;
      const [p] = await this.db.select().from(payments).where(eq(payments.id, attempt.paymentId));
      if (!p) return null;
      return this.mapPaymentEntity(p, attempt);
    },
    updatePayment: async (id, updates) => {
      const [p] = await this.db
        .update(payments)
        .set({
          paymentStatus: updates.status ? (updates.status as any) : undefined,
          updatedAt: new Date()
        })
        .where(eq(payments.id, id))
        .returning();
      return this.mapPaymentEntity(p);
    },
    listPaymentsForBooking: async (bookingId) => {
      const rows = await this.db.select().from(payments).where(eq(payments.bookingId, bookingId));
      return rows.map((r) => this.mapPaymentEntity(r));
    },
    listUnreconciledPayments: async () => {
      const rows = await this.db.select().from(payments).where(eq(payments.paymentStatus, 'UNKNOWN'));
      return rows.map((r) => this.mapPaymentEntity(r));
    },
    listAllPayments: async () => {
      const rows = await this.db.select().from(payments);
      return rows.map((r) => this.mapPaymentEntity(r));
    }
  };

  public readonly tickets: ITicketRepository = {
    createTickets: async (tkts) => {
      for (const t of tkts) {
        await this.db.insert(tickets).values({
          id: t.id,
          bookingId: t.bookingId,
          passengerId: t.passengerId,
          ticketNumber: t.ticketNumber,
          issuanceMethod: t.issuanceMethod as any,
          issuedBy: t.issuedByUserId || null
        });
      }
      return tkts;
    },
    getTicketsByBookingId: async (bookingId) => {
      const rows = await this.db.select().from(tickets).where(eq(tickets.bookingId, bookingId));
      return rows.map((r) => ({
        id: r.id,
        bookingId: r.bookingId,
        passengerId: r.passengerId,
        passengerName: '',
        ticketNumber: r.ticketNumber,
        issuanceMethod: r.issuanceMethod as any,
        issuedByUserId: r.issuedBy || undefined,
        issuedAt: r.issuedAt.toISOString()
      }));
    },
    getTicketByNumber: async (ticketNumber) => {
      const [r] = await this.db.select().from(tickets).where(eq(tickets.ticketNumber, ticketNumber));
      if (!r) return null;
      return {
        id: r.id,
        bookingId: r.bookingId,
        passengerId: r.passengerId,
        passengerName: '',
        ticketNumber: r.ticketNumber,
        issuanceMethod: r.issuanceMethod as any,
        issuedByUserId: r.issuedBy || undefined,
        issuedAt: r.issuedAt.toISOString()
      };
    },
    listAllTickets: async () => {
      const rows = await this.db.select().from(tickets);
      return rows.map((r) => ({
        id: r.id,
        bookingId: r.bookingId,
        passengerId: r.passengerId,
        passengerName: '',
        ticketNumber: r.ticketNumber,
        issuanceMethod: r.issuanceMethod as any,
        issuedByUserId: r.issuedBy || undefined,
        issuedAt: r.issuedAt.toISOString()
      }));
    }
  };

  public readonly cancellations: ICancellationRepository = {
    createCancellationRequest: async (req) => {
      const [c] = await this.db
        .insert(cancellationRequests)
        .values({
          id: req.id,
          bookingId: req.bookingId,
          requestedByUserId: req.requestedByUserId,
          reason: req.reason,
          status: req.status as any,
          previousBookingStatus: req.previousBookingStatus as any
        })
        .returning();
      return {
        id: c.id,
        bookingId: c.bookingId,
        bookingReference: req.bookingReference,
        requestedByUserId: c.requestedByUserId,
        reason: c.reason,
        status: c.status as any,
        previousBookingStatus: c.previousBookingStatus as any,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      };
    },
    getCancellationRequestById: async (id) => {
      const [c] = await this.db.select().from(cancellationRequests).where(eq(cancellationRequests.id, id));
      if (!c) return null;
      return this.mapCancellationEntity(c);
    },
    getCancellationRequestByBookingId: async (bookingId) => {
      const [c] = await this.db
        .select()
        .from(cancellationRequests)
        .where(eq(cancellationRequests.bookingId, bookingId));
      if (!c) return null;
      return this.mapCancellationEntity(c);
    },
    updateCancellationRequest: async (id, updates) => {
      const [c] = await this.db
        .update(cancellationRequests)
        .set({
          status: updates.status ? (updates.status as any) : undefined,
          reviewedByUserId: updates.reviewedByUserId || null,
          reviewedAt: updates.reviewedAt ? new Date(updates.reviewedAt) : null,
          reviewNote: updates.reviewNote || null,
          updatedAt: new Date()
        })
        .where(eq(cancellationRequests.id, id))
        .returning();
      return this.mapCancellationEntity(c);
    },
    listPendingRequests: async () => {
      const rows = await this.db
        .select()
        .from(cancellationRequests)
        .where(eq(cancellationRequests.status, 'PENDING'));
      return rows.map((r) => this.mapCancellationEntity(r));
    },
    listAllRequests: async () => {
      const rows = await this.db.select().from(cancellationRequests);
      return rows.map((r) => this.mapCancellationEntity(r));
    }
  };

  public readonly audit: IAuditRepository = {
    logAction: async (entry) => {
      const [a] = await this.db
        .insert(auditLogs)
        .values({
          id: entry.id,
          actorUserId: entry.actorUserId || null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata as any
        })
        .returning();
      return {
        id: a.id,
        actorUserId: a.actorUserId || undefined,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: a.metadata as any,
        createdAt: a.createdAt.toISOString()
      };
    },
    listLogs: async (limit = 100) => {
      const rows = await this.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
      return rows.map((r) => ({
        id: r.id,
        actorUserId: r.actorUserId || undefined,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        metadata: r.metadata as any,
        createdAt: r.createdAt.toISOString()
      }));
    }
  };

  public async clear(): Promise<void> {
    // Used in tests to truncate tables
    await this.db.delete(auditLogs);
    await this.db.delete(cancellationRequests);
    await this.db.delete(tickets);
    await this.db.delete(paymentAttempts);
    await this.db.delete(payments);
    await this.db.delete(bookingEvents);
    await this.db.delete(bookingPassengers);
    await this.db.delete(bookings);
    await this.db.delete(agencyInvitations);
    await this.db.delete(agencyMembers);
    await this.db.delete(agencies);
    await this.db.delete(users);
  }

  private mapBookingEntity(b: any, paxRows: any[], evtRows: any[]): BookingEntity {
    return {
      id: b.id,
      bookingReference: b.bookingReference,
      customerUserId: b.customerUserId,
      createdByUserId: b.createdByUserId,
      agencyId: b.agencyId || undefined,
      supplierId: b.supplierId,
      inventorySource: b.inventorySource,
      supplierBookingReference: b.supplierBookingReference || '',
      pnr: b.pnr || '',
      bookingStatus: b.bookingStatus,
      currency: b.currency,
      baseFare: Number(b.baseFare),
      markupAmount: Number(b.markupAmount),
      totalAmount: Number(b.totalAmount),
      idempotencyKey: b.idempotencyKey,
      flightOffer: (b.flightOfferSnapshot as any) || {},
      passengers: paxRows.map((p) => ({
        id: p.id,
        passengerType: p.passengerType,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        passportNumber: p.passportDetailsReference || undefined
      })),
      events: evtRows.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        actorUserId: e.actorUserId || undefined,
        metadata: e.metadata || undefined,
        createdAt: e.createdAt.toISOString()
      })),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString()
    };
  }

  private mapPaymentEntity(p: any, attempt?: any): PaymentAttemptEntity {
    return {
      id: p.id,
      bookingId: p.bookingId,
      paymentReference: p.paymentReference,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.paymentStatus,
      scenario: (attempt?.result as any) || 'SUCCESS',
      failureReason: attempt?.failureReason || undefined,
      idempotencyKey: attempt?.idempotencyKey || '',
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    };
  }

  private mapCancellationEntity(c: any): CancellationRequestEntity {
    return {
      id: c.id,
      bookingId: c.bookingId,
      bookingReference: '',
      requestedByUserId: c.requestedByUserId,
      reason: c.reason,
      status: c.status,
      previousBookingStatus: c.previousBookingStatus,
      reviewedByUserId: c.reviewedByUserId || undefined,
      reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : undefined,
      reviewNote: c.reviewNote || undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    };
  }
}
