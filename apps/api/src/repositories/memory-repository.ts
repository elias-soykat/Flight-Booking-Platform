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
  AuditLogEntity,
  AgencyInvitationStatus
} from '@travel-platform/shared';

export class MemoryRepository implements IAppRepository {
  private usersStore = new Map<string, UserEntity>();
  private agenciesStore = new Map<string, AgencyEntity>();
  private membersStore = new Map<string, AgencyMemberEntity>();
  private invitationsStore = new Map<string, AgencyInvitationEntity>();
  private bookingsStore = new Map<string, BookingEntity>();
  private paymentsStore = new Map<string, PaymentAttemptEntity>();
  private ticketsStore = new Map<string, TicketEntity>();
  private cancellationsStore = new Map<string, CancellationRequestEntity>();
  private auditStore = new Map<string, AuditLogEntity>();

  public readonly users: IUserRepository = {
    createUser: async (user) => {
      const now = new Date().toISOString();
      const entity: UserEntity = {
        ...user,
        createdAt: now,
        updatedAt: now
      };
      this.usersStore.set(user.id, entity);
      return entity;
    },
    getUserById: async (id) => this.usersStore.get(id) || null,
    getUserByEmail: async (email) => {
      for (const u of this.usersStore.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      return null;
    },
    updateUser: async (id, updates) => {
      const existing = this.usersStore.get(id);
      if (!existing) throw new Error(`User ${id} not found`);
      const updated: UserEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.usersStore.set(id, updated);
      return updated;
    }
  };

  public readonly agencies: IAgencyRepository = {
    createAgency: async (agency) => {
      const now = new Date().toISOString();
      const entity: AgencyEntity = { ...agency, createdAt: now, updatedAt: now };
      this.agenciesStore.set(agency.id, entity);
      return entity;
    },
    getAgencyById: async (id) => this.agenciesStore.get(id) || null,
    getAgencyByOwner: async (ownerUserId) => {
      for (const ag of this.agenciesStore.values()) {
        if (ag.ownerUserId === ownerUserId) return ag;
      }
      return null;
    },
    createMember: async (member) => {
      this.membersStore.set(member.id, member);
      return member;
    },
    getActiveMembershipForCustomer: async (customerUserId) => {
      for (const m of this.membersStore.values()) {
        if (m.customerUserId === customerUserId && m.status === 'ACTIVE') return m;
      }
      return null;
    },
    createInvitation: async (inv) => {
      this.invitationsStore.set(inv.id, inv);
      return inv;
    },
    getInvitationById: async (id) => this.invitationsStore.get(id) || null,
    getInvitationByTokenHash: async (tokenHash) => {
      for (const inv of this.invitationsStore.values()) {
        if (inv.tokenHash === tokenHash) return inv;
      }
      return null;
    },
    updateInvitationStatus: async (id, status) => {
      const inv = this.invitationsStore.get(id);
      if (!inv) throw new Error(`Invitation ${id} not found`);
      const updated: AgencyInvitationEntity = { ...inv, status };
      this.invitationsStore.set(id, updated);
      return updated;
    },
    listInvitationsForCustomer: async (email) => {
      const list: AgencyInvitationEntity[] = [];
      for (const inv of this.invitationsStore.values()) {
        if (inv.email.toLowerCase() === email.toLowerCase()) list.push(inv);
      }
      return list;
    },
    listMembersForAgency: async (agencyId) => {
      const list: AgencyMemberEntity[] = [];
      for (const m of this.membersStore.values()) {
        if (m.agencyId === agencyId) list.push(m);
      }
      return list;
    }
  };

  public readonly bookings: IBookingRepository = {
    createBooking: async (booking) => {
      this.bookingsStore.set(booking.id, booking);
      return booking;
    },
    getBookingById: async (id) => this.bookingsStore.get(id) || null,
    getBookingByReference: async (ref) => {
      for (const b of this.bookingsStore.values()) {
        if (b.bookingReference === ref) return b;
      }
      return null;
    },
    getBookingByIdempotencyKey: async (key) => {
      for (const b of this.bookingsStore.values()) {
        if (b.idempotencyKey === key) return b;
      }
      return null;
    },
    updateBooking: async (id, updates) => {
      const existing = this.bookingsStore.get(id);
      if (!existing) throw new Error(`Booking ${id} not found`);
      const updated: BookingEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.bookingsStore.set(id, updated);
      return updated;
    },
    listBookingsForCustomer: async (customerUserId) => {
      const list: BookingEntity[] = [];
      for (const b of this.bookingsStore.values()) {
        if (b.customerUserId === customerUserId) list.push(b);
      }
      return list;
    },
    listBookingsForAgency: async (agencyId) => {
      const list: BookingEntity[] = [];
      for (const b of this.bookingsStore.values()) {
        if (b.agencyId === agencyId) list.push(b);
      }
      return list;
    },
    listAllBookings: async () => Array.from(this.bookingsStore.values()),
    addBookingEvent: async (bookingId, event) => {
      const booking = this.bookingsStore.get(bookingId);
      if (booking) {
        booking.events.push(event);
      }
      return event;
    }
  };

  public readonly payments: IPaymentRepository = {
    createPayment: async (payment) => {
      this.paymentsStore.set(payment.id, payment);
      return payment;
    },
    getPaymentById: async (id) => this.paymentsStore.get(id) || null,
    getPaymentByReference: async (ref) => {
      for (const p of this.paymentsStore.values()) {
        if (p.paymentReference === ref) return p;
      }
      return null;
    },
    getPaymentByIdempotencyKey: async (key) => {
      for (const p of this.paymentsStore.values()) {
        if (p.idempotencyKey === key) return p;
      }
      return null;
    },
    updatePayment: async (id, updates) => {
      const existing = this.paymentsStore.get(id);
      if (!existing) throw new Error(`Payment ${id} not found`);
      const updated: PaymentAttemptEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.paymentsStore.set(id, updated);
      return updated;
    },
    listPaymentsForBooking: async (bookingId) => {
      const list: PaymentAttemptEntity[] = [];
      for (const p of this.paymentsStore.values()) {
        if (p.bookingId === bookingId) list.push(p);
      }
      return list;
    },
    listUnreconciledPayments: async () => {
      const list: PaymentAttemptEntity[] = [];
      for (const p of this.paymentsStore.values()) {
        if (p.status === 'UNKNOWN' || p.scenario === 'TIMEOUT') list.push(p);
      }
      return list;
    },
    listAllPayments: async () => Array.from(this.paymentsStore.values())
  };

  public readonly tickets: ITicketRepository = {
    createTickets: async (tickets) => {
      for (const t of tickets) {
        this.ticketsStore.set(t.id, t);
      }
      return tickets;
    },
    getTicketsByBookingId: async (bookingId) => {
      const list: TicketEntity[] = [];
      for (const t of this.ticketsStore.values()) {
        if (t.bookingId === bookingId) list.push(t);
      }
      return list;
    },
    getTicketByNumber: async (ticketNumber) => {
      for (const t of this.ticketsStore.values()) {
        if (t.ticketNumber === ticketNumber) return t;
      }
      return null;
    },
    listAllTickets: async () => Array.from(this.ticketsStore.values())
  };

  public readonly cancellations: ICancellationRepository = {
    createCancellationRequest: async (req) => {
      this.cancellationsStore.set(req.id, req);
      return req;
    },
    getCancellationRequestById: async (id) => this.cancellationsStore.get(id) || null,
    getCancellationRequestByBookingId: async (bookingId) => {
      for (const c of this.cancellationsStore.values()) {
        if (c.bookingId === bookingId) return c;
      }
      return null;
    },
    updateCancellationRequest: async (id, updates) => {
      const existing = this.cancellationsStore.get(id);
      if (!existing) throw new Error(`Cancellation request ${id} not found`);
      const updated: CancellationRequestEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.cancellationsStore.set(id, updated);
      return updated;
    },
    listPendingRequests: async () => {
      const list: CancellationRequestEntity[] = [];
      for (const c of this.cancellationsStore.values()) {
        if (c.status === 'PENDING') list.push(c);
      }
      return list;
    },
    listAllRequests: async () => Array.from(this.cancellationsStore.values())
  };

  public readonly audit: IAuditRepository = {
    logAction: async (entry) => {
      this.auditStore.set(entry.id, entry);
      return entry;
    },
    listLogs: async (limit = 100) => {
      const list = Array.from(this.auditStore.values());
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list.slice(0, limit);
    }
  };

  public async clear(): Promise<void> {
    this.usersStore.clear();
    this.agenciesStore.clear();
    this.membersStore.clear();
    this.invitationsStore.clear();
    this.bookingsStore.clear();
    this.paymentsStore.clear();
    this.ticketsStore.clear();
    this.cancellationsStore.clear();
    this.auditStore.clear();
  }
}
