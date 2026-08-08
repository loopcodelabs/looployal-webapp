import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Business, MerchantMetrics, Branch, Employee } from '../types';
import { api } from '../services/api';
import {
  Building2,
  TrendingUp,
  Gift,
  Users,
  CreditCard,
  Settings,
  Plus,
  History,
  Store,
  UserPlus,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const MerchantDashboard: React.FC = () => {
  const { employee, user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [metrics, setMetrics] = useState<MerchantMetrics | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'BRANCHES' | 'EMPLOYEES' | 'CUSTOMERS' | 'SETTINGS'>('METRICS');

  // Modal / Form States
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', city: '', phone: '' });

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [empForm, setEmpForm] = useState({ fullName: '', email: '', role: 'CASHIER', branchId: '' });

  // Settings State
  const [rewardPercentage, setRewardPercentage] = useState<number>(5);
  const [minRedeemPoints, setMinRedeemPoints] = useState<number>(100);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const resMet = await api.getMerchantMetrics();
      setBusiness(resMet.business);
      setMetrics(resMet.metrics);
      setRewardPercentage(resMet.business.rewardPercentage);
      setMinRedeemPoints(resMet.business.minRedeemPoints);

      const resBr = await api.getBranches();
      setBranches(resBr.branches);

      const resEmp = await api.getEmployees();
      setEmployees(resEmp.employees);

      const resCust = await api.getBusinessCustomers();
      setCustomers(resCust.customers);
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  // Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBranch(branchForm);
      setShowAddBranch(false);
      setBranchForm({ name: '', code: '', address: '', city: '', phone: '' });
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee(empForm);
      setShowAddEmp(false);
      setEmpForm({ fullName: '', email: '', role: 'CASHIER', branchId: '' });
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateMerchantSettings(rewardPercentage, minRedeemPoints);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="merchant-dashboard" className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar */}
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/40 dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="h-12 w-12 rounded-2xl object-cover border border-slate-200" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 font-bold text-lg border border-amber-500/20">
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {business?.name || 'Business Workspace'}
                </h1>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Category: {business?.category} • Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{business?.code}</span>
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800 text-xs font-bold">
            <button
              id="merchant-tab-metrics"
              onClick={() => setActiveTab('METRICS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'METRICS'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Overview Metrics
            </button>
            <button
              id="merchant-tab-branches"
              onClick={() => setActiveTab('BRANCHES')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'BRANCHES'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Branches ({branches.length})
            </button>
            <button
              id="merchant-tab-employees"
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Staff ({employees.length})
            </button>
            <button
              id="merchant-tab-customers"
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Customers ({customers.length})
            </button>
            <button
              id="merchant-tab-settings"
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'SETTINGS'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Reward Rules
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW METRICS TAB (Exclusively 6 key stats per prompt mandate) */}
        {activeTab === 'METRICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Today's Sales */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Today's Sales</span>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  ₹{(metrics?.todaysSales || 0).toLocaleString()}
                </div>
              </div>

              {/* Points Issued */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Points Issued</span>
                  <Gift className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {(metrics?.pointsIssued || 0).toLocaleString()} <span className="text-xs font-semibold text-amber-600">Pts</span>
                </div>
              </div>

              {/* Points Redeemed */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Points Redeemed</span>
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {(metrics?.pointsRedeemed || 0).toLocaleString()} <span className="text-xs font-semibold text-indigo-600">Pts</span>
                </div>
              </div>

              {/* Rewards Liability */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Rewards Liability</span>
                  <Building2 className="h-4 w-4 text-rose-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {((metrics?.rewardsLiability ?? metrics?.walletLiability) || 0).toLocaleString()} <span className="text-xs font-semibold text-rose-600">Pts</span>
                </div>
              </div>

              {/* Customer Count */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Customer Count</span>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {metrics?.customerCount || 0}
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-600" />
                  <span>Recent Business Transactions</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Immutable Ledger Stream
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <tr>
                      <th className="pb-3 font-semibold">Ref Code</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Bill Amount</th>
                      <th className="pb-3 font-semibold">Points</th>
                      <th className="pb-3 font-semibold">Balance After</th>
                      <th className="pb-3 font-semibold">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {metrics?.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{tx.reference}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'CREDIT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3">{tx.billAmount ? `₹${tx.billAmount.toLocaleString()}` : '-'}</td>
                        <td className="py-3 font-bold">
                          <span className={tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-indigo-600'}>
                            {tx.type === 'CREDIT' ? `+${tx.points}` : tx.points} Pts
                          </span>
                        </td>
                        <td className="py-3 font-mono">{tx.balanceAfter} Pts</td>
                        <td className="py-3 text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. BRANCHES MANAGEMENT TAB */}
        {activeTab === 'BRANCHES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Business Branch Locations
              </h3>
              <button
                id="merchant-add-branch-btn"
                onClick={() => setShowAddBranch(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Branch</span>
              </button>
            </div>

            {showAddBranch && (
              <form onSubmit={handleCreateBranch} className="p-6 rounded-2xl border border-amber-200 bg-white dark:border-amber-900/50 dark:bg-slate-900 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Create Branch Location</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold">Branch Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Downtown Station"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Branch Code</label>
                    <input
                      required
                      type="text"
                      placeholder="IO-DT-01"
                      value={branchForm.code}
                      onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl font-mono dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">City</label>
                    <input
                      required
                      type="text"
                      placeholder="Bengaluru"
                      value={branchForm.city}
                      onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold">Address</label>
                    <input
                      required
                      type="text"
                      placeholder="100 Ring Road, Sector 4"
                      value={branchForm.address}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9800000001"
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBranch(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">
                    Save Branch
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-amber-600" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</h4>
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 dark:bg-slate-800 dark:text-slate-300">{b.code}</span>
                    </div>
                    <p className="text-xs text-slate-500">{b.address}, {b.city}</p>
                    {b.phone && <p className="text-[11px] text-slate-400">📞 {b.phone}</p>}
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. EMPLOYEES / STAFF MANAGEMENT TAB */}
        {activeTab === 'EMPLOYEES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cashiers & Branch Managers
              </h3>
              <button
                id="merchant-add-employee-btn"
                onClick={() => setShowAddEmp(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {showAddEmp && (
              <form onSubmit={handleCreateEmployee} className="p-6 rounded-2xl border border-amber-200 bg-white dark:border-amber-900/50 dark:bg-slate-900 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Add Staff Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold">Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Ramesh Kumar"
                      value={empForm.fullName}
                      onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Email Address</label>
                    <input
                      required
                      type="email"
                      placeholder="cashier2@indianoil.com"
                      value={empForm.email}
                      onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Role Assignment</label>
                    <select
                      value={empForm.role}
                      onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="CASHIER">CASHIER</option>
                      <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold">Assigned Branch</label>
                    <select
                      value={empForm.branchId}
                      onChange={(e) => setEmpForm({ ...empForm, branchId: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="">(All Branches / Corporate)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEmp(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">
                    Create Staff
                  </button>
                </div>
              </form>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">Staff Member</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Assigned Branch</th>
                    <th className="pb-3 font-semibold">Emp Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{emp.user?.fullName}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{emp.user?.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{emp.branch?.name || 'All Branches'}</td>
                      <td className="py-3 font-mono text-slate-400">{emp.employeeCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CUSTOMERS LIST TAB */}
        {activeTab === 'CUSTOMERS' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enrolled Customer Memberships
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Mobile Number</th>
                    <th className="pb-3 font-semibold">Membership Code</th>
                    <th className="pb-3 font-semibold">Reward Balance</th>
                    <th className="pb-3 font-semibold">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {customers.map((c) => (
                    <tr key={c.membership.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{c.customer?.name}</td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300">+91 {c.customer?.mobileNumber}</td>
                      <td className="py-3 font-mono text-slate-400">{c.membership?.membershipCode}</td>
                      <td className="py-3 font-black text-amber-600">{(c.rewardAccount || c.wallet)?.balance} Pts</td>
                      <td className="py-3 text-slate-400">{new Date(c.membership?.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SETTINGS TAB (Strictly 1 Reward Rule per MVP requirement!) */}
        {activeTab === 'SETTINGS' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-600" />
                <span>Loyalty Reward Settings (MVP Single Rule)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your business's flat reward percentage and minimum point redemption threshold.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Reward settings updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Reward Percentage (%)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="merchant-reward-percentage-input"
                    type="number"
                    min={1}
                    max={50}
                    value={rewardPercentage}
                    onChange={(e) => setRewardPercentage(Number(e.target.value))}
                    className="w-full p-3 border rounded-xl font-bold text-base dark:bg-slate-800 dark:border-slate-700"
                  />
                  <span className="font-bold text-slate-500">% per ₹100 bill</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Example: 5% means ₹1,000 bill awards 50 Loyalty Points.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Minimum Redeemable Points Threshold
                </label>
                <input
                  id="merchant-min-redeem-input"
                  type="number"
                  min={10}
                  value={minRedeemPoints}
                  onChange={(e) => setMinRedeemPoints(Number(e.target.value))}
                  className="w-full mt-1 p-3 border rounded-xl font-bold text-base dark:bg-slate-800 dark:border-slate-700"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Customers must accumulate at least this balance before cashiers can initiate redemptions.
                </p>
              </div>

              <button
                id="merchant-save-settings-btn"
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition"
              >
                Save Reward Rules
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
