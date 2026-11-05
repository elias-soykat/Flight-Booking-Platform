import type {
  UserRole,
  AccountStatus,
  AgencyStatus,
  AgencyMembershipStatus,
  AgencyInvitationStatus,
  BookingStatus,
  BookingEntity,
  BookingPassengerEntity,
  BookingEventEntity,
  PaymentAttemptEntity,
  PaymentStatus,
  TicketEntity,
  CancellationRequestEntity,
  AuditLogEntity
} from '@travel-platform/shared';

export interface UserEntity {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  status: AccountStatus;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyEntity {
  id: string;
  name: string;
  ownerUserId: string;
  status: AgencyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyMemberEntity {
  id: string;
  agencyId: string;
  customerUserId: string;
  status: AgencyMembershipStatus;
  associatedAt: string;
}

export interface AgencyInvitationEntity {
  id: string;
  agencyId: string;
  email: string;
  invitedByUserId: string;
  tokenHash: string;
  status: AgencyInvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface IUserRepository {
  createUser(user: Omit<UserEntity, 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  getUserById(id: string): Promise<UserEntity | null>;
  getUserByEmail(email: string): Promise<UserEntity | null>;
  updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity>;
}

export interface IAgencyRepository {
  createAgency(agency: Omit<AgencyEntity, 'createdAt' | 'updatedAt'>): Promise<AgencyEntity>;
  getAgencyById(id: string): Promise<AgencyEntity | null>;
  getAgencyByOwner(ownerUserId: string): Promise<AgencyEntity | null>;
  createMember(member: AgencyMemberEntity): Promise<AgencyMemberEntity>;
  getActiveMembershipForCustomer(customerUserId: string): Promise<AgencyMemberEntity | null>;
  createInvitation(invitation: AgencyInvitationEntity): Promise<AgencyInvitationEntity>;
  getInvitationById(id: string): Promise<AgencyInvitationEntity | null>;
  getInvitationByTokenHash(tokenHash: string): Promise<AgencyInvitationEntity | null>;
  updateInvitationStatus(id: string, status: AgencyInvitationStatus): Promise<AgencyInvitationEntity>;
  listInvitationsForCustomer(email: string): Promise<AgencyInvitationEntity[]>;
  listMembersForAgency(agencyId: string): Promise<AgencyMemberEntity[]>;
}

export interface IBookingRepository {
  createBooking(booking: BookingEntity): Promise<BookingEntity>;
  getBookingById(id: string): Promise<BookingEntity | null>;
  getBookingByReference(bookingReference: string): Promise<BookingEntity | null>;
  getBookingByIdempotencyKey(key: string): Promise<BookingEntity | null>;
  updateBooking(id: string, updates: Partial<BookingEntity>): Promise<BookingEntity>;
  listBookingsForCustomer(customerUserId: string): Promise<BookingEntity[]>;
  listBookingsForAgency(agencyId: string): Promise<BookingEntity[]>;
  listAllBookings(): Promise<BookingEntity[]>;
  addBookingEvent(bookingId: string, event: BookingEventEntity): Promise<BookingEventEntity>;
}

export interface IPaymentRepository {
  createPayment(payment: PaymentAttemptEntity): Promise<PaymentAttemptEntity>;
  getPaymentById(id: string): Promise<PaymentAttemptEntity | null>;
  getPaymentByReference(ref: string): Promise<PaymentAttemptEntity | null>;
  getPaymentByIdempotencyKey(key: string): Promise<PaymentAttemptEntity | null>;
  updatePayment(id: string, updates: Partial<PaymentAttemptEntity>): Promise<PaymentAttemptEntity>;
  listPaymentsForBooking(bookingId: string): Promise<PaymentAttemptEntity[]>;
  listUnreconciledPayments(): Promise<PaymentAttemptEntity[]>;
  listAllPayments(): Promise<PaymentAttemptEntity[]>;
}

export interface ITicketRepository {
  createTickets(tickets: TicketEntity[]): Promise<TicketEntity[]>;
  getTicketsByBookingId(bookingId: string): Promise<TicketEntity[]>;
  getTicketByNumber(ticketNumber: string): Promise<TicketEntity | null>;
  listAllTickets(): Promise<TicketEntity[]>;
}

export interface ICancellationRepository {
  createCancellationRequest(req: CancellationRequestEntity): Promise<CancellationRequestEntity>;
  getCancellationRequestById(id: string): Promise<CancellationRequestEntity | null>;
  getCancellationRequestByBookingId(bookingId: string): Promise<CancellationRequestEntity | null>;
  updateCancellationRequest(id: string, updates: Partial<CancellationRequestEntity>): Promise<CancellationRequestEntity>;
  listPendingRequests(): Promise<CancellationRequestEntity[]>;
  listAllRequests(): Promise<CancellationRequestEntity[]>;
}

export interface IAuditRepository {
  logAction(entry: AuditLogEntity): Promise<AuditLogEntity>;
  listLogs(limit?: number): Promise<AuditLogEntity[]>;
}

export interface IAppRepository {
  readonly users: IUserRepository;
  readonly agencies: IAgencyRepository;
  readonly bookings: IBookingRepository;
  readonly payments: IPaymentRepository;
  readonly tickets: ITicketRepository;
  readonly cancellations: ICancellationRepository;
  readonly audit: IAuditRepository;
  clear(): Promise<void>;
}
