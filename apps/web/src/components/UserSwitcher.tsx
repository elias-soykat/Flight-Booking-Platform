import type { UserRole } from '@travel-platform/shared';
import { User, Building2, ShieldCheck } from 'lucide-react';

export interface DemoUserSession {
  userId: string;
  role: UserRole;
  email: string;
  agencyId?: string;
}

export const DEMO_USERS: Record<UserRole, DemoUserSession> = {
  CUSTOMER: {
    userId: 'cust-demo-1',
    role: 'CUSTOMER',
    email: 'alice@traveler.com'
  },
  AGENCY_OWNER: {
    userId: 'owner-demo-1',
    role: 'AGENCY_OWNER',
    email: 'john@skyhightravel.com'
  },
  ADMIN: {
    userId: 'admin-demo-1',
    role: 'ADMIN',
    email: 'admin@travelplatform.internal'
  }
};

interface UserSwitcherProps {
  currentUser: DemoUserSession;
  onSelectUser: (user: DemoUserSession) => void;
}

export const UserSwitcher = ({ currentUser, onSelectUser }: UserSwitcherProps) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
      <button
        onClick={() => onSelectUser(DEMO_USERS.CUSTOMER)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          currentUser.role === 'CUSTOMER'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <User className="w-3.5 h-3.5 text-emerald-600" />
        <span>Customer</span>
      </button>

      <button
        onClick={() => onSelectUser(DEMO_USERS.AGENCY_OWNER)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          currentUser.role === 'AGENCY_OWNER'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Building2 className="w-3.5 h-3.5 text-blue-600" />
        <span>Agency Owner</span>
      </button>

      <button
        onClick={() => onSelectUser(DEMO_USERS.ADMIN)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          currentUser.role === 'ADMIN'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
        <span>Admin</span>
      </button>
    </div>
  );
};
