// Sprint planning service with algorithms and calculations

const { Sprint, UserStory, BurndownData } = require('../models/agileModels');
const logger = require('../utils/logger');

class SprintPlanningService {
  /**
   * Calculate team velocity based on completed sprints
   * @param {number} sprintCount - Number of recent sprints to consider
   * @returns {Promise<number>} Average velocity
   */
  static async calculateVelocity(sprintCount = 3) {
    try {
      const sprints = await Sprint.findAll();
      const completedSprints = sprints
        .filter(sprint => sprint.status === 'complete')
        .sort((a, b) => b.number - a.number)
        .slice(0, sprintCount);

      if (completedSprints.length === 0) {
        return 0;
      }

      const totalVelocity = completedSprints.reduce(
        (sum, sprint) => sum + sprint.velocity,
        0
      );
      return Math.round(totalVelocity / completedSprints.length);
    } catch (error) {
      logger.error('Error calculating velocity:', error);
      throw error;
    }
  }

  /**
   * Get recommended stories for sprint planning based on capacity and priority
   * @param {number} capacity - Sprint capacity in story points
   * @param {string[]} excludeStoryIds - Story IDs to exclude
   * @returns {Promise<Object>} Recommended stories and allocation info
   */
  static async getRecommendedStories(capacity, excludeStoryIds = []) {
    try {
      const allStories = await UserStory.findAll();

      // Filter available stories (backlog status, not in current sprint)
      const availableStories = allStories
        .filter(
          story =>
            story.status === 'backlog' &&
            !story.sprint_id &&
            !excludeStoryIds.includes(story.id)
        )
        .sort((a, b) => {
          // Sort by priority first, then by story points (smaller first)
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return a.story_points - b.story_points;
        });

      // Use greedy algorithm to select stories that fit within capacity
      const selectedStories = [];
      let remainingCapacity = capacity;
      let totalPoints = 0;

      for (const story of availableStories) {
        if (story.story_points <= remainingCapacity) {
          selectedStories.push(story);
          remainingCapacity -= story.story_points;
          totalPoints += story.story_points;
        }
      }

      // Calculate allocation metrics
      const capacityUtilization =
        capacity > 0 ? (totalPoints / capacity) * 100 : 0;
      const priorityDistribution = {
        high: selectedStories.filter(s => s.priority === 'high').length,
        medium: selectedStories.filter(s => s.priority === 'medium').length,
        low: selectedStories.filter(s => s.priority === 'low').length,
      };

      return {
        recommendedStories: selectedStories,
        totalStoryPoints: totalPoints,
        remainingCapacity,
        capacityUtilization: Math.round(capacityUtilization),
        priorityDistribution,
        alternativeStories: availableStories
          .filter(story => !selectedStories.includes(story))
          .slice(0, 5), // Show top 5 alternatives
      };
    } catch (error) {
      logger.error('Error getting recommended stories:', error);
      throw error;
    }
  }

  /**
   * Validate sprint capacity against team velocity
   * @param {number} capacity - Proposed sprint capacity
   * @param {number} teamSize - Number of team members
   * @returns {Promise<Object>} Validation result with recommendations
   */
  static async validateSprintCapacity(capacity, teamSize = 5) {
    try {
      const averageVelocity = await this.calculateVelocity();
      const velocityPerPerson = teamSize > 0 ? averageVelocity / teamSize : 0;

      const recommendations = [];
      let riskLevel = 'low';

      // Check if capacity is realistic based on historical velocity
      if (averageVelocity > 0) {
        const capacityRatio = capacity / averageVelocity;

        if (capacityRatio > 1.3) {
          riskLevel = 'high';
          recommendations.push(
            `Capacity is ${Math.round((capacityRatio - 1) * 100)}% higher than average velocity`
          );
          recommendations.push(
            `Consider reducing capacity to ${Math.round(averageVelocity * 1.1)} points`
          );
        } else if (capacityRatio > 1.1) {
          riskLevel = 'medium';
          recommendations.push('Capacity is slightly above average velocity');
          recommendations.push('Monitor progress closely during sprint');
        } else if (capacityRatio < 0.8) {
          riskLevel = 'low';
          recommendations.push(
            'Conservative capacity planning - good for team stability'
          );
        }
      }

      // Check capacity per team member
      const capacityPerPerson = teamSize > 0 ? capacity / teamSize : capacity;
      if (capacityPerPerson > 15) {
        recommendations.push(
          'High capacity per team member - ensure realistic expectations'
        );
      } else if (capacityPerPerson < 5) {
        recommendations.push(
          'Low capacity per team member - consider if team is available'
        );
      }

      return {
        isValid: riskLevel !== 'high',
        riskLevel,
        averageVelocity,
        velocityPerPerson: Math.round(velocityPerPerson),
        capacityPerPerson: Math.round(capacityPerPerson),
        recommendations,
      };
    } catch (error) {
      logger.error('Error validating sprint capacity:', error);
      throw error;
    }
  }

  /**
   * Generate burndown chart data for a sprint
   * @param {string} sprintId - Sprint ID
   * @returns {Promise<Object>} Burndown chart data
   */
  static async generateBurndownData(sprintId) {
    try {
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Get all stories in the sprint
      const sprintStories = await UserStory.findAll();
      const stories = sprintStories.filter(
        story => story.sprint_id === sprintId
      );

      const totalPoints = stories.reduce(
        (sum, story) => sum + story.story_points,
        0
      );
      const completedPoints = stories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + story.story_points, 0);

      // Calculate ideal burndown line
      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      const totalDays = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24)
      );
      const workingDays = this.calculateWorkingDays(startDate, endDate);

      const idealBurndown = [];
      const dailyBurnRate = totalPoints / workingDays;

      for (let i = 0; i <= workingDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        idealBurndown.push({
          date: currentDate.toISOString().split('T')[0],
          idealRemaining: Math.max(0, totalPoints - dailyBurnRate * i),
          actualRemaining:
            i === workingDays ? totalPoints - completedPoints : null,
        });
      }

      // Calculate current progress
      const today = new Date();
      const daysElapsed = Math.min(
        workingDays,
        Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)))
      );

      const currentIdealRemaining = Math.max(
        0,
        totalPoints - dailyBurnRate * daysElapsed
      );
      const currentActualRemaining = totalPoints - completedPoints;

      return {
        sprintId,
        totalStoryPoints: totalPoints,
        completedStoryPoints: completedPoints,
        remainingStoryPoints: currentActualRemaining,
        workingDays,
        daysElapsed,
        burndownData: idealBurndown,
        currentProgress: {
          idealRemaining: Math.round(currentIdealRemaining),
          actualRemaining: currentActualRemaining,
          isOnTrack: currentActualRemaining <= currentIdealRemaining * 1.1,
          variance: currentActualRemaining - currentIdealRemaining,
        },
        completionRate:
          totalPoints > 0
            ? Math.round((completedPoints / totalPoints) * 100)
            : 0,
      };
    } catch (error) {
      logger.error('Error generating burndown data:', error);
      throw error;
    }
  }

  /**
   * Allocate stories to sprint with capacity validation
   * @param {string} sprintId - Sprint ID
   * @param {string[]} storyIds - Array of story IDs to allocate
   * @returns {Promise<Object>} Allocation result
   */
  static async allocateStoriesToSprint(sprintId, storyIds) {
    try {
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Get stories to allocate
      const allStories = await UserStory.findAll();
      const storiesToAllocate = allStories.filter(story =>
        storyIds.includes(story.id)
      );

      // Calculate total points
      const totalPoints = storiesToAllocate.reduce(
        (sum, story) => sum + story.story_points,
        0
      );

      // Get current sprint allocation
      const currentSprintStories = allStories.filter(
        story => story.sprint_id === sprintId
      );
      const currentPoints = currentSprintStories.reduce(
        (sum, story) => sum + story.story_points,
        0
      );

      const newTotalPoints = currentPoints + totalPoints;

      // Validate capacity
      if (newTotalPoints > sprint.capacity) {
        return {
          success: false,
          message: 'Stories exceed sprint capacity',
          totalPoints: newTotalPoints,
          capacity: sprint.capacity,
          overflow: newTotalPoints - sprint.capacity,
          suggestedStories: this.suggestStoriesForCapacity(
            storiesToAllocate,
            sprint.capacity - currentPoints
          ),
        };
      }

      // Allocate stories to sprint
      const allocationResults = [];
      for (const story of storiesToAllocate) {
        await UserStory.update(story.id, {
          sprintId,
          status: 'todo', // Move from backlog to todo
        });
        allocationResults.push({
          storyId: story.id,
          title: story.title,
          storyPoints: story.story_points,
          allocated: true,
        });
      }

      return {
        success: true,
        message: 'Stories allocated successfully',
        allocatedStories: allocationResults,
        totalPoints: newTotalPoints,
        capacity: sprint.capacity,
        remainingCapacity: sprint.capacity - newTotalPoints,
        utilizationRate: Math.round((newTotalPoints / sprint.capacity) * 100),
      };
    } catch (error) {
      logger.error('Error allocating stories to sprint:', error);
      throw error;
    }
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Number of working days
   */
  static calculateWorkingDays(startDate, endDate) {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Suggest stories that fit within given capacity
   * @param {Array} stories - Available stories
   * @param {number} capacity - Available capacity
   * @returns {Array} Suggested stories
   */
  static suggestStoriesForCapacity(stories, capacity) {
    const sortedStories = stories.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.story_points - b.story_points;
    });

    const suggested = [];
    let remainingCapacity = capacity;

    for (const story of sortedStories) {
      if (story.story_points <= remainingCapacity) {
        suggested.push(story);
        remainingCapacity -= story.story_points;
      }
    }

    return suggested;
  }

  /**
   * Get sprint planning metrics and insights
   * @param {string} sprintId - Sprint ID
   * @returns {Promise<Object>} Sprint metrics
   */
  static async getSprintMetrics(sprintId) {
    try {
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      const allStories = await UserStory.findAll();
      const sprintStories = allStories.filter(
        story => story.sprint_id === sprintId
      );

      const completedPoints = sprintStories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + story.story_points, 0);

      const metrics = {
        sprintInfo: {
          id: sprint.id,
          number: sprint.number,
          goal: sprint.goal,
          status: sprint.status,
          capacity: sprint.capacity,
          teamSize: sprint.team_size || 5,
          actualVelocity: sprint.actual_velocity || completedPoints,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
        },
        storyMetrics: {
          totalStories: sprintStories.length,
          totalStoryPoints: sprintStories.reduce(
            (sum, story) => sum + story.story_points,
            0
          ),
          completedStoryPoints: completedPoints,
          storiesByStatus: {
            todo: sprintStories.filter(s => s.status === 'todo').length,
            'in-progress': sprintStories.filter(s => s.status === 'in-progress')
              .length,
            review: sprintStories.filter(s => s.status === 'review').length,
            done: sprintStories.filter(s => s.status === 'done').length,
          },
          storiesByPriority: {
            high: sprintStories.filter(s => s.priority === 'high').length,
            medium: sprintStories.filter(s => s.priority === 'medium').length,
            low: sprintStories.filter(s => s.priority === 'low').length,
          },
        },
        capacityMetrics: {
          allocatedPoints: sprintStories.reduce(
            (sum, story) => sum + story.story_points,
            0
          ),
          completedPoints,
          remainingCapacity:
            sprint.capacity -
            sprintStories.reduce((sum, story) => sum + story.story_points, 0),
          utilizationRate: Math.round(
            (sprintStories.reduce((sum, story) => sum + story.story_points, 0) /
              sprint.capacity) *
              100
          ),
          completionRate:
            sprintStories.reduce((sum, story) => sum + story.story_points, 0) >
            0
              ? Math.round(
                  (completedPoints /
                    sprintStories.reduce(
                      (sum, story) => sum + story.story_points,
                      0
                    )) *
                    100
                )
              : 0,
        },
      };

      // Add burndown data if sprint is active or complete
      if (sprint.status === 'active' || sprint.status === 'complete') {
        const burndownData = await this.generateBurndownData(sprintId);
        metrics.burndownData = burndownData;
      }

      return metrics;
    } catch (error) {
      logger.error('Error getting sprint metrics:', error);
      throw error;
    }
  }

  /**
   * Initialize sprint with burndown tracking
   * @param {string} sprintId - Sprint ID
   * @returns {Promise<Object>} Initialization result
   */
  static async initializeSprintTracking(sprintId) {
    try {
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Get total story points for the sprint
      const allStories = await UserStory.findAll();
      const sprintStories = allStories.filter(
        story => story.sprint_id === sprintId
      );
      const totalPoints = sprintStories.reduce(
        (sum, story) => sum + story.story_points,
        0
      );

      // Generate ideal burndown line
      await BurndownData.generateIdealBurndown(
        sprintId,
        totalPoints,
        sprint.start_date,
        sprint.end_date
      );

      // Update sprint status to active if it was planning
      if (sprint.status === 'planning') {
        await Sprint.update(sprintId, { status: 'active' });
      }

      return {
        success: true,
        message: 'Sprint tracking initialized',
        totalStoryPoints: totalPoints,
        sprintDuration: this.calculateWorkingDays(
          new Date(sprint.start_date),
          new Date(sprint.end_date)
        ),
      };
    } catch (error) {
      logger.error('Error initializing sprint tracking:', error);
      throw error;
    }
  }

  /**
   * Update daily burndown progress
   * @param {string} sprintId - Sprint ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Update result
   */
  static async updateDailyProgress(sprintId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get current completed points
      const allStories = await UserStory.findAll();
      const sprintStories = allStories.filter(
        story => story.sprint_id === sprintId
      );
      const totalPoints = sprintStories.reduce(
        (sum, story) => sum + story.story_points,
        0
      );
      const completedPoints = sprintStories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + story.story_points, 0);
      const remainingPoints = totalPoints - completedPoints;

      // Get ideal remaining for this date
      const burndownData = await BurndownData.findBySprintId(sprintId);
      const todayData = burndownData.find(
        data => data.date.toISOString().split('T')[0] === targetDate
      );

      if (todayData) {
        await BurndownData.updateActualRemaining(
          sprintId,
          targetDate,
          remainingPoints,
          completedPoints
        );
      }

      return {
        success: true,
        date: targetDate,
        totalPoints,
        completedPoints,
        remainingPoints,
        idealRemaining: todayData?.ideal_remaining || remainingPoints,
      };
    } catch (error) {
      logger.error('Error updating daily progress:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive sprint planning recommendations
   * @param {number} teamSize - Team size
   * @param {number} sprintDuration - Sprint duration in weeks
   * @returns {Promise<Object>} Planning recommendations
   */
  static async getSprintPlanningRecommendations(
    teamSize = 5,
    sprintDuration = 2
  ) {
    try {
      // Get capacity recommendations
      const capacityRec = await Sprint.getCapacityRecommendations(teamSize);

      // Get velocity history
      const velocityHistory = await Sprint.getVelocityHistory(6);

      // Calculate recommended capacity based on team size and duration
      const baseCapacityPerPerson = 8; // Default story points per person per sprint
      const defaultCapacity =
        teamSize * baseCapacityPerPerson * (sprintDuration / 2);

      const recommendations = {
        capacity: {
          recommended: capacityRec.recommendedCapacity || defaultCapacity,
          confidence: capacityRec.confidence,
          historicalAverage: capacityRec.historicalAverage,
          range: {
            conservative: Math.round(
              (capacityRec.recommendedCapacity || defaultCapacity) * 0.8
            ),
            aggressive: Math.round(
              (capacityRec.recommendedCapacity || defaultCapacity) * 1.2
            ),
          },
        },
        team: {
          size: teamSize,
          capacityPerPerson: Math.round(
            (capacityRec.recommendedCapacity || defaultCapacity) / teamSize
          ),
          sprintDuration,
        },
        velocity: {
          history: velocityHistory,
          trend: this.calculateVelocityTrend(velocityHistory),
          predictedVelocity: capacityRec.historicalAverage || defaultCapacity,
        },
        recommendations: capacityRec.recommendations || [],
      };

      return recommendations;
    } catch (error) {
      logger.error('Error getting sprint planning recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate velocity trend from history
   * @param {Array} velocityHistory - Historical velocity data
   * @returns {string} Trend direction
   */
  static calculateVelocityTrend(velocityHistory) {
    if (velocityHistory.length < 2) {
      return 'insufficient_data';
    }

    const recent = velocityHistory.slice(0, 3);
    const older = velocityHistory.slice(3, 6);

    if (older.length === 0) {
      return 'insufficient_data';
    }

    const recentAvg =
      recent.reduce((sum, v) => sum + v.actual_velocity, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, v) => sum + v.actual_velocity, 0) / older.length;

    const difference = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (difference > 10) {
      return 'improving';
    }
    if (difference < -10) {
      return 'declining';
    }
    return 'stable';
  }
}

module.exports = SprintPlanningService;
