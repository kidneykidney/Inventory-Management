const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { Epic, UserStory, Sprint } = require('../models/agileModels');
const {
  validateEpic,
  validateUserStory,
  validateSprint,
  validatePriorityUpdate,
  validateStoryPointEstimate,
} = require('../middleware/agileValidation');
const { v4: uuidv4 } = require('uuid');

// Epic routes
// GET /api/v1/agile/epics - Get all epics
router.get('/epics', async (req, res) => {
  try {
    const epics = await Epic.findAll();

    // Get stories for each epic
    const epicsWithStories = await Promise.all(
      epics.map(async epic => {
        const stories = await UserStory.findByEpicId(epic.id);
        return {
          ...epic,
          stories,
          estimatedStoryPoints: stories.reduce(
            (sum, story) => sum + story.story_points,
            0
          ),
          completedStoryPoints: stories
            .filter(story => story.status === 'done')
            .reduce((sum, story) => sum + story.story_points, 0),
        };
      })
    );

    res.json({
      success: true,
      data: epicsWithStories,
    });
  } catch (error) {
    console.error('Error fetching epics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch epics',
      error: error.message,
    });
  }
});

// GET /api/v1/agile/epics/:id - Get epic by ID
router.get('/epics/:id', async (req, res) => {
  try {
    const epic = await Epic.findById(req.params.id);

    if (!epic) {
      return res.status(404).json({
        success: false,
        message: 'Epic not found',
      });
    }

    const stories = await UserStory.findByEpicId(epic.id);
    const epicWithStories = {
      ...epic,
      stories,
      estimatedStoryPoints: stories.reduce(
        (sum, story) => sum + story.story_points,
        0
      ),
      completedStoryPoints: stories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + story.story_points, 0),
    };

    res.json({
      success: true,
      data: epicWithStories,
    });
  } catch (error) {
    console.error('Error fetching epic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch epic',
      error: error.message,
    });
  }
});

// POST /api/v1/agile/epics - Create new epic
router.post('/epics', validateEpic, async (req, res) => {
  try {
    const epicData = {
      id: uuidv4(),
      ...req.body,
    };

    await Epic.create(epicData);
    const createdEpic = await Epic.findById(epicData.id);

    res.status(201).json({
      success: true,
      message: 'Epic created successfully',
      data: createdEpic,
    });
  } catch (error) {
    console.error('Error creating epic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create epic',
      error: error.message,
    });
  }
});

// PUT /api/v1/agile/epics/:id - Update epic
router.put('/epics/:id', validateEpic, async (req, res) => {
  try {
    const epic = await Epic.findById(req.params.id);

    if (!epic) {
      return res.status(404).json({
        success: false,
        message: 'Epic not found',
      });
    }

    await Epic.update(req.params.id, req.body);
    const updatedEpic = await Epic.findById(req.params.id);

    res.json({
      success: true,
      message: 'Epic updated successfully',
      data: updatedEpic,
    });
  } catch (error) {
    console.error('Error updating epic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update epic',
      error: error.message,
    });
  }
});

// DELETE /api/v1/agile/epics/:id - Delete epic
router.delete('/epics/:id', async (req, res) => {
  try {
    const epic = await Epic.findById(req.params.id);

    if (!epic) {
      return res.status(404).json({
        success: false,
        message: 'Epic not found',
      });
    }

    await Epic.delete(req.params.id);

    res.json({
      success: true,
      message: 'Epic deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting epic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete epic',
      error: error.message,
    });
  }
});

// User Story routes
// GET /api/v1/agile/stories - Get all user stories
router.get('/stories', async (req, res) => {
  try {
    const { status, priority, epicId } = req.query;
    let stories;

    if (status) {
      stories = await UserStory.findByStatus(status);
    } else if (epicId) {
      stories = await UserStory.findByEpicId(epicId);
    } else {
      stories = await UserStory.findAll();
    }

    // Filter by priority if specified
    if (priority) {
      stories = stories.filter(story => story.priority === priority);
    }

    res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories',
      error: error.message,
    });
  }
});

// GET /api/v1/agile/stories/:id - Get story by ID
router.get('/stories/:id', async (req, res) => {
  try {
    const story = await UserStory.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch story',
      error: error.message,
    });
  }
});

// POST /api/v1/agile/stories - Create new user story
router.post('/stories', validateUserStory, async (req, res) => {
  try {
    const storyData = {
      id: uuidv4(),
      ...req.body,
    };

    await UserStory.create(storyData);
    const createdStory = await UserStory.findById(storyData.id);

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: createdStory,
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
      error: error.message,
    });
  }
});

// PUT /api/v1/agile/stories/:id - Update user story
router.put('/stories/:id', validateUserStory, async (req, res) => {
  try {
    const story = await UserStory.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    await UserStory.update(req.params.id, req.body);
    const updatedStory = await UserStory.findById(req.params.id);

    res.json({
      success: true,
      message: 'Story updated successfully',
      data: updatedStory,
    });
  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update story',
      error: error.message,
    });
  }
});

// DELETE /api/v1/agile/stories/:id - Delete user story
router.delete('/stories/:id', async (req, res) => {
  try {
    const story = await UserStory.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    await UserStory.delete(req.params.id);

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete story',
      error: error.message,
    });
  }
});

// PUT /api/v1/agile/stories/priorities - Update story priorities
router.put('/stories/priorities', validatePriorityUpdate, async (req, res) => {
  try {
    const { priorities } = req.body;

    // Update each story's priority
    await Promise.all(
      priorities.map(({ id, priority }) => UserStory.update(id, { priority }))
    );

    res.json({
      success: true,
      message: 'Story priorities updated successfully',
    });
  } catch (error) {
    console.error('Error updating priorities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update priorities',
      error: error.message,
    });
  }
});

// POST /api/v1/agile/stories/:id/estimate - Add story point estimate
router.post(
  '/stories/:id/estimate',
  validateStoryPointEstimate,
  async (req, res) => {
    try {
      const { estimates, finalEstimate, confidence } = req.body;
      const storyId = req.params.id;

      const story = await UserStory.findById(storyId);
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found',
        });
      }

      // Update story with final estimate
      await UserStory.update(storyId, { storyPoints: finalEstimate });

      // Here you could also store the estimation session data
      // For now, we'll just return the updated story
      const updatedStory = await UserStory.findById(storyId);

      res.json({
        success: true,
        message: 'Story point estimate updated successfully',
        data: {
          story: updatedStory,
          estimationSession: {
            estimates,
            finalEstimate,
            confidence,
          },
        },
      });
    } catch (error) {
      console.error('Error updating story estimate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update story estimate',
        error: error.message,
      });
    }
  }
);

// Sprint routes - Basic CRUD (detailed sprint planning routes are in /sprints)
// GET /api/v1/agile/sprints - Get all sprints
router.get('/sprints', async (req, res) => {
  try {
    const sprints = await Sprint.findAll();
    res.json({
      success: true,
      data: sprints,
    });
  } catch (error) {
    console.error('Error fetching sprints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sprints',
      error: error.message,
    });
  }
});

// POST /api/v1/agile/sprints - Create new sprint
router.post('/sprints', validateSprint, async (req, res) => {
  try {
    const sprintData = {
      id: uuidv4(),
      ...req.body,
    };

    await Sprint.create(sprintData);
    const createdSprint = await Sprint.findById(sprintData.id);

    res.status(201).json({
      success: true,
      message: 'Sprint created successfully',
      data: createdSprint,
    });
  } catch (error) {
    console.error('Error creating sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sprint',
      error: error.message,
    });
  }
});

// PUT /api/v1/agile/sprints/:id - Update sprint
router.put('/sprints/:id', validateSprint, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    await Sprint.update(req.params.id, req.body);
    const updatedSprint = await Sprint.findById(req.params.id);

    res.json({
      success: true,
      message: 'Sprint updated successfully',
      data: updatedSprint,
    });
  } catch (error) {
    console.error('Error updating sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sprint',
      error: error.message,
    });
  }
});

// DELETE /api/v1/agile/sprints/:id - Delete sprint
router.delete('/sprints/:id', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    await Sprint.delete(req.params.id);

    res.json({
      success: true,
      message: 'Sprint deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sprint',
      error: error.message,
    });
  }
});

// GET /api/v1/agile/backlog/metrics - Get backlog metrics
router.get('/backlog/metrics', async (req, res) => {
  try {
    const stories = await UserStory.findAll();
    const epics = await Epic.findAll();

    const metrics = {
      totalStories: stories.length,
      totalStoryPoints: stories.reduce(
        (sum, story) => sum + story.story_points,
        0
      ),
      storiesByStatus: {
        backlog: stories.filter(s => s.status === 'backlog').length,
        todo: stories.filter(s => s.status === 'todo').length,
        'in-progress': stories.filter(s => s.status === 'in-progress').length,
        review: stories.filter(s => s.status === 'review').length,
        done: stories.filter(s => s.status === 'done').length,
      },
      storiesByPriority: {
        high: stories.filter(s => s.priority === 'high').length,
        medium: stories.filter(s => s.priority === 'medium').length,
        low: stories.filter(s => s.priority === 'low').length,
      },
      averageStoryPoints:
        stories.length > 0
          ? Math.round(
              (stories.reduce((sum, story) => sum + story.story_points, 0) /
                stories.length) *
                10
            ) / 10
          : 0,
      totalEpics: epics.length,
      epicsByStatus: {
        planned: epics.filter(e => e.status === 'planned').length,
        'in-progress': epics.filter(e => e.status === 'in-progress').length,
        complete: epics.filter(e => e.status === 'complete').length,
      },
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching backlog metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backlog metrics',
      error: error.message,
    });
  }
});

module.exports = router;
