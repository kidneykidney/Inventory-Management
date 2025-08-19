const request = require('supertest');
const express = require('express');
const lendingRoutes = require('../routes/lending');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/lending', lendingRoutes);

describe('Lending API Routes', () => {
  describe('GET /api/lending/items', () => {
    test('should return all lending items', async () => {
      const response = await request(app).get('/api/lending/items').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    test('should filter items by category', async () => {
      const response = await request(app)
        .get('/api/lending/items?category=Electronics')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(item => {
        expect(item.category).toBe('Electronics');
      });
    });

    test('should filter items by availability', async () => {
      const response = await request(app)
        .get('/api/lending/items?available=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(item => {
        expect(item.isAvailable).toBe(true);
      });
    });

    test('should search items by name', async () => {
      const response = await request(app)
        .get('/api/lending/items?search=MacBook')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(item => {
        expect(item.name.toLowerCase()).toContain('macbook');
      });
    });

    test('should filter items by tags', async () => {
      const response = await request(app)
        .get('/api/lending/items?tags=laptop')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(item => {
        expect(item.tags).toContain('laptop');
      });
    });
  });

  describe('GET /api/lending/items/:id', () => {
    test('should return specific lending item', async () => {
      const response = await request(app)
        .get('/api/lending/items/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBeDefined();
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/lending/items/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lending item not found');
    });
  });

  describe('POST /api/lending/items', () => {
    test('should create new lending item', async () => {
      const newItem = {
        sku: 'TEST001',
        name: 'Test Item',
        category: 'Electronics',
        subcategory: 'Testing',
        brand: 'Test Brand',
        model: 'Test Model',
        quantity: 5,
        location: 'Test Location',
        condition: 'excellent',
        tags: ['test', 'electronics'],
        maxLendingPeriod: 30,
        requiresApproval: false,
      };

      const response = await request(app)
        .post('/api/lending/items')
        .send(newItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe(newItem.sku);
      expect(response.body.data.name).toBe(newItem.name);
      expect(response.body.data.available).toBe(newItem.quantity);
      expect(response.body.data.isAvailable).toBe(true);
    });

    test('should validate required fields', async () => {
      const invalidItem = {
        name: 'Test Item',
        // Missing required fields: sku, category, quantity
      };

      const response = await request(app)
        .post('/api/lending/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    test('should prevent duplicate SKU', async () => {
      const duplicateItem = {
        sku: 'ELC001', // This SKU already exists
        name: 'Duplicate Item',
        category: 'Electronics',
        quantity: 1,
      };

      const response = await request(app)
        .post('/api/lending/items')
        .send(duplicateItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('SKU already exists');
    });
  });

  describe('PUT /api/lending/items/:id', () => {
    test('should update existing lending item', async () => {
      const updateData = {
        name: 'Updated MacBook Pro',
        quantity: 10,
      };

      const response = await request(app)
        .put('/api/lending/items/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.quantity).toBe(updateData.quantity);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/lending/items/999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lending item not found');
    });
  });

  describe('DELETE /api/lending/items/:id', () => {
    test('should delete lending item', async () => {
      // First create an item to delete
      const newItem = {
        sku: 'DELETE001',
        name: 'Item to Delete',
        category: 'Electronics',
        quantity: 1,
      };

      const createResponse = await request(app)
        .post('/api/lending/items')
        .send(newItem);

      const itemId = createResponse.body.data.id;

      // Now delete it
      const response = await request(app)
        .delete(`/api/lending/items/${itemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(itemId);

      // Verify it's deleted
      await request(app).get(`/api/lending/items/${itemId}`).expect(404);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/lending/items/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lending item not found');
    });
  });

  describe('POST /api/lending/transactions', () => {
    test('should create lending transaction', async () => {
      const transaction = {
        itemId: 1,
        borrowerName: 'John Doe',
        borrowerEmail: 'john@example.com',
        purpose: 'Development work',
        quantity: 1,
        notes: 'Test lending',
      };

      const response = await request(app)
        .post('/api/lending/transactions')
        .send(transaction)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.borrowerName).toBe(transaction.borrowerName);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.returnDate).toBeDefined();
    });

    test('should validate required fields for transaction', async () => {
      const invalidTransaction = {
        itemId: 1,
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/lending/transactions')
        .send(invalidTransaction)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    test('should check item availability', async () => {
      const transaction = {
        itemId: 1,
        borrowerName: 'Jane Doe',
        borrowerEmail: 'jane@example.com',
        quantity: 100, // More than available
      };

      const response = await request(app)
        .post('/api/lending/transactions')
        .send(transaction)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient quantity');
    });

    test('should return 404 for non-existent item', async () => {
      const transaction = {
        itemId: 999,
        borrowerName: 'John Doe',
        borrowerEmail: 'john@example.com',
        quantity: 1,
      };

      const response = await request(app)
        .post('/api/lending/transactions')
        .send(transaction)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lending item not found');
    });
  });

  describe('GET /api/lending/transactions', () => {
    test('should return all transactions', async () => {
      const response = await request(app)
        .get('/api/lending/transactions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should filter transactions by status', async () => {
      const response = await request(app)
        .get('/api/lending/transactions?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(transaction => {
        expect(transaction.status).toBe('active');
      });
    });

    test('should filter transactions by borrower', async () => {
      const response = await request(app)
        .get('/api/lending/transactions?borrower=John')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(transaction => {
        expect(
          transaction.borrowerName.toLowerCase().includes('john') ||
            transaction.borrowerEmail.toLowerCase().includes('john')
        ).toBe(true);
      });
    });
  });

  describe('PUT /api/lending/transactions/:id/return', () => {
    test('should process return successfully', async () => {
      // First create a transaction
      const transaction = {
        itemId: 2,
        borrowerName: 'Return Test',
        borrowerEmail: 'return@example.com',
        quantity: 1,
      };

      const createResponse = await request(app)
        .post('/api/lending/transactions')
        .send(transaction);

      const transactionId = createResponse.body.data.id;

      // Now process return
      const returnData = {
        condition: 'good',
        notes: 'Returned in good condition',
      };

      const response = await request(app)
        .put(`/api/lending/transactions/${transactionId}/return`)
        .send(returnData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('returned');
      expect(response.body.data.actualReturnDate).toBeDefined();
    });

    test('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .put('/api/lending/transactions/999/return')
        .send({ condition: 'good' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lending transaction not found');
    });
  });

  describe('GET /api/lending/categories', () => {
    test('should return all categories', async () => {
      const response = await request(app)
        .get('/api/lending/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/lending/stats', () => {
    test('should return lending statistics', async () => {
      const response = await request(app).get('/api/lending/stats').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('availableItems');
      expect(response.body.data).toHaveProperty('totalQuantity');
      expect(response.body.data).toHaveProperty('availableQuantity');
      expect(response.body.data).toHaveProperty('activeTransactions');
      expect(response.body.data).toHaveProperty('totalTransactions');
      expect(response.body.data).toHaveProperty('categoriesCount');
      expect(response.body.data).toHaveProperty('overdueTransactions');
    });
  });
});
