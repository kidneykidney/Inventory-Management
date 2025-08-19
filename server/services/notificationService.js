const emailService = require('./emailService');
const emailTemplateService = require('./emailTemplateService');
const logger = require('../utils/logger');
const db = require('../config/database');

class NotificationService {
  constructor() {
    this.notificationTypes = {
      LENDING_CONFIRMATION: 'lending_confirmation',
      RETURN_REMINDER: 'return_reminder',
      OVERDUE_NOTICE: 'overdue_notice',
      RETURN_CONFIRMATION: 'return_confirmation',
      LENDING_REQUEST_APPROVAL: 'lending_request_approval'
    };
  }

  async sendLendingConfirmation(lendingTransaction, userEmail, userName) {
    try {
      const templateData = {
        borrowerName: userName,
        productName: lendingTransaction.productName,
        lendDate: lendingTransaction.lendDate,
        dueDate: lendingTransaction.dueDate,
        productSpecs: lendingTransaction.productSpecs,
        lendingId: lendingTransaction.id
      };

      const emailTemplate = emailTemplateService.generateTemplate(
        emailTemplateService.templates.LENDING_CONFIRMATION,
        templateData
      );

      const emailData = {
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await emailService.sendEmail(emailData);
      
      // Log the notification
      await this.logNotification({
        type: this.notificationTypes.LENDING_CONFIRMATION,
        recipientEmail: userEmail,
        subject: emailTemplate.subject,
        status: result.success ? 'sent' : 'failed',
        transactionId: lendingTransaction.id,
        errorMessage: result.error || null
      });

      return result;
    } catch (error) {
      logger.error('Failed to send lending confirmation:', error);
      throw error;
    }
  }

  async sendReturnReminder(lendingTransaction, userEmail, userName) {
    try {
      const dueDate = new Date(lendingTransaction.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      const templateData = {
        borrowerName: userName,
        productName: lendingTransaction.productName,
        dueDate: lendingTransaction.dueDate,
        daysUntilDue: daysUntilDue,
        lendingId: lendingTransaction.id
      };

      const emailTemplate = emailTemplateService.generateTemplate(
        emailTemplateService.templates.RETURN_REMINDER,
        templateData
      );

      const emailData = {
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await emailService.sendEmail(emailData);
      
      // Log the notification
      await this.logNotification({
        type: this.notificationTypes.RETURN_REMINDER,
        recipientEmail: userEmail,
        subject: emailTemplate.subject,
        status: result.success ? 'sent' : 'failed',
        transactionId: lendingTransaction.id,
        errorMessage: result.error || null
      });

      return result;
    } catch (error) {
      logger.error('Failed to send return reminder:', error);
      throw error;
    }
  }

  async sendOverdueNotice(lendingTransaction, userEmail, userName) {
    try {
      const dueDate = new Date(lendingTransaction.dueDate);
      const today = new Date();
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

      const templateData = {
        borrowerName: userName,
        productName: lendingTransaction.productName,
        dueDate: lendingTransaction.dueDate,
        daysOverdue: daysOverdue,
        lendingId: lendingTransaction.id
      };

      const emailTemplate = emailTemplateService.generateTemplate(
        emailTemplateService.templates.OVERDUE_NOTICE,
        templateData
      );

      const emailData = {
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await emailService.sendEmail(emailData);
      
      // Log the notification
      await this.logNotification({
        type: this.notificationTypes.OVERDUE_NOTICE,
        recipientEmail: userEmail,
        subject: emailTemplate.subject,
        status: result.success ? 'sent' : 'failed',
        transactionId: lendingTransaction.id,
        errorMessage: result.error || null
      });

      return result;
    } catch (error) {
      logger.error('Failed to send overdue notice:', error);
      throw error;
    }
  }

  async sendReturnConfirmation(lendingTransaction, userEmail, userName) {
    try {
      const templateData = {
        borrowerName: userName,
        productName: lendingTransaction.productName,
        returnDate: lendingTransaction.returnDate,
        condition: lendingTransaction.returnCondition,
        lendingId: lendingTransaction.id
      };

      const emailTemplate = emailTemplateService.generateTemplate(
        emailTemplateService.templates.RETURN_CONFIRMATION,
        templateData
      );

      const emailData = {
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await emailService.sendEmail(emailData);
      
      // Log the notification
      await this.logNotification({
        type: this.notificationTypes.RETURN_CONFIRMATION,
        recipientEmail: userEmail,
        subject: emailTemplate.subject,
        status: result.success ? 'sent' : 'failed',
        transactionId: lendingTransaction.id,
        errorMessage: result.error || null
      });

      return result;
    } catch (error) {
      logger.error('Failed to send return confirmation:', error);
      throw error;
    }
  }

  async logNotification(notificationData) {
    try {
      const query = `
        INSERT INTO email_notifications 
        (type, recipient_email, subject, status, transaction_id, error_message, sent_date)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      
      await db.execute(query, [
        notificationData.type,
        notificationData.recipientEmail,
        notificationData.subject,
        notificationData.status,
        notificationData.transactionId,
        notificationData.errorMessage
      ]);
    } catch (error) {
      logger.error('Failed to log notification:', error);
    }
  }

  async getNotificationHistory(transactionId) {
    try {
      const query = `
        SELECT * FROM email_notifications 
        WHERE transaction_id = ? 
        ORDER BY sent_date DESC
      `;
      
      const [rows] = await db.execute(query, [transactionId]);
      return rows;
    } catch (error) {
      logger.error('Failed to get notification history:', error);
      throw error;
    }
  }

  async getFailedNotifications(limit = 100) {
    try {
      const query = `
        SELECT * FROM email_notifications 
        WHERE status = 'failed' 
        ORDER BY sent_date DESC 
        LIMIT ?
      `;
      
      const [rows] = await db.execute(query, [limit]);
      return rows;
    } catch (error) {
      logger.error('Failed to get failed notifications:', error);
      throw error;
    }
  }

  async retryFailedNotification(notificationId) {
    try {
      // Get the failed notification
      const query = `SELECT * FROM email_notifications WHERE id = ?`;
      const [rows] = await db.execute(query, [notificationId]);
      
      if (rows.length === 0) {
        throw new Error('Notification not found');
      }

      const notification = rows[0];
      
      // Retry sending the email
      const emailData = {
        to: notification.recipient_email,
        subject: notification.subject,
        html: notification.content || 'Email content not available',
        text: notification.content || 'Email content not available'
      };

      const result = await emailService.sendEmail(emailData);
      
      // Update the notification status
      const updateQuery = `
        UPDATE email_notifications 
        SET status = ?, error_message = ?, sent_date = NOW() 
        WHERE id = ?
      `;
      
      await db.execute(updateQuery, [
        result.success ? 'sent' : 'failed',
        result.error || null,
        notificationId
      ]);

      return result;
    } catch (error) {
      logger.error('Failed to retry notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();