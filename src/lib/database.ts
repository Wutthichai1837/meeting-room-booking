import mysql from 'mysql2/promise';

// Connection pool config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sitc_meeting_booking',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  acquireTimeout: 60000,
  charset: 'utf8mb4',
  timezone: '+07:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Event listeners (optional in production; can be disabled for silence)
if (process.env.NODE_ENV !== 'production') {
  pool.on('connection', conn => console.log('📊 New DB connection:', conn.threadId));
  pool.on('acquire', conn => console.log('🔄 Connection acquired:', conn.threadId));
  pool.on('release', conn => console.log('✅ Connection released:', conn.threadId));
  pool.on('error', err => console.error('❌ Pool error:', err));
}

export const db = {
  async query(sql: string, params?: any[]) {
    let conn;
    try {
      conn = await pool.getConnection();
      const [results] = await conn.execute(sql, params);
      return results;
    } catch (error: any) {
      console.error('❌ Query error:', error);
      throw error;
    } finally {
      conn?.release();
    }
  },

  async queryRow(sql: string, params?: any[]) {
    const results = await this.query(sql, params);
    const rows = results as Record<string, any>[];
    return rows.length ? rows[0] : null;
  },

  async transaction(queries: Array<{ sql: string; params?: any[] }>) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const results = [];
      for (const q of queries) {
        const [res] = await conn.execute(q.sql, q.params);
        results.push(res);
      }
      await conn.commit();
      return results;
    } catch (err) {
      await conn.rollback();
      console.error('❌ Transaction error:', err);
      throw err;
    } finally {
      conn.release();
    }
  },

  async getPoolStatus() {
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.execute('SHOW STATUS LIKE "Threads_connected"');
      conn.release();
      const rowsTyped = rows as Array<{ Variable_name: string; Value: string }>;
      return {
        threadsConnected: rowsTyped?.[0]?.Value || 0,
        poolConfig: {
          connectionLimit: dbConfig.connectionLimit,
          acquireTimeout: dbConfig.acquireTimeout
        }
      };
    } catch (error) {
      console.error('❌ Pool status error:', error);
      return null;
    }
  },

  async healthCheck() {
    try {
      const conn = await pool.getConnection();
      await conn.execute('SELECT 1');
      conn.release();
      return { healthy: true, timestamp: new Date().toISOString() };
    } catch (err: any) {
      return { healthy: false, error: err.message, timestamp: new Date().toISOString() };
    }
  },

  async close() {
    console.log('🧹 Closing pool...');
    await pool.end();
  }
};

export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.execute('SELECT 1');
    conn.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(`⚠️ ${signal} received. Cleaning up...`);
  await db.close();
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default db;
