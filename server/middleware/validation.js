const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

/**
 * Input validation middleware
 */
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .substring(0, 1000); // Limit length
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

/**
 * Rate limiting configurations
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests');
const strictRateLimit = createRateLimit(15 * 60 * 1000, 10, 'Too many requests to sensitive endpoint');

/**
 * Common validation rules
 */
const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8+ characters with uppercase, lowercase, number, and special character'),
  
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  
  name: body('name')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Name must be 1-100 characters, alphanumeric with spaces, hyphens, underscores only'),
  
  description: body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  storyPoints: body('storyPoints')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Story points must be between 0 and 100'),
  
  status: body('status')
    .isIn(['backlog', 'todo', 'in-progress', 'review', 'done'])
    .withMessage('Invalid status'),
  
  priority: body('priority')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  
  quantity: body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer'),
  
  price: body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  search: query('search')
    .optional()
    .isLength({ max: 200 })
    .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
    .withMessage('Search query contains invalid characters'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  offset: query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
};

module.exports = {
  validateInput,
  sanitizeInput,
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  validationRules
};