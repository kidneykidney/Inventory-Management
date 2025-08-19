import {
  calculateVelocityTrend,
  calculateSprintProgress,
  calculateTeamCapacity,
  calculateBurndownData,
  calculateBurnupData,
  calculateWorkingDays,
  addWorkingDays,
  generateProgressMetrics
} from '../progressTrackingUtils';

describe('Progress Tracking Utils', () => {
  describe('calculateVelocityTrend', () => {
    it('should return default values for empty or insufficient data', () => {
      const result = calculateVelocityTrend([]);
      expect(result).toEqual({
        current: 0,
        average: 0,
        trend: 'stable',
        change: 0,
        confidence: 'low'
      });
    });

    it('should calculate velocity trend correctly', () => {
      const sprints = [
        { status: 'complete', completedPoints: 20 },
        { status: 'complete', completedPoints: 25 },
        { status: 'complete', completedPoints: 30 },
        { status: 'complete', completedPoints: 35 }
      ];

      const result = calculateVelocityTrend(sprints);
      
      expect(result.current).toBe(35);
      expect(result.average).toBe(28); // (20+25+30+35)/4 = 27.5, rounded to 28
      expect(result.trend).toBe('increasing');
      expect(result.change).toBeGreaterThan(0);
      expect(result.confidence).toBe('medium');
    });

    it('should handle decreasing velocity trend', () => {
      const sprints = [
        { status: 'complete', completedPoints: 35 },
        { status: 'complete', completedPoints: 30 },
        { status: 'complete', completedPoints: 25 },
        { status: 'complete', completedPoints: 20 }
      ];

      const result = calculateVelocityTrend(sprints);
      
      expect(result.current).toBe(20);
      expect(result.trend).toBe('decreasing');
      expect(result.change).toBeLessThan(0);
    });

    it('should filter out incomplete sprints', () => {
      const sprints = [
        { status: 'complete', completedPoints: 20 },
        { status: 'active', completedPoints: 15 },
        { status: 'complete', completedPoints: 25 }
      ];

      const result = calculateVelocityTrend(sprints);
      
      expect(result.current).toBe(25);
      expect(result.average).toBe(23); // (20+25)/2 = 22.5, rounded to 23
    });
  });

  describe('calculateSprintProgress', () => {
    const mockSprint = {
      startDate: '2024-01-01',
      endDate: '2024-01-14'
    };

    const mockStories = [
      { status: 'done', story_points: 5 },
      { status: 'done', story_points: 8 },
      { status: 'in-progress', story_points: 3 },
      { status: 'todo', story_points: 4 }
    ];

    it('should calculate sprint progress correctly', () => {
      const result = calculateSprintProgress(mockSprint, mockStories);
      
      expect(result.totalStories).toBe(4);
      expect(result.completedStories).toBe(2);
      expect(result.totalPoints).toBe(20);
      expect(result.completedPoints).toBe(13);
      expect(result.pointsRemaining).toBe(7);
      expect(result.completionRate).toBe(65); // 13/20 * 100 = 65%
    });

    it('should handle empty data gracefully', () => {
      const result = calculateSprintProgress(null, []);
      
      expect(result.completionRate).toBe(0);
      expect(result.totalStories).toBe(0);
      expect(result.onTrack).toBe(false);
    });

    it('should calculate days remaining correctly', () => {
      const futureSprint = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      };

      const result = calculateSprintProgress(futureSprint, mockStories);
      
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThanOrEqual(7);
    });
  });

  describe('calculateTeamCapacity', () => {
    const mockTeamMembers = [
      { capacity: 40, allocated: 35 }, // 87.5% utilization
      { capacity: 40, allocated: 45 }, // 112.5% utilization (over-allocated)
      { capacity: 40, allocated: 25 }  // 62.5% utilization (under-utilized)
    ];

    it('should calculate team capacity correctly', () => {
      const result = calculateTeamCapacity(mockTeamMembers);
      
      expect(result.totalCapacity).toBe(120);
      expect(result.totalAllocated).toBe(105);
      expect(result.utilizationRate).toBe(88); // 105/120 * 100 = 87.5%, rounded to 88
      expect(result.availableCapacity).toBe(15);
      expect(result.overAllocatedMembers).toBe(1);
      expect(result.optimallyUtilizedMembers).toBe(1);
      expect(result.underUtilizedMembers).toBe(1);
      expect(result.activeMembers).toBe(3);
    });

    it('should handle empty team data', () => {
      const result = calculateTeamCapacity([]);
      
      expect(result.totalCapacity).toBe(0);
      expect(result.utilizationRate).toBe(0);
      expect(result.activeMembers).toBe(0);
    });

    it('should handle over-allocation correctly', () => {
      const overAllocatedTeam = [
        { capacity: 40, allocated: 50 }
      ];

      const result = calculateTeamCapacity(overAllocatedTeam);
      
      expect(result.utilizationRate).toBe(125);
      expect(result.availableCapacity).toBe(0);
      expect(result.overAllocatedMembers).toBe(1);
    });
  });

  describe('calculateWorkingDays', () => {
    it('should calculate working days correctly excluding weekends', () => {
      // Monday to Friday (5 working days)
      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-05');   // Friday
      
      const result = calculateWorkingDays(startDate, endDate);
      expect(result).toBe(5);
    });

    it('should exclude weekends from calculation', () => {
      // Monday to Sunday (5 working days, excluding Saturday and Sunday)
      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-07');   // Sunday
      
      const result = calculateWorkingDays(startDate, endDate);
      expect(result).toBe(5);
    });

    it('should handle same day calculation', () => {
      const date = new Date('2024-01-01'); // Monday
      
      const result = calculateWorkingDays(date, date);
      expect(result).toBe(1);
    });
  });

  describe('addWorkingDays', () => {
    it('should add working days correctly', () => {
      const startDate = new Date('2024-01-01'); // Monday
      const result = addWorkingDays(startDate, 4); // Add 4 working days from Monday
      
      // Should be Friday of the same week
      expect(result.getDay()).toBe(5); // Friday
    });

    it('should skip weekends when adding working days', () => {
      const startDate = new Date('2024-01-05'); // Friday
      const result = addWorkingDays(startDate, 1);
      
      // Should be Monday of next week
      expect(result.getDay()).toBe(1); // Monday
    });
  });

  describe('calculateBurndownData', () => {
    const mockSprint = {
      startDate: '2024-01-01',
      endDate: '2024-01-10'
    };

    const mockStories = [
      { status: 'done', story_points: 10 },
      { status: 'in-progress', story_points: 5 },
      { status: 'todo', story_points: 5 }
    ];

    it('should calculate burndown data correctly', () => {
      const result = calculateBurndownData(mockSprint, mockStories, []);
      
      expect(result.totalStoryPoints).toBe(20);
      expect(result.completedStoryPoints).toBe(10);
      expect(result.remainingStoryPoints).toBe(10);
      expect(result.completionRate).toBe(50);
      expect(result.burndownData).toBeInstanceOf(Array);
      expect(result.burndownData.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', () => {
      const result = calculateBurndownData(null, [], []);
      
      expect(result.totalStoryPoints).toBe(0);
      expect(result.burndownData).toEqual([]);
    });

    it('should generate ideal burndown line', () => {
      const result = calculateBurndownData(mockSprint, mockStories, []);
      
      // First data point should have maximum ideal remaining
      expect(result.burndownData[0].idealRemaining).toBe(20);
      
      // Last data point should have zero ideal remaining
      const lastPoint = result.burndownData[result.burndownData.length - 1];
      expect(lastPoint.idealRemaining).toBe(0);
    });
  });

  describe('calculateBurnupData', () => {
    const mockSprint = {
      startDate: '2024-01-01',
      endDate: '2024-01-10'
    };

    const mockStories = [
      { status: 'done', story_points: 10 },
      { status: 'in-progress', story_points: 5 },
      { status: 'todo', story_points: 5 }
    ];

    it('should calculate burnup data correctly', () => {
      const result = calculateBurnupData(mockSprint, mockStories, []);
      
      expect(result.burnupData).toBeInstanceOf(Array);
      expect(result.burnupData.length).toBeGreaterThan(0);
      expect(result.scopeChange).toBe(0);
      expect(typeof result.isOnTrack).toBe('boolean');
      expect(typeof result.projectionAccuracy).toBe('number');
    });

    it('should handle scope changes correctly', () => {
      const scopeChanges = [
        { points: 5 },
        { points: -2 }
      ];

      const result = calculateBurnupData(mockSprint, mockStories, scopeChanges);
      
      expect(result.scopeChange).toBe(3); // 5 + (-2) = 3
    });

    it('should calculate projection accuracy', () => {
      const result = calculateBurnupData(mockSprint, mockStories, []);
      
      // With 10 completed out of 20 total points
      expect(result.projectionAccuracy).toBe(50);
    });
  });

  describe('generateProgressMetrics', () => {
    const mockSprint = {
      startDate: '2024-01-01',
      endDate: '2024-01-14'
    };

    const mockStories = [
      { status: 'done', story_points: 10 },
      { status: 'in-progress', story_points: 5 }
    ];

    const mockTeamMembers = [
      { capacity: 40, allocated: 35 }
    ];

    const mockHistoricalSprints = [
      { status: 'complete', completedPoints: 20 },
      { status: 'complete', completedPoints: 25 }
    ];

    it('should generate comprehensive progress metrics', () => {
      const result = generateProgressMetrics(
        mockSprint,
        mockStories,
        mockTeamMembers,
        mockHistoricalSprints
      );
      
      expect(result).toHaveProperty('velocityTrend');
      expect(result).toHaveProperty('sprintProgress');
      expect(result).toHaveProperty('teamUtilization');
      expect(result).toHaveProperty('qualityMetrics');
      expect(result).toHaveProperty('riskIndicators');
      expect(result).toHaveProperty('predictiveAnalytics');
      
      expect(result.velocityTrend).toHaveProperty('current');
      expect(result.sprintProgress).toHaveProperty('completionRate');
      expect(result.teamUtilization).toHaveProperty('utilizationRate');
      expect(result.qualityMetrics).toHaveProperty('score');
      expect(Array.isArray(result.riskIndicators)).toBe(true);
      expect(result.predictiveAnalytics).toHaveProperty('completionForecast');
    });

    it('should identify risk indicators correctly', () => {
      const riskySprint = {
        startDate: '2024-01-01',
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 days from now
      };

      const lowProgressStories = [
        { status: 'todo', story_points: 10 },
        { status: 'todo', story_points: 10 }
      ];

      const result = generateProgressMetrics(
        riskySprint,
        lowProgressStories,
        mockTeamMembers,
        mockHistoricalSprints
      );
      
      expect(result.riskIndicators.length).toBeGreaterThan(0);
      expect(result.riskIndicators.some(risk => risk.level === 'high')).toBe(true);
    });

    it('should generate predictive analytics', () => {
      const result = generateProgressMetrics(
        mockSprint,
        mockStories,
        mockTeamMembers,
        mockHistoricalSprints
      );
      
      expect(['On Time', 'Delayed']).toContain(result.predictiveAnalytics.completionForecast);
      expect(['low', 'medium', 'high']).toContain(result.predictiveAnalytics.confidence);
      expect(typeof result.predictiveAnalytics.recommendation).toBe('string');
    });
  });
});