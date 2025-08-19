import { logger, logError, logInfo, logWarning, logDebug } from '../logger';

// Mock console methods
const originalConsole = { ...console };

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('logger', () => {
  describe('logError', () => {
    it('should log error messages with timestamp', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      logError(message, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message),
        error
      );
    });

    it('should log error message without error object', () => {
      const message = 'Simple error message';

      logError(message);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message)
      );
    });

    it('should handle error objects as first parameter', () => {
      const error = new Error('Direct error');

      logError(error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        error
      );
    });
  });

  describe('logInfo', () => {
    it('should log info messages with timestamp', () => {
      const message = 'Test info message';

      logInfo(message);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message)
      );
    });

    it('should log info with additional data', () => {
      const message = 'Info with data';
      const data = { userId: 123, action: 'login' };

      logInfo(message, data);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        data
      );
    });
  });

  describe('logWarning', () => {
    it('should log warning messages with timestamp', () => {
      const message = 'Test warning message';

      logWarning(message);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining(message)
      );
    });

    it('should log warning with additional context', () => {
      const message = 'Warning with context';
      const context = { component: 'UserForm', field: 'email' };

      logWarning(message, context);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining(message),
        context
      );
    });
  });

  describe('logDebug', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const message = 'Debug message';

      logDebug(message);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining(message)
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const message = 'Debug message';

      logDebug(message);

      expect(console.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log debug with data object', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const message = 'Debug with data';
      const data = { step: 1, value: 'test' };

      logDebug(message, data);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining(message),
        data
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logger object', () => {
    it('should have all required methods', () => {
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should work with method calls', () => {
      logger.info('Test message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test message')
      );
    });
  });

  describe('timestamp formatting', () => {
    it('should include valid timestamp in log messages', () => {
      logInfo('Timestamp test');

      const logCall = console.info.mock.calls[0][0];
      const timestampMatch = logCall.match(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );

      expect(timestampMatch).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle null or undefined messages gracefully', () => {
      expect(() => logInfo(null)).not.toThrow();
      expect(() => logInfo(undefined)).not.toThrow();
      expect(() => logError(null)).not.toThrow();
    });

    it('should handle non-string messages', () => {
      const numberMessage = 12345;
      const objectMessage = { test: 'value' };

      expect(() => logInfo(numberMessage)).not.toThrow();
      expect(() => logInfo(objectMessage)).not.toThrow();
    });
  });
});
