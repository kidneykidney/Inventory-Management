// Mock nodemailer before importing the service
jest.mock('nodemailer');

const nodemailer = require('nodemailer');
const emailService = require('../emailService');

describe('EmailService', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
    nodemailer.createTestAccount = jest.fn().mockResolvedValue({
      user: 'test@ethereal.email',
      pass: 'testpass',
    });
    nodemailer.getTestMessageUrl = jest
      .fn()
      .mockReturnValue('https://ethereal.email/message/test');

    // Set the transporter manually for testing
    emailService.transporter = mockTransporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        response: '250 OK',
      };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM || 'noreply@lendingsystem.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });
    });

    it('should handle email sending failure', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
    });

    it('should handle missing transporter', async () => {
      // Simulate uninitialized transporter
      emailService.transporter = null;

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email transporter not initialized');
    });
  });

  describe('sendBulkEmails', () => {
    it('should send multiple emails successfully', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        response: '250 OK',
      };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const emailsData = [
        {
          to: 'test1@example.com',
          subject: 'Test Subject 1',
          html: '<p>Test HTML 1</p>',
          text: 'Test text 1',
        },
        {
          to: 'test2@example.com',
          subject: 'Test Subject 2',
          html: '<p>Test HTML 2</p>',
          text: 'Test text 2',
        },
      ];

      const results = await emailService.sendBulkEmails(emailsData);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure in bulk emails', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'success-id' })
        .mockRejectedValueOnce(new Error('Failed to send'));

      const emailsData = [
        {
          to: 'test1@example.com',
          subject: 'Test Subject 1',
          html: '<p>Test HTML 1</p>',
          text: 'Test text 1',
        },
        {
          to: 'test2@example.com',
          subject: 'Test Subject 2',
          html: '<p>Test HTML 2</p>',
          text: 'Test text 2',
        },
      ];

      const results = await emailService.sendBulkEmails(emailsData);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Failed to send');
    });
  });

  describe('initialization', () => {
    it('should create test account in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Re-initialize the service
      await emailService.createTestAccount();

      expect(nodemailer.createTestAccount).toHaveBeenCalled();
      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'testpass',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
