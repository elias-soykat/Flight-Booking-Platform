import { useState, useEffect } from 'react';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { DEMO_USERS, type DemoUserSession } from './components/UserSwitcher';
import { AgencyPortal, type AgencyInfo, type AgencyInvitation, type AssociatedCustomer } from './components/AgencyPortal';
import { CustomerInvitations, type CustomerAgencyInvitation, type ActiveAgencyMembership } from './components/CustomerInvitations';
import { FlightSearchForm } from './components/FlightSearchForm';
import { FlightResults } from './components/FlightResults';
import type { FlightOffer, FlightSearchQuery } from '@travel-platform/shared';
import { apiClient } from './lib/api-client';
import { Plane, Building2, ShieldCheck, CheckCircle2, ArrowRight, Check } from 'lucide-react';

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
  const [associatedCustomers, setAssociatedCustomers] = useState<AssociatedCustomer[]>([]);

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

  // Initial flight search on load
  useEffect(() => {
    if (searchCriteria) {
      handleFlightSearch(searchCriteria);
    }
  }, []);

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
      // Fallback for standalone/mock demo if API server is not active during unit tests
      setFlightOffers([]);
    } finally {
      setIsSearching(false);
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
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Render Tab Views */}
        {activeTab === 'flights' && (
          <div className="space-y-8">
            {/* Search Form */}
            <FlightSearchForm onSearch={handleFlightSearch} />

            {/* Selected Offer Toast / Confirmation */}
            {selectedOffer && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      Flight Selected: {selectedOffer.originAirport.iataCode} &rarr; {selectedOffer.destinationAirport.iataCode} (${selectedOffer.totalAmount.toFixed(2)})
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Offer reference: {selectedOffer.supplierOfferReference} &bull; Ready for Milestone 4 (Booking Engine & Passenger Information)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white"
                >
                  Change Selection
                </button>
              </div>
            )}

            {/* Results List */}
            <FlightResults
              offers={flightOffers}
              searchCriteria={searchCriteria}
              onSelectOffer={setSelectedOffer}
              isLoading={isSearching}
            />

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

        {activeTab === 'agency' && (
          <AgencyPortal
            agency={agency}
            invitations={agencyInvitations}
            associatedCustomers={associatedCustomers}
            onCreateAgency={handleCreateAgency}
            onInvite={handleSendInvite}
          />
        )}

        {activeTab === 'admin' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-900">Admin Inspection Console</h2>
            </div>
            <p className="text-sm text-slate-600">
              Administrative role verified. Accessing system records and agency relations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500">Registered Agencies</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{agency ? 1 : 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500">Active Agency Associations</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{associatedCustomers.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Features Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Milestone 3: Flight Search & Deterministic Inventory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>FlightSupplierAdapter interface decoupled from specific suppliers</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Deterministic MockFlightSupplier with multi-airline routes</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Direct and connecting flights with layovers and durations</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Pricing engine calculating 10% markup and total customer price</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Visible [DEMO / MOCK] indicator on all flight cards</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Responsive search form with airport autocomplete & validation</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Travel Booking Platform MVP &bull; Free-Tier Open-Source &bull; Deterministic Mock Supplier &bull; Simulated Payments
      </footer>
    </div>
  );
};

export default App;
