const { LendingTransaction } = require('../lendingModels');
const { pool } = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  pool: {
    getConnection: jest.fn(),
  },
  monitoredQuery: jest.fn(),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('LendingTransaction Model', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a transaction with default values', () => {
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
      });

      expect(transaction.productId).toBe('product-123');
      expect(transaction.borrowerId).toBe(1);
      expect(transaction.status).toBe('active');
      expect(transaction.conditionLent).toBe('good');
      expect(transaction.id).toBeDefined();
    });

    it('should calculate due date as 1 month from lend date', () => {
      const lendDate = new Date('2024-01-15');
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
        lendDate: lendDate,
      });

      const expectedDueDate = new Date('2024-02-15');
      expect(transaction.dueDate.getTime()).toBe(expectedDueDate.getTime());
    });

    it('should handle snake_case database fields', () => {
      const transaction = new LendingTransaction({
        product_id: 'product-123',
        borrower_id: 1,
        lend_date: new Date('2024-01-15'),
        condition_lent: 'excellent',
      });

      expect(transaction.productId).toBe('product-123');
      expect(transaction.borrowerId).toBe(1);
      expect(transaction.conditionLent).toBe('excellent');
    });
  });

  describe('calculateDueDate', () => {
    it('should add exactly one month to the lend date', () => {
      const transaction = new LendingTransaction({});
      const lendDate = new Date('2024-01-15');
      const dueDate = transaction.calculateDueDate(lendDate);

      expect(dueDate.getFullYear()).toBe(2024);
      expect(dueDate.getMonth()).toBe(1); // February (0-indexed)
      expect(dueDate.getDate()).toBe(15);
    });

    it('should handle month overflow correctly', () => {
      const transaction = new LendingTransaction({});
      const lendDate = new Date('2024-12-15');
      const dueDate = transaction.calculateDueDate(lendDate);

      expect(dueDate.getFullYear()).toBe(2025);
      expect(dueDate.getMonth()).toBe(0); // January (0-indexed)
      expect(dueDate.getDate()).toBe(15);
    });
  });

  describe('isOverdue', () => {
    it('should return false for returned items', () => {
      const transaction = new LendingTransaction({
        status: 'returned',
        dueDate: new Date('2024-01-01'), // Past date
      });

      expect(transaction.isOverdue()).toBe(false);
    });

    it('should return false for items with return date', () => {
      const transaction = new LendingTransaction({
        status: 'active',
        dueDate: new Date('2024-01-01'), // Past date
        returnDate: new Date('2024-01-02'),
      });

      expect(transaction.isOverdue()).toBe(false);
    });

    it('should return true for active items past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const transaction = new LendingTransaction({
        status: 'active',
        dueDate: pastDate,
      });

      expect(transaction.isOverdue()).toBe(true);
    });

    it('should return false for active items not yet due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const transaction = new LendingTransaction({
        status: 'active',
        dueDate: futureDate,
      });

      expect(transaction.isOverdue()).toBe(false);
    });
  });

  describe('getDaysUntilDue', () => {
    it('should return positive number for future due dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const transaction = new LendingTransaction({
        dueDate: futureDate,
      });

      expect(transaction.getDaysUntilDue()).toBe(5);
    });

    it('should return negative number for past due dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const transaction = new LendingTransaction({
        dueDate: pastDate,
      });

      expect(transaction.getDaysUntilDue()).toBe(-3);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid transaction', () => {
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
        lendDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'active',
        conditionLent: 'good',
      });

      const result = transaction.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const transaction = new LendingTransaction({});

      const result = transaction.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product ID is required');
      expect(result.errors).toContain('Borrower ID is required');
    });

    it('should fail validation for invalid status', () => {
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
        status: 'invalid-status',
      });

      const result = transaction.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status');
    });

    it('should fail validation for invalid condition', () => {
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
        conditionLent: 'invalid-condition',
      });

      const result = transaction.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid condition lent');
    });

    it('should fail validation when due date is before lend date', () => {
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
        lendDate: new Date('2024-02-15'),
        dueDate: new Date('2024-01-15'),
      });

      const result = transaction.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Due date must be after lend date');
    });

    it('should fail validation when return date is before lend date', () => {
      const transaction = new LendingTransaction({
        productId: 'product-123',
        borrowerId: 1,
        lendDate: new Date('2024-02-15'),
        returnDate: new Date('2024-01-15'),
      });

      const result = transaction.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Return date cannot be before lend date');
    });
  });

  describe('checkAvailability', () => {
    const { monitoredQuery } = require('../../config/database');

    it('should return true for available product with no active transactions', async () => {
      monitoredQuery
        .mockResolvedValueOnce([[{ is_available: true }]]) // Product exists and available
        .mockResolvedValueOnce([[]]); // No active transactions

      const result = await LendingTransaction.checkAvailability('product-123');
      expect(result).toBe(true);
    });

    it('should return false for unavailable product', async () => {
      monitoredQuery.mockResolvedValueOnce([[{ is_available: false }]]);

      const result = await LendingTransaction.checkAvailability('product-123');
      expect(result).toBe(false);
    });

    it('should return false for product with active transactions', async () => {
      monitoredQuery
        .mockResolvedValueOnce([[{ is_available: true }]]) // Product available
        .mockResolvedValueOnce([[{ id: 'transaction-123' }]]); // Has active transaction

      const result = await LendingTransaction.checkAvailability('product-123');
      expect(result).toBe(false);
    });

    it('should throw error for non-existent product', async () => {
      monitoredQuery.mockResolvedValueOnce([[]]); // Product not found

      await expect(
        LendingTransaction.checkAvailability('non-existent')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('processReturn', () => {
    it('should process return successfully', async () => {
      const transaction = new LendingTransaction({
        id: 'transaction-123',
        productId: 'product-123',
        status: 'active',
      });

      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const returnData = {
        conditionReturned: 'good',
        notes: 'Returned in good condition',
      };

      const result = await transaction.processReturn(returnData);

      expect(result.status).toBe('returned');
      expect(result.conditionReturned).toBe('good');
      expect(result.returnDate).toBeDefined();
      expect(mockConnection.execute).toHaveBeenCalledTimes(2); // Update transaction and product
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should update product condition when returned damaged', async () => {
      const transaction = new LendingTransaction({
        id: 'transaction-123',
        productId: 'product-123',
        status: 'active',
      });

      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const returnData = {
        conditionReturned: 'damaged',
        notes: 'Item was damaged',
      };

      await transaction.processReturn(returnData);

      // Should call execute 3 times: update transaction, update availability, update condition
      expect(mockConnection.execute).toHaveBeenCalledTimes(3);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE lending_products SET condition_status = ? WHERE id = ?',
        ['needs_repair', 'product-123']
      );
    });

    it('should throw error for already returned item', async () => {
      const transaction = new LendingTransaction({
        status: 'returned',
      });

      await expect(transaction.processReturn({})).rejects.toThrow(
        'Item has already been returned'
      );
    });

    it('should rollback on database error', async () => {
      const transaction = new LendingTransaction({
        id: 'transaction-123',
        productId: 'product-123',
        status: 'active',
      });

      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      await expect(transaction.processReturn({})).rejects.toThrow(
        'Database error'
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('updateOverdueStatuses', () => {
    const { monitoredQuery } = require('../../config/database');

    it('should update overdue transactions and return count', async () => {
      monitoredQuery.mockResolvedValue([{ affectedRows: 5 }]);

      const result = await LendingTransaction.updateOverdueStatuses();

      expect(result).toBe(5);
      expect(monitoredQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE lending_transactions')
      );
    });
  });
});
