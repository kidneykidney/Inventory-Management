/**
 * Analytics utility functions for sprint retrospectives and team performance calculations
 */

/**
 * Calculate team velocity metrics
 * @param {Array} sprintData - Array of sprint objects
 * @returns {Object} Velocity metrics
 */
export const calculateVelocityMetrics = sprintData => {
  if (!sprintData || sprintData.length === 0) {
    return {
      averageVelocity: 0,
      velocityTrend: 'stable',
      velocityVariance: 0,
      predictedVelocity: 0,
    };
  }

  const velocities = sprintData.map(sprint => sprint.velocity || 0);
  const averageVelocity =
    velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

  // Calculate variance
  const velocityVariance =
    velocities.reduce((sum, v) => sum + Math.pow(v - averageVelocity, 2), 0) /
    velocities.length;

  // Calculate trend
  const recentVelocities = velocities.slice(-3);
  let velocityTrend = 'stable';
  if (recentVelocities.length >= 2) {
    const firstHalf = recentVelocities.slice(
      0,
      Math.ceil(recentVelocities.length / 2)
    );
    const secondHalf = recentVelocities.slice(
      Math.ceil(recentVelocities.length / 2)
    );
    const firstAvg =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) velocityTrend = 'increasing';
    else if (secondAvg < firstAvg * 0.9) velocityTrend = 'decreasing';
  }

  // Predict next sprint velocity using linear regression
  const predictedVelocity = calculateLinearRegressionPrediction(velocities);

  return {
    averageVelocity: Math.round(averageVelocity * 10) / 10,
    velocityTrend,
    velocityVariance: Math.round(velocityVariance * 10) / 10,
    predictedVelocity: Math.max(0, Math.round(predictedVelocity)),
  };
};

/**
 * Calculate burndown accuracy for sprints
 * @param {Array} sprintData - Array of sprint objects with burndown data
 * @returns {Object} Burndown accuracy metrics
 */
export const calculateBurndownAccuracy = sprintData => {
  if (!sprintData || sprintData.length === 0)
    return { accuracy: 0, accurateCount: 0 };

  let accurateCount = 0;
  let totalSprints = 0;

  sprintData.forEach(sprint => {
    if (sprint.burndownData && sprint.burndownData.length > 0) {
      totalSprints++;
      const finalDay = sprint.burndownData[sprint.burndownData.length - 1];
      // Consider accurate if within 2 story points of target
      if (finalDay && Math.abs(finalDay.remaining || 0) <= 2) {
        accurateCount++;
      }
    }
  });

  const accuracy = totalSprints > 0 ? (accurateCount / totalSprints) * 100 : 0;

  return {
    accuracy: Math.round(accuracy),
    accurateCount,
    totalSprints,
  };
};

/**
 * Calculate story completion rates
 * @param {Array} sprintData - Array of sprint objects
 * @returns {Array} Completion rate data for each sprint
 */
export const calculateStoryCompletionRates = sprintData => {
  if (!sprintData || sprintData.length === 0) return [];

  return sprintData.map(sprint => {
    const totalStories = sprint.stories ? sprint.stories.length : 0;
    const completedStories = sprint.stories
      ? sprint.stories.filter(story => story.status === 'done').length
      : 0;

    const completionRate =
      totalStories > 0 ? (completedStories / totalStories) * 100 : 0;

    return {
      sprintNumber: sprint.number,
      totalStories,
      completedStories,
      completionRate: Math.round(completionRate),
      sprintGoalMet: completionRate >= 80,
    };
  });
};

/**
 * Calculate team satisfaction metrics from retrospective data
 * @param {Array} retrospectiveData - Array of retrospective objects
 * @returns {Object} Team satisfaction metrics
 */
export const calculateTeamSatisfactionMetrics = retrospectiveData => {
  if (!retrospectiveData || retrospectiveData.length === 0) {
    return {
      averageMorale: 0,
      averageVelocityRating: 0,
      averageQualityRating: 0,
      averageCommunicationRating: 0,
      overallSatisfaction: 0,
      satisfactionTrend: 'stable',
    };
  }

  const metrics = retrospectiveData.reduce(
    (acc, retro) => {
      acc.morale += retro.teamMorale || 0;
      acc.velocity += retro.velocityRating || 0;
      acc.quality += retro.qualityRating || 0;
      acc.communication += retro.communicationRating || 0;
      return acc;
    },
    { morale: 0, velocity: 0, quality: 0, communication: 0 }
  );

  const count = retrospectiveData.length;
  const averageMorale = metrics.morale / count;
  const averageVelocityRating = metrics.velocity / count;
  const averageQualityRating = metrics.quality / count;
  const averageCommunicationRating = metrics.communication / count;
  const overallSatisfaction =
    (averageMorale +
      averageVelocityRating +
      averageQualityRating +
      averageCommunicationRating) /
    4;

  // Calculate satisfaction trend
  let satisfactionTrend = 'stable';
  if (retrospectiveData.length >= 3) {
    const recentScores = retrospectiveData
      .slice(-3)
      .map(
        retro =>
          (retro.teamMorale +
            retro.velocityRating +
            retro.qualityRating +
            retro.communicationRating) /
          4
      );
    const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.ceil(recentScores.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.5) satisfactionTrend = 'improving';
    else if (secondAvg < firstAvg - 0.5) satisfactionTrend = 'declining';
  }

  return {
    averageMorale: Math.round(averageMorale * 10) / 10,
    averageVelocityRating: Math.round(averageVelocityRating * 10) / 10,
    averageQualityRating: Math.round(averageQualityRating * 10) / 10,
    averageCommunicationRating:
      Math.round(averageCommunicationRating * 10) / 10,
    overallSatisfaction: Math.round(overallSatisfaction * 10) / 10,
    satisfactionTrend,
  };
};

/**
 * Calculate quality metrics from sprint data
 * @param {Array} sprintData - Array of sprint objects
 * @returns {Object} Quality metrics
 */
export const calculateQualityMetrics = sprintData => {
  if (!sprintData || sprintData.length === 0) {
    return {
      averageBugCount: 0,
      averageTestCoverage: 0,
      averageCodeReviewScore: 0,
      qualityTrend: 'stable',
      technicalDebtTrend: 'stable',
    };
  }

  const metrics = sprintData.reduce(
    (acc, sprint) => {
      acc.bugCount += sprint.bugCount || 0;
      acc.testCoverage += sprint.testCoverage || 0;
      acc.codeReviewScore += sprint.codeReviewScore || 0;
      acc.technicalDebt += sprint.technicalDebtHours || 0;
      return acc;
    },
    { bugCount: 0, testCoverage: 0, codeReviewScore: 0, technicalDebt: 0 }
  );

  const count = sprintData.length;
  const averageBugCount = metrics.bugCount / count;
  const averageTestCoverage = metrics.testCoverage / count;
  const averageCodeReviewScore = metrics.codeReviewScore / count;
  const averageTechnicalDebt = metrics.technicalDebt / count;

  // Calculate quality trend (lower bugs = better quality)
  let qualityTrend = 'stable';
  if (sprintData.length >= 3) {
    const recentBugs = sprintData.slice(-3).map(s => s.bugCount || 0);
    const firstHalf = recentBugs.slice(0, Math.ceil(recentBugs.length / 2));
    const secondHalf = recentBugs.slice(Math.ceil(recentBugs.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, b) => sum + b, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, b) => sum + b, 0) / secondHalf.length;

    if (secondAvg < firstAvg * 0.8) qualityTrend = 'improving';
    else if (secondAvg > firstAvg * 1.2) qualityTrend = 'declining';
  }

  // Calculate technical debt trend
  let technicalDebtTrend = 'stable';
  if (sprintData.length >= 3) {
    const recentDebt = sprintData.slice(-3).map(s => s.technicalDebtHours || 0);
    const firstHalf = recentDebt.slice(0, Math.ceil(recentDebt.length / 2));
    const secondHalf = recentDebt.slice(Math.ceil(recentDebt.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length;

    if (secondAvg < firstAvg * 0.8) technicalDebtTrend = 'improving';
    else if (secondAvg > firstAvg * 1.2) technicalDebtTrend = 'increasing';
  }

  return {
    averageBugCount: Math.round(averageBugCount * 10) / 10,
    averageTestCoverage: Math.round(averageTestCoverage),
    averageCodeReviewScore: Math.round(averageCodeReviewScore * 10) / 10,
    averageTechnicalDebt: Math.round(averageTechnicalDebt),
    qualityTrend,
    technicalDebtTrend,
  };
};

/**
 * Generate actionable insights from retrospective data
 * @param {Array} retrospectiveData - Array of retrospective objects
 * @returns {Array} Array of insights
 */
export const generateActionableInsights = retrospectiveData => {
  if (!retrospectiveData || retrospectiveData.length === 0) return [];

  const insights = [];
  const recentRetros = retrospectiveData.slice(-3);

  // Analyze recurring themes in "what could improve"
  const improvementThemes = {};
  recentRetros.forEach(retro => {
    if (retro.whatCouldImprove) {
      retro.whatCouldImprove.forEach(item => {
        const keywords = extractKeywords(item.toLowerCase());
        keywords.forEach(keyword => {
          improvementThemes[keyword] = (improvementThemes[keyword] || 0) + 1;
        });
      });
    }
  });

  // Find most common improvement themes
  const topThemes = Object.entries(improvementThemes)
    .filter(([_, count]) => count >= 2)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3);

  topThemes.forEach(([theme, count]) => {
    insights.push({
      type: 'recurring_issue',
      priority: count >= 3 ? 'high' : 'medium',
      title: `Recurring Theme: ${theme}`,
      description: `"${theme}" has been mentioned in ${count} recent retrospectives`,
      recommendation: `Consider creating an action item to address ${theme} systematically`,
    });
  });

  // Analyze action item completion
  const totalActionItems = recentRetros.reduce(
    (sum, retro) => sum + (retro.actionItems ? retro.actionItems.length : 0),
    0
  );

  if (totalActionItems > recentRetros.length * 3) {
    insights.push({
      type: 'action_item_overload',
      priority: 'medium',
      title: 'Too Many Action Items',
      description: `Average of ${Math.round(totalActionItems / recentRetros.length)} action items per retrospective`,
      recommendation:
        'Focus on 1-2 high-impact action items per sprint for better follow-through',
    });
  }

  // Analyze team satisfaction trends
  const satisfactionMetrics = calculateTeamSatisfactionMetrics(recentRetros);
  if (satisfactionMetrics.satisfactionTrend === 'declining') {
    insights.push({
      type: 'satisfaction_decline',
      priority: 'high',
      title: 'Declining Team Satisfaction',
      description:
        'Team satisfaction scores have been declining over recent sprints',
      recommendation:
        'Schedule a focused team discussion to address underlying concerns',
    });
  }

  return insights;
};

/**
 * Calculate predictive metrics for future sprints
 * @param {Array} sprintData - Historical sprint data
 * @param {Object} teamData - Team capacity and configuration
 * @returns {Object} Predictive metrics
 */
export const calculatePredictiveMetrics = (sprintData, teamData) => {
  if (!sprintData || sprintData.length < 3) {
    return {
      predictedVelocity: 0,
      confidenceLevel: 0,
      capacityUtilization: 0,
      riskFactors: [],
    };
  }

  const velocityMetrics = calculateVelocityMetrics(sprintData);
  const qualityMetrics = calculateQualityMetrics(sprintData);

  // Calculate confidence level based on velocity consistency
  const velocities = sprintData.slice(-6).map(s => s.velocity || 0);
  const velocityStdDev = Math.sqrt(velocityMetrics.velocityVariance);
  const confidenceLevel = Math.max(
    0,
    Math.min(
      100,
      100 - (velocityStdDev / velocityMetrics.averageVelocity) * 100
    )
  );

  // Calculate capacity utilization
  const avgPointsPerHour = 0.4; // Assumption: 1 story point = 2.5 hours
  const predictedHours = velocityMetrics.predictedVelocity / avgPointsPerHour;
  const teamCapacity = teamData.capacity || 80;
  const capacityUtilization = (predictedHours / teamCapacity) * 100;

  // Identify risk factors
  const riskFactors = [];

  if (velocityMetrics.velocityTrend === 'decreasing') {
    riskFactors.push({
      type: 'velocity_decline',
      severity: 'high',
      description: 'Team velocity is declining',
    });
  }

  if (qualityMetrics.qualityTrend === 'declining') {
    riskFactors.push({
      type: 'quality_decline',
      severity: 'medium',
      description: 'Code quality metrics are declining',
    });
  }

  if (capacityUtilization > 90) {
    riskFactors.push({
      type: 'over_capacity',
      severity: 'high',
      description: 'Team may be over-capacity',
    });
  }

  return {
    predictedVelocity: velocityMetrics.predictedVelocity,
    confidenceLevel: Math.round(confidenceLevel),
    capacityUtilization: Math.round(capacityUtilization),
    riskFactors,
  };
};

/**
 * Helper function for linear regression prediction
 * @param {Array} values - Array of numerical values
 * @returns {number} Predicted next value
 */
const calculateLinearRegressionPrediction = values => {
  if (values.length < 2) return values[0] || 0;

  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return slope * n + intercept;
};

/**
 * Helper function to extract keywords from text
 * @param {string} text - Input text
 * @returns {Array} Array of keywords
 */
const extractKeywords = text => {
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
  ];

  return text
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0);
};

/**
 * Format data for chart visualization
 * @param {Array} sprintData - Sprint data
 * @param {string} metric - Metric to format ('velocity', 'completion', 'quality')
 * @returns {Array} Formatted chart data
 */
export const formatChartData = (sprintData, metric) => {
  if (!sprintData || sprintData.length === 0) return [];

  switch (metric) {
    case 'velocity':
      return sprintData.map(sprint => ({
        sprint: `Sprint ${sprint.number}`,
        planned: sprint.plannedPoints || 0,
        completed: sprint.completedPoints || 0,
        velocity: sprint.velocity || 0,
      }));

    case 'completion':
      return calculateStoryCompletionRates(sprintData).map(data => ({
        sprint: `Sprint ${data.sprintNumber}`,
        completionRate: data.completionRate,
        totalStories: data.totalStories,
        completedStories: data.completedStories,
      }));

    case 'quality':
      return sprintData.map(sprint => ({
        sprint: `Sprint ${sprint.number}`,
        bugCount: sprint.bugCount || 0,
        testCoverage: sprint.testCoverage || 0,
        codeReviewScore: sprint.codeReviewScore || 0,
      }));

    default:
      return [];
  }
};
