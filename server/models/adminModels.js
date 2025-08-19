/**
 * Admin Models
 * Database models for admin panel functionality and system configuration
 */

const { pool, monitoredQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * System Configuration Model
 * Manages global system settings and lending policies
 */
class SystemConfiguration {
  constructor(data) {
    this.id = data.id;
    this.key = data.key;
    this.value = data.value;
    this.category = data.category;
    this.description = data.description;
    this.dataType = data.data_type || data.dataType || 'string';
    this.isEditable = data.is_editable !== undefined ? data.is_editable : data.isEditable !== undefined ? data.isEditable : true;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  /**
   * Get configuration value by key
   * @param {string} key Configuration key
   * @returns {Promise<any>} Configuration value
   */
  static async getValue(key) {
    try {
      const [rows] = await monitoredQuery(
        'SELECT value, data_type FROM system_configurations WHERE key = ?',
        [key]
      );

      if (rows.length === 0) {
        return null;
      }

      const config = rows[0];
      return SystemConfiguration.parseValue(config.value, config.data_type);
    } catch (error) {
      logger.error('Error getting configuration value:', error);
      throw error;
    }
  }

  /**
   * Set configuration value
   * @param {string} key Configuration key
   * @param {any} value Configuration value
   * @param {string} category Configuration category
   * @param {string} description Configuration description
   * @param {string} dataType Data type (string, number, boolean, json)
   * @returns {Promise<SystemConfiguration>} Updated configuration
   */
  static async setValue(key, value, category = 'general', description = '', dataType = 'string') {
    try {
      const serializedValue = SystemConfiguration.serializeValue(value, dataType);

      const [existing] = await monitoredQuery(
        'SELECT id FROM system_configurations WHERE key = ?',
        [key]
      );

      if (existing.length > 0) {
        // Update existing configuration
        await monitoredQuery(
          'UPDATE system_configurations SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
          [serializedValue, key]
        );
      } else {
        // Insert new configuration
        await monitoredQuery(
          'INSERT INTO system_configurations (key, value, category, description, data_type) VALUES (?, ?, ?, ?, ?)',
          [key, serializedValue, category, description, dataType]
        );
      }

      return await SystemConfiguration.getByKey(key);
    } catch (error) {
      logger.error('Error setting configuration value:', error);
      throw error;
    }
  }

  /**
   * Get configuration by key
   * @param {string} key Configuration key
   * @returns {Promise<SystemConfiguration|null>} Configuration object
   */
  static async getByKey(key) {
    try {
      const [rows] = await monitoredQuery(
        'SELECT * FROM system_configurations WHERE key = ?',
        [key]
      );

      if (rows.length === 0) {
        return null;
      }

      return new SystemConfiguration(rows[0]);
    } catch (error) {
      logger.error('Error getting configuration by key:', error);
      throw error;
    }
  }

  /**
   * Get all configurations by category
   * @param {string} category Configuration category
   * @returns {Promise<Array<SystemConfiguration>>} Array of configurations
   */
  static async getByCategory(category) {
    try {
      const [rows] = await monitoredQuery(
        'SELECT * FROM system_configurations WHERE category = ? ORDER BY key',
        [category]
      );

      return rows.map(row => new SystemConfiguration(row));
    } catch (error) {
      logger.error('Error getting configurations by category:', error);
      throw error;
    }
  }

  /**
   * Get all configurations
   * @returns {Promise<Array<SystemConfiguration>>} Array of all configurations
   */
  static async getAll() {
    try {
      const [rows] = await monitoredQuery(
        'SELECT * FROM system_configurations ORDER BY category, key'
      );

      return rows.map(row => new SystemConfiguration(row));
    } catch (error) {
      logger.error('Error getting all configurations:', error);
      throw error;
    }
  }

  /**
   * Initialize default system configurations
   * @returns {Promise<void>}
   */
  static async initializeDefaults() {
    try {
      const defaults = [
        {
          key: 'lending.default_period_days',
          value: '30',
          category: 'lending',
          description: 'Default lending period in days',
          dataType: 'number'
        },
        {
          key: 'lending.max_period_days',
          value: '90',
          category: 'lending',
          description: 'Maximum lending period in days',
          dataType: 'number'
        },
        {
          key: 'lending.reminder_days',
          value: '[3, 1]',
          category: 'lending',
          description: 'Days before due date to send reminders',
          dataType: 'json'
        },
        {
          key: 'lending.auto_approval_enabled',
          value: 'false',
          category: 'lending',
          description: 'Enable automatic approval for lending requests',
          dataType: 'boolean'
        },
        {
          key: 'lending.require_approval_high_value',
          value: 'true',
          category: 'lending',
          description: 'Require approval for high-value items',
          dataType: 'boolean'
        },
        {
          key: 'lending.high_value_threshold',
          value: '1000',
          category: 'lending',
          description: 'Threshold amount for high-value items',
          dataType: 'number'
        },
        {
          key: 'email.reminder_enabled',
          value: 'true',
          category: 'email',
          description: 'Enable email reminders',
          dataType: 'boolean'
        },
        {
          key: 'email.daily_overdue_enabled',
          value: 'true',
          category: 'email',
          description: 'Enable daily overdue email notifications',
          dataType: 'boolean'
        },
        {
          key: 'system.maintenance_mode',
          value: 'false',
          category: 'system',
          description: 'Enable maintenance mode',
          dataType: 'boolean'
        }
      ];

      for (const config of defaults) {
        const existing = await SystemConfiguration.getByKey(config.key);
        if (!existing) {
          await SystemConfiguration.setValue(
            config.key,
            config.value,
            config.category,
            config.description,
            config.dataType
          );
        }
      }

      logger.info('Default system configurations initialized');
    } catch (error) {
      logger.error('Error initializing default configurations:', error);
      throw error;
    }
  }

  /**
   * Parse configuration value based on data type
   * @param {string} value Serialized value
   * @param {string} dataType Data type
   * @returns {any} Parsed value
   */
  static parseValue(value, dataType) {
    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Serialize configuration value based on data type
   * @param {any} value Value to serialize
   * @param {string} dataType Data type
   * @returns {string} Serialized value
   */
  static serializeValue(value, dataType) {
    switch (dataType) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value);
    }
  }

  /**
   * Get parsed value
   * @returns {any} Parsed configuration value
   */
  getParsedValue() {
    return SystemConfiguration.parseValue(this.value, this.dataType);
  }
}

/**
 * Admin Activity Log Model
 * Tracks admin actions for audit purposes
 */
class AdminActivityLog {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.adminId = data.admin_id || data.adminId;
    this.action = data.action;
    this.resourceType = data.resource_type || data.resourceType;
    this.resourceId = data.resource_id || data.resourceId;
    this.details = data.details || {};
    this.ipAddress = data.ip_address || data.ipAddress;
    this.userAgent = data.user_agent || data.userAgent;
    this.createdAt = data.created_at || data.createdAt;
  }

  /**
   * Log admin activity
   * @param {Object} activityData Activity data
   * @returns {Promise<AdminActivityLog>} Created log entry
   */
  static async log(activityData) {
    try {
      const logEntry = new AdminActivityLog(activityData);

      await monitoredQuery(
        `INSERT INTO admin_activity_logs (
          id, admin_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logEntry.id,
          logEntry.adminId,
          logEntry.action,
          logEntry.resourceType,
          logEntry.resourceId,
          JSON.stringify(logEntry.details),
          logEntry.ipAddress,
          logEntry.userAgent
        ]
      );

      logger.info(`Admin activity logged: ${logEntry.action} by ${logEntry.adminId}`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging admin activity:', error);
      throw error;
    }
  }

  /**
   * Get admin activity logs with filtering
   * @param {Object} filters Filter options
   * @returns {Promise<Array<AdminActivityLog>>} Array of log entries
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT aal.*, u.name as admin_name, u.email as admin_email
        FROM admin_activity_logs aal
        JOIN users u ON aal.admin_id = u.id
      `;
      
      const conditions = [];
      const params = [];

      if (filters.adminId) {
        conditions.push('aal.admin_id = ?');
        params.push(filters.adminId);
      }

      if (filters.action) {
        conditions.push('aal.action = ?');
        params.push(filters.action);
      }

      if (filters.resourceType) {
        conditions.push('aal.resource_type = ?');
        params.push(filters.resourceType);
      }

      if (filters.dateFrom) {
        conditions.push('aal.created_at >= ?');
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        conditions.push('aal.created_at <= ?');
        params.push(filters.dateTo);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY aal.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const [rows] = await monitoredQuery(query, params);

      return rows.map(row => {
        const log = new AdminActivityLog(row);
        log.adminName = row.admin_name;
        log.adminEmail = row.admin_email;
        log.details = JSON.parse(row.details || '{}');
        return log;
      });
    } catch (error) {
      logger.error('Error finding admin activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {Object} filters Filter options
   * @returns {Promise<Object>} Activity statistics
   */
  static async getStatistics(filters = {}) {
    try {
      const [totalRows] = await monitoredQuery(
        'SELECT COUNT(*) as total FROM admin_activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      const [actionStats] = await monitoredQuery(`
        SELECT action, COUNT(*) as count
        FROM admin_activity_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `);

      const [adminStats] = await monitoredQuery(`
        SELECT aal.admin_id, u.name as admin_name, COUNT(*) as activity_count
        FROM admin_activity_logs aal
        JOIN users u ON aal.admin_id = u.id
        WHERE aal.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY aal.admin_id, u.name
        ORDER BY activity_count DESC
        LIMIT 10
      `);

      const [dailyStats] = await monitoredQuery(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM admin_activity_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return {
        totalActivities: totalRows[0].total,
        topActions: actionStats,
        topAdmins: adminStats,
        dailyActivity: dailyStats
      };
    } catch (error) {
      logger.error('Error getting admin activity statistics:', error);
      throw error;
    }
  }
}

/**
 * Bulk Operation Model
 * Handles bulk operations on products and users
 */
class BulkOperation {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.adminId = data.admin_id || data.adminId;
    this.operationType = data.operation_type || data.operationType;
    this.resourceType = data.resource_type || data.resourceType;
    this.status = data.status || 'pending';
    this.totalItems = data.total_items || data.totalItems || 0;
    this.processedItems = data.processed_items || data.processedItems || 0;
    this.successfulItems = data.successful_items || data.successfulItems || 0;
    this.failedItems = data.failed_items || data.failedItems || 0;
    this.errors = data.errors || [];
    this.results = data.results || [];
    this.createdAt = data.created_at || data.createdAt;
    this.completedAt = data.completed_at || data.completedAt;
  }

  /**
   * Create new bulk operation
   * @param {Object} operationData Operation data
   * @returns {Promise<BulkOperation>} Created operation
   */
  static async create(operationData) {
    try {
      const operation = new BulkOperation(operationData);

      await monitoredQuery(
        `INSERT INTO bulk_operations (
          id, admin_id, operation_type, resource_type, status, total_items
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          operation.id,
          operation.adminId,
          operation.operationType,
          operation.resourceType,
          operation.status,
          operation.totalItems
        ]
      );

      logger.info(`Bulk operation created: ${operation.id}`);
      return operation;
    } catch (error) {
      logger.error('Error creating bulk operation:', error);
      throw error;
    }
  }

  /**
   * Update bulk operation progress
   * @param {Object} updateData Update data
   * @returns {Promise<BulkOperation>} Updated operation
   */
  async updateProgress(updateData) {
    try {
      Object.assign(this, updateData);

      await monitoredQuery(
        `UPDATE bulk_operations SET
          status = ?, processed_items = ?, successful_items = ?, failed_items = ?,
          errors = ?, results = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          this.status,
          this.processedItems,
          this.successfulItems,
          this.failedItems,
          JSON.stringify(this.errors),
          JSON.stringify(this.results),
          this.completedAt,
          this.id
        ]
      );

      return this;
    } catch (error) {
      logger.error('Error updating bulk operation:', error);
      throw error;
    }
  }

  /**
   * Find bulk operation by ID
   * @param {string} id Operation ID
   * @returns {Promise<BulkOperation|null>} Operation or null
   */
  static async findById(id) {
    try {
      const [rows] = await monitoredQuery(
        'SELECT * FROM bulk_operations WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const operation = new BulkOperation(rows[0]);
      operation.errors = JSON.parse(rows[0].errors || '[]');
      operation.results = JSON.parse(rows[0].results || '[]');
      return operation;
    } catch (error) {
      logger.error('Error finding bulk operation by ID:', error);
      throw error;
    }
  }

  /**
   * Get all bulk operations for an admin
   * @param {string} adminId Admin ID
   * @param {Object} filters Filter options
   * @returns {Promise<Array<BulkOperation>>} Array of operations
   */
  static async findByAdmin(adminId, filters = {}) {
    try {
      let query = 'SELECT * FROM bulk_operations WHERE admin_id = ?';
      const params = [adminId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.operationType) {
        query += ' AND operation_type = ?';
        params.push(filters.operationType);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const [rows] = await monitoredQuery(query, params);

      return rows.map(row => {
        const operation = new BulkOperation(row);
        operation.errors = JSON.parse(row.errors || '[]');
        operation.results = JSON.parse(row.results || '[]');
        return operation;
      });
    } catch (error) {
      logger.error('Error finding bulk operations by admin:', error);
      throw error;
    }
  }

  /**
   * Get operation progress percentage
   * @returns {number} Progress percentage
   */
  getProgressPercentage() {
    if (this.totalItems === 0) return 0;
    return Math.round((this.processedItems / this.totalItems) * 100);
  }

  /**
   * Check if operation is complete
   * @returns {boolean} True if complete
   */
  isComplete() {
    return ['completed', 'failed'].includes(this.status);
  }
}

module.exports = {
  SystemConfiguration,
  AdminActivityLog,
  BulkOperation
};