import mysql, { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Connection pool config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sitc_meeting_booking',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 60000, 
  charset: 'utf8mb4',
  timezone: '+07:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Event listeners (optional in production; can be disabled for silence)
if (process.env.NODE_ENV !== 'production') {
  pool.on('connection', (conn: PoolConnection) => console.log('📊 New DB connection:', conn.threadId));
  pool.on('acquire', (conn: PoolConnection) => console.log('🔄 Connection acquired:', conn.threadId));
  pool.on('release', (conn: PoolConnection) => console.log('✅ Connection released:', conn.threadId));
  (pool as any).on('error', (err: Error) => console.error('❌ Pool error:', err));
}

export const db = {
  async query<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: unknown[]
  ): Promise<T> {
    let conn: PoolConnection | undefined;
    try {
      conn = await pool.getConnection();
      const [results] = await conn.execute<T>(sql, params);
      return results;
    } catch (error) {
      console.error('❌ Query error:', error);
      throw error;
    } finally {
      conn?.release();
    }
  },

  async queryRow<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<RowDataPacket[]>(sql, params);
    return results.length ? (results[0] as T) : null;
  },

  async transaction(queries: Array<{ sql: string; params?: unknown[] }>): Promise<unknown[]> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const results: unknown[] = [];
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

  async getPoolStatus(): Promise<{
    threadsConnected: string | number;
    poolConfig: { connectionLimit: number; connectTimeout: number };
  } | null> {
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.execute<RowDataPacket[]>('SHOW STATUS LIKE "Threads_connected"');
      conn.release();
      return {
        threadsConnected: rows?.[0]?.Value || 0,
        poolConfig: {
          connectionLimit: dbConfig.connectionLimit,
          connectTimeout: dbConfig.connectTimeout,
        },
      };
    } catch (error) {
      console.error('❌ Pool status error:', error);
      return null;
    }
  },

  async healthCheck(): Promise<{
    healthy: boolean;
    error?: string;
    timestamp: string;
  }> {
    try {
      const conn = await pool.getConnection();
      await conn.execute('SELECT 1');
      conn.release();
      return { healthy: true, timestamp: new Date().toISOString() };
    } catch (err) {
      const error = err as Error;
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async close(): Promise<void> {
    console.log('🧹 Closing pool...');
    await pool.end();
  },
};

export async function testConnection(): Promise<boolean> {
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
