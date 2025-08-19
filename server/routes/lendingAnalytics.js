const express = require('express');
const router = express.Router();
const { LendingAnalytics } = require('../models/lendingAnalyticsModels');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/lending-analytics/overview
 * Get lending statistics overview
 */
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const overview = await LendingAnalytics.getOverviewStatistics();

    logger.info('Lending overview statistics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Error retrieving lending overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending overview',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/trends
 * Get lending trends over time
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '12months', groupBy = 'month' } = req.query;

    const trends = await LendingAnalytics.getLendingTrends({
      period,
      groupBy
    });

    logger.info('Lending trends retrieved', {
      period,
      groupBy,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: trends,
      meta: {
        period,
        groupBy,
        count: trends.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving lending trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lending trends',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/popular-products
 * Get popular products analytics
 */
router.get('/popular-products', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { limit = 10, period = '12months' } = req.query;

    const popularProducts = await LendingAnalytics.getPopularProducts({
      limit: parseInt(limit),
      period
    });

    logger.info('Popular products analytics retrieved', {
      limit,
      period,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: popularProducts,
      meta: {
        limit: parseInt(limit),
        period,
        count: popularProducts.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving popular products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular products',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/categories
 * Get category analytics
 */
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const categoryAnalytics = await LendingAnalytics.getCategoryAnalytics();

    logger.info('Category analytics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: categoryAnalytics,
      meta: {
        count: categoryAnalytics.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving category analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/user-behavior
 * Get user behavior analytics
 */
router.get('/user-behavior', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { limit = 10 } = req.query;

    const userBehavior = await LendingAnalytics.getUserBehaviorAnalytics({
      limit: parseInt(limit)
    });

    logger.info('User behavior analytics retrieved', {
      limit,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: userBehavior,
      meta: {
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error retrieving user behavior analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user behavior analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/overdue
 * Get overdue analytics
 */
router.get('/overdue', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const overdueAnalytics = await LendingAnalytics.getOverdueAnalytics();

    logger.info('Overdue analytics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: overdueAnalytics
    });
  } catch (error) {
    logger.error('Error retrieving overdue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/predictive
 * Get predictive analytics for popular items and lending patterns
 */
router.get('/predictive', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const predictiveAnalytics = await LendingAnalytics.getPredictiveAnalytics();

    logger.info('Predictive analytics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: predictiveAnalytics
    });
  } catch (error) {
    logger.error('Error retrieving predictive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve predictive analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/performance
 * Get performance metrics for lending system efficiency
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const performanceMetrics = await LendingAnalytics.getPerformanceMetrics();

    logger.info('Performance metrics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    logger.error('Error retrieving performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/report
 * Generate comprehensive analytics report
 */
router.get('/report', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { includeDetails = 'true', format = 'json' } = req.query;

    const report = await LendingAnalytics.generateAnalyticsReport({
      includeDetails: includeDetails === 'true'
    });

    logger.info('Analytics report generated', {
      includeDetails: includeDetails === 'true',
      format,
      userId: req.user.id
    });

    if (format === 'json') {
      res.json({
        success: true,
        data: report
      });
    } else {
      // Future: Add CSV/PDF export functionality
      res.status(400).json({
        success: false,
        message: 'Only JSON format is currently supported'
      });
    }
  } catch (error) {
    logger.error('Error generating analytics report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics report',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/usage-statistics
 * Get usage statistics for specific time periods
 */
router.get('/usage-statistics', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { startDate, endDate, categoryId, userId } = req.query;

    // Build custom query based on filters
    let query = `
      SELECT 
        DATE(lt.lend_date) as date,
        COUNT(*) as total_lendings,
        COUNT(DISTINCT lt.borrower_id) as unique_borrowers,
        COUNT(DISTINCT lt.product_id) as unique_products,
        SUM(CASE WHEN lt.status = 'returned' THEN 1 ELSE 0 END) as returned_count,
        SUM(CASE WHEN lt.status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
        AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_lending_period
      FROM lending_transactions lt
      JOIN lending_products lp ON lt.product_id = lp.id
      WHERE 1=1
    `;

    const params = [];

    if (startDate) {
      query += ' AND lt.lend_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND lt.lend_date <= ?';
      params.push(endDate);
    }

    if (categoryId) {
      query += ' AND lp.category_id = ?';
      params.push(categoryId);
    }

    if (userId) {
      query += ' AND lt.borrower_id = ?';
      params.push(userId);
    }

    query += ' GROUP BY DATE(lt.lend_date) ORDER BY date DESC';

    const { pool } = require('../config/database');
    const [results] = await pool.execute(query, params);

    logger.info('Usage statistics retrieved', {
      startDate,
      endDate,
      categoryId,
      userId,
      resultCount: results.length,
      requestUserId: req.user.id
    });

    res.json({
      success: true,
      data: results,
      meta: {
        filters: {
          startDate,
          endDate,
          categoryId,
          userId
        },
        count: results.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving usage statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve usage statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/lending-analytics/overdue-tracking
 * Get detailed overdue tracking with escalation information
 */
router.get('/overdue-tracking', authenticateToken, async (req, res) => {
  try {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { pool } = require('../config/database');
    
    // Get detailed overdue tracking information
    const [overdueTracking] = await pool.execute(`
      SELECT 
        lt.id as transaction_id,
        lt.lend_date,
        lt.due_date,
        DATEDIFF(CURDATE(), lt.due_date) as days_overdue,
        lp.name as product_name,
        lp.brand,
        lp.model,
        u.username as borrower_name,
        u.email as borrower_email,
        pc.name as category_name,
        COUNT(en.id) as reminders_sent,
        MAX(en.sent_date) as last_reminder_sent,
        CASE 
          WHEN DATEDIFF(CURDATE(), lt.due_date) <= 7 THEN 'Low'
          WHEN DATEDIFF(CURDATE(), lt.due_date) <= 14 THEN 'Medium'
          WHEN DATEDIFF(CURDATE(), lt.due_date) <= 30 THEN 'High'
          ELSE 'Critical'
        END as escalation_level
      FROM lending_transactions lt
      JOIN lending_products lp ON lt.product_id = lp.id
      JOIN users u ON lt.borrower_id = u.id
      LEFT JOIN product_categories pc ON lp.category_id = pc.id
      LEFT JOIN email_notifications en ON lt.id = en.transaction_id 
        AND en.notification_type IN ('reminder', 'overdue')
      WHERE lt.status = 'overdue'
      GROUP BY lt.id, lt.lend_date, lt.due_date, lp.name, lp.brand, lp.model, 
               u.username, u.email, pc.name
      ORDER BY days_overdue DESC
    `);

    logger.info('Overdue tracking retrieved', {
      count: overdueTracking.length,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: overdueTracking,
      meta: {
        count: overdueTracking.length,
        escalationLevels: {
          low: overdueTracking.filter(item => item.escalation_level === 'Low').length,
          medium: overdueTracking.filter(item => item.escalation_level === 'Medium').length,
          high: overdueTracking.filter(item => item.escalation_level === 'High').length,
          critical: overdueTracking.filter(item => item.escalation_level === 'Critical').length
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving overdue tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue tracking',
      error: error.message
    });
  }
});

module.exports = router;