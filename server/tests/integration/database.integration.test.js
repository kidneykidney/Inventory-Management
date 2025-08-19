const { 
  initTestDatabase, 
  resetDatabase, 
  seedTestData,
  executeQuery,
  insertTestData,
  findTestData,
  deleteTestData,
  createMockEpic,
  createMockUserStory,
  createMockSprint
} = require('../../test-utils');

// Import test setup
require('./setup');

describe('Database Integration Tests', () => {
  describe('Database Connection', () => {
    it('should connect to test database successfully', async () => {
      const result = await executeQuery('SELECT 1 as test');
      expect(result).toHaveLength(1);
      expect(result[0].test).toBe(1);
    });

    it('should handle multiple concurrent connections', async () => {
      const queries = [];
      
      for (let i = 0; i < 10; i++) {
        queries.push(executeQuery('SELECT ? as value', [i]));
      }

      const results = await Promise.all(queries);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result[0].value).toBe(index);
      });
    });
  });

  describe('Epic Database Operations', () => {
    it('should insert and retrieve epic data', async () => {
      const epicData = createMockEpic({
        id: 'test-epic-1',
        title: 'Database Integration Test Epic',
        description: 'This epic is created to test database integration functionality',
        business_value: 'Validates database operations work correctly'
      });

      // Insert epic
      const insertResult = await insertTestData('epics', epicData);
      expect(insertResult.affectedRows).toBe(1);

      // Retrieve epic
      const retrievedEpics = await findTestData('epics', { id: 'test-epic-1' });
      expect(retrievedEpics).toHaveLength(1);
      expect(retrievedEpics[0].title).toBe(epicData.title);
      expect(retrievedEpics[0].description).toBe(epicData.description);
    });

    it('should update epic data correctly', async () => {
      const epicData = createMockEpic({
        id: 'test-epic-update',
        title: 'Original Title',
        status: 'planned'
      });

      await insertTestData('epics', epicData);

      // Update epic
      await executeQuery(
        'UPDATE epics SET title = ?, status = ? WHERE id = ?',
        ['Updated Title', 'in-progress', 'test-epic-update']
      );

      // Verify update
      const updatedEpics = await findTestData('epics', { id: 'test-epic-update' });
      expect(updatedEpics[0].title).toBe('Updated Title');
      expect(updatedEpics[0].status).toBe('in-progress');
    });

    it('should delete epic data correctly', async () => {
      const epicData = createMockEpic({
        id: 'test-epic-delete',
        title: 'Epic to Delete'
      });

      await insertTestData('epics', epicData);

      // Verify insertion
      let epics = await findTestData('epics', { id: 'test-epic-delete' });
      expect(epics).toHaveLength(1);

      // Delete epic
      const deleteResult = await deleteTestData('epics', { id: 'test-epic-delete' });
      expect(deleteResult.affectedRows).toBe(1);

      // Verify deletion
      epics = await findTestData('epics', { id: 'test-epic-delete' });
      expect(epics).toHaveLength(0);
    });
  });

  describe('User Story Database Operations', () => {
    it('should handle JSON acceptance criteria correctly', async () => {
      const storyData = createMockUserStory({
        id: 'test-story-json',
        title: 'JSON Test Story',
        acceptance_criteria: JSON.stringify([
          'WHEN user performs action THEN system responds',
          'GIVEN valid input WHEN user submits THEN data is saved'
        ])
      });

      await insertTestData('user_stories', storyData);

      const retrievedStories = await findTestData('user_stories', { id: 'test-story-json' });
      expect(retrievedStories).toHaveLength(1);
      
      const criteria = JSON.parse(retrievedStories[0].acceptance_criteria);
      expect(Array.isArray(criteria)).toBe(true);
      expect(criteria).toHaveLength(2);
      expect(criteria[0]).toContain('WHEN user performs action');
    });

    it('should maintain epic-story relationships', async () => {
      // Create epic first
      const epicData = createMockEpic({
        id: 'test-epic-relationship',
        title: 'Relationship Test Epic'
      });
      await insertTestData('epics', epicData);

      // Create story linked to epic
      const storyData = createMockUserStory({
        id: 'test-story-relationship',
        title: 'Relationship Test Story',
        epic_id: 'test-epic-relationship'
      });
      await insertTestData('user_stories', storyData);

      // Query stories by epic
      const epicStories = await findTestData('user_stories', { epic_id: 'test-epic-relationship' });
      expect(epicStories).toHaveLength(1);
      expect(epicStories[0].title).toBe('Relationship Test Story');

      // Query with JOIN to verify relationship
      const joinResult = await executeQuery(`
        SELECT e.title as epic_title, s.title as story_title
        FROM epics e
        JOIN user_stories s ON e.id = s.epic_id
        WHERE e.id = ?
      `, ['test-epic-relationship']);

      expect(joinResult).toHaveLength(1);
      expect(joinResult[0].epic_title).toBe('Relationship Test Epic');
      expect(joinResult[0].story_title).toBe('Relationship Test Story');
    });
  });

  describe('Sprint Database Operations', () => {
    it('should handle date fields correctly', async () => {
      const sprintData = createMockSprint({
        id: 'test-sprint-dates',
        number: 99,
        start_date: '2024-03-01',
        end_date: '2024-03-14'
      });

      await insertTestData('sprints', sprintData);

      const retrievedSprints = await findTestData('sprints', { id: 'test-sprint-dates' });
      expect(retrievedSprints).toHaveLength(1);
      
      // Dates should be properly stored and retrieved
      expect(retrievedSprints[0].start_date).toBeTruthy();
      expect(retrievedSprints[0].end_date).toBeTruthy();
    });

    it('should enforce unique sprint numbers', async () => {
      const sprint1 = createMockSprint({
        id: 'test-sprint-unique-1',
        number: 100
      });

      const sprint2 = createMockSprint({
        id: 'test-sprint-unique-2',
        number: 100 // Same number
      });

      await insertTestData('sprints', sprint1);

      // Second insert should fail due to unique constraint
      await expect(insertTestData('sprints', sprint2)).rejects.toThrow();
    });
  });

  describe('Complex Queries', () => {
    it('should calculate epic metrics correctly', async () => {
      // Create test epic
      const epicData = createMockEpic({
        id: 'test-epic-metrics',
        title: 'Metrics Test Epic'
      });
      await insertTestData('epics', epicData);

      // Create multiple stories with different points
      const stories = [
        createMockUserStory({
          id: 'story-metrics-1',
          epic_id: 'test-epic-metrics',
          story_points: 5,
          status: 'done'
        }),
        createMockUserStory({
          id: 'story-metrics-2',
          epic_id: 'test-epic-metrics',
          story_points: 8,
          status: 'in-progress'
        }),
        createMockUserStory({
          id: 'story-metrics-3',
          epic_id: 'test-epic-metrics',
          story_points: 3,
          status: 'backlog'
        })
      ];

      for (const story of stories) {
        await insertTestData('user_stories', story);
      }

      // Query epic with calculated metrics
      const metricsQuery = `
        SELECT 
          e.id,
          e.title,
          COUNT(s.id) as story_count,
          COALESCE(SUM(s.story_points), 0) as total_points,
          COALESCE(SUM(CASE WHEN s.status = 'done' THEN s.story_points ELSE 0 END), 0) as completed_points
        FROM epics e
        LEFT JOIN user_stories s ON e.id = s.epic_id
        WHERE e.id = ?
        GROUP BY e.id, e.title
      `;

      const metrics = await executeQuery(metricsQuery, ['test-epic-metrics']);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].story_count).toBe(3);
      expect(metrics[0].total_points).toBe(16); // 5 + 8 + 3
      expect(metrics[0].completed_points).toBe(5); // Only the 'done' story
    });

    it('should handle complex filtering queries', async () => {
      // Create test data with various statuses and priorities
      const testStories = [
        createMockUserStory({
          id: 'filter-story-1',
          status: 'backlog',
          priority: 'high',
          story_points: 5
        }),
        createMockUserStory({
          id: 'filter-story-2',
          status: 'in-progress',
          priority: 'high',
          story_points: 8
        }),
        createMockUserStory({
          id: 'filter-story-3',
          status: 'backlog',
          priority: 'medium',
          story_points: 3
        })
      ];

      for (const story of testStories) {
        await insertTestData('user_stories', story);
      }

      // Filter by status and priority
      const filteredStories = await executeQuery(`
        SELECT * FROM user_stories 
        WHERE status = ? AND priority = ?
        ORDER BY story_points DESC
      `, ['backlog', 'high']);

      expect(filteredStories).toHaveLength(1);
      expect(filteredStories[0].id).toBe('filter-story-1');
      expect(filteredStories[0].story_points).toBe(5);
    });
  });

  describe('Transaction Handling', () => {
    it('should handle transactions correctly', async () => {
      const pool = await initTestDatabase();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Insert epic
        await connection.execute(
          'INSERT INTO epics (id, title, description, business_value, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
          ['transaction-epic', 'Transaction Test', 'Test description', 'Test value', 'planned', 'high']
        );

        // Insert story
        await connection.execute(
          'INSERT INTO user_stories (id, title, description, acceptance_criteria, story_points, priority, status, epic_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['transaction-story', 'Transaction Story', 'Test story', '[]', 5, 'high', 'backlog', 'transaction-epic']
        );

        await connection.commit();

        // Verify both records exist
        const epics = await findTestData('epics', { id: 'transaction-epic' });
        const stories = await findTestData('user_stories', { id: 'transaction-story' });

        expect(epics).toHaveLength(1);
        expect(stories).toHaveLength(1);
        expect(stories[0].epic_id).toBe('transaction-epic');

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    });

    it('should rollback transactions on error', async () => {
      const pool = await initTestDatabase();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Insert valid epic
        await connection.execute(
          'INSERT INTO epics (id, title, description, business_value, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
          ['rollback-epic', 'Rollback Test', 'Test description', 'Test value', 'planned', 'high']
        );

        // Try to insert invalid story (should fail)
        await expect(connection.execute(
          'INSERT INTO user_stories (id, title, description, acceptance_criteria, story_points, priority, status, epic_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['rollback-story', null, 'Test story', '[]', 5, 'high', 'backlog', 'rollback-epic'] // null title should fail
        )).rejects.toThrow();

        await connection.rollback();

        // Verify no records were inserted
        const epics = await findTestData('epics', { id: 'rollback-epic' });
        expect(epics).toHaveLength(0);

      } catch (error) {
        await connection.rollback();
      } finally {
        connection.release();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Insert 100 stories
      const insertPromises = [];
      for (let i = 0; i < 100; i++) {
        const storyData = createMockUserStory({
          id: `bulk-story-${i}`,
          title: `Bulk Story ${i}`,
          story_points: (i % 5) + 1 // Vary story points
        });
        insertPromises.push(insertTestData('user_stories', storyData));
      }

      await Promise.all(insertPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Verify all stories were inserted
      const allStories = await executeQuery('SELECT COUNT(*) as count FROM user_stories WHERE id LIKE ?', ['bulk-story-%']);
      expect(allStories[0].count).toBe(100);
    });

    it('should handle complex aggregation queries efficiently', async () => {
      // Create test data
      for (let i = 0; i < 50; i++) {
        const epicData = createMockEpic({
          id: `perf-epic-${i}`,
          title: `Performance Epic ${i}`,
          status: i % 2 === 0 ? 'planned' : 'in-progress'
        });
        await insertTestData('epics', epicData);

        // Add stories to each epic
        for (let j = 0; j < 5; j++) {
          const storyData = createMockUserStory({
            id: `perf-story-${i}-${j}`,
            title: `Performance Story ${i}-${j}`,
            epic_id: `perf-epic-${i}`,
            story_points: (j % 3) + 1,
            status: j % 2 === 0 ? 'done' : 'backlog'
          });
          await insertTestData('user_stories', storyData);
        }
      }

      const startTime = Date.now();

      // Complex aggregation query
      const complexQuery = `
        SELECT 
          e.status as epic_status,
          COUNT(DISTINCT e.id) as epic_count,
          COUNT(s.id) as story_count,
          SUM(s.story_points) as total_points,
          AVG(s.story_points) as avg_points,
          SUM(CASE WHEN s.status = 'done' THEN s.story_points ELSE 0 END) as completed_points
        FROM epics e
        LEFT JOIN user_stories s ON e.id = s.epic_id
        WHERE e.id LIKE 'perf-epic-%'
        GROUP BY e.status
        ORDER BY epic_status
      `;

      const results = await executeQuery(complexQuery);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Should execute quickly
      expect(queryTime).toBeLessThan(1000); // 1 second

      // Verify results
      expect(results).toHaveLength(2); // planned and in-progress
      expect(results[0].epic_count).toBe(25); // Half of 50
      expect(results[0].story_count).toBe(125); // 25 epics * 5 stories
    });
  });
});