import mysql from 'mysql2/promise';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

// Get MySQL Pool Configuration from Environment Variables
export function getMySQLConfig(): MySQLConfig {
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'loyalty_saas_db',
  };
}

let pool: mysql.Pool | null = null;

/**
 * Initializes and returns the MySQL connection pool.
 */
export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    const config = getMySQLConfig();
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
    });
    console.log(`[MySQL] Connection pool created for host ${config.host}:${config.port}/${config.database}`);
  }
  return pool;
}

/**
 * Tests connection to the configured MySQL database.
 */
export async function testMySQLConnection(): Promise<boolean> {
  try {
    const p = getMySQLPool();
    const [rows] = await p.query('SELECT 1 as connected');
    console.log('[MySQL] Connection test successful:', rows);
    return true;
  } catch (err: any) {
    console.warn('[MySQL] Connection test failed:', err.message);
    return false;
  }
}

/**
 * Executes a SQL query with parameters on MySQL.
 */
export async function queryMySQL<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getMySQLPool();
  const [rows] = await p.execute(sql, params);
  return rows as T[];
}

/**
 * Creates all 11 core multi-tenant loyalty database tables if they do not exist.
 */
export async function initializeMySQLSchema(): Promise<void> {
  const p = getMySQLPool();

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
      currency VARCHAR(10),
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
  ];

  for (const q of queries) {
    await p.query(q);
  }
  console.log('[MySQL] All 11 schema tables initialized successfully.');
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
