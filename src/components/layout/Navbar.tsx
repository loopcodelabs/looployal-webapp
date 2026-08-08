import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Shield,
  Building2,
  ScanQrCode,
  Gift,
  LogOut,
  User,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, employee, logout, demoLogin, loading } = useAuth();

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800';
      case 'BUSINESS_OWNER':
      case 'BRANCH_MANAGER':
        return 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-800';
      case 'CASHIER':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800';
      case 'CUSTOMER':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90 focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                PerkPulse
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                SaaS MVP
              </span>
            </div>
          </button>

          {/* Architecture Documentation Link */}
          <button
            id="nav-architecture-link"
            onClick={() => onNavigate('/architecture')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              currentPath === '/architecture'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-indigo-600" />
            <span>Architecture & Specs</span>
          </button>

          {/* Client Discovery Questionnaire Link */}
          <button
            id="nav-discovery-link"
            onClick={() => onNavigate('/discovery')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              currentPath === '/discovery' || currentPath === '/questionnaire'
                ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            <span>Discovery Survey</span>
          </button>

          {/* Active Tenant Context (for Employees/Owners) */}
          {employee?.business && (
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {employee.business.name}
              </span>
              {employee.branch && (
                <span className="text-xs text-slate-400">({employee.branch.name})</span>
              )}
            </div>
          )}
        </div>

        {/* Navigation & User Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {/* Role Navigation Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
                {user.role === 'CUSTOMER' && (
                  <button
                    id="nav-customer-dashboard"
                    onClick={() => onNavigate('/customer')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      currentPath.startsWith('/customer')
                        ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Gift className="h-3.5 w-3.5" />
                    <span>My Rewards</span>
                  </button>
                )}

                {user.role === 'CASHIER' && (
                  <button
                    id="nav-cashier-pos"
                    onClick={() => onNavigate('/cashier')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      currentPath.startsWith('/cashier')
                        ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <ScanQrCode className="h-3.5 w-3.5" />
                    <span>Cashier POS</span>
                  </button>
                )}

                {(user.role === 'BUSINESS_OWNER' || user.role === 'BRANCH_MANAGER') && (
                  <button
                    id="nav-merchant-dashboard"
                    onClick={() => onNavigate('/merchant')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      currentPath.startsWith('/merchant')
                        ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Business Dashboard</span>
                  </button>
                )}

                {user.role === 'PLATFORM_ADMIN' && (
                  <button
                    id="nav-admin-dashboard"
                    onClick={() => onNavigate('/admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      currentPath.startsWith('/admin')
                        ? 'bg-white text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </div>

              {/* User Info & Role Badge */}
              <div className="hidden lg:flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role.replace('_', ' ')}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                  {user.fullName || user.mobileNumber}
                </span>
              </div>

              {/* Logout */}
              <button
                id="logout-button"
                onClick={() => {
                  logout();
                  onNavigate('/login');
                }}
                title="Logout"
                className="flex items-center gap-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="nav-login-button"
                onClick={() => onNavigate('/login')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Quick Demo Role Switcher Toolbar for fast evaluator testing */}
          <div className="relative group">
            <button
              id="quick-demo-role-trigger"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCw className={`h-3 w-3 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Switch Role</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 dark:border-slate-800 dark:bg-slate-900">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Instant Demo Role Switch
              </div>
              <button
                id="switch-to-customer"
                onClick={() => demoLogin('CUSTOMER').then(() => onNavigate('/customer'))}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-50 text-emerald-700 flex items-center justify-between dark:hover:bg-emerald-950/40"
              >
                <span>Customer (Mobile OTP)</span>
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                id="switch-to-cashier"
                onClick={() => demoLogin('CASHIER').then(() => onNavigate('/cashier'))}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-blue-50 text-blue-700 flex items-center justify-between dark:hover:bg-blue-950/40"
              >
                <span>Cashier (Indian Oil)</span>
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                id="switch-to-merchant"
                onClick={() => demoLogin('BUSINESS_OWNER').then(() => onNavigate('/merchant'))}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-amber-50 text-amber-700 flex items-center justify-between dark:hover:bg-amber-950/40"
              >
                <span>Business Owner (Indian Oil)</span>
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                id="switch-to-admin"
                onClick={() => demoLogin('PLATFORM_ADMIN').then(() => onNavigate('/admin'))}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-purple-50 text-purple-700 flex items-center justify-between dark:hover:bg-purple-950/40"
              >
                <span>Platform Admin</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
