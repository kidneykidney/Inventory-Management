/**
 * Server-side logger utility using Winston
 * Provides consistent logging throughout the application
 * with file and console transports
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  }
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'inventory-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),

    // File transports
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create simpler API
const simpleLogger = {
  info: (message, meta = null) => {
    logger.info(message, meta);
  },

  warn: (message, meta = null) => {
    logger.warn(message, meta);
  },

  error: (message, error = null) => {
    logger.error(message, {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
  },

  debug: (message, meta = null) => {
    logger.debug(message, meta);
  },
};

module.exports = simpleLogger;
