import { useState } from 'react';
import { Building2, UserPlus, Users, Mail, Clock, CheckCircle } from 'lucide-react';

export interface AgencyInfo {
  id: string;
  name: string;
  ownerUserId: string;
}

export interface AgencyInvitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  rawToken?: string;
}

export interface AssociatedCustomer {
  membershipId: string;
  customerUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  associatedAt: string;
}

interface AgencyPortalProps {
  agency: AgencyInfo | null;
  invitations: AgencyInvitation[];
  associatedCustomers: AssociatedCustomer[];
  onCreateAgency?: (name: string) => void;
  onInvite?: (email: string) => void;
}

export const AgencyPortal = ({
  agency,
  invitations,
  associatedCustomers,
  onCreateAgency,
  onInvite
}: AgencyPortalProps) => {
  const [agencyName, setAgencyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  if (!agency) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Register Your Agency</h2>
        <p className="text-sm text-slate-600 mt-1 mb-6">
          Set up an agency organization to invite customers, manage traveler profiles, and book flights on their behalf.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (agencyName.trim()) onCreateAgency?.(agencyName.trim());
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Agency Name
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Apex Global Travels"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors"
          >
            Create Agency Organization
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Agency Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{agency.name}</h2>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">ID: {agency.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">Associated Clients</span>
            <p className="text-lg font-bold text-slate-900">{associatedCustomers.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Invite Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Invite Customer</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Send a secure invitation. When accepted, the traveler joins your agency (max 1 agency per traveler).
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inviteEmail.trim()) {
                onInvite?.(inviteEmail.trim());
                setInviteEmail('');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
            >
              Send Invitation
            </button>
          </form>

          {/* Recent Invitations */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Invitations Sent ({invitations.length})
            </h4>
            {invitations.length === 0 ? (
              <p className="text-xs text-slate-400">No invitations sent yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {invitations.map((inv) => (
                  <li key={inv.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-900 truncate max-w-[150px]">{inv.email}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    {inv.rawToken && (
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        Token: {inv.rawToken.substring(0, 16)}...
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Associated Customers */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Associated Customers</h3>
          </div>

          {associatedCustomers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No associated customers yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Invite customers by email. Once they accept, they will appear here so you can book flights on their behalf.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Associated Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {associatedCustomers.map((cust) => (
                    <tr key={cust.membershipId} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">
                        {cust.firstName ? `${cust.firstName} ${cust.lastName || ''}` : 'Customer'}
                      </td>
                      <td className="py-3 text-slate-600">{cust.email}</td>
                      <td className="py-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(cust.associatedAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Authorized
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
