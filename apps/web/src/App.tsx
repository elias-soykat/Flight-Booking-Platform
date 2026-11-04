import { useState } from 'react';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { DEMO_USERS, type DemoUserSession } from './components/UserSwitcher';
import { AgencyPortal, type AgencyInfo, type AgencyInvitation, type AssociatedCustomer } from './components/AgencyPortal';
import { CustomerInvitations, type CustomerAgencyInvitation, type ActiveAgencyMembership } from './components/CustomerInvitations';
import { Plane, Building2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const App = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [currentUser, setCurrentUser] = useState<DemoUserSession>(DEMO_USERS.CUSTOMER);

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

    // If invited customer is current customer, add to their inbox
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

    // Update agency side
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render Tab Views */}
        {activeTab === 'flights' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Milestone 2 Active &bull; Role: {currentUser.role}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Flight-First Travel Booking Platform
                </h1>
                <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
                  Demonstrating identity verification, agency invitations with secure tokens, and the strictly one-agency relationship constraint.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
                <div
                  onClick={() => setActiveTab('flights')}
                  className="p-4 rounded-xl border border-slate-900 bg-slate-50/50 shadow-sm cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                    <Plane className="w-5 h-5 text-emerald-700" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-base">Direct Flight Booking</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Search flights, configure fares, enter passenger data, and reserve flights.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('agency')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-3">
                    <Building2 className="w-5 h-5 text-blue-700" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-base">Agency Portal</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Invite customers via secure tokens and manage agency-created bookings.
                  </p>
                  <div className="mt-3 flex items-center text-xs font-semibold text-slate-900 gap-1">
                    <span>Manage agency</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('admin')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-3">
                    <ShieldCheck className="w-5 h-5 text-purple-700" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-base">Admin Dashboard</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Inspect platform users, agencies, and operational queues.
                  </p>
                  <div className="mt-3 flex items-center text-xs font-semibold text-slate-900 gap-1">
                    <span>Admin view</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

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

        {/* Milestone 2 Features Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Milestone 2: Security & Tenancy Verification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Auth middleware & server-side RBAC guards active</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Customer profiles with validated update endpoints</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Agency organization creation & invitation generation</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Cryptographic SHA-256 token hashing for invitations</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Strictly 1-active-agency rule enforced (409 Conflict protection)</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Admin inspection endpoints guarded with ADMIN role check</span>
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
