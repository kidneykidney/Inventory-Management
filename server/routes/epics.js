/**
 * Epics routes
 * Manages epic CRUD operations for Agile backlog management
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Validation middleware for epic data
 */
const validateEpicData = (req, res, next) => {
  const { title, description, businessValue, status, priority } = req.body;

  const errors = [];

  if (!title || title.length < 5 || title.length > 200) {
    errors.push('Title must be between 5 and 200 characters');
  }

  if (!description || description.length < 30 || description.length > 2000) {
    errors.push('Description must be between 30 and 2000 characters');
  }

  if (
    !businessValue ||
    businessValue.length < 20 ||
    businessValue.length > 500
  ) {
    errors.push('Business value must be between 20 and 500 characters');
  }

  if (status && !['planned', 'in-progress', 'complete'].includes(status)) {
    errors.push('Status must be one of: planned, in-progress, complete');
  }

  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    errors.push('Priority must be one of: high, medium, low');
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
 * Priority enforcement middleware
 */
const enforcePriorityLimits = async (req, res, next) => {
  try {
    const { priority } = req.body;

    if (priority === 'high') {
      // Check if there are already too many high priority epics
      const [highPriorityEpics] = await pool.execute(
        'SELECT COUNT(*) as count FROM epics WHERE priority = ? AND status != ?',
        ['high', 'complete']
      );

      if (highPriorityEpics[0].count >= 5) {
        return res.status(400).json({
          success: false,
          message:
            'Maximum number of high priority epics (5) already exists. Please complete existing high priority epics or lower their priority.',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in priority enforcement middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during priority validation',
    });
  }
};

/**
 * @route   GET /api/v1/epics
 * @desc    Get all epics with optional filtering
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { status, priority, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT e.*, 
             COUNT(us.id) as story_count,
             COALESCE(SUM(CASE WHEN us.status = 'done' THEN us.story_points ELSE 0 END), 0) as completed_points,
             COALESCE(SUM(us.story_points), 0) as total_points
      FROM epics e
      LEFT JOIN user_stories us ON e.id = us.epic_id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('e.priority = ?');
      params.push(priority);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY e.id
      ORDER BY 
        CASE e.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
        e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [epics] = await pool.execute(query, params);

    logger.info(`Fetched ${epics.length} epics`);
    res.json({
      success: true,
      count: epics.length,
      data: epics,
    });
  } catch (error) {
    logger.error('Error fetching epics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   GET /api/v1/epics/:id
 * @desc    Get single epic with stories
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get epic details
    const [epics] = await pool.execute('SELECT * FROM epics WHERE id = ?', [
      id,
    ]);

    if (epics.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Epic not found',
      });
    }

    // Get associated stories
    const [stories] = await pool.execute(
      `
      SELECT us.*, 
             GROUP_CONCAT(DISTINCT ac.criterion ORDER BY ac.sort_order SEPARATOR '|||') as acceptance_criteria,
             GROUP_CONCAT(DISTINCT st.tag SEPARATOR ',') as tags
      FROM user_stories us
      LEFT JOIN acceptance_criteria ac ON us.id = ac.user_story_id
      LEFT JOIN story_tags st ON us.id = st.user_story_id
      WHERE us.epic_id = ?
      GROUP BY us.id
      ORDER BY us.created_at DESC
    `,
      [id]
    );

    // Process stories to format acceptance criteria and tags
    const processedStories = stories.map(story => ({
      ...story,
      acceptance_criteria: story.acceptance_criteria
        ? story.acceptance_criteria.split('|||')
        : [],
      tags: story.tags ? story.tags.split(',') : [],
    }));

    const epic = {
      ...epics[0],
      stories: processedStories,
    };

    logger.info(`Fetched epic with ID: ${id}`);
    res.json({
      success: true,
      data: epic,
    });
  } catch (error) {
    logger.error('Error fetching epic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   POST /api/v1/epics
 * @desc    Create new epic
 * @access  Private
 */
router.post('/', validateEpicData, enforcePriorityLimits, async (req, res) => {
  try {
    const {
      title,
      description,
      businessValue,
      status = 'planned',
      priority = 'medium',
      targetSprint,
    } = req.body;

    const id = uuidv4();

    await pool.execute(
      `
      INSERT INTO epics (id, title, description, business_value, status, priority, target_sprint)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        title,
        description,
        businessValue,
        status,
        priority,
        targetSprint || null,
      ]
    );

    // Fetch the created epic
    const [createdEpic] = await pool.execute(
      'SELECT * FROM epics WHERE id = ?',
      [id]
    );

    logger.info(`New epic created: ${title} (${id})`);
    res.status(201).json({
      success: true,
      data: createdEpic[0],
    });
  } catch (error) {
    logger.error('Error creating epic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   PUT /api/v1/epics/:id
 * @desc    Update epic
 * @access  Private
 */
router.put('/:id', validateEpicData, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      businessValue,
      status,
      priority,
      targetSprint,
    } = req.body;

    // Check if epic exists
    const [existingEpic] = await pool.execute(
      'SELECT * FROM epics WHERE id = ?',
      [id]
    );

    if (existingEpic.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Epic not found',
      });
    }

    // Update completed_at timestamp if status is changing to complete
    const completedAt =
      status === 'complete' && existingEpic[0].status !== 'complete'
        ? new Date()
        : existingEpic[0].completed_at;

    await pool.execute(
      `
      UPDATE epics 
      SET title = ?, description = ?, business_value = ?, status = ?, priority = ?, 
          target_sprint = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        title,
        description,
        businessValue,
        status,
        priority,
        targetSprint || null,
        completedAt,
        id,
      ]
    );

    // Fetch updated epic
    const [updatedEpic] = await pool.execute(
      'SELECT * FROM epics WHERE id = ?',
      [id]
    );

    logger.info(`Epic updated: ${title} (${id})`);
    res.json({
      success: true,
      data: updatedEpic[0],
    });
  } catch (error) {
    logger.error('Error updating epic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   DELETE /api/v1/epics/:id
 * @desc    Delete epic (only if no associated stories)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if epic exists
    const [existingEpic] = await pool.execute(
      'SELECT * FROM epics WHERE id = ?',
      [id]
    );

    if (existingEpic.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Epic not found',
      });
    }

    // Check if epic has associated stories
    const [associatedStories] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_stories WHERE epic_id = ?',
      [id]
    );

    if (associatedStories[0].count > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete epic with associated stories. Please remove or reassign stories first.',
      });
    }

    await pool.execute('DELETE FROM epics WHERE id = ?', [id]);

    logger.info(`Epic deleted: ${existingEpic[0].title} (${id})`);
    res.json({
      success: true,
      message: 'Epic deleted successfully',
      data: existingEpic[0],
    });
  } catch (error) {
    logger.error('Error deleting epic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
