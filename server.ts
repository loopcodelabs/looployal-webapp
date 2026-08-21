import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/db';
import { UserRole } from './src/types';
import { notificationService } from './src/services/notifications/NotificationService';

const JWT_SECRET = process.env.JWT_SECRET || 'loyalty_saas_jwt_secret_key_2026_super_secure';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json());

// Enable CORS for local cross-origin, WSL2 and external port proxies
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- EXTEND EXPRESS REQUEST FOR AUTH CONTEXT ---
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email?: string | null;
    mobileNumber?: string | null;
  };
  employee?: any;
  businessId?: string;
}

// Auth Middleware
const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token missing' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Resolve tenant context if employee
    if (decoded.role !== 'CUSTOMER' && decoded.role !== 'PLATFORM_ADMIN') {
      const emp = db.findEmployeeByUserId(decoded.id);
      if (emp) {
        req.employee = emp;
        req.businessId = emp.businessId;
      }
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Role Guard Middleware
const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Insufficient role permissions' });
    }
    next();
  };
};

import { generateArchitectureDocx } from './src/utils/generateArchitectureDoc';
import { generateCostAndApiDocx } from './src/utils/generateCostAndApiDoc';
import { generateDiscoveryQuestionnaireDocx } from './src/utils/generateDiscoveryQuestionnaireDoc';

import { testMySQLConnection, getMySQLConfig } from './src/db/mysql';

// --- HEALTH & DATABASE STATUS ENDPOINTS ---
app.get('/api/v1/health', async (req: Request, res: Response) => {
  const mysqlConfig = getMySQLConfig();
  const mysqlConnected = await testMySQLConnection();
  
  return res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    database: {
      driver: 'MySQL 8.0+',
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      databaseName: mysqlConfig.database,
      user: mysqlConfig.user,
      connected: mysqlConnected,
      mode: mysqlConnected ? 'MYSQL_ACTIVE' : 'IN_MEMORY_FALLBACK',
    },
    timestamp: new Date().toISOString(),
  });
});

// --- DOCUMENTATION DOWNLOAD ENDPOINT ---
app.get('/api/v1/download/architecture-doc', async (req: Request, res: Response) => {
  try {
    const docBuffer = await generateArchitectureDocx();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Multi_Tenant_Loyalty_SaaS_Production_Architecture.docx"'
    );
    return res.send(docBuffer);
  } catch (err: any) {
    console.error('Failed to generate docx:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate Word document' });
  }
});

app.get('/api/v1/download/cost-analysis-doc', async (req: Request, res: Response) => {
  try {
    const docBuffer = await generateCostAndApiDocx();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Loyalty_SaaS_API_Inventory_And_Cost_Analysis.docx"'
    );
    return res.send(docBuffer);
  } catch (err: any) {
    console.error('Failed to generate cost analysis docx:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate Word document' });
  }
});

app.get('/api/v1/download/discovery-questionnaire-doc', async (req: Request, res: Response) => {
  try {
    const docBuffer = await generateDiscoveryQuestionnaireDocx();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Client_Discovery_Questionnaire_Google_Forms_Spec.docx"'
    );
    return res.send(docBuffer);
  } catch (err: any) {
    console.error('Failed to generate discovery questionnaire docx:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate Word document' });
  }
});

// Endpoint to store client discovery submissions
const discoverySubmissions: any[] = [];

app.post('/api/v1/discovery/submit', (req: Request, res: Response) => {
  const submissionData = req.body;
  if (!submissionData || !submissionData.companyName) {
    return res.status(400).json({ success: false, error: 'Company Name is required for discovery submission.' });
  }

  const submission = {
    id: `DISC-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    data: submissionData,
  };

  discoverySubmissions.push(submission);

  return res.json({
    success: true,
    message: 'Client Discovery Questionnaire submitted successfully!',
    submissionId: submission.id,
    timestamp: submission.submittedAt,
  });
});

// --- AUTHENTICATION API ROUTES ---

// 1. Customer OTP Request
app.post('/api/v1/auth/otp/request', (req: Request, res: Response) => {
  const { mobileNumber, type = 'LOGIN' } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }

  const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
  if (!/^\d{10}$/.test(cleanMobile)) {
    return res.status(400).json({ success: false, error: 'Mobile number must be exactly 10 digits' });
  }

  try {
    const result = db.requestOTP(cleanMobile, type);
    return res.json({
      success: true,
      message: 'OTP sent via SMS',
      mobileNumber: cleanMobile,
      otp: result.otp, // Returned in MVP API payload for quick developer/demo convenience
      expiresAt: result.expiresAt,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Customer OTP Verify & Login/Register
app.post('/api/v1/auth/otp/verify', (req: Request, res: Response) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, error: 'Mobile number and OTP are required' });
  }

  const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
  if (!/^\d{10}$/.test(cleanMobile)) {
    return res.status(400).json({ success: false, error: 'Mobile number must be exactly 10 digits' });
  }
  const isValid = db.verifyOTP(cleanMobile, otp);

  if (!isValid) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }

  let user = db.findUserByMobile(cleanMobile);
  if (!user) {
    const cust = db.createCustomer(cleanMobile);
    user = db.findUserById(cust.userId)!;
    
    // Auto-create memberships with demo businesses for new customers so they have immediate reward accounts!
    const allBiz = db.getAllBusinesses();
    allBiz.forEach((biz) => {
      db.getOrCreateMembership(cust.id, biz.id);
    });
  }

  const customer = db.findCustomerByUserId(user.id);
  const memberships = customer ? db.getCustomerMemberships(customer.id) : [];

  const token = jwt.sign(
    { id: user.id, role: user.role, mobileNumber: user.mobileNumber },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  db.recordAuditLog(null, user.id, user.role, 'CUSTOMER_LOGIN_SUCCESS', `Customer ${cleanMobile} logged in`);

  return res.json({
    success: true,
    token,
    user,
    memberships,
  });
});

// 3. Staff / Merchant / Admin Email+Password Login
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
  }

  // MVP Demo password check
  if (password !== 'Password123!' && password !== 'admin123') {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const employee = db.findEmployeeByUserId(user.id);

  db.recordAuditLog(
    employee?.businessId || null,
    user.id,
    user.role,
    'STAFF_LOGIN_SUCCESS',
    `User ${email} (${user.role}) logged in`
  );

  return res.json({
    success: true,
    token,
    user,
    employee,
  });
});

// 4. Get Current Auth User
app.get('/api/v1/auth/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  let employee = null;
  let customer = null;
  let memberships: any[] = [];

  if (user.role === 'CUSTOMER') {
    const cust = db.findCustomerByUserId(user.id);
    if (cust) {
      customer = cust;
      memberships = db.getCustomerMemberships(cust.id);
    }
  } else {
    employee = db.findEmployeeByUserId(user.id);
  }

  return res.json({
    success: true,
    user,
    customer,
    employee,
    memberships,
  });
});

// --- CUSTOMER API ENDPOINTS ---

// Customer profile & Universal QR
app.get(
  '/api/v1/customer/profile',
  authenticateJWT,
  requireRoles('CUSTOMER'),
  (req: AuthenticatedRequest, res: Response) => {
    const cust = db.findCustomerByUserId(req.user!.id);
    if (!cust) return res.status(404).json({ success: false, error: 'Customer record not found' });

    return res.json({ success: true, customer: cust });
  }
);

// Get Universal Customer QR Code
app.get(
  '/api/v1/customer/qr',
  authenticateJWT,
  requireRoles('CUSTOMER'),
  (req: AuthenticatedRequest, res: Response) => {
    const cust = db.findCustomerByUserId(req.user!.id);
    if (!cust) return res.status(404).json({ success: false, error: 'Customer record not found' });

    return res.json({
      success: true,
      universalQrCode: cust.universalQrCode,
      customerId: cust.id,
      mobileNumber: cust.mobileNumber,
    });
  }
);

// Customer memberships & wallets
app.get(
  '/api/v1/customer/memberships',
  authenticateJWT,
  requireRoles('CUSTOMER'),
  (req: AuthenticatedRequest, res: Response) => {
    const cust = db.findCustomerByUserId(req.user!.id);
    if (!cust) return res.status(404).json({ success: false, error: 'Customer record not found' });

    const memberships = db.getCustomerMemberships(cust.id);
    return res.json({ success: true, customer: cust, memberships });
  }
);

// Customer transaction history
app.get(
  '/api/v1/customer/transactions',
  authenticateJWT,
  requireRoles('CUSTOMER'),
  (req: AuthenticatedRequest, res: Response) => {
    const cust = db.findCustomerByUserId(req.user!.id);
    if (!cust) return res.status(404).json({ success: false, error: 'Customer not found' });

    const memberships = db.getCustomerMemberships(cust.id);
    const membershipIds = memberships.map((m) => m.id);

    let allTxs: any[] = [];
    membershipIds.forEach((memId) => {
      const txs = db.getTransactions({ membershipId: memId });
      allTxs.push(...txs);
    });

    allTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, transactions: allTxs });
  }
);

// --- CASHIER API ENDPOINTS ---

// Scan / Lookup Customer by Universal QR, Mobile, or ID
// Transparently resolves customer and auto-creates Business Membership & Reward Account if first visit!
app.get(
  '/api/v1/cashier/membership/scan/:code',
  authenticateJWT,
  requireRoles('CASHIER', 'BRANCH_MANAGER', 'BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { code } = req.params;
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Cashier does not belong to an active business tenant' });
    }

    try {
      const { customer, membership, wallet, isNewMembership } = db.resolveCustomerAndMembership(
        code.trim(),
        businessId
      );

      const txHistory = db.getTransactions({ membershipId: membership.id, limit: 5 });

      if (isNewMembership) {
        db.recordAuditLog(
          businessId,
          req.user!.id,
          req.user!.role,
          'AUTO_MEMBERSHIP_CREATED',
          `Auto-created business membership and reward account for customer ${customer.mobileNumber} on first visit`
        );
      }

      return res.json({
        success: true,
        membership,
        customer,
        rewardAccount: wallet,
        wallet,
        isNewMembership,
        recentTransactions: txHistory,
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: err.message || 'Customer not found or invalid Universal QR code',
      });
    }
  }
);

// Deprecated credit-otp endpoint for legacy callers (OTP is no longer required to credit points)
app.post(
  '/api/v1/cashier/points/credit-otp',
  authenticateJWT,
  requireRoles('CASHIER', 'BRANCH_MANAGER', 'BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    return res.json({
      success: true,
      message: 'OTP is no longer required for issuing credit points.',
      otp: 'NONE',
    });
  }
);

// Issue / Credit Points (Mandatory Bill Number + Amount; No OTP required)
app.post(
  '/api/v1/cashier/points/credit',
  authenticateJWT,
  requireRoles('CASHIER', 'BRANCH_MANAGER', 'BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { membershipId, billNumber, billAmount } = req.body;
    const businessId = req.businessId;
    const branchId = req.employee?.branchId || null;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'No tenant context resolved for cashier' });
    }

    if (!membershipId || !billNumber || !billNumber.trim() || !billAmount || Number(billAmount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory fields missing: Membership ID, Bill Number, and positive Bill Amount (> 0) are required.',
      });
    }

    try {
      const result = db.creditPoints(
        businessId,
        membershipId,
        billNumber.trim(),
        Number(billAmount),
        branchId,
        req.user!.id
      );

      return res.json({
        success: true,
        message: 'Points credited successfully',
        transaction: result.transaction,
        updatedRewardAccount: result.updatedWallet,
        updatedWallet: result.updatedWallet,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// Trigger Customer OTP for Redemption
app.post(
  '/api/v1/cashier/redemption/request-otp',
  authenticateJWT,
  requireRoles('CASHIER', 'BRANCH_MANAGER', 'BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { membershipId, pointsToRedeem } = req.body;
    const businessId = req.businessId;

    if (!businessId || !membershipId || !pointsToRedeem) {
      return res.status(400).json({ success: false, error: 'Invalid redemption payload' });
    }

    const membership = db.getMembershipByCode(membershipId) || (db as any).memberships.get(membershipId);
    if (!membership || membership.businessId !== businessId) {
      return res.status(403).json({ success: false, error: 'Membership does not belong to this business' });
    }

    const customer = membership.customer || db.findCustomerById(membership.customerId) || db.findCustomerByUserId(membership.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer record missing' });
    }

    const otpResult = db.requestOTP(customer.mobileNumber, 'REDEMPTION');

    return res.json({
      success: true,
      message: `OTP sent to customer mobile ${customer.mobileNumber}`,
      otp: otpResult.otp, // Returned for fast demo testing
      mobileNumber: customer.mobileNumber,
    });
  }
);

// Redeem Points
app.post(
  '/api/v1/cashier/points/redeem',
  authenticateJWT,
  requireRoles('CASHIER', 'BRANCH_MANAGER', 'BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { membershipId, pointsToRedeem, otp } = req.body;
    const businessId = req.businessId;
    const branchId = req.employee?.branchId || null;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'No tenant context resolved' });
    }

    if (!membershipId || !pointsToRedeem || !otp) {
      return res.status(400).json({ success: false, error: 'Membership ID, points to redeem, and OTP are required' });
    }

    const membership = db.getMembershipByCode(membershipId) || (db as any).memberships.get(membershipId);
    if (!membership) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }

    if (membership.businessId !== businessId) {
      return res.status(403).json({ success: false, error: 'Membership does not belong to this business' });
    }

    const customer = membership.customer || db.findCustomerById(membership.customerId) || db.findCustomerByUserId(membership.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer record missing' });
    }

    const isValidOTP = db.verifyOTP(customer.mobileNumber, otp);
    if (!isValidOTP) {
      return res.status(400).json({ success: false, error: 'Invalid or expired redemption OTP' });
    }

    try {
      const result = db.redeemPoints(
        businessId,
        membership.id,
        Number(pointsToRedeem),
        branchId,
        req.user!.id
      );

      return res.json({
        success: true,
        message: 'Points redeemed successfully',
        transaction: result.transaction,
        updatedRewardAccount: result.updatedWallet,
        updatedWallet: result.updatedWallet,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// --- MERCHANT DASHBOARD & MANAGEMENT ENDPOINTS ---

// Merchant Metrics
app.get(
  '/api/v1/merchant/metrics',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'No business context resolved' });
    }

    const metrics = db.getMerchantMetrics(businessId);
    const business = db.getBusinessById(businessId);

    return res.json({ success: true, business, metrics });
  }
);

// Branches List & Create
app.get(
  '/api/v1/merchant/branches',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    const branches = db.getBranchesByBusinessId(businessId);
    return res.json({ success: true, branches });
  }
);

app.post(
  '/api/v1/merchant/branches',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    const { name, code, address, city, phone } = req.body;

    if (!businessId || !name || !code || !address || !city) {
      return res.status(400).json({ success: false, error: 'Name, code, address, and city are required' });
    }

    const branch = db.createBranch(businessId, name, code, address, city, phone || '');
    db.recordAuditLog(businessId, req.user!.id, req.user!.role, 'BRANCH_CREATED', `Branch ${name} created`);

    return res.json({ success: true, branch });
  }
);

// Employees List & Create
app.get(
  '/api/v1/merchant/employees',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    const employees = db.getEmployeesByBusinessId(businessId);
    return res.json({ success: true, employees });
  }
);

app.post(
  '/api/v1/merchant/employees',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    const { fullName, email, role, branchId } = req.body;

    if (!businessId || !fullName || !email || !role) {
      return res.status(400).json({ success: false, error: 'Full name, email, and role are required' });
    }

    try {
      const employee = db.createEmployee(businessId, fullName, email, role, branchId || null);
      db.recordAuditLog(
        businessId,
        req.user!.id,
        req.user!.role,
        'EMPLOYEE_CREATED',
        `Employee ${fullName} (${role}) added`
      );

      return res.json({ success: true, employee });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// Customer List for Merchant
app.get(
  '/api/v1/merchant/customers',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    const customers = db.getBusinessCustomers(businessId);
    return res.json({ success: true, customers });
  }
);

// Settings (Reward Percentage & Minimum Redeem Threshold)
app.get(
  '/api/v1/merchant/settings',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    const business = db.getBusinessById(businessId);
    return res.json({ success: true, settings: business });
  }
);

app.put(
  '/api/v1/merchant/settings',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    const { rewardPercentage, minRedeemPoints } = req.body;

    if (!businessId || rewardPercentage === undefined || minRedeemPoints === undefined) {
      return res.status(400).json({ success: false, error: 'Reward percentage and minimum redeem points required' });
    }

    try {
      const updated = db.updateBusinessSettings(businessId, Number(rewardPercentage), Number(minRedeemPoints));
      db.recordAuditLog(
        businessId,
        req.user!.id,
        req.user!.role,
        'SETTINGS_UPDATED',
        `Updated reward rules: ${rewardPercentage}% cashback, ${minRedeemPoints} min redeem`
      );
      return res.json({ success: true, settings: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// Merchant Rewards Catalogue Endpoints
app.get(
  '/api/v1/merchant/rewards',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER', 'CASHIER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    const rewards = db.getMerchantRewards(businessId);
    return res.json({ success: true, rewards });
  }
);

app.post(
  '/api/v1/merchant/rewards',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    try {
      const reward = db.createReward(businessId, req.body);
      db.recordAuditLog(businessId, req.user!.id, req.user!.role, 'REWARD_CREATED', `Created reward: ${reward.name}`);
      return res.json({ success: true, reward });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

app.put(
  '/api/v1/merchant/rewards/:id',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    const { id } = req.params;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    try {
      const updated = db.updateReward(id, businessId, req.body);
      db.recordAuditLog(businessId, req.user!.id, req.user!.role, 'REWARD_UPDATED', `Updated reward: ${updated.name}`);
      return res.json({ success: true, reward: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// Merchant Redemptions Endpoints
app.get(
  '/api/v1/merchant/redemptions',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER', 'CASHIER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    const redemptions = db.getMerchantRedemptions(businessId);
    return res.json({ success: true, redemptions });
  }
);

app.put(
  '/api/v1/merchant/redemptions/:id/process',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER', 'BRANCH_MANAGER', 'CASHIER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });
    if (!status || !['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status (APPROVED, REJECTED, COMPLETED) is required' });
    }

    try {
      const processed = db.processRedemption(id, businessId, status, req.user!.id, notes);
      db.recordAuditLog(businessId, req.user!.id, req.user!.role, 'REDEMPTION_PROCESSED', `Redemption ${id} set to ${status}`);
      return res.json({ success: true, redemption: processed });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// Merchant SMS Configuration Endpoints
app.get(
  '/api/v1/merchant/sms-config',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    let config = db.getMerchantSmsConfig(businessId);
    if (!config) {
      config = db.updateMerchantSmsConfig(businessId, { provider: 'SMSLocal', enabled: true });
    }

    return res.json({ success: true, smsConfig: config });
  }
);

app.put(
  '/api/v1/merchant/sms-config',
  authenticateJWT,
  requireRoles('BUSINESS_OWNER'),
  (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'No business context' });

    try {
      const updated = db.updateMerchantSmsConfig(businessId, req.body);
      db.recordAuditLog(businessId, req.user!.id, req.user!.role, 'SMS_CONFIG_UPDATED', `Updated SMS configuration for provider ${updated.provider}`);
      return res.json({ success: true, smsConfig: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// --- PLATFORM ADMIN ENDPOINTS ---

// Admin Businesses List & Create
app.get(
  '/api/v1/admin/businesses',
  authenticateJWT,
  requireRoles('PLATFORM_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const businesses = db.getAllBusinesses();
    return res.json({ success: true, businesses });
  }
);

app.post(
  '/api/v1/admin/businesses',
  authenticateJWT,
  requireRoles('PLATFORM_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const { name, code, category, rewardPercentage, minRedeemPoints, ownerEmail, ownerName } = req.body;

    if (!name || !code || !category || !ownerEmail || !ownerName) {
      return res.status(400).json({ success: false, error: 'All required business fields must be provided' });
    }

    // 1. Create Business
    const business = db.createBusiness({
      name,
      code: code.toUpperCase(),
      logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
      category,
      rewardPercentage: Number(rewardPercentage) || 5,
      minRedeemPoints: Number(minRedeemPoints) || 100,
      pointValueInCurrency: 1.0,
      isActive: true,
    });

    // 2. Create Owner User & Employee record
    const ownerUser = db.createUser({
      email: ownerEmail,
      mobileNumber: null,
      fullName: ownerName,
      role: 'BUSINESS_OWNER',
      isActive: true,
    });

    db.createEmployee(business.id, ownerName, ownerEmail, 'BUSINESS_OWNER' as any, null);

    db.recordAuditLog(
      business.id,
      req.user!.id,
      'PLATFORM_ADMIN',
      'BUSINESS_TENANT_ONBOARDED',
      `Onboarded new tenant business ${name} with owner ${ownerEmail}`
    );

    return res.json({ success: true, business, ownerUser });
  }
);

// Admin Users List
app.get(
  '/api/v1/admin/users',
  authenticateJWT,
  requireRoles('PLATFORM_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const users = db.getAllUsers();
    return res.json({ success: true, users });
  }
);

// Admin Audit Logs
app.get(
  '/api/v1/admin/audit',
  authenticateJWT,
  requireRoles('PLATFORM_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const auditLogs = db.getAuditLogs();
    return res.json({ success: true, auditLogs });
  }
);

// Admin SMS Logs (Abstract Service Dispatch View)
app.get(
  '/api/v1/admin/sms-logs',
  authenticateJWT,
  requireRoles('PLATFORM_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const smsLogs = db.getSMSLogs();
    return res.json({ success: true, smsLogs });
  }
);

// Developer & Testing SMS Logs Endpoint (Real-time view)
app.get('/api/v1/sms/recent', (req: Request, res: Response) => {
  const smsLogs = db.getSMSLogs();
  return res.json({ success: true, count: smsLogs.length, smsLogs });
});

// Developer & Testing Recent OTPs Endpoint (Real-time dynamic inspection)
app.get('/api/v1/otps/recent', (req: Request, res: Response) => {
  const otps = db.getRecentOTPs();
  return res.json({ success: true, count: otps.length, otps });
});

// Production Notification Architecture Status
app.get('/api/v1/notifications/status', (req: Request, res: Response) => {
  return res.json({
    success: true,
    provider: notificationService.getActiveProviderName(),
    smsEnabled: process.env.SMS_ENABLED !== 'false',
    otpLength: process.env.OTP_LENGTH || '6',
    otpExpiryMinutes: process.env.OTP_EXPIRY_MINUTES || '5',
  });
});

// Production Notification Queue & Dispatch History Logs
app.get('/api/v1/notifications/logs', (req: Request, res: Response) => {
  const logs = notificationService.getLogs(50);
  return res.json({ success: true, count: logs.length, logs });
});

// --- VITE DEV & PRODUCTION STATIC SERVING ---
async function startServer() {
  // Initialize MySQL database persistence engine (loads seed data or syncs MySQL tables in real time)
  await db.initMySQLPersistence();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for client-side SPA routes (e.g. /, /login, /customer, /cashier, /merchant, /admin)
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite && vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Loyalty SaaS Platform Server running on port ${PORT}`);
    console.log(` Local App URL:    http://localhost:${PORT}`);
    console.log(` Network App URL:  http://127.0.0.1:${PORT}`);
    console.log(` Database Mode:    ${db.isMySQLConnected ? 'MySQL Real-time Persistence Active' : 'High-Performance In-Memory Seed Fallback'}`);
    console.log(` Multi-tenant isolated architecture ready`);
    console.log(`=======================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[CRITICAL] Port ${PORT} is already in use by another application or server instance!`);
      console.error(`-> Either stop the process occupying port ${PORT} or specify a different port in .env (e.g. PORT=3001)`);
    } else {
      console.error(`[CRITICAL] Express server encountered an error:`, err);
    }
  });
}

startServer();
