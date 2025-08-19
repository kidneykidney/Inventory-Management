const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const reminderScheduler = require('../services/reminderScheduler');
const db = require('../config/database');
const logger = require('../utils/logger');

// Get notification history for a transaction
router.get('/transaction/:transactionId', 
  authenticateToken,
  param('transactionId').isInt().withMessage('Transaction ID must be an integer'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { transactionId } = req.params;
      const notifications = await notificationService.getNotificationHistory(transactionId);
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      logger.error('Error fetching notification history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification history'
      });
    }
  }
);

// Get failed notifications (admin only)
router.get('/failed',
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const limit = parseInt(req.query.limit) || 100;
      const failedNotifications = await notificationService.getFailedNotifications(limit);
      
      res.json({
        success: true,
        data: failedNotifications
      });
    } catch (error) {
      logger.error('Error fetching failed notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch failed notifications'
      });
    }
  }
);

// Retry failed notification (admin only)
router.post('/retry/:notificationId',
  authenticateToken,
  param('notificationId').isInt().withMessage('Notification ID must be an integer'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { notificationId } = req.params;
      const result = await notificationService.retryFailedNotification(notificationId);
      
      res.json({
        success: true,
        data: result,
        message: result.success ? 'Notification sent successfully' : 'Failed to send notification'
      });
    } catch (error) {
      logger.error('Error retrying notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry notification'
      });
    }
  }
);

// Send immediate reminder for a transaction (admin only)
router.post('/reminder/:transactionId',
  authenticateToken,
  param('transactionId').isInt().withMessage('Transaction ID must be an integer'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { transactionId } = req.params;
      await reminderScheduler.processImmediateReminder(transactionId);
      
      res.json({
        success: true,
        message: 'Reminder sent successfully'
      });
    } catch (error) {
      logger.error('Error sending immediate reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reminder'
      });
    }
  }
);

// Get notification statistics (admin only)
router.get('/stats',
  authenticateToken,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const days = parseInt(req.query.days) || 30;
      
      const statsQuery = `
        SELECT 
          type,
          status,
          COUNT(*) as count,
          DATE(sent_date) as date
        FROM email_notifications 
        WHERE sent_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY type, status, DATE(sent_date)
        ORDER BY date DESC, type, status
      `;

      const [stats] = await db.execute(statsQuery, [days]);

      // Get summary statistics
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_notifications,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          ROUND(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
        FROM email_notifications 
        WHERE sent_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `;

      const [summary] = await db.execute(summaryQuery, [days]);
      
      res.json({
        success: true,
        data: {
          summary: summary[0],
          details: stats
        }
      });
    } catch (error) {
      logger.error('Error fetching notification statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics'
      });
    }
  }
);

// Get scheduler status (admin only)
router.get('/scheduler/status',
  authenticateToken,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const status = reminderScheduler.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error fetching scheduler status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduler status'
      });
    }
  }
);

// Start/stop scheduler (admin only)
router.post('/scheduler/:action',
  authenticateToken,
  param('action').isIn(['start', 'stop']).withMessage('Action must be start or stop'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { action } = req.params;
      
      if (action === 'start') {
        reminderScheduler.start();
      } else {
        reminderScheduler.stop();
      }
      
      res.json({
        success: true,
        message: `Scheduler ${action}ed successfully`
      });
    } catch (error) {
      logger.error(`Error ${req.params.action}ing scheduler:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to ${req.params.action} scheduler`
      });
    }
  }
);

// Get user notification preferences
router.get('/preferences',
  authenticateToken,
  async (req, res) => {
    try {
      const query = `
        SELECT * FROM user_notification_preferences 
        WHERE user_id = ?
      `;
      
      const [preferences] = await db.execute(query, [req.user.id]);
      
      if (preferences.length === 0) {
        // Create default preferences if they don't exist
        const insertQuery = `
          INSERT INTO user_notification_preferences (user_id) 
          VALUES (?)
        `;
        await db.execute(insertQuery, [req.user.id]);
        
        // Fetch the newly created preferences
        const [newPreferences] = await db.execute(query, [req.user.id]);
        return res.json({
          success: true,
          data: newPreferences[0]
        });
      }
      
      res.json({
        success: true,
        data: preferences[0]
      });
    } catch (error) {
      logger.error('Error fetching notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification preferences'
      });
    }
  }
);

// Update user notification preferences
router.put('/preferences',
  authenticateToken,
  [
    body('email_enabled').optional().isBoolean().withMessage('Email enabled must be a boolean'),
    body('reminder_enabled').optional().isBoolean().withMessage('Reminder enabled must be a boolean'),
    body('overdue_enabled').optional().isBoolean().withMessage('Overdue enabled must be a boolean'),
    body('confirmation_enabled').optional().isBoolean().withMessage('Confirmation enabled must be a boolean'),
    body('reminder_days_before').optional().isInt({ min: 1, max: 30 }).withMessage('Reminder days must be between 1 and 30')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email_enabled,
        reminder_enabled,
        overdue_enabled,
        confirmation_enabled,
        reminder_days_before
      } = req.body;

      const updateFields = [];
      const updateValues = [];

      if (email_enabled !== undefined) {
        updateFields.push('email_enabled = ?');
        updateValues.push(email_enabled);
      }
      if (reminder_enabled !== undefined) {
        updateFields.push('reminder_enabled = ?');
        updateValues.push(reminder_enabled);
      }
      if (overdue_enabled !== undefined) {
        updateFields.push('overdue_enabled = ?');
        updateValues.push(overdue_enabled);
      }
      if (confirmation_enabled !== undefined) {
        updateFields.push('confirmation_enabled = ?');
        updateValues.push(confirmation_enabled);
      }
      if (reminder_days_before !== undefined) {
        updateFields.push('reminder_days_before = ?');
        updateValues.push(reminder_days_before);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateValues.push(req.user.id);

      const query = `
        UPDATE user_notification_preferences 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;

      await db.execute(query, updateValues);
      
      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences'
      });
    }
  }
);

module.exports = router;