// Database models for Agile development features

const mysql = require('mysql2/promise');
const config = require('../config/config');

// Database connection
let connection;

const initConnection = async () => {
  if (!connection) {
    connection = await mysql.createConnection(config.database);
  }
  return connection;
};

// Epic model operations
const Epic = {
  // Create epics table
  createTable: async () => {
    const conn = await initConnection();
    const query = `
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
    `;
    await conn.execute(query);
  },

  // Create new epic
  create: async epicData => {
    const conn = await initConnection();
    const query = `
      INSERT INTO epics (id, title, description, business_value, status, priority, target_sprint)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      epicData.id,
      epicData.title,
      epicData.description,
      epicData.businessValue,
      epicData.status || 'planned',
      epicData.priority || 'medium',
      epicData.targetSprint || null,
    ];

    const [result] = await conn.execute(query, values);
    return result;
  },

  // Get all epics
  findAll: async () => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM epics ORDER BY created_at DESC'
    );
    return rows;
  },

  // Get epic by ID
  findById: async id => {
    const conn = await initConnection();
    const [rows] = await conn.execute('SELECT * FROM epics WHERE id = ?', [id]);
    return rows[0];
  },

  // Update epic
  update: async (id, updateData) => {
    const conn = await initConnection();
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    values.push(id);
    const query = `UPDATE epics SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await conn.execute(query, values);
    return result;
  },

  // Delete epic
  delete: async id => {
    const conn = await initConnection();
    const [result] = await conn.execute('DELETE FROM epics WHERE id = ?', [id]);
    return result;
  },
};

// User Story model operations
const UserStory = {
  // Create user_stories table
  createTable: async () => {
    const conn = await initConnection();
    const query = `
      CREATE TABLE IF NOT EXISTS user_stories (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        acceptance_criteria JSON NOT NULL,
        story_points INT NOT NULL,
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('backlog', 'todo', 'in-progress', 'review', 'done') DEFAULT 'backlog',
        assignee VARCHAR(100),
        epic_id VARCHAR(36),
        sprint_id VARCHAR(36),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (epic_id) REFERENCES epics(id) ON DELETE SET NULL
      )
    `;
    await conn.execute(query);
  },

  // Create new user story
  create: async storyData => {
    const conn = await initConnection();
    const query = `
      INSERT INTO user_stories (
        id, title, description, acceptance_criteria, story_points, 
        priority, status, assignee, epic_id, sprint_id, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      storyData.id,
      storyData.title,
      storyData.description,
      JSON.stringify(storyData.acceptanceCriteria),
      storyData.storyPoints,
      storyData.priority || 'medium',
      storyData.status || 'backlog',
      storyData.assignee || null,
      storyData.epicId || null,
      storyData.sprintId || null,
      JSON.stringify(storyData.tags || []),
    ];

    const [result] = await conn.execute(query, values);
    return result;
  },

  // Get all user stories
  findAll: async () => {
    const conn = await initConnection();
    const [rows] = await conn.execute(`
      SELECT us.*, e.title as epic_title 
      FROM user_stories us 
      LEFT JOIN epics e ON us.epic_id = e.id 
      ORDER BY us.created_at DESC
    `);

    return rows.map(row => ({
      ...row,
      acceptanceCriteria: JSON.parse(row.acceptance_criteria),
      tags: JSON.parse(row.tags || '[]'),
    }));
  },

  // Get user story by ID
  findById: async id => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      `
      SELECT us.*, e.title as epic_title 
      FROM user_stories us 
      LEFT JOIN epics e ON us.epic_id = e.id 
      WHERE us.id = ?
    `,
      [id]
    );

    if (rows[0]) {
      rows[0].acceptanceCriteria = JSON.parse(rows[0].acceptance_criteria);
      rows[0].tags = JSON.parse(rows[0].tags || '[]');
    }

    return rows[0];
  },

  // Get stories by epic ID
  findByEpicId: async epicId => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      `
      SELECT * FROM user_stories WHERE epic_id = ? ORDER BY created_at DESC
    `,
      [epicId]
    );

    return rows.map(row => ({
      ...row,
      acceptanceCriteria: JSON.parse(row.acceptance_criteria),
      tags: JSON.parse(row.tags || '[]'),
    }));
  },

  // Get stories by status
  findByStatus: async status => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      `
      SELECT us.*, e.title as epic_title 
      FROM user_stories us 
      LEFT JOIN epics e ON us.epic_id = e.id 
      WHERE us.status = ? 
      ORDER BY us.created_at DESC
    `,
      [status]
    );

    return rows.map(row => ({
      ...row,
      acceptanceCriteria: JSON.parse(row.acceptance_criteria),
      tags: JSON.parse(row.tags || '[]'),
    }));
  },

  // Update user story
  update: async (id, updateData) => {
    const conn = await initConnection();
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        if (key === 'acceptanceCriteria' || key === 'tags') {
          fields.push(
            `${key === 'acceptanceCriteria' ? 'acceptance_criteria' : key} = ?`
          );
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(
            `${key === 'epicId' ? 'epic_id' : key === 'sprintId' ? 'sprint_id' : key} = ?`
          );
          values.push(updateData[key]);
        }
      }
    });

    values.push(id);
    const query = `UPDATE user_stories SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await conn.execute(query, values);
    return result;
  },

  // Delete user story
  delete: async id => {
    const conn = await initConnection();
    const [result] = await conn.execute(
      'DELETE FROM user_stories WHERE id = ?',
      [id]
    );
    return result;
  },
};

// Sprint model operations
const Sprint = {
  // Create sprints table
  createTable: async () => {
    const conn = await initConnection();
    const query = `
      CREATE TABLE IF NOT EXISTS sprints (
        id VARCHAR(36) PRIMARY KEY,
        number INT NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        goal TEXT NOT NULL,
        status ENUM('planning', 'active', 'review', 'complete') DEFAULT 'planning',
        velocity INT DEFAULT 0,
        capacity INT NOT NULL,
        team_size INT DEFAULT 5,
        actual_velocity INT DEFAULT 0,
        burndown_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sprint_status (status),
        INDEX idx_sprint_dates (start_date, end_date),
        INDEX idx_sprint_number (number)
      )
    `;
    await conn.execute(query);
  },

  // Create new sprint
  create: async sprintData => {
    const conn = await initConnection();
    const query = `
      INSERT INTO sprints (id, number, start_date, end_date, goal, status, capacity, team_size, actual_velocity, burndown_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      sprintData.id,
      sprintData.number,
      sprintData.startDate,
      sprintData.endDate,
      sprintData.goal,
      sprintData.status || 'planning',
      sprintData.capacity,
      sprintData.teamSize || 5,
      sprintData.actualVelocity || 0,
      JSON.stringify(sprintData.burndownData || []),
    ];

    const [result] = await conn.execute(query, values);
    return result;
  },

  // Get all sprints
  findAll: async () => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM sprints ORDER BY number DESC'
    );

    return rows.map(row => ({
      ...row,
      burndownData: JSON.parse(row.burndown_data || '[]'),
    }));
  },

  // Get sprint by ID
  findById: async id => {
    const conn = await initConnection();
    const [rows] = await conn.execute('SELECT * FROM sprints WHERE id = ?', [
      id,
    ]);

    if (rows[0]) {
      rows[0].burndownData = JSON.parse(rows[0].burndown_data || '[]');
    }

    return rows[0];
  },

  // Update sprint
  update: async (id, updateData) => {
    const conn = await initConnection();
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        if (key === 'burndownData') {
          fields.push('burndown_data = ?');
          values.push(JSON.stringify(updateData[key]));
        } else if (key === 'startDate') {
          fields.push('start_date = ?');
          values.push(updateData[key]);
        } else if (key === 'endDate') {
          fields.push('end_date = ?');
          values.push(updateData[key]);
        } else if (key === 'teamSize') {
          fields.push('team_size = ?');
          values.push(updateData[key]);
        } else if (key === 'actualVelocity') {
          fields.push('actual_velocity = ?');
          values.push(updateData[key]);
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });

    values.push(id);
    const query = `UPDATE sprints SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await conn.execute(query, values);
    return result;
  },

  // Delete sprint
  delete: async id => {
    const conn = await initConnection();
    const [result] = await conn.execute('DELETE FROM sprints WHERE id = ?', [
      id,
    ]);
    return result;
  },

  // Find sprints by status
  findByStatus: async status => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM sprints WHERE status = ? ORDER BY number DESC',
      [status]
    );

    return rows.map(row => ({
      ...row,
      burndownData: JSON.parse(row.burndown_data || '[]'),
    }));
  },

  // Get current active sprint
  findActiveSprint: async () => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM sprints WHERE status = ? ORDER BY number DESC LIMIT 1',
      ['active']
    );

    if (rows[0]) {
      rows[0].burndownData = JSON.parse(rows[0].burndown_data || '[]');
    }

    return rows[0];
  },

  // Get sprint with stories
  findByIdWithStories: async id => {
    const conn = await initConnection();
    const [sprintRows] = await conn.execute(
      'SELECT * FROM sprints WHERE id = ?',
      [id]
    );

    if (!sprintRows[0]) {
      return null;
    }

    const sprint = sprintRows[0];
    sprint.burndownData = JSON.parse(sprint.burndown_data || '[]');

    // Get associated stories
    const [storyRows] = await conn.execute(
      `SELECT us.*, e.title as epic_title 
       FROM user_stories us 
       LEFT JOIN epics e ON us.epic_id = e.id 
       WHERE us.sprint_id = ? 
       ORDER BY us.priority DESC, us.story_points ASC`,
      [id]
    );

    sprint.stories = storyRows.map(row => ({
      ...row,
      acceptanceCriteria: JSON.parse(row.acceptance_criteria || '[]'),
      tags: JSON.parse(row.tags || '[]'),
    }));

    return sprint;
  },

  // Calculate and update sprint velocity
  updateVelocity: async id => {
    const conn = await initConnection();

    // Get completed story points for this sprint
    const [rows] = await conn.execute(
      `SELECT SUM(story_points) as completed_points 
       FROM user_stories 
       WHERE sprint_id = ? AND status = 'done'`,
      [id]
    );

    const completedPoints = rows[0]?.completed_points || 0;

    // Update sprint velocity
    await conn.execute('UPDATE sprints SET actual_velocity = ? WHERE id = ?', [
      completedPoints,
      id,
    ]);

    return completedPoints;
  },

  // Get velocity history for team
  getVelocityHistory: async (limit = 6) => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      `SELECT number, actual_velocity, capacity, 
              ROUND((actual_velocity / capacity) * 100) as capacity_utilization
       FROM sprints 
       WHERE status = 'complete' AND actual_velocity > 0
       ORDER BY number DESC 
       LIMIT ?`,
      [limit]
    );

    return rows;
  },

  // Get sprint capacity recommendations
  getCapacityRecommendations: async (teamSize = 5) => {
    const conn = await initConnection();

    // Get recent velocity data
    const [velocityRows] = await conn.execute(
      `SELECT actual_velocity, capacity, team_size
       FROM sprints 
       WHERE status = 'complete' AND actual_velocity > 0
       ORDER BY number DESC 
       LIMIT 5`
    );

    if (velocityRows.length === 0) {
      return {
        recommendedCapacity: teamSize * 8, // Default 8 points per person
        confidence: 'low',
        historicalAverage: 0,
        recommendations: [
          'No historical data available - using default capacity',
        ],
      };
    }

    const avgVelocity =
      velocityRows.reduce((sum, row) => sum + row.actual_velocity, 0) /
      velocityRows.length;
    const avgCapacityUtilization =
      velocityRows.reduce(
        (sum, row) => sum + row.actual_velocity / row.capacity,
        0
      ) / velocityRows.length;

    const recommendedCapacity = Math.round(
      avgVelocity / avgCapacityUtilization
    );

    let confidence = 'medium';
    if (velocityRows.length >= 5) {
      confidence = 'high';
    }
    if (velocityRows.length <= 2) {
      confidence = 'low';
    }

    const recommendations = [];
    if (avgCapacityUtilization < 0.7) {
      recommendations.push(
        'Team typically completes less than 70% of planned capacity'
      );
    }
    if (avgCapacityUtilization > 1.1) {
      recommendations.push(
        'Team often exceeds planned capacity - consider increasing estimates'
      );
    }

    return {
      recommendedCapacity,
      confidence,
      historicalAverage: Math.round(avgVelocity),
      capacityUtilization: Math.round(avgCapacityUtilization * 100),
      recommendations,
    };
  },
};

// Burndown Data model operations
const BurndownData = {
  // Create burndown_data table
  createTable: async () => {
    const conn = await initConnection();
    const query = `
      CREATE TABLE IF NOT EXISTS burndown_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sprint_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        remaining_points INT NOT NULL,
        ideal_remaining INT NOT NULL,
        completed_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
        UNIQUE KEY unique_sprint_date (sprint_id, date),
        INDEX idx_burndown_sprint (sprint_id),
        INDEX idx_burndown_date (date)
      )
    `;
    await conn.execute(query);
  },

  // Record daily burndown data
  recordDailyBurndown: async (
    sprintId,
    date,
    remainingPoints,
    idealRemaining,
    completedPoints = 0
  ) => {
    const conn = await initConnection();
    const query = `
      INSERT INTO burndown_data (sprint_id, date, remaining_points, ideal_remaining, completed_points)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        remaining_points = VALUES(remaining_points),
        ideal_remaining = VALUES(ideal_remaining),
        completed_points = VALUES(completed_points)
    `;

    const [result] = await conn.execute(query, [
      sprintId,
      date,
      remainingPoints,
      idealRemaining,
      completedPoints,
    ]);
    return result;
  },

  // Get burndown data for sprint
  findBySprintId: async sprintId => {
    const conn = await initConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM burndown_data WHERE sprint_id = ? ORDER BY date ASC',
      [sprintId]
    );
    return rows;
  },

  // Generate ideal burndown line
  generateIdealBurndown: async (sprintId, totalPoints, startDate, endDate) => {
    const conn = await initConnection();

    // Calculate working days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workingDays = calculateWorkingDays(start, end);
    const dailyBurnRate = totalPoints / workingDays;

    const burndownPoints = [];
    const currentDate = new Date(start);
    let workingDayCount = 0;

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not weekend
        const idealRemaining = Math.max(
          0,
          totalPoints - dailyBurnRate * workingDayCount
        );
        burndownPoints.push({
          date: currentDate.toISOString().split('T')[0],
          idealRemaining: Math.round(idealRemaining),
        });
        workingDayCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert ideal burndown data
    for (const point of burndownPoints) {
      await conn.execute(
        `INSERT IGNORE INTO burndown_data (sprint_id, date, remaining_points, ideal_remaining)
         VALUES (?, ?, ?, ?)`,
        [sprintId, point.date, point.idealRemaining, point.idealRemaining]
      );
    }

    return burndownPoints;
  },

  // Update actual remaining points for a date
  updateActualRemaining: async (
    sprintId,
    date,
    remainingPoints,
    completedPoints
  ) => {
    const conn = await initConnection();
    const [result] = await conn.execute(
      `UPDATE burndown_data 
       SET remaining_points = ?, completed_points = ?
       WHERE sprint_id = ? AND date = ?`,
      [remainingPoints, completedPoints, sprintId, date]
    );
    return result;
  },
};

// Helper function for working days calculation
const calculateWorkingDays = (startDate, endDate) => {
  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

// Initialize all tables
const initializeTables = async () => {
  try {
    await Epic.createTable();
    await UserStory.createTable();
    await Sprint.createTable();
    await BurndownData.createTable();
    console.log('Agile tables initialized successfully');
  } catch (error) {
    console.error('Error initializing agile tables:', error);
    throw error;
  }
};

module.exports = {
  Epic,
  UserStory,
  Sprint,
  BurndownData,
  initializeTables,
};
