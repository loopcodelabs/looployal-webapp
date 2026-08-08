import React, { useState } from 'react';
import {
  Download,
  FileText,
  ShieldCheck,
  Server,
  Layers,
  Cpu,
  Lock,
  Workflow,
  CheckCircle2,
  Database,
  Smartphone,
  CreditCard,
  Building2,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const ArchitectureDocPage: React.FC = () => {
  const [downloadingArch, setDownloadingArch] = useState(false);
  const [downloadingCost, setDownloadingCost] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'frontend' | 'backend' | 'apis' | 'workflows' | 'security' | 'costs'>('overview');

  const handleDownloadArchDocx = async () => {
    setDownloadingArch(true);
    try {
      const response = await fetch('/api/v1/download/architecture-doc');
      if (!response.ok) throw new Error('Failed to generate document');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Multi_Tenant_Loyalty_SaaS_Production_Architecture.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Error downloading Architecture document. Please try again.');
    } finally {
      setDownloadingArch(false);
    }
  };

  const handleDownloadCostDocx = async () => {
    setDownloadingCost(true);
    try {
      const response = await fetch('/api/v1/download/cost-analysis-doc');
      if (!response.ok) throw new Error('Failed to generate document');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Loyalty_SaaS_API_Inventory_And_Cost_Analysis.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Error downloading Cost Analysis document. Please try again.');
    } finally {
      setDownloadingCost(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO BANNER & DOWNLOAD ACTION */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Production Architecture & Enterprise Blueprint
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Multi-Tenant Loyalty SaaS Architecture
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Comprehensive technical specification covering React 19 SPA frontend, Express REST API backend, double-entry immutable ledger engine, tenant isolation boundaries, and dual-key OTP workflows.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="download-cost-docx-btn"
                onClick={handleDownloadCostDocx}
                disabled={downloadingCost}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {downloadingCost ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-emerald-100" />
                )}
                <div className="text-left">
                  <div className="text-[11px] text-emerald-100 font-normal">API Inventory & Cost Breakdown</div>
                  <div className="text-xs font-extrabold">Download Cost DOCX</div>
                </div>
              </button>

              <button
                id="download-arch-docx-btn"
                onClick={handleDownloadArchDocx}
                disabled={downloadingArch}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {downloadingArch ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-indigo-100" />
                )}
                <div className="text-left">
                  <div className="text-[11px] text-indigo-200 font-normal">Technical Spec</div>
                  <div className="text-xs font-extrabold">Download Arch DOCX</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'overview', label: '1. Executive Overview', icon: Layers },
            { id: 'frontend', label: '2. Frontend Architecture', icon: Smartphone },
            { id: 'backend', label: '3. Backend & Ledger', icon: Server },
            { id: 'apis', label: '4. Complete API Reference', icon: Cpu },
            { id: 'workflows', label: '5. Sequence Workflows', icon: Workflow },
            { id: 'security', label: '6. Security & Multi-Tenancy', icon: Lock },
            { id: 'costs', label: '7. Production Cost & API Analysis', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Multi-Tenant Isolation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Strict tenant boundary isolation preventing cross-tenant customer reward data access. E.g., Indian Oil cashiers cannot view or scan Bharat Petroleum memberships.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Double-Entry Ledger Engine</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Financial-grade double-entry transaction record keeping for points issue and redemption, maintaining audit history and running balances per reward account.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Dual-Key OTP Redemption</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Out-of-band 6-digit SMS OTP validation protects customer balance from fraudulent POS claims, requiring physical customer verification before points deduction.
                </p>
              </div>
            </div>

            {/* SYSTEM SCHEMATIC BOX */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-mono text-sm font-bold text-slate-200">SYSTEM_ARCHITECTURE_SCHEMATIC.SYS</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400">STATUS: PRODUCTION_READY</span>
              </div>
              <pre className="font-mono text-xs sm:text-sm text-sky-300 overflow-x-auto p-4 bg-slate-950 rounded-xl leading-snug">
{`+-----------------------------------------------------------------------------------+
|                            PRESENTATION LAYER (SPA)                               |
| [Customer PWA]        [Cashier POS Scanner]   [Merchant Dashboard]  [Super Admin] |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / REST (Bearer JWT / CORS Guard)
+-----------------------------------------v-----------------------------------------+
|                            API GATEWAY & TENANT MIDDLEWARE                        |
|  Node.js Express  *  JWT Verification Guard  *  Tenant Scope Context Resolver      |
+--------------------+--------------------+--------------------+--------------------+
                     |                    |                    |
+--------------------v----+  +------------v-------+  +---------v----------+
| IN-MEMORY LEDGER ENGINE |  | DATA LAYER STORE   |  | SMS OTP GATEWAY    |
| - Financial Balance Calc|  | - Business Tenants |  | - Out-of-band SMS  |
| - Double-Entry Ledger   |  | - Memberships & QR |  | - 6-Digit OTP Gen  |
| - Audit Trail Recorder  |  | - Wallet Records   |  | - Delivery Audit   |
+-------------------------+  +--------------------+  +--------------------+`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: FRONTEND ARCHITECTURE */}
        {activeTab === 'frontend' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              Frontend SPA Architecture & Role Views
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 1. Customer PWA Interface
                </h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4">
                  <li><strong>Instant Mobile OTP Login:</strong> Enter 10-digit mobile number, receive SMS OTP.</li>
                  <li><strong>Multi-Brand Digital Reward Passbook:</strong> Displays separate reward accounts for Indian Oil, Bharat Petroleum, Paradise Biryani, etc.</li>
                  <li><strong>Dynamic High-Contrast QR Generator:</strong> Generates unique membership QR code for POS scanner scanning.</li>
                  <li><strong>Real-time Transaction History:</strong> Direct ledger activity log showing points credited and redeemed per business.</li>
                </ul>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 2. Cashier POS Terminal
                </h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4">
                  <li><strong>Instant QR Code & Mobile Scanner:</strong> Auto-populates membership details within &lt;500ms.</li>
                  <li><strong>Automatic Cash Back Calculator:</strong> Calculates exact points based on tenant reward percentage.</li>
                  <li><strong>Tenant Scope Validation:</strong> Prevents scanning QR codes belonging to non-tenant business entities.</li>
                  <li><strong>OTP Verification Dialog:</strong> Interactive modal for triggering and verifying out-of-band redemption OTPs.</li>
                </ul>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 3. Merchant Owner Dashboard
                </h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4">
                  <li><strong>Executive Business Metrics:</strong> Total billings processed, active customers, points issued vs redeemed, rewards point liabilities.</li>
                  <li><strong>Branch Network Management:</strong> Add/manage retail fuel stations and store branches.</li>
                  <li><strong>Staff Management:</strong> Assign cashiers and branch managers with employee ID codes.</li>
                  <li><strong>Rule Configurator:</strong> Live slider control to configure reward percentage and minimum point redemption thresholds.</li>
                </ul>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 4. Platform Super Admin Portal
                </h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4">
                  <li><strong>Tenant Business Onboarding:</strong> Onboard new enterprise brands (e.g. Bharat Petroleum, Reliance).</li>
                  <li><strong>System-wide User Registry:</strong> Monitor platform-wide customers, cashiers, and business owners.</li>
                  <li><strong>Security & Audit Trail:</strong> Complete real-time audit log of system events and security block triggers.</li>
                  <li><strong>Abstract SMS Dispatch Monitor:</strong> Inspect SMS log delivery status and OTP dispatch events.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKEND & LEDGER */}
        {activeTab === 'backend' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              Backend Server & Immutable Ledger Engine
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <p>
                The backend service runs on Node.js using Express and TypeScript. Data operations are governed by an in-memory double-entry ledger database pattern designed for zero race conditions and high performance.
              </p>
              
              <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-2">
                <div className="text-emerald-400 font-bold">// LEDGER ATOMIC TRANSACTION ENTRY STRUCT</div>
                <div>{`interface Transaction {`}</div>
                <div className="pl-4">{`id: string;              // Unique ledger UUID`}</div>
                <div className="pl-4">{`rewardAccountId: string; // Target reward account reference`}</div>
                <div className="pl-4">{`membershipId: string;    // Customer business membership code`}</div>
                <div className="pl-4">{`businessId: string;      // Business tenant scope`}</div>
                <div className="pl-4">{`branchId: string | null; // Retail branch location`}</div>
                <div className="pl-4">{`type: 'CREDIT' | 'DEBIT';// Double-entry operation`}</div>
                <div className="pl-4">{`points: number;          // Point quantum`}</div>
                <div className="pl-4">{`billAmount?: number;     // Associated currency transaction`}</div>
                <div className="pl-4">{`reference: string;       // Receipt / Bill reference code`}</div>
                <div className="pl-4">{`balanceAfter: number;    // Immutable reward account point balance after transaction`}</div>
                <div className="pl-4">{`createdAt: string;       // Timestamp ISO 8601`}</div>
                <div>{`}`}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPLETE API REFERENCE */}
        {activeTab === 'apis' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 overflow-x-auto">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Complete REST API Endpoint Reference
            </h2>
            
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-3">HTTP Method</th>
                  <th className="py-3 px-3">Endpoint Path</th>
                  <th className="py-3 px-3">Auth Guard</th>
                  <th className="py-3 px-3">Description & Tenant Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">POST</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/auth/otp/request</td>
                  <td className="py-3 px-3 text-slate-400">Public</td>
                  <td className="py-3 px-3">Dispatches 6-digit SMS OTP for customer mobile login.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">POST</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/auth/otp/verify</td>
                  <td className="py-3 px-3 text-slate-400">Public</td>
                  <td className="py-3 px-3">Verifies customer OTP, auto-creates memberships & issues JWT.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">POST</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/auth/login</td>
                  <td className="py-3 px-3 text-slate-400">Public</td>
                  <td className="py-3 px-3">Email + password authentication for Cashier, Owner, Admin.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-blue-600 font-bold">GET</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/cashier/membership/scan/:code</td>
                  <td className="py-3 px-3 text-blue-600 font-medium">CASHIER, OWNER</td>
                  <td className="py-3 px-3">Scans QR/Mobile. Blocks cross-tenant QR code access.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">POST</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/cashier/points/credit</td>
                  <td className="py-3 px-3 text-blue-600 font-medium">CASHIER, OWNER</td>
                  <td className="py-3 px-3">Issues points based on bill amount & tenant cashback percentage.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">POST</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/cashier/redemption/request-otp</td>
                  <td className="py-3 px-3 text-blue-600 font-medium">CASHIER, OWNER</td>
                  <td className="py-3 px-3">Generates customer out-of-band redemption OTP.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">POST</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/cashier/points/redeem</td>
                  <td className="py-3 px-3 text-blue-600 font-medium">CASHIER, OWNER</td>
                  <td className="py-3 px-3">Validates OTP & deducts points from reward account ledger.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-blue-600 font-bold">GET</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/merchant/metrics</td>
                  <td className="py-3 px-3 text-amber-600 font-medium">BUSINESS_OWNER</td>
                  <td className="py-3 px-3">Returns tenant sales metrics, active points & rewards liability.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-indigo-600 font-bold">GET</td>
                  <td className="py-3 px-3 font-mono font-semibold">/api/v1/download/architecture-doc</td>
                  <td className="py-3 px-3 text-slate-400">Public</td>
                  <td className="py-3 px-3">Generates downloadable Word (.docx) production specification document.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: WORKFLOWS */}
        {activeTab === 'workflows' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Workflow className="w-5 h-5 text-indigo-600" />
              Operational Sequence Diagrams
            </h2>
            <div className="space-y-6">
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Sequence 1: Cashier Issue Points Flow (Credit Transaction)
                </h3>
                <div className="font-mono text-xs bg-slate-950 text-indigo-300 p-4 rounded-xl overflow-x-auto leading-relaxed">
{`[Customer POS] ----(1. Present QR Code)----> [Cashier Scanner]
[Cashier POS] ----(2. GET /scan/MEM-BPCL)----> [Tenant Auth Middleware]
[Middleware]  ----(3. Verify Tenant ID)-----> [Multi-Tenant Store]
[Cashier POS] ----(4. Input Bill ₹10,333)----> [Express Backend]
[Backend]     ----(5. Calculate 6% = 620)-> [Ledger Engine] (Atomic Commit)
[Backend]     ----(6. Send SMS Notice)-----> [SMS Provider] ----> [Customer Phone]`}
                </div>
              </div>

              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Sequence 2: Dual-Key Point Redemption with OTP Guard
                </h3>
                <div className="font-mono text-xs bg-slate-950 text-emerald-300 p-4 rounded-xl overflow-x-auto leading-relaxed">
{`[Customer]    ----(1. Request Redeem 500 Pts)---> [Cashier]
[Cashier POS] ----(2. POST /redemption/otp)-----> [OTP Generator Service]
[OTP Engine]  ----(3. SMS OTP: 839201)----------> [Customer Phone]
[Customer]    ----(4. Dictates OTP 839201)------> [Cashier Input]
[Cashier POS] ----(5. POST /points/redeem)------> [Backend OTP Verifier]
[Backend]     ----(6. Verify & Deduct Ledger)---> [Rewards Ledger]`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Zero-Trust Multi-Tenancy & Security Model
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Tenant Isolation Guarantee</h3>
                <p className="text-slate-500">
                  Every cashier and merchant user has an associated <code className="text-indigo-600">businessId</code> claim attached to their authenticated JWT token. Backend queries enforce <code className="text-indigo-600">WHERE businessId = req.businessId</code> filter on all data accesses.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Cross-Tenant Block & Audit Trigger</h3>
                <p className="text-slate-500">
                  If a cashier attempts to scan a QR code belonging to a different business tenant (e.g. Indian Oil cashier scanning a Bharat Petroleum membership), the system rejects the transaction with HTTP 403 Forbidden and logs a <code className="text-rose-600 font-bold">SECURITY_TENANT_VIOLATION_BLOCKED</code> audit record.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PRODUCTION COST & API ANALYSIS */}
        {activeTab === 'costs' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Production Cost & API Inventory Analysis
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Detailed financial model for onboarding 1 Tenant (2 Branches, 500 Customers) & Tiered Production Scaling.
                </p>
              </div>

              <button
                onClick={handleDownloadCostDocx}
                disabled={downloadingCost}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Cost DOCX</span>
              </button>
            </div>

            {/* COST SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Baseline 1 Tenant Cost</span>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">$54.50 <span className="text-xs font-normal">/ month</span></div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">~₹4,500 INR / mo (2 branches, 500 users)</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-1">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Monthly SMS Volume</span>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-100">2,900 <span className="text-xs font-normal">SMS / mo</span></div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300">700 Logins + 2,000 Receipts + 200 Redemptions</div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-1">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Database Engine</span>
                <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100">MySQL 8.0+</div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300">Cloud SQL / RDS Managed Database</div>
              </div>
            </div>

            {/* EXTERNAL APIS & SERVICES TABLE */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> External APIs & Service Integrations Inventory
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Service Name</th>
                      <th className="py-3 px-4">Purpose in SaaS Platform</th>
                      <th className="py-3 px-4">API Rate / Billing Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Transactional SMS Gateway (SMSLocal / DLT Compliant)</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">OTP verification for customer login, POS point redemption authorization, real-time reward receipt SMS alerts.</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">$0.005 / SMS (India)<br /><span className="text-[11px] text-slate-400">$0.0079 / SMS (US/EU)</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Google Gemini AI API (@google/genai)</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Automated transaction anomaly detection, smart fraud analysis, customer spending sentiment & personalized offer generation.</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">$0.00001875 / 1K tokens</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Managed MySQL Database (Cloud SQL / AWS RDS)</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Relational multi-tenant persistent database storing users, tenant businesses, branches, reward accounts, and double-entry transaction ledgers.</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">$25.00 / mo (db-f1-micro)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Serverless App Hosting (Cloud Run / AWS Fargate)</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Runs containerized Node.js Express server on Port 3000 behind reverse proxy layer.</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">$12.00 / mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MONTHLY BREAKDOWN FOR 1 TENANT */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" /> Monthly Cost Breakdown (1 Tenant: 2 Branches, 500 Customers)
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4">Monthly Metric / Spec</th>
                      <th className="py-3 px-4">Estimated Monthly Cost ($ USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3 px-4 font-bold">Transactional SMS</td>
                      <td className="py-3 px-4">2,900 SMS (700 OTP + 2,000 Receipts + 200 Redemptions)</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">$14.50</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold">Cloud Run App Host</td>
                      <td className="py-3 px-4">1 Container (0.5 vCPU, 1 GB RAM, auto-scale 0-2)</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">$12.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold">Cloud SQL MySQL DB</td>
                      <td className="py-3 px-4">1 vCPU, 1 GB RAM, 10 GB SSD Storage</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">$25.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold">Gemini AI API</td>
                      <td className="py-3 px-4">500 API Calls / month</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">$1.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold">Domain & SSL CDN</td>
                      <td className="py-3 px-4">Cloudflare DNS & Edge SSL</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">$2.00</td>
                    </tr>
                    <tr className="bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-100">
                      <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400">TOTAL COST (1 TENANT)</td>
                      <td className="py-3 px-4">2 Branches / 500 Active Customers</td>
                      <td className="py-3 px-4 text-base font-black text-emerald-600 dark:text-emerald-400">$54.50 / mo (~₹4,500 INR)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SCALED PRODUCTION TIERS */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Scaled Production Deployment Cost Tiers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Starter Production Tier</div>
                  <div className="text-slate-500">1 - 5 Tenants • 2,500 Active Customers</div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400">$150 - $220 / month</div>
                  <div className="text-[11px] text-slate-400">Shared MySQL db-f1-micro, 1 Cloud Run container, 14,500 SMS.</div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Mid-Market Growth Tier</div>
                  <div className="text-slate-500">25 Tenants • 25,000 Active Customers</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">$650 - $900 / month</div>
                  <div className="text-[11px] text-slate-400">Cloud SQL db-g1-small (High-Availability), 3 Cloud Run instances, 145,000 SMS.</div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Enterprise Scale Tier</div>
                  <div className="text-slate-500">100+ Tenants • 100,000+ Active Customers</div>
                  <div className="text-lg font-black text-purple-600 dark:text-purple-400">$2,500 - $3,800 / month</div>
                  <div className="text-[11px] text-slate-400">Cloud SQL db-custom-4-15360 with Read Replicas, K8s cluster, 580,000 SMS.</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
