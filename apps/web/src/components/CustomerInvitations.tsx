import { Building2, AlertCircle, Check, X } from 'lucide-react';

export interface CustomerAgencyInvitation {
  id: string;
  agencyId: string;
  agencyName: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface ActiveAgencyMembership {
  agencyId: string;
  agencyName: string;
  acceptedAt: string;
}

interface CustomerInvitationsProps {
  invitations: CustomerAgencyInvitation[];
  activeMembership: ActiveAgencyMembership | null;
  onAccept?: (invitationId: string) => void;
  onReject?: (invitationId: string) => void;
}

export const CustomerInvitations = ({
  invitations,
  activeMembership,
  onAccept,
  onReject
}: CustomerInvitationsProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Agency Association</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Travel agencies can assist in searching and booking flights on your behalf.
        </p>
      </div>

      {/* Active Membership Banner */}
      {activeMembership ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-900">
              Associated Agency: {activeMembership.agencyName}
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              This agency is authorized to create bookings for you. You can be associated with no more than one agency at a time.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            You are currently an independent B2C traveler. You can be associated with no more than one agency at a time upon invitation.
          </span>
        </div>
      )}

      {/* Invitations list */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Pending Invitations ({invitations.length})
        </h4>

        {invitations.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-2">No pending invitations.</p>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">{inv.agencyName}</h5>
                    <p className="text-xs text-slate-500">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onReject?.(inv.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => onAccept?.(inv.id)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Join</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
