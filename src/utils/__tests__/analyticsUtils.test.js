import {
  calculateVelocityMetrics,
  calculateBurndownAccuracy,
  calculateStoryCompletionRates,
  calculateTeamSatisfactionMetrics,
  calculateQualityMetrics,
  generateActionableInsights,
  calculatePredictiveMetrics,
  formatChartData
} from '../analyticsUtils';

describe('analyticsUtils', () => {
  const mockSprintData = [
    {
      id: 1,
      number: 1,
      velocity: 20,
      plannedPoints: 25,
      completedPoints: 20,
      stories: [
        { status: 'done' },
        { status: 'done' },
        { status: 'in-progress' }
      ],
      bugCount: 3,
      testCoverage: 85,
      codeReviewScore: 8.5,
      technicalDebtHours: 5,
      burndownData: [
        { day: 1, remaining: 25 },
        { day: 10, remaining: 2 }
      ]
    },
    {
      id: 2,
      number: 2,
      velocity: 22,
      plannedPoints: 24,
      completedPoints: 22,
      stories: [
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
        { status: 'done' }
      ],
      bugCount: 2,
      testCoverage: 88,
      codeReviewScore: 9.0,
      technicalDebtHours: 3,
      burndownData: [
        { day: 1, remaining: 24 },
        { day: 10, remaining: 1 }
      ]
    },
    {
      id: 3,
      number: 3,
      velocity: 18,
      plannedPoints: 20,
      completedPoints: 18,
      stories: [
        { status: 'done' },
        { status: 'done' },
        { status: 'todo' }
      ],
      bugCount: 5,
      testCoverage: 82,
      codeReviewScore: 7.5,
      technicalDebtHours: 8,
      burndownData: [
        { day: 1, remaining: 20 },
        { day: 10, remaining: 3 }
      ]
    }
  ];

  const mockRetrospectiveData = [
    {
      sprintId: 1,
      teamMorale: 7,
      velocityRating: 8,
      qualityRating: 7,
      communicationRating: 8,
      whatCouldImprove: ['communication', 'testing'],
      actionItems: [
        { description: 'Improve daily standups', assignee: 'John', priority: 'high' },
        { description: 'Add more unit tests', assignee: 'Jane', priority: 'medium' }
      ]
    },
    {
      sprintId: 2,
      teamMorale: 8,
      velocityRating: 9,
      qualityRating: 8,
      communicationRating: 9,
      whatCouldImprove: ['testing', 'documentation'],
      actionItems: [
        { description: 'Update documentation', assignee: 'Bob', priority: 'low' }
      ]
    },
    {
      sprintId: 3,
      teamMorale: 6,
      velocityRating: 7,
      qualityRating: 6,
      communicationRating: 7,
      whatCouldImprove: ['communication', 'planning'],
      actionItems: [
        { description: 'Better sprint planning', assignee: 'Alice', priority: 'high' },
        { description: 'Team communication workshop', assignee: 'John', priority: 'medium' }
      ]
    }
  ];

  describe('calculateVelocityMetrics', () => {
    it('should calculate velocity metrics correctly', () => {
      const result = calculateVelocityMetrics(mockSprintData);
      
      expect(result.averageVelocity).toBe(20); // (20 + 22 + 18) / 3 = 20
      expect(result.velocityTrend).toBe('decreasing'); // 22 > 18
      expect(result.predictedVelocity).toBeGreaterThanOrEqual(0);
      expect(typeof result.velocityVariance).toBe('number');
    });

    it('should handle empty data', () => {
      const result = calculateVelocityMetrics([]);
      
      expect(result.averageVelocity).toBe(0);
      expect(result.velocityTrend).toBe('stable');
      expect(result.velocityVariance).toBe(0);
      expect(result.predictedVelocity).toBe(0);
    });

    it('should handle null/undefined data', () => {
      const result = calculateVelocityMetrics(null);
      
      expect(result.averageVelocity).toBe(0);
      expect(result.velocityTrend).toBe('stable');
      expect(result.velocityVariance).toBe(0);
      expect(result.predictedVelocity).toBe(0);
    });
  });

  describe('calculateBurndownAccuracy', () => {
    it('should calculate burndown accuracy correctly', () => {
      const result = calculateBurndownAccuracy(mockSprintData);
      
      expect(result.accuracy).toBe(67); // 2 out of 3 sprints are accurate (within 2 points)
      expect(result.accurateCount).toBe(2);
      expect(result.totalSprints).toBe(3);
    });

    it('should handle sprints without burndown data', () => {
      const sprintsWithoutBurndown = [
        { id: 1, number: 1, velocity: 20 },
        { id: 2, number: 2, velocity: 22 }
      ];
      
      const result = calculateBurndownAccuracy(sprintsWithoutBurndown);
      
      expect(result.accuracy).toBe(0);
      expect(result.accurateCount).toBe(0);
      expect(result.totalSprints).toBe(0);
    });
  });

  describe('calculateStoryCompletionRates', () => {
    it('should calculate story completion rates correctly', () => {
      const result = calculateStoryCompletionRates(mockSprintData);
      
      expect(result).toHaveLength(3);
      expect(result[0].completionRate).toBe(67); // 2 out of 3 stories done
      expect(result[1].completionRate).toBe(100); // 4 out of 4 stories done
      expect(result[2].completionRate).toBe(67); // 2 out of 3 stories done
      
      expect(result[0].sprintGoalMet).toBe(false);
      expect(result[1].sprintGoalMet).toBe(true);
      expect(result[2].sprintGoalMet).toBe(false);
    });

    it('should handle sprints without stories', () => {
      const sprintsWithoutStories = [
        { id: 1, number: 1, velocity: 20 }
      ];
      
      const result = calculateStoryCompletionRates(sprintsWithoutStories);
      
      expect(result).toHaveLength(1);
      expect(result[0].completionRate).toBe(0);
      expect(result[0].totalStories).toBe(0);
      expect(result[0].completedStories).toBe(0);
    });
  });

  describe('calculateTeamSatisfactionMetrics', () => {
    it('should calculate team satisfaction metrics correctly', () => {
      const result = calculateTeamSatisfactionMetrics(mockRetrospectiveData);
      
      expect(result.averageMorale).toBe(7); // (7 + 8 + 6) / 3 = 7
      expect(result.averageVelocityRating).toBe(8); // (8 + 9 + 7) / 3 = 8
      expect(result.averageQualityRating).toBe(7); // (7 + 8 + 6) / 3 = 7
      expect(result.averageCommunicationRating).toBe(8); // (8 + 9 + 7) / 3 = 8
      expect(result.overallSatisfaction).toBe(7.5); // (7 + 8 + 7 + 8) / 4 = 7.5
      expect(result.satisfactionTrend).toBe('declining'); // 8.5 > 6.5
    });

    it('should handle empty retrospective data', () => {
      const result = calculateTeamSatisfactionMetrics([]);
      
      expect(result.averageMorale).toBe(0);
      expect(result.averageVelocityRating).toBe(0);
      expect(result.averageQualityRating).toBe(0);
      expect(result.averageCommunicationRating).toBe(0);
      expect(result.overallSatisfaction).toBe(0);
      expect(result.satisfactionTrend).toBe('stable');
    });
  });

  describe('calculateQualityMetrics', () => {
    it('should calculate quality metrics correctly', () => {
      const result = calculateQualityMetrics(mockSprintData);
      
      expect(result.averageBugCount).toBe(3.3); // (3 + 2 + 5) / 3 = 3.33
      expect(result.averageTestCoverage).toBe(85); // (85 + 88 + 82) / 3 = 85
      expect(result.averageCodeReviewScore).toBe(8.3); // (8.5 + 9.0 + 7.5) / 3 = 8.33
      expect(result.averageTechnicalDebt).toBe(5); // (5 + 3 + 8) / 3 = 5.33
      expect(result.qualityTrend).toBe('declining'); // Bug count increased from 2 to 5
      expect(result.technicalDebtTrend).toBe('increasing'); // Debt increased from 3 to 8
    });
  });

  describe('generateActionableInsights', () => {
    it('should generate insights from retrospective data', () => {
      const result = generateActionableInsights(mockRetrospectiveData);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Should identify recurring themes
      const recurringTheme = result.find(insight => insight.type === 'recurring_issue');
      expect(recurringTheme).toBeDefined();
      expect(recurringTheme.title).toContain('communication');
    });

    it('should handle empty retrospective data', () => {
      const result = generateActionableInsights([]);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculatePredictiveMetrics', () => {
    it('should calculate predictive metrics correctly', () => {
      const teamData = { capacity: 80 };
      const result = calculatePredictiveMetrics(mockSprintData, teamData);
      
      expect(result.predictedVelocity).toBeGreaterThanOrEqual(0);
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(result.confidenceLevel).toBeLessThanOrEqual(100);
      expect(result.capacityUtilization).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it('should handle insufficient data', () => {
      const result = calculatePredictiveMetrics([mockSprintData[0]], {});
      
      expect(result.predictedVelocity).toBe(0);
      expect(result.confidenceLevel).toBe(0);
      expect(result.capacityUtilization).toBe(0);
      expect(result.riskFactors).toHaveLength(0);
    });
  });

  describe('formatChartData', () => {
    it('should format velocity chart data correctly', () => {
      const result = formatChartData(mockSprintData, 'velocity');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('sprint', 'Sprint 1');
      expect(result[0]).toHaveProperty('planned', 25);
      expect(result[0]).toHaveProperty('completed', 20);
      expect(result[0]).toHaveProperty('velocity', 20);
    });

    it('should format completion chart data correctly', () => {
      const result = formatChartData(mockSprintData, 'completion');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('sprint', 'Sprint 1');
      expect(result[0]).toHaveProperty('completionRate', 67);
      expect(result[0]).toHaveProperty('totalStories', 3);
      expect(result[0]).toHaveProperty('completedStories', 2);
    });

    it('should format quality chart data correctly', () => {
      const result = formatChartData(mockSprintData, 'quality');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('sprint', 'Sprint 1');
      expect(result[0]).toHaveProperty('bugCount', 3);
      expect(result[0]).toHaveProperty('testCoverage', 85);
      expect(result[0]).toHaveProperty('codeReviewScore', 8.5);
    });

    it('should handle unknown metric type', () => {
      const result = formatChartData(mockSprintData, 'unknown');
      
      expect(result).toHaveLength(0);
    });

    it('should handle empty data', () => {
      const result = formatChartData([], 'velocity');
      
      expect(result).toHaveLength(0);
    });
  });
});