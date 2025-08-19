const { pool, monitoredQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Product Model for Electronics and Office Components Lending System
 * Handles CRUD operations for lending products with specifications and categorization
 */
class LendingProduct {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.categoryId = data.categoryId || data.category_id;
    this.subcategory = data.subcategory;
    this.brand = data.brand;
    this.model = data.model;
    this.serialNumber = data.serialNumber || data.serial_number;
    this.purchaseDate = data.purchaseDate || data.purchase_date;
    this.warrantyExpiry = data.warrantyExpiry || data.warranty_expiry;
    this.conditionStatus = data.conditionStatus || data.condition_status || 'good';
    this.location = data.location;
    this.isAvailable = data.isAvailable !== undefined ? data.isAvailable : data.is_available !== undefined ? data.is_available : true;
    this.maxLendingPeriod = data.maxLendingPeriod !== undefined ? data.maxLendingPeriod : data.max_lending_period !== undefined ? data.max_lending_period : 30;
    this.requiresApproval = data.requiresApproval !== undefined ? data.requiresApproval : data.requires_approval !== undefined ? data.requires_approval : false;
    this.imageUrls = data.imageUrls || data.image_urls || [];
    this.specifications = data.specifications || {};
    this.tags = data.tags || [];
  }

  /**
   * Validate product data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!this.categoryId) {
      errors.push('Category is required');
    }

    if (this.name && this.name.length > 200) {
      errors.push('Product name must be less than 200 characters');
    }

    if (this.serialNumber && this.serialNumber.length > 100) {
      errors.push('Serial number must be less than 100 characters');
    }

    if (this.brand && this.brand.length > 100) {
      errors.push('Brand must be less than 100 characters');
    }

    if (this.model && this.model.length > 100) {
      errors.push('Model must be less than 100 characters');
    }

    if (this.location && this.location.length > 100) {
      errors.push('Location must be less than 100 characters');
    }

    if (!['excellent', 'good', 'fair', 'needs_repair'].includes(this.conditionStatus)) {
      errors.push('Invalid condition status');
    }

    if (typeof this.maxLendingPeriod === 'number' && (this.maxLendingPeriod < 1 || this.maxLendingPeriod > 365)) {
      errors.push('Max lending period must be between 1 and 365 days');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save product to database
   * @returns {Promise<LendingProduct>} Saved product instance
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if serial number already exists (if provided)
      if (this.serialNumber) {
        const existingResult = await connection.execute(
          'SELECT id FROM lending_products WHERE serial_number = ? AND id != ?',
          [this.serialNumber, this.id]
        );
        const existing = existingResult[0];
        if (existing.length > 0) {
          throw new Error('Serial number already exists');
        }
      }

      // Insert or update product
      const existingProductResult = await connection.execute(
        'SELECT id FROM lending_products WHERE id = ?',
        [this.id]
      );
      const existingProduct = existingProductResult[0];

      if (existingProduct.length > 0) {
        // Update existing product
        await connection.execute(`
          UPDATE lending_products SET
            name = ?, description = ?, category_id = ?, subcategory = ?,
            brand = ?, model = ?, serial_number = ?, purchase_date = ?,
            warranty_expiry = ?, condition_status = ?, location = ?,
            is_available = ?, max_lending_period = ?, requires_approval = ?,
            image_urls = ?, specifications = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          this.name, this.description, this.categoryId, this.subcategory,
          this.brand, this.model, this.serialNumber, this.purchaseDate,
          this.warrantyExpiry, this.conditionStatus, this.location,
          this.isAvailable, this.maxLendingPeriod, this.requiresApproval,
          JSON.stringify(this.imageUrls), JSON.stringify(this.specifications),
          this.id
        ]);
      } else {
        // Insert new product
        await connection.execute(`
          INSERT INTO lending_products (
            id, name, description, category_id, subcategory, brand, model,
            serial_number, purchase_date, warranty_expiry, condition_status,
            location, is_available, max_lending_period, requires_approval,
            image_urls, specifications
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.id, this.name, this.description, this.categoryId, this.subcategory,
          this.brand, this.model, this.serialNumber, this.purchaseDate,
          this.warrantyExpiry, this.conditionStatus, this.location,
          this.isAvailable, this.maxLendingPeriod, this.requiresApproval,
          JSON.stringify(this.imageUrls), JSON.stringify(this.specifications)
        ]);
      }

      // Handle tags
      if (this.tags && this.tags.length > 0) {
        // Delete existing tags
        await connection.execute('DELETE FROM product_tags WHERE product_id = ?', [this.id]);
        
        // Insert new tags
        for (const tag of this.tags) {
          if (tag && tag.trim()) {
            await connection.execute(
              'INSERT INTO product_tags (product_id, tag) VALUES (?, ?)',
              [this.id, tag.trim().toLowerCase()]
            );
          }
        }
      }

      await connection.commit();
      logger.info(`Product saved successfully: ${this.id}`);
      return this;
    } catch (error) {
      await connection.rollback();
      logger.error('Error saving product:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find product by ID
   * @param {string} id Product ID
   * @returns {Promise<LendingProduct|null>} Product instance or null
   */
  static async findById(id) {
    try {
      const [rows] = await monitoredQuery(`
        SELECT p.*, pc.name as category_name,
               GROUP_CONCAT(pt.tag) as tags
        FROM lending_products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN product_tags pt ON p.id = pt.product_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [id]);

      if (rows.length === 0) {
        return null;
      }

      const productData = rows[0];
      productData.imageUrls = JSON.parse(productData.image_urls || '[]');
      productData.specifications = JSON.parse(productData.specifications || '{}');
      productData.tags = productData.tags ? productData.tags.split(',') : [];

      return new LendingProduct(productData);
    } catch (error) {
      logger.error('Error finding product by ID:', error);
      throw error;
    }
  }

  /**
   * Find all products with optional filtering
   * @param {Object} filters Filter options
   * @returns {Promise<Array<LendingProduct>>} Array of products
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, pc.name as category_name,
               GROUP_CONCAT(DISTINCT pt.tag) as tags
        FROM lending_products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN product_tags pt ON p.id = pt.product_id
      `;
      
      const conditions = [];
      const params = [];

      if (filters.categoryId) {
        conditions.push('p.category_id = ?');
        params.push(filters.categoryId);
      }

      if (filters.isAvailable !== undefined) {
        conditions.push('p.is_available = ?');
        params.push(filters.isAvailable);
      }

      if (filters.brand) {
        conditions.push('p.brand LIKE ?');
        params.push(`%${filters.brand}%`);
      }

      if (filters.condition) {
        conditions.push('p.condition_status = ?');
        params.push(filters.condition);
      }

      if (filters.location) {
        conditions.push('p.location LIKE ?');
        params.push(`%${filters.location}%`);
      }

      if (filters.search) {
        conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.model LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => 'pt.tag = ?').join(' OR ');
        conditions.push(`p.id IN (SELECT DISTINCT product_id FROM product_tags WHERE ${tagConditions})`);
        params.push(...filters.tags);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id';

      if (filters.sortBy) {
        const sortField = filters.sortBy === 'name' ? 'p.name' : 
                         filters.sortBy === 'brand' ? 'p.brand' :
                         filters.sortBy === 'created_at' ? 'p.created_at' : 'p.name';
        const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        query += ' ORDER BY p.name ASC';
      }

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
        row.imageUrls = JSON.parse(row.image_urls || '[]');
        row.specifications = JSON.parse(row.specifications || '{}');
        row.tags = row.tags ? row.tags.split(',') : [];
        return new LendingProduct(row);
      });
    } catch (error) {
      logger.error('Error finding products:', error);
      throw error;
    }
  }

  /**
   * Delete product by ID
   * @param {string} id Product ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteById(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if product has active lending transactions
      const activeLendingsResult = await connection.execute(
        'SELECT id FROM lending_transactions WHERE product_id = ? AND status IN ("active", "overdue")',
        [id]
      );
      const activeLendings = activeLendingsResult[0];

      if (activeLendings.length > 0) {
        throw new Error('Cannot delete product with active lending transactions');
      }

      // Delete product tags
      await connection.execute('DELETE FROM product_tags WHERE product_id = ?', [id]);
      
      // Delete product
      const deleteResult = await connection.execute('DELETE FROM lending_products WHERE id = ?', [id]);
      const result = deleteResult[0];
      
      await connection.commit();
      logger.info(`Product deleted successfully: ${id}`);
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      logger.error('Error deleting product:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get product statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    try {
      const [stats] = await monitoredQuery(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_products,
          SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as unavailable_products,
          COUNT(DISTINCT category_id) as total_categories,
          COUNT(DISTINCT brand) as total_brands
        FROM lending_products
      `);

      const [categoryStats] = await monitoredQuery(`
        SELECT pc.name as category, COUNT(p.id) as count
        FROM product_categories pc
        LEFT JOIN lending_products p ON pc.id = p.category_id
        GROUP BY pc.id, pc.name
        ORDER BY count DESC
      `);

      const [conditionStats] = await monitoredQuery(`
        SELECT condition_status, COUNT(*) as count
        FROM lending_products
        GROUP BY condition_status
        ORDER BY count DESC
      `);

      return {
        overview: stats[0],
        byCategory: categoryStats,
        byCondition: conditionStats
      };
    } catch (error) {
      logger.error('Error getting product statistics:', error);
      throw error;
    }
  }
}

/**
 * Product Category Model
 */
class ProductCategory {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.parentId = data.parentId || data.parent_id;
  }

  /**
   * Get all categories
   * @returns {Promise<Array<ProductCategory>>} Array of categories
   */
  static async findAll() {
    try {
      const [rows] = await monitoredQuery(`
        SELECT id, name, description, parent_id
        FROM product_categories
        ORDER BY parent_id IS NULL DESC, name ASC
      `);

      return rows.map(row => new ProductCategory(row));
    } catch (error) {
      logger.error('Error finding categories:', error);
      throw error;
    }
  }

  /**
   * Create new category
   * @param {Object} data Category data
   * @returns {Promise<ProductCategory>} Created category
   */
  static async create(data) {
    try {
      const [result] = await monitoredQuery(
        'INSERT INTO product_categories (name, description, parent_id) VALUES (?, ?, ?)',
        [data.name, data.description, data.parentId]
      );

      return new ProductCategory({
        id: result.insertId,
        ...data
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }
}

/**
 * Lending Transaction Model
 * Handles lending transactions with 1-month automatic return dates
 */
class LendingTransaction {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.productId = data.productId || data.product_id;
    this.borrowerId = data.borrowerId || data.borrower_id;
    this.lendDate = data.lendDate || data.lend_date || new Date();
    this.dueDate = data.dueDate || data.due_date || this.calculateDueDate(this.lendDate);
    this.returnDate = data.returnDate || data.return_date || null;
    this.status = data.status || 'active';
    this.conditionLent = data.conditionLent || data.condition_lent || 'good';
    this.conditionReturned = data.conditionReturned || data.condition_returned || null;
    this.notes = data.notes || '';
    this.approvedBy = data.approvedBy || data.approved_by || null;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  /**
   * Calculate due date (1 month from lend date)
   * @param {Date} lendDate The lending date
   * @returns {Date} Due date
   */
  calculateDueDate(lendDate) {
    const date = new Date(lendDate);
    date.setMonth(date.getMonth() + 1);
    return date;
  }

  /**
   * Check if transaction is overdue
   * @returns {boolean} True if overdue
   */
  isOverdue() {
    if (this.status === 'returned' || this.returnDate) {
      return false;
    }
    return new Date() > new Date(this.dueDate);
  }

  /**
   * Get days until due (negative if overdue)
   * @returns {number} Days until due
   */
  getDaysUntilDue() {
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate transaction data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    if (!this.productId) {
      errors.push('Product ID is required');
    }

    if (!this.borrowerId) {
      errors.push('Borrower ID is required');
    }

    if (!this.lendDate) {
      errors.push('Lend date is required');
    }

    if (!this.dueDate) {
      errors.push('Due date is required');
    }

    if (!['active', 'overdue', 'returned', 'lost'].includes(this.status)) {
      errors.push('Invalid status');
    }

    if (!['excellent', 'good', 'fair'].includes(this.conditionLent)) {
      errors.push('Invalid condition lent');
    }

    if (this.conditionReturned && !['excellent', 'good', 'fair', 'damaged'].includes(this.conditionReturned)) {
      errors.push('Invalid condition returned');
    }

    if (this.lendDate && this.dueDate && new Date(this.lendDate) >= new Date(this.dueDate)) {
      errors.push('Due date must be after lend date');
    }

    if (this.returnDate && this.lendDate && new Date(this.returnDate) < new Date(this.lendDate)) {
      errors.push('Return date cannot be before lend date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check product availability before lending
   * @param {string} productId Product ID to check
   * @returns {Promise<boolean>} True if available
   */
  static async checkAvailability(productId) {
    try {
      // Check if product exists and is available
      const [productRows] = await monitoredQuery(
        'SELECT is_available FROM lending_products WHERE id = ?',
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error('Product not found');
      }

      if (!productRows[0].is_available) {
        return false;
      }

      // Check if product has any active lending transactions
      const [transactionRows] = await monitoredQuery(
        'SELECT id FROM lending_transactions WHERE product_id = ? AND status IN ("active", "overdue")',
        [productId]
      );

      return transactionRows.length === 0;
    } catch (error) {
      logger.error('Error checking product availability:', error);
      throw error;
    }
  }

  /**
   * Save transaction to database
   * @returns {Promise<LendingTransaction>} Saved transaction instance
   */
  async save() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check availability before creating transaction
      const isAvailable = await LendingTransaction.checkAvailability(this.productId);
      if (!isAvailable) {
        throw new Error('Product is not available for lending');
      }

      // Update transaction status if overdue
      if (this.isOverdue() && this.status === 'active') {
        this.status = 'overdue';
      }

      // Check if transaction exists
      const existingResult = await connection.execute(
        'SELECT id FROM lending_transactions WHERE id = ?',
        [this.id]
      );
      const existing = existingResult[0];

      if (existing.length > 0) {
        // Update existing transaction
        await connection.execute(`
          UPDATE lending_transactions SET
            product_id = ?, borrower_id = ?, lend_date = ?, due_date = ?,
            return_date = ?, status = ?, condition_lent = ?, condition_returned = ?,
            notes = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          this.productId, this.borrowerId, this.lendDate, this.dueDate,
          this.returnDate, this.status, this.conditionLent, this.conditionReturned,
          this.notes, this.approvedBy, this.id
        ]);
      } else {
        // Insert new transaction
        await connection.execute(`
          INSERT INTO lending_transactions (
            id, product_id, borrower_id, lend_date, due_date, return_date,
            status, condition_lent, condition_returned, notes, approved_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.id, this.productId, this.borrowerId, this.lendDate, this.dueDate,
          this.returnDate, this.status, this.conditionLent, this.conditionReturned,
          this.notes, this.approvedBy
        ]);

        // Update product availability
        await connection.execute(
          'UPDATE lending_products SET is_available = FALSE WHERE id = ?',
          [this.productId]
        );
      }

      await connection.commit();
      logger.info(`Lending transaction saved successfully: ${this.id}`);
      return this;
    } catch (error) {
      await connection.rollback();
      logger.error('Error saving lending transaction:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process return of borrowed item
   * @param {Object} returnData Return data including condition and notes
   * @returns {Promise<LendingTransaction>} Updated transaction
   */
  async processReturn(returnData) {
    if (this.status === 'returned') {
      throw new Error('Item has already been returned');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      this.returnDate = returnData.returnDate || new Date();
      this.conditionReturned = returnData.conditionReturned || 'good';
      this.status = 'returned';
      this.notes = returnData.notes || this.notes;

      // Update transaction
      await connection.execute(`
        UPDATE lending_transactions SET
          return_date = ?, condition_returned = ?, status = ?, notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [this.returnDate, this.conditionReturned, this.status, this.notes, this.id]);

      // Update product availability
      await connection.execute(
        'UPDATE lending_products SET is_available = TRUE WHERE id = ?',
        [this.productId]
      );

      // Update product condition if damaged
      if (this.conditionReturned === 'damaged') {
        await connection.execute(
          'UPDATE lending_products SET condition_status = ? WHERE id = ?',
          ['needs_repair', this.productId]
        );
      }

      await connection.commit();
      logger.info(`Item returned successfully: ${this.id}`);
      return this;
    } catch (error) {
      await connection.rollback();
      logger.error('Error processing return:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find transaction by ID
   * @param {string} id Transaction ID
   * @returns {Promise<LendingTransaction|null>} Transaction instance or null
   */
  static async findById(id) {
    try {
      const [rows] = await monitoredQuery(`
        SELECT lt.*, 
               lp.name as product_name, lp.brand, lp.model,
               u.username as borrower_name, u.email as borrower_email,
               approver.username as approved_by_name
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        JOIN users u ON lt.borrower_id = u.id
        LEFT JOIN users approver ON lt.approved_by = approver.id
        WHERE lt.id = ?
      `, [id]);

      if (rows.length === 0) {
        return null;
      }

      const transactionData = rows[0];
      return new LendingTransaction(transactionData);
    } catch (error) {
      logger.error('Error finding transaction by ID:', error);
      throw error;
    }
  }

  /**
   * Find all transactions with optional filtering
   * @param {Object} filters Filter options
   * @returns {Promise<Array<LendingTransaction>>} Array of transactions
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT lt.*, 
               lp.name as product_name, lp.brand, lp.model,
               u.username as borrower_name, u.email as borrower_email,
               approver.username as approved_by_name
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        JOIN users u ON lt.borrower_id = u.id
        LEFT JOIN users approver ON lt.approved_by = approver.id
      `;
      
      const conditions = [];
      const params = [];

      if (filters.status) {
        conditions.push('lt.status = ?');
        params.push(filters.status);
      }

      if (filters.borrowerId) {
        conditions.push('lt.borrower_id = ?');
        params.push(filters.borrowerId);
      }

      if (filters.productId) {
        conditions.push('lt.product_id = ?');
        params.push(filters.productId);
      }

      if (filters.overdue) {
        conditions.push('lt.due_date < CURDATE() AND lt.status IN ("active", "overdue")');
      }

      if (filters.dueSoon) {
        conditions.push('lt.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND lt.status = "active"');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY lt.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const [rows] = await monitoredQuery(query, params);

      return rows.map(row => new LendingTransaction(row));
    } catch (error) {
      logger.error('Error finding transactions:', error);
      throw error;
    }
  }

  /**
   * Get overdue transactions
   * @returns {Promise<Array<LendingTransaction>>} Array of overdue transactions
   */
  static async getOverdueTransactions() {
    try {
      const [rows] = await monitoredQuery(`
        SELECT lt.*, 
               lp.name as product_name, lp.brand, lp.model,
               u.username as borrower_name, u.email as borrower_email
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        JOIN users u ON lt.borrower_id = u.id
        WHERE lt.due_date < CURDATE() AND lt.status IN ('active', 'overdue')
        ORDER BY lt.due_date ASC
      `);

      return rows.map(row => new LendingTransaction(row));
    } catch (error) {
      logger.error('Error getting overdue transactions:', error);
      throw error;
    }
  }

  /**
   * Update overdue transaction statuses
   * @returns {Promise<number>} Number of updated transactions
   */
  static async updateOverdueStatuses() {
    try {
      const [result] = await monitoredQuery(`
        UPDATE lending_transactions 
        SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
        WHERE due_date < CURDATE() AND status = 'active'
      `);

      logger.info(`Updated ${result.affectedRows} transactions to overdue status`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error updating overdue statuses:', error);
      throw error;
    }
  }

  /**
   * Get lending statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    try {
      const [stats] = await monitoredQuery(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_transactions,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_transactions,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_transactions,
          SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_transactions,
          AVG(DATEDIFF(COALESCE(return_date, CURDATE()), lend_date)) as avg_lending_period
        FROM lending_transactions
      `);

      const [monthlyStats] = await monitoredQuery(`
        SELECT 
          DATE_FORMAT(lend_date, '%Y-%m') as month,
          COUNT(*) as transactions_count
        FROM lending_transactions
        WHERE lend_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(lend_date, '%Y-%m')
        ORDER BY month DESC
      `);

      const [popularProducts] = await monitoredQuery(`
        SELECT 
          lp.name as product_name,
          lp.brand,
          lp.model,
          COUNT(lt.id) as lending_count
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        GROUP BY lt.product_id, lp.name, lp.brand, lp.model
        ORDER BY lending_count DESC
        LIMIT 10
      `);

      return {
        overview: stats[0],
        monthly: monthlyStats,
        popularProducts: popularProducts
      };
    } catch (error) {
      logger.error('Error getting lending statistics:', error);
      throw error;
    }
  }

  /**
   * Get lending history with detailed filtering
   * @param {Object} filters Filter options
   * @returns {Promise<Array<LendingTransaction>>} Array of transactions with history details
   */
  static async getHistory(filters = {}) {
    try {
      let query = `
        SELECT lt.*, 
               lp.name as product_name, lp.brand, lp.model, lp.category_id,
               pc.name as category_name,
               u.username as borrower_name, u.email as borrower_email,
               approver.username as approved_by_name,
               DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date) as lending_duration,
               CASE 
                 WHEN lt.return_date IS NULL AND lt.due_date < CURDATE() THEN DATEDIFF(CURDATE(), lt.due_date)
                 WHEN lt.return_date IS NOT NULL AND lt.return_date > lt.due_date THEN DATEDIFF(lt.return_date, lt.due_date)
                 ELSE 0
               END as days_overdue
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        LEFT JOIN product_categories pc ON lp.category_id = pc.id
        JOIN users u ON lt.borrower_id = u.id
        LEFT JOIN users approver ON lt.approved_by = approver.id
      `;
      
      const conditions = [];
      const params = [];

      if (filters.borrowerId) {
        conditions.push('lt.borrower_id = ?');
        params.push(filters.borrowerId);
      }

      if (filters.productId) {
        conditions.push('lt.product_id = ?');
        params.push(filters.productId);
      }

      if (filters.excludeReturned) {
        conditions.push('lt.status != "returned"');
      }

      if (filters.dateRange) {
        if (filters.dateRange.start) {
          conditions.push('lt.lend_date >= ?');
          params.push(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          conditions.push('lt.lend_date <= ?');
          params.push(filters.dateRange.end);
        }
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY lt.lend_date DESC';

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
        const transaction = new LendingTransaction(row);
        transaction.productName = row.product_name;
        transaction.productBrand = row.brand;
        transaction.productModel = row.model;
        transaction.categoryName = row.category_name;
        transaction.borrowerName = row.borrower_name;
        transaction.borrowerEmail = row.borrower_email;
        transaction.approvedByName = row.approved_by_name;
        transaction.lendingDuration = row.lending_duration;
        transaction.daysOverdue = row.days_overdue;
        return transaction;
      });
    } catch (error) {
      logger.error('Error getting lending history:', error);
      throw error;
    }
  }

  /**
   * Get lending analytics and trends
   * @param {Object} options Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  static async getAnalytics(options = {}) {
    try {
      const { period = '12months', groupBy = 'month' } = options;

      // Determine date range based on period
      let dateCondition = '';
      let dateFormat = '%Y-%m';
      
      switch (period) {
        case '30days':
          dateCondition = 'WHERE lt.lend_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
          dateFormat = '%Y-%m-%d';
          break;
        case '90days':
          dateCondition = 'WHERE lt.lend_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
          dateFormat = groupBy === 'week' ? '%Y-%u' : '%Y-%m-%d';
          break;
        case '6months':
          dateCondition = 'WHERE lt.lend_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
          break;
        case '12months':
        default:
          dateCondition = 'WHERE lt.lend_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
          break;
      }

      // Lending trends over time
      const [trendData] = await monitoredQuery(`
        SELECT 
          DATE_FORMAT(lt.lend_date, '${dateFormat}') as period,
          COUNT(*) as total_lendings,
          COUNT(CASE WHEN lt.status = 'returned' THEN 1 END) as returned_count,
          COUNT(CASE WHEN lt.status = 'overdue' THEN 1 END) as overdue_count,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_duration
        FROM lending_transactions lt
        ${dateCondition}
        GROUP BY DATE_FORMAT(lt.lend_date, '${dateFormat}')
        ORDER BY period DESC
      `);

      // Category analytics
      const [categoryData] = await monitoredQuery(`
        SELECT 
          pc.name as category,
          COUNT(lt.id) as lending_count,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_duration,
          COUNT(CASE WHEN lt.status = 'overdue' THEN 1 END) as overdue_count
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        LEFT JOIN product_categories pc ON lp.category_id = pc.id
        ${dateCondition}
        GROUP BY pc.id, pc.name
        ORDER BY lending_count DESC
      `);

      // User analytics (top borrowers)
      const [userAnalytics] = await monitoredQuery(`
        SELECT 
          u.username,
          u.email,
          COUNT(lt.id) as total_lendings,
          COUNT(CASE WHEN lt.status = 'returned' THEN 1 END) as returned_count,
          COUNT(CASE WHEN lt.status = 'overdue' THEN 1 END) as overdue_count,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_duration
        FROM lending_transactions lt
        JOIN users u ON lt.borrower_id = u.id
        ${dateCondition}
        GROUP BY u.id, u.username, u.email
        ORDER BY total_lendings DESC
        LIMIT 10
      `);

      // Return rate analytics
      const [returnRateData] = await monitoredQuery(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_transactions,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_transactions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_transactions,
          COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_transactions,
          ROUND((COUNT(CASE WHEN status = 'returned' THEN 1 END) / COUNT(*)) * 100, 2) as return_rate,
          ROUND((COUNT(CASE WHEN status = 'overdue' THEN 1 END) / COUNT(*)) * 100, 2) as overdue_rate
        FROM lending_transactions lt
        ${dateCondition}
      `);

      return {
        trends: trendData,
        categories: categoryData,
        topBorrowers: userAnalytics,
        returnRates: returnRateData[0],
        period,
        groupBy
      };
    } catch (error) {
      logger.error('Error getting lending analytics:', error);
      throw error;
    }
  }

  /**
   * Create a product reservation
   * @param {Object} reservationData Reservation data
   * @returns {Promise<LendingTransaction>} Created reservation
   */
  static async createReservation(reservationData) {
    try {
      const reservation = new LendingTransaction({
        id: uuidv4(),
        productId: reservationData.productId,
        borrowerId: reservationData.borrowerId,
        status: 'reserved',
        notes: reservationData.notes || '',
        approvedBy: reservationData.reservedBy,
        lendDate: null, // Will be set when actually lent
        dueDate: null   // Will be calculated when actually lent
      });

      // Don't call save() as it has validation that requires lendDate/dueDate
      // Instead, directly insert the reservation
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Check availability one more time
        const isAvailable = await LendingTransaction.checkAvailability(reservationData.productId);
        if (!isAvailable) {
          throw new Error('Product is no longer available for reservation');
        }

        await connection.execute(`
          INSERT INTO lending_transactions (
            id, product_id, borrower_id, status, notes, approved_by
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          reservation.id, reservation.productId, reservation.borrowerId,
          reservation.status, reservation.notes, reservation.approvedBy
        ]);

        // Mark product as temporarily unavailable
        await connection.execute(
          'UPDATE lending_products SET is_available = FALSE WHERE id = ?',
          [reservation.productId]
        );

        await connection.commit();
        logger.info(`Reservation created successfully: ${reservation.id}`);
        return reservation;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Cancel a product reservation
   * @param {string} reservationId Reservation ID
   * @returns {Promise<boolean>} Success status
   */
  static async cancelReservation(reservationId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get reservation details
      const reservationResult = await connection.execute(
        'SELECT product_id FROM lending_transactions WHERE id = ? AND status = "reserved"',
        [reservationId]
      );
      const reservation = reservationResult[0];

      if (reservation.length === 0) {
        throw new Error('Reservation not found or not in reserved status');
      }

      const productId = reservation[0].product_id;

      // Delete the reservation
      await connection.execute(
        'DELETE FROM lending_transactions WHERE id = ?',
        [reservationId]
      );

      // Make product available again
      await connection.execute(
        'UPDATE lending_products SET is_available = TRUE WHERE id = ?',
        [productId]
      );

      await connection.commit();
      logger.info(`Reservation cancelled successfully: ${reservationId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error('Error cancelling reservation:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = {
  LendingProduct,
  ProductCategory,
  LendingTransaction
};