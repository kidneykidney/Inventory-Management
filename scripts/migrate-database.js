#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_management',
    multipleStatements: true
};

async function createMigrationsTable(connection) {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64) NOT NULL
        )
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Migrations table ready');
}

async function getExecutedMigrations(connection) {
    const [rows] = await connection.execute('SELECT filename FROM migrations ORDER BY id');
    return rows.map(row => row.filename);
}

function calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function executeMigration(connection, migrationFile, content) {
    const checksum = calculateChecksum(content);
    
    try {
        // Execute the migration
        await connection.query(content);
        
        // Record the migration
        await connection.execute(
            'INSERT INTO migrations (filename, checksum) VALUES (?, ?)',
            [migrationFile, checksum]
        );
        
        console.log(`✅ Executed migration: ${migrationFile}`);
    } catch (error) {
        console.error(`❌ Failed to execute migration ${migrationFile}:`, error.message);
        throw error;
    }
}

async function rollbackMigration(connection, migrationFile) {
    const rollbackFile = migrationFile.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(__dirname, '..', 'server', 'migrations', rollbackFile);
    
    if (fs.existsSync(rollbackPath)) {
        const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
        
        try {
            await connection.query(rollbackContent);
            await connection.execute('DELETE FROM migrations WHERE filename = ?', [migrationFile]);
            console.log(`✅ Rolled back migration: ${migrationFile}`);
        } catch (error) {
            console.error(`❌ Failed to rollback migration ${migrationFile}:`, error.message);
            throw error;
        }
    } else {
        console.warn(`⚠️  No rollback file found for ${migrationFile}`);
    }
}

async function runMigrations() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        await createMigrationsTable(connection);
        
        const migrationsDir = path.join(__dirname, '..', 'server', 'migrations');
        
        if (!fs.existsSync(migrationsDir)) {
            console.log('📁 Creating migrations directory...');
            fs.mkdirSync(migrationsDir, { recursive: true });
        }
        
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql') && !file.includes('.rollback.'))
            .sort();
        
        const executedMigrations = await getExecutedMigrations(connection);
        
        const pendingMigrations = migrationFiles.filter(file => 
            !executedMigrations.includes(file)
        );
        
        if (pendingMigrations.length === 0) {
            console.log('✅ No pending migrations');
            return;
        }
        
        console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`);
        
        for (const migrationFile of pendingMigrations) {
            const migrationPath = path.join(migrationsDir, migrationFile);
            const content = fs.readFileSync(migrationPath, 'utf8');
            
            console.log(`🔄 Executing migration: ${migrationFile}`);
            await executeMigration(connection, migrationFile, content);
        }
        
        console.log('🎉 All migrations completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function rollbackLastMigration() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        const [rows] = await connection.execute(
            'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
        );
        
        if (rows.length === 0) {
            console.log('ℹ️  No migrations to rollback');
            return;
        }
        
        const lastMigration = rows[0].filename;
        console.log(`🔄 Rolling back migration: ${lastMigration}`);
        
        await rollbackMigration(connection, lastMigration);
        
        console.log('✅ Rollback completed successfully!');
        
    } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'up':
    case undefined:
        runMigrations();
        break;
    case 'rollback':
        rollbackLastMigration();
        break;
    case 'status':
        showMigrationStatus();
        break;
    default:
        console.log('Usage: node migrate-database.js [up|rollback|status]');
        process.exit(1);
}

async function showMigrationStatus() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        await createMigrationsTable(connection);
        
        const migrationsDir = path.join(__dirname, '..', 'server', 'migrations');
        const migrationFiles = fs.existsSync(migrationsDir) 
            ? fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql') && !file.includes('.rollback.'))
                .sort()
            : [];
        
        const executedMigrations = await getExecutedMigrations(connection);
        
        console.log('\n📋 Migration Status:');
        console.log('='.repeat(50));
        
        if (migrationFiles.length === 0) {
            console.log('No migration files found');
            return;
        }
        
        migrationFiles.forEach(file => {
            const status = executedMigrations.includes(file) ? '✅ Executed' : '⏳ Pending';
            console.log(`${status} ${file}`);
        });
        
        console.log('='.repeat(50));
        console.log(`Total: ${migrationFiles.length} migrations`);
        console.log(`Executed: ${executedMigrations.length}`);
        console.log(`Pending: ${migrationFiles.length - executedMigrations.length}`);
        
    } catch (error) {
        console.error('❌ Failed to show migration status:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}