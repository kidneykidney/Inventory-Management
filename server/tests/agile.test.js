const request = require('supertest');
const express = require('express');
const agileRoutes = require('../routes/agile');
const { Epic, UserStory, Sprint } = require('../models/agileModels');

// Mock the database models
jest.mock('../models/agileModels');

const app = express();
app.use(express.json());
app.use('/api/v1/agile', agileRoutes);

describe('Agile API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Epic Endpoints', () => {
    describe('GET /api/v1/agile/epics', () => {
      it('should return all epics with stories', async () => {
        const mockEpics = [
          {
            id: 'epic-1',
            title: 'Test Epic',
            description: 'Test epic description',
            business_value: 'Test business value',
            status: 'planned',
            priority: 'high',
          },
        ];

        const mockStories = [
          {
            id: 'story-1',
            title: 'Test Story',
            story_points: 5,
            status: 'backlog',
          },
        ];

        Epic.findAll.mockResolvedValue(mockEpics);
        UserStory.findByEpicId.mockResolvedValue(mockStories);

        const response = await request(app)
          .get('/api/v1/agile/epics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].stories).toEqual(mockStories);
        expect(response.body.data[0].estimatedStoryPoints).toBe(5);
      });

      it('should handle database errors', async () => {
        Epic.findAll.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/v1/agile/epics')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Failed to fetch epics');
      });
    });

    describe('POST /api/v1/agile/epics', () => {
      it('should create a new epic with valid data', async () => {
        const epicData = {
          title: 'New Epic Title',
          description:
            'This is a detailed description of the new epic that meets the minimum length requirement',
          businessValue:
            'This epic provides significant business value to our customers',
          status: 'planned',
          priority: 'high',
        };

        const createdEpic = {
          id: 'epic-123',
          ...epicData,
        };

        Epic.create.mockResolvedValue({ insertId: 1 });
        Epic.findById.mockResolvedValue(createdEpic);

        const response = await request(app)
          .post('/api/v1/agile/epics')
          .send(epicData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Epic created successfully');
        expect(response.body.data).toEqual(createdEpic);
      });

      it('should reject epic with invalid title', async () => {
        const epicData = {
          title: 'Bad', // Too short
          description:
            'This is a detailed description of the new epic that meets the minimum length requirement',
          businessValue:
            'This epic provides significant business value to our customers',
        };

        const response = await request(app)
          .post('/api/v1/agile/epics')
          .send(epicData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'Title must be between 5 and 200 characters'
        );
      });

      it('should reject epic with missing description', async () => {
        const epicData = {
          title: 'Valid Epic Title',
          businessValue:
            'This epic provides significant business value to our customers',
        };

        const response = await request(app)
          .post('/api/v1/agile/epics')
          .send(epicData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'Description is required and must be a string'
        );
      });
    });

    describe('PUT /api/v1/agile/epics/:id', () => {
      it('should update an existing epic', async () => {
        const epicId = 'epic-123';
        const updateData = {
          title: 'Updated Epic Title',
          description:
            'This is an updated detailed description of the epic that meets the minimum length requirement',
          businessValue:
            'Updated business value description that provides clear value proposition',
          status: 'in-progress',
        };

        const existingEpic = { id: epicId, title: 'Old Title' };
        const updatedEpic = { id: epicId, ...updateData };

        Epic.findById.mockResolvedValueOnce(existingEpic);
        Epic.update.mockResolvedValue({ affectedRows: 1 });
        Epic.findById.mockResolvedValueOnce(updatedEpic);

        const response = await request(app)
          .put(`/api/v1/agile/epics/${epicId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Epic updated successfully');
        expect(response.body.data).toEqual(updatedEpic);
      });

      it('should return 404 for non-existent epic', async () => {
        const epicId = 'non-existent';
        const updateData = {
          title: 'Updated Epic Title',
          description:
            'This is an updated detailed description of the epic that meets the minimum length requirement',
          businessValue:
            'Updated business value description that provides clear value proposition',
        };

        Epic.findById.mockResolvedValue(null);

        const response = await request(app)
          .put(`/api/v1/agile/epics/${epicId}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Epic not found');
      });
    });
  });

  describe('User Story Endpoints', () => {
    describe('GET /api/v1/agile/stories', () => {
      it('should return all user stories', async () => {
        const mockStories = [
          {
            id: 'story-1',
            title: 'Test Story',
            description: 'Test story description',
            story_points: 5,
            status: 'backlog',
            priority: 'high',
          },
        ];

        UserStory.findAll.mockResolvedValue(mockStories);

        const response = await request(app)
          .get('/api/v1/agile/stories')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockStories);
      });

      it('should filter stories by status', async () => {
        const mockStories = [
          {
            id: 'story-1',
            title: 'Backlog Story',
            status: 'backlog',
          },
        ];

        UserStory.findByStatus.mockResolvedValue(mockStories);

        const response = await request(app)
          .get('/api/v1/agile/stories?status=backlog')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(UserStory.findByStatus).toHaveBeenCalledWith('backlog');
      });
    });

    describe('POST /api/v1/agile/stories', () => {
      it('should create a new user story with valid data', async () => {
        const storyData = {
          title: 'New User Story Title',
          description:
            'This is a detailed description of the user story that meets requirements',
          acceptanceCriteria: [
            'Given a user, when they perform action, then result should occur',
            'Given another condition, when something happens, then expected outcome',
          ],
          storyPoints: 5,
          priority: 'high',
          status: 'backlog',
        };

        const createdStory = {
          id: 'story-123',
          ...storyData,
        };

        UserStory.create.mockResolvedValue({ insertId: 1 });
        UserStory.findById.mockResolvedValue(createdStory);

        const response = await request(app)
          .post('/api/v1/agile/stories')
          .send(storyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Story created successfully');
        expect(response.body.data).toEqual(createdStory);
      });

      it('should reject story with invalid story points', async () => {
        const storyData = {
          title: 'New User Story Title',
          description:
            'This is a detailed description of the user story that meets requirements',
          acceptanceCriteria: ['Valid acceptance criterion with enough detail'],
          storyPoints: 4, // Invalid Fibonacci number
          priority: 'high',
        };

        const response = await request(app)
          .post('/api/v1/agile/stories')
          .send(storyData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'Story points must be a valid Fibonacci number (1, 2, 3, 5, 8, 13, 21)'
        );
      });

      it('should reject story with empty acceptance criteria', async () => {
        const storyData = {
          title: 'New User Story Title',
          description:
            'This is a detailed description of the user story that meets requirements',
          acceptanceCriteria: [],
          storyPoints: 5,
          priority: 'high',
        };

        const response = await request(app)
          .post('/api/v1/agile/stories')
          .send(storyData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'At least one acceptance criterion is required'
        );
      });
    });

    describe('PUT /api/v1/agile/stories/priorities', () => {
      it('should update story priorities', async () => {
        const priorityUpdates = {
          priorities: [
            { id: 'story-1', priority: 'high' },
            { id: 'story-2', priority: 'medium' },
          ],
        };

        UserStory.update.mockResolvedValue({ affectedRows: 1 });

        const response = await request(app)
          .put('/api/v1/agile/stories/priorities')
          .send(priorityUpdates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
          'Story priorities updated successfully'
        );
        expect(UserStory.update).toHaveBeenCalledTimes(2);
      });

      it('should reject invalid priority values', async () => {
        const priorityUpdates = {
          priorities: [{ id: 'story-1', priority: 'invalid' }],
        };

        const response = await request(app)
          .put('/api/v1/agile/stories/priorities')
          .send(priorityUpdates)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'Priority item 1 must have a valid priority (high, medium, low)'
        );
      });
    });
  });

  describe('Sprint Endpoints', () => {
    describe('GET /api/v1/agile/sprints', () => {
      it('should return all sprints', async () => {
        const mockSprints = [
          {
            id: 'sprint-1',
            number: 1,
            start_date: '2024-01-01',
            end_date: '2024-01-14',
            goal: 'Complete user authentication',
            status: 'active',
            capacity: 40,
          },
        ];

        Sprint.findAll.mockResolvedValue(mockSprints);

        const response = await request(app)
          .get('/api/v1/agile/sprints')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSprints);
      });
    });

    describe('POST /api/v1/agile/sprints', () => {
      it('should create a new sprint with valid data', async () => {
        const sprintData = {
          number: 1,
          startDate: '2024-02-01',
          endDate: '2024-02-14',
          goal: 'Complete user authentication and basic CRUD operations',
          capacity: 40,
          status: 'planning',
        };

        const createdSprint = {
          id: 'sprint-123',
          ...sprintData,
        };

        Sprint.create.mockResolvedValue({ insertId: 1 });
        Sprint.findById.mockResolvedValue(createdSprint);

        const response = await request(app)
          .post('/api/v1/agile/sprints')
          .send(sprintData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Sprint created successfully');
        expect(response.body.data).toEqual(createdSprint);
      });

      it('should reject sprint with invalid date range', async () => {
        const sprintData = {
          number: 1,
          startDate: '2024-02-14',
          endDate: '2024-02-01', // End date before start date
          goal: 'Complete user authentication and basic CRUD operations',
          capacity: 40,
        };

        const response = await request(app)
          .post('/api/v1/agile/sprints')
          .send(sprintData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'End date must be after start date'
        );
      });
    });
  });

  describe('Backlog Metrics Endpoint', () => {
    describe('GET /api/v1/agile/backlog/metrics', () => {
      it('should return comprehensive backlog metrics', async () => {
        const mockStories = [
          {
            id: 'story-1',
            story_points: 5,
            status: 'backlog',
            priority: 'high',
          },
          {
            id: 'story-2',
            story_points: 3,
            status: 'done',
            priority: 'medium',
          },
          {
            id: 'story-3',
            story_points: 8,
            status: 'in-progress',
            priority: 'low',
          },
        ];

        const mockEpics = [
          { id: 'epic-1', status: 'planned' },
          { id: 'epic-2', status: 'in-progress' },
        ];

        UserStory.findAll.mockResolvedValue(mockStories);
        Epic.findAll.mockResolvedValue(mockEpics);

        const response = await request(app)
          .get('/api/v1/agile/backlog/metrics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalStories).toBe(3);
        expect(response.body.data.totalStoryPoints).toBe(16);
        expect(response.body.data.averageStoryPoints).toBe(5.3);
        expect(response.body.data.storiesByStatus.backlog).toBe(1);
        expect(response.body.data.storiesByStatus.done).toBe(1);
        expect(response.body.data.storiesByPriority.high).toBe(1);
        expect(response.body.data.totalEpics).toBe(2);
      });
    });
  });

  describe('Story Point Estimation Endpoint', () => {
    describe('POST /api/v1/agile/stories/:id/estimate', () => {
      it('should update story with final estimate', async () => {
        const storyId = 'story-123';
        const estimateData = {
          estimates: [3, 5, 5, 8],
          finalEstimate: 5,
          confidence: 'medium',
        };

        const existingStory = { id: storyId, title: 'Test Story' };
        const updatedStory = { ...existingStory, storyPoints: 5 };

        UserStory.findById.mockResolvedValueOnce(existingStory);
        UserStory.update.mockResolvedValue({ affectedRows: 1 });
        UserStory.findById.mockResolvedValueOnce(updatedStory);

        const response = await request(app)
          .post(`/api/v1/agile/stories/${storyId}/estimate`)
          .send(estimateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
          'Story point estimate updated successfully'
        );
        expect(response.body.data.story).toEqual(updatedStory);
        expect(response.body.data.estimationSession.finalEstimate).toBe(5);
      });

      it('should reject invalid Fibonacci estimates', async () => {
        const storyId = 'story-123';
        const estimateData = {
          estimates: [4, 6], // Invalid Fibonacci numbers
          finalEstimate: 5,
          confidence: 'medium',
        };

        const response = await request(app)
          .post(`/api/v1/agile/stories/${storyId}/estimate`)
          .send(estimateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain(
          'Estimate 1 must be a valid Fibonacci number'
        );
      });
    });
  });
});
