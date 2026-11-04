import { useState } from 'react';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { Plane, Building2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const App = () => {
  const [activeTab, setActiveTab] = useState('flights');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      <Navbar currentTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero & Tab Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Milestone 1 Initialized
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Flight-First Travel Booking Platform
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              Demonstrating a supplier-independent booking architecture, direct B2C search and booking,
              agency-assisted customer workflows, simulated payments with reconciliation, and administrative ticket fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div
              onClick={() => setActiveTab('flights')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'flights'
                  ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                <Plane className="w-5 h-5 text-emerald-700" />
              </div>
              <h2 className="font-semibold text-slate-900 text-base">Direct Flight Booking</h2>
              <p className="text-sm text-slate-500 mt-1">
                Search flights, configure fares, enter passenger data, and reserve flights.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-slate-900 gap-1">
                <span>View flights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('agency')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'agency'
                  ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-3">
                <Building2 className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="font-semibold text-slate-900 text-base">Agency Portal</h2>
              <p className="text-sm text-slate-500 mt-1">
                Invite customers via secure tokens and manage agency-created bookings.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-slate-900 gap-1">
                <span>Open portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('admin')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-3">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
              </div>
              <h2 className="font-semibold text-slate-900 text-base">Admin Dashboard</h2>
              <p className="text-sm text-slate-500 mt-1">
                Review payment retries, manage the ticketing queue, and audit logs.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-slate-900 gap-1">
                <span>Manage operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Features checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Milestone 1: Foundation Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Modular Monolith Monorepo with npm workspaces</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Drizzle ORM schema with exact decimal numeric fields</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>One active agency constraint via partial unique index</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Backend Hono API ready for Cloudflare Workers</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Shared Zod domain schemas and airport/airline fixtures</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Persistent [DEMO / MOCK] indicator throughout the UI</span>
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
