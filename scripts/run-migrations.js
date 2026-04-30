const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Database Migration Runner
 * Runs SQL migration files in order
 */
class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'casino_vrf',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    this.migrationsDir = path.join(__dirname, '../database/migrations');
    this.migrationsTable = 'vrf_migrations';
  }

  /**
   * Initialize migrations table
   */
  async initializeMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL
      );
    `;

    try {
      await this.pool.query(createTableSQL);
      console.log(`✅ Migrations table '${this.migrationsTable}' ready`);
    } catch (error) {
      console.error('❌ Failed to create migrations table:', error);
      throw error;
    }
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await this.pool.query(
        `SELECT filename, checksum FROM ${this.migrationsTable} ORDER BY id`
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error);
      throw error;
    }
  }

  /**
   * Get list of migration files
   */
  getMigrationFiles() {
    try {
      if (!fs.existsSync(this.migrationsDir)) {
        console.log(`⚠️ Migrations directory not found: ${this.migrationsDir}`);
        return [];
      }

      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(filename => {
        const filepath = path.join(this.migrationsDir, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const checksum = this.calculateChecksum(content);

        return {
          filename,
          filepath,
          content,
          checksum
        };
      });
    } catch (error) {
      console.error('❌ Failed to read migration files:', error);
      throw error;
    }
  }

  /**
   * Calculate checksum for migration content
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration) {
    const client = await this.pool.connect();
    
    try {
      console.log(`🔄 Executing migration: ${migration.filename}`);
      
      // Start transaction
      await client.query('BEGIN');
      
      // Execute migration SQL
      await client.query(migration.content);
      
      // Record migration as executed
      await client.query(
        `INSERT INTO ${this.migrationsTable} (filename, checksum) VALUES ($1, $2)`,
        [migration.filename, migration.checksum]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`✅ Migration completed: ${migration.filename}`);
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error(`❌ Migration failed: ${migration.filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    try {
      console.log('🚀 Starting database migrations...');
      
      // Initialize migrations table
      await this.initializeMigrationsTable();
      
      // Get executed migrations and available migration files
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles()
      ]);

      console.log(`📊 Found ${migrationFiles.length} migration files`);
      console.log(`📊 ${executedMigrations.length} migrations already executed`);

      // Check for checksum mismatches
      const executedMap = new Map(
        executedMigrations.map(m => [m.filename, m.checksum])
      );

      for (const migration of migrationFiles) {
        if (executedMap.has(migration.filename)) {
          const executedChecksum = executedMap.get(migration.filename);
          if (executedChecksum !== migration.checksum) {
            throw new Error(
              `Migration checksum mismatch for ${migration.filename}. ` +
              `This indicates the migration file has been modified after execution.`
            );
          }
        }
      }

      // Find pending migrations
      const executedFilenames = new Set(executedMigrations.map(m => m.filename));
      const pendingMigrations = migrationFiles.filter(
        migration => !executedFilenames.has(migration.filename)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations found. Database is up to date.');
        return;
      }

      console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

      // Execute pending migrations in order
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('✅ All migrations completed successfully!');

    } catch (error) {
      console.error('❌ Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration (dangerous - use with caution)
   */
  async rollbackLastMigration() {
    try {
      console.log('⚠️ Rolling back last migration...');
      
      // Get last executed migration
      const result = await this.pool.query(
        `SELECT filename FROM ${this.migrationsTable} ORDER BY id DESC LIMIT 1`
      );

      if (result.rows.length === 0) {
        console.log('ℹ️ No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0].filename;
      console.log(`🔄 Rolling back: ${lastMigration}`);

      // Remove from migrations table
      await this.pool.query(
        `DELETE FROM ${this.migrationsTable} WHERE filename = $1`,
        [lastMigration]
      );

      console.log(`⚠️ Migration ${lastMigration} rolled back from tracking table`);
      console.log('⚠️ WARNING: You must manually revert database changes!');
      console.log('⚠️ This only removes the migration from the tracking table.');

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Show migration status
   */
  async showStatus() {
    try {
      console.log('📊 Migration Status:');
      console.log('==================');

      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles()
      ]);

      const executedSet = new Set(executedMigrations.map(m => m.filename));

      migrationFiles.forEach(migration => {
        const status = executedSet.has(migration.filename) ? '✅ EXECUTED' : '⏳ PENDING';
        console.log(`${status} ${migration.filename}`);
      });

      console.log('==================');
      console.log(`Total migrations: ${migrationFiles.length}`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${migrationFiles.length - executedMigrations.length}`);

    } catch (error) {
      console.error('❌ Failed to show status:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

/**
 * Main execution
 */
async function main() {
  const runner = new MigrationRunner();
  
  try {
    const command = process.argv[2] || 'migrate';

    switch (command) {
      case 'migrate':
        await runner.runMigrations();
        break;
      
      case 'status':
        await runner.showStatus();
        break;
      
      case 'rollback':
        await runner.rollbackLastMigration();
        break;
      
      default:
        console.log('Usage: node run-migrations.js [migrate|status|rollback]');
        console.log('  migrate  - Run pending migrations (default)');
        console.log('  status   - Show migration status');
        console.log('  rollback - Rollback last migration (dangerous!)');
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;