-- Create sprint retrospectives table
CREATE TABLE IF NOT EXISTS sprint_retrospectives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sprint_id INT NOT NULL,
    what_went_well JSON,
    what_could_improve JSON,
    action_items JSON,
    team_morale DECIMAL(3,1) DEFAULT 5.0,
    velocity_rating DECIMAL(3,1) DEFAULT 5.0,
    quality_rating DECIMAL(3,1) DEFAULT 5.0,
    communication_rating DECIMAL(3,1) DEFAULT 5.0,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
    INDEX idx_sprint_retrospectives_sprint_id (sprint_id),
    INDEX idx_sprint_retrospectives_created_at (created_at)
);

-- Create sprint quality metrics table
CREATE TABLE IF NOT EXISTS sprint_quality_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sprint_id INT NOT NULL,
    bug_count INT DEFAULT 0,
    test_coverage DECIMAL(5,2) DEFAULT 0.00,
    code_review_score DECIMAL(3,1) DEFAULT 0.0,
    technical_debt_hours DECIMAL(6,2) DEFAULT 0.00,
    deployment_frequency INT DEFAULT 0,
    lead_time_hours DECIMAL(6,2) DEFAULT 0.00,
    mean_time_to_recovery_hours DECIMAL(6,2) DEFAULT 0.00,
    change_failure_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
    INDEX idx_sprint_quality_metrics_sprint_id (sprint_id)
);

-- Create user sprint capacity table
CREATE TABLE IF NOT EXISTS user_sprint_capacity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sprint_id INT NOT NULL,
    capacity_hours DECIMAL(5,2) DEFAULT 40.00,
    actual_hours DECIMAL(5,2) DEFAULT 0.00,
    availability_percentage DECIMAL(5,2) DEFAULT 100.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_sprint (user_id, sprint_id),
    INDEX idx_user_sprint_capacity_sprint_id (sprint_id),
    INDEX idx_user_sprint_capacity_user_id (user_id)
);

-- Create team performance snapshots table
CREATE TABLE IF NOT EXISTS team_performance_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sprint_id INT NOT NULL,
    team_size INT DEFAULT 0,
    total_capacity_hours DECIMAL(7,2) DEFAULT 0.00,
    total_actual_hours DECIMAL(7,2) DEFAULT 0.00,
    utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    velocity_trend VARCHAR(20) DEFAULT 'stable',
    satisfaction_score DECIMAL(3,1) DEFAULT 5.0,
    quality_score DECIMAL(3,1) DEFAULT 5.0,
    predictive_velocity DECIMAL(5,1) DEFAULT 0.0,
    confidence_level DECIMAL(5,2) DEFAULT 0.00,
    risk_factors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
    INDEX idx_team_performance_snapshots_sprint_id (sprint_id),
    INDEX idx_team_performance_snapshots_created_at (created_at)
);

-- Create analytics reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_data JSON,
    parameters JSON,
    generated_by INT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_analytics_reports_type (report_type),
    INDEX idx_analytics_reports_generated_at (generated_at),
    INDEX idx_analytics_reports_expires_at (expires_at)
);

-- Add additional columns to existing sprints table if they don't exist
ALTER TABLE sprints 
ADD COLUMN IF NOT EXISTS bug_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS test_coverage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS code_review_score DECIMAL(3,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS technical_debt_hours DECIMAL(6,2) DEFAULT 0.00;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sprints_status_start_date ON sprints(status, start_date);
CREATE INDEX IF NOT EXISTS idx_sprints_velocity ON sprints(velocity);
CREATE INDEX IF NOT EXISTS idx_user_stories_status_sprint ON user_stories(status, sprint_id);

-- Insert sample data for testing (optional)
INSERT IGNORE INTO sprint_quality_metrics (sprint_id, bug_count, test_coverage, code_review_score, technical_debt_hours)
SELECT 
    id as sprint_id,
    FLOOR(RAND() * 10) as bug_count,
    ROUND(70 + (RAND() * 30), 2) as test_coverage,
    ROUND(7 + (RAND() * 3), 1) as code_review_score,
    ROUND(RAND() * 20, 2) as technical_debt_hours
FROM sprints 
WHERE status = 'completed'
LIMIT 10;

-- Create view for analytics dashboard
CREATE OR REPLACE VIEW analytics_dashboard_view AS
SELECT 
    s.id as sprint_id,
    s.sprint_number,
    s.start_date,
    s.end_date,
    s.planned_points,
    s.completed_points,
    s.velocity,
    s.status,
    sqm.bug_count,
    sqm.test_coverage,
    sqm.code_review_score,
    sqm.technical_debt_hours,
    sr.team_morale,
    sr.velocity_rating,
    sr.quality_rating,
    sr.communication_rating,
    (
        SELECT COUNT(*) 
        FROM user_stories us 
        WHERE us.sprint_id = s.id AND us.status = 'done'
    ) as completed_stories,
    (
        SELECT COUNT(*) 
        FROM user_stories us 
        WHERE us.sprint_id = s.id
    ) as total_stories
FROM sprints s
LEFT JOIN sprint_quality_metrics sqm ON s.id = sqm.sprint_id
LEFT JOIN sprint_retrospectives sr ON s.id = sr.sprint_id
WHERE s.status IN ('completed', 'active')
ORDER BY s.start_date DESC;