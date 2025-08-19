/**
 * Inventory routes
 * Manages inventory items, stock levels, and transactions
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock inventory data
const inventoryItems = [
  {
    id: 1,
    sku: 'SKU001',
    name: 'Laptop',
    category: 'Electronics',
    quantity: 25,
    location: 'Warehouse A',
    status: 'In Stock',
  },
  {
    id: 2,
    sku: 'SKU002',
    name: 'Office Chair',
    category: 'Furniture',
    quantity: 15,
    location: 'Warehouse B',
    status: 'In Stock',
  },
  {
    id: 3,
    sku: 'SKU003',
    name: 'Printer Ink',
    category: 'Office Supplies',
    quantity: 5,
    location: 'Warehouse A',
    status: 'Low Stock',
  },
  {
    id: 4,
    sku: 'SKU004',
    name: 'Smartphone',
    category: 'Electronics',
    quantity: 30,
    location: 'Warehouse C',
    status: 'In Stock',
  },
  {
    id: 5,
    sku: 'SKU005',
    name: 'Desk',
    category: 'Furniture',
    quantity: 0,
    location: 'Warehouse B',
    status: 'Out of Stock',
  },
  {
    id: 6,
    sku: 'SKU006',
    name: 'Wireless Mouse',
    category: 'Electronics',
    quantity: 45,
    location: 'Warehouse A',
    status: 'In Stock',
  },
  {
    id: 7,
    sku: 'SKU007',
    name: 'Headphones',
    category: 'Electronics',
    quantity: 7,
    location: 'Warehouse C',
    status: 'Low Stock',
  },
  {
    id: 8,
    sku: 'SKU008',
    name: 'File Cabinet',
    category: 'Furniture',
    quantity: 12,
    location: 'Warehouse B',
    status: 'In Stock',
  },
  {
    id: 9,
    sku: 'SKU009',
    name: 'Notebook',
    category: 'Office Supplies',
    quantity: 0,
    location: 'Warehouse A',
    status: 'Out of Stock',
  },
  {
    id: 10,
    sku: 'SKU010',
    name: 'Monitor',
    category: 'Electronics',
    quantity: 18,
    location: 'Warehouse C',
    status: 'In Stock',
  },
];

// Mock transactions
const transactions = [];

/**
 * Get status based on quantity
 * @param {number} quantity - Item quantity
 * @returns {string} Status string
 */
const getItemStatus = quantity => {
  if (quantity <= 0) {
    return 'Out of Stock';
  }
  if (quantity <= 5) {
    return 'Low Stock';
  }
  return 'In Stock';
};

/**
 * @route   GET /api/v1/inventory
 * @desc    Get all inventory items
 * @access  Private
 */
router.get('/', (req, res) => {
  try {
    logger.info('Fetching all inventory items');
    res.json({
      success: true,
      count: inventoryItems.length,
      data: inventoryItems,
    });
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get single inventory item
 * @access  Private
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = inventoryItems.find(item => item.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    logger.info(`Fetching inventory item with ID: ${id}`);
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    logger.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   POST /api/v1/inventory
 * @desc    Create new inventory item
 * @access  Private
 */
router.post('/', (req, res) => {
  try {
    const { sku, name, category, quantity, location } = req.body;

    // Check if required fields are provided
    if (!sku || !name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sku, name, and category',
      });
    }

    // Check if SKU already exists
    if (inventoryItems.some(item => item.sku === sku)) {
      return res.status(400).json({
        success: false,
        message: 'Item with this SKU already exists',
      });
    }

    // Create new item
    const newItem = {
      id:
        inventoryItems.length > 0
          ? Math.max(...inventoryItems.map(item => item.id)) + 1
          : 1,
      sku,
      name,
      category,
      quantity: quantity || 0,
      location: location || '',
      status: getItemStatus(quantity || 0),
    };

    inventoryItems.push(newItem);

    logger.info(`New inventory item created: ${name} (${sku})`);
    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    logger.error('Error creating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   PUT /api/v1/inventory/:id
 * @desc    Update inventory item
 * @access  Private
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { sku, name, category, quantity, location } = req.body;

    // Find item index
    const itemIndex = inventoryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    // Update item
    const updatedItem = {
      ...inventoryItems[itemIndex],
      sku: sku || inventoryItems[itemIndex].sku,
      name: name || inventoryItems[itemIndex].name,
      category: category || inventoryItems[itemIndex].category,
      quantity:
        quantity !== undefined ? quantity : inventoryItems[itemIndex].quantity,
      location: location || inventoryItems[itemIndex].location,
    };

    // Update status based on quantity
    updatedItem.status = getItemStatus(updatedItem.quantity);

    // Replace item in array
    inventoryItems[itemIndex] = updatedItem;

    logger.info(
      `Inventory item updated: ${updatedItem.name} (${updatedItem.sku})`
    );
    res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    logger.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   DELETE /api/v1/inventory/:id
 * @desc    Delete inventory item
 * @access  Private
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Find item index
    const itemIndex = inventoryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    // Remove item from array
    const removedItem = inventoryItems[itemIndex];
    inventoryItems.splice(itemIndex, 1);

    logger.info(
      `Inventory item deleted: ${removedItem.name} (${removedItem.sku})`
    );
    res.json({
      success: true,
      message: 'Inventory item deleted',
      data: removedItem,
    });
  } catch (error) {
    logger.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   POST /api/v1/inventory/:id/transaction
 * @desc    Process inventory transaction (lend/give)
 * @access  Private
 */
router.post('/:id/transaction', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, quantity, recipient, purpose, returnDate } = req.body;

    // Validate input
    if (!type || !quantity || !recipient) {
      return res.status(400).json({
        success: false,
        message: 'Please provide transaction type, quantity, and recipient',
      });
    }

    // Check if type is valid
    if (type !== 'lend' && type !== 'give') {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either "lend" or "give"',
      });
    }

    // Find item index
    const itemIndex = inventoryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    // Check if enough quantity is available
    if (inventoryItems[itemIndex].quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough quantity available',
      });
    }

    // Update item quantity
    const updatedItem = {
      ...inventoryItems[itemIndex],
      quantity: inventoryItems[itemIndex].quantity - quantity,
    };

    // Update status based on new quantity
    updatedItem.status = getItemStatus(updatedItem.quantity);

    // Replace item in array
    inventoryItems[itemIndex] = updatedItem;

    // Record transaction
    const transaction = {
      id:
        transactions.length > 0
          ? Math.max(...transactions.map(t => t.id)) + 1
          : 1,
      itemId: id,
      type,
      quantity,
      recipient,
      purpose: purpose || '',
      returnDate: type === 'lend' ? returnDate : null,
      returned: false,
      userId: 1, // Mock user ID
      date: new Date().toISOString(),
    };

    transactions.push(transaction);

    logger.info(
      `Inventory transaction processed: ${type} ${quantity} of ${updatedItem.name} to ${recipient}`
    );
    res.json({
      success: true,
      data: {
        item: updatedItem,
        transaction,
      },
    });
  } catch (error) {
    logger.error('Error processing inventory transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
