/**
 * Authentication routes
 * Handles user login, registration, and authentication
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { User, UserSession } = require('../models/userModels');
const { 
  authenticateToken, 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} = require('../middleware/auth');
const { 
  validateInput, 
  authRateLimit, 
  validationRules 
} = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', 
  authRateLimit,
  [
    validationRules.email,
    validationRules.password
  ],
  validateInput,
  async (req, res) => {
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

    const { email, password } = req.body;

    // Verify user credentials
    const userId = await User.verifyPassword(email, password);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await UserSession.create({
      userId: user.id,
      token: accessToken,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt
    });

    // Update last login
    await User.updateLastLogin(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('name').isLength({ min: 2 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'user']),
  body('department').optional().trim()
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
      role: role || 'user',
      department,
      phone,
      address,
      emailVerified: false
    };

    const user = await User.create(userData);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

/**
 * @route   GET /api/v1/auth/user
 * @desc    Get current user data
 * @access  Private
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user data'
    });
  }
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  body('name').optional().isLength({ min: 2 }).trim(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('department').optional().trim()
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

    const { name, phone, address, department } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (department) updateData.department = department;

    const updatedUser = await User.update(req.user.id, updateData);

    logger.info(`User profile updated: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
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

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValidPassword = await User.verifyPassword(req.user.email, currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await User.update(req.user.id, { password: newPassword });

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', [
  body('refreshToken').notEmpty()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateToken(user);

    // Create new session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await UserSession.create({
      userId: user.id,
      token: accessToken,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt
    });

    res.json({
      success: true,
      token: accessToken,
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Delete session
    await UserSession.delete(req.token);

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

module.exports = router;
