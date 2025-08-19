const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Mock database - replace with actual database operations
const notifications = [];
const feedbacks = [];
const emailQueue = [];

// Email transporter configuration (mock for development)
const createEmailTransporter = () => {
  // In production, use actual email service credentials
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'test@example.com',
      pass: process.env.SMTP_PASS || 'password',
    },
  });
};

// Email templates
const emailTemplates = {
  sprintStart: sprintData => ({
    subject: `Sprint ${sprintData.number} has started - ${sprintData.name}`,
    html: `
      <h2>Sprint ${sprintData.number} Started</h2>
      <p>Hello Team,</p>
      <p>Sprint ${sprintData.number} "${sprintData.name}" has officially started!</p>
      <h3>Sprint Details:</h3>
      <ul>
        <li><strong>Duration:</strong> ${sprintData.duration} days</li>
        <li><strong>Goal:</strong> ${sprintData.goal}</li>
        <li><strong>Stories:</strong> ${sprintData.storyCount} stories planned</li>
      </ul>
      <p>Let's make this sprint a success!</p>
    `,
  }),
  sprintEnd: sprintData => ({
    subject: `Sprint ${sprintData.number} completed - Review scheduled`,
    html: `
      <h2>Sprint ${sprintData.number} Completed</h2>
      <p>Hello Team,</p>
      <p>Sprint ${sprintData.number} has been completed. Great work everyone!</p>
      <h3>Sprint Results:</h3>
      <ul>
        <li><strong>Stories Completed:</strong> ${sprintData.completedStories}/${sprintData.totalStories}</li>
        <li><strong>Velocity:</strong> ${sprintData.velocity} story points</li>
        <li><strong>Sprint Review:</strong> ${sprintData.reviewDate}</li>
      </ul>
      <p>Please join the sprint review and retrospective meetings.</p>
    `,
  }),
  storyAssigned: storyData => ({
    subject: `Story assigned: ${storyData.title}`,
    html: `
      <h2>New Story Assignment</h2>
      <p>Hello ${storyData.assignee},</p>
      <p>You have been assigned a new story:</p>
      <h3>${storyData.title}</h3>
      <p><strong>Description:</strong> ${storyData.description}</p>
      <p><strong>Story Points:</strong> ${storyData.storyPoints}</p>
      <p><strong>Priority:</strong> ${storyData.priority}</p>
      <p>Please review the acceptance criteria and start working on this story.</p>
    `,
  }),
};

// Send sprint notification
router.post(
  '/sprint',
  [
    body('sprintId').notEmpty().withMessage('Sprint ID is required'),
    body('type')
      .isIn(['start', 'end', 'review', 'retrospective'])
      .withMessage('Invalid notification type'),
    body('recipients').isArray().withMessage('Recipients must be an array'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sprintId, type, recipients } = req.body;

      // Mock sprint data - replace with actual database query
      const sprintData = {
        id: sprintId,
        number: 5,
        name: 'Notification System Implementation',
        duration: 14,
        goal: 'Implement comprehensive notification system',
        storyCount: 12,
        completedStories: 10,
        totalStories: 12,
        velocity: 42,
        reviewDate: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toLocaleDateString(),
      };

      // Create email content based on type
      let emailContent;
      switch (type) {
        case 'start':
          emailContent = emailTemplates.sprintStart(sprintData);
          break;
        case 'end':
          emailContent = emailTemplates.sprintEnd(sprintData);
          break;
        default:
          emailContent = {
            subject: `Sprint ${sprintData.number} - ${type}`,
            html: `<p>Sprint ${sprintData.number} ${type} notification</p>`,
          };
      }

      // Send emails to recipients
      const transporter = createEmailTransporter();
      const emailPromises = recipients.map(async recipient => {
        try {
          // In development, just log the email instead of sending
          if (process.env.NODE_ENV === 'development') {
            logger.info(`Email would be sent to ${recipient}:`, emailContent);
            return { success: true, recipient };
          }

          await transporter.sendMail({
            from: process.env.FROM_EMAIL || 'noreply@agileproject.com',
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.html,
          });

          return { success: true, recipient };
        } catch (error) {
          logger.error(`Failed to send email to ${recipient}:`, error);
          return { success: false, recipient, error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);

      // Create in-app notifications
      recipients.forEach(recipient => {
        const notification = {
          id: Date.now() + Math.random(),
          userId: recipient,
          type: 'info',
          title: emailContent.subject,
          message: `Sprint ${sprintData.number} ${type} notification`,
          isRead: false,
          createdAt: new Date().toISOString(),
          sprintId,
        };
        notifications.push(notification);
      });

      res.json({
        success: true,
        message: 'Sprint notifications sent',
        results,
      });
    } catch (error) {
      logger.error('Failed to send sprint notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

// Send story notification
router.post(
  '/story',
  [
    body('storyId').notEmpty().withMessage('Story ID is required'),
    body('type')
      .isIn(['assigned', 'completed', 'blocked'])
      .withMessage('Invalid notification type'),
    body('recipients').isArray().withMessage('Recipients must be an array'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { storyId, type, recipients } = req.body;

      // Mock story data - replace with actual database query
      const storyData = {
        id: storyId,
        title: 'Implement notification center component',
        description:
          'Create a notification center with dropdown menu and real-time updates',
        storyPoints: 5,
        priority: 'high',
        assignee: recipients[0], // Assuming first recipient is assignee
      };

      const emailContent = emailTemplates.storyAssigned(storyData);

      // Send emails and create notifications
      const transporter = createEmailTransporter();
      const results = await Promise.all(
        recipients.map(async recipient => {
          try {
            if (process.env.NODE_ENV === 'development') {
              logger.info(
                `Story email would be sent to ${recipient}:`,
                emailContent
              );
              return { success: true, recipient };
            }

            await transporter.sendMail({
              from: process.env.FROM_EMAIL || 'noreply@agileproject.com',
              to: recipient,
              subject: emailContent.subject,
              html: emailContent.html,
            });

            return { success: true, recipient };
          } catch (error) {
            logger.error(`Failed to send story email to ${recipient}:`, error);
            return { success: false, recipient, error: error.message };
          }
        })
      );

      // Create in-app notifications
      recipients.forEach(recipient => {
        const notification = {
          id: Date.now() + Math.random(),
          userId: recipient,
          type: type === 'blocked' ? 'warning' : 'info',
          title: `Story ${type}: ${storyData.title}`,
          message: `Story has been ${type}`,
          isRead: false,
          createdAt: new Date().toISOString(),
          storyId,
        };
        notifications.push(notification);
      });

      res.json({
        success: true,
        message: 'Story notifications sent',
        results,
      });
    } catch (error) {
      logger.error('Failed to send story notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

// Get user notifications
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userNotifications = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    res.json({
      notifications: userNotifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = notifications.find(
      n => n.id === parseInt(notificationId)
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read for user
router.patch('/user/:userId/read-all', (req, res) => {
  try {
    const { userId } = req.params;

    notifications
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => (n.isRead = true));

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Submit feedback
router.post(
  '/feedback',
  [
    body('type').notEmpty().withMessage('Feedback type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('sprintId').optional(),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const feedback = {
        id: Date.now() + Math.random(),
        ...req.body,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      };

      feedbacks.push(feedback);

      // Create notification for admin/stakeholders about new feedback
      const adminNotification = {
        id: Date.now() + Math.random(),
        userId: 'admin', // Replace with actual admin user IDs
        type: 'info',
        title: 'New Feedback Submitted',
        message: `New ${feedback.type} feedback: ${feedback.title}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        feedbackId: feedback.id,
      };
      notifications.push(adminNotification);

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: feedback.id,
      });
    } catch (error) {
      logger.error('Failed to submit feedback:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }
);

// Get feedback for sprint
router.get('/feedback/sprint/:sprintId', (req, res) => {
  try {
    const { sprintId } = req.params;
    const sprintFeedback = feedbacks
      .filter(f => f.sprintId === sprintId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      feedback: sprintFeedback,
      count: sprintFeedback.length,
    });
  } catch (error) {
    logger.error('Failed to fetch feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

module.exports = router;
