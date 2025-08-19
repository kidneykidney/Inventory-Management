/**
 * User Models
 * Database models for user management and authentication
 */

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * User Model
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.status = data.status;
    this.department = data.department;
    this.phone = data.phone;
    this.address = data.address;
    this.profileImage = data.profile_image;
    this.lastLogin = data.last_login;
    this.emailVerified = data.email_verified;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [result] = await connection.execute(
        `INSERT INTO users (
          id, name, email, password_hash, role, status, 
          department, phone, address, email_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userData.name,
          userData.email,
          hashedPassword,
          userData.role || 'user',
          userData.status || 'active',
          userData.department || null,
          userData.phone || null,
          userData.address || null,
          userData.emailVerified || false
        ]
      );

      logger.info(`User created: ${userData.email}`);
      return await User.findById(id);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return new User(rows[0]);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      return new User(rows[0]);
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all users with pagination
   */
  static async findAll(options = {}) {
    const connection = await pool.getConnection();
    try {
      const { page = 1, limit = 10, role, status, search } = options;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (search) {
        query += ' AND (name LIKE ? OR email LIKE ? OR department LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.execute(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const countParams = [];

      if (role) {
        countQuery += ' AND role = ?';
        countParams.push(role);
      }

      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }

      if (search) {
        countQuery += ' AND (name LIKE ? OR email LIKE ? OR department LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      const [countRows] = await connection.execute(countQuery, countParams);
      const total = countRows[0].total;

      return {
        users: rows.map(row => new User(row)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update user
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key === 'password') {
          fields.push('password_hash = ?');
          values.push(bcrypt.hashSync(updateData[key], 10));
        } else if (key !== 'id') {
          const dbField = key === 'profileImage' ? 'profile_image' : 
                         key === 'emailVerified' ? 'email_verified' : key;
          fields.push(`${dbField} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const [result] = await connection.execute(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }

      logger.info(`User updated: ${id}`);
      return await User.findById(id);
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete user (soft delete by setting status to inactive)
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['inactive', id]
      );

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }

      logger.info(`User deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(email, password) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, password_hash FROM users WHERE email = ? AND status = ?',
        [email, 'active']
      );

      if (rows.length === 0) {
        return null;
      }

      const isValid = await bcrypt.compare(password, rows[0].password_hash);
      return isValid ? rows[0].id : null;
    } catch (error) {
      logger.error('Error verifying password:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    const connection = await pool.getConnection();
    try {
      const [totalRows] = await connection.execute(
        'SELECT COUNT(*) as total FROM users'
      );

      const [activeRows] = await connection.execute(
        'SELECT COUNT(*) as active FROM users WHERE status = ?',
        ['active']
      );

      const [adminRows] = await connection.execute(
        'SELECT COUNT(*) as admins FROM users WHERE role = ?',
        ['admin']
      );

      const [recentRows] = await connection.execute(
        'SELECT COUNT(*) as recent FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      return {
        total: totalRows[0].total,
        active: activeRows[0].active,
        admins: adminRows[0].admins,
        recentRegistrations: recentRows[0].recent
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      status: this.status,
      department: this.department,
      phone: this.phone,
      address: this.address,
      profileImage: this.profileImage,
      lastLogin: this.lastLogin,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

/**
 * User Session Model
 */
class UserSession {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.tokenHash = data.token_hash;
    this.deviceInfo = data.device_info;
    this.ipAddress = data.ip_address;
    this.expiresAt = data.expires_at;
    this.createdAt = data.created_at;
    this.lastUsed = data.last_used;
  }

  /**
   * Create a new session
   */
  static async create(sessionData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const tokenHash = require('crypto')
        .createHash('sha256')
        .update(sessionData.token)
        .digest('hex');

      await connection.execute(
        `INSERT INTO user_sessions (
          id, user_id, token_hash, device_info, ip_address, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          sessionData.userId,
          tokenHash,
          sessionData.deviceInfo || null,
          sessionData.ipAddress || null,
          sessionData.expiresAt
        ]
      );

      return id;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find session by token
   */
  static async findByToken(token) {
    const connection = await pool.getConnection();
    try {
      const tokenHash = require('crypto')
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const [rows] = await connection.execute(
        'SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
        [tokenHash]
      );

      if (rows.length === 0) {
        return null;
      }

      return new UserSession(rows[0]);
    } catch (error) {
      logger.error('Error finding session by token:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete session
   */
  static async delete(token) {
    const connection = await pool.getConnection();
    try {
      const tokenHash = require('crypto')
        .createHash('sha256')
        .update(token)
        .digest('hex');

      await connection.execute(
        'DELETE FROM user_sessions WHERE token_hash = ?',
        [tokenHash]
      );

      return true;
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Clean expired sessions
   */
  static async cleanExpired() {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM user_sessions WHERE expires_at <= NOW()'
      );

      logger.info(`Cleaned ${result.affectedRows} expired sessions`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error cleaning expired sessions:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = {
  User,
  UserSession
};