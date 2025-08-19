const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../utils/logger');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'OK',
        memory: 'OK',
        disk: 'OK',
      },
    };

    // Check database connection
    try {
      await pool.execute('SELECT 1');
      healthCheck.checks.database = 'OK';
    } catch (dbError) {
      healthCheck.checks.database = 'ERROR';
      healthCheck.status = 'ERROR';
      logger.error('Database health check failed:', dbError);
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    healthCheck.memory = memUsageMB;

    // Memory threshold check (500MB)
    if (memUsageMB.heapUsed > 500) {
      healthCheck.checks.memory = 'WARNING';
    }

    // CPU usage check
    const cpuUsage = process.cpuUsage();
    healthCheck.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system,
    };

    // Response time
    const responseTime = Date.now() - req.startTime;
    healthCheck.responseTime = `${responseTime}ms`;

    // Set appropriate status code
    const statusCode = healthCheck.status === 'OK' ? 200 : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Detailed health check with more comprehensive checks
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {},
      metrics: {},
    };

    // Database connection pool status
    try {
      const [poolStatus] = await pool.execute(
        'SHOW STATUS WHERE Variable_name IN ("Threads_connected", "Max_used_connections", "Aborted_connects")'
      );
      detailedHealth.checks.database = 'OK';
      detailedHealth.metrics.database = poolStatus.reduce((acc, row) => {
        acc[row.Variable_name] = row.Value;
        return acc;
      }, {});
    } catch (dbError) {
      detailedHealth.checks.database = 'ERROR';
      detailedHealth.status = 'ERROR';
      logger.error('Database detailed check failed:', dbError);
    }

    // System metrics
    const memUsage = process.memoryUsage();
    detailedHealth.metrics.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    // Process information
    detailedHealth.metrics.process = {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };

    // Environment variables (safe ones only)
    detailedHealth.metrics.environment = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DB_HOST: process.env.DB_HOST ? '***' : 'not set',
      DB_NAME: process.env.DB_NAME ? '***' : 'not set',
    };

    res.json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Readiness probe - checks if the service is ready to serve traffic
router.get('/ready', async (req, res) => {
  try {
    // Check database connectivity
    await pool.execute('SELECT 1');

    // Check if critical tables exist
    const [tables] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('users', 'products', 'inventory')
    `);

    if (tables[0].count < 3) {
      throw new Error('Critical tables missing');
    }

    res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Liveness probe - checks if the service is alive
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
