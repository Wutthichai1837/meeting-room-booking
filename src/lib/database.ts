import mysql from 'mysql2/promise';

// Database configuration with improved connection management
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sitc_meeting_booking',
  waitForConnections: true,
  connectionLimit: 20,           // Increased from 10
  queueLimit: 0,
  acquireTimeout: 60000,         // 60 seconds timeout for getting connection
  timeout: 60000,                // 60 seconds query timeout
  reconnect: true,
  charset: 'utf8mb4',
  timezone: '+07:00',            // Thailand timezone
  // Additional connection management settings
  idleTimeout: 600000,           // 10 minutes idle timeout
  maxIdle: 10,                   // Maximum idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Add connection pool event listeners for monitoring
pool.on('connection', (connection) => {
  console.log('📊 New DB connection established:', connection.threadId);
});

pool.on('acquire', (connection) => {
  console.log('🔄 Connection acquired:', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('✅ Connection released:', connection.threadId);
});

pool.on('error', (error) => {
  console.error('❌ Database pool error:', error);
});

// Database connection wrapper with improved error handling
export const db = {
  // Execute query with parameters
  async query(sql: string, params?: any[]) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      
      // Check if it's a connection error and retry once
      if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'ECONNRESET') {
        console.log('🔄 Retrying database query due to connection error...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        try {
          connection = await pool.getConnection();
          const [results] = await connection.execute(sql, params);
          return results;
        } catch (retryError) {
          console.error('Database query retry failed:', retryError);
          throw retryError;
        } finally {
          if (connection) connection.release();
        }
      }
      
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  // Get single row with improved connection handling
  async queryRow(sql: string, params?: any[]) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.execute(sql, params);
      const rows = results as any[];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database query row error:', error);
      
      // Check if it's a connection error and retry once
      if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'ECONNRESET') {
        console.log('🔄 Retrying database queryRow due to connection error...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        try {
          connection = await pool.getConnection();
          const [results] = await connection.execute(sql, params);
          const rows = results as any[];
          return rows.length > 0 ? rows[0] : null;
        } catch (retryError) {
          console.error('Database queryRow retry failed:', retryError);
          throw retryError;
        } finally {
          if (connection) connection.release();
        }
      }
      
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  // Execute multiple queries in transaction
  async transaction(queries: Array<{ sql: string; params?: any[] }>) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const query of queries) {
        const [result] = await connection.execute(query.sql, query.params);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      console.error('Database transaction error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get connection pool status
  async getPoolStatus() {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
      connection.release();
      return {
        threadsConnected: rows[0]?.Value || 0,
        poolConfig: {
          connectionLimit: dbConfig.connectionLimit,
          acquireTimeout: dbConfig.acquireTimeout,
          timeout: dbConfig.timeout
        }
      };
    } catch (error) {
      console.error('Error getting pool status:', error);
      return null;
    }
  },

  // Health check
  async healthCheck() {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute('SELECT 1 as healthy');
      connection.release();
      return { healthy: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Database health check failed:', error);
      return { healthy: false, error: error.message, timestamp: new Date().toISOString() };
    }
  },

  // Close pool (for cleanup)
  async close() {
    console.log('🔒 Closing database connection pool...');
    await pool.end();
  }
};

// Test database connection with better error handling
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing database connections...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing database connections...');
  await db.close();
  process.exit(0);
});

export default db;
