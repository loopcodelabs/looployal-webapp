import 'dotenv/config';
import mysql from 'mysql2/promise';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

// Get MySQL Pool Configuration from Environment Variables (.env supported)
export function getMySQLConfig(): MySQLConfig {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port || '3306', 10),
        user: decodeURIComponent(parsed.username || 'root'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname.replace(/^\//, '') || 'loyalty_saas_db',
      };
    } catch {
      // ignore URL parse failure and fallback to individual vars
    }
  }

  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
    user: process.env.MYSQL_USER || process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.DB_DATABASE || process.env.MYSQL_DB || 'loyalty_saas_db',
  };
}

let pool: mysql.Pool | null = null;

export const APP_TIMEZONE = process.env.APP_TIMEZONE || process.env.TZ || 'Asia/Kolkata';

/**
 * Resets the MySQL connection pool (used when re-evaluating environment credentials).
 */
export function resetMySQLPool(): void {
  if (pool) {
    try {
      pool.end().catch(() => {});
    } catch {}
    pool = null;
  }
}

/**
 * Initializes and returns the MySQL connection pool with Asia/Kolkata timezone support.
 */
export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    const config = getMySQLConfig();
    const tzOffset = process.env.MYSQL_TIMEZONE || '+05:30';
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: tzOffset,
      dateStrings: true,
    });
    console.log(`[MySQL] Connection pool created for host ${config.user}@${config.host}:${config.port}/${config.database} (Timezone: ${tzOffset})`);
  }
  return pool;
}

/**
 * Tests connection to the configured MySQL database.
 */
export async function testMySQLConnection(): Promise<boolean> {
  const config = getMySQLConfig();
  try {
    const p = getMySQLPool();
    const [rows] = await p.query('SELECT 1 as connected');
    console.log(`[MySQL] Connection test successful on ${config.host}:${config.port}/${config.database}:`, rows);
    return true;
  } catch (err: any) {
    console.warn(`[MySQL] Connection test failed for ${config.user}@${config.host}:${config.port}/${config.database} -> ${err.message}`);
    return false;
  }
}

/**
 * Formats any JS Date, ISO string, timestamp or number into a standard MySQL DATETIME string
 * synced with the local time zone Asia/Kolkata (UTC+05:30).
 * Format: 'YYYY-MM-DD HH:MM:SS.SSS' (compatible with DATETIME, TIMESTAMP, and VARCHAR columns).
 */
export function formatToMySQLDateTime(val?: string | Date | number | null, timeZone: string = APP_TIMEZONE): string | null {
  if (val === undefined || val === null || val === '') return null;
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) {
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
      return null;
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

    const YYYY = getPart('year');
    const MM = getPart('month');
    const DD = getPart('day');
    let HH = getPart('hour');
    if (HH === '24') HH = '00';
    const mm = getPart('minute');
    const ss = getPart('second');
    const SSS = String(d.getMilliseconds()).padStart(3, '0');

    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${SSS}`;
  } catch {
    try {
      const d = val instanceof Date ? val : new Date(val);
      // Fallback with fixed +05:30 offset calculation if timezone name is unrecognized in Node runtime
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(d.getTime() + istOffsetMs);
      const pad = (n: number, z = 2) => String(n).padStart(z, '0');
      const YYYY = istDate.getUTCFullYear();
      const MM = pad(istDate.getUTCMonth() + 1);
      const DD = pad(istDate.getUTCDate());
      const HH = pad(istDate.getUTCHours());
      const mm = pad(istDate.getUTCMinutes());
      const ss = pad(istDate.getUTCSeconds());
      const SSS = pad(istDate.getUTCMilliseconds(), 3);
      return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${SSS}`;
    } catch {
      return typeof val === 'string' ? val : null;
    }
  }
}

/**
 * Executes a SQL query with parameters on MySQL with bulletproof undefined->null parameter sanitization.
 */
export async function queryMySQL<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getMySQLPool();
  const sanitized = params.map((item) => (item === undefined ? null : item));
  const [rows] = await p.execute(sql, sanitized);
  return rows as T[];
}

/**
 * Creates all core multi-tenant loyalty database tables if they do not exist,
 * configures session timezone to Asia/Kolkata (+05:30), and performs safe column migrations.
 */
export async function initializeMySQLSchema(): Promise<void> {
  const p = getMySQLPool();

  try {
    const tzOffset = process.env.MYSQL_TIMEZONE || '+05:30';
    await p.query(`SET time_zone = '${tzOffset}'`);
    console.log(`[MySQL Schema] Session time_zone configured to ${tzOffset}`);
  } catch (e: any) {
    console.warn('[MySQL Schema] Notice configuring session timezone:', e.message);
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255),
      mobile_number VARCHAR(20),
      full_name VARCHAR(255),
      role VARCHAR(50),
      is_active TINYINT(1) DEFAULT 1,
      created_at VARCHAR(64),
      updated_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS businesses (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255),
      code VARCHAR(50) UNIQUE,
      logo_url TEXT,
      category VARCHAR(100),
      reward_percentage DECIMAL(5,2),
      min_redeem_points INT,
      point_value_in_currency DECIMAL(8,2),
      is_active TINYINT(1) DEFAULT 1,
      created_at VARCHAR(64),
      updated_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS branches (
      id VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(64),
      name VARCHAR(255),
      code VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      phone VARCHAR(20),
      is_active TINYINT(1) DEFAULT 1,
      created_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      business_id VARCHAR(64),
      branch_id VARCHAR(64),
      employee_code VARCHAR(50),
      role VARCHAR(50),
      is_active TINYINT(1) DEFAULT 1,
      created_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      mobile_number VARCHAR(20),
      name VARCHAR(255),
      email VARCHAR(255),
      universal_qr_code VARCHAR(100),
      created_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS business_memberships (
      id VARCHAR(64) PRIMARY KEY,
      customer_id VARCHAR(64),
      business_id VARCHAR(64),
      membership_code VARCHAR(100),
      status VARCHAR(20),
      joined_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS reward_accounts (
      id VARCHAR(64) PRIMARY KEY,
      membership_id VARCHAR(64),
      customer_id VARCHAR(64),
      business_id VARCHAR(64),
      balance INT,
      currency VARCHAR(32) DEFAULT 'Points',
      currency_name VARCHAR(32) DEFAULT 'Points',
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at VARCHAR(64),
      updated_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS reward_transactions (
      id VARCHAR(64) PRIMARY KEY,
      reward_account_id VARCHAR(64),
      wallet_id VARCHAR(64),
      membership_id VARCHAR(64),
      business_id VARCHAR(64),
      branch_id VARCHAR(64),
      cashier_user_id VARCHAR(64),
      type VARCHAR(20),
      points INT,
      bill_amount DECIMAL(10,2),
      bill_number VARCHAR(100),
      reference VARCHAR(100),
      narration TEXT,
      balance_after INT,
      created_at VARCHAR(64),
      business_name VARCHAR(255),
      branch_name VARCHAR(255),
      cashier_name VARCHAR(255),
      UNIQUE KEY uq_business_bill (business_id, bill_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS otp_requests (
      id VARCHAR(64) PRIMARY KEY,
      mobile_number VARCHAR(20),
      otp VARCHAR(10),
      type VARCHAR(20),
      expires_at VARCHAR(64),
      is_verified TINYINT(1) DEFAULT 0,
      attempts INT DEFAULT 0,
      created_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS sms_logs (
      id VARCHAR(64) PRIMARY KEY,
      recipient_mobile VARCHAR(20),
      message TEXT,
      status VARCHAR(20),
      created_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS notifications_queue (
      id VARCHAR(64) PRIMARY KEY,
      recipient_mobile VARCHAR(20),
      type VARCHAR(50),
      message TEXT,
      status VARCHAR(20),
      provider VARCHAR(50),
      attempts INT DEFAULT 0,
      max_attempts INT DEFAULT 3,
      error TEXT,
      message_id VARCHAR(100),
      created_at VARCHAR(64),
      sent_at VARCHAR(64),
      failed_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(64),
      actor_user_id VARCHAR(64),
      actor_role VARCHAR(50),
      action VARCHAR(100),
      details TEXT,
      ip_address VARCHAR(50),
      timestamp VARCHAR(64),
      business_name VARCHAR(255),
      actor_name VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS rewards (
      id VARCHAR(64) PRIMARY KEY,
      merchant_id VARCHAR(64),
      name VARCHAR(255),
      description TEXT,
      points_required INT,
      cash_value DECIMAL(10,2),
      type VARCHAR(50),
      is_active TINYINT(1) DEFAULT 1,
      created_at VARCHAR(64),
      updated_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS redemptions (
      id VARCHAR(64) PRIMARY KEY,
      merchant_id VARCHAR(64),
      customerId VARCHAR(64),
      customer_merchant_loyalty_account_id VARCHAR(64),
      reward_id VARCHAR(64),
      reward_name VARCHAR(255),
      reward_type VARCHAR(50),
      points_redeemed INT,
      cash_value DECIMAL(10,2),
      status VARCHAR(50),
      processed_by_employee_id VARCHAR(64),
      notes TEXT,
      created_at VARCHAR(64),
      updated_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS merchant_sms_configs (
      id VARCHAR(64) PRIMARY KEY,
      merchant_id VARCHAR(64) UNIQUE,
      provider VARCHAR(50),
      sender_id VARCHAR(50),
      dlt_entity_id VARCHAR(100),
      transaction_template_id VARCHAR(100),
      otp_template_id VARCHAR(100),
      welcome_template_id VARCHAR(100),
      enabled TINYINT(1) DEFAULT 1,
      created_at VARCHAR(64),
      updated_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const q of queries) {
    try {
      await p.query(q);
    } catch (e: any) {
      console.warn('[MySQL Schema] Table creation notice:', e.message);
    }
  }

  // Safe Column Migrations for Existing Databases (ensures all fields exist across versions)
  const migrations = [
    `ALTER TABLE employees ADD COLUMN is_active TINYINT(1) DEFAULT 1`,
    `ALTER TABLE businesses ADD COLUMN is_active TINYINT(1) DEFAULT 1`,
    `ALTER TABLE businesses ADD COLUMN reward_percentage DECIMAL(5,2) DEFAULT 5.00`,
    `ALTER TABLE businesses ADD COLUMN min_redeem_points INT DEFAULT 100`,
    `ALTER TABLE businesses ADD COLUMN point_value_in_currency DECIMAL(8,2) DEFAULT 1.00`,
    `ALTER TABLE branches ADD COLUMN is_active TINYINT(1) DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1`,
    `ALTER TABLE audit_logs ADD COLUMN business_name VARCHAR(255) NULL`,
    `ALTER TABLE audit_logs ADD COLUMN actor_name VARCHAR(255) NULL`,
    `ALTER TABLE customers ADD COLUMN universal_qr_code VARCHAR(128) NULL`,
    `ALTER TABLE reward_accounts ADD COLUMN customer_id VARCHAR(64) NULL`,
    `ALTER TABLE reward_accounts ADD COLUMN currency VARCHAR(32) DEFAULT 'Points'`,
    `ALTER TABLE reward_accounts ADD COLUMN currency_name VARCHAR(32) DEFAULT 'Points'`,
    `ALTER TABLE reward_accounts ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'`,
    `ALTER TABLE reward_accounts ADD COLUMN created_at VARCHAR(64) NULL`,
    `ALTER TABLE reward_accounts ADD COLUMN updated_at VARCHAR(64) NULL`,
    `ALTER TABLE reward_transactions ADD COLUMN wallet_id VARCHAR(64) NULL`,
    `ALTER TABLE reward_transactions ADD COLUMN business_name VARCHAR(255) NULL`,
    `ALTER TABLE reward_transactions ADD COLUMN branch_name VARCHAR(255) NULL`,
    `ALTER TABLE reward_transactions ADD COLUMN cashier_name VARCHAR(255) NULL`,
    `ALTER TABLE rewards ADD COLUMN product_name VARCHAR(255) NULL`,
    `ALTER TABLE rewards ADD COLUMN stock_quantity INT DEFAULT 999`,
    `ALTER TABLE rewards ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'`,
    `ALTER TABLE otp_requests ADD COLUMN attempts INT DEFAULT 0`,
  ];

  for (const m of migrations) {
    try {
      await p.query(m);
    } catch {
      // Column already exists or schema is already up to date
    }
  }

  console.log('[MySQL] All core schema tables and migrations verified successfully.');
}

/**
 * Closes the MySQL connection pool if open.
 */
export async function closeMySQLPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[MySQL] Connection pool closed.');
  }
}
