const notificationService = require('../notificationService');
const emailService = require('../emailService');
const emailTemplateService = require('../emailTemplateService');
const db = require('../../config/database');

// Mock dependencies
jest.mock('../emailService');
jest.mock('../emailTemplateService');
jest.mock('../../config/database');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock database execute method
    db.execute = jest.fn();
  });

  describe('sendLendingConfirmation', () => {
    it('should send lending confirmation email successfully', async () => {
      const mockTransaction = {
        id: 'LT-001',
        productName: 'MacBook Pro',
        lendDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        productSpecs: 'M1 Pro, 16GB RAM',
      };

      const mockTemplate = {
        subject: 'Lending Confirmation - MacBook Pro',
        html: '<p>Confirmation email</p>',
        text: 'Confirmation email',
      };

      emailTemplateService.generateTemplate.mockReturnValue(mockTemplate);
      emailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });
      db.execute.mockResolvedValue([]);

      const result = await notificationService.sendLendingConfirmation(
        mockTransaction,
        'user@example.com',
        'John Doe'
      );

      expect(emailTemplateService.generateTemplate).toHaveBeenCalledWith(
        emailTemplateService.templates.LENDING_CONFIRMATION,
        {
          borrowerName: 'John Doe',
          productName: 'MacBook Pro',
          lendDate: mockTransaction.lendDate,
          dueDate: mockTransaction.dueDate,
          productSpecs: 'M1 Pro, 16GB RAM',
          lendingId: 'LT-001',
        }
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Lending Confirmation - MacBook Pro',
        html: '<p>Confirmation email</p>',
        text: 'Confirmation email',
      });

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_notifications'),
        [
          'lending_confirmation',
          'user@example.com',
          'Lending Confirmation - MacBook Pro',
          'sent',
          'LT-001',
          null,
        ]
      );

      expect(result.success).toBe(true);
    });

    it('should handle email sending failure', async () => {
      const mockTransaction = {
        id: 'LT-001',
        productName: 'MacBook Pro',
        lendDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
      };

      const mockTemplate = {
        subject: 'Lending Confirmation - MacBook Pro',
        html: '<p>Confirmation email</p>',
        text: 'Confirmation email',
      };

      emailTemplateService.generateTemplate.mockReturnValue(mockTemplate);
      emailService.sendEmail.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      });
      db.execute.mockResolvedValue([]);

      const result = await notificationService.sendLendingConfirmation(
        mockTransaction,
        'user@example.com',
        'John Doe'
      );

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_notifications'),
        [
          'lending_confirmation',
          'user@example.com',
          'Lending Confirmation - MacBook Pro',
          'failed',
          'LT-001',
          'SMTP connection failed',
        ]
      );

      expect(result.success).toBe(false);
    });
  });

  describe('sendReturnReminder', () => {
    it('should send return reminder email successfully', async () => {
      const mockTransaction = {
        id: 'LT-002',
        productName: 'iPad Pro',
        dueDate: new Date('2024-02-20'),
      };

      const mockTemplate = {
        subject: 'Return Reminder - iPad Pro',
        html: '<p>Reminder email</p>',
        text: 'Reminder email',
      };

      emailTemplateService.generateTemplate.mockReturnValue(mockTemplate);
      emailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });
      db.execute.mockResolvedValue([]);

      const result = await notificationService.sendReturnReminder(
        mockTransaction,
        'user@example.com',
        'Jane Smith'
      );

      expect(emailTemplateService.generateTemplate).toHaveBeenCalledWith(
        emailTemplateService.templates.RETURN_REMINDER,
        expect.objectContaining({
          borrowerName: 'Jane Smith',
          productName: 'iPad Pro',
          dueDate: mockTransaction.dueDate,
          lendingId: 'LT-002',
        })
      );

      expect(result.success).toBe(true);
    });

    it('should calculate days until due correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockTransaction = {
        id: 'LT-002',
        productName: 'iPad Pro',
        dueDate: futureDate,
      };

      const mockTemplate = {
        subject: 'Return Reminder - iPad Pro',
        html: '<p>Reminder email</p>',
        text: 'Reminder email',
      };

      emailTemplateService.generateTemplate.mockReturnValue(mockTemplate);
      emailService.sendEmail.mockResolvedValue({ success: true });
      db.execute.mockResolvedValue([]);

      await notificationService.sendReturnReminder(
        mockTransaction,
        'user@example.com',
        'Jane Smith'
      );

      const templateCall =
        emailTemplateService.generateTemplate.mock.calls[0][1];
      expect(templateCall.daysUntilDue).toBeCloseTo(5, 0);
    });
  });

  describe('sendOverdueNotice', () => {
    it('should send overdue notice email successfully', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const mockTransaction = {
        id: 'LT-003',
        productName: 'Dell Monitor',
        dueDate: pastDate,
      };

      const mockTemplate = {
        subject: 'OVERDUE NOTICE - Dell Monitor',
        html: '<p>Overdue notice</p>',
        text: 'Overdue notice',
      };

      emailTemplateService.generateTemplate.mockReturnValue(mockTemplate);
      emailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });
      db.execute.mockResolvedValue([]);

      const result = await notificationService.sendOverdueNotice(
        mockTransaction,
        'user@example.com',
        'Bob Johnson'
      );

      expect(emailTemplateService.generateTemplate).toHaveBeenCalledWith(
        emailTemplateService.templates.OVERDUE_NOTICE,
        expect.objectContaining({
          borrowerName: 'Bob Johnson',
          productName: 'Dell Monitor',
          dueDate: pastDate,
          lendingId: 'LT-003',
        })
      );

      const templateCall =
        emailTemplateService.generateTemplate.mock.calls[0][1];
      expect(templateCall.daysOverdue).toBeCloseTo(3, 0);

      expect(result.success).toBe(true);
    });
  });

  describe('sendReturnConfirmation', () => {
    it('should send return confirmation email successfully', async () => {
      const mockTransaction = {
        id: 'LT-004',
        productName: 'Wireless Mouse',
        returnDate: new Date('2024-02-10'),
        returnCondition: 'excellent',
      };

      const mockTemplate = {
        subject: 'Return Confirmation - Wireless Mouse',
        html: '<p>Return confirmation</p>',
        text: 'Return confirmation',
      };

      emailTemplateService.generateTemplate.mockReturnValue(mockTemplate);
      emailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });
      db.execute.mockResolvedValue([]);

      const result = await notificationService.sendReturnConfirmation(
        mockTransaction,
        'user@example.com',
        'Alice Brown'
      );

      expect(emailTemplateService.generateTemplate).toHaveBeenCalledWith(
        emailTemplateService.templates.RETURN_CONFIRMATION,
        {
          borrowerName: 'Alice Brown',
          productName: 'Wireless Mouse',
          returnDate: mockTransaction.returnDate,
          condition: 'excellent',
          lendingId: 'LT-004',
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('getNotificationHistory', () => {
    it('should retrieve notification history for a transaction', async () => {
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

      db.execute.mockResolvedValue([mockHistory]);

      const result = await notificationService.getNotificationHistory('LT-001');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM email_notifications'),
        ['LT-001']
      );

      expect(result).toEqual(mockHistory);
    });
  });

  describe('getFailedNotifications', () => {
    it('should retrieve failed notifications', async () => {
      const mockFailedNotifications = [
        {
          id: 1,
          type: 'return_reminder',
          recipient_email: 'user@example.com',
          status: 'failed',
          error_message: 'SMTP connection failed',
        },
      ];

      db.execute.mockResolvedValue([mockFailedNotifications]);

      const result = await notificationService.getFailedNotifications(50);

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'failed'"),
        [50]
      );

      expect(result).toEqual(mockFailedNotifications);
    });
  });

  describe('retryFailedNotification', () => {
    it('should retry failed notification successfully', async () => {
      const mockNotification = {
        id: 1,
        recipient_email: 'user@example.com',
        subject: 'Test Subject',
        content: 'Test content',
      };

      db.execute
        .mockResolvedValueOnce([[mockNotification]]) // SELECT query
        .mockResolvedValueOnce([]); // UPDATE query

      emailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'retry-message-id',
      });

      const result = await notificationService.retryFailedNotification(1);

      expect(db.execute).toHaveBeenCalledTimes(2);
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: 'Test content',
        text: 'Test content',
      });

      expect(result.success).toBe(true);
    });

    it('should handle notification not found', async () => {
      db.execute.mockResolvedValue([[]]);

      await expect(
        notificationService.retryFailedNotification(999)
      ).rejects.toThrow('Notification not found');
    });
  });
});
