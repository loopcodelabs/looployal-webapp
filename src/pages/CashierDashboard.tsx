import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessMembership, WalletTransaction } from '../types';
import { api } from '../services/api';
import { QRScannerModal } from '../components/cashier/QRScannerModal';
import {
  ScanQrCode,
  Zap,
  CreditCard,
  Gift,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  RefreshCw,
  Search,
  KeyRound,
  FileText,
  Camera,
  ShieldCheck
} from 'lucide-react';

export const CashierDashboard: React.FC = () => {
  const { employee, user } = useAuth();
  
  // Search & Scan state
  const [searchCode, setSearchCode] = useState('CUST-QR-cst-01'); // Universal QR Code default
  const [membership, setMembership] = useState<BusinessMembership | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [isNewAutoMembership, setIsNewAutoMembership] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Credit Points state
  const [billNumber, setBillNumber] = useState<string>('INV-2026-101');
  const [billAmount, setBillAmount] = useState<string>('1500');
  const [crediting, setCrediting] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState<any | null>(null);

  // Redemption state
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('100');
  const [redemptionOtpSent, setRedemptionOtpSent] = useState(false);
  const [redemptionOtp, setRedemptionOtp] = useState('123456');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<any | null>(null);

  const business = employee?.business;
  const branch = employee?.branch;

  // Perform Scan / Lookup
  const handleScanLookup = async (codeToSearch?: string) => {
    const rawTerm = codeToSearch || searchCode;
    const term = rawTerm ? rawTerm.trim() : '';
    if (!term) return;

    // Validation if searching by mobile number (numeric digits only)
    const digitsOnly = term.replace(/\D/g, '');
    const isNumericOnly = /^\d+$/.test(term);
    if (isNumericOnly && digitsOnly.length !== 10) {
      setMembership(null);
      setCustomer(null);
      setScanError('Mobile number must be exactly 10 digits.');
      return;
    }

    setScanError(null);
    setScanning(true);
    setCreditSuccess(null);
    setRedeemSuccess(null);
    setIsNewAutoMembership(false);

    try {
      const res = await api.scanMembershipCode(term);
      setMembership(res.membership);
      setCustomer((res as any).customer || res.membership.customer);
      setIsNewAutoMembership(!!(res as any).isNewMembership);
      setRecentTransactions(res.recentTransactions);
    } catch (err: any) {
      setMembership(null);
      setCustomer(null);
      setScanError(err.message || 'Customer not found or invalid QR code');
    } finally {
      setScanning(false);
    }
  };

  // Issue / Credit Points (Direct - No OTP Required)
  const handleCreditPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership || !billNumber.trim() || !billAmount || Number(billAmount) <= 0) return;

    setCrediting(true);
    setScanError(null);
    try {
      const res = await api.creditPoints(membership.id, billNumber.trim(), Number(billAmount));
      setCreditSuccess(res.transaction);
      // Auto-generate new unique bill number for next transaction
      setBillNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      // Refresh scanned membership info
      handleScanLookup(customer?.mobileNumber || customer?.universalQrCode || membership.id);
    } catch (err: any) {
      setScanError(err.message || 'Failed to credit points');
    } finally {
      setCrediting(false);
    }
  };

  // Request Customer Redemption OTP
  const handleRequestRedemptionOTP = async () => {
    if (!membership || !pointsToRedeem || Number(pointsToRedeem) <= 0) return;

    setRedeeming(true);
    setScanError(null);
    try {
      const res = await api.requestRedemptionOTP(membership.id, Number(pointsToRedeem));
      setRedemptionOtpSent(true);
      setRedemptionOtp(res.otp);
    } catch (err: any) {
      setScanError(err.message || 'Redemption OTP request failed');
    } finally {
      setRedeeming(false);
    }
  };

  // Verify OTP & Redeem Points
  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership || !pointsToRedeem || !redemptionOtp) return;

    setRedeeming(true);
    setScanError(null);
    try {
      const res = await api.redeemPoints(membership.id, Number(pointsToRedeem), redemptionOtp);
      setRedeemSuccess(res.transaction);
      setRedemptionOtpSent(false);
      handleScanLookup(customer?.mobileNumber || customer?.universalQrCode || membership.id);
    } catch (err: any) {
      setScanError(err.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const calculatedPoints = Math.floor(((Number(billAmount) || 0) * (business?.rewardPercentage || 5)) / 100);

  return (
    <div id="cashier-dashboard" className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Cashier Speed Bar Header */}
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-900/50 dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ScanQrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Cashier POS Interface
                </h1>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Speed-Optimized
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Business Tenant: <span className="font-bold text-slate-800 dark:text-slate-200">{business?.name || 'Active Tenant'}</span>
                {branch && <span> • Branch: {branch.name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-xl text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Cashier: {user?.fullName || 'Cashier'}
            </span>
          </div>
        </div>

        {/* SCAN / SEARCH SEARCH BAR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ScanQrCode className="h-4 w-4 text-blue-600" />
              <span>Scan Customer Universal QR Code or Enter Mobile Number</span>
            </label>
            <span className="text-xs text-slate-400">
              Auto-creates membership on first visit
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="cashier-camera-scan-btn"
              onClick={() => setIsCameraModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <Camera className="h-5 w-5 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Scan via Camera</span>
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </button>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                id="cashier-scan-input"
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanLookup()}
                placeholder="Scan Universal QR (e.g. CUST-QR-cst-01) or enter mobile (9876543210)"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
            <button
              id="cashier-lookup-btn"
              onClick={() => handleScanLookup()}
              disabled={scanning}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Validate & Fetch</span>
            </button>
          </div>

          {/* Quick Demo Fill Buttons for Cashier */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Quick Demo Autofill:</span>
            <button
              onClick={() => {
                setSearchCode('CUST-QR-cst-01');
                handleScanLookup('CUST-QR-cst-01');
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold"
            >
              Universal QR (CUST-QR-cst-01)
            </button>
            <button
              onClick={() => {
                setSearchCode('9876543210');
                handleScanLookup('9876543210');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold"
            >
              Registered Mobile (9876543210)
            </button>
          </div>

          {isNewAutoMembership && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold flex items-center gap-2 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
              <Zap className="h-4 w-4 text-amber-600 shrink-0" />
              <span>✨ First Visit Auto-Enrollment: New store membership & reward account automatically initialized for {business?.name}!</span>
            </div>
          )}

          {scanError && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 dark:bg-red-950/60 dark:border-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>

        {/* ACTIVE SCANNED MEMBERSHIP VERIFICATION CARD */}
        {membership && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info Box */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg dark:bg-emerald-950 dark:text-emerald-400">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {membership.customer?.name || 'Customer Verified'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    📱 +91 {membership.customer?.mobileNumber}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Membership Code:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{membership.membershipCode}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Account Status:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-300">
                    {(membership.rewardAccount || membership.wallet)?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 dark:border-slate-700 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Balance:</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {(membership.rewardAccount || membership.wallet)?.balance} <span className="text-xs font-semibold text-emerald-600">Points</span>
                  </span>
                </div>
              </div>

              {/* Business Rule Summary */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300">
                <div className="font-bold text-blue-950 dark:text-blue-200">
                  {business?.name} Reward Rules:
                </div>
                <div>• Earn Rate: {business?.rewardPercentage}% of bill</div>
                <div>• Min Redemption: {business?.minRedeemPoints} Points</div>
              </div>
            </div>

            {/* POS ACTION CENTER: CREDIT OR REDEEM */}
            <div className="lg:col-span-2 space-y-6">
              {/* CREDIT POINTS ACTION PANEL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    <span>Issue / Credit Loyalty Points</span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                    Direct Issuance • No OTP Needed
                  </span>
                </div>

                <form onSubmit={handleCreditPoints} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mandatory Bill Number Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Unique Bill Number</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="cashier-bill-number-input"
                        type="text"
                        required
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        placeholder="e.g. INV-2026-101"
                        className="w-full mt-1.5 px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    {/* Mandatory Bill Amount Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Bill Amount (₹)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
                            ₹
                          </span>
                          <input
                            id="cashier-bill-amount-input"
                            type="number"
                            min={1}
                            required
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            placeholder="1500"
                            className="w-full pl-7 pr-3 py-3 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>

                        <div className="flex flex-col justify-center px-3 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-900 min-w-[90px] text-right">
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold">Points</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            +{calculatedPoints} Pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    id="cashier-confirm-credit-btn"
                    type="submit"
                    disabled={crediting || !billNumber.trim() || !billAmount || Number(billAmount) <= 0}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    {crediting ? 'Crediting Points...' : `Issue & Credit +${calculatedPoints} Pts`}
                  </button>
                </form>

                {creditSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>Points Credited Successfully!</span>
                    </div>
                    <div>Bill Number: <span className="font-mono font-bold text-slate-900 dark:text-white">#{creditSuccess.billNumber}</span></div>
                    <div>Ref Code: <span className="font-mono font-bold">{creditSuccess.reference}</span></div>
                    <div>Narration: {creditSuccess.narration}</div>
                    <div>Updated Balance: <span className="font-bold">{creditSuccess.balanceAfter} Points</span></div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 mt-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Direct Credit Issued • Instant SMS Sent • Audit Log Recorded</span>
                    </div>
                  </div>
                )}
              </div>

              {/* REDEEM POINTS ACTION PANEL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-indigo-600" />
                    <span>Redeem Customer Points</span>
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full dark:bg-indigo-950 dark:text-indigo-300">
                    Requires Customer OTP
                  </span>
                </div>

                {!redemptionOtpSent ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Points to Redeem (Min: {business?.minRedeemPoints} Pts)
                      </label>
                      <input
                        id="cashier-redeem-points-input"
                        type="number"
                        min={business?.minRedeemPoints || 100}
                        max={(membership.rewardAccount || membership.wallet)?.balance || 0}
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 border border-slate-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    <button
                      id="cashier-request-redeem-otp-btn"
                      onClick={handleRequestRedemptionOTP}
                      disabled={redeeming || ((membership.rewardAccount || membership.wallet)?.balance || 0) < (business?.minRedeemPoints || 100)}
                      className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {redeeming ? 'Sending OTP...' : `Request Customer Verification OTP`}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRedeemPoints} className="space-y-4">
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
                      Enter 6-digit OTP sent to customer (+91 {membership.customer?.mobileNumber}) to confirm redemption of {pointsToRedeem} Points.
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Customer Verification OTP
                      </label>
                      <input
                        id="cashier-redemption-otp-input"
                        type="text"
                        maxLength={6}
                        required
                        value={redemptionOtp}
                        onChange={(e) => setRedemptionOtp(e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 border border-slate-300 rounded-xl text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRedemptionOtpSent(false)}
                        className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        id="cashier-confirm-redeem-btn"
                        type="submit"
                        disabled={redeeming}
                        className="w-2/3 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow transition disabled:opacity-50"
                      >
                        {redeeming ? 'Verifying...' : 'Confirm & Redeem Points'}
                      </button>
                    </div>
                  </form>
                )}

                {redeemSuccess && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1.5 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-200">
                    <div className="flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-300 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                      <span>Points Redeemed Successfully!</span>
                    </div>
                    <div>Ref Code: <span className="font-mono font-bold">{redeemSuccess.reference}</span></div>
                    <div>Points Deducted: <span className="font-bold">{redeemSuccess.points} Pts</span></div>
                    <div>Remaining Balance: <span className="font-bold">{redeemSuccess.balanceAfter} Points</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIVE CAMERA QR SCANNER MODAL */}
      <QRScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScanSuccess={(code) => {
          setSearchCode(code);
          setIsCameraModalOpen(false);
          handleScanLookup(code);
        }}
        tenantName={business?.name}
      />
    </div>
  );
};
