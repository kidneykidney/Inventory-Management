/**
 * User Management routes
 * Handles user CRUD operations and admin functions
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();
const { User } = require('../models/userModels');
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', [
  authenticateToken,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'user']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      role: req.query.role,
      status: req.query.status,
      search: req.query.search
    };

    const result = await User.findAll(options);

    res.json({
      success: true,
      data: result.users.map(user => user.toJSON()),
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const stats = await User.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user statistics'
    });
  }
});

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin or accessing own profile
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user'
    });
  }
});

/**
 * @route   POST /api/v1/users
 * @desc    Create new user (admin only)
 * @access  Private (Admin)
 */
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name').isLength({ min: 2 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'user']),
  body('department').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { name, email, password, role, department, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role,
      department,
      phone,
      address,
      emailVerified: true // Admin-created users are pre-verified
    };

    const user = await User.create(userData);

    logger.info(`User created by admin: ${email} (created by: ${req.user.email})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toJSON()
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating user'
    });
  }
});

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (admin only or own profile)
 * @access  Private
 */
router.put('/:id', [
  authenticateToken,
  body('name').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'user']),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('department').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, role, status, department, phone, address } = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === id;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (department) updateData.department = department;

    // Only admins can update email, role, and status
    if (isAdmin) {
      if (email) {
        // Check if email is already taken by another user
        const emailUser = await User.findByEmail(email);
        if (emailUser && emailUser.id !== id) {
          return res.status(409).json({
            success: false,
            message: 'Email already taken by another user'
          });
        }
        updateData.email = email;
      }
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }

    // Update user
    const updatedUser = await User.update(id, updateData);

    logger.info(`User updated: ${existingUser.email} (updated by: ${req.user.email})`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete user
    await User.delete(id);

    logger.info(`User deleted: ${user.email} (deleted by: ${req.user.email})`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Update user status (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/status', [
  authenticateToken,
  requireAdmin,
  body('status').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from suspending themselves
    if (req.user.id === id && status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own account status'
      });
    }

    // Update status
    const updatedUser = await User.update(id, { status });

    logger.info(`User status updated: ${user.email} -> ${status} (by: ${req.user.email})`);

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/role', [
  authenticateToken,
  requireAdmin,
  body('role').isIn(['admin', 'user'])
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update role
    const updatedUser = await User.update(id, { role });

    logger.info(`User role updated: ${user.email} -> ${role} (by: ${req.user.email})`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
});

module.exports = router;