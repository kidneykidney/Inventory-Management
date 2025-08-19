const express = require('express');
const router = express.Router();
const { LendingTransaction, LendingProduct } = require('../models/lendingModels');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/lending-transactions
 * Create a new lending transaction
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      productId,
      borrowerId,
      lendDate,
      conditionLent,
      notes,
      approvedBy
    } = req.body;

    // Use authenticated user as borrower if not specified
    const finalBorrowerId = borrowerId || req.user.id;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is available
    const product = await LendingProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check availability
    const isAvailable = await LendingTransaction.checkAvailability(productId);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for lending'
      });
    }

    // Create transaction
    const transaction = new LendingTransaction({
      productId,
      borrowerId: finalBorrowerId,
      lendDate: lendDate || new Date(),
      conditionLent: conditionLent || 'good',
      notes: notes || '',
      approvedBy: approvedBy || req.user.id
    });

    const savedTransaction = await transaction.save();

    // Send lending confirmation email
    try {
      // Get user details for email
      const userQuery = `SELECT name, email FROM users WHERE id = ?`;
      const [users] = await db.execute(userQuery, [finalBorrowerId]);
      
      if (users.length > 0) {
        const user = users[0];
        const transactionWithProduct = {
          ...savedTransaction,
          productName: product.name,
          productSpecs: product.specifications
        };
        
        await notificationService.sendLendingConfirmation(
          transactionWithProduct,
          user.email,
          user.name
        );
      }
    } catch (emailError) {
      logger.error('Failed to send lending confirmation email:', emailError);
      // Don't fail the transaction if email fails
    }

    logger.info('Lending transaction created', {
      transactionId: savedTransaction.id,
      productId,
      borrowerId: finalBorrowerId,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Lending transaction created successfully',
      data: savedTransaction
    });
  } catch (error) {
    logger.error('Error creating lending transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lending transaction',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions/history
 * Get lending history with detailed analytics
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { 
      userId, 
      productId, 
      startDate, 
      endDate, 
      includeReturned = 'true',
      limit = 50, 
      offset = 0 
    } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Only admins can view other users' history
    if (userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to view other users\' history'
      });
    }

    // Filter by user (current user if not admin, specified user if admin)
    if (userId) {
      filters.borrowerId = parseInt(userId);
    } else if (req.user.role !== 'admin') {
      filters.borrowerId = req.user.id;
    }

    if (productId) filters.productId = productId;
    if (includeReturned === 'false') {
      filters.excludeReturned = true;
    }

    // Date range filtering
    if (startDate || endDate) {
      filters.dateRange = {
        start: startDate ? new Date(startDate) : null,
        end: endDate ? new Date(endDate) : null
      };
    }

    const history = await LendingTransaction.getHistory(filters);

    logger.info('Lending history retrieved', {
      count: history.length,
      filters,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: history,
      total: history.length,
      filters: {
        userId: filters.borrowerId,
        productId,
        startDate,
        endDate,
        includeReturned
      }
    });
  } catch (error) {
    logger.error('Error retrieving lending history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending history',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions/analytics/trends
 * Get lending trends and analytics
 */
router.get('/analytics/trends', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '12months', groupBy = 'month' } = req.query;

    const analytics = await LendingTransaction.getAnalytics({
      period,
      groupBy
    });

    logger.info('Lending analytics retrieved', {
      period,
      groupBy,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error retrieving lending analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions/overdue/list
 * Get all overdue transactions
 */
router.get('/overdue/list', authenticateToken, async (req, res) => {
  try {
    // Only admins can view all overdue transactions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const overdueTransactions = await LendingTransaction.getOverdueTransactions();

    logger.info('Overdue transactions retrieved', {
      count: overdueTransactions.length,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: overdueTransactions,
      total: overdueTransactions.length
    });
  } catch (error) {
    logger.error('Error retrieving overdue transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions/statistics/overview
 * Get lending statistics
 */
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    const statistics = await LendingTransaction.getStatistics();

    logger.info('Lending statistics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error retrieving lending statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions/my-transactions/list
 * Get current user's lending transactions
 */
router.get('/my-transactions/list', authenticateToken, async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const filters = {
      borrowerId: req.user.id
    };

    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const transactions = await LendingTransaction.findAll(filters);

    logger.info('User transactions retrieved', {
      count: transactions.length,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: transactions,
      total: transactions.length
    });
  } catch (error) {
    logger.error('Error retrieving user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions
 * Get all lending transactions with optional filtering
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      borrowerId,
      productId,
      overdue,
      dueSoon,
      limit,
      offset,
      myTransactions
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (productId) filters.productId = productId;
    if (overdue === 'true') filters.overdue = true;
    if (dueSoon === 'true') filters.dueSoon = true;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    // Filter by borrower - either specified borrowerId or current user's transactions
    if (myTransactions === 'true') {
      filters.borrowerId = req.user.id;
    } else if (borrowerId) {
      filters.borrowerId = parseInt(borrowerId);
    }

    const transactions = await LendingTransaction.findAll(filters);

    logger.info('Lending transactions retrieved', {
      count: transactions.length,
      filters,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: transactions,
      total: transactions.length
    });
  } catch (error) {
    logger.error('Error retrieving lending transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-transactions/:id
 * Get a specific lending transaction by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await LendingTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Lending transaction not found'
      });
    }

    // Check if user can access this transaction (borrower or admin)
    if (transaction.borrowerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    logger.info('Lending transaction retrieved', {
      transactionId: id,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error('Error retrieving lending transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending transaction',
      error: error.message
    });
  }
});

/**
 * PUT /api/lending-transactions/:id/return
 * Process return of a borrowed item
 */
router.put('/:id/return', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { conditionReturned, notes, returnDate } = req.body;

    const transaction = await LendingTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Lending transaction not found'
      });
    }

    // Check if user can return this item (borrower or admin)
    if (transaction.borrowerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Item has already been returned'
      });
    }

    const returnData = {
      conditionReturned: conditionReturned || 'good',
      notes: notes || '',
      returnDate: returnDate || new Date()
    };

    const updatedTransaction = await transaction.processReturn(returnData);

    // Send return confirmation email
    try {
      // Get user details for email
      const userQuery = `SELECT name, email FROM users WHERE id = ?`;
      const [users] = await db.execute(userQuery, [transaction.borrowerId]);
      
      if (users.length > 0) {
        const user = users[0];
        // Get product name
        const product = await LendingProduct.findById(transaction.productId);
        const transactionWithProduct = {
          ...updatedTransaction,
          productName: product ? product.name : 'Unknown Product',
          returnCondition: returnData.conditionReturned
        };
        
        await notificationService.sendReturnConfirmation(
          transactionWithProduct,
          user.email,
          user.name
        );
      }
    } catch (emailError) {
      logger.error('Failed to send return confirmation email:', emailError);
      // Don't fail the transaction if email fails
    }

    logger.info('Item returned successfully', {
      transactionId: id,
      productId: transaction.productId,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Item returned successfully',
      data: updatedTransaction
    });
  } catch (error) {
    logger.error('Error processing return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
});



/**
 * PUT /api/lending-transactions/update-overdue
 * Update overdue transaction statuses (admin only)
 */
router.put('/update-overdue', authenticateToken, async (req, res) => {
  try {
    // Only admins can update overdue statuses
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const updatedCount = await LendingTransaction.updateOverdueStatuses();

    logger.info('Overdue statuses updated', {
      updatedCount,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `Updated ${updatedCount} transactions to overdue status`,
      data: { updatedCount }
    });
  } catch (error) {
    logger.error('Error updating overdue statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update overdue statuses',
      error: error.message
    });
  }
});



/**
 * POST /api/lending-transactions/check-availability
 * Check if a product is available for lending
 */
router.post('/check-availability', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const isAvailable = await LendingTransaction.checkAvailability(productId);
    const product = await LendingProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        isAvailable,
        maxLendingPeriod: product.maxLendingPeriod,
        requiresApproval: product.requiresApproval
      }
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
});



/**
 * POST /api/lending-transactions/reserve
 * Reserve a product for lending (optional reservation system)
 */
router.post('/reserve', authenticateToken, async (req, res) => {
  try {
    const { productId, reservationNotes } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is available
    const product = await LendingProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check availability
    const isAvailable = await LendingTransaction.checkAvailability(productId);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for reservation'
      });
    }

    // Create reservation (transaction with 'reserved' status)
    const reservation = await LendingTransaction.createReservation({
      productId,
      borrowerId: req.user.id,
      notes: reservationNotes || '',
      reservedBy: req.user.id
    });

    logger.info('Product reserved successfully', {
      reservationId: reservation.id,
      productId,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Product reserved successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: error.message
    });
  }
});

/**
 * DELETE /api/lending-transactions/reserve/:id
 * Cancel a product reservation
 */
router.delete('/reserve/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await LendingTransaction.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user can cancel this reservation
    if (reservation.borrowerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (reservation.status !== 'reserved') {
      return res.status(400).json({
        success: false,
        message: 'Only reserved items can be cancelled'
      });
    }

    await LendingTransaction.cancelReservation(id);

    logger.info('Reservation cancelled successfully', {
      reservationId: id,
      productId: reservation.productId,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation',
      error: error.message
    });
  }
});

module.exports = router;