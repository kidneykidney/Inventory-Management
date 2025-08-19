/**
 * Logger utility for the Inventory Management System
 * A simplified version for client-side use with local storage history
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Set default logging level based on environment
const DEFAULT_LEVEL =
  process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
const MAX_LOG_HISTORY = 100;
const LOG_STORAGE_KEY = 'inventory_system_logs';

// Get current log level from localStorage or use default
const getCurrentLevel = () => {
  const savedLevel = localStorage.getItem('logLevel');
  return savedLevel ? parseInt(savedLevel, 10) : DEFAULT_LEVEL;
};

// Store logs in localStorage
const storeLog = (level, message, meta) => {
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');

    // Add new log with timestamp
    logs.unshift({
      timestamp: new Date().toISOString(),
      level: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level),
      message,
      meta: meta || null,
    });

    // Keep only recent logs
    const trimmedLogs = logs.slice(0, MAX_LOG_HISTORY);

    // Save back to localStorage
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (err) {
    console.error('Error storing log:', err);
  }
};

// The public logger API
export const logger = {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {any} meta - Additional data
   */
  error: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.ERROR) {
      console.error(message, meta);
      storeLog(LOG_LEVELS.ERROR, message, meta);
    }
  },

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {any} meta - Additional data
   */
  warn: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.WARN) {
      console.warn(message, meta);
      storeLog(LOG_LEVELS.WARN, message, meta);
    }
  },

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {any} meta - Additional data
   */
  info: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.INFO) {
      console.info(message, meta);
      storeLog(LOG_LEVELS.INFO, message, meta);
    }
  },

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {any} meta - Additional data
   */
  debug: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG) {
      console.debug(message, meta);
      storeLog(LOG_LEVELS.DEBUG, message, meta);
    }
  },

  /**
   * Get logs stored in localStorage
   * @returns {Array} Array of log entries
   */
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
    } catch (err) {
      console.error('Error retrieving logs:', err);
      return [];
    }
  },

  /**
   * Clear stored logs
   */
  clearLogs: () => {
    localStorage.removeItem(LOG_STORAGE_KEY);
  },

  /**
   * Set logging level
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
   */
  setLevel: level => {
    const levelValue = LOG_LEVELS[level.toUpperCase()];
    if (levelValue !== undefined) {
      localStorage.setItem('logLevel', levelValue.toString());
    }
  },
};

export default logger;
