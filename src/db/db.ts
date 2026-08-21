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
import { testMySQLConnection, initializeMySQLSchema, queryMySQL, formatToMySQLDateTime } from './mysql';
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
      this.isMySQLConnected = true;
      await initializeMySQLSchema();

      // First hydrate in-memory store from existing persistent MySQL database
      console.log('[DB] Loading existing persistent records from MySQL database...');
      await this.loadFromMySQL();

      // Ensure core business tenants and seed accounts exist in MySQL if not already present
      console.log('[DB] Ensuring core business tenants and seed accounts exist in MySQL...');
      await this.persistAllSeedToMySQL();

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
    for (const r of this.rewards.values()) await this.persistReward(r);
    for (const tx of this.transactions) await this.persistTransaction(tx);
    for (const cfg of this.smsConfigs.values()) await this.persistMerchantSmsConfig(cfg);
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

      try {
        const dbEmp = await queryMySQL<any>('SELECT * FROM employees');
        dbEmp.forEach((e) => {
          this.employees.set(e.id, {
            id: e.id,
            userId: e.user_id,
            businessId: e.business_id,
            branchId: e.branch_id,
            employeeCode: e.employee_code,
            role: e.role,
            isActive: Boolean(e.is_active),
            createdAt: e.created_at,
          });
        });
      } catch {}

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

      try {
        const dbRewards = await queryMySQL<any>('SELECT * FROM rewards');
        dbRewards.forEach((r) => {
          this.rewards.set(r.id, {
            id: r.id,
            merchantId: r.merchant_id,
            name: r.name,
            description: r.description || '',
            pointsRequired: Number(r.points_required),
            cashValue: r.cash_value ? Number(r.cash_value) : 0,
            productName: r.product_name || r.name || '',
            stockQuantity: r.stock_quantity ? Number(r.stock_quantity) : 999,
            type: r.type || 'PRODUCT',
            status: r.is_active === 0 || r.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          });
        });
      } catch {}

      try {
        const dbRedemptions = await queryMySQL<any>('SELECT * FROM redemptions');
        dbRedemptions.forEach((rdm) => {
          this.redemptions.set(rdm.id, {
            id: rdm.id,
            merchantId: rdm.merchant_id,
            customerId: rdm.customerId,
            customerMerchantLoyaltyAccountId: rdm.customer_merchant_loyalty_account_id,
            rewardId: rdm.reward_id,
            rewardName: rdm.reward_name,
            rewardType: rdm.reward_type,
            pointsRedeemed: Number(rdm.points_redeemed),
            cashValue: rdm.cash_value ? Number(rdm.cash_value) : undefined,
            status: rdm.status,
            processedByEmployeeId: rdm.processed_by_employee_id,
            notes: rdm.notes,
            createdAt: rdm.created_at,
            updatedAt: rdm.updated_at,
          });
        });
      } catch {}

      try {
        const dbConfigs = await queryMySQL<any>('SELECT * FROM merchant_sms_configs');
        dbConfigs.forEach((cfg) => {
          this.smsConfigs.set(cfg.merchant_id, {
            id: cfg.id,
            merchantId: cfg.merchant_id,
            provider: cfg.provider,
            senderId: cfg.sender_id,
            dlTEntityId: cfg.dlt_entity_id,
            transactionTemplateId: cfg.transaction_template_id,
            otpTemplateId: cfg.otp_template_id,
            welcomeTemplateId: cfg.welcome_template_id,
            enabled: Boolean(cfg.enabled),
            createdAt: cfg.created_at,
            updatedAt: cfg.updated_at,
          });
        });
      } catch {}

      try {
        const dbAudit = await queryMySQL<any>('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500');
        this.auditLogs = dbAudit.map((a) => ({
          id: a.id,
          businessId: a.business_id,
          actorUserId: a.actor_user_id,
          actorRole: a.actor_role,
          action: a.action,
          details: a.details,
          ipAddress: a.ip_address,
          timestamp: a.timestamp,
          businessName: a.business_name,
          actorName: a.actor_name,
        }));
      } catch {}

      try {
        const dbSMS = await queryMySQL<any>('SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 200');
        this.smsLogs = dbSMS.map((s) => ({
          id: s.id,
          recipientMobile: s.recipient_mobile,
          message: s.message,
          status: s.status,
          createdAt: s.created_at,
        }));
      } catch {}
    } catch (err: any) {
      console.warn('[DB] Error loading MySQL tables into memory:', err.message);
    }
  }

  // --- MYSQL PERSISTENCE HELPERS ---
  private async persistUser(u: User) {
    if (!this.isMySQLConnected) return;
    try {
      const createdAt = formatToMySQLDateTime(u.createdAt) || formatToMySQLDateTime(new Date());
      const updatedAt = formatToMySQLDateTime(u.updatedAt) || createdAt;

      // Check if user already exists by exact ID or unique mobile/email
      let existing: any = null;
      if (u.id) {
        const rows = await queryMySQL<any>('SELECT id FROM users WHERE id = ?', [u.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && u.mobileNumber) {
        const rows = await queryMySQL<any>('SELECT id FROM users WHERE mobile_number = ?', [u.mobileNumber]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && u.email) {
        const rows = await queryMySQL<any>('SELECT id FROM users WHERE email = ?', [u.email]);
        if (rows.length > 0) existing = rows[0];
      }

      if (existing) {
        await queryMySQL(
          `UPDATE users SET email = COALESCE(?, email), mobile_number = COALESCE(?, mobile_number), full_name = ?, role = ?, is_active = ?, updated_at = ? WHERE id = ?`,
          [u.email ?? null, u.mobileNumber ?? null, u.fullName, u.role, u.isActive ? 1 : 0, updatedAt, existing.id]
        );
        if (existing.id !== u.id) {
          const oldId = u.id;
          const realId = existing.id;
          u.id = realId;
          this.users.set(realId, u);
          this.users.delete(oldId);

          for (const c of this.customers.values()) {
            if (c.userId === oldId) c.userId = realId;
          }
          for (const e of this.employees.values()) {
            if (e.userId === oldId) e.userId = realId;
          }
          for (const tx of this.transactions) {
            if (tx.cashierUserId === oldId) tx.cashierUserId = realId;
          }
          for (const log of this.auditLogs) {
            if (log.actorUserId === oldId) log.actorUserId = realId;
          }
        }
      } else {
        await queryMySQL(
          `INSERT INTO users (id, email, mobile_number, full_name, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE email=VALUES(email), mobile_number=VALUES(mobile_number), full_name=VALUES(full_name), role=VALUES(role), is_active=VALUES(is_active), updated_at=VALUES(updated_at)`,
          [u.id, u.email ?? null, u.mobileNumber ?? null, u.fullName, u.role, u.isActive ? 1 : 0, createdAt, updatedAt]
        );
      }
    } catch (e: any) { console.warn('User MySQL sync failed:', e.message); }
  }

  private async persistBusiness(b: Business) {
    if (!this.isMySQLConnected) return;
    try {
      const createdAt = formatToMySQLDateTime(b.createdAt) || formatToMySQLDateTime(new Date());
      const updatedAt = formatToMySQLDateTime(b.updatedAt) || createdAt;

      // Check if business already exists by ID or unique code
      let existing: any = null;
      if (b.id) {
        const rows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [b.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && b.code) {
        const rows = await queryMySQL<any>('SELECT id FROM businesses WHERE code = ?', [b.code]);
        if (rows.length > 0) existing = rows[0];
      }

      if (existing) {
        await queryMySQL(
          `UPDATE businesses SET name = ?, logo_url = ?, category = ?, reward_percentage = ?, min_redeem_points = ?, point_value_in_currency = ?, is_active = ?, updated_at = ? WHERE id = ?`,
          [b.name, b.logoUrl ?? null, b.category ?? null, b.rewardPercentage ?? 5, b.minRedeemPoints ?? 100, b.pointValueInCurrency ?? 1.0, b.isActive ? 1 : 0, updatedAt, existing.id]
        );
        if (existing.id !== b.id) {
          const oldId = b.id;
          const realId = existing.id;
          b.id = realId;
          this.businesses.set(realId, b);
          this.businesses.delete(oldId);

          for (const br of this.branches.values()) {
            if (br.businessId === oldId) br.businessId = realId;
          }
          for (const emp of this.employees.values()) {
            if (emp.businessId === oldId) emp.businessId = realId;
          }
          for (const mem of this.memberships.values()) {
            if (mem.businessId === oldId) mem.businessId = realId;
          }
          for (const wal of this.wallets.values()) {
            if (wal.businessId === oldId) wal.businessId = realId;
          }
          for (const tx of this.transactions) {
            if (tx.businessId === oldId) tx.businessId = realId;
          }
          for (const r of this.rewards.values()) {
            if (r.merchantId === oldId) r.merchantId = realId;
          }
          for (const rdm of this.redemptions.values()) {
            if (rdm.merchantId === oldId) rdm.merchantId = realId;
          }
          for (const cfg of this.smsConfigs.values()) {
            if (cfg.merchantId === oldId) cfg.merchantId = realId;
          }
          for (const log of this.auditLogs) {
            if (log.businessId === oldId) log.businessId = realId;
          }
        }
      } else {
        await queryMySQL(
          `INSERT INTO businesses (id, name, code, logo_url, category, reward_percentage, min_redeem_points, point_value_in_currency, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), logo_url=VALUES(logo_url), category=VALUES(category), reward_percentage=VALUES(reward_percentage), min_redeem_points=VALUES(min_redeem_points), point_value_in_currency=VALUES(point_value_in_currency), is_active=VALUES(is_active), updated_at=VALUES(updated_at)`,
          [b.id, b.name, b.code, b.logoUrl ?? null, b.category ?? null, b.rewardPercentage ?? 5, b.minRedeemPoints ?? 100, b.pointValueInCurrency ?? 1.0, b.isActive ? 1 : 0, createdAt, updatedAt]
        );
      }
    } catch (e: any) { console.warn('Business MySQL sync failed:', e.message); }
  }

  private async persistBranch(br: Branch) {
    if (!this.isMySQLConnected) return;
    try {
      // Ensure parent business exists and get real businessId
      let realBizId = br.businessId;
      let bizRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [br.businessId]);
      if (bizRows.length > 0) {
        realBizId = bizRows[0].id;
      } else {
        const biz = this.businesses.get(br.businessId);
        if (biz) {
          await this.persistBusiness(biz);
          realBizId = biz.id;
        }
      }
      bizRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [realBizId]);
      if (bizRows.length === 0) {
        console.warn(`Cannot persist branch ${br.id}: business ${realBizId} not found in MySQL`);
        return;
      }
      br.businessId = realBizId;

      // Check if branch already exists in MySQL (by id or business_id + code)
      let existing: any = null;
      if (br.id) {
        const rows = await queryMySQL<any>('SELECT id FROM branches WHERE id = ?', [br.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && realBizId && br.code) {
        const rows = await queryMySQL<any>('SELECT id FROM branches WHERE business_id = ? AND code = ?', [realBizId, br.code]);
        if (rows.length > 0) existing = rows[0];
      }

      const createdAt = formatToMySQLDateTime(br.createdAt) || formatToMySQLDateTime(new Date());

      if (existing) {
        try {
          await queryMySQL(
            `UPDATE branches SET business_id = ?, name = ?, code = ?, address = ?, city = ?, phone = ?, is_active = ? WHERE id = ?`,
            [realBizId, br.name, br.code, br.address ?? null, br.city ?? null, br.phone ?? null, br.isActive ? 1 : 0, existing.id]
          );
        } catch {
          await queryMySQL(
            `UPDATE branches SET business_id = ?, name = ?, code = ?, address = ?, city = ?, phone = ? WHERE id = ?`,
            [realBizId, br.name, br.code, br.address ?? null, br.city ?? null, br.phone ?? null, existing.id]
          );
        }
        if (existing.id !== br.id) {
          const oldId = br.id;
          const realId = existing.id;
          br.id = realId;
          this.branches.set(realId, br);
          this.branches.delete(oldId);

          for (const emp of this.employees.values()) {
            if (emp.branchId === oldId) emp.branchId = realId;
          }
          for (const tx of this.transactions) {
            if (tx.branchId === oldId) tx.branchId = realId;
          }
        }
      } else {
        try {
          await queryMySQL(
            `INSERT INTO branches (id, business_id, name, code, address, city, phone, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [br.id, realBizId, br.name, br.code, br.address ?? null, br.city ?? null, br.phone ?? null, br.isActive ? 1 : 0, createdAt]
          );
        } catch (colErr: any) {
          await queryMySQL(
            `INSERT INTO branches (id, business_id, name, code, address, city, phone, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [br.id, realBizId, br.name, br.code, br.address ?? null, br.city ?? null, br.phone ?? null, createdAt]
          );
        }
      }
    } catch (e: any) { console.warn('Branch MySQL sync failed:', e.message); }
  }

  private async persistEmployee(e: Employee) {
    if (!this.isMySQLConnected) return;
    try {
      // 1. Resolve User
      let realUserId = e.userId;
      let uRows = await queryMySQL<any>('SELECT id FROM users WHERE id = ?', [e.userId]);
      if (uRows.length > 0) {
        realUserId = uRows[0].id;
      } else {
        const u = this.users.get(e.userId);
        if (u) {
          await this.persistUser(u);
          realUserId = u.id;
        }
      }
      uRows = await queryMySQL<any>('SELECT id FROM users WHERE id = ?', [realUserId]);
      if (uRows.length === 0) {
        console.warn(`Cannot persist employee ${e.id}: user ${realUserId} not found in MySQL`);
        return;
      }
      e.userId = realUserId;

      // 2. Resolve Business
      let realBizId = e.businessId;
      let bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [e.businessId]);
      if (bRows.length > 0) {
        realBizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(e.businessId);
        if (biz) {
          await this.persistBusiness(biz);
          realBizId = biz.id;
        }
      }
      bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [realBizId]);
      if (bRows.length === 0) {
        console.warn(`Cannot persist employee ${e.id}: business ${realBizId} not found in MySQL`);
        return;
      }
      e.businessId = realBizId;

      // 3. Resolve Branch
      let realBranchId = e.branchId ?? null;
      if (realBranchId) {
        const brRows = await queryMySQL<any>('SELECT id FROM branches WHERE id = ?', [realBranchId]);
        if (brRows.length === 0) {
          const br = this.branches.get(realBranchId);
          if (br) {
            await this.persistBranch(br);
            realBranchId = br.id;
          } else {
            realBranchId = null;
          }
        }
      }
      e.branchId = realBranchId;

      // 4. Check if employee already exists in MySQL
      let existing: any = null;
      if (e.id) {
        const rows = await queryMySQL<any>('SELECT id FROM employees WHERE id = ?', [e.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && realBizId && e.employeeCode) {
        const rows = await queryMySQL<any>('SELECT id FROM employees WHERE business_id = ? AND employee_code = ?', [realBizId, e.employeeCode]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && realBizId && realUserId) {
        const rows = await queryMySQL<any>('SELECT id FROM employees WHERE business_id = ? AND user_id = ?', [realBizId, realUserId]);
        if (rows.length > 0) existing = rows[0];
      }

      const createdAt = formatToMySQLDateTime(e.createdAt) || formatToMySQLDateTime(new Date());

      if (existing) {
        try {
          await queryMySQL(
            `UPDATE employees SET user_id = ?, business_id = ?, branch_id = ?, employee_code = ?, role = ?, is_active = ? WHERE id = ?`,
            [realUserId, realBizId, realBranchId, e.employeeCode, e.role, e.isActive ? 1 : 0, existing.id]
          );
        } catch {
          await queryMySQL(
            `UPDATE employees SET user_id = ?, business_id = ?, branch_id = ?, employee_code = ?, role = ? WHERE id = ?`,
            [realUserId, realBizId, realBranchId, e.employeeCode, e.role, existing.id]
          );
        }
        if (existing.id !== e.id) {
          const oldId = e.id;
          const realId = existing.id;
          e.id = realId;
          this.employees.set(realId, e);
          this.employees.delete(oldId);
        }
      } else {
        try {
          await queryMySQL(
            `INSERT INTO employees (id, user_id, business_id, branch_id, employee_code, role, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [e.id, realUserId, realBizId, realBranchId, e.employeeCode, e.role, e.isActive ? 1 : 0, createdAt]
          );
        } catch (colErr: any) {
          await queryMySQL(
            `INSERT INTO employees (id, user_id, business_id, branch_id, employee_code, role, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [e.id, realUserId, realBizId, realBranchId, e.employeeCode, e.role, createdAt]
          );
        }
      }
    } catch (e: any) { console.warn('Employee MySQL sync failed:', e.message); }
  }

  private async persistCustomer(c: Customer) {
    if (!this.isMySQLConnected) return;
    try {
      // 1. Resolve or create parent User in MySQL
      let realUserId = c.userId;
      const uRows = await queryMySQL<any>(
        'SELECT id FROM users WHERE id = ? OR (mobile_number IS NOT NULL AND mobile_number = ?)',
        [c.userId, c.mobileNumber]
      );
      if (uRows.length > 0) {
        realUserId = uRows[0].id;
      } else {
        let u = this.users.get(c.userId);
        if (!u) {
          u = {
            id: c.userId || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            email: c.email || null,
            mobileNumber: c.mobileNumber,
            fullName: c.name,
            role: 'CUSTOMER',
            isActive: true,
            createdAt: c.createdAt,
            updatedAt: c.createdAt,
          };
          this.users.set(u.id, u);
        }
        await this.persistUser(u);
        realUserId = u.id;
      }
      c.userId = realUserId;

      // 2. Check if customer already exists in MySQL (by id, mobile_number, or user_id)
      let existing: any = null;
      if (c.id) {
        const rows = await queryMySQL<any>('SELECT id FROM customers WHERE id = ?', [c.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && c.mobileNumber) {
        const rows = await queryMySQL<any>('SELECT id FROM customers WHERE mobile_number = ?', [c.mobileNumber]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && realUserId) {
        const rows = await queryMySQL<any>('SELECT id FROM customers WHERE user_id = ?', [realUserId]);
        if (rows.length > 0) existing = rows[0];
      }

      const createdAt = formatToMySQLDateTime(c.createdAt) || formatToMySQLDateTime(new Date());

      if (existing) {
        await queryMySQL(
          `UPDATE customers SET user_id = ?, mobile_number = ?, name = ?, email = COALESCE(?, email), universal_qr_code = COALESCE(?, universal_qr_code) WHERE id = ?`,
          [realUserId, c.mobileNumber, c.name, c.email ?? null, c.universalQrCode ?? null, existing.id]
        );
        if (existing.id !== c.id) {
          const oldId = c.id;
          const realId = existing.id;
          c.id = realId;
          this.customers.set(realId, c);
          this.customers.delete(oldId);

          for (const m of this.memberships.values()) {
            if (m.customerId === oldId) m.customerId = realId;
          }
          for (const w of this.wallets.values()) {
            if (w.customerId === oldId) w.customerId = realId;
          }
          for (const rdm of this.redemptions.values()) {
            if (rdm.customerId === oldId) rdm.customerId = realId;
          }
        }
      } else {
        try {
          await queryMySQL(
            `INSERT INTO customers (id, user_id, mobile_number, name, email, universal_qr_code, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [c.id, realUserId, c.mobileNumber, c.name, c.email ?? null, c.universalQrCode ?? null, createdAt]
          );
        } catch (colErr: any) {
          await queryMySQL(
            `INSERT INTO customers (id, user_id, mobile_number, name, email, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [c.id, realUserId, c.mobileNumber, c.name, c.email ?? null, createdAt]
          );
        }
      }
    } catch (e: any) { console.warn('Customer MySQL sync failed:', e.message); }
  }

  private async persistMembership(m: BusinessMembership) {
    if (!this.isMySQLConnected) return;
    try {
      // 1. Resolve Customer ID
      let custId = m.customerId;
      let cRows = await queryMySQL<any>('SELECT id FROM customers WHERE id = ?', [m.customerId]);
      if (cRows.length > 0) {
        custId = cRows[0].id;
      } else {
        const cust = this.customers.get(m.customerId);
        if (cust) {
          await this.persistCustomer(cust);
          custId = cust.id;
        }
      }
      cRows = await queryMySQL<any>('SELECT id FROM customers WHERE id = ?', [custId]);
      if (cRows.length === 0) {
        console.warn(`Cannot persist membership ${m.id}: customer ${custId} not found in MySQL`);
        return;
      }
      m.customerId = custId;

      // 2. Resolve Business ID
      let bizId = m.businessId;
      let bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [m.businessId]);
      if (bRows.length > 0) {
        bizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(m.businessId);
        if (biz) {
          await this.persistBusiness(biz);
          bizId = biz.id;
        }
      }
      bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [bizId]);
      if (bRows.length === 0) {
        console.warn(`Cannot persist membership ${m.id}: business ${bizId} not found in MySQL`);
        return;
      }
      m.businessId = bizId;

      // 3. Check if membership already exists in MySQL (by id, membership_code, or customer_id + business_id)
      let existing: any = null;
      if (m.id) {
        const rows = await queryMySQL<any>('SELECT id FROM business_memberships WHERE id = ?', [m.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && m.membershipCode) {
        const rows = await queryMySQL<any>('SELECT id FROM business_memberships WHERE membership_code = ?', [m.membershipCode]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && custId && bizId) {
        const rows = await queryMySQL<any>('SELECT id FROM business_memberships WHERE customer_id = ? AND business_id = ?', [custId, bizId]);
        if (rows.length > 0) existing = rows[0];
      }

      const joinedAt = formatToMySQLDateTime(m.joinedAt) || formatToMySQLDateTime(new Date());

      if (existing) {
        await queryMySQL(
          `UPDATE business_memberships SET customer_id = ?, business_id = ?, membership_code = ?, status = ? WHERE id = ?`,
          [custId, bizId, m.membershipCode, m.status, existing.id]
        );
        if (existing.id !== m.id) {
          const oldId = m.id;
          const realId = existing.id;
          m.id = realId;
          this.memberships.set(realId, m);
          this.memberships.delete(oldId);

          for (const w of this.wallets.values()) {
            if (w.membershipId === oldId) w.membershipId = realId;
          }
          for (const tx of this.transactions) {
            if (tx.membershipId === oldId) tx.membershipId = realId;
          }
        }
      } else {
        await queryMySQL(
          `INSERT INTO business_memberships (id, customer_id, business_id, membership_code, status, joined_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [m.id, custId, bizId, m.membershipCode, m.status, joinedAt]
        );
      }
    } catch (e: any) { console.warn('Membership MySQL sync failed:', e.message); }
  }

  private async persistWallet(w: RewardAccount | Wallet) {
    if (!this.isMySQLConnected) return;
    try {
      // 1. Resolve parent Business
      let bizId = w.businessId;
      let bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [w.businessId]);
      if (bRows.length > 0) {
        bizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(w.businessId);
        if (biz) {
          await this.persistBusiness(biz);
          bizId = biz.id;
        }
      }
      bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [bizId]);
      if (bRows.length === 0) {
        console.warn(`Cannot persist wallet ${w.id}: business ${bizId} not found in MySQL`);
        return;
      }
      w.businessId = bizId;

      // 2. Resolve parent Membership
      let memId = w.membershipId;
      let mRows = await queryMySQL<any>('SELECT id, customer_id FROM business_memberships WHERE id = ?', [w.membershipId]);
      if (mRows.length > 0) {
        memId = mRows[0].id;
      } else {
        const mem = this.memberships.get(w.membershipId);
        if (mem) {
          await this.persistMembership(mem);
          memId = mem.id;
        }
      }
      mRows = await queryMySQL<any>('SELECT id, customer_id FROM business_memberships WHERE id = ?', [memId]);
      if (mRows.length === 0) {
        console.warn(`Cannot persist wallet ${w.id}: membership ${memId} not found in MySQL`);
        return;
      }
      w.membershipId = memId;
      const customerId = w.customerId ?? mRows[0].customer_id ?? null;

      // 3. Check if reward_account already exists in MySQL (by id or by membership_id)
      let existing: any = null;
      if (w.id) {
        const rows = await queryMySQL<any>('SELECT id FROM reward_accounts WHERE id = ?', [w.id]);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && memId) {
        const rows = await queryMySQL<any>('SELECT id FROM reward_accounts WHERE membership_id = ?', [memId]);
        if (rows.length > 0) existing = rows[0];
      }

      const createdAt = formatToMySQLDateTime(w.createdAt) || formatToMySQLDateTime(new Date());
      const updatedAt = formatToMySQLDateTime(w.updatedAt) || createdAt;
      const currency = w.currency || (w as any).currencyName || 'Points';

      if (existing) {
        await queryMySQL(
          `UPDATE reward_accounts SET membership_id = ?, customer_id = ?, business_id = ?, balance = ?, currency = ?, currency_name = ?, status = ?, updated_at = ? WHERE id = ?`,
          [memId, customerId, bizId, w.balance, currency, currency, w.status || 'ACTIVE', updatedAt, existing.id]
        );
        if (existing.id !== w.id) {
          const oldId = w.id;
          const realId = existing.id;
          w.id = realId;
          this.wallets.set(realId, w);
          this.wallets.delete(oldId);

          for (const tx of this.transactions) {
            if (tx.rewardAccountId === oldId || (tx as any).walletId === oldId) {
              tx.rewardAccountId = realId;
              (tx as any).walletId = realId;
            }
          }
        }
      } else {
        try {
          await queryMySQL(
            `INSERT INTO reward_accounts (id, membership_id, customer_id, business_id, balance, currency, currency_name, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [w.id, memId, customerId, bizId, w.balance, currency, currency, w.status || 'ACTIVE', createdAt, updatedAt]
          );
        } catch (colErr: any) {
          await queryMySQL(
            `INSERT INTO reward_accounts (id, membership_id, business_id, balance, currency, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [w.id, memId, bizId, w.balance, currency, updatedAt]
          );
        }
      }
    } catch (err: any) {
      console.warn('Reward Account / Wallet MySQL sync failed:', err.message);
    }
  }

  private async persistTransaction(tx: RewardTransaction | WalletTransaction) {
    if (!this.isMySQLConnected) return;
    const createdAt = formatToMySQLDateTime(tx.createdAt) || formatToMySQLDateTime(new Date());

    try {
      // 1. Resolve business
      let bizId = tx.businessId;
      let bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [tx.businessId]);
      if (bRows.length > 0) {
        bizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(tx.businessId);
        if (biz) {
          await this.persistBusiness(biz);
          bizId = biz.id;
        }
      }
      bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [bizId]);
      if (bRows.length === 0) {
        console.warn(`Cannot persist transaction ${tx.id}: business ${bizId} not found in MySQL`);
        return;
      }
      tx.businessId = bizId;

      // 2. Resolve membership
      let memId = tx.membershipId;
      let mRows = await queryMySQL<any>('SELECT id FROM business_memberships WHERE id = ?', [tx.membershipId]);
      if (mRows.length > 0) {
        memId = mRows[0].id;
      } else {
        const mem = this.memberships.get(tx.membershipId);
        if (mem) {
          await this.persistMembership(mem);
          memId = mem.id;
        }
      }
      mRows = await queryMySQL<any>('SELECT id FROM business_memberships WHERE id = ?', [memId]);
      if (mRows.length === 0) {
        console.warn(`Cannot persist transaction ${tx.id}: membership ${memId} not found in MySQL`);
        return;
      }
      tx.membershipId = memId;

      // 3. Resolve wallet / reward account
      let rewardAccountId = tx.rewardAccountId || (tx as any).walletId || `wal-${memId}`;
      let walRows = await queryMySQL<any>('SELECT id FROM reward_accounts WHERE id = ?', [rewardAccountId]);
      if (walRows.length === 0) {
        const wal = this.wallets.get(rewardAccountId) || this.wallets.get((tx as any).walletId);
        if (wal) {
          await this.persistWallet(wal);
          rewardAccountId = wal.id;
        } else {
          const accRows = await queryMySQL<any>('SELECT id FROM reward_accounts WHERE membership_id = ?', [memId]);
          if (accRows.length > 0) {
            rewardAccountId = accRows[0].id;
          }
        }
      }
      walRows = await queryMySQL<any>('SELECT id FROM reward_accounts WHERE id = ?', [rewardAccountId]);
      if (walRows.length === 0) {
        console.warn(`Cannot persist transaction ${tx.id}: reward_account ${rewardAccountId} not found in MySQL`);
        return;
      }
      const walletId = (tx as any).walletId || rewardAccountId;

      // 4. Resolve branch (if present)
      let branchId = tx.branchId ?? null;
      if (branchId) {
        const brRows = await queryMySQL<any>('SELECT id FROM branches WHERE id = ?', [branchId]);
        if (brRows.length === 0) {
          const br = this.branches.get(branchId);
          if (br) {
            await this.persistBranch(br);
            branchId = br.id;
          } else {
            branchId = null;
          }
        }
      }

      // 5. Resolve cashier user (if present)
      let cashierUserId = tx.cashierUserId ?? (tx as any).employeeId ?? null;
      if (cashierUserId) {
        const uRows = await queryMySQL<any>('SELECT id FROM users WHERE id = ?', [cashierUserId]);
        if (uRows.length === 0) {
          const u = this.users.get(cashierUserId);
          if (u) {
            await this.persistUser(u);
            cashierUserId = u.id;
          } else {
            cashierUserId = null;
          }
        }
      }

      try {
        await queryMySQL(
          `INSERT INTO reward_transactions (id, reward_account_id, wallet_id, membership_id, business_id, branch_id, cashier_user_id, type, points, bill_amount, bill_number, reference, narration, balance_after, created_at, business_name, branch_name, cashier_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE balance_after=VALUES(balance_after), narration=VALUES(narration)`,
          [
            tx.id,
            rewardAccountId,
            walletId,
            memId,
            bizId,
            branchId,
            cashierUserId,
            tx.type,
            tx.points,
            tx.billAmount !== undefined && tx.billAmount !== null ? Number(tx.billAmount) : null,
            tx.billNumber || tx.reference || null,
            tx.reference || null,
            tx.narration || null,
            tx.balanceAfter,
            createdAt,
            tx.businessName || null,
            tx.branchName || null,
            tx.cashierName || null,
          ]
        );
      } catch (e: any) {
        await queryMySQL(
          `INSERT INTO reward_transactions (id, reward_account_id, membership_id, business_id, branch_id, cashier_user_id, type, points, bill_amount, bill_number, reference, narration, balance_after, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE balance_after=VALUES(balance_after), narration=VALUES(narration)`,
          [
            tx.id,
            rewardAccountId,
            memId,
            bizId,
            branchId,
            cashierUserId,
            tx.type,
            tx.points,
            tx.billAmount !== undefined && tx.billAmount !== null ? Number(tx.billAmount) : null,
            tx.billNumber || tx.reference || null,
            tx.reference || null,
            tx.narration || null,
            tx.balanceAfter,
            createdAt,
          ]
        );
      }
    } catch (err: any) {
      console.warn('Transaction MySQL sync failed:', err.message);
    }
  }

  private async persistOTP(otp: OTPRequest) {
    if (!this.isMySQLConnected) return;
    try {
      const createdAt = formatToMySQLDateTime(otp.createdAt) || formatToMySQLDateTime(new Date());
      const expiresAt = formatToMySQLDateTime(otp.expiresAt) || formatToMySQLDateTime(new Date(Date.now() + 5 * 60 * 1000));
      await queryMySQL(
        `INSERT INTO otp_requests (id, mobile_number, otp, type, expires_at, is_verified, attempts, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_verified=VALUES(is_verified), attempts=VALUES(attempts)`,
        [otp.id, otp.mobileNumber, otp.otp, otp.type, expiresAt, otp.isVerified ? 1 : 0, otp.attempts ?? 0, createdAt]
      );
    } catch (e: any) { console.warn('OTP MySQL sync failed:', e.message); }
  }

  private async persistSMS(sms: SMSLog) {
    if (!this.isMySQLConnected) return;
    try {
      const createdAt = formatToMySQLDateTime(sms.createdAt) || formatToMySQLDateTime(new Date());
      await queryMySQL(
        `INSERT INTO sms_logs (id, recipient_mobile, message, status, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [sms.id, sms.recipientMobile, sms.message, sms.status || 'SENT', createdAt]
      );
    } catch (e: any) { console.warn('SMS MySQL sync failed:', e.message); }
  }

  private async persistAuditLog(log: AuditLog) {
    if (!this.isMySQLConnected) return;
    try {
      let businessId = log.businessId ?? null;
      if (businessId) {
        const bizRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [businessId]);
        if (bizRows.length === 0) businessId = null;
      }

      let actorUserId = log.actorUserId ?? null;
      if (actorUserId) {
        const uRows = await queryMySQL<any>('SELECT id FROM users WHERE id = ?', [actorUserId]);
        if (uRows.length === 0) actorUserId = null;
      }

      const timestamp = formatToMySQLDateTime(log.timestamp) || formatToMySQLDateTime(new Date());
      try {
        await queryMySQL(
          `INSERT INTO audit_logs (id, business_id, actor_user_id, actor_role, action, details, ip_address, timestamp, business_name, actor_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE details=VALUES(details), business_name=VALUES(business_name), actor_name=VALUES(actor_name)`,
          [
            log.id,
            businessId,
            actorUserId,
            log.actorRole,
            log.action,
            log.details,
            log.ipAddress || '127.0.0.1',
            timestamp,
            log.businessName ?? null,
            log.actorName ?? null,
          ]
        );
      } catch (e: any) {
        await queryMySQL(
          `INSERT INTO audit_logs (id, business_id, actor_user_id, actor_role, action, details, ip_address, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE details=VALUES(details)`,
          [
            log.id,
            businessId,
            actorUserId,
            log.actorRole,
            log.action,
            log.details,
            log.ipAddress || '127.0.0.1',
            timestamp,
          ]
        );
      }
    } catch (err: any) {
      console.warn('AuditLog MySQL sync failed:', err.message);
    }
  }

  private async persistReward(r: Reward) {
    if (!this.isMySQLConnected) return;
    try {
      let bizId = r.merchantId;
      const bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [r.merchantId]);
      if (bRows.length > 0) {
        bizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(r.merchantId);
        if (biz) {
          await this.persistBusiness(biz);
          bizId = biz.id;
        }
      }
      r.merchantId = bizId;

      const createdAt = formatToMySQLDateTime(r.createdAt) || formatToMySQLDateTime(new Date());
      const updatedAt = formatToMySQLDateTime(r.updatedAt) || createdAt;
      const isActiveNum = r.status === 'INACTIVE' ? 0 : 1;
      await queryMySQL(
        `INSERT INTO rewards (id, merchant_id, name, description, points_required, cash_value, type, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), points_required=VALUES(points_required), cash_value=VALUES(cash_value), type=VALUES(type), is_active=VALUES(is_active), updated_at=VALUES(updated_at)`,
        [r.id, bizId, r.name, r.description ?? null, r.pointsRequired, r.cashValue ?? null, r.type, isActiveNum, createdAt, updatedAt]
      );
    } catch (e: any) { console.warn('Reward MySQL sync failed:', e.message); }
  }

  private async persistRedemption(rdm: Redemption) {
    if (!this.isMySQLConnected) return;
    try {
      let bizId = rdm.merchantId;
      const bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [rdm.merchantId]);
      if (bRows.length > 0) {
        bizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(rdm.merchantId);
        if (biz) {
          await this.persistBusiness(biz);
          bizId = biz.id;
        }
      }
      rdm.merchantId = bizId;

      const cust = this.customers.get(rdm.customerId);
      if (cust) await this.persistCustomer(cust);

      const createdAt = formatToMySQLDateTime(rdm.createdAt) || formatToMySQLDateTime(new Date());
      const updatedAt = formatToMySQLDateTime(rdm.updatedAt) || createdAt;
      await queryMySQL(
        `INSERT INTO redemptions (id, merchant_id, customerId, customer_merchant_loyalty_account_id, reward_id, reward_name, reward_type, points_redeemed, cash_value, status, processed_by_employee_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), processed_by_employee_id=VALUES(processed_by_employee_id), notes=VALUES(notes), updated_at=VALUES(updated_at)`,
        [rdm.id, bizId, rdm.customerId, rdm.customerMerchantLoyaltyAccountId, rdm.rewardId, rdm.rewardName, rdm.rewardType, rdm.pointsRedeemed, rdm.cashValue ?? null, rdm.status, rdm.processedByEmployeeId ?? null, rdm.notes ?? null, createdAt, updatedAt]
      );
    } catch (e: any) { console.warn('Redemption MySQL sync failed:', e.message); }
  }

  private async persistMerchantSmsConfig(cfg: MerchantSmsConfiguration) {
    if (!this.isMySQLConnected) return;
    try {
      let bizId = cfg.merchantId;
      const bRows = await queryMySQL<any>('SELECT id FROM businesses WHERE id = ?', [cfg.merchantId]);
      if (bRows.length > 0) {
        bizId = bRows[0].id;
      } else {
        const biz = this.businesses.get(cfg.merchantId);
        if (biz) {
          await this.persistBusiness(biz);
          bizId = biz.id;
        }
      }
      cfg.merchantId = bizId;

      const createdAt = formatToMySQLDateTime(cfg.createdAt) || formatToMySQLDateTime(new Date());
      const updatedAt = formatToMySQLDateTime(cfg.updatedAt) || createdAt;
      await queryMySQL(
        `INSERT INTO merchant_sms_configs (id, merchant_id, provider, sender_id, dlt_entity_id, transaction_template_id, otp_template_id, welcome_template_id, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE provider=VALUES(provider), sender_id=VALUES(sender_id), dlt_entity_id=VALUES(dlt_entity_id), transaction_template_id=VALUES(transaction_template_id), otp_template_id=VALUES(otp_template_id), welcome_template_id=VALUES(welcome_template_id), enabled=VALUES(enabled), updated_at=VALUES(updated_at)`,
        [cfg.id, bizId, cfg.provider, cfg.senderId, cfg.dlTEntityId ?? null, cfg.transactionTemplateId ?? null, cfg.otpTemplateId ?? null, cfg.welcomeTemplateId ?? null, cfg.enabled ? 1 : 0, createdAt, updatedAt]
      );
    } catch (e: any) { console.warn('MerchantSmsConfig MySQL sync failed:', e.message); }
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

  // Transaction Ledger Engine (IMMUTABLE BALANCE COMPUTATION WITH MANDATORY BILL NUMBER)
  public creditPoints(
    businessId: string,
    membershipId: string,
    billNumber: string,
    billAmount: number,
    branchId: string | null = null,
    cashierUserId: string | null = null
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

    const resolved = this.resolveCustomerAndMembership(membershipId, businessId);
    const membership = resolved.membership;
    const wallet = resolved.wallet;
    const customer = resolved.customer;

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
      `Credited +${points} points for Bill #${cleanBillNumber} (₹${billAmount.toLocaleString()}) to Customer ${customer.name} (+91 ${customer.mobileNumber})`
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
    this.persistReward(reward);
    return reward;
  }

  public updateReward(id: string, businessId: string, data: Partial<Reward>): Reward {
    const reward = this.rewards.get(id);
    if (!reward || reward.merchantId !== businessId) {
      throw new Error('Reward not found or does not belong to this merchant');
    }
    Object.assign(reward, data, { updatedAt: new Date().toISOString() });
    this.rewards.set(id, reward);
    this.persistReward(reward);
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
    this.persistRedemption(redemption);
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
      this.persistWallet(wallet);

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
      this.persistTransaction(tx);
    }

    rdm.status = status;
    rdm.processedByEmployeeId = employeeId;
    rdm.notes = notes;
    rdm.updatedAt = new Date().toISOString();
    this.redemptions.set(redemptionId, rdm);
    this.persistRedemption(rdm);
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
    this.persistMerchantSmsConfig(cfg);
    return cfg;
  }
}

export const db = new LoyaltyDatabase();
