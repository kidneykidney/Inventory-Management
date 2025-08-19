const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('../utils/logger');
const performanceMonitor = require('../utils/performanceMonitor');

/**
 * Database connection pool
 * Creates and manages a pool of MySQL connections
 */
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  port: config.database.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Initialize database connection
 * Validates connection and creates tables if they don't exist
 * Implements connection retry logic for better reliability
 */
const initDatabase = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000; // 3 seconds

  let retries = 0;
  let lastError = null;

  while (retries < MAX_RETRIES) {
    try {
      // Test database connection
      const connection = await pool.getConnection();
      logger.info('Database connection established successfully');

      // Create tables if they don't exist
      await createTables(connection);

      connection.release();
      return true;
    } catch (error) {
      lastError = error;
      retries++;

      const retryMessage =
        retries < MAX_RETRIES
          ? `Retrying in ${RETRY_DELAY / 1000} seconds (${retries}/${MAX_RETRIES})`
          : 'Maximum retry attempts reached';

      logger.error(
        `Failed to connect to the database: ${error.message}. ${retryMessage}`
      );

      if (retries < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  logger.error('Database connection failed after multiple attempts', lastError);
  throw lastError;
};

/**
 * Create necessary database tables if they don't exist
 * @param {Object} connection - MySQL connection
 */
const createTables = async connection => {
  try {
    // Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'user') DEFAULT 'user',
        department VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        join_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Locations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category_id INT,
        price DECIMAL(10, 2) DEFAULT 0,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Create Inventory table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        location_id INT,
        quantity INT NOT NULL DEFAULT 0,
        status ENUM('In Stock', 'Low Stock', 'Out of Stock') DEFAULT 'Out of Stock',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
      )
    `);

    // Create Transactions table (for lending/giving)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        transaction_type ENUM('lend', 'give', 'receive', 'add') NOT NULL,
        recipient VARCHAR(100),
        purpose TEXT,
        return_date DATE,
        returned BOOLEAN DEFAULT FALSE,
        user_id INT,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create Suppliers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        supplier_id INT,
        status ENUM('pending', 'ordered', 'received', 'cancelled') DEFAULT 'pending',
        order_date DATE,
        expected_date DATE,
        received_date DATE,
        total_amount DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create Order Items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) AS (quantity * unit_price),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create Epics table for Agile backlog management
    await connection.query(`
      CREATE TABLE IF NOT EXISTS epics (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        business_value TEXT NOT NULL,
        status ENUM('planned', 'in-progress', 'complete') DEFAULT 'planned',
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        target_sprint INT,
        estimated_story_points INT DEFAULT 0,
        completed_story_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL
      )
    `);

    // Create Sprints table for Agile sprint management
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id VARCHAR(36) PRIMARY KEY,
        number INT NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        goal TEXT NOT NULL,
        status ENUM('planning', 'active', 'review', 'complete') DEFAULT 'planning',
        velocity INT DEFAULT 0,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create User Stories table for Agile backlog management
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_stories (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        story_points INT NOT NULL,
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('backlog', 'todo', 'in-progress', 'review', 'done') DEFAULT 'backlog',
        assignee VARCHAR(100),
        epic_id VARCHAR(36),
        sprint_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (epic_id) REFERENCES epics(id) ON DELETE SET NULL,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
      )
    `);

    // Create Acceptance Criteria table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS acceptance_criteria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_story_id VARCHAR(36) NOT NULL,
        criterion TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE
      )
    `);

    // Create Story Tags table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS story_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_story_id VARCHAR(36) NOT NULL,
        tag VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE,
        UNIQUE KEY unique_story_tag (user_story_id, tag)
      )
    `);

    // Create Tasks table for user stories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS story_tasks (
        id VARCHAR(36) PRIMARY KEY,
        user_story_id VARCHAR(36) NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        assignee VARCHAR(100),
        estimated_hours DECIMAL(4,1),
        actual_hours DECIMAL(4,1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE
      )
    `);

    // Create Burndown Data table for sprint tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS burndown_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sprint_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        remaining_points INT NOT NULL,
        ideal_remaining INT NOT NULL,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
        UNIQUE KEY unique_sprint_date (sprint_id, date)
      )
    `);

    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error creating database tables', error);
    throw error;
  }
};

/**
 * Monitored database query execution
 * Wraps database queries with performance monitoring
 */
const monitoredQuery = async (query, params = []) => {
  const startTime = Date.now();
  let error = null;
  
  try {
    const result = await pool.execute(query, params);
    const duration = Date.now() - startTime;
    
    // Track successful query
    performanceMonitor.trackDatabaseQuery(query, duration);
    
    return result;
  } catch (err) {
    error = err;
    const duration = Date.now() - startTime;
    
    // Track failed query
    performanceMonitor.trackDatabaseQuery(query, duration, err);
    
    throw err;
  }
};

/**
 * Get database connection with monitoring
 */
const getMonitoredConnection = async () => {
  const connection = await pool.getConnection();
  
  // Wrap the query method to add monitoring
  const originalQuery = connection.query.bind(connection);
  const originalExecute = connection.execute.bind(connection);
  
  connection.query = async (sql, params) => {
    const startTime = Date.now();
    let error = null;
    
    try {
      const result = await originalQuery(sql, params);
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery(sql, duration);
      return result;
    } catch (err) {
      error = err;
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery(sql, duration, err);
      throw err;
    }
  };
  
  connection.execute = async (sql, params) => {
    const startTime = Date.now();
    let error = null;
    
    try {
      const result = await originalExecute(sql, params);
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery(sql, duration);
      return result;
    } catch (err) {
      error = err;
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery(sql, duration, err);
      throw err;
    }
  };
  
  return connection;
};

// Export pool and utilities for database operations
module.exports = {
  pool,
  initDatabase,
  monitoredQuery,
  getMonitoredConnection,
};
