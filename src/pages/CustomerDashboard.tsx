import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessMembership, WalletTransaction } from '../types';
import { api } from '../services/api';
import { QRViewer } from '../components/common/QRComponent';
import {
  Wallet,
  Building2,
  History,
  QrCode,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user, memberships: initialMemberships, refreshUserData } = useAuth();
  const [memberships, setMemberships] = useState<BusinessMembership[]>(initialMemberships);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [selectedMembership, setSelectedMembership] = useState<BusinessMembership | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'WALLETS' | 'QR' | 'TRANSACTIONS'>('WALLETS');

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const resMem = await api.getCustomerMemberships();
      setMemberships(resMem.memberships);
      if ((resMem as any).customer) {
        setCustomerInfo((resMem as any).customer);
      }
      if (resMem.memberships.length > 0 && !selectedMembership) {
        setSelectedMembership(resMem.memberships[0]);
      }

      const resTx = await api.getCustomerTransactions();
      setTransactions(resTx.transactions);
    } catch (err) {
      console.error('Failed to fetch customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const activeWallet = selectedMembership?.wallet;
  const activeBiz = selectedMembership?.business;

  const universalQr =
    customerInfo?.universalQrCode ||
    (user as any)?.customer?.universalQrCode ||
    'CUST-QR-cst-01';

  const filteredTransactions = selectedMembership
    ? transactions.filter((t) => t.membershipId === selectedMembership.id)
    : transactions;

  return (
    <div id="customer-dashboard" className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Profile Greeting Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Welcome, {user?.fullName || 'Valued Customer'}
                </h1>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Universal Identity Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                📱 Registered Mobile: +91 {user?.mobileNumber || '9876543210'} | Universal ID: <span className="font-bold text-indigo-600 dark:text-indigo-400">{universalQr}</span>
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
            <button
              id="cust-tab-qr"
              onClick={() => setActiveTab('QR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'QR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Universal Loyalty QR</span>
            </button>
            <button
              id="cust-tab-wallets"
              onClick={() => setActiveTab('WALLETS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'WALLETS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Store Rewards</span>
            </button>
            <button
              id="cust-tab-transactions"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Passbook History</span>
            </button>
          </div>
        </div>

        {/* PERMANENT UNIVERSAL QR BANNER / CARD */}
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Universal QR Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                One Customer • One Platform Identity • Universal Access
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your Single Universal Loyalty QR Code
              </h2>
              
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Show this single permanent QR code at checkout at <span className="font-bold text-white">Indian Oil, Paradise Biryani, Reliance Fresh, Bharat Petroleum</span>, or any participating merchant. Point credits and redemptions route automatically to your store-specific reward account!
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-indigo-200 font-medium">Permanent QR ID</div>
                  <div className="text-xs font-mono font-extrabold text-indigo-300 truncate">{universalQr}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-indigo-200 font-medium">Linked Accounts</div>
                  <div className="text-xs font-extrabold text-emerald-400">{memberships.length} Merchant Rewards</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-indigo-200 font-medium">First Visit Auto-Enroll</div>
                  <div className="text-xs font-extrabold text-amber-300">Instant Rewards Setup</div>
                </div>
              </div>
            </div>

            {/* Permanent QR Display Box */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white text-slate-900 shadow-2xl border border-indigo-100">
              <div className="text-center mb-3">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Universal Customer Identity
                </span>
                <div className="text-xs font-extrabold text-indigo-900 font-mono">
                  {user?.fullName || 'Rahul Verma'}
                </div>
              </div>

              <QRViewer
                value={universalQr}
                size={180}
                businessName="Platform Loyalty Identity"
              />

              <div className="mt-3 text-[11px] font-semibold text-slate-500 font-mono text-center">
                +91 {user?.mobileNumber || '9876543210'}
              </div>
            </div>

          </div>
        </div>

        {/* MAIN BUSINESS MEMBERSHIPS CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Independent Store Rewards ({memberships.length})
            </h2>
            <span className="text-xs text-slate-400">
              All linked to your Universal QR Code
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memberships.map((mem) => {
              const isSelected = selectedMembership?.id === mem.id;
              const biz = mem.business;
              const wal = mem.wallet;

              return (
                <div
                  key={mem.id}
                  id={`membership-card-${mem.id}`}
                  onClick={() => setSelectedMembership(mem)}
                  className={`relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-md dark:bg-slate-900 dark:border-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {biz?.logoUrl ? (
                        <img
                          src={biz.logoUrl}
                          alt={biz.name}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                          {biz?.name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {biz?.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {biz?.category}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {biz?.rewardPercentage}% Rewards
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Store Reward Balance
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {wal?.balance.toLocaleString()} <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Pts</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ≈ ₹{((wal?.balance || 0) * (biz?.pointValueInCurrency || 1)).toLocaleString()} Value
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-2 dark:border-slate-800/50">
                    <span>Min Redeem: {biz?.minRedeemPoints} pts</span>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      Scan Universal QR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SELECTED BUSINESS PASSBOOK LEDGER */}
        {selectedMembership && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600" />
                  <span>{activeBiz?.name} Passbook Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immutable transaction history for {activeBiz?.name} wallet
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {filteredTransactions.length} Transactions
              </span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No transactions recorded for {activeBiz?.name} yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Visit cashier POS and scan your Universal QR code to earn points on your bill!
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          tx.type === 'CREDIT'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {tx.narration}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {tx.billNumber && (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Bill #{tx.billNumber}</span>
                          )}
                          {tx.billAmount && (
                            <>
                              <span>•</span>
                              <span>Bill Amount: ₹{tx.billAmount.toLocaleString()}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-black text-base ${
                          tx.type === 'CREDIT'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? `+${tx.points}` : tx.points} Pts
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Bal: {tx.balanceAfter} Pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
