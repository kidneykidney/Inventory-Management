const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || '',
  database: process.env.TEST_DB_NAME || 'inventory_test',
  multipleStatements: true,
};

// Database connection pool for tests
let testPool;

// Initialize test database
const initTestDatabase = async () => {
  if (!testPool) {
    testPool = mysql.createPool(testDbConfig);
  }
  return testPool;
};

// Clean up test database
const cleanupTestDatabase = async () => {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
};

// Reset database to clean state
const resetDatabase = async () => {
  const pool = await initTestDatabase();
  
  // Drop all tables
  const dropTables = `
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS sprint_stories;
    DROP TABLE IF EXISTS user_stories;
    DROP TABLE IF EXISTS epics;
    DROP TABLE IF EXISTS sprints;
    DROP TABLE IF EXISTS users;
    SET FOREIGN_KEY_CHECKS = 1;
  `;
  
  await pool.execute(dropTables);
  
  // Run migrations
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = await fs.readdir(migrationsDir);
  
  for (const file of migrationFiles.sort()) {
    if (file.endsWith('.sql')) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = await fs.readFile(migrationPath, 'utf8');
      await pool.execute(migration);
    }
  }
};

// Seed test data
const seedTestData = async () => {
  const pool = await initTestDatabase();
  
  // Insert test epics
  await pool.execute(`
    INSERT INTO epics (id, title, description, business_value, status, priority, created_at, updated_at)
    VALUES 
    ('epic-1', 'User Authentication System', 'Complete user authentication with login, registration, and password reset', 'Enables secure user access to the system', 'planned', 'high', NOW(), NOW()),
    ('epic-2', 'Product Management', 'Comprehensive product catalog and management system', 'Allows efficient product management and organization', 'in-progress', 'medium', NOW(), NOW())
  `);
  
  // Insert test user stories
  await pool.execute(`
    INSERT INTO user_stories (id, title, description, acceptance_criteria, story_points, priority, status, epic_id, created_at, updated_at)
    VALUES 
    ('story-1', 'User Registration', 'As a new user, I want to register an account, so that I can access the system', '["WHEN user provides valid email and password THEN account is created", "WHEN user provides invalid email THEN validation error is shown"]', 5, 'high', 'backlog', 'epic-1', NOW(), NOW()),
    ('story-2', 'User Login', 'As a registered user, I want to login to my account, so that I can access my data', '["WHEN user provides correct credentials THEN they are logged in", "WHEN user provides incorrect credentials THEN error is shown"]', 3, 'high', 'in-progress', 'epic-1', NOW(), NOW()),
    ('story-3', 'Product Creation', 'As an admin, I want to create new products, so that I can manage inventory', '["WHEN admin provides valid product data THEN product is created", "WHEN admin provides invalid data THEN validation errors are shown"]', 8, 'medium', 'backlog', 'epic-2', NOW(), NOW())
  `);
  
  // Insert test sprints
  await pool.execute(`
    INSERT INTO sprints (id, number, start_date, end_date, goal, status, capacity, velocity, created_at, updated_at)
    VALUES 
    ('sprint-1', 1, '2024-01-01', '2024-01-14', 'Complete user authentication foundation', 'completed', 40, 35, NOW(), NOW()),
    ('sprint-2', 2, '2024-01-15', '2024-01-28', 'Implement product management basics', 'active', 40, 0, NOW(), NOW())
  `);
  
  // Insert test users
  await pool.execute(`
    INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
    VALUES 
    ('user-1', 'testuser', 'test@example.com', '$2b$10$hash', 'user', NOW(), NOW()),
    ('user-2', 'admin', 'admin@example.com', '$2b$10$hash', 'admin', NOW(), NOW())
  `);
};

// Mock data factories
const createMockEpic = (overrides = {}) => ({
  id: 'epic-test',
  title: 'Test Epic',
  description: 'Test epic description that meets minimum length requirements for validation',
  business_value: 'Provides significant business value to users and stakeholders',
  status: 'planned',
  priority: 'high',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createMockUserStory = (overrides = {}) => ({
  id: 'story-test',
  title: 'Test User Story',
  description: 'As a user, I want to test functionality, so that I can verify it works correctly',
  acceptance_criteria: JSON.stringify([
    'WHEN user performs action THEN system responds correctly',
    'GIVEN valid input WHEN user submits THEN data is saved successfully',
  ]),
  story_points: 5,
  priority: 'high',
  status: 'backlog',
  epic_id: 'epic-test',
  assignee: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createMockSprint = (overrides = {}) => ({
  id: 'sprint-test',
  number: 1,
  start_date: '2024-01-01',
  end_date: '2024-01-14',
  goal: 'Complete user authentication and basic functionality testing',
  status: 'planning',
  capacity: 40,
  velocity: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'user-test',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: '$2b$10$testhash',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Database query helpers
const executeQuery = async (query, params = []) => {
  const pool = await initTestDatabase();
  const [rows] = await pool.execute(query, params);
  return rows;
};

const insertTestData = async (table, data) => {
  const pool = await initTestDatabase();
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);
  
  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  const [result] = await pool.execute(query, values);
  return result;
};

const findTestData = async (table, conditions = {}) => {
  const pool = await initTestDatabase();
  let query = `SELECT * FROM ${table}`;
  const params = [];
  
  if (Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    query += ` WHERE ${whereClause}`;
    params.push(...Object.values(conditions));
  }
  
  const [rows] = await pool.execute(query, params);
  return rows;
};

const deleteTestData = async (table, conditions = {}) => {
  const pool = await initTestDatabase();
  let query = `DELETE FROM ${table}`;
  const params = [];
  
  if (Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    query += ` WHERE ${whereClause}`;
    params.push(...Object.values(conditions));
  }
  
  const [result] = await pool.execute(query, params);
  return result;
};

// Test environment helpers
const isTestEnvironment = () => process.env.NODE_ENV === 'test';

const requireTestEnvironment = () => {
  if (!isTestEnvironment()) {
    throw new Error('This function can only be called in test environment');
  }
};

module.exports = {
  // Database management
  initTestDatabase,
  cleanupTestDatabase,
  resetDatabase,
  seedTestData,
  
  // Mock data factories
  createMockEpic,
  createMockUserStory,
  createMockSprint,
  createMockUser,
  
  // Database helpers
  executeQuery,
  insertTestData,
  findTestData,
  deleteTestData,
  
  // Environment helpers
  isTestEnvironment,
  requireTestEnvironment,
  
  // Test configuration
  testDbConfig,
};