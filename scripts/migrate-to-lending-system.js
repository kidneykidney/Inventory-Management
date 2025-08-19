#!/usr/bin/env node

/**
 * Migration script to transform existing inventory data to lending system structure
 * This script converts the old inventory format to the new lending system format
 */

const fs = require('fs');
const path = require('path');

// Mock existing inventory data (in a real scenario, this would come from a database)
const existingInventoryData = [
  {
    id: 1,
    sku: 'SKU001',
    name: 'Laptop',
    category: 'Electronics',
    quantity: 25,
    location: 'Warehouse A',
    status: 'In Stock',
  },
  {
    id: 2,
    sku: 'SKU002',
    name: 'Office Chair',
    category: 'Furniture',
    quantity: 15,
    location: 'Warehouse B',
    status: 'In Stock',
  },
  {
    id: 3,
    sku: 'SKU003',
    name: 'Printer Ink',
    category: 'Office Supplies',
    quantity: 5,
    location: 'Warehouse A',
    status: 'Low Stock',
  },
  {
    id: 4,
    sku: 'SKU004',
    name: 'Smartphone',
    category: 'Electronics',
    quantity: 30,
    location: 'Warehouse C',
    status: 'In Stock',
  },
  {
    id: 5,
    sku: 'SKU005',
    name: 'Desk',
    category: 'Furniture',
    quantity: 0,
    location: 'Warehouse B',
    status: 'Out of Stock',
  }
];

/**
 * Transform inventory item to lending system format
 * @param {Object} inventoryItem - Original inventory item
 * @returns {Object} Transformed lending item
 */
function transformToLendingItem(inventoryItem) {
  // Generate default values based on category
  const categoryDefaults = {
    'Electronics': {
      subcategory: 'General Electronics',
      brand: 'Generic',
      tags: ['electronics', 'tech'],
      maxLendingPeriod: 30,
      requiresApproval: true
    },
    'Furniture': {
      subcategory: 'Office Furniture',
      brand: 'Generic',
      tags: ['furniture', 'office'],
      maxLendingPeriod: 90,
      requiresApproval: false
    },
    'Office Supplies': {
      subcategory: 'General Supplies',
      brand: 'Generic',
      tags: ['supplies', 'office'],
      maxLendingPeriod: 14,
      requiresApproval: false
    }
  };

  const defaults = categoryDefaults[inventoryItem.category] || {
    subcategory: 'General',
    brand: 'Generic',
    tags: ['general'],
    maxLendingPeriod: 30,
    requiresApproval: false
  };

  // Determine condition based on status
  let condition = 'good';
  if (inventoryItem.status === 'In Stock' && inventoryItem.quantity > 10) {
    condition = 'excellent';
  } else if (inventoryItem.status === 'Low Stock' || inventoryItem.quantity <= 5) {
    condition = 'fair';
  }

  return {
    id: inventoryItem.id,
    sku: inventoryItem.sku,
    name: inventoryItem.name,
    category: inventoryItem.category,
    subcategory: defaults.subcategory,
    brand: defaults.brand,
    model: extractModel(inventoryItem.name),
    serialNumber: generateSerialNumber(inventoryItem.sku),
    specifications: generateSpecifications(inventoryItem),
    quantity: inventoryItem.quantity,
    available: inventoryItem.quantity, // Initially all items are available
    location: inventoryItem.location,
    condition: condition,
    tags: [...defaults.tags, ...generateTags(inventoryItem.name)],
    isAvailable: inventoryItem.quantity > 0,
    lendingPolicy: {
      maxLendingPeriod: defaults.maxLendingPeriod,
      requiresApproval: defaults.requiresApproval
    },
    // Migration metadata
    migratedFrom: 'inventory_system',
    migrationDate: new Date().toISOString(),
    originalStatus: inventoryItem.status
  };
}

/**
 * Extract model from item name
 * @param {string} name - Item name
 * @returns {string} Extracted model
 */
function extractModel(name) {
  // Simple model extraction logic
  const words = name.split(' ');
  if (words.length > 1) {
    return words.slice(1).join(' ');
  }
  return name;
}

/**
 * Generate serial number based on SKU
 * @param {string} sku - Item SKU
 * @returns {string} Generated serial number
 */
function generateSerialNumber(sku) {
  const timestamp = Date.now().toString().slice(-6);
  return `${sku}-${timestamp}`;
}

/**
 * Generate specifications based on item data
 * @param {Object} item - Inventory item
 * @returns {Object} Generated specifications
 */
function generateSpecifications(item) {
  const specs = {};
  
  switch (item.category) {
    case 'Electronics':
      specs.type = 'Electronic Device';
      specs.powerRequirement = 'Standard AC';
      break;
    case 'Furniture':
      specs.material = 'Mixed Materials';
      specs.dimensions = 'Standard Size';
      break;
    case 'Office Supplies':
      specs.type = 'Office Equipment';
      specs.usage = 'General Office Use';
      break;
  }
  
  specs.acquisitionDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return specs;
}

/**
 * Generate tags based on item name
 * @param {string} name - Item name
 * @returns {Array} Generated tags
 */
function generateTags(name) {
  const nameLower = name.toLowerCase();
  const tags = [];
  
  // Common tag mappings
  const tagMappings = {
    'laptop': ['portable', 'computing'],
    'chair': ['seating', 'ergonomic'],
    'desk': ['workspace', 'furniture'],
    'phone': ['communication', 'mobile'],
    'printer': ['printing', 'document'],
    'monitor': ['display', 'screen'],
    'mouse': ['input', 'peripheral'],
    'keyboard': ['input', 'typing']
  };
  
  Object.keys(tagMappings).forEach(keyword => {
    if (nameLower.includes(keyword)) {
      tags.push(...tagMappings[keyword]);
    }
  });
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Main migration function
 */
function runMigration() {
  console.log('🚀 Starting inventory to lending system migration...');
  console.log(`📊 Found ${existingInventoryData.length} inventory items to migrate`);
  
  // Transform all inventory items
  const lendingItems = existingInventoryData.map(transformToLendingItem);
  
  // Generate migration report
  const migrationReport = {
    migrationDate: new Date().toISOString(),
    totalItemsMigrated: lendingItems.length,
    itemsByCategory: {},
    itemsByCondition: {},
    averageLendingPeriod: 0,
    itemsRequiringApproval: 0
  };
  
  // Calculate statistics
  lendingItems.forEach(item => {
    // Count by category
    migrationReport.itemsByCategory[item.category] = 
      (migrationReport.itemsByCategory[item.category] || 0) + 1;
    
    // Count by condition
    migrationReport.itemsByCondition[item.condition] = 
      (migrationReport.itemsByCondition[item.condition] || 0) + 1;
    
    // Sum lending periods
    migrationReport.averageLendingPeriod += item.lendingPolicy.maxLendingPeriod;
    
    // Count approval requirements
    if (item.lendingPolicy.requiresApproval) {
      migrationReport.itemsRequiringApproval++;
    }
  });
  
  migrationReport.averageLendingPeriod = Math.round(
    migrationReport.averageLendingPeriod / lendingItems.length
  );
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '..', 'migration-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write migrated data
  const lendingDataPath = path.join(outputDir, 'lending-items.json');
  fs.writeFileSync(lendingDataPath, JSON.stringify(lendingItems, null, 2));
  
  // Write migration report
  const reportPath = path.join(outputDir, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(migrationReport, null, 2));
  
  // Write SQL migration script (for database migration)
  const sqlScript = generateSQLMigration(lendingItems);
  const sqlPath = path.join(outputDir, 'lending-system-migration.sql');
  fs.writeFileSync(sqlPath, sqlScript);
  
  console.log('✅ Migration completed successfully!');
  console.log(`📁 Output files created in: ${outputDir}`);
  console.log(`📄 Lending items: ${lendingDataPath}`);
  console.log(`📊 Migration report: ${reportPath}`);
  console.log(`🗄️  SQL migration: ${sqlPath}`);
  console.log('\n📈 Migration Summary:');
  console.log(`   • Total items migrated: ${migrationReport.totalItemsMigrated}`);
  console.log(`   • Average lending period: ${migrationReport.averageLendingPeriod} days`);
  console.log(`   • Items requiring approval: ${migrationReport.itemsRequiringApproval}`);
  console.log(`   • Categories: ${Object.keys(migrationReport.itemsByCategory).join(', ')}`);
}

/**
 * Generate SQL migration script
 * @param {Array} lendingItems - Transformed lending items
 * @returns {string} SQL migration script
 */
function generateSQLMigration(lendingItems) {
  let sql = `-- Lending System Migration Script
-- Generated on: ${new Date().toISOString()}
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
`;

  lendingItems.forEach(item => {
    sql += `INSERT INTO lending_items (
  sku, name, category, subcategory, brand, model, serial_number,
  specifications, quantity, available, location, \`condition\`, tags,
  is_available, max_lending_period, requires_approval,
  migrated_from, migration_date, original_status
) VALUES (
  '${item.sku}',
  '${item.name.replace(/'/g, "''")}',
  '${item.category}',
  '${item.subcategory}',
  '${item.brand}',
  '${item.model}',
  '${item.serialNumber}',
  '${JSON.stringify(item.specifications).replace(/'/g, "''")}',
  ${item.quantity},
  ${item.available},
  '${item.location}',
  '${item.condition}',
  '${JSON.stringify(item.tags).replace(/'/g, "''")}',
  ${item.isAvailable},
  ${item.lendingPolicy.maxLendingPeriod},
  ${item.lendingPolicy.requiresApproval},
  '${item.migratedFrom}',
  '${item.migrationDate}',
  '${item.originalStatus}'
);

`;
  });

  sql += `-- Create indexes for better performance
CREATE INDEX idx_lending_items_category ON lending_items(category);
CREATE INDEX idx_lending_items_available ON lending_items(is_available);
CREATE INDEX idx_lending_items_location ON lending_items(location);
CREATE INDEX idx_lending_items_sku ON lending_items(sku);

-- Migration completed
SELECT 'Lending system migration completed successfully' AS status;
`;

  return sql;
}

// Run migration if script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  transformToLendingItem,
  runMigration
};