import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useJobsRealtime } from '../../hooks/useJobs';
import {
  LayoutDashboard, Users, Building2, LogOut, Menu, X, Briefcase, Home, FileText
} from 'lucide-react';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/billing', label: 'Billing', icon: <FileText size={18} /> },
    { to: '/admin/contractors', label: 'Contractors', icon: <Users size={18} /> },
    { to: '/admin/strata-managers', label: 'Strata Managers', icon: <Building2 size={18} /> },
  ],
  contractor: [
    { to: '/contractor', label: 'My Jobs', icon: <Briefcase size={18} /> },
  ],
  unit_owner: [
    { to: '/owner', label: 'My Requests', icon: <Home size={18} /> },
    { to: '/owner/new', label: 'New Request', icon: <FileText size={18} /> },
  ],
  strata_manager: [
    { to: '/strata', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/strata/billing', label: 'Billing', icon: <FileText size={18} /> },
  ],
};

const roleTitles: Record<UserRole, string> = {
  admin: 'Admin Portal',
  contractor: 'Contractor Portal',
  unit_owner: 'Owner Portal',
  strata_manager: 'Strata Manager',
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useJobsRealtime();

  if (!user) return null;
  const navItems = navByRole[user.role];
  const title = roleTitles[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <span className="text-lg font-bold text-blue-600">Off-Hours</span>
        <span className="text-xs text-gray-500">{title}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t px-3 py-4">
        <div className="mb-3 px-3">
          <p className="text-xs font-medium text-gray-700 truncate">{user.email}</p>
          <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-white shadow-sm lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-4 border-b bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-900">Off-Hours Service</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
              <X size={20} />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};
