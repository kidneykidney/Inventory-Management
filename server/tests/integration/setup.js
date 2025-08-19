const { 
  initTestDatabase, 
  resetDatabase, 
  seedTestData, 
  cleanupTestDatabase 
} = require('../../test-utils');

// Global setup for integration tests
beforeAll(async () => {
  // Initialize test database connection
  await initTestDatabase();
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.TEST_DB_NAME = 'inventory_test';
}, 30000);

beforeEach(async () => {
  // Reset database to clean state before each test
  await resetDatabase();
  
  // Seed with test data
  await seedTestData();
}, 10000);

afterAll(async () => {
  // Clean up database connections
  await cleanupTestDatabase();
}, 10000);

// Suppress console logs during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
}