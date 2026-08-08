import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Business, User, AuditLog, SMSLog } from '../types';
import { api } from '../services/api';
import {
  ShieldCheck,
  Building2,
  Users,
  FileText,
  MessageSquare,
  Plus,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BUSINESSES' | 'USERS' | 'AUDIT' | 'SMS'>('BUSINESSES');

  // New Business Modal Form
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [bizForm, setBizForm] = useState({
    name: '',
    code: '',
    category: 'Supermarket & Retail',
    rewardPercentage: 5,
    minRedeemPoints: 100,
    ownerEmail: '',
    ownerName: '',
  });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resBiz = await api.getAdminBusinesses();
      setBusinesses(resBiz.businesses);

      const resUsers = await api.getAdminUsers();
      setUsers(resUsers.users);

      const resAudit = await api.getAdminAuditLogs();
      setAuditLogs(resAudit.auditLogs);

      const resSMS = await api.getAdminSMSLogs();
      setSmsLogs(resSMS.smsLogs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminBusiness(bizForm);
      setShowAddBiz(false);
      setBizForm({
        name: '',
        code: '',
        category: 'Supermarket & Retail',
        rewardPercentage: 5,
        minRedeemPoints: 100,
        ownerEmail: '',
        ownerName: '',
      });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="admin-dashboard" className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar */}
        <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 font-bold text-lg border border-purple-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Platform Administration Portal
                </h1>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Global Tenant Governance • Multi-tenant Isolation • System Audit
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800 text-xs font-bold">
            <button
              id="admin-tab-businesses"
              onClick={() => setActiveTab('BUSINESSES')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'BUSINESSES'
                  ? 'bg-white text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Tenants ({businesses.length})
            </button>
            <button
              id="admin-tab-users"
              onClick={() => setActiveTab('USERS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'USERS'
                  ? 'bg-white text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              id="admin-tab-audit"
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'AUDIT'
                  ? 'bg-white text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
            <button
              id="admin-tab-sms"
              onClick={() => setActiveTab('SMS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'SMS'
                  ? 'bg-white text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              SMS Service Logs ({smsLogs.length})
            </button>
          </div>
        </div>

        {/* 1. BUSINESS TENANTS TAB */}
        {activeTab === 'BUSINESSES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Business Tenants
              </h3>
              <button
                id="admin-add-tenant-btn"
                onClick={() => setShowAddBiz(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                <span>Onboard New Tenant Business</span>
              </button>
            </div>

            {showAddBiz && (
              <form onSubmit={handleCreateBusiness} className="p-6 rounded-2xl border border-purple-200 bg-white dark:border-purple-900/50 dark:bg-slate-900 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Onboard New Tenant</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold">Business Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Reliance Smart"
                      value={bizForm.name}
                      onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Tenant Code (Uppercase)</label>
                    <input
                      required
                      type="text"
                      placeholder="RELIANCE"
                      value={bizForm.code}
                      onChange={(e) => setBizForm({ ...bizForm, code: e.target.value.toUpperCase() })}
                      className="w-full mt-1 p-2.5 border rounded-xl font-mono dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Category</label>
                    <input
                      required
                      type="text"
                      placeholder="Supermarket & Retail"
                      value={bizForm.category}
                      onChange={(e) => setBizForm({ ...bizForm, category: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Reward %</label>
                    <input
                      required
                      type="number"
                      value={bizForm.rewardPercentage}
                      onChange={(e) => setBizForm({ ...bizForm, rewardPercentage: Number(e.target.value) })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Min Redeem Points</label>
                    <input
                      required
                      type="number"
                      value={bizForm.minRedeemPoints}
                      onChange={(e) => setBizForm({ ...bizForm, minRedeemPoints: Number(e.target.value) })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Owner Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Ananya Gupta"
                      value={bizForm.ownerName}
                      onChange={(e) => setBizForm({ ...bizForm, ownerName: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold">Owner Email</label>
                    <input
                      required
                      type="email"
                      placeholder="owner@reliance.com"
                      value={bizForm.ownerEmail}
                      onChange={(e) => setBizForm({ ...bizForm, ownerEmail: e.target.value })}
                      className="w-full mt-1 p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddBiz(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
                    Provision Tenant
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businesses.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {b.logoUrl && <img src={b.logoUrl} alt={b.name} className="h-9 w-9 rounded-xl object-cover" />}
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">{b.code}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active Tenant
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>Category: <span className="font-semibold text-slate-800 dark:text-slate-200">{b.category}</span></div>
                    <div>Reward Rate: <span className="font-bold text-purple-600">{b.rewardPercentage}% of bill</span></div>
                    <div>Min Redeem: <span className="font-bold">{b.minRedeemPoints} Points</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'USERS' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Platform Users Registry
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">User ID</th>
                    <th className="pb-3 font-semibold">Full Name</th>
                    <th className="pb-3 font-semibold">Email / Mobile</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-mono text-slate-400 text-[11px]">{u.id}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{u.fullName}</td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{u.email || `+91 ${u.mobileNumber}`}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-emerald-600 font-bold text-[11px]">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. AUDIT TRAIL LOGS TAB */}
        {activeTab === 'AUDIT' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Real-Time System Audit Logs</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">Actor Role</th>
                    <th className="pb-3 font-semibold">Tenant Business</th>
                    <th className="pb-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5 font-bold text-purple-600 dark:text-purple-400">{log.action}</td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">{log.actorRole}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{log.businessName || 'System'}</td>
                      <td className="py-2.5 text-slate-500 max-w-md truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ABSTRACT SMS SERVICE LOGS TAB */}
        {activeTab === 'SMS' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <span>Abstract SMS Notification Engine History</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">Recipient Mobile</th>
                    <th className="pb-3 font-semibold">Message Payload</th>
                    <th className="pb-3 font-semibold">Dispatch Status</th>
                    <th className="pb-3 font-semibold">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {smsLogs.map((sms) => (
                    <tr key={sms.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">+91 {sms.recipientMobile}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300 max-w-lg font-sans text-xs">{sms.message}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {sms.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{new Date(sms.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
