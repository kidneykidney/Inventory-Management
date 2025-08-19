/**
 * Admin Panel API Tests
 * Unit tests for admin panel backend functionality
 */

const request = require('supertest');
const express = require('express');
const { User } = require('../models/userModels');
const { LendingProduct, LendingTransaction } = require('../models/lendingModels');
const { SystemConfiguration, AdminActivityLog, BulkOperation } = require('../models/adminModels');
const adminRoutes = require('../routes/admin');
const { generateToken, authenticateToken, requireAdmin } = require('../middleware/auth');

// Mock dependencies
jest.mock('../models/userModels');
jest.mock('../models/lendingModels');
jest.mock('../models/adminModels');
jest.mock('../utils/logger');
jest.mock('../middleware/auth');
jest.mock('../config/database');

const app = express();
app.use(express.json());
app.use('/api/v1/admin', adminRoutes);

describe('Admin Panel API', () => {
  let adminToken;
  let userToken;
  let mockAdmin;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock admin user
    mockAdmin = {
      id: 'admin-123',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      toJSON: () => ({
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active'
      })
    };

    // Mock regular user
    mockUser = {
      id: 'user-123',
      email: 'user@test.com',
      name: 'Regular User',
      role: 'user',
      status: 'active',
      toJSON: () => ({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
        status: 'active'
      })
    };

    adminToken = 'mock-admin-token';
    userToken = 'mock-user-token';

    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const token = authHeader.split(' ')[1];
      if (token === 'mock-admin-token') {
        req.user = mockAdmin;
        req.token = token;
      } else if (token === 'mock-user-token') {
        req.user = mockUser;
        req.token = token;
      } else {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      next();
    });

    // Mock admin role requirement
    requireAdmin.mockImplementation((req, res, next) => {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }
      next();
    });

    // Mock User.findById for authentication
    User.findById.mockImplementation((id) => {
      if (id === 'admin-123') return Promise.resolve(mockAdmin);
      if (id === 'user-123') return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe('GET /api/v1/admin/dashboard', () => {
    it('should return dashboard data for admin', async () => {
      const mockUserStats = {
        total: 100,
        active: 95,
        admins: 5,
        recentRegistrations: 10
      };

      const mockProductStats = {
        overview: {
          total_products: 500,
          available_products: 450,
          unavailable_products: 50,
          total_categories: 10,
          total_brands: 25
        },
        byCategory: [],
        byCondition: []
      };

      const mockLendingStats = {
        overview: {
          total_transactions: 1000,
          active_transactions: 150,
          overdue_transactions: 10,
          returned_transactions: 840,
          avg_lending_period: 25
        },
        monthly: [],
        popularProducts: []
      };

      User.getStats.mockResolvedValue(mockUserStats);
      LendingProduct.getStatistics.mockResolvedValue(mockProductStats);
      LendingTransaction.getStatistics.mockResolvedValue(mockLendingStats);
      LendingTransaction.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('userStats');
      expect(response.body.data).toHaveProperty('productStats');
      expect(response.body.data).toHaveProperty('lendingStats');
      expect(response.body.data.overview.totalUsers).toBe(100);
      expect(response.body.data.overview.totalProducts).toBe(500);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com', role: 'user' },
        { id: '2', name: 'User 2', email: 'user2@test.com', role: 'user' }
      ];

      const mockResult = {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      };

      User.findAll.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsers);
      expect(response.body.pagination).toEqual(mockResult.pagination);
      expect(User.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        role: undefined,
        status: undefined,
        search: undefined
      });
    });

    it('should handle filtering parameters', async () => {
      User.findAll.mockResolvedValue({ users: [], pagination: {} });

      await request(app)
        .get('/api/v1/admin/users?role=admin&status=active&search=test&page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(User.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        role: 'admin',
        status: 'active',
        search: 'test'
      });
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?page=0&limit=200&role=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/v1/admin/users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        role: 'admin',
        status: 'active'
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
        toJSON: () => ({ ...mockUser, ...updateData })
      };

      User.findByEmail.mockResolvedValue(null);
      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/v1/admin/users/user-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(User.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should prevent admin from changing their own role', async () => {
      const response = await request(app)
        .put('/api/v1/admin/users/admin-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot change your own role');
    });

    it('should check for email conflicts', async () => {
      const existingUser = { id: 'other-user', email: 'existing@test.com' };
      User.findByEmail.mockResolvedValue(existingUser);

      const response = await request(app)
        .put('/api/v1/admin/users/user-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'existing@test.com' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already in use');
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .put('/api/v1/admin/users/user-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
          email: 'invalid-email',
          role: 'invalid-role'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/v1/admin/users/:id', () => {
    it('should delete user successfully', async () => {
      LendingTransaction.findAll.mockResolvedValue([]);
      User.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/v1/admin/users/user-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deactivated successfully');
      expect(User.delete).toHaveBeenCalledWith('user-123');
    });

    it('should prevent admin from deleting their own account', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/users/admin-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete your own account');
    });

    it('should prevent deletion of users with active transactions', async () => {
      const activeTransactions = [{ id: 'transaction-1', status: 'active' }];
      LendingTransaction.findAll.mockResolvedValue(activeTransactions);

      const response = await request(app)
        .delete('/api/v1/admin/users/user-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete user with active lending transactions');
    });
  });

  describe('GET /api/v1/admin/products', () => {
    it('should return paginated products list', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', brand: 'Brand A' },
        { id: '2', name: 'Product 2', brand: 'Brand B' }
      ];

      LendingProduct.findAll.mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce(mockProducts); // For total count

      const response = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProducts);
      expect(response.body.pagination).toBeDefined();
    });

    it('should handle filtering parameters', async () => {
      LendingProduct.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/products?categoryId=550e8400-e29b-41d4-a716-446655440000&brand=Apple&condition=excellent&isAvailable=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(LendingProduct.findAll).toHaveBeenCalledTimes(2); // Once for data, once for count
    });
  });

  describe('POST /api/v1/admin/products', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        categoryId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        brand: 'Apple',
        model: 'MacBook Pro'
      };

      const mockProduct = {
        id: 'product-123',
        ...productData,
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock the LendingProduct constructor
      jest.spyOn(LendingProduct.prototype, 'save').mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created successfully');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing name and categoryId'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/admin/products/bulk-import', () => {
    it('should handle bulk import successfully', async () => {
      const productsData = [
        { name: 'Product 1', categoryId: '550e8400-e29b-41d4-a716-446655440000' },
        { name: 'Product 2', categoryId: '550e8400-e29b-41d4-a716-446655440000' }
      ];

      // Mock successful saves
      jest.spyOn(LendingProduct.prototype, 'save').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/admin/products/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ products: productsData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should handle partial failures in bulk import', async () => {
      const productsData = [
        { name: 'Product 1', categoryId: '550e8400-e29b-41d4-a716-446655440000' },
        { name: 'Product 2', categoryId: '550e8400-e29b-41d4-a716-446655440000' }
      ];

      // Mock one success, one failure
      jest.spyOn(LendingProduct.prototype, 'save')
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Validation failed'));

      const response = await request(app)
        .post('/api/v1/admin/products/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ products: productsData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
    });

    it('should validate bulk import data', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          products: [
            { description: 'Missing name and categoryId' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/reports/lending-analytics', () => {
    it('should return comprehensive lending analytics', async () => {
      const mockLendingStats = {
        overview: { total_transactions: 1000 },
        monthly: [],
        popularProducts: []
      };

      const mockProductStats = {
        byCategory: [],
        byCondition: []
      };

      LendingTransaction.getStatistics.mockResolvedValue(mockLendingStats);
      LendingProduct.getStatistics.mockResolvedValue(mockProductStats);
      LendingTransaction.getOverdueTransactions.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/reports/lending-analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('lendingOverview');
      expect(response.body.data).toHaveProperty('monthlyTrends');
      expect(response.body.data).toHaveProperty('popularProducts');
      expect(response.body.data).toHaveProperty('productDistribution');
      expect(response.body.data).toHaveProperty('overdueAnalysis');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      User.getStats.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error loading dashboard data');
    });

    it('should handle invalid UUIDs in parameters', async () => {
      // Mock User.update to throw an error for invalid UUID
      User.update.mockRejectedValue(new Error('Invalid UUID format'));

      const response = await request(app)
        .put('/api/v1/admin/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(500);
    });
  });
});

describe('Admin Models', () => {
  // Import the actual models for testing (not mocked)
  const actualAdminModels = jest.requireActual('../models/adminModels');
  const { SystemConfiguration: ActualSystemConfiguration, AdminActivityLog: ActualAdminActivityLog, BulkOperation: ActualBulkOperation } = actualAdminModels;

  describe('SystemConfiguration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should parse values correctly based on data type', () => {
      expect(ActualSystemConfiguration.parseValue('123', 'number')).toBe(123);
      expect(ActualSystemConfiguration.parseValue('true', 'boolean')).toBe(true);
      expect(ActualSystemConfiguration.parseValue('false', 'boolean')).toBe(false);
      expect(ActualSystemConfiguration.parseValue('{"key": "value"}', 'json')).toEqual({ key: 'value' });
      expect(ActualSystemConfiguration.parseValue('string value', 'string')).toBe('string value');
    });

    it('should serialize values correctly based on data type', () => {
      expect(ActualSystemConfiguration.serializeValue(123, 'number')).toBe('123');
      expect(ActualSystemConfiguration.serializeValue(true, 'boolean')).toBe('true');
      expect(ActualSystemConfiguration.serializeValue(false, 'boolean')).toBe('false');
      expect(ActualSystemConfiguration.serializeValue({ key: 'value' }, 'json')).toBe('{"key":"value"}');
      expect(ActualSystemConfiguration.serializeValue('string value', 'string')).toBe('string value');
    });
  });

  describe('AdminActivityLog', () => {
    it('should create log entry with correct structure', () => {
      const logData = {
        adminId: 'admin-123',
        action: 'CREATE_PRODUCT',
        resourceType: 'product',
        resourceId: 'product-123',
        details: { name: 'Test Product' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const log = new ActualAdminActivityLog(logData);

      expect(log.adminId).toBe('admin-123');
      expect(log.action).toBe('CREATE_PRODUCT');
      expect(log.resourceType).toBe('product');
      expect(log.resourceId).toBe('product-123');
      expect(log.details).toEqual({ name: 'Test Product' });
      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0');
      expect(log.id).toBeDefined();
    });
  });

  describe('BulkOperation', () => {
    it('should calculate progress percentage correctly', () => {
      const operation = new ActualBulkOperation({
        totalItems: 100,
        processedItems: 25
      });

      expect(operation.getProgressPercentage()).toBe(25);
    });

    it('should handle zero total items', () => {
      const operation = new ActualBulkOperation({
        totalItems: 0,
        processedItems: 0
      });

      expect(operation.getProgressPercentage()).toBe(0);
    });

    it('should identify complete operations', () => {
      const completedOperation = new ActualBulkOperation({ status: 'completed' });
      const failedOperation = new ActualBulkOperation({ status: 'failed' });
      const processingOperation = new ActualBulkOperation({ status: 'processing' });

      expect(completedOperation.isComplete()).toBe(true);
      expect(failedOperation.isComplete()).toBe(true);
      expect(processingOperation.isComplete()).toBe(false);
    });
  });
});