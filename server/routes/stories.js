/**
 * User Stories routes
 * Manages user story CRUD operations for Agile backlog management
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Validation middleware for user story data
 */
const validateStoryData = (req, res, next) => {
  const {
    title,
    description,
    acceptanceCriteria,
    storyPoints,
    priority,
    status,
  } = req.body;

  const errors = [];

  if (!title || title.length < 5 || title.length > 150) {
    errors.push('Title must be between 5 and 150 characters');
  }

  if (!description || description.length < 20 || description.length > 1000) {
    errors.push('Description must be between 20 and 1000 characters');
  }

  if (
    !acceptanceCriteria ||
    !Array.isArray(acceptanceCriteria) ||
    acceptanceCriteria.length === 0
  ) {
    errors.push('At least one acceptance criterion is required');
  } else if (acceptanceCriteria.length > 10) {
    errors.push('Maximum 10 acceptance criteria allowed');
  } else {
    acceptanceCriteria.forEach((criterion, index) => {
      if (!criterion || criterion.length < 10) {
        errors.push(
          `Acceptance criterion ${index + 1} must be at least 10 characters`
        );
      }
    });
  }

  if (!storyPoints || ![1, 2, 3, 5, 8, 13, 21].includes(storyPoints)) {
    errors.push(
      'Story points must be a valid Fibonacci number (1, 2, 3, 5, 8, 13, 21)'
    );
  }

  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    errors.push('Priority must be one of: high, medium, low');
  }

  if (
    status &&
    !['backlog', 'todo', 'in-progress', 'review', 'done'].includes(status)
  ) {
    errors.push(
      'Status must be one of: backlog, todo, in-progress, review, done'
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Priority enforcement middleware for stories
 */
const enforceStoryPriorityLimits = async (req, res, next) => {
  try {
    const { priority, sprintId } = req.body;

    if (priority === 'high' && sprintId) {
      // Check if sprint already has too many high priority stories
      const [highPriorityStories] = await pool.execute(
        'SELECT COUNT(*) as count FROM user_stories WHERE priority = ? AND sprint_id = ? AND status != ?',
        ['high', sprintId, 'done']
      );

      if (highPriorityStories[0].count >= 3) {
        return res.status(400).json({
          success: false,
          message:
            'Maximum number of high priority stories (3) already exists in this sprint.',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in story priority enforcement middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during priority validation',
    });
  }
};

/**
 * @route   GET /api/v1/stories
 * @desc    Get all user stories with optional filtering
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      epicId,
      sprintId,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT us.*, e.title as epic_title, s.number as sprint_number,
             GROUP_CONCAT(DISTINCT ac.criterion ORDER BY ac.sort_order SEPARATOR '|||') as acceptance_criteria,
             GROUP_CONCAT(DISTINCT st.tag SEPARATOR ',') as tags
      FROM user_stories us
      LEFT JOIN epics e ON us.epic_id = e.id
      LEFT JOIN sprints s ON us.sprint_id = s.id
      LEFT JOIN acceptance_criteria ac ON us.id = ac.user_story_id
      LEFT JOIN story_tags st ON us.id = st.user_story_id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('us.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('us.priority = ?');
      params.push(priority);
    }

    if (epicId) {
      conditions.push('us.epic_id = ?');
      params.push(epicId);
    }

    if (sprintId) {
      conditions.push('us.sprint_id = ?');
      params.push(sprintId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY us.id
      ORDER BY 
        CASE us.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
        us.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [stories] = await pool.execute(query, params);

    // Process stories to format acceptance criteria and tags
    const processedStories = stories.map(story => ({
      ...story,
      acceptance_criteria: story.acceptance_criteria
        ? story.acceptance_criteria.split('|||')
        : [],
      tags: story.tags ? story.tags.split(',') : [],
    }));

    logger.info(`Fetched ${processedStories.length} user stories`);
    res.json({
      success: true,
      count: processedStories.length,
      data: processedStories,
    });
  } catch (error) {
    logger.error('Error fetching user stories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   GET /api/v1/stories/:id
 * @desc    Get single user story with tasks
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get story details
    const [stories] = await pool.execute(
      `
      SELECT us.*, e.title as epic_title, s.number as sprint_number,
             GROUP_CONCAT(DISTINCT ac.criterion ORDER BY ac.sort_order SEPARATOR '|||') as acceptance_criteria,
             GROUP_CONCAT(DISTINCT st.tag SEPARATOR ',') as tags
      FROM user_stories us
      LEFT JOIN epics e ON us.epic_id = e.id
      LEFT JOIN sprints s ON us.sprint_id = s.id
      LEFT JOIN acceptance_criteria ac ON us.id = ac.user_story_id
      LEFT JOIN story_tags st ON us.id = st.user_story_id
      WHERE us.id = ?
      GROUP BY us.id
    `,
      [id]
    );

    if (stories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User story not found',
      });
    }

    // Get associated tasks
    const [tasks] = await pool.execute(
      'SELECT * FROM story_tasks WHERE user_story_id = ? ORDER BY created_at ASC',
      [id]
    );

    const story = {
      ...stories[0],
      acceptance_criteria: stories[0].acceptance_criteria
        ? stories[0].acceptance_criteria.split('|||')
        : [],
      tags: stories[0].tags ? stories[0].tags.split(',') : [],
      tasks,
    };

    logger.info(`Fetched user story with ID: ${id}`);
    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    logger.error('Error fetching user story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   POST /api/v1/stories
 * @desc    Create new user story
 * @access  Private
 */
router.post(
  '/',
  validateStoryData,
  enforceStoryPriorityLimits,
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        title,
        description,
        acceptanceCriteria,
        storyPoints,
        priority = 'medium',
        status = 'backlog',
        assignee,
        epicId,
        sprintId,
        tags = [],
      } = req.body;

      const id = uuidv4();

      // Insert user story
      await connection.execute(
        `
      INSERT INTO user_stories (id, title, description, story_points, priority, status, assignee, epic_id, sprint_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          id,
          title,
          description,
          storyPoints,
          priority,
          status,
          assignee || null,
          epicId || null,
          sprintId || null,
        ]
      );

      // Insert acceptance criteria
      for (let i = 0; i < acceptanceCriteria.length; i++) {
        await connection.execute(
          `
        INSERT INTO acceptance_criteria (user_story_id, criterion, sort_order)
        VALUES (?, ?, ?)
      `,
          [id, acceptanceCriteria[i], i]
        );
      }

      // Insert tags
      for (const tag of tags) {
        if (tag.trim()) {
          await connection.execute(
            `
          INSERT INTO story_tags (user_story_id, tag)
          VALUES (?, ?)
        `,
            [id, tag.trim()]
          );
        }
      }

      await connection.commit();

      // Fetch the created story
      const [createdStory] = await connection.execute(
        `
      SELECT us.*, e.title as epic_title, s.number as sprint_number,
             GROUP_CONCAT(DISTINCT ac.criterion ORDER BY ac.sort_order SEPARATOR '|||') as acceptance_criteria,
             GROUP_CONCAT(DISTINCT st.tag SEPARATOR ',') as tags
      FROM user_stories us
      LEFT JOIN epics e ON us.epic_id = e.id
      LEFT JOIN sprints s ON us.sprint_id = s.id
      LEFT JOIN acceptance_criteria ac ON us.id = ac.user_story_id
      LEFT JOIN story_tags st ON us.id = st.user_story_id
      WHERE us.id = ?
      GROUP BY us.id
    `,
        [id]
      );

      const story = {
        ...createdStory[0],
        acceptance_criteria: createdStory[0].acceptance_criteria
          ? createdStory[0].acceptance_criteria.split('|||')
          : [],
        tags: createdStory[0].tags ? createdStory[0].tags.split(',') : [],
      };

      logger.info(`New user story created: ${title} (${id})`);
      res.status(201).json({
        success: true,
        data: story,
      });
    } catch (error) {
      await connection.rollback();
      logger.error('Error creating user story:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    } finally {
      connection.release();
    }
  }
);

/**
 * @route   PUT /api/v1/stories/:id
 * @desc    Update user story
 * @access  Private
 */
router.put('/:id', validateStoryData, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      title,
      description,
      acceptanceCriteria,
      storyPoints,
      priority,
      status,
      assignee,
      epicId,
      sprintId,
      tags = [],
    } = req.body;

    // Check if story exists
    const [existingStory] = await connection.execute(
      'SELECT * FROM user_stories WHERE id = ?',
      [id]
    );

    if (existingStory.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'User story not found',
      });
    }

    // Update completed_at timestamp if status is changing to done
    const completedAt =
      status === 'done' && existingStory[0].status !== 'done'
        ? new Date()
        : existingStory[0].completed_at;

    // Update user story
    await connection.execute(
      `
      UPDATE user_stories 
      SET title = ?, description = ?, story_points = ?, priority = ?, status = ?, 
          assignee = ?, epic_id = ?, sprint_id = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        title,
        description,
        storyPoints,
        priority,
        status,
        assignee || null,
        epicId || null,
        sprintId || null,
        completedAt,
        id,
      ]
    );

    // Delete existing acceptance criteria and tags
    await connection.execute(
      'DELETE FROM acceptance_criteria WHERE user_story_id = ?',
      [id]
    );
    await connection.execute('DELETE FROM story_tags WHERE user_story_id = ?', [
      id,
    ]);

    // Insert new acceptance criteria
    for (let i = 0; i < acceptanceCriteria.length; i++) {
      await connection.execute(
        `
        INSERT INTO acceptance_criteria (user_story_id, criterion, sort_order)
        VALUES (?, ?, ?)
      `,
        [id, acceptanceCriteria[i], i]
      );
    }

    // Insert new tags
    for (const tag of tags) {
      if (tag.trim()) {
        await connection.execute(
          `
          INSERT INTO story_tags (user_story_id, tag)
          VALUES (?, ?)
        `,
          [id, tag.trim()]
        );
      }
    }

    await connection.commit();

    // Fetch updated story
    const [updatedStory] = await connection.execute(
      `
      SELECT us.*, e.title as epic_title, s.number as sprint_number,
             GROUP_CONCAT(DISTINCT ac.criterion ORDER BY ac.sort_order SEPARATOR '|||') as acceptance_criteria,
             GROUP_CONCAT(DISTINCT st.tag SEPARATOR ',') as tags
      FROM user_stories us
      LEFT JOIN epics e ON us.epic_id = e.id
      LEFT JOIN sprints s ON us.sprint_id = s.id
      LEFT JOIN acceptance_criteria ac ON us.id = ac.user_story_id
      LEFT JOIN story_tags st ON us.id = st.user_story_id
      WHERE us.id = ?
      GROUP BY us.id
    `,
      [id]
    );

    const story = {
      ...updatedStory[0],
      acceptance_criteria: updatedStory[0].acceptance_criteria
        ? updatedStory[0].acceptance_criteria.split('|||')
        : [],
      tags: updatedStory[0].tags ? updatedStory[0].tags.split(',') : [],
    };

    logger.info(`User story updated: ${title} (${id})`);
    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    await connection.rollback();
    logger.error('Error updating user story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   DELETE /api/v1/stories/:id
 * @desc    Delete user story
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if story exists
    const [existingStory] = await connection.execute(
      'SELECT * FROM user_stories WHERE id = ?',
      [id]
    );

    if (existingStory.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'User story not found',
      });
    }

    // Delete related data (cascading deletes will handle acceptance_criteria, story_tags, story_tasks)
    await connection.execute('DELETE FROM user_stories WHERE id = ?', [id]);

    await connection.commit();

    logger.info(`User story deleted: ${existingStory[0].title} (${id})`);
    res.json({
      success: true,
      message: 'User story deleted successfully',
      data: existingStory[0],
    });
  } catch (error) {
    await connection.rollback();
    logger.error('Error deleting user story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    connection.release();
  }
});

/**
 * @route   POST /api/v1/stories/:id/tasks
 * @desc    Add task to user story
 * @access  Private
 */
router.post('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignee, estimatedHours } = req.body;

    if (!title || title.length < 3 || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Task title must be between 3 and 100 characters',
      });
    }

    if (!description || description.length < 10 || description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Task description must be between 10 and 500 characters',
      });
    }

    // Check if story exists
    const [existingStory] = await pool.execute(
      'SELECT id FROM user_stories WHERE id = ?',
      [id]
    );

    if (existingStory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User story not found',
      });
    }

    const taskId = uuidv4();

    await pool.execute(
      `
      INSERT INTO story_tasks (id, user_story_id, title, description, assignee, estimated_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [taskId, id, title, description, assignee || null, estimatedHours || null]
    );

    // Fetch the created task
    const [createdTask] = await pool.execute(
      'SELECT * FROM story_tasks WHERE id = ?',
      [taskId]
    );

    logger.info(`New task created for story ${id}: ${title} (${taskId})`);
    res.status(201).json({
      success: true,
      data: createdTask[0],
    });
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
