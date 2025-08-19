const helmet = require('helmet');
const cors = require('cors');

/**
 * CSRF Protection middleware
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and API health checks
  if (req.method === 'GET' || req.path === '/api/v1/health') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }

  next();
};

/**
 * Generate CSRF token
 */
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

/**
 * Enhanced CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['X-CSRF-Token'],
};

/**
 * Enhanced Helmet configuration
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

/**
 * Request logging for security monitoring
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Security Alert:', logData);
    }
  });

  next();
};

/**
 * IP-based blocking (basic implementation)
 */
const ipBlocking = (req, res, next) => {
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
  const clientIP = req.ip;

  if (blockedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  next();
};

module.exports = {
  csrfProtection,
  generateCSRFToken,
  corsOptions,
  helmetConfig,
  securityLogger,
  ipBlocking,
  enhancedCors: cors(corsOptions),
  enhancedHelmet: helmet(helmetConfig),
};
