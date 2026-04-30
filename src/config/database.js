import { Pool } from 'pg';

/**
 * Database Configuration for VRF System
 */
export const DATABASE_CONFIG = {
  // PostgreSQL connection configuration
  POSTGRES: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'casino_vrf',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    
    // Query timeout
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
  },

  // Redis configuration (for caching)
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    
    // Connection settings
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    lazyConnect: true,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    
    // Key prefixes
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'vrf:',
  },

  // Migration settings
  MIGRATIONS: {
    directory: './database/migrations',
    tableName: 'vrf_migrations',
  },
};

/**
 * PostgreSQL Connection Pool
 */
class DatabasePool {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      if (this.pool) {
        console.log('📊 Database pool already initialized');
        return this.pool;
      }

      console.log('📊 Initializing database connection pool...');

      this.pool = new Pool({
        ...DATABASE_CONFIG.POSTGRES,
        // Connection event handlers
        onConnect: (client) => {
          console.log('🔗 New database client connected');
        },
        onError: (err, client) => {
          console.error('❌ Database client error:', err);
        },
      });

      // Test the connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      client.release();

      console.log('✅ Database connected successfully');
      console.log('📊 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
      console.log('🕐 Server time:', result.rows[0].current_time);

      this.isConnected = true;
      return this.pool;

    } catch (error) {
      console.error('❌ Failed to initialize database pool:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Get database pool instance
   */
  getPool() {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query with automatic connection handling
   */
  async query(text, params = []) {
    const pool = this.getPool();
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`🐌 Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Database query error:', {
        query: text.substring(0, 100),
        params: params.length > 0 ? '[PARAMS]' : 'none',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const pool = this.getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database health
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return {
        healthy: true,
        timestamp: new Date().toISOString(),
        response_time: 'fast'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get connection pool stats
   */
  getPoolStats() {
    if (!this.pool) {
      return { error: 'Pool not initialized' };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: DATABASE_CONFIG.POSTGRES.max,
      isConnected: this.isConnected
    };
  }

  /**
   * Close database connections
   */
  async close() {
    if (this.pool) {
      console.log('🔌 Closing database connections...');
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ Database connections closed');
    }
  }
}

/**
 * Redis Cache Connection
 */
class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Only initialize if Redis is configured
      if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
        console.log('⚠️ Redis not configured, skipping cache initialization');
        return null;
      }

      console.log('🔴 Initializing Redis cache...');

      // Dynamic import to avoid issues if Redis is not available
      const { Redis } = await import('ioredis');
      
      this.client = new Redis({
        ...DATABASE_CONFIG.REDIS,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Event handlers
      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔴 Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
      
      return this.client;

    } catch (error) {
      console.warn('⚠️ Redis initialization failed:', error.message);
      console.log('📊 Continuing without cache...');
      return null;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    if (!this.client || !this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('⚠️ Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set cache value
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('⚠️ Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete cache value
   */
  async del(key) {
    if (!this.client || !this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn('⚠️ Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      console.log('🔴 Closing Redis connection...');
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instances
export const dbPool = new DatabasePool();
export const redisCache = new RedisCache();

/**
 * Initialize all database connections
 */
export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database connections...');
    
    // Initialize PostgreSQL
    await dbPool.initialize();
    
    // Initialize Redis (optional)
    await redisCache.initialize();
    
    console.log('✅ Database initialization complete');
    
    return {
      postgres: dbPool,
      redis: redisCache
    };

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections() {
  try {
    console.log('🔌 Closing all database connections...');
    
    await Promise.all([
      dbPool.close(),
      redisCache.close()
    ]);
    
    console.log('✅ All database connections closed');
    
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
}

/**
 * Database health check
 */
export async function databaseHealthCheck() {
  const health = {
    postgres: await dbPool.healthCheck(),
    redis: {
      healthy: redisCache.isConnected,
      timestamp: new Date().toISOString()
    },
    overall: true
  };

  health.overall = health.postgres.healthy;
  
  return health;
}

export default {
  DATABASE_CONFIG,
  dbPool,
  redisCache,
  initializeDatabase,
  closeDatabaseConnections,
  databaseHealthCheck
};