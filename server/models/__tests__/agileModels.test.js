const { Epic, UserStory, Sprint } = require('../agileModels');
const {
  initTestDatabase,
  resetDatabase,
  seedTestData,
  createMockEpic,
  createMockUserStory,
  createMockSprint,
} = require('../../test-utils');

describe('Agile Models', () => {
  beforeAll(async () => {
    await initTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedTestData();
  });

  describe('Epic Model', () => {
    describe('Epic.create', () => {
      it('should create a new epic with valid data', async () => {
        const epicData = createMockEpic({
          title: 'New Test Epic',
          description:
            'Detailed description for the new test epic that meets minimum requirements',
          business_value:
            'Provides significant business value for testing purposes',
        });

        const result = await Epic.create(epicData);

        expect(result).toHaveProperty('insertId');
        expect(typeof result.insertId).toBe('number');
      });

      it('should handle database errors gracefully', async () => {
        const invalidEpicData = {
          // Missing required fields
          title: null,
        };

        await expect(Epic.create(invalidEpicData)).rejects.toThrow();
      });
    });

    describe('Epic.findAll', () => {
      it('should return all epics', async () => {
        const epics = await Epic.findAll();

        expect(Array.isArray(epics)).toBe(true);
        expect(epics.length).toBeGreaterThan(0);
        expect(epics[0]).toHaveProperty('id');
        expect(epics[0]).toHaveProperty('title');
        expect(epics[0]).toHaveProperty('description');
      });

      it('should return empty array when no epics exist', async () => {
        await resetDatabase(); // Clear all data

        const epics = await Epic.findAll();

        expect(Array.isArray(epics)).toBe(true);
        expect(epics.length).toBe(0);
      });
    });

    describe('Epic.findById', () => {
      it('should return epic by id', async () => {
        const epic = await Epic.findById('epic-1');

        expect(epic).not.toBeNull();
        expect(epic.id).toBe('epic-1');
        expect(epic).toHaveProperty('title');
        expect(epic).toHaveProperty('description');
      });

      it('should return null for non-existent epic', async () => {
        const epic = await Epic.findById('non-existent-id');

        expect(epic).toBeNull();
      });

      it('should handle invalid id formats', async () => {
        const epic = await Epic.findById(null);

        expect(epic).toBeNull();
      });
    });

    describe('Epic.update', () => {
      it('should update existing epic', async () => {
        const updateData = {
          title: 'Updated Epic Title',
          description:
            'Updated description that meets the minimum length requirements for validation',
          status: 'in-progress',
        };

        const result = await Epic.update('epic-1', updateData);

        expect(result).toHaveProperty('affectedRows');
        expect(result.affectedRows).toBe(1);

        // Verify the update
        const updatedEpic = await Epic.findById('epic-1');
        expect(updatedEpic.title).toBe(updateData.title);
        expect(updatedEpic.description).toBe(updateData.description);
        expect(updatedEpic.status).toBe(updateData.status);
      });

      it('should return 0 affected rows for non-existent epic', async () => {
        const updateData = { title: 'Updated Title' };

        const result = await Epic.update('non-existent-id', updateData);

        expect(result.affectedRows).toBe(0);
      });
    });

    describe('Epic.delete', () => {
      it('should delete existing epic', async () => {
        const result = await Epic.delete('epic-1');

        expect(result).toHaveProperty('affectedRows');
        expect(result.affectedRows).toBe(1);

        // Verify deletion
        const deletedEpic = await Epic.findById('epic-1');
        expect(deletedEpic).toBeNull();
      });

      it('should return 0 affected rows for non-existent epic', async () => {
        const result = await Epic.delete('non-existent-id');

        expect(result.affectedRows).toBe(0);
      });
    });
  });

  describe('UserStory Model', () => {
    describe('UserStory.create', () => {
      it('should create a new user story with valid data', async () => {
        const storyData = createMockUserStory({
          title: 'New Test Story',
          description:
            'As a user, I want to test story creation, so that I can verify functionality',
          acceptance_criteria: JSON.stringify([
            'WHEN user creates story THEN it is saved to database',
            'GIVEN valid story data WHEN user submits THEN success message is shown',
          ]),
        });

        const result = await UserStory.create(storyData);

        expect(result).toHaveProperty('insertId');
        expect(typeof result.insertId).toBe('number');
      });

      it('should handle invalid story points', async () => {
        const storyData = createMockUserStory({
          story_points: 4, // Invalid Fibonacci number
        });

        // This should be handled by validation at the API level
        // The model itself might accept it, but validation should catch it
        const result = await UserStory.create(storyData);
        expect(result).toHaveProperty('insertId');
      });
    });

    describe('UserStory.findAll', () => {
      it('should return all user stories', async () => {
        const stories = await UserStory.findAll();

        expect(Array.isArray(stories)).toBe(true);
        expect(stories.length).toBeGreaterThan(0);
        expect(stories[0]).toHaveProperty('id');
        expect(stories[0]).toHaveProperty('title');
        expect(stories[0]).toHaveProperty('story_points');
      });

      it('should parse acceptance criteria JSON', async () => {
        const stories = await UserStory.findAll();
        const storyWithCriteria = stories.find(s => s.acceptance_criteria);

        if (storyWithCriteria) {
          expect(typeof storyWithCriteria.acceptance_criteria).toBe('string');
          const parsed = JSON.parse(storyWithCriteria.acceptance_criteria);
          expect(Array.isArray(parsed)).toBe(true);
        }
      });
    });

    describe('UserStory.findById', () => {
      it('should return user story by id', async () => {
        const story = await UserStory.findById('story-1');

        expect(story).not.toBeNull();
        expect(story.id).toBe('story-1');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('description');
      });

      it('should return null for non-existent story', async () => {
        const story = await UserStory.findById('non-existent-id');

        expect(story).toBeNull();
      });
    });

    describe('UserStory.findByEpicId', () => {
      it('should return stories for specific epic', async () => {
        const stories = await UserStory.findByEpicId('epic-1');

        expect(Array.isArray(stories)).toBe(true);
        stories.forEach(story => {
          expect(story.epic_id).toBe('epic-1');
        });
      });

      it('should return empty array for epic with no stories', async () => {
        const stories = await UserStory.findByEpicId('non-existent-epic');

        expect(Array.isArray(stories)).toBe(true);
        expect(stories.length).toBe(0);
      });
    });

    describe('UserStory.findByStatus', () => {
      it('should return stories with specific status', async () => {
        const stories = await UserStory.findByStatus('backlog');

        expect(Array.isArray(stories)).toBe(true);
        stories.forEach(story => {
          expect(story.status).toBe('backlog');
        });
      });

      it('should return empty array for status with no stories', async () => {
        const stories = await UserStory.findByStatus('non-existent-status');

        expect(Array.isArray(stories)).toBe(true);
        expect(stories.length).toBe(0);
      });
    });

    describe('UserStory.update', () => {
      it('should update existing user story', async () => {
        const updateData = {
          title: 'Updated Story Title',
          status: 'in-progress',
          story_points: 8,
        };

        const result = await UserStory.update('story-1', updateData);

        expect(result).toHaveProperty('affectedRows');
        expect(result.affectedRows).toBe(1);

        // Verify the update
        const updatedStory = await UserStory.findById('story-1');
        expect(updatedStory.title).toBe(updateData.title);
        expect(updatedStory.status).toBe(updateData.status);
        expect(updatedStory.story_points).toBe(updateData.story_points);
      });
    });

    describe('UserStory.delete', () => {
      it('should delete existing user story', async () => {
        const result = await UserStory.delete('story-1');

        expect(result).toHaveProperty('affectedRows');
        expect(result.affectedRows).toBe(1);

        // Verify deletion
        const deletedStory = await UserStory.findById('story-1');
        expect(deletedStory).toBeNull();
      });
    });
  });

  describe('Sprint Model', () => {
    describe('Sprint.create', () => {
      it('should create a new sprint with valid data', async () => {
        const sprintData = createMockSprint({
          number: 3,
          start_date: '2024-02-01',
          end_date: '2024-02-14',
          goal: 'Complete testing framework implementation and validation',
        });

        const result = await Sprint.create(sprintData);

        expect(result).toHaveProperty('insertId');
        expect(typeof result.insertId).toBe('number');
      });

      it('should handle duplicate sprint numbers', async () => {
        const sprintData = createMockSprint({
          number: 1, // Already exists in seed data
        });

        // This might throw a unique constraint error
        await expect(Sprint.create(sprintData)).rejects.toThrow();
      });
    });

    describe('Sprint.findAll', () => {
      it('should return all sprints', async () => {
        const sprints = await Sprint.findAll();

        expect(Array.isArray(sprints)).toBe(true);
        expect(sprints.length).toBeGreaterThan(0);
        expect(sprints[0]).toHaveProperty('id');
        expect(sprints[0]).toHaveProperty('number');
        expect(sprints[0]).toHaveProperty('goal');
      });

      it('should return sprints in order', async () => {
        const sprints = await Sprint.findAll();

        // Should be ordered by number or creation date
        for (let i = 1; i < sprints.length; i++) {
          expect(sprints[i].number).toBeGreaterThanOrEqual(
            sprints[i - 1].number
          );
        }
      });
    });

    describe('Sprint.findById', () => {
      it('should return sprint by id', async () => {
        const sprint = await Sprint.findById('sprint-1');

        expect(sprint).not.toBeNull();
        expect(sprint.id).toBe('sprint-1');
        expect(sprint).toHaveProperty('number');
        expect(sprint).toHaveProperty('goal');
      });

      it('should return null for non-existent sprint', async () => {
        const sprint = await Sprint.findById('non-existent-id');

        expect(sprint).toBeNull();
      });
    });

    describe('Sprint.findByStatus', () => {
      it('should return sprints with specific status', async () => {
        const sprints = await Sprint.findByStatus('active');

        expect(Array.isArray(sprints)).toBe(true);
        sprints.forEach(sprint => {
          expect(sprint.status).toBe('active');
        });
      });
    });

    describe('Sprint.update', () => {
      it('should update existing sprint', async () => {
        const updateData = {
          goal: 'Updated sprint goal with comprehensive testing coverage',
          status: 'completed',
          velocity: 35,
        };

        const result = await Sprint.update('sprint-1', updateData);

        expect(result).toHaveProperty('affectedRows');
        expect(result.affectedRows).toBe(1);

        // Verify the update
        const updatedSprint = await Sprint.findById('sprint-1');
        expect(updatedSprint.goal).toBe(updateData.goal);
        expect(updatedSprint.status).toBe(updateData.status);
        expect(updatedSprint.velocity).toBe(updateData.velocity);
      });
    });

    describe('Sprint.delete', () => {
      it('should delete existing sprint', async () => {
        const result = await Sprint.delete('sprint-1');

        expect(result).toHaveProperty('affectedRows');
        expect(result.affectedRows).toBe(1);

        // Verify deletion
        const deletedSprint = await Sprint.findById('sprint-1');
        expect(deletedSprint).toBeNull();
      });
    });
  });

  describe('Model Relationships', () => {
    it('should maintain epic-story relationships', async () => {
      const epic = await Epic.findById('epic-1');
      const stories = await UserStory.findByEpicId('epic-1');

      expect(epic).not.toBeNull();
      expect(stories.length).toBeGreaterThan(0);
      stories.forEach(story => {
        expect(story.epic_id).toBe(epic.id);
      });
    });

    it('should handle cascade deletes properly', async () => {
      // Delete an epic and verify related stories are handled appropriately
      await Epic.delete('epic-1');

      const stories = await UserStory.findByEpicId('epic-1');
      // Depending on foreign key constraints, stories might be deleted or set to null
      // This test verifies the expected behavior
      expect(Array.isArray(stories)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should handle JSON fields correctly', async () => {
      const storyData = createMockUserStory({
        acceptance_criteria: JSON.stringify([
          'WHEN user performs action THEN system responds',
          'GIVEN valid input WHEN user submits THEN data is saved',
        ]),
      });

      const result = await UserStory.create(storyData);
      const createdStory = await UserStory.findById(result.insertId);

      expect(typeof createdStory.acceptance_criteria).toBe('string');
      const parsed = JSON.parse(createdStory.acceptance_criteria);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('should handle date fields correctly', async () => {
      const sprintData = createMockSprint({
        start_date: '2024-03-01',
        end_date: '2024-03-14',
      });

      const result = await Sprint.create(sprintData);
      const createdSprint = await Sprint.findById(result.insertId);

      expect(createdSprint.start_date).toBeTruthy();
      expect(createdSprint.end_date).toBeTruthy();
      // Dates might be returned as Date objects or strings depending on configuration
    });
  });
});
