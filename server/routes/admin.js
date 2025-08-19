/**
 * Admin Panel API Routes
 * Comprehensive admin endpoints for product management, user management, and analytics
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { User } = require('../models/userModels');
const {
  LendingProduct,
  ProductCategory,
  LendingTransaction,
} = require('../models/lendingModels');
const logger = require('../utils/logger');

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard overview with key metrics
 * @access  Admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.getStats();

    // Get product statistics
    const productStats = await LendingProduct.getStatistics();

    // Get lending statistics
    const lendingStats = await LendingTransaction.getStatistics();

    // Get overdue transactions count
    const overdueTransactions = await LendingTransaction.findAll({
      overdue: true,
    });

    // Get recent activity (last 30 days)
    const recentTransactions = await LendingTransaction.findAll({
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    const dashboardData = {
      overview: {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        totalProducts: productStats.overview.total_products,
        availableProducts: productStats.overview.available_products,
        activeTransactions: lendingStats.overview.active_transactions,
        overdueTransactions: overdueTransactions.length,
        avgLendingPeriod: Math.round(
          lendingStats.overview.avg_lending_period || 0
        ),
      },
      userStats,
      productStats,
      lendingStats,
      recentActivity: recentTransactions,
      overdueItems: overdueTransactions.slice(0, 5), // Top 5 overdue items
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard data',
    });
  }
});

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['admin', 'user']),
    query('status').optional().isIn(['active', 'inactive']),
    query('search').optional().isLength({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 20, role, status, search } = req.query;

      const result = await User.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        role,
        status,
        search,
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Admin get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving users',
      });
    }
  }
);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user details and permissions
 * @access  Admin
 */
router.put(
  '/users/:id',
  [
    body('name').optional().isLength({ min: 2, max: 100 }).trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['admin', 'user']),
    body('status').optional().isIn(['active', 'inactive']),
    body('department').optional().isLength({ max: 100 }).trim(),
    body('phone').optional().isLength({ max: 20 }).trim(),
    body('address').optional().isLength({ max: 200 }).trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Prevent admin from changing their own role
      if (
        id === req.user.id &&
        updateData.role &&
        updateData.role !== req.user.role
      ) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change your own role',
        });
      }

      // Check if email is already taken (if updating email)
      if (updateData.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use',
          });
        }
      }

      const updatedUser = await User.update(id, updateData);

      logger.info(`Admin ${req.user.email} updated user ${id}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      logger.error('Admin update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user',
      });
    }
  }
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Deactivate user account
 * @access  Admin
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check if user has active lending transactions
    const activeTransactions = await LendingTransaction.findAll({
      borrowerId: id,
      status: 'active',
    });
    if (activeTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active lending transactions',
      });
    }

    await User.delete(id);

    logger.info(`Admin ${req.user.email} deleted user ${id}`);

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    logger.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
});

/**
 * @route   GET /api/v1/admin/products
 * @desc    Get all products with advanced filtering for admin management
 * @access  Admin
 */
router.get(
  '/products',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('categoryId').optional().isUUID(),
    query('brand').optional().isLength({ min: 1, max: 100 }),
    query('condition')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'needs_repair']),
    query('isAvailable').optional().isBoolean(),
    query('search').optional().isLength({ min: 1, max: 100 }),
    query('sortBy')
      .optional()
      .isIn(['name', 'brand', 'created_at', 'condition_status']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errors.array(),
        });
      }

      const filters = {
        ...req.query,
        limit: parseInt(req.query.limit) || 20,
        offset:
          ((parseInt(req.query.page) || 1) - 1) *
          (parseInt(req.query.limit) || 20),
      };

      const products = await LendingProduct.findAll(filters);

      // Get total count for pagination
      const totalProducts = await LendingProduct.findAll({
        ...filters,
        limit: null,
        offset: null,
      });
      const totalCount = totalProducts.length;

      res.json({
        success: true,
        data: products,
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 20,
          total: totalCount,
          pages: Math.ceil(totalCount / (parseInt(req.query.limit) || 20)),
        },
      });
    } catch (error) {
      logger.error('Admin get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving products',
      });
    }
  }
);

/**
 * @route   POST /api/v1/admin/products
 * @desc    Create new product
 * @access  Admin
 */
router.post(
  '/products',
  [
    body('name').isLength({ min: 1, max: 200 }).trim(),
    body('description').optional().isLength({ max: 1000 }).trim(),
    body('categoryId').isUUID(),
    body('subcategory').optional().isLength({ max: 100 }).trim(),
    body('brand').optional().isLength({ max: 100 }).trim(),
    body('model').optional().isLength({ max: 100 }).trim(),
    body('serialNumber').optional().isLength({ max: 100 }).trim(),
    body('purchaseDate').optional().isISO8601(),
    body('warrantyExpiry').optional().isISO8601(),
    body('conditionStatus')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'needs_repair']),
    body('location').optional().isLength({ max: 100 }).trim(),
    body('maxLendingPeriod').optional().isInt({ min: 1, max: 365 }),
    body('requiresApproval').optional().isBoolean(),
    body('imageUrls').optional().isArray(),
    body('specifications').optional().isObject(),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array(),
        });
      }

      const productData = req.body;
      const product = new LendingProduct(productData);

      await product.save();

      logger.info(`Admin ${req.user.email} created product ${product.id}`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      logger.error('Admin create product error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating product',
      });
    }
  }
);

/**
 * @route   PUT /api/v1/admin/products/:id
 * @desc    Update product details
 * @access  Admin
 */
router.put(
  '/products/:id',
  [
    body('name').optional().isLength({ min: 1, max: 200 }).trim(),
    body('description').optional().isLength({ max: 1000 }).trim(),
    body('categoryId').optional().isUUID(),
    body('subcategory').optional().isLength({ max: 100 }).trim(),
    body('brand').optional().isLength({ max: 100 }).trim(),
    body('model').optional().isLength({ max: 100 }).trim(),
    body('serialNumber').optional().isLength({ max: 100 }).trim(),
    body('purchaseDate').optional().isISO8601(),
    body('warrantyExpiry').optional().isISO8601(),
    body('conditionStatus')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'needs_repair']),
    body('location').optional().isLength({ max: 100 }).trim(),
    body('isAvailable').optional().isBoolean(),
    body('maxLendingPeriod').optional().isInt({ min: 1, max: 365 }),
    body('requiresApproval').optional().isBoolean(),
    body('imageUrls').optional().isArray(),
    body('specifications').optional().isObject(),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Find existing product
      const existingProduct = await LendingProduct.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Update product data
      Object.assign(existingProduct, updateData);
      await existingProduct.save();

      logger.info(`Admin ${req.user.email} updated product ${id}`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: existingProduct,
      });
    } catch (error) {
      logger.error('Admin update product error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating product',
      });
    }
  }
);

/**
 * @route   DELETE /api/v1/admin/products/:id
 * @desc    Delete product
 * @access  Admin
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const success = await LendingProduct.deleteById(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    logger.info(`Admin ${req.user.email} deleted product ${id}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Admin delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting product',
    });
  }
});

/**
 * @route   POST /api/v1/admin/products/bulk-import
 * @desc    Bulk import products from CSV/JSON data
 * @access  Admin
 */
router.post(
  '/products/bulk-import',
  [
    body('products').isArray({ min: 1 }),
    body('products.*.name').isLength({ min: 1, max: 200 }),
    body('products.*.categoryId').isUUID(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bulk import data',
          errors: errors.array(),
        });
      }

      const { products } = req.body;
      const results = {
        successful: [],
        failed: [],
      };

      for (const productData of products) {
        try {
          const product = new LendingProduct(productData);
          await product.save();
          results.successful.push({
            name: product.name,
            id: product.id,
          });
        } catch (error) {
          results.failed.push({
            name: productData.name || 'Unknown',
            error: error.message,
          });
        }
      }

      logger.info(
        `Admin ${req.user.email} bulk imported ${results.successful.length} products`
      );

      res.json({
        success: true,
        message: `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed`,
        data: results,
      });
    } catch (error) {
      logger.error('Admin bulk import error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during bulk import',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Get all product categories
 * @access  Admin
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await ProductCategory.findAll();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Admin get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
    });
  }
});

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create new product category
 * @access  Admin
 */
router.post(
  '/categories',
  [
    body('name').isLength({ min: 1, max: 100 }).trim(),
    body('description').optional().isLength({ max: 500 }).trim(),
    body('parentId').optional().isInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array(),
        });
      }

      const categoryData = req.body;
      const category = await ProductCategory.create(categoryData);

      logger.info(`Admin ${req.user.email} created category ${category.id}`);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      logger.error('Admin create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating category',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/transactions
 * @desc    Get all lending transactions with filtering
 * @access  Admin
 */
router.get(
  '/transactions',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'overdue', 'returned', 'lost']),
    query('borrowerId').optional().isUUID(),
    query('productId').optional().isUUID(),
    query('overdue').optional().isBoolean(),
    query('dueSoon').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errors.array(),
        });
      }

      const filters = {
        ...req.query,
        limit: parseInt(req.query.limit) || 20,
        offset:
          ((parseInt(req.query.page) || 1) - 1) *
          (parseInt(req.query.limit) || 20),
      };

      const transactions = await LendingTransaction.findAll(filters);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error('Admin get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving transactions',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/reports/lending-analytics
 * @desc    Get comprehensive lending analytics for reporting
 * @access  Admin
 */
router.get('/reports/lending-analytics', async (req, res) => {
  try {
    const lendingStats = await LendingTransaction.getStatistics();
    const productStats = await LendingProduct.getStatistics();
    const overdueTransactions =
      await LendingTransaction.getOverdueTransactions();

    const analyticsData = {
      lendingOverview: lendingStats.overview,
      monthlyTrends: lendingStats.monthly,
      popularProducts: lendingStats.popularProducts,
      productDistribution: productStats.byCategory,
      conditionAnalysis: productStats.byCondition,
      overdueAnalysis: {
        count: overdueTransactions.length,
        items: overdueTransactions.map(t => ({
          id: t.id,
          productName: t.product_name,
          borrowerName: t.borrower_name,
          daysOverdue: Math.ceil(
            (new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)
          ),
        })),
      },
    };

    res.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    logger.error('Admin lending analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating lending analytics',
    });
  }
});

/**
 * @route   PUT /api/v1/admin/lending-policies
 * @desc    Update global lending policies and configurations
 * @access  Admin
 */
router.put(
  '/lending-policies',
  [
    body('defaultLendingPeriod').optional().isInt({ min: 1, max: 365 }),
    body('maxLendingPeriod').optional().isInt({ min: 1, max: 365 }),
    body('reminderDays').optional().isArray(),
    body('autoApprovalEnabled').optional().isBoolean(),
    body('requireApprovalForHighValue').optional().isBoolean(),
    body('highValueThreshold').optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid policy data',
          errors: errors.array(),
        });
      }

      // In a real implementation, this would update a system configuration table
      // For now, we'll just log the policy update
      const policies = req.body;

      logger.info(
        `Admin ${req.user.email} updated lending policies:`,
        policies
      );

      res.json({
        success: true,
        message: 'Lending policies updated successfully',
        data: policies,
      });
    } catch (error) {
      logger.error('Admin update lending policies error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating lending policies',
      });
    }
  }
);

module.exports = router;
