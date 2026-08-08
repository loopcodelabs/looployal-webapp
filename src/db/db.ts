import {
  User,
  Business,
  Branch,
  Employee,
  Customer,
  CustomerMerchantLoyaltyAccount,
  BusinessMembership,
  Wallet,
  WalletTransaction,
  RewardAccount,
  RewardTransaction,
  PurchaseTransaction,
  Reward,
  Redemption,
  MerchantSmsConfiguration,
  OTPRequest,
  AuditLog,
  SMSLog
} from '../types';
import { testMySQLConnection, initializeMySQLSchema, queryMySQL } from './mysql';
import { notificationService } from '../services/notifications/NotificationService';
import { otpService } from '../services/otp/OTPService';

// Normalized Memory/MySQL Relational Database Engine for Multi-Tenant Loyalty SaaS
class LoyaltyDatabase {
  private users: Map<string, User> = new Map();
  private businesses: Map<string, Business> = new Map();
  private branches: Map<string, Branch> = new Map();
  private employees: Map<string, Employee> = new Map();
  private customers: Map<string, Customer> = new Map();
  private memberships: Map<string, CustomerMerchantLoyaltyAccount> = new Map();
  private wallets: Map<string, RewardAccount> = new Map();
  private transactions: RewardTransaction[] = [];
  private purchaseTransactions: Map<string, PurchaseTransaction> = new Map();
  private rewards: Map<string, Reward> = new Map();
  private redemptions: Map<string, Redemption> = new Map();
  private smsConfigs: Map<string, MerchantSmsConfiguration> = new Map();
  private otps: OTPRequest[] = [];
  private auditLogs: AuditLog[] = [];
  private smsLogs: SMSLog[] = [];

  public isMySQLConnected = false;

  constructor() {
    this.seedInitialData();
  }

  /**
   * Initializes real-time MySQL persistence if connected, or gracefully defaults to in-memory seed data.
   */
  public async initMySQLPersistence(): Promise<boolean> {
    const connected = await testMySQLConnection();
    if (!connected) {
      console.log('[DB] MySQL connection unavailable. Operating in high-performance IN-MEMORY mode with seed data.');
      this.isMySQLConnected = false;
      return false;
    }

    try {
      await initializeMySQLSchema();
      const rows = await queryMySQL<{ cnt: number }>('SELECT COUNT(*) as cnt FROM users');
      if (rows && rows[0] && rows[0].cnt > 0) {
        console.log('[DB] Loading existing persistent records from MySQL database...');
        await this.loadFromMySQL();
      } else {
        console.log('[DB] MySQL database empty. Syncing seed data into MySQL tables...');
        await this.persistAllSeedToMySQL();
      }
      this.isMySQLConnected = true;
      console.log('[DB] Real-time MySQL database persistence initialized & active!');
      return true;
    } catch (err: any) {
      console.warn('[DB] MySQL initialization error:', err.message);
      this.isMySQLConnected = false;
      return false;
    }
  }

  private async persistAllSeedToMySQL() {
    for (const u of this.users.values()) await this.persistUser(u);
    for (const b of this.businesses.values()) await this.persistBusiness(b);
    for (const br of this.branches.values()) await this.persistBranch(br);
    for (const e of this.employees.values()) await this.persistEmployee(e);
    for (const c of this.customers.values()) await this.persistCustomer(c);
    for (const m of this.memberships.values()) await this.persistMembership(m);
    for (const w of this.wallets.values()) await this.persistWallet(w);
    for (const tx of this.transactions) await this.persistTransaction(tx);
    for (const log of this.auditLogs) await this.persistAuditLog(log);
  }

  private async loadFromMySQL() {
    try {
      const dbUsers = await queryMySQL<any>('SELECT * FROM users');
      dbUsers.forEach((u) => {
        this.users.set(u.id, {
          id: u.id,
          email: u.email,
          mobileNumber: u.mobile_number,
          fullName: u.full_name,
          role: u.role,
          isActive: Boolean(u.is_active),
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        });
      });

      const dbBiz = await queryMySQL<any>('SELECT * FROM businesses');
      dbBiz.forEach((b) => {
        this.businesses.set(b.id, {
          id: b.id,
          name: b.name,
          code: b.code,
          logoUrl: b.logo_url,
          category: b.category,
          rewardPercentage: Number(b.reward_percentage),
          minRedeemPoints: Number(b.min_redeem_points),
          pointValueInCurrency: Number(b.point_value_in_currency),
          isActive: Boolean(b.is_active),
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        });
      });

      const dbBranches = await queryMySQL<any>('SELECT * FROM branches');
      dbBranches.forEach((br) => {
        this.branches.set(br.id, {
          id: br.id,
          businessId: br.business_id,
          name: br.name,
          code: br.code,
          address: br.address,
          city: br.city,
          phone: br.phone,
          isActive: Boolean(br.is_active),
          createdAt: br.created_at,
        });
      });

      const dbCust = await queryMySQL<any>('SELECT * FROM customers');
      dbCust.forEach((c) => {
        this.customers.set(c.id, {
          id: c.id,
          userId: c.user_id,
          mobileNumber: c.mobile_number,
          name: c.name,
          email: c.email,
          universalQrCode: c.universal_qr_code,
          createdAt: c.created_at,
        });
      });

      const dbMem = await queryMySQL<any>('SELECT * FROM business_memberships');
      dbMem.forEach((m) => {
        this.memberships.set(m.id, {
          id: m.id,
          customerId: m.customer_id,
          businessId: m.business_id,
          membershipCode: m.membership_code,
          status: m.status,
          joinedAt: m.joined_at,
        });
      });

      let dbWallets: any[] = [];
      try {
        dbWallets = await queryMySQL<any>('SELECT * FROM reward_accounts');
      } catch {
        dbWallets = await queryMySQL<any>('SELECT * FROM wallets');
      }
      dbWallets.forEach((w) => {
        this.wallets.set(w.id, {
          id: w.id,
          membershipId: w.membership_id,
          customerId: w.customer_id,
          businessId: w.business_id,
          balance: Number(w.balance),
          currencyName: w.currency_name || w.currency || 'Points',
          currency: w.currency || 'Points',
          status: w.status || 'ACTIVE',
          createdAt: w.created_at || w.updated_at || new Date().toISOString(),
          updatedAt: w.updated_at,
        });
      });

      let dbTxs: any[] = [];
      try {
        dbTxs = await queryMySQL<any>('SELECT * FROM reward_transactions ORDER BY created_at DESC');
      } catch {
        dbTxs = await queryMySQL<any>('SELECT * FROM wallet_transactions ORDER BY created_at DESC');
      }
      this.transactions = dbTxs.map((t) => ({
        id: t.id,
        rewardAccountId: t.reward_account_id || t.wallet_id,
        walletId: t.wallet_id || t.reward_account_id,
        membershipId: t.membership_id,
        businessId: t.business_id,
        branchId: t.branch_id,
        cashierUserId: t.cashier_user_id,
        type: t.type,
        points: Number(t.points),
        billAmount: t.bill_amount ? Number(t.bill_amount) : null,
        billNumber: t.bill_number || t.reference || null,
        reference: t.reference,
        narration: t.narration,
        balanceAfter: Number(t.balance_after),
        createdAt: t.created_at,
        businessName: t.business_name,
        branchName: t.branch_name,
        cashierName: t.cashier_name,
      }));
    } catch (err: any) {
      console.warn('[DB] Error loading MySQL tables into memory:', err.message);
    }
  }

  // --- MYSQL PERSISTENCE HELPERS ---
  private async persistUser(u: User) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO users (id, email, mobile_number, full_name, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE email=?, mobile_number=?, full_name=?, role=?, is_active=?, updated_at=?`,
        [u.id, u.email, u.mobileNumber, u.fullName, u.role, u.isActive ? 1 : 0, u.createdAt, u.updatedAt,
         u.email, u.mobileNumber, u.fullName, u.role, u.isActive ? 1 : 0, u.updatedAt]
      );
    } catch (e: any) { console.warn('User MySQL sync failed:', e.message); }
  }

  private async persistBusiness(b: Business) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO businesses (id, name, code, logo_url, category, reward_percentage, min_redeem_points, point_value_in_currency, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=?, logo_url=?, category=?, reward_percentage=?, min_redeem_points=?, point_value_in_currency=?, is_active=?, updated_at=?`,
        [b.id, b.name, b.code, b.logoUrl, b.category, b.rewardPercentage, b.minRedeemPoints, b.pointValueInCurrency, b.isActive ? 1 : 0, b.createdAt, b.updatedAt,
         b.name, b.logoUrl, b.category, b.rewardPercentage, b.minRedeemPoints, b.pointValueInCurrency, b.isActive ? 1 : 0, b.updatedAt]
      );
    } catch (e: any) { console.warn('Business MySQL sync failed:', e.message); }
  }

  private async persistBranch(br: Branch) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO branches (id, business_id, name, code, address, city, phone, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=?, address=?, city=?, phone=?, is_active=?`,
        [br.id, br.businessId, br.name, br.code, br.address, br.city, br.phone, br.isActive ? 1 : 0, br.createdAt,
         br.name, br.address, br.city, br.phone, br.isActive ? 1 : 0]
      );
    } catch (e: any) { console.warn('Branch MySQL sync failed:', e.message); }
  }

  private async persistEmployee(e: Employee) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO employees (id, user_id, business_id, branch_id, employee_code, role, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE branch_id=?, role=?, is_active=?`,
        [e.id, e.userId, e.businessId, e.branchId, e.employeeCode, e.role, e.isActive ? 1 : 0, e.createdAt,
         e.branchId, e.role, e.isActive ? 1 : 0]
      );
    } catch (e: any) { console.warn('Employee MySQL sync failed:', e.message); }
  }

  private async persistCustomer(c: Customer) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO customers (id, user_id, mobile_number, name, email, universal_qr_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=?, email=?, universal_qr_code=?`,
        [c.id, c.userId, c.mobileNumber, c.name, c.email, c.universalQrCode, c.createdAt,
         c.name, c.email, c.universalQrCode]
      );
    } catch (e: any) { console.warn('Customer MySQL sync failed:', e.message); }
  }

  private async persistMembership(m: BusinessMembership) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO business_memberships (id, customer_id, business_id, membership_code, status, joined_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=?`,
        [m.id, m.customerId, m.businessId, m.membershipCode, m.status, m.joinedAt, m.status]
      );
    } catch (e: any) { console.warn('Membership MySQL sync failed:', e.message); }
  }

  private async persistWallet(w: RewardAccount) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO reward_accounts (id, membership_id, customer_id, business_id, balance, currency, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE balance=?, updated_at=?`,
        [w.id, w.membershipId, w.customerId, w.businessId, w.balance, w.currency || 'Points', w.updatedAt,
         w.balance, w.updatedAt]
      );
    } catch (e: any) { console.warn('Reward Account MySQL sync failed:', e.message); }
  }

  private async persistTransaction(tx: RewardTransaction) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO reward_transactions (id, reward_account_id, wallet_id, membership_id, business_id, branch_id, cashier_user_id, type, points, bill_amount, bill_number, reference, narration, balance_after, created_at, business_name, branch_name, cashier_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.rewardAccountId || tx.walletId, tx.walletId || tx.rewardAccountId, tx.membershipId, tx.businessId, tx.branchId, tx.cashierUserId, tx.type, tx.points, tx.billAmount, tx.billNumber || tx.reference, tx.reference, tx.narration, tx.balanceAfter, tx.createdAt, tx.businessName, tx.branchName, tx.cashierName]
      );
    } catch (e: any) { console.warn('Transaction MySQL sync failed:', e.message); }
  }

  private async persistOTP(otp: OTPRequest) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO otp_requests (id, mobile_number, otp, type, expires_at, is_verified, attempts, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_verified=?, attempts=?`,
        [otp.id, otp.mobileNumber, otp.otp, otp.type, otp.expiresAt, otp.isVerified ? 1 : 0, otp.attempts, otp.createdAt,
         otp.isVerified ? 1 : 0, otp.attempts]
      );
    } catch (e: any) { console.warn('OTP MySQL sync failed:', e.message); }
  }

  private async persistSMS(sms: SMSLog) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO sms_logs (id, recipient_mobile, message, status, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [sms.id, sms.recipientMobile, sms.message, sms.status, sms.createdAt]
      );
    } catch (e: any) { console.warn('SMS MySQL sync failed:', e.message); }
  }

  private async persistAuditLog(log: AuditLog) {
    if (!this.isMySQLConnected) return;
    try {
      await queryMySQL(
        `INSERT INTO audit_logs (id, business_id, actor_user_id, actor_role, action, details, ip_address, timestamp, business_name, actor_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [log.id, log.businessId, log.actorUserId, log.actorRole, log.action, log.details, log.ipAddress, log.timestamp, log.businessName, log.actorName]
      );
    } catch (e: any) { console.warn('AuditLog MySQL sync failed:', e.message); }
  }

  // --- SEED INITIAL DATA FOR REALISTIC DEMO & TESTING ---
  private seedInitialData() {
    const now = new Date().toISOString();

    // 1. Platform Admin
    const adminUser: User = {
      id: 'usr-admin-01',
      email: 'admin@platform.com',
      mobileNumber: '9999999999',
      fullName: 'System Administrator',
      role: 'PLATFORM_ADMIN',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(adminUser.id, adminUser);

    // 2. Businesses (Tenants)
    const indianOil: Business = {
      id: 'biz-indianoil-01',
      name: 'Indian Oil',
      code: 'INDIANOIL',
      logoUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=150&auto=format&fit=crop&q=80',
      category: 'Fuel & Energy',
      rewardPercentage: 5, // 5% = 5 pts per ₹100
      minRedeemPoints: 100,
      pointValueInCurrency: 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const paradise: Business = {
      id: 'biz-paradise-02',
      name: 'Paradise Restaurant',
      code: 'PARADISE',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80',
      category: 'Dining & Food',
      rewardPercentage: 10, // 10% = 10 pts per ₹100
      minRedeemPoints: 200,
      pointValueInCurrency: 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const reliance: Business = {
      id: 'biz-reliance-03',
      name: 'Reliance Fresh',
      code: 'RELIANCE',
      logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80',
      category: 'Supermarket & Retail',
      rewardPercentage: 3, // 3% = 3 pts per ₹100
      minRedeemPoints: 50,
      pointValueInCurrency: 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const bharatPetroleum: Business = {
      id: 'biz-bpcl-04',
      name: 'Bharat Petroleum',
      code: 'BPCL',
      logoUrl: 'https://images.unsplash.com/photo-1527018606416-a658a77b121d?w=150&auto=format&fit=crop&q=80',
      category: 'Fuel & Energy',
      rewardPercentage: 6, // 6% = 6 pts per ₹100
      minRedeemPoints: 100,
      pointValueInCurrency: 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.businesses.set(indianOil.id, indianOil);
    this.businesses.set(paradise.id, paradise);
    this.businesses.set(reliance.id, reliance);
    this.businesses.set(bharatPetroleum.id, bharatPetroleum);

    // 3. Branches
    const ioBranch1: Branch = {
      id: 'br-io-01',
      businessId: indianOil.id,
      name: 'Downtown Station',
      code: 'IO-DT-01',
      address: '100 Ring Road, Sector 4',
      city: 'Bengaluru',
      phone: '+91 9800000001',
      isActive: true,
      createdAt: now,
    };
    const ioBranch2: Branch = {
      id: 'br-io-02',
      businessId: indianOil.id,
      name: 'Airport Express Station',
      code: 'IO-AP-02',
      address: 'NH 44 Airport Road',
      city: 'Bengaluru',
      phone: '+91 9800000002',
      isActive: true,
      createdAt: now,
    };

    const parBranch1: Branch = {
      id: 'br-par-01',
      businessId: paradise.id,
      name: 'Koramangala Flagship',
      code: 'PAR-KM-01',
      address: '80 Feet Road, 4th Block',
      city: 'Bengaluru',
      phone: '+91 9800000003',
      isActive: true,
      createdAt: now,
    };

    const relBranch1: Branch = {
      id: 'br-rel-01',
      businessId: reliance.id,
      name: 'Indiranagar Superstore',
      code: 'REL-IN-01',
      address: '100 Feet Road',
      city: 'Bengaluru',
      phone: '+91 9800000004',
      isActive: true,
      createdAt: now,
    };

    const bpBranch1: Branch = {
      id: 'br-bp-01',
      businessId: bharatPetroleum.id,
      name: 'MG Road Energy Station',
      code: 'BP-MG-01',
      address: '220 MG Road',
      city: 'Bengaluru',
      phone: '+91 9800000005',
      isActive: true,
      createdAt: now,
    };

    const bpBranch2: Branch = {
      id: 'br-bp-02',
      businessId: bharatPetroleum.id,
      name: 'Whitefield Fuel Point',
      code: 'BP-WF-02',
      address: 'ITPL Main Road',
      city: 'Bengaluru',
      phone: '+91 9800000006',
      isActive: true,
      createdAt: now,
    };

    this.branches.set(ioBranch1.id, ioBranch1);
    this.branches.set(ioBranch2.id, ioBranch2);
    this.branches.set(parBranch1.id, parBranch1);
    this.branches.set(relBranch1.id, relBranch1);
    this.branches.set(bpBranch1.id, bpBranch1);
    this.branches.set(bpBranch2.id, bpBranch2);

    // 4. Business Owners & Cashiers (Users + Employee records)
    // Indian Oil Owner
    const ioOwnerUser: User = {
      id: 'usr-io-owner',
      email: 'owner@indianoil.com',
      mobileNumber: '9800000010',
      fullName: 'Vikram Sharma (Owner)',
      role: 'BUSINESS_OWNER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(ioOwnerUser.id, ioOwnerUser);
    this.employees.set('emp-io-owner', {
      id: 'emp-io-owner',
      userId: ioOwnerUser.id,
      businessId: indianOil.id,
      branchId: null,
      role: 'BUSINESS_OWNER',
      employeeCode: 'EMP-IO-001',
      createdAt: now,
    });

    // Indian Oil Cashier
    const ioCashierUser: User = {
      id: 'usr-io-cashier',
      email: 'cashier.indianoil@platform.com',
      mobileNumber: '9800000011',
      fullName: 'Ramesh Kumar (Cashier)',
      role: 'CASHIER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(ioCashierUser.id, ioCashierUser);
    this.employees.set('emp-io-cashier', {
      id: 'emp-io-cashier',
      userId: ioCashierUser.id,
      businessId: indianOil.id,
      branchId: ioBranch1.id,
      role: 'CASHIER',
      employeeCode: 'EMP-IO-002',
      createdAt: now,
    });

    // Paradise Owner
    const parOwnerUser: User = {
      id: 'usr-par-owner',
      email: 'owner@paradise.com',
      mobileNumber: '9800000020',
      fullName: 'Siddharth Rao (Owner)',
      role: 'BUSINESS_OWNER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(parOwnerUser.id, parOwnerUser);
    this.employees.set('emp-par-owner', {
      id: 'emp-par-owner',
      userId: parOwnerUser.id,
      businessId: paradise.id,
      branchId: null,
      role: 'BUSINESS_OWNER',
      employeeCode: 'EMP-PAR-001',
      createdAt: now,
    });

    // Paradise Cashier
    const parCashierUser: User = {
      id: 'usr-par-cashier',
      email: 'cashier.paradise@platform.com',
      mobileNumber: '9800000021',
      fullName: 'Priya Nair (Cashier)',
      role: 'CASHIER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(parCashierUser.id, parCashierUser);
    this.employees.set('emp-par-cashier', {
      id: 'emp-par-cashier',
      userId: parCashierUser.id,
      businessId: paradise.id,
      branchId: parBranch1.id,
      role: 'CASHIER',
      employeeCode: 'EMP-PAR-002',
      createdAt: now,
    });

    // Reliance Owner
    const relOwnerUser: User = {
      id: 'usr-rel-owner',
      email: 'owner@reliance.com',
      mobileNumber: '9800000030',
      fullName: 'Ananya Gupta (Owner)',
      role: 'BUSINESS_OWNER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(relOwnerUser.id, relOwnerUser);
    this.employees.set('emp-rel-owner', {
      id: 'emp-rel-owner',
      userId: relOwnerUser.id,
      businessId: reliance.id,
      branchId: null,
      role: 'BUSINESS_OWNER',
      employeeCode: 'EMP-REL-001',
      createdAt: now,
    });

    // Bharat Petroleum Owner
    const bpOwnerUser: User = {
      id: 'usr-bp-owner',
      email: 'owner@bharatpetroleum.in',
      mobileNumber: '9800000040',
      fullName: 'Sunil Verma (Owner)',
      role: 'BUSINESS_OWNER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(bpOwnerUser.id, bpOwnerUser);
    this.employees.set('emp-bp-owner', {
      id: 'emp-bp-owner',
      userId: bpOwnerUser.id,
      businessId: bharatPetroleum.id,
      branchId: null,
      role: 'BUSINESS_OWNER',
      employeeCode: 'EMP-BP-001',
      createdAt: now,
    });

    // Bharat Petroleum Cashier
    const bpCashierUser: User = {
      id: 'usr-bp-cashier',
      email: 'cashier.bharatpetroleum@platform.com',
      mobileNumber: '9800000041',
      fullName: 'Amit Kumar (Cashier)',
      role: 'CASHIER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(bpCashierUser.id, bpCashierUser);
    this.employees.set('emp-bp-cashier', {
      id: 'emp-bp-cashier',
      userId: bpCashierUser.id,
      businessId: bharatPetroleum.id,
      branchId: bpBranch1.id,
      role: 'CASHIER',
      employeeCode: 'EMP-BP-002',
      createdAt: now,
    });

    // 5. Customers & Memberships (Explicitly matches Prompt example!)
    // Customer 1: Mobile 9876543210
    const cust1User: User = {
      id: 'usr-cust-9876543210',
      email: 'customer1@example.com',
      mobileNumber: '9876543210',
      fullName: 'Rahul Verma',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(cust1User.id, cust1User);
    const cust1: Customer = {
      id: 'cst-01',
      userId: cust1User.id,
      mobileNumber: '9876543210',
      name: 'Rahul Verma',
      email: 'customer1@example.com',
      universalQrCode: 'CUST-QR-cst-01',
      createdAt: now,
    };
    this.customers.set(cust1.id, cust1);

    // Memberships for Customer 1:
    // Indian Oil: 850 Points
    const memIO1: BusinessMembership = {
      id: 'mem-cust1-io',
      customerId: cust1.id,
      businessId: indianOil.id,
      membershipCode: 'MEM-IO-9876543210',
      status: 'ACTIVE',
      joinedAt: now,
    };
    this.memberships.set(memIO1.id, memIO1);
    const wIO1: Wallet = {
      id: 'wal-cust1-io',
      membershipId: memIO1.id,
      businessId: indianOil.id,
      balance: 850,
      currencyName: 'Points',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.wallets.set(wIO1.id, wIO1);

    // Paradise Restaurant: 120 Points
    const memPAR1: BusinessMembership = {
      id: 'mem-cust1-par',
      customerId: cust1.id,
      businessId: paradise.id,
      membershipCode: 'MEM-PAR-9876543210',
      status: 'ACTIVE',
      joinedAt: now,
    };
    this.memberships.set(memPAR1.id, memPAR1);
    const wPAR1: Wallet = {
      id: 'wal-cust1-par',
      membershipId: memPAR1.id,
      businessId: paradise.id,
      balance: 120,
      currencyName: 'Points',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.wallets.set(wPAR1.id, wPAR1);

    // Reliance Fresh: 430 Points
    const memREL1: BusinessMembership = {
      id: 'mem-cust1-rel',
      customerId: cust1.id,
      businessId: reliance.id,
      membershipCode: 'MEM-REL-9876543210',
      status: 'ACTIVE',
      joinedAt: now,
    };
    this.memberships.set(memREL1.id, memREL1);
    const wREL1: Wallet = {
      id: 'wal-cust1-rel',
      membershipId: memREL1.id,
      businessId: reliance.id,
      balance: 430,
      currencyName: 'Points',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.wallets.set(wREL1.id, wREL1);

    // Bharat Petroleum: 620 Points
    const memBP1: BusinessMembership = {
      id: 'mem-cust1-bp',
      customerId: cust1.id,
      businessId: bharatPetroleum.id,
      membershipCode: 'MEM-BPCL-9876543210',
      status: 'ACTIVE',
      joinedAt: now,
    };
    this.memberships.set(memBP1.id, memBP1);
    const wBP1: Wallet = {
      id: 'wal-cust1-bp',
      membershipId: memBP1.id,
      businessId: bharatPetroleum.id,
      balance: 620,
      currencyName: 'Points',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.wallets.set(wBP1.id, wBP1);

    // Initial Ledger Transactions for Customer 1
    this.transactions.push(
      {
        id: 'tx-001',
        walletId: wIO1.id,
        membershipId: memIO1.id,
        businessId: indianOil.id,
        branchId: ioBranch1.id,
        cashierUserId: ioCashierUser.id,
        type: 'CREDIT',
        points: 850,
        billAmount: 17000,
        billNumber: 'INV-IO-8821',
        reference: 'BILL-IO-8821',
        narration: 'Points earned for ₹17,000 fuel purchase (Bill #INV-IO-8821)',
        balanceAfter: 850,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'tx-002',
        walletId: wPAR1.id,
        membershipId: memPAR1.id,
        businessId: paradise.id,
        branchId: parBranch1.id,
        cashierUserId: parCashierUser.id,
        type: 'CREDIT',
        points: 120,
        billAmount: 1200,
        billNumber: 'INV-PAR-5510',
        reference: 'BILL-PAR-5510',
        narration: 'Points earned for dining bill of ₹1,200 (Bill #INV-PAR-5510)',
        balanceAfter: 120,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'tx-003',
        walletId: wREL1.id,
        membershipId: memREL1.id,
        businessId: reliance.id,
        branchId: relBranch1.id,
        cashierUserId: null,
        type: 'CREDIT',
        points: 430,
        billAmount: 14333,
        billNumber: 'INV-REL-1049',
        reference: 'BILL-REL-1049',
        narration: 'Points earned for grocery shopping of ₹14,333 (Bill #INV-REL-1049)',
        balanceAfter: 430,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'tx-004',
        walletId: wBP1.id,
        membershipId: memBP1.id,
        businessId: bharatPetroleum.id,
        branchId: bpBranch1.id,
        cashierUserId: bpCashierUser.id,
        type: 'CREDIT',
        points: 620,
        billAmount: 10333,
        billNumber: 'INV-BPCL-4091',
        reference: 'BILL-BPCL-4091',
        narration: 'Points earned for ₹10,333 fuel purchase at Bharat Petroleum (Bill #INV-BPCL-4091)',
        balanceAfter: 620,
        createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
      }
    );

    // 6. Merchant Reward Catalogues (Merchant-Specific)
    const r1: Reward = {
      id: 'rew-io-01',
      merchantId: indianOil.id,
      name: '₹100 Fuel Discount Voucher',
      description: 'Redeem 100 points for instant ₹100 fuel discount at any Indian Oil station.',
      type: 'CASH',
      pointsRequired: 100,
      cashValue: 100,
      productName: 'Fuel Voucher',
      stockQuantity: 999,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    const r2: Reward = {
      id: 'rew-par-01',
      merchantId: paradise.id,
      name: 'Free Special Dessert',
      description: 'Redeem 50 points for a complimentary chef special dessert.',
      type: 'PRODUCT',
      pointsRequired: 50,
      cashValue: 80,
      productName: 'Chef Special Dessert',
      stockQuantity: 100,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    const r3: Reward = {
      id: 'rew-par-02',
      merchantId: paradise.id,
      name: '₹200 Dining Meal Voucher',
      description: 'Redeem 200 points for ₹200 off your dine-in or takeaway bill.',
      type: 'CASH',
      pointsRequired: 200,
      cashValue: 200,
      productName: 'Dining Voucher',
      stockQuantity: 500,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    const r4: Reward = {
      id: 'rew-rel-01',
      merchantId: reliance.id,
      name: '₹100 Grocery Coupon',
      description: 'Redeem 100 points for ₹100 instant discount on groceries.',
      type: 'CASH',
      pointsRequired: 100,
      cashValue: 100,
      productName: 'Grocery Coupon',
      stockQuantity: 1000,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    const r5: Reward = {
      id: 'rew-bp-01',
      merchantId: bharatPetroleum.id,
      name: '₹100 Fuel Cash Voucher',
      description: 'Redeem 100 points for ₹100 off fuel refill.',
      type: 'CASH',
      pointsRequired: 100,
      cashValue: 100,
      productName: 'Fuel Voucher',
      stockQuantity: 999,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    [r1, r2, r3, r4, r5].forEach((rew) => this.rewards.set(rew.id, rew));

    // 7. Merchant SMS Configurations (Merchant-Specific DLT & SMS Gateway settings)
    const smsConfigsList: MerchantSmsConfiguration[] = [
      {
        id: 'sms-cfg-io',
        merchantId: indianOil.id,
        provider: 'SMSLocal',
        senderId: 'IOCLSM',
        dlTEntityId: 'DLT-PE-1007123456789',
        transactionTemplateId: 'TMPL-TX-IOCL-01',
        otpTemplateId: 'TMPL-OTP-IOCL-01',
        welcomeTemplateId: 'TMPL-WEL-IOCL-01',
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sms-cfg-par',
        merchantId: paradise.id,
        provider: 'SMSLocal',
        senderId: 'PARADI',
        dlTEntityId: 'DLT-PE-1007123456790',
        transactionTemplateId: 'TMPL-TX-PAR-01',
        otpTemplateId: 'TMPL-OTP-PAR-01',
        welcomeTemplateId: 'TMPL-WEL-PAR-01',
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sms-cfg-rel',
        merchantId: reliance.id,
        provider: 'SMSLocal',
        senderId: 'RMARTS',
        dlTEntityId: 'DLT-PE-1007123456791',
        transactionTemplateId: 'TMPL-TX-REL-01',
        otpTemplateId: 'TMPL-OTP-REL-01',
        welcomeTemplateId: 'TMPL-WEL-REL-01',
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sms-cfg-bp',
        merchantId: bharatPetroleum.id,
        provider: 'SMSLocal',
        senderId: 'BPCLSM',
        dlTEntityId: 'DLT-PE-1007123456792',
        transactionTemplateId: 'TMPL-TX-BPCL-01',
        otpTemplateId: 'TMPL-OTP-BPCL-01',
        welcomeTemplateId: 'TMPL-WEL-BPCL-01',
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    smsConfigsList.forEach((cfg) => this.smsConfigs.set(cfg.merchantId, cfg));

    // Add Audit Log Entry
    this.recordAuditLog(
      null,
      adminUser.id,
      'PLATFORM_ADMIN',
      'PLATFORM_INITIALIZED',
      'Initial seed database populated with multi-merchant loyalty accounts, rewards & merchant SMS configs'
    );
  }

  // --- QUERY METHODS & RELATIONAL HELPERS ---

  // User queries
  public findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
  }

  public findUserByMobile(mobile: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.mobileNumber === mobile);
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    if (userData.mobileNumber) {
      const cleanMob = userData.mobileNumber.trim().replace(/\D/g, '');
      if (!/^\d{10}$/.test(cleanMob)) {
        throw new Error('Invalid mobile number. Mobile number must be exactly 10 digits.');
      }
      userData.mobileNumber = cleanMob;
    }
    const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    this.persistUser(newUser);
    return newUser;
  }

  // Employee queries
  public findEmployeeByUserId(userId: string): Employee | undefined {
    const emp = Array.from(this.employees.values()).find((e) => e.userId === userId);
    if (emp) {
      emp.user = this.users.get(emp.userId);
      emp.branch = emp.branchId ? this.branches.get(emp.branchId) : undefined;
      emp.business = this.businesses.get(emp.businessId);
    }
    return emp;
  }

  public getEmployeesByBusinessId(businessId: string): Employee[] {
    return Array.from(this.employees.values())
      .filter((e) => e.businessId === businessId)
      .map((e) => ({
        ...e,
        user: this.users.get(e.userId),
        branch: e.branchId ? this.branches.get(e.branchId) : undefined,
      }));
  }

  public createEmployee(
    businessId: string,
    fullName: string,
    email: string,
    role: 'BRANCH_MANAGER' | 'CASHIER',
    branchId: string | null
  ): Employee {
    const now = new Date().toISOString();
    // Create user record
    const user = this.createUser({
      email,
      mobileNumber: null,
      fullName,
      role,
      isActive: true,
    });

    const empId = `emp-${Date.now()}`;
    const employee: Employee = {
      id: empId,
      userId: user.id,
      businessId,
      branchId,
      role,
      employeeCode: `EMP-${role.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
      user,
      branch: branchId ? this.branches.get(branchId) : undefined,
    };
    this.employees.set(empId, employee);
    this.persistEmployee(employee);
    return employee;
  }

  // Customer queries
  public findCustomerByUserId(userId: string): Customer | undefined {
    return Array.from(this.customers.values()).find((c) => c.userId === userId);
  }

  public findCustomerById(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  public findCustomerByMobile(mobile: string): Customer | undefined {
    return Array.from(this.customers.values()).find((c) => c.mobileNumber === mobile);
  }

  public findCustomerByUniversalQr(qrCode: string): Customer | undefined {
    if (!qrCode) return undefined;
    const clean = qrCode.trim();
    
    // Direct match by universalQrCode, id, or mobile
    let customer = Array.from(this.customers.values()).find(
      (c) => c.universalQrCode === clean || c.id === clean || c.mobileNumber === clean
    );
    if (customer) return customer;

    // If string starts with CUST-QR-
    if (clean.startsWith('CUST-QR-')) {
      const extractedId = clean.replace('CUST-QR-', '');
      customer = Array.from(this.customers.values()).find(
        (c) => c.id === extractedId || c.universalQrCode === clean
      );
      if (customer) return customer;
    }

    // Fallback: Check if matching legacy membership code
    const mem = this.getMembershipByCode(clean);
    if (mem) {
      return this.findCustomerById(mem.customerId);
    }

    return undefined;
  }

  public createCustomer(mobileNumber: string, name?: string): Customer {
    const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanMobile)) {
      throw new Error('Invalid mobile number. Mobile number must be exactly 10 digits.');
    }
    const now = new Date().toISOString();
    const user = this.createUser({
      email: null,
      mobileNumber: cleanMobile,
      fullName: name || `Customer ${cleanMobile.slice(-4)}`,
      role: 'CUSTOMER',
      isActive: true,
    });

    const custId = `cst-${Date.now()}`;
    const universalQrCode = `CUST-QR-${custId}`;
    const customer: Customer = {
      id: custId,
      userId: user.id,
      mobileNumber: cleanMobile,
      name: user.fullName,
      email: null,
      universalQrCode,
      createdAt: now,
    };
    this.customers.set(custId, customer);
    this.persistCustomer(customer);

    // Dispatch async welcome notification
    notificationService.sendWelcomeNotification(cleanMobile, {
      customerName: customer.name,
      universalQrCode,
    });

    return customer;
  }

  /**
   * Resolves a customer from ANY Universal QR, Mobile Number, or Customer ID,
   * then transparently ensures a Business Membership & Wallet exist for the Cashier's Business Tenant.
   */
  public resolveCustomerAndMembership(
    codeOrToken: string,
    businessId: string
  ): { customer: Customer; membership: BusinessMembership; wallet: Wallet; isNewMembership: boolean } {
    const cleanCode = codeOrToken.trim();

    // 1. Direct lookup by Membership ID or Membership Code
    let existingMem = this.memberships.get(cleanCode);
    if (!existingMem) {
      existingMem = Array.from(this.memberships.values()).find(
        (m) => m.id === cleanCode || m.membershipCode === cleanCode
      );
    }

    if (existingMem) {
      const customer = this.customers.get(existingMem.customerId);
      if (customer) {
        let wallet = Array.from(this.wallets.values()).find((w) => w.membershipId === existingMem!.id);
        if (!wallet) {
          wallet = {
            id: `wal-${existingMem.id}`,
            membershipId: existingMem.id,
            businessId: existingMem.businessId,
            balance: 0,
            currencyName: 'Points',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.wallets.set(wallet.id, wallet);
          this.persistWallet(wallet);
        }
        return { customer, membership: existingMem, wallet, isNewMembership: false };
      }
    }

    // 2. Direct lookup by Customer ID
    let customer: Customer | undefined = this.customers.get(cleanCode);

    // 3. Lookup by Universal QR Code
    if (!customer) {
      customer = this.findCustomerByUniversalQr(cleanCode);
    }

    // 4. Lookup by Mobile Number
    if (!customer) {
      const digitsOnly = cleanCode.replace(/\D/g, '');
      const isNumericInput = /^\d+$/.test(cleanCode) || (digitsOnly.length > 0 && digitsOnly === cleanCode);
      if (isNumericInput) {
        if (!/^\d{10}$/.test(digitsOnly)) {
          throw new Error(`Invalid mobile number '${cleanCode}'. Mobile number must be exactly 10 digits.`);
        }
        customer = this.findCustomerByMobile(digitsOnly);
        if (!customer) {
          customer = this.createCustomer(digitsOnly);
        }
      } else {
        customer = this.findCustomerByMobile(cleanCode);
      }
    }

    if (!customer) {
      throw new Error(`Customer not found for scanned code or mobile number: ${cleanCode}`);
    }

    const existingMemForBiz = Array.from(this.memberships.values()).find(
      (m) => m.customerId === customer!.id && m.businessId === businessId
    );
    const isNewMembership = !existingMemForBiz;

    // Get or automatically create business membership and wallet transparently
    const membership = this.getOrCreateMembership(customer.id, businessId);
    const wallet = Array.from(this.wallets.values()).find((w) => w.membershipId === membership.id)!;

    return { customer, membership, wallet, isNewMembership };
  }

  // Business / Tenant queries
  public getAllBusinesses(): Business[] {
    return Array.from(this.businesses.values());
  }

  public getBusinessById(id: string): Business | undefined {
    return this.businesses.get(id);
  }

  public createBusiness(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Business {
    const id = `biz-${Date.now()}`;
    const now = new Date().toISOString();
    const newBiz: Business = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.businesses.set(id, newBiz);
    this.persistBusiness(newBiz);
    return newBiz;
  }

  public updateBusinessSettings(
    businessId: string,
    rewardPercentage: number,
    minRedeemPoints: number
  ): Business {
    const biz = this.businesses.get(businessId);
    if (!biz) throw new Error('Business not found');
    biz.rewardPercentage = rewardPercentage;
    biz.minRedeemPoints = minRedeemPoints;
    biz.updatedAt = new Date().toISOString();
    this.businesses.set(businessId, biz);
    this.persistBusiness(biz);
    return biz;
  }

  // Branch queries
  public getBranchesByBusinessId(businessId: string): Branch[] {
    return Array.from(this.branches.values()).filter((b) => b.businessId === businessId);
  }

  public createBranch(businessId: string, name: string, code: string, address: string, city: string, phone: string): Branch {
    const id = `br-${Date.now()}`;
    const branch: Branch = {
      id,
      businessId,
      name,
      code,
      address,
      city,
      phone,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.branches.set(id, branch);
    this.persistBranch(branch);
    return branch;
  }

  // Business Membership & Reward Account Queries
  public getCustomerMemberships(customerId: string): BusinessMembership[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.customerId === customerId)
      .map((m) => {
        const business = this.businesses.get(m.businessId);
        const wallet = Array.from(this.wallets.values()).find((w) => w.membershipId === m.id);
        const customer = this.customers.get(m.customerId);
        return {
          ...m,
          business,
          rewardAccount: wallet,
          wallet,
          customer,
        };
      });
  }

  public getMembershipByCode(membershipCode: string): BusinessMembership | undefined {
    const m = Array.from(this.memberships.values()).find(
      (m) => m.membershipCode === membershipCode || m.id === membershipCode
    );
    if (m) {
      m.business = this.businesses.get(m.businessId);
      const w = Array.from(this.wallets.values()).find((w) => w.membershipId === m.id);
      m.rewardAccount = w;
      m.wallet = w;
      m.customer = this.customers.get(m.customerId);
    }
    return m;
  }

  public getOrCreateMembership(customerId: string, businessId: string): BusinessMembership {
    let membership = Array.from(this.memberships.values()).find(
      (m) => m.customerId === customerId && m.businessId === businessId
    );

    if (!membership) {
      const now = new Date().toISOString();
      const memId = `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const cust = this.customers.get(customerId);
      const biz = this.businesses.get(businessId);
      const codeStr = `MEM-${biz?.code || 'BIZ'}-${cust?.mobileNumber || Math.floor(Math.random() * 1000000)}`;

      membership = {
        id: memId,
        customerId,
        businessId,
        membershipCode: codeStr,
        status: 'ACTIVE',
        joinedAt: now,
      };
      this.memberships.set(memId, membership);
      this.persistMembership(membership);

      // Create associated isolated reward account
      const walletId = `wal-${memId}`;
      const wallet: RewardAccount = {
        id: walletId,
        membershipId: memId,
        businessId,
        balance: 0,
        currencyName: 'Points',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      this.wallets.set(walletId, wallet);
      this.persistWallet(wallet);
    }

    membership.business = this.businesses.get(businessId);
    const acc = Array.from(this.wallets.values()).find((w) => w.membershipId === membership!.id);
    membership.rewardAccount = acc;
    membership.wallet = acc;
    membership.customer = this.customers.get(customerId);
    return membership;
  }

  public getBusinessCustomers(businessId: string): Array<{
    membership: BusinessMembership;
    customer: Customer;
    wallet: Wallet;
    lastTransactionAt: string | null;
  }> {
    const businessMemberships = Array.from(this.memberships.values()).filter(
      (m) => m.businessId === businessId
    );

    return businessMemberships.map((m) => {
      const customer = this.customers.get(m.customerId)!;
      const wallet = Array.from(this.wallets.values()).find((w) => w.membershipId === m.id)!;
      const custTxs = this.transactions
        .filter((t) => t.membershipId === m.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        membership: m,
        customer,
        wallet,
        lastTransactionAt: custTxs.length > 0 ? custTxs[0].createdAt : null,
      };
    });
  }

  // Helper to check if a bill number has already been processed for a specific business
  public isBillNumberDuplicate(businessId: string, billNumber: string): boolean {
    const cleanBillNumber = billNumber?.trim();
    if (!cleanBillNumber) return false;
    return this.transactions.some(
      (t) =>
        t.businessId === businessId &&
        t.billNumber &&
        t.billNumber.trim().toLowerCase() === cleanBillNumber.toLowerCase()
    );
  }

  // Request Credit Points Verification OTP
  public requestCreditOTP(
    businessId: string,
    membershipId: string,
    billNumber: string,
    billAmount: number
  ): { success: boolean; message: string; otp: string; mobileNumber: string } {
    const business = this.businesses.get(businessId);
    if (!business) throw new Error('Business tenant not found');

    const cleanBillNumber = billNumber?.trim();
    if (!cleanBillNumber) {
      throw new Error('Mandatory Bill Number is required to generate credit verification OTP');
    }

    if (this.isBillNumberDuplicate(businessId, cleanBillNumber)) {
      throw new Error(`Bill number '${cleanBillNumber}' has already been processed for this business. Cashier cannot make duplicate entries for the same bill number.`);
    }

    if (!billAmount || billAmount <= 0) {
      throw new Error('Mandatory positive Bill Amount is required to generate credit verification OTP');
    }

    const resolved = this.resolveCustomerAndMembership(membershipId, businessId);
    const customer = resolved.customer;

    // Generate 6-digit OTP for CREDIT_POINTS transaction type
    const otpRes = otpService.requestOTP(customer.mobileNumber, 'REDEMPTION');

    // Trigger SMS notification to customer
    notificationService.sendOTPNotification(customer.mobileNumber, otpRes.plainOtpForDev || '123456', 'REDEMPTION');

    return {
      success: true,
      message: `Verification OTP sent to customer (+91 ${customer.mobileNumber})`,
      otp: otpRes.plainOtpForDev,
      mobileNumber: customer.mobileNumber,
    };
  }

  // Transaction Ledger Engine (IMMUTABLE BALANCE COMPUTATION WITH MANDATORY BILL NUMBER & OTP VERIFICATION)
  public creditPoints(
    businessId: string,
    membershipId: string,
    billNumber: string,
    billAmount: number,
    otp: string,
    branchId: string | null,
    cashierUserId: string | null
  ): { transaction: WalletTransaction; updatedWallet: Wallet } {
    const business = this.businesses.get(businessId);
    if (!business) throw new Error('Business tenant not found');

    const cleanBillNumber = billNumber?.trim();
    if (!cleanBillNumber) {
      throw new Error('Mandatory Bill Number is required to credit points');
    }

    if (this.isBillNumberDuplicate(businessId, cleanBillNumber)) {
      throw new Error(`Bill number '${cleanBillNumber}' has already been processed for this business. Cashier cannot make duplicate entries for the same bill number.`);
    }

    if (!billAmount || billAmount <= 0) {
      throw new Error('Mandatory positive Bill Amount is required to credit points');
    }
    if (!otp || !otp.trim()) {
      throw new Error('Customer verification OTP is required to credit points');
    }

    const resolved = this.resolveCustomerAndMembership(membershipId, businessId);
    const membership = resolved.membership;
    const wallet = resolved.wallet;
    const customer = resolved.customer;

    // Verify OTP
    const otpCheck = otpService.verifyOTP(customer.mobileNumber, otp.trim());
    if (!otpCheck.success) {
      throw new Error(otpCheck.message || 'Invalid or expired customer verification OTP');
    }

    // Calculate points: billAmount * (rewardPercentage / 100)
    const points = Math.floor((billAmount * business.rewardPercentage) / 100);

    const newBalance = wallet.balance + points;
    wallet.balance = newBalance;
    wallet.updatedAt = new Date().toISOString();
    this.wallets.set(wallet.id, wallet);
    this.persistWallet(wallet);

    const branch = branchId ? this.branches.get(branchId) : undefined;
    const cashier = cashierUserId ? this.users.get(cashierUserId) : undefined;

    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletId: wallet.id,
      membershipId: membership.id,
      businessId,
      branchId,
      cashierUserId,
      type: 'CREDIT',
      points,
      billAmount,
      billNumber: cleanBillNumber,
      reference: `BILL-${cleanBillNumber}`,
      narration: `Earned ${points} points for Bill #${cleanBillNumber} (Amount: ₹${billAmount.toLocaleString()})`,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
      businessName: business.name,
      branchName: branch?.name,
      cashierName: cashier?.fullName,
    };

    this.transactions.unshift(transaction);
    this.persistTransaction(transaction);

    // Trigger Asynchronous SMS Notification via Notification Service
    notificationService.sendPointsEarnedNotification(customer.mobileNumber, {
      points,
      businessName: business.name,
      balance: newBalance,
    });

    // Detailed Audit Trail Logging
    this.recordAuditLog(
      businessId,
      cashierUserId,
      cashier ? cashier.role : 'CASHIER',
      'POINTS_CREDITED',
      `Credited +${points} points for Bill #${cleanBillNumber} (₹${billAmount.toLocaleString()}) to Customer ${customer.name} (+91 ${customer.mobileNumber}) verified via OTP`
    );

    return { transaction, updatedWallet: wallet };
  }

  public redeemPoints(
    businessId: string,
    membershipId: string,
    pointsToRedeem: number,
    branchId: string | null,
    cashierUserId: string | null
  ): { transaction: WalletTransaction; updatedWallet: Wallet } {
    const business = this.businesses.get(businessId);
    if (!business) throw new Error('Business tenant not found');

    const resolved = this.resolveCustomerAndMembership(membershipId, businessId);
    const membership = resolved.membership;
    const wallet = resolved.wallet;

    if (wallet.balance < pointsToRedeem) {
      throw new Error(`Insufficient wallet balance (${wallet.balance} available)`);
    }

    if (pointsToRedeem < business.minRedeemPoints) {
      throw new Error(`Minimum redeemable points threshold for ${business.name} is ${business.minRedeemPoints}`);
    }

    const newBalance = wallet.balance - pointsToRedeem;
    wallet.balance = newBalance;
    wallet.updatedAt = new Date().toISOString();
    this.wallets.set(wallet.id, wallet);
    this.persistWallet(wallet);

    const branch = branchId ? this.branches.get(branchId) : undefined;
    const cashier = cashierUserId ? this.users.get(cashierUserId) : undefined;

    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletId: wallet.id,
      membershipId,
      businessId,
      branchId,
      cashierUserId,
      type: 'REDEEM',
      points: -pointsToRedeem,
      billAmount: null,
      billNumber: null,
      reference: `RED-${business.code}-${Math.floor(1000 + Math.random() * 9000)}`,
      narration: `Redeemed ${pointsToRedeem} points (Equivalent ₹${pointsToRedeem * business.pointValueInCurrency})`,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
      businessName: business.name,
      branchName: branch?.name,
      cashierName: cashier?.fullName,
    };

    this.transactions.unshift(transaction);
    this.persistTransaction(transaction);

    // Trigger Asynchronous SMS Notification via Notification Service
    const customer = this.customers.get(membership.customerId);
    if (customer) {
      notificationService.sendPointsRedeemedNotification(customer.mobileNumber, {
        points: pointsToRedeem,
        businessName: business.name,
        balance: newBalance,
      });
    }

    this.recordAuditLog(
      businessId,
      cashierUserId,
      cashier ? cashier.role : 'SYSTEM',
      'POINTS_REDEEMED',
      JSON.stringify({ pointsRedeemed: pointsToRedeem, newBalance, membershipId })
    );

    return { transaction, updatedWallet: wallet };
  }

  // Wallet transactions list
  public getTransactions(filter: {
    membershipId?: string;
    businessId?: string;
    limit?: number;
  }): WalletTransaction[] {
    let list = [...this.transactions];
    if (filter.membershipId) {
      list = list.filter((t) => t.membershipId === filter.membershipId);
    }
    if (filter.businessId) {
      list = list.filter((t) => t.businessId === filter.businessId);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter.limit) {
      list = list.slice(0, filter.limit);
    }
    return list;
  }

  // Merchant Metrics
  public getMerchantMetrics(businessId: string): {
    todaysSales: number;
    pointsIssued: number;
    pointsRedeemed: number;
    rewardsLiability: number;
    walletLiability: number;
    customerCount: number;
    recentTransactions: RewardTransaction[];
  } {
    const bizTxs = this.transactions.filter((t) => t.businessId === businessId);
    const todayStr = new Date().toISOString().split('T')[0];

    let todaysSales = 0;
    let pointsIssued = 0;
    let pointsRedeemed = 0;

    bizTxs.forEach((t) => {
      const isToday = t.createdAt.startsWith(todayStr);
      if (t.type === 'CREDIT' || t.type === 'EARN') {
        pointsIssued += t.points;
        if (isToday && t.billAmount) {
          todaysSales += t.billAmount;
        }
      } else if (t.type === 'REDEEM') {
        pointsRedeemed += Math.abs(t.points);
      }
    });

    const bizWallets = Array.from(this.wallets.values()).filter((w) => w.businessId === businessId);
    const rewardsLiability = bizWallets.reduce((sum, w) => sum + w.balance, 0);
    const customerCount = Array.from(this.memberships.values()).filter((m) => m.businessId === businessId).length;

    const recentTransactions = this.getTransactions({ businessId, limit: 10 });

    return {
      todaysSales,
      pointsIssued,
      pointsRedeemed,
      rewardsLiability,
      walletLiability: rewardsLiability,
      customerCount,
      recentTransactions,
    };
  }

  // OTP Management (Delegated to Production-Grade OTPService)
  public requestOTP(mobileNumber: string, type: 'LOGIN' | 'REDEMPTION' = 'LOGIN'): { otp: string; expiresAt: string } {
    const clean = mobileNumber.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(clean)) {
      throw new Error('Invalid mobile number. Mobile number must be exactly 10 digits.');
    }
    const res = otpService.requestOTP(clean, type);

    // Keep memory cache synced for legacy callers
    const req: OTPRequest = {
      id: res.otpRecordId,
      mobileNumber: clean,
      otp: res.plainOtpForDev || '******',
      type,
      expiresAt: res.expiresAt,
      isVerified: false,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    this.otps.push(req);
    this.persistOTP(req);

    return {
      otp: res.plainOtpForDev || '******',
      expiresAt: res.expiresAt,
    };
  }

  public verifyOTP(mobileNumber: string, otp: string): boolean {
    const clean = mobileNumber.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(clean)) {
      throw new Error('Invalid mobile number. Mobile number must be exactly 10 digits.');
    }
    const res = otpService.verifyOTP(clean, otp);
    if (res.success) {
      const match = this.otps
        .filter((o) => o.mobileNumber === clean && !o.isVerified)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (match) {
        match.isVerified = true;
        this.persistOTP(match);
      }
    }
    return res.success;
  }

  public getRecentOTPs(): OTPRequest[] {
    const records = otpService.getAllRecentOTPRecords();
    return records.map((r) => ({
      id: r.id,
      mobileNumber: r.mobileNumber,
      otp: r.plainOtpForDev || '******',
      type: r.type as 'LOGIN' | 'REDEMPTION',
      expiresAt: r.expiresAt,
      isVerified: r.isVerified,
      attempts: r.attempts,
      createdAt: r.createdAt,
    }));
  }

  // Abstract SMS Notification Service
  public sendSMS(recipientMobile: string, message: string): SMSLog {
    const notif = notificationService.sendNotification(recipientMobile, 'CUSTOM', { customMessage: message });

    const log: SMSLog = {
      id: notif.id,
      recipientMobile,
      message,
      status: 'DELIVERED',
      createdAt: notif.createdAt,
    };
    this.smsLogs.unshift(log);
    this.persistSMS(log);
    return log;
  }

  public getSMSLogs(): SMSLog[] {
    return this.smsLogs;
  }

  // Audit Logging
  public recordAuditLog(
    businessId: string | null,
    actorUserId: string | null,
    actorRole: string,
    action: string,
    details: string,
    ipAddress = '127.0.0.1'
  ): AuditLog {
    const biz = businessId ? this.businesses.get(businessId) : undefined;
    const actor = actorUserId ? this.users.get(actorUserId) : undefined;

    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      businessId,
      actorUserId,
      actorRole,
      action,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
      businessName: biz?.name,
      actorName: actor?.fullName || 'System',
    };
    this.auditLogs.unshift(log);
    this.persistAuditLog(log);
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // --- REWARDS MANAGEMENT (MERCHANT SPECIFIC) ---
  public getMerchantRewards(businessId: string): Reward[] {
    return Array.from(this.rewards.values()).filter((r) => r.merchantId === businessId);
  }

  public createReward(businessId: string, data: Omit<Reward, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>): Reward {
    const id = `rew-${Date.now()}`;
    const now = new Date().toISOString();
    const reward: Reward = {
      ...data,
      id,
      merchantId: businessId,
      createdAt: now,
      updatedAt: now,
    };
    this.rewards.set(id, reward);
    return reward;
  }

  public updateReward(id: string, businessId: string, data: Partial<Reward>): Reward {
    const reward = this.rewards.get(id);
    if (!reward || reward.merchantId !== businessId) {
      throw new Error('Reward not found or does not belong to this merchant');
    }
    Object.assign(reward, data, { updatedAt: new Date().toISOString() });
    this.rewards.set(id, reward);
    return reward;
  }

  // --- REDEMPTIONS MANAGEMENT (MERCHANT SPECIFIC) ---
  public getCustomerRedemptions(customerId: string, merchantId?: string): Redemption[] {
    let list = Array.from(this.redemptions.values()).filter((r) => r.customerId === customerId);
    if (merchantId) {
      list = list.filter((r) => r.merchantId === merchantId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMerchantRedemptions(merchantId: string): Redemption[] {
    return Array.from(this.redemptions.values())
      .filter((r) => r.merchantId === merchantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public requestRedemption(
    customerId: string,
    merchantId: string,
    rewardId: string
  ): Redemption {
    const reward = this.rewards.get(rewardId);
    if (!reward || reward.merchantId !== merchantId) {
      throw new Error('Invalid reward selected for this merchant');
    }

    const membership = Array.from(this.memberships.values()).find(
      (m) => m.customerId === customerId && m.businessId === merchantId
    );
    if (!membership) {
      throw new Error('Customer is not enrolled in this merchant loyalty programme');
    }

    const wallet = Array.from(this.wallets.values()).find((w) => w.membershipId === membership.id);
    if (!wallet || wallet.balance < reward.pointsRequired) {
      throw new Error(`Insufficient points balance (${wallet?.balance || 0} available, ${reward.pointsRequired} required)`);
    }

    const id = `rdm-${Date.now()}`;
    const now = new Date().toISOString();
    const redemption: Redemption = {
      id,
      merchantId,
      customerId,
      customerMerchantLoyaltyAccountId: membership.id,
      rewardId,
      rewardName: reward.name,
      rewardType: reward.type,
      pointsRedeemed: reward.pointsRequired,
      cashValue: reward.cashValue,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.redemptions.set(id, redemption);
    return redemption;
  }

  public processRedemption(
    redemptionId: string,
    merchantId: string,
    status: 'APPROVED' | 'REJECTED' | 'COMPLETED',
    employeeId?: string,
    notes?: string
  ): Redemption {
    const rdm = this.redemptions.get(redemptionId);
    if (!rdm || rdm.merchantId !== merchantId) {
      throw new Error('Redemption record not found or does not belong to this merchant');
    }

    if (rdm.status === 'COMPLETED' || rdm.status === 'REJECTED') {
      throw new Error(`Redemption is already in final state (${rdm.status})`);
    }

    const membership = this.memberships.get(rdm.customerMerchantLoyaltyAccountId);
    if (!membership) throw new Error('Loyalty account not found');

    const wallet = Array.from(this.wallets.values()).find((w) => w.membershipId === membership.id);
    if (!wallet) throw new Error('Wallet not found');

    if (status === 'APPROVED' || status === 'COMPLETED') {
      if (wallet.balance < rdm.pointsRedeemed) {
        throw new Error(`Insufficient points balance to approve redemption (${wallet.balance} available)`);
      }
      // Deduct points
      const newBalance = wallet.balance - rdm.pointsRedeemed;
      wallet.balance = newBalance;
      wallet.updatedAt = new Date().toISOString();
      this.wallets.set(wallet.id, wallet);

      // Ledger Transaction
      const biz = this.businesses.get(merchantId);
      const tx: WalletTransaction = {
        id: `tx-rdm-${Date.now()}`,
        customerMerchantLoyaltyAccountId: membership.id,
        membershipId: membership.id,
        walletId: wallet.id,
        businessId: merchantId,
        merchantId,
        customerId: rdm.customerId,
        branchId: null,
        cashierUserId: employeeId || null,
        employeeId: employeeId || null,
        redemptionId: rdm.id,
        type: 'REDEEM',
        points: -rdm.pointsRedeemed,
        billAmount: null,
        billNumber: null,
        reference: `RED-${rdm.id}`,
        narration: `Redeemed ${rdm.pointsRedeemed} points for ${rdm.rewardName || 'Reward'}`,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
        businessName: biz?.name,
      };
      this.transactions.unshift(tx);
    }

    rdm.status = status;
    rdm.processedByEmployeeId = employeeId;
    rdm.notes = notes;
    rdm.updatedAt = new Date().toISOString();
    this.redemptions.set(redemptionId, rdm);
    return rdm;
  }

  // --- MERCHANT SMS CONFIGURATION ---
  public getMerchantSmsConfig(merchantId: string): MerchantSmsConfiguration | undefined {
    return this.smsConfigs.get(merchantId);
  }

  public updateMerchantSmsConfig(merchantId: string, data: Partial<MerchantSmsConfiguration>): MerchantSmsConfiguration {
    let cfg = this.smsConfigs.get(merchantId);
    const now = new Date().toISOString();
    if (!cfg) {
      cfg = {
        id: `sms-cfg-${Date.now()}`,
        merchantId,
        provider: data.provider || 'SMSLocal',
        senderId: data.senderId || 'LOYALTY',
        dlTEntityId: data.dlTEntityId || 'DLT-PE-DEFAULT',
        transactionTemplateId: data.transactionTemplateId || 'TMPL-TX-DEFAULT',
        otpTemplateId: data.otpTemplateId || 'TMPL-OTP-DEFAULT',
        welcomeTemplateId: data.welcomeTemplateId,
        enabled: data.enabled !== undefined ? data.enabled : true,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      Object.assign(cfg, data, { updatedAt: now });
    }
    this.smsConfigs.set(merchantId, cfg);
    return cfg;
  }
}

export const db = new LoyaltyDatabase();
