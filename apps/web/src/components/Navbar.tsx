import { Plane, Building2, ShieldCheck } from 'lucide-react';
import { UserSwitcher, type DemoUserSession } from './UserSwitcher';

interface NavbarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  currentUser: DemoUserSession;
  onUserChange: (user: DemoUserSession) => void;
}

export const Navbar = ({
  currentTab = 'flights',
  onTabChange,
  currentUser,
  onUserChange
}: NavbarProps) => {
  const navItems = [
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'agency', label: 'Agency Portal', icon: Building2 },
    { id: 'admin', label: 'Admin Dashboard', icon: ShieldCheck }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange?.('flights')}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Plane className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">TravelHub</span>
              <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                MVP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Role Switcher */}
          <div className="flex items-center gap-2">
            <UserSwitcher currentUser={currentUser} onSelectUser={onUserChange} />
          </div>
        </div>
      </div>
    </header>
  );
};
