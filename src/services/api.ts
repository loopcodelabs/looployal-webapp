import {
  User,
  Employee,
  BusinessMembership,
  RewardTransaction,
  WalletTransaction,
  MerchantMetrics,
  Branch,
  Business,
  AuditLog,
  SMSLog
} from '../types';

const TOKEN_KEY = 'loyalty_saas_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'An unexpected API error occurred');
  }

  return data;
}

export const api = {
  // Auth
  requestOTP: (mobileNumber: string, type: 'LOGIN' | 'REDEMPTION' = 'LOGIN') =>
    apiRequest<{ success: boolean; message: string; otp: string; mobileNumber: string }>(
      '/api/v1/auth/otp/request',
      {
        method: 'POST',
        body: JSON.stringify({ mobileNumber, type }),
      }
    ),

  verifyOTP: (mobileNumber: string, otp: string) =>
    apiRequest<{
      success: boolean;
      token: string;
      user: User;
      memberships: BusinessMembership[];
    }>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp }),
    }),

  loginStaff: (email: string, password: string) =>
    apiRequest<{
      success: boolean;
      token: string;
      user: User;
      employee?: Employee;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () =>
    apiRequest<{
      success: boolean;
      user: User;
      employee?: Employee;
      memberships?: BusinessMembership[];
    }>('/api/v1/auth/me'),

  // Customer
  getCustomerMemberships: () =>
    apiRequest<{ success: boolean; memberships: BusinessMembership[] }>('/api/v1/customer/memberships'),

  getCustomerTransactions: () =>
    apiRequest<{ success: boolean; transactions: WalletTransaction[] }>('/api/v1/customer/transactions'),

  // Cashier
  scanMembershipCode: (code: string) =>
    apiRequest<{
      success: boolean;
      membership: BusinessMembership;
      recentTransactions: WalletTransaction[];
    }>(`/api/v1/cashier/membership/scan/${encodeURIComponent(code)}`),

  requestCreditOTP: (membershipId: string, billNumber: string, billAmount: number) =>
    apiRequest<{
      success: boolean;
      message: string;
      otp: string;
      mobileNumber: string;
    }>('/api/v1/cashier/points/credit-otp', {
      method: 'POST',
      body: JSON.stringify({ membershipId, billNumber, billAmount }),
    }),

  creditPoints: (membershipId: string, billNumber: string, billAmount: number, otp: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      transaction: WalletTransaction;
      updatedWallet: any;
    }>('/api/v1/cashier/points/credit', {
      method: 'POST',
      body: JSON.stringify({ membershipId, billNumber, billAmount, otp }),
    }),

  requestRedemptionOTP: (membershipId: string, pointsToRedeem: number) =>
    apiRequest<{
      success: boolean;
      message: string;
      otp: string;
      mobileNumber: string;
    }>('/api/v1/cashier/redemption/request-otp', {
      method: 'POST',
      body: JSON.stringify({ membershipId, pointsToRedeem }),
    }),

  redeemPoints: (membershipId: string, pointsToRedeem: number, otp: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      transaction: WalletTransaction;
      updatedWallet: any;
    }>('/api/v1/cashier/points/redeem', {
      method: 'POST',
      body: JSON.stringify({ membershipId, pointsToRedeem, otp }),
    }),

  // Merchant
  getMerchantMetrics: () =>
    apiRequest<{
      success: boolean;
      business: Business;
      metrics: MerchantMetrics;
    }>('/api/v1/merchant/metrics'),

  getBranches: () =>
    apiRequest<{ success: boolean; branches: Branch[] }>('/api/v1/merchant/branches'),

  createBranch: (data: { name: string; code: string; address: string; city: string; phone?: string }) =>
    apiRequest<{ success: boolean; branch: Branch }>('/api/v1/merchant/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEmployees: () =>
    apiRequest<{ success: boolean; employees: Employee[] }>('/api/v1/merchant/employees'),

  createEmployee: (data: { fullName: string; email: string; role: string; branchId?: string }) =>
    apiRequest<{ success: boolean; employee: Employee }>('/api/v1/merchant/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBusinessCustomers: () =>
    apiRequest<{
      success: boolean;
      customers: Array<{
        membership: BusinessMembership;
        customer: any;
        wallet: any;
        lastTransactionAt: string | null;
      }>;
    }>('/api/v1/merchant/customers'),

  getMerchantSettings: () =>
    apiRequest<{ success: boolean; settings: Business }>('/api/v1/merchant/settings'),

  updateMerchantSettings: (rewardPercentage: number, minRedeemPoints: number) =>
    apiRequest<{ success: boolean; settings: Business }>('/api/v1/merchant/settings', {
      method: 'PUT',
      body: JSON.stringify({ rewardPercentage, minRedeemPoints }),
    }),

  getMerchantRewards: () =>
    apiRequest<{ success: boolean; rewards: any[] }>('/api/v1/merchant/rewards'),

  createMerchantReward: (data: any) =>
    apiRequest<{ success: boolean; reward: any }>('/api/v1/merchant/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMerchantReward: (id: string, data: any) =>
    apiRequest<{ success: boolean; reward: any }>(`/api/v1/merchant/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMerchantRedemptions: () =>
    apiRequest<{ success: boolean; redemptions: any[] }>('/api/v1/merchant/redemptions'),

  processMerchantRedemption: (id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', notes?: string) =>
    apiRequest<{ success: boolean; redemption: any }>(`/api/v1/merchant/redemptions/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  getMerchantSmsConfig: () =>
    apiRequest<{ success: boolean; smsConfig: any }>('/api/v1/merchant/sms-config'),

  updateMerchantSmsConfig: (data: any) =>
    apiRequest<{ success: boolean; smsConfig: any }>('/api/v1/merchant/sms-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Platform Admin
  getAdminBusinesses: () =>
    apiRequest<{ success: boolean; businesses: Business[] }>('/api/v1/admin/businesses'),

  createAdminBusiness: (data: {
    name: string;
    code: string;
    category: string;
    rewardPercentage: number;
    minRedeemPoints: number;
    ownerEmail: string;
    ownerName: string;
  }) =>
    apiRequest<{ success: boolean; business: Business }>('/api/v1/admin/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAdminUsers: () =>
    apiRequest<{ success: boolean; users: User[] }>('/api/v1/admin/users'),

  getAdminAuditLogs: () =>
    apiRequest<{ success: boolean; auditLogs: AuditLog[] }>('/api/v1/admin/audit'),

  getAdminSMSLogs: () =>
    apiRequest<{ success: boolean; smsLogs: SMSLog[] }>('/api/v1/admin/sms-logs'),
};
