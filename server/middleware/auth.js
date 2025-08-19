/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { User, UserSession } = require('../models/userModels');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if session exists and is valid
    const session = await UserSession.findByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Get user data
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin Only Middleware
 * Shorthand for requiring admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Optional Authentication Middleware
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'inventory-management-system'
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', options);
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  const options = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'inventory-management-system'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', options);
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};