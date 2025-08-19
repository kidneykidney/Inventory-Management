const express = require('express');
const router = express.Router();
const { Sprint, UserStory, BurndownData } = require('../models/agileModels');
const SprintPlanningService = require('../services/sprintService');
const { validateSprint } = require('../middleware/agileValidation');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// GET /api/v1/sprints - Get all sprints with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let sprints = await Sprint.findAll();

    // Filter by status if provided
    if (status) {
      sprints = sprints.filter(sprint => sprint.status === status);
    }

    // Limit results if specified
    if (limit) {
      sprints = sprints.slice(0, parseInt(limit));
    }

    // Add story counts for each sprint
    const sprintsWithMetrics = await Promise.all(
      sprints.map(async sprint => {
        const allStories = await UserStory.findAll();
        const sprintStories = allStories.filter(
          story => story.sprint_id === sprint.id
        );

        return {
          ...sprint,
          storyCount: sprintStories.length,
          totalStoryPoints: sprintStories.reduce(
            (sum, story) => sum + story.story_points,
            0
          ),
          completedStoryPoints: sprintStories
            .filter(story => story.status === 'done')
            .reduce((sum, story) => sum + story.story_points, 0),
        };
      })
    );

    res.json({
      success: true,
      data: sprintsWithMetrics,
    });
  } catch (error) {
    logger.error('Error fetching sprints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sprints',
      error: error.message,
    });
  }
});

// GET /api/v1/sprints/:id - Get sprint by ID with detailed metrics
router.get('/:id', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const metrics = await SprintPlanningService.getSprintMetrics(req.params.id);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error fetching sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sprint',
      error: error.message,
    });
  }
});

// POST /api/v1/sprints - Create new sprint
router.post('/', validateSprint, async (req, res) => {
  try {
    const sprintData = {
      id: uuidv4(),
      ...req.body,
    };

    await Sprint.create(sprintData);
    const createdSprint = await Sprint.findById(sprintData.id);

    logger.info(`Sprint ${sprintData.number} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Sprint created successfully',
      data: createdSprint,
    });
  } catch (error) {
    logger.error('Error creating sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sprint',
      error: error.message,
    });
  }
});

// PUT /api/v1/sprints/:id - Update sprint
router.put('/:id', validateSprint, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    // Update sprint in database
    await Sprint.update(req.params.id, req.body);
    const updatedSprint = await Sprint.findById(req.params.id);

    logger.info(`Sprint ${req.params.id} updated successfully`);

    res.json({
      success: true,
      message: 'Sprint updated successfully',
      data: updatedSprint,
    });
  } catch (error) {
    logger.error('Error updating sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sprint',
      error: error.message,
    });
  }
});

// DELETE /api/v1/sprints/:id - Delete sprint
router.delete('/:id', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    // Check if sprint has stories
    const allStories = await UserStory.findAll();
    const sprintStories = allStories.filter(
      story => story.sprint_id === req.params.id
    );

    if (sprintStories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sprint with assigned stories',
        storyCount: sprintStories.length,
      });
    }

    // Delete sprint
    await Sprint.delete(req.params.id);
    logger.info(`Sprint ${req.params.id} deleted successfully`);

    res.json({
      success: true,
      message: 'Sprint deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sprint',
      error: error.message,
    });
  }
});

// POST /api/v1/sprints/:id/start - Start a sprint
router.post('/:id/start', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    if (sprint.status !== 'planning') {
      return res.status(400).json({
        success: false,
        message: 'Only sprints in planning status can be started',
      });
    }

    // Check if there's already an active sprint
    const allSprints = await Sprint.findAll();
    const activeSprint = allSprints.find(s => s.status === 'active');

    if (activeSprint) {
      return res.status(400).json({
        success: false,
        message: 'Another sprint is already active',
        activeSprint: {
          id: activeSprint.id,
          number: activeSprint.number,
        },
      });
    }

    // Update sprint status to active
    await Sprint.update(req.params.id, { status: 'active' });
    logger.info(`Sprint ${sprint.number} started`);

    const updatedSprint = await Sprint.findById(req.params.id);

    res.json({
      success: true,
      message: 'Sprint started successfully',
      data: updatedSprint,
    });
  } catch (error) {
    logger.error('Error starting sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start sprint',
      error: error.message,
    });
  }
});

// POST /api/v1/sprints/:id/complete - Complete a sprint
router.post('/:id/complete', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    if (sprint.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active sprints can be completed',
      });
    }

    // Calculate final velocity
    const allStories = await UserStory.findAll();
    const sprintStories = allStories.filter(
      story => story.sprint_id === req.params.id
    );
    const completedPoints = sprintStories
      .filter(story => story.status === 'done')
      .reduce((sum, story) => sum + story.story_points, 0);

    // Update sprint status and velocity
    await Sprint.update(req.params.id, {
      status: 'complete',
      velocity: completedPoints,
    });
    logger.info(
      `Sprint ${sprint.number} completed with velocity: ${completedPoints}`
    );

    const updatedSprint = await Sprint.findById(req.params.id);

    res.json({
      success: true,
      message: 'Sprint completed successfully',
      data: {
        ...updatedSprint,
        finalVelocity: completedPoints,
        completedStories: sprintStories.filter(story => story.status === 'done')
          .length,
        totalStories: sprintStories.length,
      },
    });
  } catch (error) {
    logger.error('Error completing sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete sprint',
      error: error.message,
    });
  }
});

// GET /api/v1/sprints/:id/burndown - Get burndown chart data
router.get('/:id/burndown', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const burndownData = await SprintPlanningService.generateBurndownData(
      req.params.id
    );

    res.json({
      success: true,
      data: burndownData,
    });
  } catch (error) {
    logger.error('Error generating burndown data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate burndown data',
      error: error.message,
    });
  }
});

// GET /api/v1/sprints/planning/velocity - Get team velocity for planning
router.get('/planning/velocity', async (req, res) => {
  try {
    const { sprintCount } = req.query;
    const velocity = await SprintPlanningService.calculateVelocity(
      sprintCount ? parseInt(sprintCount) : 3
    );

    res.json({
      success: true,
      data: {
        averageVelocity: velocity,
        basedOnSprints: sprintCount || 3,
      },
    });
  } catch (error) {
    logger.error('Error calculating velocity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate velocity',
      error: error.message,
    });
  }
});

// POST /api/v1/sprints/planning/recommend - Get recommended stories for sprint
router.post('/planning/recommend', async (req, res) => {
  try {
    const { capacity, excludeStoryIds = [] } = req.body;

    if (!capacity || capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid capacity is required',
      });
    }

    const recommendations = await SprintPlanningService.getRecommendedStories(
      capacity,
      excludeStoryIds
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Error getting story recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get story recommendations',
      error: error.message,
    });
  }
});

// POST /api/v1/sprints/planning/validate-capacity - Validate sprint capacity
router.post('/planning/validate-capacity', async (req, res) => {
  try {
    const { capacity, teamSize = 5 } = req.body;

    if (!capacity || capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid capacity is required',
      });
    }

    const validation = await SprintPlanningService.validateSprintCapacity(
      capacity,
      teamSize
    );

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error('Error validating sprint capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate sprint capacity',
      error: error.message,
    });
  }
});

// POST /api/v1/sprints/:id/allocate - Allocate stories to sprint
router.post('/:id/allocate', async (req, res) => {
  try {
    const { storyIds } = req.body;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Story IDs array is required',
      });
    }

    const result = await SprintPlanningService.allocateStoriesToSprint(
      req.params.id,
      storyIds
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(
      `${storyIds.length} stories allocated to sprint ${req.params.id}`
    );

    res.json(result);
  } catch (error) {
    logger.error('Error allocating stories to sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate stories to sprint',
      error: error.message,
    });
  }
});

// DELETE /api/v1/sprints/:id/stories/:storyId - Remove story from sprint
router.delete('/:id/stories/:storyId', async (req, res) => {
  try {
    const { id: sprintId, storyId } = req.params;

    const story = await UserStory.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (story.sprint_id !== sprintId) {
      return res.status(400).json({
        success: false,
        message: 'Story is not assigned to this sprint',
      });
    }

    // Remove story from sprint
    await UserStory.update(storyId, {
      sprintId: null,
      status: 'backlog', // Move back to backlog
    });

    logger.info(`Story ${storyId} removed from sprint ${sprintId}`);

    res.json({
      success: true,
      message: 'Story removed from sprint successfully',
    });
  } catch (error) {
    logger.error('Error removing story from sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove story from sprint',
      error: error.message,
    });
  }
});

// GET /api/v1/sprints/:id/stories - Get all stories in a sprint
router.get('/:id/stories', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const allStories = await UserStory.findAll();
    const sprintStories = allStories.filter(
      story => story.sprint_id === req.params.id
    );

    // Group stories by status
    const storiesByStatus = {
      todo: sprintStories.filter(s => s.status === 'todo'),
      'in-progress': sprintStories.filter(s => s.status === 'in-progress'),
      review: sprintStories.filter(s => s.status === 'review'),
      done: sprintStories.filter(s => s.status === 'done'),
    };

    res.json({
      success: true,
      data: {
        sprint: {
          id: sprint.id,
          number: sprint.number,
          goal: sprint.goal,
          status: sprint.status,
        },
        stories: sprintStories,
        storiesByStatus,
        totalStoryPoints: sprintStories.reduce(
          (sum, story) => sum + story.story_points,
          0
        ),
        completedStoryPoints: storiesByStatus.done.reduce(
          (sum, story) => sum + story.story_points,
          0
        ),
      },
    });
  } catch (error) {
    logger.error('Error fetching sprint stories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sprint stories',
      error: error.message,
    });
  }
});

module.exports = router;
