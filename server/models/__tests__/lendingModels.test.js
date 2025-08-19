const { LendingProduct, ProductCategory } = require('../lendingModels');
const { pool } = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  pool: {
    getConnection: jest.fn(),
    execute: jest.fn()
  },
  monitoredQuery: jest.fn()
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

describe('LendingProduct Model', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    
    pool.getConnection.mockResolvedValue(mockConnection);
  });

  describe('Constructor', () => {
    it('should create a product with default values', () => {
      const productData = {
        name: 'Test Laptop',
        categoryId: 1
      };

      const product = new LendingProduct(productData);

      expect(product.id).toBe('test-uuid-123');
      expect(product.name).toBe('Test Laptop');
      expect(product.categoryId).toBe(1);
      expect(product.isAvailable).toBe(true);
      expect(product.maxLendingPeriod).toBe(30);
      expect(product.requiresApproval).toBe(false);
      expect(product.conditionStatus).toBe('good');
      expect(product.imageUrls).toEqual([]);
      expect(product.specifications).toEqual({});
      expect(product.tags).toEqual([]);
    });

    it('should handle snake_case properties from database', () => {
      const productData = {
        name: 'Test Monitor',
        category_id: 2,
        serial_number: 'SN123456',
        is_available: false,
        max_lending_period: 14,
        requires_approval: true,
        condition_status: 'excellent',
        image_urls: ['/image1.jpg', '/image2.jpg']
      };

      const product = new LendingProduct(productData);

      expect(product.categoryId).toBe(2);
      expect(product.serialNumber).toBe('SN123456');
      expect(product.isAvailable).toBe(false);
      expect(product.maxLendingPeriod).toBe(14);
      expect(product.requiresApproval).toBe(true);
      expect(product.conditionStatus).toBe('excellent');
      expect(product.imageUrls).toEqual(['/image1.jpg', '/image2.jpg']);
    });
  });

  describe('Validation', () => {
    it('should validate a valid product', () => {
      const product = new LendingProduct({
        name: 'Valid Product',
        categoryId: 1,
        brand: 'TestBrand',
        model: 'TestModel',
        serialNumber: 'SN123',
        location: 'Office A',
        conditionStatus: 'good',
        maxLendingPeriod: 30
      });

      const validation = product.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation for missing required fields', () => {
      const product = new LendingProduct({});

      const validation = product.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Product name is required');
      expect(validation.errors).toContain('Category is required');
    });

    it('should fail validation for invalid field lengths', () => {
      const product = new LendingProduct({
        name: 'a'.repeat(201), // Too long
        categoryId: 1,
        serialNumber: 'a'.repeat(101), // Too long
        brand: 'a'.repeat(101), // Too long
        model: 'a'.repeat(101), // Too long
        location: 'a'.repeat(101) // Too long
      });

      const validation = product.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Product name must be less than 200 characters');
      expect(validation.errors).toContain('Serial number must be less than 100 characters');
      expect(validation.errors).toContain('Brand must be less than 100 characters');
      expect(validation.errors).toContain('Model must be less than 100 characters');
      expect(validation.errors).toContain('Location must be less than 100 characters');
    });

    it('should fail validation for invalid condition status', () => {
      const product = new LendingProduct({
        name: 'Test Product',
        categoryId: 1,
        conditionStatus: 'invalid_status'
      });

      const validation = product.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid condition status');
    });

    it('should fail validation for invalid lending period', () => {
      const product1 = new LendingProduct({
        name: 'Test Product',
        categoryId: 1,
        maxLendingPeriod: 0 // Too low
      });

      const validation1 = product1.validate();

      expect(validation1.isValid).toBe(false);
      expect(validation1.errors).toContain('Max lending period must be between 1 and 365 days');

      const product2 = new LendingProduct({
        name: 'Test Product',
        categoryId: 1,
        maxLendingPeriod: 400 // Too high
      });
      const validation2 = product2.validate();

      expect(validation2.isValid).toBe(false);
      expect(validation2.errors).toContain('Max lending period must be between 1 and 365 days');
    });
  });

  describe('Save Method', () => {
    it('should save a new product successfully', async () => {
      const product = new LendingProduct({
        name: 'Test Laptop',
        categoryId: 1,
        brand: 'TestBrand',
        model: 'TestModel'
      });

      // Mock database responses
      mockConnection.execute
        .mockResolvedValueOnce([[], {}]) // Serial number check
        .mockResolvedValueOnce([[], {}]) // Existing product check
        .mockResolvedValueOnce([{ insertId: 1 }, {}]); // Insert product

      const result = await product.save();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBe(product);
    });

    it('should update an existing product', async () => {
      const product = new LendingProduct({
        id: 'existing-id',
        name: 'Updated Laptop',
        categoryId: 1
      });

      // Mock database responses
      mockConnection.execute
        .mockResolvedValueOnce([[], {}]) // Serial number check
        .mockResolvedValueOnce([[{ id: 'existing-id' }], {}]) // Existing product check
        .mockResolvedValueOnce([{ affectedRows: 1 }, {}]); // Update product

      const result = await product.save();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(result).toBe(product);
    });

    it('should handle tags when saving', async () => {
      const product = new LendingProduct({
        name: 'Test Product',
        categoryId: 1,
        tags: ['electronics', 'laptop', 'portable']
      });

      // Mock database responses
      mockConnection.execute
        .mockResolvedValueOnce([[], {}]) // Serial number check
        .mockResolvedValueOnce([[], {}]) // Existing product check
        .mockResolvedValueOnce([{ insertId: 1 }, {}]) // Insert product
        .mockResolvedValueOnce([{ affectedRows: 0 }, {}]) // Delete existing tags
        .mockResolvedValueOnce([{ insertId: 1 }, {}]) // Insert tag 1
        .mockResolvedValueOnce([{ insertId: 2 }, {}]) // Insert tag 2
        .mockResolvedValueOnce([{ insertId: 3 }, {}]); // Insert tag 3

      await product.save();

      // Verify tags were processed
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM product_tags WHERE product_id = ?',
        ['test-uuid-123']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'INSERT INTO product_tags (product_id, tag) VALUES (?, ?)',
        ['test-uuid-123', 'electronics']
      );
    });

    it('should fail validation and throw error', async () => {
      const product = new LendingProduct({}); // Invalid product

      await expect(product.save()).rejects.toThrow('Validation failed');
      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
    });

    it('should handle duplicate serial number error', async () => {
      const product = new LendingProduct({
        name: 'Test Product',
        categoryId: 1,
        serialNumber: 'DUPLICATE123'
      });

      // Mock duplicate serial number
      mockConnection.execute
        .mockResolvedValueOnce([[{ id: 'other-id' }], {}]); // Serial number exists

      await expect(product.save()).rejects.toThrow('Serial number already exists');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('should handle database errors and rollback', async () => {
      const product = new LendingProduct({
        name: 'Test Product',
        categoryId: 1
      });

      const dbError = new Error('Database connection failed');
      mockConnection.execute.mockRejectedValue(dbError);

      await expect(product.save()).rejects.toThrow('Database connection failed');
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('Static Methods', () => {
    beforeEach(() => {
      // Reset the mock for monitoredQuery
      require('../../config/database').monitoredQuery.mockReset();
    });

    describe('findById', () => {
      it('should find product by ID successfully', async () => {
        const mockProduct = {
          id: 'test-id',
          name: 'Test Product',
          category_id: 1,
          category_name: 'Electronics',
          image_urls: '["image1.jpg"]',
          specifications: '{"cpu": "Intel i7"}',
          tags: 'electronics,laptop'
        };

        require('../../config/database').monitoredQuery
          .mockResolvedValue([[mockProduct]]);

        const result = await LendingProduct.findById('test-id');

        expect(result).toBeInstanceOf(LendingProduct);
        expect(result.id).toBe('test-id');
        expect(result.name).toBe('Test Product');
        expect(result.imageUrls).toEqual(['image1.jpg']);
        expect(result.specifications).toEqual({ cpu: 'Intel i7' });
        expect(result.tags).toEqual(['electronics', 'laptop']);
      });

      it('should return null when product not found', async () => {
        require('../../config/database').monitoredQuery
          .mockResolvedValue([[]]);

        const result = await LendingProduct.findById('non-existent');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database error');
        require('../../config/database').monitoredQuery
          .mockRejectedValue(dbError);

        await expect(LendingProduct.findById('test-id')).rejects.toThrow('Database error');
      });
    });

    describe('findAll', () => {
      it('should find all products with no filters', async () => {
        const mockProducts = [
          {
            id: 'product-1',
            name: 'Product 1',
            category_name: 'Electronics',
            image_urls: '[]',
            specifications: '{}',
            tags: null
          },
          {
            id: 'product-2',
            name: 'Product 2',
            category_name: 'Office',
            image_urls: '[]',
            specifications: '{}',
            tags: 'office,supplies'
          }
        ];

        require('../../config/database').monitoredQuery
          .mockResolvedValue([mockProducts]);

        const result = await LendingProduct.findAll();

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(LendingProduct);
        expect(result[1].tags).toEqual(['office', 'supplies']);
      });

      it('should apply filters correctly', async () => {
        const filters = {
          categoryId: 1,
          isAvailable: true,
          brand: 'TestBrand',
          search: 'laptop',
          tags: ['electronics'],
          sortBy: 'name',
          sortOrder: 'desc',
          limit: 10,
          offset: 0
        };

        require('../../config/database').monitoredQuery
          .mockResolvedValue([[]]);

        await LendingProduct.findAll(filters);

        const [query, params] = require('../../config/database').monitoredQuery.mock.calls[0];
        
        expect(query).toContain('WHERE');
        expect(query).toContain('p.category_id = ?');
        expect(query).toContain('p.is_available = ?');
        expect(query).toContain('p.brand LIKE ?');
        expect(query).toContain('ORDER BY p.name DESC');
        expect(query).toContain('LIMIT ?');
        expect(params).toContain(1);
        expect(params).toContain(true);
        expect(params).toContain('%TestBrand%');
      });
    });

    describe('deleteById', () => {
      it('should delete product successfully', async () => {
        mockConnection.execute
          .mockResolvedValueOnce([[], {}]) // Check active lendings
          .mockResolvedValueOnce([{ affectedRows: 0 }, {}]) // Delete tags
          .mockResolvedValueOnce([{ affectedRows: 1 }, {}]); // Delete product

        const result = await LendingProduct.deleteById('test-id');

        expect(result).toBe(true);
        expect(mockConnection.beginTransaction).toHaveBeenCalled();
        expect(mockConnection.commit).toHaveBeenCalled();
      });

      it('should prevent deletion of product with active lendings', async () => {
        mockConnection.execute
          .mockResolvedValueOnce([[{ id: 'active-lending' }], {}]); // Has active lending

        await expect(LendingProduct.deleteById('test-id')).rejects.toThrow(
          'Cannot delete product with active lending transactions'
        );
        expect(mockConnection.rollback).toHaveBeenCalled();
      });
    });

    describe('getStatistics', () => {
      it('should return product statistics', async () => {
        const mockStats = [{ total_products: 10, available_products: 8 }];
        const mockCategoryStats = [{ category: 'Electronics', count: 5 }];
        const mockConditionStats = [{ condition_status: 'good', count: 7 }];

        require('../../config/database').monitoredQuery
          .mockResolvedValueOnce([mockStats])
          .mockResolvedValueOnce([mockCategoryStats])
          .mockResolvedValueOnce([mockConditionStats]);

        const result = await LendingProduct.getStatistics();

        expect(result).toEqual({
          overview: mockStats[0],
          byCategory: mockCategoryStats,
          byCondition: mockConditionStats
        });
      });
    });
  });
});

describe('ProductCategory Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../config/database').monitoredQuery.mockReset();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', description: 'Electronic devices', parent_id: null },
        { id: 2, name: 'Laptops', description: 'Laptop computers', parent_id: 1 }
      ];

      require('../../config/database').monitoredQuery
        .mockResolvedValue([mockCategories]);

      const result = await ProductCategory.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ProductCategory);
      expect(result[0].name).toBe('Electronics');
      expect(result[1].parentId).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'A new category',
        parentId: null
      };

      require('../../config/database').monitoredQuery
        .mockResolvedValue([{ insertId: 3 }]);

      const result = await ProductCategory.create(categoryData);

      expect(result).toBeInstanceOf(ProductCategory);
      expect(result.id).toBe(3);
      expect(result.name).toBe('New Category');
    });
  });
});