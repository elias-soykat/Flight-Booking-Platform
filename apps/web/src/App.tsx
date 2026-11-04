import { useState, useEffect } from 'react';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { DEMO_USERS, type DemoUserSession } from './components/UserSwitcher';
import { AgencyPortal, type AgencyInfo, type AgencyInvitation, type AssociatedCustomer } from './components/AgencyPortal';
import { CustomerInvitations, type CustomerAgencyInvitation, type ActiveAgencyMembership } from './components/CustomerInvitations';
import { FlightSearchForm } from './components/FlightSearchForm';
import { FlightResults } from './components/FlightResults';
import { PassengerForm } from './components/PassengerForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { BookingsList } from './components/BookingsList';
import { PaymentModal } from './components/PaymentModal';
import { TicketView } from './components/TicketView';
import { CancellationModal } from './components/CancellationModal';
import { CancellationReviewQueue } from './components/CancellationReviewQueue';
import { AuditLogView } from './components/AuditLogView';
import type {
  FlightOffer,
  FlightSearchQuery,
  PassengerInput,
  BookingEntity,
  TicketEntity,
  PaymentAttemptEntity,
  CancellationRequestEntity,
  AuditLogEntity,
  AdminDashboardMetrics,
  SimulationScenario
} from '@travel-platform/shared';
import { apiClient } from './lib/api-client';
import { ShieldCheck, CheckCircle2, AlertCircle, Ticket, Clock, Check, RefreshCw, Activity } from 'lucide-react';

export const App = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [currentUser, setCurrentUser] = useState<DemoUserSession>(DEMO_USERS.CUSTOMER);

  // Flight search state
  const [searchCriteria, setSearchCriteria] = useState<FlightSearchQuery | null>({
    origin: 'JFK',
    destination: 'LHR',
    departureDate: '2026-12-01',
    passengerCount: 1,
    cabinClass: 'ECONOMY'
  });
  const [flightOffers, setFlightOffers] = useState<FlightOffer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null);

  // Booking state
  const [bookings, setBookings] = useState<BookingEntity[]>([]);
  const [activeBooking, setActiveBooking] = useState<BookingEntity | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Payment & Ticketing state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingForPayment, setBookingForPayment] = useState<BookingEntity | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [viewingTickets, setViewingTickets] = useState<{
    booking: BookingEntity;
    tickets: TicketEntity[];
  } | null>(null);

  // Admin Operational Queues & Metrics
  const [dashboardMetrics, setDashboardMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [pendingCancellations, setPendingCancellations] = useState<CancellationRequestEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>([]);
  const [ticketingQueue, setTicketingQueue] = useState<BookingEntity[]>([]);
  const [unreconciledPayments, setUnreconciledPayments] = useState<PaymentAttemptEntity[]>([]);
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null);

  // Cancellation Modal State
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [bookingForCancellation, setBookingForCancellation] = useState<BookingEntity | null>(null);

  // Agency demo state
  const [agency, setAgency] = useState<AgencyInfo | null>({
    id: 'agency-demo-1',
    name: 'SkyHigh Travels',
    ownerUserId: DEMO_USERS.AGENCY_OWNER.userId
  });
  const [agencyInvitations, setAgencyInvitations] = useState<AgencyInvitation[]>([
    {
      id: 'inv-1',
      email: 'alice@traveler.com',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      rawToken: 'demo-token-1234567890abcdef1234567890abcdef'
    }
  ]);
  const [associatedCustomers, setAssociatedCustomers] = useState<AssociatedCustomer[]>([
    {
      membershipId: 'mem-demo-1',
      customerUserId: DEMO_USERS.CUSTOMER.userId,
      email: DEMO_USERS.CUSTOMER.email,
      firstName: 'Alice',
      lastName: 'Traveler',
      associatedAt: new Date().toISOString()
    }
  ]);

  // Customer invitations state
  const [customerInvitations, setCustomerInvitations] = useState<CustomerAgencyInvitation[]>([
    {
      id: 'inv-1',
      agencyId: 'agency-demo-1',
      agencyName: 'SkyHigh Travels',
      email: 'alice@traveler.com',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ]);
  const [activeMembership, setActiveMembership] = useState<ActiveAgencyMembership | null>(null);

  // Initial search on load
  useEffect(() => {
    if (searchCriteria) {
      handleFlightSearch(searchCriteria);
    }
  }, []);

  // Fetch bookings when tab or user changes
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
    if (activeTab === 'admin' && currentUser.role === 'ADMIN') {
      fetchAdminDashboard();
    }
  }, [activeTab, currentUser]);

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const response = await apiClient.get<{ success: boolean; data: BookingEntity[] }>('/bookings', {
        headers: {
          'x-demo-user-id': currentUser.userId,
          'x-demo-role': currentUser.role
        }
      });
      setBookings(response.data || []);
    } catch {
      // Keep existing state in mock mode
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchAdminDashboard = async () => {
    try {
      const [dashRes, cancelRes, auditRes, qRes, pRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: AdminDashboardMetrics }>('/admin/dashboard', {
          headers: { 'x-demo-user-id': currentUser.userId, 'x-demo-role': 'ADMIN' }
        }).catch(() => null),
        apiClient.get<{ success: boolean; data: CancellationRequestEntity[] }>('/admin/cancellations', {
          headers: { 'x-demo-user-id': currentUser.userId, 'x-demo-role': 'ADMIN' }
        }).catch(() => null),
        apiClient.get<{ success: boolean; data: AuditLogEntity[] }>('/admin/audit-logs', {
          headers: { 'x-demo-user-id': currentUser.userId, 'x-demo-role': 'ADMIN' }
        }).catch(() => null),
        apiClient.get<{ success: boolean; data: BookingEntity[] }>('/admin/ticketing-queue', {
          headers: { 'x-demo-user-id': currentUser.userId, 'x-demo-role': 'ADMIN' }
        }).catch(() => null),
        apiClient.get<{ success: boolean; data: PaymentAttemptEntity[] }>('/payments/unreconciled', {
          headers: { 'x-demo-user-id': currentUser.userId, 'x-demo-role': 'ADMIN' }
        }).catch(() => null)
      ]);

      if (dashRes?.data) setDashboardMetrics(dashRes.data);
      if (cancelRes?.data) setPendingCancellations(cancelRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
      if (qRes?.data) setTicketingQueue(qRes.data);
      if (pRes?.data) setUnreconciledPayments(pRes.data);
    } catch {
      // Ignored for standalone mode
    }
  };

  const fetchTicketsForBooking = async (bookingId: string): Promise<TicketEntity[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: TicketEntity[] }>(`/bookings/${bookingId}/tickets`, {
        headers: {
          'x-demo-user-id': currentUser.userId,
          'x-demo-role': currentUser.role
        }
      });
      return res.data || [];
    } catch {
      return [];
    }
  };

  const handleFlightSearch = async (criteria: FlightSearchQuery) => {
    setSearchCriteria(criteria);
    setIsSearching(true);
    setSelectedOffer(null);

    try {
      const queryParams = new URLSearchParams({
        origin: criteria.origin,
        destination: criteria.destination,
        departureDate: criteria.departureDate,
        passengerCount: criteria.passengerCount.toString(),
        cabinClass: criteria.cabinClass
      });
      if (criteria.returnDate) {
        queryParams.set('returnDate', criteria.returnDate);
      }

      const response = await apiClient.get<{ success: boolean; data: FlightOffer[] }>(
        `/flights/search?${queryParams.toString()}`
      );
      setFlightOffers(response.data || []);
    } catch {
      setFlightOffers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookingSubmit = async (data: {
    passengers: PassengerInput[];
    customerUserId?: string;
  }) => {
    if (!selectedOffer) return;
    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const response = await apiClient.post<{ success: boolean; data: BookingEntity }>(
        '/bookings',
        {
          offerId: selectedOffer.id,
          passengers: data.passengers,
          customerUserId: data.customerUserId
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
            'x-demo-user-id': currentUser.userId,
            'x-demo-role': currentUser.role
          }
        }
      );

      const createdBooking = response.data;
      setBookings(prev => [createdBooking, ...prev]);
      setActiveBooking(createdBooking);
      setSelectedOffer(null);
      setActiveTab('bookings');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm booking';
      setBookingError(msg);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handlePay = async (scenario: SimulationScenario) => {
    if (!bookingForPayment) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const idempotencyKey = `idem-pay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const response = await apiClient.post<{
        success: boolean;
        data: {
          payment: PaymentAttemptEntity;
          tickets: TicketEntity[];
        };
      }>(
        `/bookings/${bookingForPayment.id}/payment`,
        { simulationScenario: scenario },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
            'x-demo-user-id': currentUser.userId,
            'x-demo-role': currentUser.role
          }
        }
      );

      const { payment, tickets } = response.data;

      if (payment.status === 'SUCCEEDED') {
        const updatedBooking: BookingEntity = {
          ...bookingForPayment,
          bookingStatus: 'TICKETED'
        };
        setBookings(prev => prev.map(b => (b.id === updatedBooking.id ? updatedBooking : b)));
        if (activeBooking?.id === updatedBooking.id) {
          setActiveBooking(updatedBooking);
        }
        setIsPaymentModalOpen(false);
        setBookingForPayment(null);
        setViewingTickets({ booking: updatedBooking, tickets });
      } else if (payment.status === 'FAILED') {
        setPaymentError(`Payment declined: ${payment.failureReason || 'Declined by issuer'}. You can safely retry or choose another scenario.`);
      } else if (payment.status === 'UNKNOWN') {
        setPaymentError('Gateway timeout awaiting bank confirmation. Transaction recorded as UNKNOWN and routed to administrator for reconciliation.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulated payment failed';
      setPaymentError(msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAdminIssueTickets = async (bookingId: string) => {
    try {
      await apiClient.post<{ success: boolean; data: TicketEntity[] }>(
        `/admin/bookings/${bookingId}/issue-tickets`,

        {},
        {
          headers: {
            'x-demo-user-id': currentUser.userId,
            'x-demo-role': 'ADMIN'
          }
        }
      );
      setAdminActionMessage(`Successfully issued mock tickets for booking ${bookingId}`);
      fetchAdminDashboard();
      fetchBookings();
    } catch (err: unknown) {
      setAdminActionMessage(err instanceof Error ? err.message : 'Failed to issue tickets');
    }
  };

  const handleAdminReconcile = async (paymentId: string, action: 'FORCE_SUCCESS' | 'FORCE_FAIL') => {
    try {
      await apiClient.post(
        `/payments/${paymentId}/reconcile`,
        {
          action,
          note: `Administrative manual reconciliation: ${action}`
        },
        {
          headers: {
            'x-demo-user-id': currentUser.userId,
            'x-demo-role': 'ADMIN'
          }
        }
      );
      setAdminActionMessage(`Payment ${paymentId} reconciled as ${action}`);
      fetchAdminDashboard();
      fetchBookings();
    } catch (err: unknown) {
      setAdminActionMessage(err instanceof Error ? err.message : 'Reconciliation failed');
    }
  };

  const handleOpenCancellation = (booking: BookingEntity) => {
    setBookingForCancellation(booking);
    setIsCancellationModalOpen(true);
  };

  const handleSubmitCancellation = async (bookingId: string, reason: string) => {
    await apiClient.post(
      `/bookings/${bookingId}/cancellation-requests`,
      { reason },
      {
        headers: {
          'x-demo-user-id': currentUser.userId,
          'x-demo-role': currentUser.role
        }
      }
    );
    if (activeBooking && activeBooking.id === bookingId) {
      setActiveBooking({
        ...activeBooking,
        bookingStatus: 'CANCELLATION_PENDING'
      });
    }
    await fetchBookings();
    if (currentUser.role === 'ADMIN') {
      await fetchAdminDashboard();
    }
  };

  const handleAdminReviewCancellation = async (
    requestId: string,
    decision: 'APPROVE' | 'REJECT',
    reviewNote?: string
  ) => {
    try {
      await apiClient.post(
        `/admin/cancellations/${requestId}/review`,
        { decision, reviewNote },
        {
          headers: {
            'x-demo-user-id': currentUser.userId,
            'x-demo-role': 'ADMIN'
          }
        }
      );
      setAdminActionMessage(`Cancellation request ${requestId} was successfully ${decision.toLowerCase()}d.`);
      await fetchAdminDashboard();
      await fetchBookings();
    } catch (err: unknown) {
      setAdminActionMessage(err instanceof Error ? err.message : 'Failed to review cancellation');
    }
  };

  const handleCreateAgency = (name: string) => {
    setAgency({
      id: `agency-${Date.now()}`,
      name,
      ownerUserId: currentUser.userId
    });
  };

  const handleSendInvite = (email: string) => {
    const newInv: AgencyInvitation = {
      id: `inv-${Date.now()}`,
      email,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      rawToken: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    };
    setAgencyInvitations(prev => [newInv, ...prev]);

    if (email === currentUser.email) {
      setCustomerInvitations(prev => [
        {
          id: newInv.id,
          agencyId: agency?.id || 'demo-agency',
          agencyName: agency?.name || 'Demo Agency',
          email: newInv.email,
          status: 'PENDING',
          expiresAt: newInv.expiresAt,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }
  };

  const handleAcceptInvite = (invitationId: string) => {
    if (activeMembership) {
      alert('You can only be associated with one agency at a time! Please leave your existing agency first.');
      return;
    }
    const inv = customerInvitations.find(i => i.id === invitationId);
    if (!inv) return;

    setActiveMembership({
      agencyId: inv.agencyId,
      agencyName: inv.agencyName,
      acceptedAt: new Date().toISOString()
    });

    setCustomerInvitations(prev => prev.filter(i => i.id !== invitationId));

    setAgencyInvitations(prev =>
      prev.map(i => (i.id === invitationId ? { ...i, status: 'ACCEPTED' } : i))
    );
    setAssociatedCustomers(prev => [
      ...prev,
      {
        membershipId: `mem-${Date.now()}`,
        customerUserId: currentUser.userId,
        email: currentUser.email,
        firstName: 'Alice',
        lastName: 'Traveler',
        associatedAt: new Date().toISOString()
      }
    ]);
  };

  const handleRejectInvite = (invitationId: string) => {
    setCustomerInvitations(prev => prev.filter(i => i.id !== invitationId));
    setAgencyInvitations(prev =>
      prev.map(i => (i.id === invitationId ? { ...i, status: 'REJECTED' } : i))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      <Navbar
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'bookings') {
            setActiveBooking(null);
            setViewingTickets(null);
          }
        }}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Render Tab Views */}
        {activeTab === 'flights' && (
          <div className="space-y-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Demo Search Active &bull; Role: {currentUser.role}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Flight-First Travel Booking Platform
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Deterministic mock inventory with multi-airline routes, pricing calculations, and transparent supplier boundaries.
              </p>
            </div>

            {/* Search Form */}
            <FlightSearchForm onSearch={handleFlightSearch} />

            {/* Error Message */}
            {bookingError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Passenger Checkout Form Modal / Section */}
            {selectedOffer && (
              <PassengerForm
                offer={selectedOffer}
                userRole={currentUser.role}
                associatedCustomers={associatedCustomers}
                onSubmit={handleBookingSubmit}
                onCancel={() => setSelectedOffer(null)}
                isSubmitting={isSubmittingBooking}
              />
            )}

            {/* Results List */}
            {!selectedOffer && (
              <FlightResults
                offers={flightOffers}
                searchCriteria={searchCriteria}
                onSelectOffer={setSelectedOffer}
                isLoading={isSearching}
              />
            )}

            {/* Customer Invitations card if currently logged in as Customer */}
            {currentUser.role === 'CUSTOMER' && (
              <CustomerInvitations
                invitations={customerInvitations}
                activeMembership={activeMembership}
                onAccept={handleAcceptInvite}
                onReject={handleRejectInvite}
              />
            )}
          </div>
        )}

        {/* Bookings View */}
        {activeTab === 'bookings' && (
          <div>
            {viewingTickets ? (
              <TicketView
                booking={viewingTickets.booking}
                tickets={viewingTickets.tickets}
                onBack={() => setViewingTickets(null)}
              />
            ) : activeBooking ? (
              <BookingConfirmation
                booking={activeBooking}
                onViewAllBookings={() => setActiveBooking(null)}
                onNewSearch={() => {
                  setActiveBooking(null);
                  setActiveTab('flights');
                }}
                onPayClick={() => {
                  setBookingForPayment(activeBooking);
                  setIsPaymentModalOpen(true);
                }}
                onViewTickets={async () => {
                  const tkts = await fetchTicketsForBooking(activeBooking.id);
                  setViewingTickets({ booking: activeBooking, tickets: tkts });
                }}
                onRequestCancellation={() => handleOpenCancellation(activeBooking)}
              />
            ) : (
              <BookingsList
                bookings={bookings}
                isLoading={isLoadingBookings}
                onSelectBooking={(b) => setActiveBooking(b)}
                onNewSearch={() => setActiveTab('flights')}
                onPayClick={(b) => {
                  setBookingForPayment(b);
                  setIsPaymentModalOpen(true);
                }}
                onViewTickets={async (b) => {
                  const tkts = await fetchTicketsForBooking(b.id);
                  setViewingTickets({ booking: b, tickets: tkts });
                }}
                onRequestCancellation={(b) => handleOpenCancellation(b)}
              />
            )}
          </div>
        )}

        {/* Agency View */}
        {activeTab === 'agency' && (
          <AgencyPortal
            agency={agency}
            invitations={agencyInvitations}
            associatedCustomers={associatedCustomers}
            onCreateAgency={handleCreateAgency}
            onInvite={handleSendInvite}
          />
        )}

        {/* Admin Dashboard */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-slate-900">Admin Inspection & Operations Console</h2>
                </div>
                <button
                  onClick={fetchAdminDashboard}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Dashboard</span>
                </button>
              </div>

              {adminActionMessage && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600" />
                  <span>{adminActionMessage}</span>
                </div>
              )}

              {/* Real-time Dynamic Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] uppercase font-bold text-slate-500">Total Bookings</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{dashboardMetrics?.totalBookings ?? bookings.length}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[11px] uppercase font-bold text-emerald-800">Confirmed</span>
                  <p className="text-2xl font-black text-emerald-950 mt-0.5">
                    {dashboardMetrics?.confirmedBookings ?? bookings.filter(b => b.bookingStatus === 'CONFIRMED').length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
                  <span className="text-[11px] uppercase font-bold text-indigo-800">Ticketed</span>
                  <p className="text-2xl font-black text-indigo-950 mt-0.5">
                    {dashboardMetrics?.ticketedBookings ?? bookings.filter(b => b.bookingStatus === 'TICKETED').length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300">
                  <span className="text-[11px] uppercase font-bold text-amber-800">Pending Cancellations</span>
                  <p className="text-2xl font-black text-amber-950 mt-0.5">
                    {dashboardMetrics?.pendingCancellations ?? pendingCancellations.length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[11px] uppercase font-bold text-rose-800">Cancelled Bookings</span>
                  <p className="text-2xl font-black text-rose-950 mt-0.5">
                    {dashboardMetrics?.cancelledBookings ?? bookings.filter(b => b.bookingStatus === 'CANCELLED').length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="text-[11px] uppercase font-bold text-purple-800">Unreconciled Payments</span>
                  <p className="text-2xl font-black text-purple-950 mt-0.5">
                    {dashboardMetrics?.unreconciledPayments ?? unreconciledPayments.length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200">
                  <span className="text-[11px] uppercase font-bold text-rose-700">Failed Payments</span>
                  <p className="text-2xl font-black text-rose-900 mt-0.5">
                    {dashboardMetrics?.failedPayments ?? 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-600 text-white shadow-sm border border-indigo-700">
                  <span className="text-[11px] uppercase font-bold text-indigo-200 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Interventions Needed</span>
                  </span>
                  <p className="text-2xl font-black text-white mt-0.5">
                    {dashboardMetrics?.operationalInterventionsRequired ?? (pendingCancellations.length + unreconciledPayments.length + ticketingQueue.length)}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Review Queue */}
            <CancellationReviewQueue
              cancellations={pendingCancellations}
              onReview={handleAdminReviewCancellation}
            />

            {/* Ticketing Operations Queue */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Administrative Ticketing Queue ({ticketingQueue.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Bookings with successful simulated payment awaiting manual mock ticket fulfillment.
              </p>

              {ticketingQueue.length === 0 ? (
                <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  Ticketing queue is clear. No manual fulfillment needed.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {ticketingQueue.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.bookingReference}</span>
                          <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold">
                            PNR: {item.pnr}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {item.flightOffer.originAirport.iataCode} &rarr; {item.flightOffer.destinationAirport.iataCode} &bull; Total: ${item.totalAmount}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdminIssueTickets(item.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Issue Mock Tickets
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Reconciliation Panel */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Payment Reconciliation Queue ({unreconciledPayments.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Simulated transactions in UNKNOWN/timeout state requiring administrative verification.
              </p>

              {unreconciledPayments.length === 0 ? (
                <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  No payment attempts pending reconciliation.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {unreconciledPayments.map((p) => (
                    <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{p.paymentReference}</span>
                          <span className="text-xs text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-bold">
                            {p.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Amount: ${p.amount} {p.currency} &bull; Reason: {p.failureReason}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAdminReconcile(p.id, 'FORCE_SUCCESS')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Force Succeeded
                        </button>
                        <button
                          onClick={() => handleAdminReconcile(p.id, 'FORCE_FAIL')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Force Failed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log Trail */}
            <AuditLogView logs={auditLogs} onRefresh={fetchAdminDashboard} />
          </div>
        )}

        {/* Milestone Features Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Milestone 6: Administrative Operations, Metrics Dashboard & Cancellation Requests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Cancellation requests with reason validation and CANCELLATION_PENDING status</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Admin cancellation review queue with approval (supplier release) & rejection (revert)</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Real-time platform metrics dashboard derived dynamically from live records</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Comprehensive immutable audit logging trail with actor ID and metadata</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Simulated payment engine, reconciliation, and 13-digit mock ticket fulfillment</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Transparent [DEMO / MOCK] disclaimers across inventory, bookings, and refunds</span>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {isPaymentModalOpen && bookingForPayment && (
        <PaymentModal
          booking={bookingForPayment}
          onPay={handlePay}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setBookingForPayment(null);
            setPaymentError(null);
          }}
          isProcessing={isProcessingPayment}
          errorMessage={paymentError}
        />
      )}

      {/* Cancellation Request Modal */}
      {isCancellationModalOpen && bookingForCancellation && (
        <CancellationModal
          booking={bookingForCancellation}
          isOpen={isCancellationModalOpen}
          onClose={() => {
            setIsCancellationModalOpen(false);
            setBookingForCancellation(null);
          }}
          onSubmit={handleSubmitCancellation}
        />
      )}

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Travel Booking Platform MVP &bull; Free-Tier Open-Source &bull; Deterministic Mock Supplier &bull; Simulated Payments
      </footer>
    </div>
  );
};

export default App;
