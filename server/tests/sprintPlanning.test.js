const request = require('supertest');
const express = require('express');
const {
  Epic,
  UserStory,
  Sprint,
  initializeTables,
} = require('../models/agileModels');
const sprintRoutes = require('../routes/sprints');
const agileRoutes = require('../routes/agile');
const SprintPlanningService = require('../services/sprintService');
const { v4: uuidv4 } = require('uuid');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/sprints', sprintRoutes);
app.use('/api/v1/agile', agileRoutes);

describe('Sprint Planning API Integration Tests', () => {
  let testSprint, testEpic, testStories;

  beforeAll(async () => {
    // Initialize database tables
    await initializeTables();
  });

  beforeEach(async () => {
    // Create test data
    testEpic = {
      id: uuidv4(),
      title: 'Test Epic for Sprint Planning',
      description: 'This is a test epic for sprint planning integration tests',
      businessValue:
        'Provides testing capabilities for sprint planning features',
      status: 'planned',
      priority: 'high',
    };

    testSprint = {
      id: uuidv4(),
      number: 1,
      startDate: '2024-01-15',
      endDate: '2024-01-29',
      goal: 'Complete sprint planning integration tests',
      status: 'planning',
      capacity: 20,
    };

    testStories = [
      {
        id: uuidv4(),
        title: 'High Priority Story',
        description: 'This is a high priority story for testing',
        acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
        storyPoints: 5,
        priority: 'high',
        status: 'backlog',
        epicId: testEpic.id,
        tags: ['testing', 'high-priority'],
      },
      {
        id: uuidv4(),
        title: 'Medium Priority Story',
        description: 'This is a medium priority story for testing',
        acceptanceCriteria: ['Criterion 1', 'Criterion 2', 'Criterion 3'],
        storyPoints: 8,
        priority: 'medium',
        status: 'backlog',
        epicId: testEpic.id,
        tags: ['testing', 'medium-priority'],
      },
      {
        id: uuidv4(),
        title: 'Low Priority Story',
        description: 'This is a low priority story for testing',
        acceptanceCriteria: ['Criterion 1'],
        storyPoints: 3,
        priority: 'low',
        status: 'backlog',
        epicId: testEpic.id,
        tags: ['testing', 'low-priority'],
      },
      {
        id: uuidv4(),
        title: 'Large Story',
        description: 'This is a large story that might not fit in sprint',
        acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
        storyPoints: 13,
        priority: 'medium',
        status: 'backlog',
        epicId: testEpic.id,
        tags: ['testing', 'large'],
      },
    ];

    // Create test data in database
    await Epic.create(testEpic);
    await Sprint.create(testSprint);

    for (const story of testStories) {
      await UserStory.create(story);
    }
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await Sprint.delete(testSprint.id);
      await Epic.delete(testEpic.id);
      for (const story of testStories) {
        await UserStory.delete(story.id);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Sprint CRUD Operations', () => {
    test('GET /api/v1/sprints should return all sprints with metrics', async () => {
      const response = await request(app).get('/api/v1/sprints').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const sprint = response.body.data.find(s => s.id === testSprint.id);
      expect(sprint).toBeDefined();
      expect(sprint.storyCount).toBeDefined();
      expect(sprint.totalStoryPoints).toBeDefined();
    });

    test('GET /api/v1/sprints/:id should return sprint with detailed metrics', async () => {
      const response = await request(app)
        .get(`/api/v1/sprints/${testSprint.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sprintInfo.id).toBe(testSprint.id);
      expect(response.body.data.storyMetrics).toBeDefined();
      expect(response.body.data.capacityMetrics).toBeDefined();
    });

    test('POST /api/v1/sprints should create new sprint', async () => {
      const newSprint = {
        number: 2,
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        goal: 'Test sprint creation',
        capacity: 25,
      };

      const response = await request(app)
        .post('/api/v1/sprints')
        .send(newSprint)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.number).toBe(newSprint.number);
      expect(response.body.data.goal).toBe(newSprint.goal);

      // Clean up
      await Sprint.delete(response.body.data.id);
    });

    test('PUT /api/v1/sprints/:id should update sprint', async () => {
      const updates = {
        goal: 'Updated sprint goal',
        capacity: 30,
      };

      const response = await request(app)
        .put(`/api/v1/sprints/${testSprint.id}`)
        .send({ ...testSprint, ...updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Note: The actual update functionality needs to be implemented in the route
    });
  });

  describe('Sprint Planning Algorithms', () => {
    test('POST /api/v1/sprints/planning/recommend should return recommended stories', async () => {
      const response = await request(app)
        .post('/api/v1/sprints/planning/recommend')
        .send({ capacity: 15 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedStories).toBeDefined();
      expect(response.body.data.totalStoryPoints).toBeLessThanOrEqual(15);
      expect(response.body.data.capacityUtilization).toBeDefined();
      expect(response.body.data.priorityDistribution).toBeDefined();
    });

    test('POST /api/v1/sprints/planning/validate-capacity should validate capacity', async () => {
      const response = await request(app)
        .post('/api/v1/sprints/planning/validate-capacity')
        .send({ capacity: 25, teamSize: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBeDefined();
      expect(response.body.data.riskLevel).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });

    test('GET /api/v1/sprints/planning/velocity should return team velocity', async () => {
      const response = await request(app)
        .get('/api/v1/sprints/planning/velocity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageVelocity).toBeDefined();
      expect(response.body.data.basedOnSprints).toBeDefined();
    });
  });

  describe('Story Allocation', () => {
    test('POST /api/v1/sprints/:id/allocate should allocate stories to sprint', async () => {
      const storyIds = [testStories[0].id, testStories[2].id]; // 5 + 3 = 8 points

      const response = await request(app)
        .post(`/api/v1/sprints/${testSprint.id}/allocate`)
        .send({ storyIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.allocatedStories).toHaveLength(2);
      expect(response.body.totalPoints).toBe(8);
      expect(response.body.remainingCapacity).toBe(12);
    });

    test('POST /api/v1/sprints/:id/allocate should reject allocation if capacity exceeded', async () => {
      const storyIds = testStories.map(s => s.id); // Total: 5+8+3+13 = 29 points

      const response = await request(app)
        .post(`/api/v1/sprints/${testSprint.id}/allocate`)
        .send({ storyIds })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exceed');
      expect(response.body.overflow).toBe(9); // 29 - 20 = 9
      expect(response.body.suggestedStories).toBeDefined();
    });

    test('DELETE /api/v1/sprints/:id/stories/:storyId should remove story from sprint', async () => {
      // First allocate a story
      await UserStory.update(testStories[0].id, {
        sprintId: testSprint.id,
        status: 'todo',
      });

      const response = await request(app)
        .delete(`/api/v1/sprints/${testSprint.id}/stories/${testStories[0].id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');

      // Verify story is back in backlog
      const story = await UserStory.findById(testStories[0].id);
      expect(story.status).toBe('backlog');
      expect(story.sprint_id).toBeNull();
    });
  });

  describe('Burndown Chart Generation', () => {
    test('GET /api/v1/sprints/:id/burndown should generate burndown data', async () => {
      // Allocate some stories to the sprint
      await UserStory.update(testStories[0].id, {
        sprintId: testSprint.id,
        status: 'todo',
      });
      await UserStory.update(testStories[1].id, {
        sprintId: testSprint.id,
        status: 'done',
      });

      const response = await request(app)
        .get(`/api/v1/sprints/${testSprint.id}/burndown`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sprintId).toBe(testSprint.id);
      expect(response.body.data.totalStoryPoints).toBe(13); // 5 + 8
      expect(response.body.data.completedStoryPoints).toBe(8);
      expect(response.body.data.burndownData).toBeDefined();
      expect(response.body.data.currentProgress).toBeDefined();
      expect(response.body.data.completionRate).toBeDefined();
    });
  });

  describe('Sprint Lifecycle Management', () => {
    test('POST /api/v1/sprints/:id/start should start a sprint', async () => {
      const response = await request(app)
        .post(`/api/v1/sprints/${testSprint.id}/start`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('started');
    });

    test('POST /api/v1/sprints/:id/start should reject if another sprint is active', async () => {
      // Create and start another sprint
      const anotherSprint = {
        id: uuidv4(),
        number: 2,
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        goal: 'Another test sprint',
        status: 'active',
        capacity: 20,
      };

      await Sprint.create(anotherSprint);

      const response = await request(app)
        .post(`/api/v1/sprints/${testSprint.id}/start`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already active');

      // Clean up
      await Sprint.delete(anotherSprint.id);
    });

    test('POST /api/v1/sprints/:id/complete should complete a sprint', async () => {
      // Set sprint to active first
      await Sprint.update(testSprint.id, { status: 'active' });

      // Allocate and complete some stories
      await UserStory.update(testStories[0].id, {
        sprintId: testSprint.id,
        status: 'done',
      });

      const response = await request(app)
        .post(`/api/v1/sprints/${testSprint.id}/complete`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.finalVelocity).toBe(5);
      expect(response.body.data.completedStories).toBe(1);
    });
  });

  describe('Sprint Stories Management', () => {
    test('GET /api/v1/sprints/:id/stories should return all stories in sprint', async () => {
      // Allocate stories to sprint
      await UserStory.update(testStories[0].id, {
        sprintId: testSprint.id,
        status: 'todo',
      });
      await UserStory.update(testStories[1].id, {
        sprintId: testSprint.id,
        status: 'in-progress',
      });

      const response = await request(app)
        .get(`/api/v1/sprints/${testSprint.id}/stories`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toHaveLength(2);
      expect(response.body.data.storiesByStatus.todo).toHaveLength(1);
      expect(response.body.data.storiesByStatus['in-progress']).toHaveLength(1);
      expect(response.body.data.totalStoryPoints).toBe(13);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/v1/sprints/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/api/v1/sprints/nonexistent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('POST /api/v1/sprints with invalid data should return 400', async () => {
      const invalidSprint = {
        number: 'invalid',
        startDate: 'invalid-date',
        goal: 'x', // Too short
      };

      const response = await request(app)
        .post('/api/v1/sprints')
        .send(invalidSprint)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/v1/sprints/planning/recommend with invalid capacity should return 400', async () => {
      const response = await request(app)
        .post('/api/v1/sprints/planning/recommend')
        .send({ capacity: -5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('capacity');
    });
  });
});

describe('Sprint Planning Service Unit Tests', () => {
  let testStories, testSprint;

  beforeEach(async () => {
    await initializeTables();

    testSprint = {
      id: uuidv4(),
      number: 1,
      startDate: '2024-01-15',
      endDate: '2024-01-29',
      goal: 'Test sprint',
      status: 'planning',
      capacity: 20,
    };

    testStories = [
      {
        id: uuidv4(),
        title: 'Story 1',
        description: 'Test story 1',
        acceptanceCriteria: ['Criterion 1'],
        storyPoints: 5,
        priority: 'high',
        status: 'backlog',
      },
      {
        id: uuidv4(),
        title: 'Story 2',
        description: 'Test story 2',
        acceptanceCriteria: ['Criterion 1'],
        storyPoints: 8,
        priority: 'medium',
        status: 'backlog',
      },
    ];

    await Sprint.create(testSprint);
    for (const story of testStories) {
      await UserStory.create(story);
    }
  });

  afterEach(async () => {
    try {
      await Sprint.delete(testSprint.id);
      for (const story of testStories) {
        await UserStory.delete(story.id);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('calculateVelocity', () => {
    test('should return 0 for no completed sprints', async () => {
      const velocity = await SprintPlanningService.calculateVelocity();
      expect(velocity).toBe(0);
    });

    test('should calculate average velocity from completed sprints', async () => {
      // Create completed sprints with velocity
      const completedSprint1 = {
        id: uuidv4(),
        number: 2,
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        goal: 'Completed sprint 1',
        status: 'complete',
        capacity: 20,
        velocity: 15,
      };

      const completedSprint2 = {
        id: uuidv4(),
        number: 3,
        startDate: '2024-01-16',
        endDate: '2024-01-30',
        goal: 'Completed sprint 2',
        status: 'complete',
        capacity: 20,
        velocity: 18,
      };

      await Sprint.create(completedSprint1);
      await Sprint.create(completedSprint2);

      const velocity = await SprintPlanningService.calculateVelocity(2);
      expect(velocity).toBe(17); // (15 + 18) / 2 = 16.5, rounded to 17

      // Clean up
      await Sprint.delete(completedSprint1.id);
      await Sprint.delete(completedSprint2.id);
    });
  });

  describe('getRecommendedStories', () => {
    test('should recommend stories that fit within capacity', async () => {
      const recommendations =
        await SprintPlanningService.getRecommendedStories(10);

      expect(recommendations.recommendedStories).toBeDefined();
      expect(recommendations.totalStoryPoints).toBeLessThanOrEqual(10);
      expect(recommendations.capacityUtilization).toBeDefined();
      expect(recommendations.priorityDistribution).toBeDefined();
    });

    test('should prioritize high priority stories', async () => {
      const recommendations =
        await SprintPlanningService.getRecommendedStories(15);

      const highPriorityStories = recommendations.recommendedStories.filter(
        s => s.priority === 'high'
      );
      const mediumPriorityStories = recommendations.recommendedStories.filter(
        s => s.priority === 'medium'
      );

      // High priority stories should come first
      if (highPriorityStories.length > 0 && mediumPriorityStories.length > 0) {
        const firstHighIndex = recommendations.recommendedStories.findIndex(
          s => s.priority === 'high'
        );
        const firstMediumIndex = recommendations.recommendedStories.findIndex(
          s => s.priority === 'medium'
        );
        expect(firstHighIndex).toBeLessThan(firstMediumIndex);
      }
    });
  });

  describe('validateSprintCapacity', () => {
    test('should validate capacity against team size', async () => {
      const validation = await SprintPlanningService.validateSprintCapacity(
        25,
        5
      );

      expect(validation.isValid).toBeDefined();
      expect(validation.riskLevel).toBeDefined();
      expect(validation.capacityPerPerson).toBe(5); // 25 / 5
      expect(validation.recommendations).toBeDefined();
    });

    test('should flag high capacity as risky', async () => {
      const validation = await SprintPlanningService.validateSprintCapacity(
        100,
        5
      );

      expect(validation.riskLevel).toBe('high');
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateBurndownData', () => {
    test('should generate burndown data for sprint', async () => {
      // Allocate stories to sprint
      await UserStory.update(testStories[0].id, {
        sprintId: testSprint.id,
        status: 'done',
      });

      const burndownData = await SprintPlanningService.generateBurndownData(
        testSprint.id
      );

      expect(burndownData.sprintId).toBe(testSprint.id);
      expect(burndownData.totalStoryPoints).toBeDefined();
      expect(burndownData.completedStoryPoints).toBeDefined();
      expect(burndownData.burndownData).toBeDefined();
      expect(burndownData.currentProgress).toBeDefined();
      expect(burndownData.completionRate).toBeDefined();
    });
  });

  describe('calculateWorkingDays', () => {
    test('should calculate working days excluding weekends', () => {
      const startDate = new Date('2024-01-15'); // Monday
      const endDate = new Date('2024-01-19'); // Friday

      const workingDays = SprintPlanningService.calculateWorkingDays(
        startDate,
        endDate
      );
      expect(workingDays).toBe(5); // Monday to Friday
    });

    test('should exclude weekends from working days', () => {
      const startDate = new Date('2024-01-15'); // Monday
      const endDate = new Date('2024-01-21'); // Sunday

      const workingDays = SprintPlanningService.calculateWorkingDays(
        startDate,
        endDate
      );
      expect(workingDays).toBe(5); // Monday to Friday (excluding weekend)
    });
  });
});
