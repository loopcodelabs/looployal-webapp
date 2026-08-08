export type UserRole = 'PLATFORM_ADMIN' | 'BUSINESS_OWNER' | 'BRANCH_MANAGER' | 'CASHIER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string | null;
  mobileNumber: string | null;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  category: string;
  rewardPercentage: number; // e.g. 5 means 5% points per bill
  minRedeemPoints: number; // e.g. 100
  pointValueInCurrency: number; // e.g. ₹1 per point
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  businessId: string;
  branchId: string | null;
  role: 'BUSINESS_OWNER' | 'BRANCH_MANAGER' | 'CASHIER';
  employeeCode: string;
  isActive?: boolean;
  createdAt: string;
  user?: User;
  branch?: Branch;
  business?: Business;
}

export interface Customer {
  id: string;
  publicId?: string; // Permanent Public Customer ID e.g. CUS_9876543210
  userId: string;
  mobileNumber: string;
  name: string;
  email: string | null;
  universalQrCode: string; // Permanent Universal Customer Identity QR Token (e.g. loyalty://customer/CUS_9876543210)
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt?: string;
}

// Customer Merchant Loyalty Account (Merchant-specific loyalty balance)
export interface CustomerMerchantLoyaltyAccount {
  id: string;
  customerId: string;
  merchantId?: string; // Business ID
  businessId?: string; // Alias for merchantId
  membershipCode: string; // Store-specific membership reference code
  pointsBalance?: number;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  business?: Business;
  customer?: Customer;
  rewardAccount?: RewardAccount;
  wallet?: RewardAccount;
}

// Alias for backwards compatibility
export type BusinessMembership = CustomerMerchantLoyaltyAccount;

export interface RewardAccount {
  id: string;
  membershipId: string;
  businessId: string;
  customerId?: string;
  balance: number;
  currencyName: string;
  currency?: string;
  status: 'ACTIVE' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

// Alias for backwards compatibility
export type Wallet = RewardAccount;

export type TransactionType = 'CREDIT' | 'EARN' | 'REDEEM' | 'REVERSAL' | 'ADJUSTMENT';

export interface RewardTransaction {
  id: string;
  customerMerchantLoyaltyAccountId?: string;
  membershipId: string; // Alias for customerMerchantLoyaltyAccountId
  rewardAccountId?: string;
  walletId?: string;
  businessId: string;
  merchantId?: string; // Alias for businessId
  customerId?: string;
  branchId: string | null;
  cashierUserId: string | null;
  employeeId?: string | null;
  purchaseTransactionId?: string | null;
  redemptionId?: string | null;
  type: TransactionType;
  points: number;
  billAmount: number | null;
  billNumber: string | null;
  reference: string;
  narration: string;
  balanceAfter: number;
  createdAt: string;
  businessName?: string;
  branchName?: string;
  cashierName?: string;
}

// Alias for backwards compatibility
export type WalletTransaction = RewardTransaction;

export interface PurchaseTransaction {
  id: string;
  merchantId: string;
  customerId: string;
  customerMerchantLoyaltyAccountId: string;
  employeeId: string;
  purchaseAmount: number;
  rewardPercentage: number;
  pointsEarned: number;
  status: 'COMPLETED' | 'REVERSED';
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  type: 'CASH' | 'PRODUCT';
  pointsRequired: number;
  cashValue: number;
  productName: string;
  stockQuantity: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  id: string;
  merchantId: string;
  customerId: string;
  customerMerchantLoyaltyAccountId: string;
  rewardId: string;
  rewardName?: string;
  rewardType?: 'CASH' | 'PRODUCT';
  pointsRedeemed: number;
  cashValue?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  processedByEmployeeId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantSmsConfiguration {
  id: string;
  merchantId: string;
  provider: string;
  senderId: string;
  dlTEntityId: string;
  transactionTemplateId: string;
  otpTemplateId: string;
  welcomeTemplateId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OTPRequest {
  id: string;
  mobileNumber: string;
  otp: string;
  type: 'LOGIN' | 'REDEMPTION';
  expiresAt: string;
  isVerified: boolean;
  attempts: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string | null;
  actorUserId: string | null;
  actorRole: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  businessName?: string;
  actorName?: string;
}

export interface SMSLog {
  id: string;
  recipientMobile: string;
  message: string;
  status: 'SENT' | 'DELIVERED';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  employee?: Employee | null;
  memberships?: CustomerMerchantLoyaltyAccount[];
}

export interface MerchantMetrics {
  todaysSales: number;
  pointsIssued: number;
  pointsRedeemed: number;
  rewardsLiability: number;
  walletLiability?: number;
  customerCount: number;
  recentTransactions: RewardTransaction[];
}

