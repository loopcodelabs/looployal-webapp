import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Sparkles,
  Building2,
  ScanQrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Lock,
  Smartphone,
  PieChart
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { demoLogin } = useAuth();

  const handleDemoClick = (role: UserRole, targetPath: string) => {
    demoLogin(role).then(() => onNavigate(targetPath));
  };

  return (
    <div id="landing-page" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 pt-16 pb-20 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Tenant Loyalty Service SaaS</span>
            </div>
            
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white">
              One Unified Loyalty Platform for Every Business & Customer
            </h1>

            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Isolated multi-tenant architecture powering customer rewards, lightning-fast cashier POS scanning, business metrics, and platform governance—all in one place.
            </p>

            {/* Main Action CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                id="hero-get-started-btn"
                onClick={() => onNavigate('/login')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 hover:shadow-indigo-600/35"
              >
                <span>Sign In / Enter App</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                id="hero-client-discovery-btn"
                onClick={() => onNavigate('/discovery')}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-6 py-3.5 text-sm font-semibold text-sky-900 shadow-sm transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200 dark:hover:bg-sky-900"
              >
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span>Client Discovery Survey</span>
              </button>

              <button
                id="hero-architecture-doc-btn"
                onClick={() => onNavigate('/architecture')}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 py-3.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Architecture & Cost DOCX</span>
              </button>

              <button
                id="hero-customer-demo-btn"
                onClick={() => handleDemoClick('CUSTOMER', '/customer')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>Try Customer Experience</span>
              </button>
            </div>
          </div>

          {/* Role Preview Selection Bar */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div
              onClick={() => handleDemoClick('CUSTOMER', '/customer')}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                Customer View
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Mobile OTP login, isolated multi-business reward accounts, privacy-safe QR code.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Launch Customer Demo <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div
              onClick={() => handleDemoClick('CASHIER', '/cashier')}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <ScanQrCode className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                Cashier POS
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                QR scanner, instant bill points credit, secure OTP customer redemption.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                Launch Cashier POS <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div
              onClick={() => handleDemoClick('BUSINESS_OWNER', '/merchant')}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600">
                Merchant Dashboard
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Today's sales, points issued/redeemed, rewards liability, branch/staff control.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Launch Merchant View <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div
              onClick={() => handleDemoClick('PLATFORM_ADMIN', '/admin')}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600">
                Platform Admin
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Onboard new tenant businesses, user management, audit trail & SMS logs.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                Launch Admin View <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Architected as a True Multi-Tenant SaaS
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Strict isolation ensures each business maintains independent reward accounts and reward rules without data mixing.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-950 dark:text-indigo-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Zero PII in QR Codes
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Customer QR codes contain only a secure Membership Identifier string (`MEM-xxx`). Scanners validate membership against the active cashier's business tenant context.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-950 dark:text-indigo-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Immutable Ledger Transactions
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Reward balances are never directly overwritten. Every credit, redemption, and adjustment creates an unalterable audit ledger record.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-950 dark:text-indigo-400">
                <PieChart className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Abstract SMS Dispatch Engine
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Abstract notification service triggers SMS logs on points issued, OTP requests, and redemptions, ready for SMSLocal/DLT integration.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
