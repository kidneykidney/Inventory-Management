const request = require('supertest');
const express = require('express');
const emailNotificationRoutes = require('../emailNotifications');
const auth = require('../../middleware/auth');
const db = require('../../config/database');
const notificationService = require('../../services/notificationService');
const reminderScheduler = require('../../services/reminderScheduler');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/notificationService');
jest.mock('../../services/reminderScheduler');
jest.mock('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/email-notifications', emailNotificationRoutes);

describe('Email Notifications API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth middleware to always authenticate as admin
    auth.mockImplementation((req, res, next) => {
      req.user = { id: 1, role: 'admin' };
      next();
    });
  });

  describe('GET /api/email-notifications/transaction/:transactionId', () => {
    it('should get notification history for a transaction', async () => {
      const mockHistory = [
        {
          id: 1,
          type: 'lending_confirmation',
          recipient_email: 'user@example.com',
          subject: 'Lending Confirmation',
          status: 'sent',
          sent_date: new Date(),
        },
      ];

      notificationService.getNotificationHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/email-notifications/transaction/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
      expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(
        '123'
      );
    });

    it('should handle invalid transaction ID', async () => {
      const response = await request(app)
        .get('/api/email-notifications/transaction/invalid')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/email-notifications/failed', () => {
    it('should get failed notifications for admin', async () => {
      const mockFailedNotifications = [
        {
          id: 1,
          type: 'return_reminder',
          recipient_email: 'user@example.com',
          status: 'failed',
          error_message: 'SMTP connection failed',
        },
      ];

      notificationService.getFailedNotifications.mockResolvedValue(
        mockFailedNotifications
      );

      const response = await request(app)
        .get('/api/email-notifications/failed?limit=50')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockFailedNotifications);
      expect(notificationService.getFailedNotifications).toHaveBeenCalledWith(
        50
      );
    });

    it('should deny access for non-admin users', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      });

      const response = await request(app)
        .get('/api/email-notifications/failed')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin role required');
    });
  });

  describe('POST /api/email-notifications/retry/:notificationId', () => {
    it('should retry failed notification for admin', async () => {
      notificationService.retryFailedNotification.mockResolvedValue({
        success: true,
        messageId: 'retry-message-id',
      });

      const response = await request(app)
        .post('/api/email-notifications/retry/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');
      expect(notificationService.retryFailedNotification).toHaveBeenCalledWith(
        '123'
      );
    });

    it('should handle retry failure', async () => {
      notificationService.retryFailedNotification.mockResolvedValue({
        success: false,
        error: 'SMTP still unavailable',
      });

      const response = await request(app)
        .post('/api/email-notifications/retry/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Failed to send');
    });
  });

  describe('POST /api/email-notifications/reminder/:transactionId', () => {
    it('should send immediate reminder for admin', async () => {
      reminderScheduler.processImmediateReminder.mockResolvedValue();

      const response = await request(app)
        .post('/api/email-notifications/reminder/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');
      expect(reminderScheduler.processImmediateReminder).toHaveBeenCalledWith(
        '123'
      );
    });

    it('should handle reminder failure', async () => {
      reminderScheduler.processImmediateReminder.mockRejectedValue(
        new Error('Transaction not found')
      );

      const response = await request(app)
        .post('/api/email-notifications/reminder/999')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to send reminder');
    });
  });

  describe('GET /api/email-notifications/stats', () => {
    it('should get notification statistics for admin', async () => {
      const mockStats = [
        {
          type: 'lending_confirmation',
          status: 'sent',
          count: 10,
          date: '2024-01-15',
        },
        {
          type: 'return_reminder',
          status: 'sent',
          count: 5,
          date: '2024-01-15',
        },
      ];

      const mockSummary = {
        total_notifications: 15,
        sent_count: 15,
        failed_count: 0,
        success_rate: 100,
      };

      db.execute
        .mockResolvedValueOnce([mockStats])
        .mockResolvedValueOnce([mockSummary]);

      const response = await request(app)
        .get('/api/email-notifications/stats?days=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toEqual(mockSummary);
      expect(response.body.data.details).toEqual(mockStats);
    });

    it('should use default period when not specified', async () => {
      db.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{}]);

      await request(app).get('/api/email-notifications/stats').expect(200);

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INTERVAL ? DAY'),
        [30]
      );
    });
  });

  describe('GET /api/email-notifications/scheduler/status', () => {
    it('should get scheduler status for admin', async () => {
      const mockStatus = {
        isRunning: true,
        activeJobs: ['reminders', 'overdue'],
        nextReminderRun: new Date().toISOString(),
        nextOverdueRun: new Date().toISOString(),
      };

      reminderScheduler.getStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/api/email-notifications/scheduler/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatus);
    });
  });

  describe('POST /api/email-notifications/scheduler/:action', () => {
    it('should start scheduler for admin', async () => {
      reminderScheduler.start.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/email-notifications/scheduler/start')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('started successfully');
      expect(reminderScheduler.start).toHaveBeenCalled();
    });

    it('should stop scheduler for admin', async () => {
      reminderScheduler.stop.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/email-notifications/scheduler/stop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('stopped successfully');
      expect(reminderScheduler.stop).toHaveBeenCalled();
    });

    it('should reject invalid actions', async () => {
      const response = await request(app)
        .post('/api/email-notifications/scheduler/invalid')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/email-notifications/preferences', () => {
    it('should get user notification preferences', async () => {
      const mockPreferences = {
        id: 1,
        user_id: 1,
        email_enabled: true,
        reminder_enabled: true,
        overdue_enabled: true,
        confirmation_enabled: true,
        reminder_days_before: 3,
      };

      db.execute.mockResolvedValue([[mockPreferences]]);

      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      });

      const response = await request(app)
        .get('/api/email-notifications/preferences')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPreferences);
    });

    it('should create default preferences if none exist', async () => {
      db.execute
        .mockResolvedValueOnce([[]]) // No existing preferences
        .mockResolvedValueOnce([]) // Insert new preferences
        .mockResolvedValueOnce([
          [
            {
              // Fetch newly created preferences
              id: 1,
              user_id: 1,
              email_enabled: true,
              reminder_enabled: true,
              overdue_enabled: true,
              confirmation_enabled: true,
              reminder_days_before: 3,
            },
          ],
        ]);

      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      });

      const response = await request(app)
        .get('/api/email-notifications/preferences')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_notification_preferences'),
        [1]
      );
    });
  });

  describe('PUT /api/email-notifications/preferences', () => {
    it('should update user notification preferences', async () => {
      db.execute.mockResolvedValue([]);

      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      });

      const updateData = {
        email_enabled: false,
        reminder_enabled: false,
        reminder_days_before: 5,
      };

      const response = await request(app)
        .put('/api/email-notifications/preferences')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_notification_preferences'),
        [false, false, 5, 1]
      );
    });

    it('should validate preference values', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      });

      const invalidData = {
        email_enabled: 'invalid',
        reminder_days_before: 50,
      };

      const response = await request(app)
        .put('/api/email-notifications/preferences')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle empty update data', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      });

      const response = await request(app)
        .put('/api/email-notifications/preferences')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No valid fields to update');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      db.execute.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/email-notifications/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch');
    });

    it('should handle service errors gracefully', async () => {
      notificationService.getFailedNotifications.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .get('/api/email-notifications/failed')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
