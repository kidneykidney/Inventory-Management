const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const config = require('./config/config');
const { initDatabase } = require('./config/database');
const logger = require('./utils/logger');
const performanceMonitor = require('./utils/performanceMonitor');

// Import security middleware
const { 
  enhancedHelmet, 
  enhancedCors, 
  securityLogger, 
  ipBlocking,
  generateCSRFToken 
} = require('./middleware/security');
const { 
  sanitizeInput, 
  apiRateLimit 
} = require('./middleware/validation');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const lendingRoutes = require('./routes/lending');
const lendingProductRoutes = require('./routes/lendingProducts');
const lendingTransactionRoutes = require('./routes/lendingTransactions');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const agileRoutes = require('./routes/agile');
const sprintRoutes = require('./routes/sprints');
const performanceRoutes = require('./routes/performance');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const lendingAnalyticsRoutes = require('./routes/lendingAnalytics');
const adminRoutes = require('./routes/admin');
const emailNotificationRoutes = require('./routes/emailNotifications');

/**
 * Initialize Express application
 */
const app = express();

/**
 * Middleware setup
 */
// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Session middleware for CSRF protection
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Enhanced security middleware
app.use(enhancedHelmet);
app.use(enhancedCors);
app.use(securityLogger);
app.use(ipBlocking);
app.use(compression());

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api/', apiRateLimit);

// CSRF token generation
app.use(generateCSRFToken);

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      status: 'error',
      message: options.message,
    });
  },
});
app.use('/api', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(morgan('dev'));

// Performance monitoring middleware
app.use(performanceMonitor.trackRequest);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * API routes
 */
// Health check routes (no API prefix for easier monitoring)
app.use('/api/health', healthRoutes);

const apiPrefix = `${config.api.prefix}${config.api.version}`;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/inventory`, inventoryRoutes);
app.use(`${apiPrefix}/lending`, lendingRoutes);
app.use(`${apiPrefix}/lending/products`, lendingProductRoutes);
app.use(`${apiPrefix}/lending-transactions`, lendingTransactionRoutes);
app.use(`${apiPrefix}/categories`, categoryRoutes);
app.use(`${apiPrefix}/suppliers`, supplierRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/reports`, reportRoutes);
app.use(`${apiPrefix}/agile`, agileRoutes);
app.use(`${apiPrefix}/sprints`, sprintRoutes);
app.use(`${apiPrefix}/performance`, performanceRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/lending-analytics`, lendingAnalyticsRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);
app.use(`${apiPrefix}/email-notifications`, emailNotificationRoutes);

/**
 * Serve static files in production
 */
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../build')));

  // For any route not handled by API, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  logger.error('Server error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Try to initialize database connection
    try {
      await initDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, running in development mode without database:', dbError.message);
    }

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    // Start email reminder scheduler (only if database is available)
    try {
      const reminderScheduler = require('./services/reminderScheduler');
      reminderScheduler.start();
    } catch (schedulerError) {
      logger.warn('Email scheduler not started:', schedulerError.message);
    }

    // Start the server
    const PORT = config.server.port;
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${config.server.env} mode on port ${PORT}`
      );
    });

    // Configure server timeouts
    server.timeout = 120000; // 2 minute timeout
    server.keepAliveTimeout = 60000; // 1 minute keep-alive

    // Handle server errors
    server.on('error', error => {
      logger.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Port ${PORT} is already in use. Trying again in 10 seconds...`
        );
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 10000);
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    function gracefulShutdown() {
      logger.info('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });

      // Force close after 30 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error(
          'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 30000);
    }
  } catch (error) {
    logger.error('Failed to start the server', error);
    process.exit(1);
  }
};

// Start the server
startServer();
