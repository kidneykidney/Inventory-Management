-- Migration for Electronics and Office Components Lending System
-- Creates tables for product catalog, lending transactions, and related functionality

-- Create product categories table for electronics and office components
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

-- Create lending products table with detailed specifications
CREATE TABLE IF NOT EXISTS lending_products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  purchase_date DATE,
  warranty_expiry DATE,
  condition_status ENUM('excellent', 'good', 'fair', 'needs_repair') DEFAULT 'good',
  location VARCHAR(100),
  is_available BOOLEAN DEFAULT TRUE,
  max_lending_period INT DEFAULT 30, -- days
  requires_approval BOOLEAN DEFAULT FALSE,
  image_urls JSON, -- Array of image URLs
  specifications JSON, -- Flexible specifications storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT
);

-- Create product tags table for enhanced searchability
CREATE TABLE IF NOT EXISTS product_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES lending_products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_tag (product_id, tag)
);

-- Create lending transactions table
CREATE TABLE IF NOT EXISTS lending_transactions (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  borrower_id INT NOT NULL,
  lend_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  status ENUM('active', 'overdue', 'returned', 'lost') DEFAULT 'active',
  condition_lent ENUM('excellent', 'good', 'fair') DEFAULT 'good',
  condition_returned ENUM('excellent', 'good', 'fair', 'damaged') NULL,
  notes TEXT,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES lending_products(id) ON DELETE RESTRICT,
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create email notifications table for tracking reminders
CREATE TABLE IF NOT EXISTS email_notifications (
  id VARCHAR(36) PRIMARY KEY,
  transaction_id VARCHAR(36) NOT NULL,
  notification_type ENUM('confirmation', 'reminder', 'overdue', 'return_confirmation') NOT NULL,
  recipient_email VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  FOREIGN KEY (transaction_id) REFERENCES lending_transactions(id) ON DELETE CASCADE
);

-- Create lending policies table for product-specific rules
CREATE TABLE IF NOT EXISTS lending_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  max_lending_period INT DEFAULT 30,
  requires_approval BOOLEAN DEFAULT FALSE,
  restricted_users JSON, -- Array of user IDs who cannot borrow this item
  maintenance_schedule JSON, -- Maintenance scheduling information
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES lending_products(id) ON DELETE CASCADE
);

-- Insert default product categories
INSERT IGNORE INTO product_categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Office Supplies', 'Office equipment and supplies'),
('Furniture', 'Office furniture and fixtures'),
('Tools', 'Tools and equipment'),
('Audio/Video', 'Audio and video equipment'),
('Computing', 'Computers and computing accessories'),
('Mobile Devices', 'Smartphones, tablets, and accessories'),
('Networking', 'Network equipment and accessories');

-- Insert subcategories for Electronics
INSERT IGNORE INTO product_categories (name, description, parent_id) VALUES
('Laptops', 'Laptop computers', (SELECT id FROM product_categories WHERE name = 'Electronics' LIMIT 1)),
('Monitors', 'Computer monitors and displays', (SELECT id FROM product_categories WHERE name = 'Electronics' LIMIT 1)),
('Keyboards', 'Computer keyboards', (SELECT id FROM product_categories WHERE name = 'Electronics' LIMIT 1)),
('Mice', 'Computer mice and pointing devices', (SELECT id FROM product_categories WHERE name = 'Electronics' LIMIT 1)),
('Cables', 'Various cables and adapters', (SELECT id FROM product_categories WHERE name = 'Electronics' LIMIT 1));

-- Insert subcategories for Office Supplies
INSERT IGNORE INTO product_categories (name, description, parent_id) VALUES
('Printers', 'Printers and printing equipment', (SELECT id FROM product_categories WHERE name = 'Office Supplies' LIMIT 1)),
('Scanners', 'Document scanners', (SELECT id FROM product_categories WHERE name = 'Office Supplies' LIMIT 1)),
('Projectors', 'Presentation projectors', (SELECT id FROM product_categories WHERE name = 'Office Supplies' LIMIT 1)),
('Whiteboards', 'Whiteboards and presentation boards', (SELECT id FROM product_categories WHERE name = 'Office Supplies' LIMIT 1));

-- Create indexes for better performance
CREATE INDEX idx_lending_products_category ON lending_products(category_id);
CREATE INDEX idx_lending_products_available ON lending_products(is_available);
CREATE INDEX idx_lending_products_brand_model ON lending_products(brand, model);
CREATE INDEX idx_lending_transactions_status ON lending_transactions(status);
CREATE INDEX idx_lending_transactions_due_date ON lending_transactions(due_date);
CREATE INDEX idx_lending_transactions_borrower ON lending_transactions(borrower_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);