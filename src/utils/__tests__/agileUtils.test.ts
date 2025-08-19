import {
  calculateVelocity,
  calculateBurndownData,
  validateStoryPoints,
  formatStoryStatus,
  calculateSprintProgress,
  getStatusColor,
  getPriorityColor,
  isValidFibonacci,
  calculateTeamCapacity,
  generateSprintSummary,
} from '../agileUtils';

describe('agileUtils', () => {
  describe('calculateVelocity', () => {
    it('should calculate velocity correctly for completed sprints', () => {
      const sprints = [
        { status: 'completed', completedStoryPoints: 25 },
        { status: 'completed', completedStoryPoints: 30 },
        { status: 'completed', completedStoryPoints: 20 },
      ];

      const velocity = calculateVelocity(sprints);
      expect(velocity).toBe(25); // (25 + 30 + 20) / 3
    });

    it('should return 0 for empty sprints array', () => {
      const velocity = calculateVelocity([]);
      expect(velocity).toBe(0);
    });

    it('should ignore non-completed sprints', () => {
      const sprints = [
        { status: 'completed', completedStoryPoints: 25 },
        { status: 'active', completedStoryPoints: 15 },
        { status: 'planning', completedStoryPoints: 0 },
      ];

      const velocity = calculateVelocity(sprints);
      expect(velocity).toBe(25);
    });

    it('should handle sprints with zero completed points', () => {
      const sprints = [
        { status: 'completed', completedStoryPoints: 0 },
        { status: 'completed', completedStoryPoints: 20 },
      ];

      const velocity = calculateVelocity(sprints);
      expect(velocity).toBe(10);
    });
  });

  describe('calculateBurndownData', () => {
    it('should generate correct burndown data', () => {
      const sprint = {
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        totalStoryPoints: 40,
      };

      const completedWork = [
        { date: '2024-01-03', points: 5 },
        { date: '2024-01-05', points: 8 },
        { date: '2024-01-08', points: 12 },
      ];

      const burndownData = calculateBurndownData(sprint, completedWork);

      expect(burndownData).toHaveLength(14); // 14 days in sprint
      expect(burndownData[0].remaining).toBe(40); // Start with full points
      expect(burndownData[0].ideal).toBe(40);
      expect(burndownData[13].ideal).toBe(0); // End with zero ideal
    });

    it('should handle empty completed work', () => {
      const sprint = {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        totalStoryPoints: 21,
      };

      const burndownData = calculateBurndownData(sprint, []);

      expect(burndownData).toHaveLength(7);
      expect(burndownData.every(day => day.actual === 21)).toBe(true);
    });
  });

  describe('validateStoryPoints', () => {
    it('should validate correct Fibonacci numbers', () => {
      const validPoints = [1, 2, 3, 5, 8, 13, 21];
      validPoints.forEach(points => {
        expect(validateStoryPoints(points)).toBe(true);
      });
    });

    it('should reject invalid Fibonacci numbers', () => {
      const invalidPoints = [0, 4, 6, 7, 9, 10, 11, 12, 14, 15];
      invalidPoints.forEach(points => {
        expect(validateStoryPoints(points)).toBe(false);
      });
    });

    it('should reject negative numbers', () => {
      expect(validateStoryPoints(-1)).toBe(false);
      expect(validateStoryPoints(-5)).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(validateStoryPoints('5')).toBe(false);
      expect(validateStoryPoints(null)).toBe(false);
      expect(validateStoryPoints(undefined)).toBe(false);
    });
  });

  describe('formatStoryStatus', () => {
    it('should format status correctly', () => {
      expect(formatStoryStatus('backlog')).toBe('Backlog');
      expect(formatStoryStatus('in-progress')).toBe('In Progress');
      expect(formatStoryStatus('done')).toBe('Done');
      expect(formatStoryStatus('todo')).toBe('To Do');
    });

    it('should handle unknown status', () => {
      expect(formatStoryStatus('unknown')).toBe('Unknown');
    });

    it('should handle empty or null status', () => {
      expect(formatStoryStatus('')).toBe('');
      expect(formatStoryStatus(null)).toBe('');
      expect(formatStoryStatus(undefined)).toBe('');
    });
  });

  describe('calculateSprintProgress', () => {
    it('should calculate progress correctly', () => {
      const stories = [
        { status: 'done', storyPoints: 5 },
        { status: 'done', storyPoints: 8 },
        { status: 'in-progress', storyPoints: 3 },
        { status: 'todo', storyPoints: 5 },
      ];

      const progress = calculateSprintProgress(stories);

      expect(progress.totalPoints).toBe(21);
      expect(progress.completedPoints).toBe(13);
      expect(progress.inProgressPoints).toBe(3);
      expect(progress.remainingPoints).toBe(5);
      expect(progress.completionPercentage).toBe(62); // 13/21 * 100, rounded
    });

    it('should handle empty stories array', () => {
      const progress = calculateSprintProgress([]);

      expect(progress.totalPoints).toBe(0);
      expect(progress.completedPoints).toBe(0);
      expect(progress.completionPercentage).toBe(0);
    });

    it('should handle stories without story points', () => {
      const stories = [
        { status: 'done' },
        { status: 'in-progress', storyPoints: 5 },
      ];

      const progress = calculateSprintProgress(stories);

      expect(progress.totalPoints).toBe(5);
      expect(progress.completedPoints).toBe(0);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor('backlog')).toBe('gray');
      expect(getStatusColor('todo')).toBe('blue');
      expect(getStatusColor('in-progress')).toBe('yellow');
      expect(getStatusColor('review')).toBe('purple');
      expect(getStatusColor('done')).toBe('green');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('gray');
      expect(getStatusColor('')).toBe('gray');
      expect(getStatusColor(null)).toBe('gray');
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct colors for each priority', () => {
      expect(getPriorityColor('high')).toBe('red');
      expect(getPriorityColor('medium')).toBe('yellow');
      expect(getPriorityColor('low')).toBe('green');
    });

    it('should return default color for unknown priority', () => {
      expect(getPriorityColor('unknown')).toBe('gray');
      expect(getPriorityColor('')).toBe('gray');
      expect(getPriorityColor(null)).toBe('gray');
    });
  });

  describe('isValidFibonacci', () => {
    it('should identify valid Fibonacci numbers', () => {
      const validNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55];
      validNumbers.forEach(num => {
        expect(isValidFibonacci(num)).toBe(true);
      });
    });

    it('should reject invalid Fibonacci numbers', () => {
      const invalidNumbers = [0, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16];
      invalidNumbers.forEach(num => {
        expect(isValidFibonacci(num)).toBe(false);
      });
    });
  });

  describe('calculateTeamCapacity', () => {
    it('should calculate team capacity correctly', () => {
      const teamMembers = [
        { name: 'Alice', hoursPerDay: 8, daysAvailable: 10 },
        { name: 'Bob', hoursPerDay: 6, daysAvailable: 8 },
        { name: 'Charlie', hoursPerDay: 8, daysAvailable: 9 },
      ];

      const capacity = calculateTeamCapacity(teamMembers);

      expect(capacity.totalHours).toBe(200); // 80 + 48 + 72
      expect(capacity.totalDays).toBe(25); // 10 + 8 + 9 (in 8-hour days)
      expect(capacity.averageHoursPerDay).toBe(8);
    });

    it('should handle empty team', () => {
      const capacity = calculateTeamCapacity([]);

      expect(capacity.totalHours).toBe(0);
      expect(capacity.totalDays).toBe(0);
      expect(capacity.averageHoursPerDay).toBe(0);
    });
  });

  describe('generateSprintSummary', () => {
    it('should generate comprehensive sprint summary', () => {
      const sprint = {
        id: 'sprint-1',
        number: 1,
        goal: 'Complete user authentication',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        status: 'completed',
      };

      const stories = [
        { status: 'done', storyPoints: 5, priority: 'high' },
        { status: 'done', storyPoints: 8, priority: 'medium' },
        { status: 'in-progress', storyPoints: 3, priority: 'high' },
      ];

      const summary = generateSprintSummary(sprint, stories);

      expect(summary.sprintInfo.number).toBe(1);
      expect(summary.sprintInfo.goal).toBe('Complete user authentication');
      expect(summary.progress.totalStories).toBe(3);
      expect(summary.progress.completedStories).toBe(2);
      expect(summary.progress.totalPoints).toBe(16);
      expect(summary.progress.completedPoints).toBe(13);
      expect(summary.metrics.completionRate).toBe(67); // 2/3 * 100, rounded
      expect(summary.metrics.pointsCompletionRate).toBe(81); // 13/16 * 100, rounded
    });

    it('should handle sprint with no stories', () => {
      const sprint = {
        id: 'sprint-1',
        number: 1,
        goal: 'Empty sprint',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        status: 'planning',
      };

      const summary = generateSprintSummary(sprint, []);

      expect(summary.progress.totalStories).toBe(0);
      expect(summary.progress.completedStories).toBe(0);
      expect(summary.metrics.completionRate).toBe(0);
      expect(summary.metrics.pointsCompletionRate).toBe(0);
    });
  });
});
