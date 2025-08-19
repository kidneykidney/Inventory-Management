const reminderScheduler = require('../reminderScheduler');
const notificationService = require('../notificationService');
const db = require('../../config/database');
const cron = require('node-cron');

// Mock dependencies
jest.mock('../notificationService');
jest.mock('../../config/database');
jest.mock('node-cron');

describe('ReminderScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cron.schedule
    const mockJob = {
      start: jest.fn(),
      stop: jest.fn(),
      nextDate: jest.fn().mockReturnValue(new Date()),
    };
    cron.schedule.mockReturnValue(mockJob);

    // Mock database execute method
    db.execute = jest.fn();

    // Reset scheduler state
    reminderScheduler.stop();
  });

  describe('start', () => {
    it('should start the scheduler successfully', () => {
      reminderScheduler.start();

      expect(cron.schedule).toHaveBeenCalledTimes(2);
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 9 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: false,
          timezone: process.env.TIMEZONE || 'UTC',
        })
      );
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 10 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: false,
          timezone: process.env.TIMEZONE || 'UTC',
        })
      );

      const status = reminderScheduler.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.activeJobs).toContain('reminders');
      expect(status.activeJobs).toContain('overdue');
    });

    it('should not start if already running', () => {
      reminderScheduler.start();
      reminderScheduler.start(); // Try to start again

      // Should only be called once from the first start
      expect(cron.schedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop', () => {
    it('should stop the scheduler successfully', () => {
      reminderScheduler.start();
      reminderScheduler.stop();

      const status = reminderScheduler.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.activeJobs).toHaveLength(0);
    });

    it('should handle stop when not running', () => {
      // Should not throw error
      expect(() => reminderScheduler.stop()).not.toThrow();
    });
  });

  describe('processReminders', () => {
    it('should process return reminders successfully', async () => {
      const mockTransactions = [
        {
          id: 'LT-001',
          productName: 'MacBook Pro',
          userEmail: 'user1@example.com',
          userName: 'John Doe',
          due_date: new Date(),
        },
        {
          id: 'LT-002',
          productName: 'iPad Pro',
          userEmail: 'user2@example.com',
          userName: 'Jane Smith',
          due_date: new Date(),
        },
      ];

      db.execute.mockResolvedValue([mockTransactions]);
      notificationService.sendReturnReminder.mockResolvedValue({
        success: true,
      });

      await reminderScheduler.processReminders();

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE lt.status = 'active'"),
        expect.any(Array)
      );

      expect(notificationService.sendReturnReminder).toHaveBeenCalledTimes(2);
      expect(notificationService.sendReturnReminder).toHaveBeenCalledWith(
        mockTransactions[0],
        'user1@example.com',
        'John Doe'
      );
      expect(notificationService.sendReturnReminder).toHaveBeenCalledWith(
        mockTransactions[1],
        'user2@example.com',
        'Jane Smith'
      );
    });

    it('should handle individual reminder failures gracefully', async () => {
      const mockTransactions = [
        {
          id: 'LT-001',
          productName: 'MacBook Pro',
          userEmail: 'user1@example.com',
          userName: 'John Doe',
        },
        {
          id: 'LT-002',
          productName: 'iPad Pro',
          userEmail: 'user2@example.com',
          userName: 'Jane Smith',
        },
      ];

      db.execute.mockResolvedValue([mockTransactions]);
      notificationService.sendReturnReminder
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Email service unavailable'));

      // Should not throw error
      await expect(reminderScheduler.processReminders()).resolves.not.toThrow();

      expect(notificationService.sendReturnReminder).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors gracefully', async () => {
      db.execute.mockRejectedValue(new Error('Database connection failed'));

      // Should not throw error
      await expect(reminderScheduler.processReminders()).resolves.not.toThrow();
    });
  });

  describe('processOverdueNotices', () => {
    it('should process overdue notices successfully', async () => {
      const mockTransactions = [
        {
          id: 'LT-003',
          productName: 'Dell Monitor',
          userEmail: 'user3@example.com',
          userName: 'Bob Johnson',
          status: 'active',
          daysOverdue: 2,
        },
      ];

      db.execute
        .mockResolvedValueOnce([mockTransactions]) // SELECT query
        .mockResolvedValueOnce([]); // UPDATE query

      notificationService.sendOverdueNotice.mockResolvedValue({
        success: true,
      });

      await reminderScheduler.processOverdueNotices();

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE lt.status = 'active'"),
        []
      );

      expect(notificationService.sendOverdueNotice).toHaveBeenCalledWith(
        mockTransactions[0],
        'user3@example.com',
        'Bob Johnson'
      );

      // Should update transaction status to overdue
      expect(db.execute).toHaveBeenCalledWith(
        "UPDATE lending_transactions SET status = 'overdue' WHERE id = ?",
        ['LT-003']
      );
    });

    it('should not update status if already overdue', async () => {
      const mockTransactions = [
        {
          id: 'LT-003',
          productName: 'Dell Monitor',
          userEmail: 'user3@example.com',
          userName: 'Bob Johnson',
          status: 'overdue',
          daysOverdue: 5,
        },
      ];

      db.execute.mockResolvedValueOnce([mockTransactions]);
      notificationService.sendOverdueNotice.mockResolvedValue({
        success: true,
      });

      await reminderScheduler.processOverdueNotices();

      expect(notificationService.sendOverdueNotice).toHaveBeenCalledTimes(1);

      // Should not call UPDATE query since status is already overdue
      expect(db.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('processImmediateReminder', () => {
    it('should send return reminder for future due date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockTransaction = {
        id: 'LT-004',
        productName: 'Wireless Mouse',
        userEmail: 'user4@example.com',
        userName: 'Alice Brown',
        due_date: futureDate,
      };

      db.execute.mockResolvedValue([[mockTransaction]]);
      notificationService.sendReturnReminder.mockResolvedValue({
        success: true,
      });

      await reminderScheduler.processImmediateReminder('LT-004');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE lt.id = ?'),
        ['LT-004']
      );

      expect(notificationService.sendReturnReminder).toHaveBeenCalledWith(
        mockTransaction,
        'user4@example.com',
        'Alice Brown'
      );
    });

    it('should send overdue notice for past due date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const mockTransaction = {
        id: 'LT-005',
        productName: 'Conference Camera',
        userEmail: 'user5@example.com',
        userName: 'Charlie Wilson',
        due_date: pastDate,
      };

      db.execute.mockResolvedValue([[mockTransaction]]);
      notificationService.sendOverdueNotice.mockResolvedValue({
        success: true,
      });

      await reminderScheduler.processImmediateReminder('LT-005');

      expect(notificationService.sendOverdueNotice).toHaveBeenCalledWith(
        mockTransaction,
        'user5@example.com',
        'Charlie Wilson'
      );
    });

    it('should handle transaction not found', async () => {
      db.execute.mockResolvedValue([[]]);

      await expect(
        reminderScheduler.processImmediateReminder('LT-999')
      ).rejects.toThrow('Transaction LT-999 not found');
    });
  });

  describe('getStatus', () => {
    it('should return correct status when running', () => {
      reminderScheduler.start();
      const status = reminderScheduler.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.activeJobs).toEqual(['reminders', 'overdue']);
      expect(status.nextReminderRun).toBeDefined();
      expect(status.nextOverdueRun).toBeDefined();
    });

    it('should return correct status when stopped', () => {
      const status = reminderScheduler.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.activeJobs).toEqual([]);
    });
  });
});
