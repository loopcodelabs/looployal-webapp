import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Smartphone, Mail, Lock, KeyRound, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { loginWithOTP, loginStaff, demoLogin, getRedirectPathForRole, error: authError } = useAuth();

  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  
  // Customer OTP State
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('123456');
  const [sentOtpVal, setSentOtpVal] = useState('');
  
  // Staff State
  const [email, setEmail] = useState('cashier.indianoil@platform.com');
  const [password, setPassword] = useState('Password123!');

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Request Customer OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setLocalError('Mobile number must be exactly 10 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: cleanMobile, type: 'LOGIN' }),
      });
      const data = await res.json();
      if (!responseOk(res, data)) throw new Error(data.error || 'Failed to request OTP');

      setOtpSent(true);
      setSentOtpVal(data.otp);
      setOtp(data.otp); // Pre-fill for ease of testing
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const responseOk = (res: any, data: any) => res.ok && data.success;

  // Verify OTP & Submit Login
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithOTP(mobileNumber, otp);
      onNavigate('/customer');
    } catch (err: any) {
      setLocalError(err.message || 'OTP Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Staff Login
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginStaff(email, password);
      // Determine redirect path by fetching user role or standard redirect
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('loyalty_saas_auth_token')}` },
      });
      const meData = await meRes.json();
      if (meData.user) {
        onNavigate(getRedirectPathForRole(meData.user.role));
      } else {
        onNavigate('/merchant');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setSubmitting(true);
    setLocalError(null);
    try {
      await demoLogin(role);
      onNavigate(getRedirectPathForRole(role));
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="login-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Unified Sign In
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Access your Customer Rewards or Staff Portal
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800">
          <button
            id="login-tab-customer"
            onClick={() => {
              setActiveTab('CUSTOMER');
              setLocalError(null);
            }}
            className={`w-1/2 py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'CUSTOMER'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Customer OTP Login</span>
          </button>
          <button
            id="login-tab-staff"
            onClick={() => {
              setActiveTab('STAFF');
              setLocalError(null);
            }}
            className={`w-1/2 py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'STAFF'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Staff / Business / Admin</span>
          </button>
        </div>

        {/* Error Notification */}
        {(localError || authError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
            ⚠️ {localError || authError}
          </div>
        )}

        {/* CUSTOMER OTP LOGIN FORM */}
        {activeTab === 'CUSTOMER' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {!otpSent ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Mobile Number
                  </label>
                  <div className="mt-1.5 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                      +91
                    </div>
                    <input
                      id="customer-mobile-input"
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    No password required. Authenticate directly via OTP SMS.
                  </p>
                </div>

                <button
                  id="customer-send-otp-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
                >
                  {submitting ? 'Sending OTP...' : 'Send Verification OTP'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>OTP sent to +91 {mobileNumber}</span>
                  </div>
                  {sentOtpVal && (
                    <div className="mt-1 text-[11px]">
                      Demo OTP Code: <span className="font-mono font-bold text-emerald-900 dark:text-emerald-100">{sentOtpVal}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Enter 6-Digit OTP
                  </label>
                  <div className="mt-1.5 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      id="customer-otp-input"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-indigo-600 hover:underline dark:text-indigo-400 font-semibold"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    className="text-slate-500 hover:underline dark:text-slate-400"
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  id="customer-verify-otp-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Verify & Enter Customer Rewards'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STAFF / BUSINESS OWNER / ADMIN LOGIN FORM */}
        {activeTab === 'STAFF' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="staff-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cashier.indianoil@platform.com"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="staff-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <button
                id="staff-login-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : 'Sign In to Portal'}
              </button>
            </form>
          </div>
        )}

        {/* DEMO ACCELERATOR BUTTONS */}
        <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
            ⚡ Quick Demo Auto-Fill & Login
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-btn-customer"
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition shadow-sm text-left dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400"
            >
              <div className="font-bold">Customer</div>
              <div className="text-[10px] text-slate-500 font-mono">9876543210</div>
            </button>

            <button
              id="demo-btn-admin"
              onClick={() => handleQuickDemo('PLATFORM_ADMIN')}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition shadow-sm text-left dark:bg-slate-800 dark:border-slate-700 dark:text-purple-400"
            >
              <div className="font-bold">Platform Admin</div>
              <div className="text-[10px] text-slate-500">Super Admin</div>
            </button>

            <button
              id="demo-btn-cashier"
              onClick={() => handleQuickDemo('CASHIER')}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition shadow-sm text-left dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
            >
              <div className="font-bold">Cashier</div>
              <div className="text-[10px] text-slate-500">Indian Oil</div>
            </button>

            <button
              id="demo-btn-bp-cashier"
              onClick={async () => {
                setSubmitting(true);
                setLocalError(null);
                try {
                  await loginStaff('cashier.bharatpetroleum@platform.com', 'Password123!');
                  onNavigate('/cashier');
                } catch (err: any) {
                  setLocalError(err.message);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition shadow-sm text-left dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
            >
              <div className="font-bold">Cashier</div>
              <div className="text-[10px] text-slate-500">Bharat Petroleum</div>
            </button>

            <button
              id="demo-btn-merchant"
              onClick={() => handleQuickDemo('BUSINESS_OWNER')}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition shadow-sm text-left dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400"
            >
              <div className="font-bold">Owner</div>
              <div className="text-[10px] text-slate-500">Indian Oil</div>
            </button>

            <button
              id="demo-btn-bp-owner"
              onClick={async () => {
                setSubmitting(true);
                setLocalError(null);
                try {
                  await loginStaff('owner@bharatpetroleum.in', 'Password123!');
                  onNavigate('/merchant');
                } catch (err: any) {
                  setLocalError(err.message);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition shadow-sm text-left dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400"
            >
              <div className="font-bold">Owner</div>
              <div className="text-[10px] text-slate-500">Bharat Petroleum</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
