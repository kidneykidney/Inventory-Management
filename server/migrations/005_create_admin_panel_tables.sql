-- Admin Panel Database Tables
-- Creates tables for system configuration, admin activity logging, and bulk operations

-- System Configuration Table
-- Stores global system settings and lending policies
CREATE TABLE IF NOT EXISTS system_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    `value` TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    is_editable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_key_category (`key`, category)
);

-- Admin Activity Log Table
-- Tracks all admin actions for audit purposes
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_created_at (created_at),
    INDEX idx_admin_action (admin_id, action),
    INDEX idx_resource (resource_type, resource_id)
);

-- Bulk Operations Table
-- Tracks bulk import/export and batch operations
CREATE TABLE IF NOT EXISTS bulk_operations (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    operation_type ENUM('import', 'export', 'update', 'delete') NOT NULL,
    resource_type ENUM('products', 'users', 'transactions') NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    total_items INT NOT NULL DEFAULT 0,
    processed_items INT NOT NULL DEFAULT 0,
    successful_items INT NOT NULL DEFAULT 0,
    failed_items INT NOT NULL DEFAULT 0,
    errors JSON,
    results JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_status (status),
    INDEX idx_operation_type (operation_type),
    INDEX idx_resource_type (resource_type),
    INDEX idx_created_at (created_at),
    INDEX idx_admin_status (admin_id, status)
);

-- User Permissions Table
-- Stores granular permissions for users beyond basic roles
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(36),
    granted_by VARCHAR(36),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission, resource_type, resource_id),
    INDEX idx_user_id (user_id),
    INDEX idx_permission (permission),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_expires_at (expires_at)
);

-- Lending Policy Overrides Table
-- Allows per-product or per-category policy overrides
CREATE TABLE IF NOT EXISTS lending_policy_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_type ENUM('product', 'category', 'user') NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    policy_key VARCHAR(100) NOT NULL,
    policy_value TEXT NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_resource_policy (resource_type, resource_id, policy_key),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_policy_key (policy_key),
    INDEX idx_created_by (created_by)
);

-- Email Templates Table
-- Stores customizable email templates for notifications
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_template_key (template_key),
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by)
);

-- System Notifications Table
-- Stores system-wide notifications and announcements
CREATE TABLE IF NOT EXISTS system_notifications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info',
    target_audience ENUM('all', 'admins', 'users') NOT NULL DEFAULT 'all',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_is_active (is_active),
    INDEX idx_target_audience (target_audience),
    INDEX idx_type (type),
    INDEX idx_date_range (start_date, end_date),
    INDEX idx_created_by (created_by)
);

-- Insert default system configurations
INSERT IGNORE INTO system_configurations (`key`, `value`, category, description, data_type) VALUES
('lending.default_period_days', '30', 'lending', 'Default lending period in days', 'number'),
('lending.max_period_days', '90', 'lending', 'Maximum lending period in days', 'number'),
('lending.reminder_days', '[3, 1]', 'lending', 'Days before due date to send reminders', 'json'),
('lending.auto_approval_enabled', 'false', 'lending', 'Enable automatic approval for lending requests', 'boolean'),
('lending.require_approval_high_value', 'true', 'lending', 'Require approval for high-value items', 'boolean'),
('lending.high_value_threshold', '1000', 'lending', 'Threshold amount for high-value items', 'number'),
('lending.max_items_per_user', '5', 'lending', 'Maximum items a user can borrow simultaneously', 'number'),
('lending.overdue_grace_period_days', '7', 'lending', 'Grace period before marking items as lost', 'number'),

('email.reminder_enabled', 'true', 'email', 'Enable email reminders', 'boolean'),
('email.daily_overdue_enabled', 'true', 'email', 'Enable daily overdue email notifications', 'boolean'),
('email.from_address', 'noreply@company.com', 'email', 'Default from email address', 'string'),
('email.from_name', 'Lending System', 'email', 'Default from name', 'string'),
('email.admin_notifications', 'admin@company.com', 'email', 'Admin notification email address', 'string'),

('system.maintenance_mode', 'false', 'system', 'Enable maintenance mode', 'boolean'),
('system.max_file_upload_size', '10485760', 'system', 'Maximum file upload size in bytes (10MB)', 'number'),
('system.session_timeout_minutes', '1440', 'system', 'Session timeout in minutes (24 hours)', 'number'),
('system.password_min_length', '8', 'system', 'Minimum password length', 'number'),
('system.enable_user_registration', 'false', 'system', 'Allow new user registration', 'boolean'),

('ui.items_per_page', '20', 'ui', 'Default items per page in listings', 'number'),
('ui.enable_dark_mode', 'true', 'ui', 'Enable dark mode option', 'boolean'),
('ui.company_name', 'Company Name', 'ui', 'Company name displayed in UI', 'string'),
('ui.company_logo_url', '', 'ui', 'Company logo URL', 'string'),
('ui.support_email', 'support@company.com', 'ui', 'Support contact email', 'string');

-- Insert default email templates
INSERT IGNORE INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('lending_confirmation', 'Lending Confirmation', 'Item Borrowed: {{productName}}', 
 '<h2>Item Successfully Borrowed</h2><p>Hello {{borrowerName}},</p><p>You have successfully borrowed <strong>{{productName}}</strong>.</p><p><strong>Due Date:</strong> {{dueDate}}</p><p>Please return the item on time to avoid late fees.</p>', 
 'Hello {{borrowerName}}, You have successfully borrowed {{productName}}. Due Date: {{dueDate}}. Please return the item on time.',
 '["borrowerName", "productName", "dueDate", "lendDate"]'),

('return_reminder', 'Return Reminder', 'Reminder: {{productName}} due in {{daysUntilDue}} days', 
 '<h2>Return Reminder</h2><p>Hello {{borrowerName}},</p><p>This is a reminder that <strong>{{productName}}</strong> is due for return in {{daysUntilDue}} days.</p><p><strong>Due Date:</strong> {{dueDate}}</p><p>Please return the item on time.</p>', 
 'Hello {{borrowerName}}, This is a reminder that {{productName}} is due for return in {{daysUntilDue}} days. Due Date: {{dueDate}}.',
 '["borrowerName", "productName", "dueDate", "daysUntilDue"]'),

('overdue_notification', 'Overdue Item', 'OVERDUE: {{productName}} was due {{daysOverdue}} days ago', 
 '<h2>Overdue Item Notice</h2><p>Hello {{borrowerName}},</p><p><strong>{{productName}}</strong> is now overdue by {{daysOverdue}} days.</p><p><strong>Original Due Date:</strong> {{dueDate}}</p><p>Please return the item immediately to avoid additional penalties.</p>', 
 'Hello {{borrowerName}}, {{productName}} is now overdue by {{daysOverdue}} days. Original Due Date: {{dueDate}}. Please return immediately.',
 '["borrowerName", "productName", "dueDate", "daysOverdue"]'),

('return_confirmation', 'Return Confirmation', 'Item Returned: {{productName}}', 
 '<h2>Item Successfully Returned</h2><p>Hello {{borrowerName}},</p><p>Thank you for returning <strong>{{productName}}</strong>.</p><p><strong>Return Date:</strong> {{returnDate}}</p><p><strong>Condition:</strong> {{conditionReturned}}</p>', 
 'Hello {{borrowerName}}, Thank you for returning {{productName}}. Return Date: {{returnDate}}. Condition: {{conditionReturned}}.',
 '["borrowerName", "productName", "returnDate", "conditionReturned"]');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_lending_products_availability ON lending_products(is_available, condition_status);
CREATE INDEX IF NOT EXISTS idx_lending_transactions_status_due ON lending_transactions(status, due_date);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);

-- Add any missing foreign key constraints
-- Note: These may fail if constraints already exist, which is fine
ALTER TABLE lending_products ADD CONSTRAINT fk_lending_products_category 
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT;

ALTER TABLE lending_transactions ADD CONSTRAINT fk_lending_transactions_product 
    FOREIGN KEY (product_id) REFERENCES lending_products(id) ON DELETE RESTRICT;

ALTER TABLE lending_transactions ADD CONSTRAINT fk_lending_transactions_borrower 
    FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE lending_transactions ADD CONSTRAINT fk_lending_transactions_approver 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;