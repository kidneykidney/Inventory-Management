const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../routes/notifications');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification API', () => {
  describe('POST /api/notifications/sprint', () => {
    test('should send sprint notification successfully', async () => {
      const notificationData = {
        sprintId: 'sprint-5',
        type: 'start',
        recipients: ['user1@example.com', 'user2@example.com'],
      };

      const response = await request(app)
        .post('/api/notifications/sprint')
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sprint notifications sent');
      expect(response.body.results).toHaveLength(2);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        type: 'start',
        recipients: ['user1@example.com'],
        // Missing sprintId
      };

      const response = await request(app)
        .post('/api/notifications/sprint')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Sprint ID is required');
    });

    test('should validate notification type', async () => {
      const invalidData = {
        sprintId: 'sprint-5',
        type: 'invalid-type',
        recipients: ['user1@example.com'],
      };

      const response = await request(app)
        .post('/api/notifications/sprint')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Invalid notification type');
    });

    test('should validate recipients array', async () => {
      const invalidData = {
        sprintId: 'sprint-5',
        type: 'start',
        recipients: 'not-an-array',
      };

      const response = await request(app)
        .post('/api/notifications/sprint')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Recipients must be an array');
    });
  });

  describe('POST /api/notifications/story', () => {
    test('should send story notification successfully', async () => {
      const notificationData = {
        storyId: 'story-123',
        type: 'assigned',
        recipients: ['developer@example.com'],
      };

      const response = await request(app)
        .post('/api/notifications/story')
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Story notifications sent');
      expect(response.body.results).toHaveLength(1);
    });

    test('should validate story notification type', async () => {
      const invalidData = {
        storyId: 'story-123',
        type: 'invalid-story-type',
        recipients: ['developer@example.com'],
      };

      const response = await request(app)
        .post('/api/notifications/story')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Invalid notification type');
    });
  });

  describe('GET /api/notifications/user/:userId', () => {
    test('should fetch user notifications', async () => {
      const userId = 'user1';

      const response = await request(app)
        .get(`/api/notifications/user/${userId}`)
        .expect(200);

      expect(response.body.notifications).toBeDefined();
      expect(response.body.unreadCount).toBeDefined();
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(typeof response.body.unreadCount).toBe('number');
    });
  });

  describe('PATCH /api/notifications/:notificationId/read', () => {
    test('should mark notification as read', async () => {
      // First, create a notification by sending a sprint notification
      await request(app)
        .post('/api/notifications/sprint')
        .send({
          sprintId: 'sprint-5',
          type: 'start',
          recipients: ['user1@example.com'],
        });

      // Get the notification ID (in a real test, you'd track this properly)
      const notificationId = Date.now();

      const response = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification marked as read');
    });

    test('should handle non-existent notification', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await request(app)
        .patch(`/api/notifications/${nonExistentId}/read`)
        .expect(404);

      expect(response.body.error).toBe('Notification not found');
    });
  });

  describe('PATCH /api/notifications/user/:userId/read-all', () => {
    test('should mark all user notifications as read', async () => {
      const userId = 'user1';

      const response = await request(app)
        .patch(`/api/notifications/user/${userId}/read-all`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All notifications marked as read');
    });
  });

  describe('POST /api/notifications/feedback', () => {
    test('should submit feedback successfully', async () => {
      const feedbackData = {
        type: 'sprint_review',
        category: 'team_performance',
        title: 'Great sprint!',
        description: 'The team worked very well together this sprint.',
        rating: 5,
        priority: 'medium',
        sprintId: 'sprint-5',
        anonymous: false,
      };

      const response = await request(app)
        .post('/api/notifications/feedback')
        .send(feedbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Feedback submitted successfully');
      expect(response.body.feedbackId).toBeDefined();
    });

    test('should validate required feedback fields', async () => {
      const invalidFeedback = {
        category: 'team_performance',
        rating: 5,
        // Missing type, title, and description
      };

      const response = await request(app)
        .post('/api/notifications/feedback')
        .send(invalidFeedback)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should handle feedback without sprint ID', async () => {
      const feedbackData = {
        type: 'general',
        title: 'General feedback',
        description: 'Some general feedback about the process.',
        priority: 'low',
      };

      const response = await request(app)
        .post('/api/notifications/feedback')
        .send(feedbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/notifications/feedback/sprint/:sprintId', () => {
    test('should fetch feedback for sprint', async () => {
      const sprintId = 'sprint-5';

      // First submit some feedback
      await request(app).post('/api/notifications/feedback').send({
        type: 'sprint_review',
        title: 'Sprint feedback',
        description: 'Feedback for the sprint',
        sprintId: sprintId,
      });

      const response = await request(app)
        .get(`/api/notifications/feedback/sprint/${sprintId}`)
        .expect(200);

      expect(response.body.feedback).toBeDefined();
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.feedback)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });

    test('should return empty array for sprint with no feedback', async () => {
      const sprintId = 'sprint-no-feedback';

      const response = await request(app)
        .get(`/api/notifications/feedback/sprint/${sprintId}`)
        .expect(200);

      expect(response.body.feedback).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('Email notification integration', () => {
    test('should handle email sending in development mode', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const notificationData = {
        sprintId: 'sprint-5',
        type: 'start',
        recipients: ['test@example.com'],
      };

      const response = await request(app)
        .post('/api/notifications/sprint')
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results[0].success).toBe(true);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    test('should create in-app notifications along with emails', async () => {
      const notificationData = {
        sprintId: 'sprint-5',
        type: 'end',
        recipients: ['user1@example.com'],
      };

      await request(app)
        .post('/api/notifications/sprint')
        .send(notificationData)
        .expect(200);

      // Check that in-app notification was created
      const userNotifications = await request(app)
        .get('/api/notifications/user/user1@example.com')
        .expect(200);

      expect(userNotifications.body.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/notifications/sprint')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express should handle malformed JSON automatically
    });

    test('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/notifications/sprint')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });
});
