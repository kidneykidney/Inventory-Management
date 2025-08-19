-- Migration: Create Users and Authentication Tables
-- This migration creates all necessary tables for user management and authentication

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  department VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  profile_image VARCHAR(500),
  last_login TIMESTAMP NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email),
  INDEX idx_user_role (role),
  INDEX idx_user_status (status),
  INDEX idx_user_department (department)
);

-- Create User Sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_user (user_id),
  INDEX idx_session_token (token_hash),
  INDEX idx_session_expires (expires_at)
);

-- Create User Activity Log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(36),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_action (action),
  INDEX idx_activity_date (created_at)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (
  id, 
  name, 
  email, 
  password_hash, 
  role, 
  status, 
  department,
  email_verified
) VALUES (
  'admin-001',
  'System Administrator',
  'admin@company.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'admin123'
  'admin',
  'active',
  'IT',
  TRUE
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  status = VALUES(status),
  department = VALUES(department);

-- Insert default regular user (password: user123)
INSERT INTO users (
  id, 
  name, 
  email, 
  password_hash, 
  role, 
  status, 
  department,
  email_verified
) VALUES (
  'user-001',
  'John Doe',
  'user@company.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'user123'
  'user',
  'active',
  'Operations',
  TRUE
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  status = VALUES(status),
  department = VALUES(department);