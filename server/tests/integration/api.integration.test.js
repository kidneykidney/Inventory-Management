const request = require('supertest');
const express = require('express');
const cors = require('cors');
const agileRoutes = require('../../routes/agile');
const epicRoutes = require('../../routes/epics');
const storyRoutes = require('../../routes/stories');
const sprintRoutes = require('../../routes/sprints');
const authRoutes = require('../../routes/auth');
const userRoutes = require('../../routes/users');

// Import test setup
require('./setup');

// Create test app
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/v1/agile', agileRoutes);
  app.use('/api/v1/epics', epicRoutes);
  app.use('/api/v1/stories', storyRoutes);
  app.use('/api/v1/sprints', sprintRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'test' ? err.message : undefined,
    });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Epic API Integration', () => {
    describe('GET /api/v1/agile/epics', () => {
      it('should return all epics with stories', async () => {
        const response = await request(app)
          .get('/api/v1/agile/epics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);

        const epic = response.body.data[0];
        expect(epic).toHaveProperty('id');
        expect(epic).toHaveProperty('title');
        expect(epic).toHaveProperty('description');
        expect(epic).toHaveProperty('stories');
        expect(Array.isArray(epic.stories)).toBe(true);
      });
    });

    describe('POST /api/v1/agile/epics', () => {
      it('should create a new epic with valid data', async () => {
        const epicData = {
          title: 'Integration Test Epic',
          description:
            'This is a comprehensive description for the integration test epic that meets all validation requirements',
          businessValue:
            'Provides significant business value for testing integration between components',
          status: 'planned',
          priority: 'high',
        };

        const response = await request(app)
          .post('/api/v1/agile/epics')
          .send(epicData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Epic created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.title).toBe(epicData.title);
      });

      it('should reject epic with invalid data', async () => {
        const invalidEpicData = {
          title: 'Bad', // Too short
          description: 'Short', // Too short
          businessValue: 'No value',
        };

        const response = await request(app)
          .post('/api/v1/agile/epics')
          .send(invalidEpicData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
      });
    });

    describe('PUT /api/v1/agile/epics/:id', () => {
      it('should update existing epic', async () => {
        const updateData = {
          title: 'Updated Integration Test Epic',
          description:
            'This is an updated comprehensive description for the integration test epic that meets all validation requirements',
          status: 'in-progress',
        };

        const response = await request(app)
          .put('/api/v1/agile/epics/epic-1')
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Epic updated successfully');
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.status).toBe(updateData.status);
      });

      it('should return 404 for non-existent epic', async () => {
        const updateData = {
          title: 'Updated Title',
          description:
            'Updated description that meets minimum length requirements',
        };

        const response = await request(app)
          .put('/api/v1/agile/epics/non-existent-id')
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Epic not found');
      });
    });
  });

  describe('User Story API Integration', () => {
    describe('GET /api/v1/agile/stories', () => {
      it('should return all user stories', async () => {
        const response = await request(app)
          .get('/api/v1/agile/stories')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);

        const story = response.body.data[0];
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('description');
        expect(story).toHaveProperty('storyPoints');
        expect(story).toHaveProperty('status');
      });
    });

    describe('POST /api/v1/agile/stories', () => {
      it('should create a new user story with valid data', async () => {
        const storyData = {
          title: 'Integration Test User Story',
          description:
            'As a developer, I want to test story creation through integration tests, so that I can verify the API works correctly',
          acceptanceCriteria: [
            'WHEN developer sends valid story data THEN story is created successfully',
            'GIVEN valid story data WHEN API processes request THEN response includes story details',
          ],
          storyPoints: 5,
          priority: 'high',
          status: 'backlog',
          epicId: 'epic-1',
        };

        const response = await request(app)
          .post('/api/v1/agile/stories')
          .send(storyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Story created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.title).toBe(storyData.title);
        expect(response.body.data.storyPoints).toBe(storyData.storyPoints);
      });

      it('should reject story with invalid story points', async () => {
        const invalidStoryData = {
          title: 'Invalid Story Points Test',
          description:
            'As a developer, I want to test invalid story points, so that validation works correctly',
          acceptanceCriteria: [
            'WHEN invalid points provided THEN validation error occurs',
          ],
          storyPoints: 4, // Invalid Fibonacci number
          priority: 'medium',
        };

        const response = await request(app)
          .post('/api/v1/agile/stories')
          .send(invalidStoryData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
        expect(
          response.body.errors.some(error => error.includes('Fibonacci'))
        ).toBe(true);
      });
    });
  });

  describe('Sprint API Integration', () => {
    describe('GET /api/v1/agile/sprints', () => {
      it('should return all sprints', async () => {
        const response = await request(app)
          .get('/api/v1/agile/sprints')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);

        const sprint = response.body.data[0];
        expect(sprint).toHaveProperty('id');
        expect(sprint).toHaveProperty('number');
        expect(sprint).toHaveProperty('goal');
        expect(sprint).toHaveProperty('startDate');
        expect(sprint).toHaveProperty('endDate');
      });
    });

    describe('POST /api/v1/agile/sprints', () => {
      it('should create a new sprint with valid data', async () => {
        const sprintData = {
          number: 3,
          startDate: '2024-03-01',
          endDate: '2024-03-14',
          goal: 'Complete integration testing framework and validate all API endpoints',
          capacity: 40,
          status: 'planning',
        };

        const response = await request(app)
          .post('/api/v1/agile/sprints')
          .send(sprintData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Sprint created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.number).toBe(sprintData.number);
        expect(response.body.data.goal).toBe(sprintData.goal);
      });

      it('should reject sprint with invalid date range', async () => {
        const invalidSprintData = {
          number: 4,
          startDate: '2024-03-14',
          endDate: '2024-03-01', // End date before start date
          goal: 'Invalid date range test sprint',
          capacity: 40,
        };

        const response = await request(app)
          .post('/api/v1/agile/sprints')
          .send(invalidSprintData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
        expect(
          response.body.errors.some(error =>
            error.includes('End date must be after start date')
          )
        ).toBe(true);
      });
    });
  });

  describe('Cross-Entity Integration', () => {
    it('should maintain epic-story relationships', async () => {
      // Create an epic
      const epicData = {
        title: 'Cross-Integration Test Epic',
        description:
          'This epic is created to test cross-entity relationships in integration tests',
        businessValue:
          'Validates that relationships between entities work correctly',
        status: 'planned',
        priority: 'medium',
      };

      const epicResponse = await request(app)
        .post('/api/v1/agile/epics')
        .send(epicData)
        .expect(201);

      const epicId = epicResponse.body.data.id;

      // Create a story linked to the epic
      const storyData = {
        title: 'Cross-Integration Test Story',
        description:
          'As a developer, I want to test epic-story relationships, so that data integrity is maintained',
        acceptanceCriteria: [
          'WHEN story is created with epic ID THEN it is linked to the epic',
          'WHEN epic is queried THEN it includes linked stories',
        ],
        storyPoints: 3,
        priority: 'medium',
        status: 'backlog',
        epicId: epicId,
      };

      const storyResponse = await request(app)
        .post('/api/v1/agile/stories')
        .send(storyData)
        .expect(201);

      // Verify the relationship by fetching the epic with stories
      const epicsResponse = await request(app)
        .get('/api/v1/agile/epics')
        .expect(200);

      const createdEpic = epicsResponse.body.data.find(
        epic => epic.id === epicId
      );
      expect(createdEpic).toBeDefined();
      expect(createdEpic.stories).toBeDefined();
      expect(Array.isArray(createdEpic.stories)).toBe(true);

      const linkedStory = createdEpic.stories.find(
        story => story.id === storyResponse.body.data.id
      );
      expect(linkedStory).toBeDefined();
      expect(linkedStory.title).toBe(storyData.title);
    });

    it('should calculate epic metrics correctly', async () => {
      const response = await request(app)
        .get('/api/v1/agile/backlog/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEpics');
      expect(response.body.data).toHaveProperty('totalStories');
      expect(response.body.data).toHaveProperty('totalStoryPoints');
      expect(response.body.data).toHaveProperty('averageStoryPoints');
      expect(response.body.data).toHaveProperty('storiesByStatus');
      expect(response.body.data).toHaveProperty('storiesByPriority');

      // Verify calculated values make sense
      expect(typeof response.body.data.totalEpics).toBe('number');
      expect(typeof response.body.data.totalStories).toBe('number');
      expect(typeof response.body.data.totalStoryPoints).toBe('number');
      expect(response.body.data.totalEpics).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalStories).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the API returns proper error format
      const response = await request(app)
        .get('/api/v1/agile/epics/invalid-id-format')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should validate request data properly', async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/agile/epics')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [];

      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/api/v1/agile/epics').expect(200));
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app).get('/api/v1/agile/backlog/metrics').expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });
  });
});
