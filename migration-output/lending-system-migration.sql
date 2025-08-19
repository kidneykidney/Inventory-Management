-- Lending System Migration Script
-- Generated on: 2025-08-15T08:45:50.741Z
-- Migrates inventory data to lending system structure

-- Create lending_items table
CREATE TABLE IF NOT EXISTS lending_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  specifications JSON,
  quantity INT NOT NULL DEFAULT 0,
  available INT NOT NULL DEFAULT 0,
  location VARCHAR(255),
  condition ENUM('excellent', 'good', 'fair', 'needs_repair') DEFAULT 'good',
  tags JSON,
  is_available BOOLEAN DEFAULT TRUE,
  max_lending_period INT DEFAULT 30,
  requires_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  migrated_from VARCHAR(50),
  migration_date TIMESTAMP,
  original_status VARCHAR(50)
);

-- Insert migrated data
INSERT INTO lending_items (
  sku, name, category, subcategory, brand, model, serial_number,
  specifications, quantity, available, location, `condition`, tags,
  is_available, max_lending_period, requires_approval,
  migrated_from, migration_date, original_status
) VALUES (
  'SKU001',
  'Laptop',
  'Electronics',
  'General Electronics',
  'Generic',
  'Laptop',
  'SKU001-550739',
  '{"type":"Electronic Device","powerRequirement":"Standard AC","acquisitionDate":"2024-08-21"}',
  25,
  25,
  'Warehouse A',
  'excellent',
  '["electronics","tech","portable","computing"]',
  true,
  30,
  true,
  'inventory_system',
  '2025-08-15T08:45:50.740Z',
  'In Stock'
);

INSERT INTO lending_items (
  sku, name, category, subcategory, brand, model, serial_number,
  specifications, quantity, available, location, `condition`, tags,
  is_available, max_lending_period, requires_approval,
  migrated_from, migration_date, original_status
) VALUES (
  'SKU002',
  'Office Chair',
  'Furniture',
  'Office Furniture',
  'Generic',
  'Chair',
  'SKU002-550740',
  '{"material":"Mixed Materials","dimensions":"Standard Size","acquisitionDate":"2025-03-26"}',
  15,
  15,
  'Warehouse B',
  'excellent',
  '["furniture","office","seating","ergonomic"]',
  true,
  90,
  false,
  'inventory_system',
  '2025-08-15T08:45:50.740Z',
  'In Stock'
);

INSERT INTO lending_items (
  sku, name, category, subcategory, brand, model, serial_number,
  specifications, quantity, available, location, `condition`, tags,
  is_available, max_lending_period, requires_approval,
  migrated_from, migration_date, original_status
) VALUES (
  'SKU003',
  'Printer Ink',
  'Office Supplies',
  'General Supplies',
  'Generic',
  'Ink',
  'SKU003-550740',
  '{"type":"Office Equipment","usage":"General Office Use","acquisitionDate":"2025-01-30"}',
  5,
  5,
  'Warehouse A',
  'fair',
  '["supplies","office","printing","document"]',
  true,
  14,
  false,
  'inventory_system',
  '2025-08-15T08:45:50.740Z',
  'Low Stock'
);

INSERT INTO lending_items (
  sku, name, category, subcategory, brand, model, serial_number,
  specifications, quantity, available, location, `condition`, tags,
  is_available, max_lending_period, requires_approval,
  migrated_from, migration_date, original_status
) VALUES (
  'SKU004',
  'Smartphone',
  'Electronics',
  'General Electronics',
  'Generic',
  'Smartphone',
  'SKU004-550740',
  '{"type":"Electronic Device","powerRequirement":"Standard AC","acquisitionDate":"2025-04-30"}',
  30,
  30,
  'Warehouse C',
  'excellent',
  '["electronics","tech","communication","mobile"]',
  true,
  30,
  true,
  'inventory_system',
  '2025-08-15T08:45:50.740Z',
  'In Stock'
);

INSERT INTO lending_items (
  sku, name, category, subcategory, brand, model, serial_number,
  specifications, quantity, available, location, `condition`, tags,
  is_available, max_lending_period, requires_approval,
  migrated_from, migration_date, original_status
) VALUES (
  'SKU005',
  'Desk',
  'Furniture',
  'Office Furniture',
  'Generic',
  'Desk',
  'SKU005-550740',
  '{"material":"Mixed Materials","dimensions":"Standard Size","acquisitionDate":"2025-03-09"}',
  0,
  0,
  'Warehouse B',
  'fair',
  '["furniture","office","workspace","furniture"]',
  false,
  90,
  false,
  'inventory_system',
  '2025-08-15T08:45:50.740Z',
  'Out of Stock'
);

-- Create indexes for better performance
CREATE INDEX idx_lending_items_category ON lending_items(category);
CREATE INDEX idx_lending_items_available ON lending_items(is_available);
CREATE INDEX idx_lending_items_location ON lending_items(location);
CREATE INDEX idx_lending_items_sku ON lending_items(sku);

-- Migration completed
SELECT 'Lending system migration completed successfully' AS status;
