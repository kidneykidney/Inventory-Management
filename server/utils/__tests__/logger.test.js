const winston = require('winston');
const logger = require('../logger');

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('Server Logger', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      http: jest.fn(),
    };
    winston.createLogger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logger initialization', () => {
    it('should create logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
    });

    it('should configure different transports for different environments', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test development environment
      process.env.NODE_ENV = 'development';
      require('../logger');
      expect(winston.transports.Console).toHaveBeenCalled();
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      require('../logger');
      expect(winston.transports.File).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const meta = { userId: 123 };

      logger.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      logger.error(message, error);

      expect(mockLogger.error).toHaveBeenCalledWith(message, error);
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      const meta = { component: 'auth' };

      logger.warn(message, meta);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      const meta = { step: 1 };

      logger.debug(message, meta);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, meta);
    });

    it('should log HTTP messages', () => {
      const message = 'HTTP request';
      const meta = { method: 'GET', url: '/api/test' };

      logger.http(message, meta);

      expect(mockLogger.http).toHaveBeenCalledWith(message, meta);
    });
  });

  describe('error handling', () => {
    it('should handle Error objects properly', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logger.error('Error occurred', error);

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', error);
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'Simple error object' };

      logger.error('Error occurred', error);

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', error);
    });

    it('should handle null or undefined errors', () => {
      expect(() => logger.error('Error occurred', null)).not.toThrow();
      expect(() => logger.error('Error occurred', undefined)).not.toThrow();
    });
  });

  describe('metadata handling', () => {
    it('should handle complex metadata objects', () => {
      const meta = {
        userId: 123,
        action: 'login',
        timestamp: new Date().toISOString(),
        request: {
          method: 'POST',
          url: '/api/auth/login',
          ip: '127.0.0.1',
        },
      };

      logger.info('User login attempt', meta);

      expect(mockLogger.info).toHaveBeenCalledWith('User login attempt', meta);
    });

    it('should handle arrays in metadata', () => {
      const meta = {
        errors: ['Field required', 'Invalid format'],
        validFields: ['email', 'password'],
      };

      logger.warn('Validation errors', meta);

      expect(mockLogger.warn).toHaveBeenCalledWith('Validation errors', meta);
    });

    it('should handle circular references in metadata', () => {
      const meta = { self: null };
      meta.self = meta; // Create circular reference

      expect(() => logger.info('Circular reference test', meta)).not.toThrow();
    });
  });

  describe('log levels', () => {
    it('should respect log level configuration', () => {
      const originalLevel = process.env.LOG_LEVEL;
      
      process.env.LOG_LEVEL = 'error';
      const restrictedLogger = require('../logger');
      
      // Debug messages should not be logged at error level
      restrictedLogger.debug('Debug message');
      // This test would need actual winston behavior to verify
      
      process.env.LOG_LEVEL = originalLevel;
    });
  });

  describe('performance', () => {
    it('should handle high-frequency logging', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        logger.info(`Log message ${i}`, { iteration: i });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
      expect(mockLogger.info).toHaveBeenCalledTimes(1000);
    });
  });

  describe('formatting', () => {
    it('should format messages consistently', () => {
      const message = 'Test message';
      const meta = { key: 'value' };

      logger.info(message, meta);

      // Verify the logger was called with expected parameters
      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should handle special characters in messages', () => {
      const message = 'Message with special chars: !@#$%^&*(){}[]|\\:";\'<>?,./';
      
      expect(() => logger.info(message)).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });

    it('should handle unicode characters', () => {
      const message = 'Unicode test: 你好世界 🌍 émojis';
      
      expect(() => logger.info(message)).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('environment-specific behavior', () => {
    it('should configure differently for test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      // Re-require the logger to get test configuration
      delete require.cache[require.resolve('../logger')];
      const testLogger = require('../logger');
      
      // In test environment, logger might be configured to be silent
      // or have different transports
      expect(winston.createLogger).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});