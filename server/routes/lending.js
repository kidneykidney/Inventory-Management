const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock data for lending items (in production, this would come from database)
const lendingItems = [
  {
    id: 1,
    sku: 'ELC001',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    subcategory: 'Laptops',
    brand: 'Apple',
    model: 'MacBook Pro',
    serialNumber: 'C02XW0XHJGH5',
    specifications: {
      processor: 'M1 Pro',
      memory: '16GB',
      storage: '512GB SSD',
      display: '16-inch Retina'
    },
    quantity: 5,
    available: 3,
    location: 'Tech Storage A',
    condition: 'excellent',
    tags: ['laptop', 'development', 'design'],
    isAvailable: true,
    lendingPolicy: {
      maxLendingPeriod: 30,
      requiresApproval: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    sku: 'OFF001',
    name: 'Ergonomic Office Chair',
    category: 'Office Supplies',
    subcategory: 'Furniture',
    brand: 'Herman Miller',
    model: 'Aeron',
    serialNumber: 'HM2023001',
    specifications: {
      material: 'Mesh',
      adjustable: 'Height, Arms, Tilt',
      warranty: '12 years'
    },
    quantity: 8,
    available: 6,
    location: 'Office Storage B',
    condition: 'good',
    tags: ['chair', 'ergonomic', 'office'],
    isAvailable: true,
    lendingPolicy: {
      maxLendingPeriod: 90,
      requiresApproval: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock lending transactions
const lendingTransactions = [];
let transactionIdCounter = 1;

/**
 * GET /api/lending/items
 * Get all lending items with optional filtering
 */
router.get('/items', (req, res) => {
  try {
    const { category, available, search, tags } = req.query;
    let filteredItems = [...lendingItems];

    // Filter by category
    if (category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by availability
    if (available !== undefined) {
      const isAvailable = available === 'true';
      filteredItems = filteredItems.filter(item => item.isAvailable === isAvailable);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filteredItems = filteredItems.filter(item =>
        tagArray.some(tag => 
          item.tags.some(itemTag => itemTag.toLowerCase().includes(tag))
        )
      );
    }

    logger.info('Lending items retrieved', { 
      total: filteredItems.length, 
      filters: { category, available, search, tags } 
    });

    res.json({
      success: true,
      data: filteredItems,
      total: filteredItems.length
    });
  } catch (error) {
    logger.error('Error retrieving lending items', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending items',
      error: error.message
    });
  }
});

/**
 * GET /api/lending/items/:id
 * Get a specific lending item by ID
 */
router.get('/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = lendingItems.find(item => item.id === itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lending item not found'
      });
    }

    logger.info('Lending item retrieved', { id: itemId });

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Error retrieving lending item', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending item',
      error: error.message
    });
  }
});

/**
 * POST /api/lending/items
 * Create a new lending item
 */
router.post('/items', (req, res) => {
  try {
    const {
      sku,
      name,
      category,
      subcategory,
      brand,
      model,
      serialNumber,
      specifications,
      quantity,
      location,
      condition,
      tags,
      maxLendingPeriod,
      requiresApproval
    } = req.body;

    // Validation
    if (!sku || !name || !category || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sku, name, category, and quantity'
      });
    }

    // Check if SKU already exists
    if (lendingItems.some(item => item.sku === sku)) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    const newItem = {
      id: Math.max(...lendingItems.map(item => item.id), 0) + 1,
      sku,
      name,
      category,
      subcategory: subcategory || '',
      brand: brand || '',
      model: model || '',
      serialNumber: serialNumber || '',
      specifications: specifications || {},
      quantity: parseInt(quantity),
      available: parseInt(quantity), // Initially all items are available
      location: location || '',
      condition: condition || 'good',
      tags: Array.isArray(tags) ? tags : [],
      isAvailable: parseInt(quantity) > 0,
      lendingPolicy: {
        maxLendingPeriod: parseInt(maxLendingPeriod) || 30,
        requiresApproval: Boolean(requiresApproval)
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    lendingItems.push(newItem);

    logger.info('New lending item created', { id: newItem.id, sku: newItem.sku });

    res.status(201).json({
      success: true,
      message: 'Lending item created successfully',
      data: newItem
    });
  } catch (error) {
    logger.error('Error creating lending item', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lending item',
      error: error.message
    });
  }
});

/**
 * PUT /api/lending/items/:id
 * Update a lending item
 */
router.put('/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const itemIndex = lendingItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lending item not found'
      });
    }

    const existingItem = lendingItems[itemIndex];
    const updatedItem = {
      ...existingItem,
      ...req.body,
      id: itemId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Update availability based on quantity
    if (req.body.quantity !== undefined) {
      updatedItem.available = Math.min(parseInt(req.body.quantity), existingItem.available);
      updatedItem.isAvailable = updatedItem.available > 0;
    }

    lendingItems[itemIndex] = updatedItem;

    logger.info('Lending item updated', { id: itemId });

    res.json({
      success: true,
      message: 'Lending item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    logger.error('Error updating lending item', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lending item',
      error: error.message
    });
  }
});

/**
 * DELETE /api/lending/items/:id
 * Delete a lending item
 */
router.delete('/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const itemIndex = lendingItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lending item not found'
      });
    }

    const deletedItem = lendingItems.splice(itemIndex, 1)[0];

    logger.info('Lending item deleted', { id: itemId, sku: deletedItem.sku });

    res.json({
      success: true,
      message: 'Lending item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    logger.error('Error deleting lending item', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lending item',
      error: error.message
    });
  }
});

/**
 * POST /api/lending/transactions
 * Create a new lending transaction
 */
router.post('/transactions', (req, res) => {
  try {
    const {
      itemId,
      borrowerName,
      borrowerEmail,
      purpose,
      quantity,
      returnDate,
      notes
    } = req.body;

    // Validation
    if (!itemId || !borrowerName || !borrowerEmail || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: itemId, borrowerName, borrowerEmail, quantity'
      });
    }

    // Find the item
    const itemIndex = lendingItems.findIndex(item => item.id === parseInt(itemId));
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lending item not found'
      });
    }

    const item = lendingItems[itemIndex];

    // Check availability
    if (item.available < parseInt(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity available for lending'
      });
    }

    // Calculate return date if not provided
    const calculatedReturnDate = returnDate || 
      new Date(Date.now() + item.lendingPolicy.maxLendingPeriod * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Create transaction
    const transaction = {
      id: transactionIdCounter++,
      itemId: parseInt(itemId),
      itemSku: item.sku,
      itemName: item.name,
      borrowerName,
      borrowerEmail,
      purpose: purpose || '',
      quantity: parseInt(quantity),
      lendDate: new Date().toISOString().split('T')[0],
      returnDate: calculatedReturnDate,
      actualReturnDate: null,
      status: 'active',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    lendingTransactions.push(transaction);

    // Update item availability
    lendingItems[itemIndex] = {
      ...item,
      available: item.available - parseInt(quantity),
      isAvailable: (item.available - parseInt(quantity)) > 0,
      updatedAt: new Date().toISOString()
    };

    logger.info('Lending transaction created', { 
      transactionId: transaction.id, 
      itemId, 
      borrower: borrowerName 
    });

    res.status(201).json({
      success: true,
      message: 'Lending transaction created successfully',
      data: transaction
    });
  } catch (error) {
    logger.error('Error creating lending transaction', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lending transaction',
      error: error.message
    });
  }
});

/**
 * GET /api/lending/transactions
 * Get all lending transactions
 */
router.get('/transactions', (req, res) => {
  try {
    const { status, borrower, itemId } = req.query;
    let filteredTransactions = [...lendingTransactions];

    // Filter by status
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }

    // Filter by borrower
    if (borrower) {
      const borrowerLower = borrower.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t =>
        t.borrowerName.toLowerCase().includes(borrowerLower) ||
        t.borrowerEmail.toLowerCase().includes(borrowerLower)
      );
    }

    // Filter by item ID
    if (itemId) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.itemId === parseInt(itemId)
      );
    }

    logger.info('Lending transactions retrieved', { 
      total: filteredTransactions.length,
      filters: { status, borrower, itemId }
    });

    res.json({
      success: true,
      data: filteredTransactions,
      total: filteredTransactions.length
    });
  } catch (error) {
    logger.error('Error retrieving lending transactions', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending transactions',
      error: error.message
    });
  }
});

/**
 * PUT /api/lending/transactions/:id/return
 * Process return of a lending transaction
 */
router.put('/transactions/:id/return', (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { condition, notes } = req.body;

    const transactionIndex = lendingTransactions.findIndex(t => t.id === transactionId);
    if (transactionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lending transaction not found'
      });
    }

    const transaction = lendingTransactions[transactionIndex];

    if (transaction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not active'
      });
    }

    // Update transaction
    lendingTransactions[transactionIndex] = {
      ...transaction,
      status: 'returned',
      actualReturnDate: new Date().toISOString().split('T')[0],
      returnCondition: condition || 'good',
      returnNotes: notes || '',
      updatedAt: new Date().toISOString()
    };

    // Update item availability
    const itemIndex = lendingItems.findIndex(item => item.id === transaction.itemId);
    if (itemIndex !== -1) {
      const item = lendingItems[itemIndex];
      lendingItems[itemIndex] = {
        ...item,
        available: item.available + transaction.quantity,
        isAvailable: true,
        updatedAt: new Date().toISOString()
      };
    }

    logger.info('Lending transaction returned', { 
      transactionId, 
      itemId: transaction.itemId 
    });

    res.json({
      success: true,
      message: 'Item returned successfully',
      data: lendingTransactions[transactionIndex]
    });
  } catch (error) {
    logger.error('Error processing return', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
});

/**
 * GET /api/lending/categories
 * Get all available categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = [...new Set(lendingItems.map(item => item.category))];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error retrieving categories', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
});

/**
 * GET /api/lending/stats
 * Get lending system statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalItems: lendingItems.length,
      availableItems: lendingItems.filter(item => item.isAvailable).length,
      totalQuantity: lendingItems.reduce((sum, item) => sum + item.quantity, 0),
      availableQuantity: lendingItems.reduce((sum, item) => sum + item.available, 0),
      activeTransactions: lendingTransactions.filter(t => t.status === 'active').length,
      totalTransactions: lendingTransactions.length,
      categoriesCount: [...new Set(lendingItems.map(item => item.category))].length,
      overdueTransactions: lendingTransactions.filter(t => 
        t.status === 'active' && new Date(t.returnDate) < new Date()
      ).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error retrieving lending stats', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending statistics',
      error: error.message
    });
  }
});

module.exports = router;