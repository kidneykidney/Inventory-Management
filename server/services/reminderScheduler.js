const cron = require('node-cron');
const notificationService = require('./notificationService');
const db = require('../config/database');
const logger = require('../utils/logger');

class ReminderScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Reminder scheduler is already running');
      return;
    }

    // Schedule reminder checks to run daily at 9:00 AM
    const reminderJob = cron.schedule('0 9 * * *', async () => {
      await this.processReminders();
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    // Schedule overdue checks to run daily at 10:00 AM
    const overdueJob = cron.schedule('0 10 * * *', async () => {
      await this.processOverdueNotices();
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set('reminders', reminderJob);
    this.jobs.set('overdue', overdueJob);

    // Start the jobs
    reminderJob.start();
    overdueJob.start();

    this.isRunning = true;
    logger.info('Reminder scheduler started successfully');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Reminder scheduler is not running');
      return;
    }

    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped ${name} job`);
    });

    this.jobs.clear();
    this.isRunning = false;
    logger.info('Reminder scheduler stopped');
  }

  async processReminders() {
    try {
      logger.info('Processing return reminders...');

      // Get lending transactions that are due in 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const query = `
        SELECT 
          lt.*,
          p.name as productName,
          p.specifications as productSpecs,
          u.email as userEmail,
          u.name as userName
        FROM lending_transactions lt
        JOIN lending_products p ON lt.product_id = p.id
        JOIN users u ON lt.borrower_id = u.id
        WHERE lt.status = 'active'
        AND DATE(lt.due_date) = DATE(?)
        AND lt.id NOT IN (
          SELECT DISTINCT transaction_id 
          FROM email_notifications 
          WHERE type = 'return_reminder' 
          AND DATE(sent_date) = CURDATE()
        )
      `;

      const [transactions] = await db.execute(query, [threeDaysFromNow.toISOString().split('T')[0]]);

      logger.info(`Found ${transactions.length} transactions requiring reminders`);

      for (const transaction of transactions) {
        try {
          await notificationService.sendReturnReminder(
            transaction,
            transaction.userEmail,
            transaction.userName
          );
          
          logger.info(`Sent reminder for transaction ${transaction.id}`);
        } catch (error) {
          logger.error(`Failed to send reminder for transaction ${transaction.id}:`, error);
        }
      }

      logger.info('Completed processing return reminders');
    } catch (error) {
      logger.error('Error processing reminders:', error);
    }
  }

  async processOverdueNotices() {
    try {
      logger.info('Processing overdue notices...');

      // Get lending transactions that are overdue
      const today = new Date().toISOString().split('T')[0];

      const query = `
        SELECT 
          lt.*,
          p.name as productName,
          p.specifications as productSpecs,
          u.email as userEmail,
          u.name as userName,
          DATEDIFF(CURDATE(), lt.due_date) as daysOverdue
        FROM lending_transactions lt
        JOIN lending_products p ON lt.product_id = p.id
        JOIN users u ON lt.borrower_id = u.id
        WHERE lt.status = 'active'
        AND lt.due_date < CURDATE()
        AND (
          lt.id NOT IN (
            SELECT DISTINCT transaction_id 
            FROM email_notifications 
            WHERE type = 'overdue_notice' 
            AND DATE(sent_date) = CURDATE()
          )
          OR DATEDIFF(CURDATE(), lt.due_date) = 1
        )
      `;

      const [transactions] = await db.execute(query);

      logger.info(`Found ${transactions.length} overdue transactions`);

      for (const transaction of transactions) {
        try {
          await notificationService.sendOverdueNotice(
            transaction,
            transaction.userEmail,
            transaction.userName
          );
          
          // Update transaction status to overdue if not already
          if (transaction.status !== 'overdue') {
            const updateQuery = `UPDATE lending_transactions SET status = 'overdue' WHERE id = ?`;
            await db.execute(updateQuery, [transaction.id]);
          }
          
          logger.info(`Sent overdue notice for transaction ${transaction.id} (${transaction.daysOverdue} days overdue)`);
        } catch (error) {
          logger.error(`Failed to send overdue notice for transaction ${transaction.id}:`, error);
        }
      }

      logger.info('Completed processing overdue notices');
    } catch (error) {
      logger.error('Error processing overdue notices:', error);
    }
  }

  async processImmediateReminder(transactionId) {
    try {
      logger.info(`Processing immediate reminder for transaction ${transactionId}`);

      const query = `
        SELECT 
          lt.*,
          p.name as productName,
          p.specifications as productSpecs,
          u.email as userEmail,
          u.name as userName
        FROM lending_transactions lt
        JOIN lending_products p ON lt.product_id = p.id
        JOIN users u ON lt.borrower_id = u.id
        WHERE lt.id = ?
      `;

      const [transactions] = await db.execute(query, [transactionId]);

      if (transactions.length === 0) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      const transaction = transactions[0];
      const dueDate = new Date(transaction.due_date);
      const today = new Date();

      if (dueDate > today) {
        // Send return reminder
        await notificationService.sendReturnReminder(
          transaction,
          transaction.userEmail,
          transaction.userName
        );
      } else {
        // Send overdue notice
        await notificationService.sendOverdueNotice(
          transaction,
          transaction.userEmail,
          transaction.userName
        );
      }

      logger.info(`Sent immediate reminder for transaction ${transactionId}`);
    } catch (error) {
      logger.error(`Failed to process immediate reminder for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      nextReminderRun: this.jobs.get('reminders')?.nextDate()?.toISOString(),
      nextOverdueRun: this.jobs.get('overdue')?.nextDate()?.toISOString()
    };
  }
}

module.exports = new ReminderScheduler();