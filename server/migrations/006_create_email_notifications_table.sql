-- Migration: Create email notifications table
-- Description: Create table to track email notifications and delivery status

CREATE TABLE IF NOT EXISTS email_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('lending_confirmation', 'return_reminder', 'overdue_notice', 'return_confirmation', 'lending_request_approval') NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT,
  status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
  transaction_id INT,
  error_message TEXT,
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_recipient_email (recipient_email),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_sent_date (sent_date),
  
  FOREIGN KEY (transaction_id) REFERENCES lending_transactions(id) ON DELETE SET NULL
);

-- Create notification preferences table for users
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  overdue_enabled BOOLEAN DEFAULT TRUE,
  confirmation_enabled BOOLEAN DEFAULT TRUE,
  reminder_days_before INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_preferences (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create email templates table for admin management
CREATE TABLE IF NOT EXISTS email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('lending_confirmation', 'return_reminder', 'overdue_notice', 'return_confirmation', 'lending_request_approval') NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences);

-- Insert default email templates
INSERT INTO email_templates (name, type, subject, html_content, text_content) VALUES
('Default Lending Confirmation', 'lending_confirmation', 'Lending Confirmation - {{productName}}', 
 '<h2>Lending Confirmation</h2><p>Dear {{borrowerName}},</p><p>This confirms your lending of {{productName}}.</p>', 
 'Lending Confirmation\n\nDear {{borrowerName}},\n\nThis confirms your lending of {{productName}}.'),
 
('Default Return Reminder', 'return_reminder', 'Return Reminder - {{productName}}', 
 '<h2>Return Reminder</h2><p>Dear {{borrowerName}},</p><p>Please return {{productName}} by {{dueDate}}.</p>', 
 'Return Reminder\n\nDear {{borrowerName}},\n\nPlease return {{productName}} by {{dueDate}}.'),
 
('Default Overdue Notice', 'overdue_notice', 'OVERDUE NOTICE - {{productName}}', 
 '<h2>OVERDUE NOTICE</h2><p>Dear {{borrowerName}},</p><p>{{productName}} is now overdue. Please return immediately.</p>', 
 'OVERDUE NOTICE\n\nDear {{borrowerName}},\n\n{{productName}} is now overdue. Please return immediately.'),
 
('Default Return Confirmation', 'return_confirmation', 'Return Confirmation - {{productName}}', 
 '<h2>Return Confirmation</h2><p>Dear {{borrowerName}},</p><p>Thank you for returning {{productName}}.</p>', 
 'Return Confirmation\n\nDear {{borrowerName}},\n\nThank you for returning {{productName}}.');