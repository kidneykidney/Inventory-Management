-- Migration: Create Agile Development Tables
-- This migration creates all necessary tables for backlog management

-- Create Epics table
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
  completed_at TIMESTAMP NULL,
  INDEX idx_epic_status (status),
  INDEX idx_epic_priority (priority),
  INDEX idx_epic_target_sprint (target_sprint)
);

-- Create Sprints table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sprint_status (status),
  INDEX idx_sprint_dates (start_date, end_date)
);

-- Create User Stories table
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
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL,
  INDEX idx_story_status (status),
  INDEX idx_story_priority (priority),
  INDEX idx_story_epic (epic_id),
  INDEX idx_story_sprint (sprint_id),
  INDEX idx_story_assignee (assignee)
);

-- Create Acceptance Criteria table
CREATE TABLE IF NOT EXISTS acceptance_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_story_id VARCHAR(36) NOT NULL,
  criterion TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE,
  INDEX idx_acceptance_story (user_story_id),
  INDEX idx_acceptance_order (user_story_id, sort_order)
);

-- Create Story Tags table
CREATE TABLE IF NOT EXISTS story_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_story_id VARCHAR(36) NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_story_tag (user_story_id, tag),
  INDEX idx_tag_name (tag)
);

-- Create Tasks table for user stories
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
  FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE,
  INDEX idx_task_story (user_story_id),
  INDEX idx_task_assignee (assignee),
  INDEX idx_task_completed (completed)
);

-- Create Burndown Data table for sprint tracking
CREATE TABLE IF NOT EXISTS burndown_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sprint_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  remaining_points INT NOT NULL,
  ideal_remaining INT NOT NULL,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sprint_date (sprint_id, date),
  INDEX idx_burndown_sprint (sprint_id),
  INDEX idx_burndown_date (date)
);

-- Create Story History table for tracking changes
CREATE TABLE IF NOT EXISTS story_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_story_id VARCHAR(36) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE CASCADE,
  INDEX idx_history_story (user_story_id),
  INDEX idx_history_date (changed_at)
);