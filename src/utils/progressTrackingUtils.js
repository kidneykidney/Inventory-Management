/**
 * Progress Tracking Utilities
 * Utility functions for calculating progress metrics, velocity trends, and capacity planning
 */

/**
 * Calculate velocity trend from sprint data
 * @param {Array} sprints - Array of sprint data
 * @returns {Object} - Velocity trend analysis
 */
export const calculateVelocityTrend = (sprints) => {
  if (!sprints || sprints.length < 2) {
    return {
      current: 0,
      average: 0,
      trend: 'stable',
      change: 0,
      confidence: 'low'
    };
  }

  const velocities = sprints
    .filter(sprint => sprint.status === 'complete' && sprint.completedPoints)
    .map(sprint => sprint.completedPoints)
    .slice(-6); // Last 6 sprints for trend analysis

  if (velocities.length === 0) {
    return {
      current: 0,
      average: 0,
      trend: 'stable',
      change: 0,
      confidence: 'low'
    };
  }

  const current = velocities[velocities.length - 1];
  const average = Math.round(velocities.reduce((sum, v) => sum + v, 0) / velocities.length);

  // Calculate trend over last 3 sprints vs previous 3
  let trend = 'stable';
  let change = 0;
  let confidence = 'medium';

  if (velocities.length >= 4) {
    const recent = velocities.slice(-2);
    const previous = velocities.slice(-4, -2);
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const previousAvg = previous.reduce((sum, v) => sum + v, 0) / previous.length;
    
    change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    if (Math.abs(change) > 10) {
      trend = change > 0 ? 'increasing' : 'decreasing';
      confidence = velocities.length >= 6 ? 'high' : 'medium';
    }
  }

  return {
    current,
    average,
    trend,
    change: Math.round(change),
    confidence,
    dataPoints: velocities.length
  };
};

/**
 * Calculate sprint progress metrics
 * @param {Object} sprint - Sprint data
 * @param {Array} stories - Array of story data
 * @returns {Object} - Sprint progress analysis
 */
export const calculateSprintProgress = (sprint, stories) => {
  if (!sprint || !stories) {
    return {
      completionRate: 0,
      completedStories: 0,
      totalStories: 0,
      completedPoints: 0,
      totalPoints: 0,
      pointsRemaining: 0,
      daysRemaining: 0,
      onTrack: false,
      velocity: 0
    };
  }

  const totalStories = stories.length;
  const completedStories = stories.filter(story => story.status === 'done').length;
  const totalPoints = stories.reduce((sum, story) => sum + (story.story_points || 0), 0);
  const completedPoints = stories
    .filter(story => story.status === 'done')
    .reduce((sum, story) => sum + (story.story_points || 0), 0);

  const completionRate = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;
  const pointsRemaining = totalPoints - completedPoints;

  // Calculate days remaining
  const endDate = new Date(sprint.endDate);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

  // Calculate if sprint is on track
  const sprintDuration = Math.ceil(
    (new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = sprintDuration - daysRemaining;
  const expectedProgress = sprintDuration > 0 ? (daysElapsed / sprintDuration) * 100 : 0;
  const onTrack = completionRate >= expectedProgress * 0.8; // 80% of expected progress

  // Calculate current velocity
  const velocity = daysElapsed > 0 ? Math.round(completedPoints / daysElapsed * sprintDuration) : 0;

  return {
    completionRate: Math.round(completionRate),
    completedStories,
    totalStories,
    completedPoints,
    totalPoints,
    pointsRemaining,
    daysRemaining,
    onTrack,
    velocity,
    expectedProgress: Math.round(expectedProgress)
  };
};

/**
 * Calculate team capacity utilization
 * @param {Array} teamMembers - Array of team member data
 * @returns {Object} - Team capacity analysis
 */
export const calculateTeamCapacity = (teamMembers) => {
  if (!teamMembers || teamMembers.length === 0) {
    return {
      totalCapacity: 0,
      totalAllocated: 0,
      utilizationRate: 0,
      availableCapacity: 0,
      overAllocatedMembers: 0,
      optimallyUtilizedMembers: 0,
      underUtilizedMembers: 0,
      activeMembers: 0
    };
  }

  const totalCapacity = teamMembers.reduce((sum, member) => sum + (member.capacity || 0), 0);
  const totalAllocated = teamMembers.reduce((sum, member) => sum + (member.allocated || 0), 0);
  const utilizationRate = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;
  const availableCapacity = Math.max(0, totalCapacity - totalAllocated);

  // Categorize team members by utilization
  let overAllocatedMembers = 0;
  let optimallyUtilizedMembers = 0;
  let underUtilizedMembers = 0;

  teamMembers.forEach(member => {
    const memberUtilization = member.capacity > 0 ? (member.allocated / member.capacity) * 100 : 0;
    if (memberUtilization > 100) {
      overAllocatedMembers++;
    } else if (memberUtilization >= 85) {
      optimallyUtilizedMembers++;
    } else {
      underUtilizedMembers++;
    }
  });

  return {
    totalCapacity,
    totalAllocated,
    utilizationRate: Math.round(utilizationRate),
    availableCapacity,
    overAllocatedMembers,
    optimallyUtilizedMembers,
    underUtilizedMembers,
    activeMembers: teamMembers.length
  };
};

/**
 * Calculate burndown data points
 * @param {Object} sprint - Sprint data
 * @param {Array} stories - Array of story data
 * @param {Array} dailyProgress - Array of daily progress data
 * @returns {Object} - Burndown chart data
 */
export const calculateBurndownData = (sprint, stories, dailyProgress) => {
  if (!sprint || !stories) {
    return {
      burndownData: [],
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      remainingStoryPoints: 0,
      completionRate: 0,
      daysElapsed: 0,
      workingDays: 0,
      currentProgress: null
    };
  }

  const totalStoryPoints = stories.reduce((sum, story) => sum + (story.story_points || 0), 0);
  const completedStoryPoints = stories
    .filter(story => story.status === 'done')
    .reduce((sum, story) => sum + (story.story_points || 0), 0);
  const remainingStoryPoints = totalStoryPoints - completedStoryPoints;
  const completionRate = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

  // Calculate working days
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const today = new Date();
  
  const workingDays = calculateWorkingDays(startDate, endDate);
  const daysElapsed = calculateWorkingDays(startDate, Math.min(today, endDate));

  // Generate burndown data points
  const burndownData = [];
  
  if (dailyProgress && dailyProgress.length > 0) {
    // Use actual daily progress data
    dailyProgress.forEach((day, index) => {
      const idealRemaining = totalStoryPoints - (totalStoryPoints / workingDays) * (index + 1);
      burndownData.push({
        date: day.date,
        idealRemaining: Math.max(0, Math.round(idealRemaining)),
        actualRemaining: day.remainingPoints || 0
      });
    });
  } else {
    // Generate ideal burndown line
    for (let day = 0; day <= workingDays; day++) {
      const date = addWorkingDays(startDate, day);
      const idealRemaining = totalStoryPoints - (totalStoryPoints / workingDays) * day;
      const actualRemaining = day <= daysElapsed ? remainingStoryPoints : null;
      
      burndownData.push({
        date: date.toISOString().split('T')[0],
        idealRemaining: Math.max(0, Math.round(idealRemaining)),
        actualRemaining: actualRemaining
      });
    }
  }

  // Calculate current progress variance
  const currentProgress = daysElapsed > 0 ? {
    idealRemaining: Math.round(totalStoryPoints - (totalStoryPoints / workingDays) * daysElapsed),
    actualRemaining: remainingStoryPoints,
    variance: remainingStoryPoints - (totalStoryPoints - (totalStoryPoints / workingDays) * daysElapsed),
    isOnTrack: Math.abs(remainingStoryPoints - (totalStoryPoints - (totalStoryPoints / workingDays) * daysElapsed)) <= totalStoryPoints * 0.1
  } : null;

  return {
    burndownData,
    totalStoryPoints,
    completedStoryPoints,
    remainingStoryPoints,
    completionRate,
    daysElapsed,
    workingDays,
    currentProgress
  };
};

/**
 * Calculate burnup data points
 * @param {Object} sprint - Sprint data
 * @param {Array} stories - Array of story data
 * @param {Array} scopeChanges - Array of scope change data
 * @returns {Object} - Burnup chart data
 */
export const calculateBurnupData = (sprint, stories, scopeChanges) => {
  if (!sprint || !stories) {
    return {
      burnupData: [],
      scopeChange: 0,
      isOnTrack: false,
      projectionAccuracy: 0
    };
  }

  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const workingDays = calculateWorkingDays(startDate, endDate);
  
  const initialScope = stories.reduce((sum, story) => sum + (story.story_points || 0), 0);
  let currentScope = initialScope;
  
  // Calculate scope changes
  if (scopeChanges && scopeChanges.length > 0) {
    const totalScopeChange = scopeChanges.reduce((sum, change) => sum + change.points, 0);
    currentScope = initialScope + totalScopeChange;
  }

  const scopeChange = currentScope - initialScope;
  const completedPoints = stories
    .filter(story => story.status === 'done')
    .reduce((sum, story) => sum + (story.story_points || 0), 0);

  // Generate burnup data points
  const burnupData = [];
  for (let day = 0; day <= workingDays; day++) {
    const date = addWorkingDays(startDate, day);
    const today = new Date();
    
    if (date <= today) {
      // Historical data
      const dayCompletedPoints = Math.min(completedPoints, (completedPoints / workingDays) * day);
      burnupData.push({
        date: date.toISOString().split('T')[0],
        totalScope: currentScope,
        completedWork: Math.round(dayCompletedPoints),
        projectedCompletion: null
      });
    } else {
      // Projected data
      const projectedCompletion = completedPoints + ((currentScope - completedPoints) / (workingDays - day + 1));
      burnupData.push({
        date: date.toISOString().split('T')[0],
        totalScope: currentScope,
        completedWork: null,
        projectedCompletion: Math.round(Math.min(projectedCompletion, currentScope))
      });
    }
  }

  const isOnTrack = completedPoints >= (currentScope * 0.7); // 70% completion threshold
  const projectionAccuracy = currentScope > 0 ? (completedPoints / currentScope) * 100 : 0;

  return {
    burnupData,
    scopeChange,
    isOnTrack,
    projectionAccuracy: Math.round(projectionAccuracy)
  };
};

/**
 * Calculate working days between two dates (excluding weekends)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of working days
 */
export const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Add working days to a date (excluding weekends)
 * @param {Date} startDate - Start date
 * @param {number} days - Number of working days to add
 * @returns {Date} - Resulting date
 */
export const addWorkingDays = (startDate, days) => {
  const result = new Date(startDate);
  let addedDays = 0;
  
  // If days is 0, return the start date
  if (days === 0) {
    return result;
  }
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      addedDays++;
    }
  }
  
  return result;
};

/**
 * Generate progress metrics for dashboard
 * @param {Object} sprint - Current sprint data
 * @param {Array} stories - Sprint stories
 * @param {Array} teamMembers - Team members data
 * @param {Array} historicalSprints - Historical sprint data
 * @returns {Object} - Comprehensive progress metrics
 */
export const generateProgressMetrics = (sprint, stories, teamMembers, historicalSprints) => {
  const velocityTrend = calculateVelocityTrend(historicalSprints);
  const sprintProgress = calculateSprintProgress(sprint, stories);
  const teamUtilization = calculateTeamCapacity(teamMembers);
  
  // Calculate quality metrics (placeholder - would integrate with actual quality tools)
  const qualityMetrics = {
    score: 8.5, // Out of 10
    testsPass: 95, // Percentage
    codeCoverage: 85, // Percentage
    technicalDebt: 'Low' // Low, Medium, High
  };

  // Identify risk indicators
  const riskIndicators = [];
  
  if (sprintProgress.completionRate < 50 && sprintProgress.daysRemaining < 3) {
    riskIndicators.push({
      level: 'high',
      description: 'Sprint completion at risk - low progress with few days remaining'
    });
  }
  
  if (teamUtilization.overAllocatedMembers > 0) {
    riskIndicators.push({
      level: 'medium',
      description: `${teamUtilization.overAllocatedMembers} team member(s) over-allocated`
    });
  }
  
  if (velocityTrend.trend === 'decreasing' && Math.abs(velocityTrend.change) > 20) {
    riskIndicators.push({
      level: 'medium',
      description: 'Team velocity declining significantly'
    });
  }

  // Generate predictive analytics
  const predictiveAnalytics = {
    completionForecast: sprintProgress.onTrack ? 'On Time' : 'Delayed',
    confidence: velocityTrend.confidence,
    recommendation: sprintProgress.onTrack 
      ? 'Continue current pace' 
      : 'Consider scope adjustment or timeline extension'
  };

  return {
    velocityTrend,
    sprintProgress,
    teamUtilization,
    qualityMetrics,
    riskIndicators,
    predictiveAnalytics
  };
};