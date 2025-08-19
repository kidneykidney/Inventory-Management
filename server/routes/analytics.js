const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all retrospectives
router.get('/retrospectives', authenticateToken, async (req, res) => {
  try {
    const [retrospectives] = await db.execute(`
      SELECT 
        id,
        sprint_id as sprintId,
        what_went_well as whatWentWell,
        what_could_improve as whatCouldImprove,
        action_items as actionItems,
        team_morale as teamMorale,
        velocity_rating as velocityRating,
        quality_rating as qualityRating,
        communication_rating as communicationRating,
        additional_notes as additionalNotes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sprint_retrospectives 
      ORDER BY sprint_id DESC
    `);

    // Parse JSON fields
    const parsedRetrospectives = retrospectives.map(retro => ({
      ...retro,
      whatWentWell: JSON.parse(retro.whatWentWell || '[]'),
      whatCouldImprove: JSON.parse(retro.whatCouldImprove || '[]'),
      actionItems: JSON.parse(retro.actionItems || '[]')
    }));

    res.json(parsedRetrospectives);
  } catch (error) {
    console.error('Error fetching retrospectives:', error);
    res.status(500).json({ error: 'Failed to fetch retrospectives' });
  }
});

// Create new retrospective
router.post('/retrospectives', authenticateToken, async (req, res) => {
  try {
    const {
      sprintId,
      whatWentWell,
      whatCouldImprove,
      actionItems,
      teamMorale,
      velocityRating,
      qualityRating,
      communicationRating,
      additionalNotes
    } = req.body;

    const [result] = await db.execute(`
      INSERT INTO sprint_retrospectives (
        sprint_id, what_went_well, what_could_improve, action_items,
        team_morale, velocity_rating, quality_rating, communication_rating,
        additional_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      sprintId,
      JSON.stringify(whatWentWell || []),
      JSON.stringify(whatCouldImprove || []),
      JSON.stringify(actionItems || []),
      teamMorale || 5,
      velocityRating || 5,
      qualityRating || 5,
      communicationRating || 5,
      additionalNotes || ''
    ]);

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Retrospective created successfully' 
    });
  } catch (error) {
    console.error('Error creating retrospective:', error);
    res.status(500).json({ error: 'Failed to create retrospective' });
  }
});

// Update retrospective
router.put('/retrospectives/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      whatWentWell,
      whatCouldImprove,
      actionItems,
      teamMorale,
      velocityRating,
      qualityRating,
      communicationRating,
      additionalNotes
    } = req.body;

    await db.execute(`
      UPDATE sprint_retrospectives SET
        what_went_well = ?,
        what_could_improve = ?,
        action_items = ?,
        team_morale = ?,
        velocity_rating = ?,
        quality_rating = ?,
        communication_rating = ?,
        additional_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      JSON.stringify(whatWentWell || []),
      JSON.stringify(whatCouldImprove || []),
      JSON.stringify(actionItems || []),
      teamMorale || 5,
      velocityRating || 5,
      qualityRating || 5,
      communicationRating || 5,
      additionalNotes || '',
      id
    ]);

    res.json({ message: 'Retrospective updated successfully' });
  } catch (error) {
    console.error('Error updating retrospective:', error);
    res.status(500).json({ error: 'Failed to update retrospective' });
  }
});

// Get team performance metrics
router.get('/team/metrics', authenticateToken, async (req, res) => {
  try {
    // Get basic team information
    const [teamInfo] = await db.execute(`
      SELECT 
        COUNT(DISTINCT user_id) as teamSize,
        AVG(capacity_hours) as averageCapacity
      FROM user_sprint_capacity 
      WHERE sprint_id IN (
        SELECT id FROM sprints 
        WHERE status = 'active' OR status = 'completed'
        ORDER BY start_date DESC 
        LIMIT 6
      )
    `);

    // Get velocity trends
    const [velocityData] = await db.execute(`
      SELECT 
        s.id,
        s.sprint_number as number,
        s.planned_points as plannedPoints,
        s.completed_points as completedPoints,
        s.velocity,
        s.start_date as startDate,
        s.end_date as endDate
      FROM sprints s
      WHERE s.status IN ('completed', 'active')
      ORDER BY s.start_date DESC
      LIMIT 12
    `);

    // Calculate team metrics
    const teamMetrics = {
      teamSize: teamInfo[0]?.teamSize || 0,
      capacity: Math.round(teamInfo[0]?.averageCapacity || 80),
      utilization: 85, // This would be calculated based on actual work logged
      velocityHistory: velocityData,
      lastUpdated: new Date().toISOString()
    };

    res.json(teamMetrics);
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    res.status(500).json({ error: 'Failed to fetch team metrics' });
  }
});

// Get analytics summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '6' } = req.query;
    
    // Get sprint summary
    const [sprintSummary] = await db.execute(`
      SELECT 
        COUNT(*) as totalSprints,
        AVG(velocity) as averageVelocity,
        AVG(completed_points / planned_points * 100) as averageCompletionRate,
        SUM(planned_points) as totalPlannedPoints,
        SUM(completed_points) as totalCompletedPoints
      FROM sprints 
      WHERE status = 'completed'
      AND start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    `, [timeframe]);

    // Get retrospective summary
    const [retroSummary] = await db.execute(`
      SELECT 
        COUNT(*) as totalRetrospectives,
        AVG(team_morale) as averageMorale,
        AVG(velocity_rating) as averageVelocityRating,
        AVG(quality_rating) as averageQualityRating,
        AVG(communication_rating) as averageCommunicationRating
      FROM sprint_retrospectives sr
      JOIN sprints s ON sr.sprint_id = s.id
      WHERE s.start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    `, [timeframe]);

    // Get quality metrics
    const [qualityMetrics] = await db.execute(`
      SELECT 
        AVG(bug_count) as averageBugCount,
        AVG(test_coverage) as averageTestCoverage,
        AVG(code_review_score) as averageCodeReviewScore
      FROM sprint_quality_metrics sqm
      JOIN sprints s ON sqm.sprint_id = s.id
      WHERE s.start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    `, [timeframe]);

    const summary = {
      sprints: {
        total: sprintSummary[0]?.totalSprints || 0,
        averageVelocity: Math.round(sprintSummary[0]?.averageVelocity || 0),
        averageCompletionRate: Math.round(sprintSummary[0]?.averageCompletionRate || 0),
        totalPlannedPoints: sprintSummary[0]?.totalPlannedPoints || 0,
        totalCompletedPoints: sprintSummary[0]?.totalCompletedPoints || 0
      },
      retrospectives: {
        total: retroSummary[0]?.totalRetrospectives || 0,
        averageMorale: Math.round((retroSummary[0]?.averageMorale || 0) * 10) / 10,
        averageVelocityRating: Math.round((retroSummary[0]?.averageVelocityRating || 0) * 10) / 10,
        averageQualityRating: Math.round((retroSummary[0]?.averageQualityRating || 0) * 10) / 10,
        averageCommunicationRating: Math.round((retroSummary[0]?.averageCommunicationRating || 0) * 10) / 10
      },
      quality: {
        averageBugCount: Math.round((qualityMetrics[0]?.averageBugCount || 0) * 10) / 10,
        averageTestCoverage: Math.round(qualityMetrics[0]?.averageTestCoverage || 0),
        averageCodeReviewScore: Math.round((qualityMetrics[0]?.averageCodeReviewScore || 0) * 10) / 10
      },
      timeframe: `${timeframe} months`,
      generatedAt: new Date().toISOString()
    };

    res.json(summary);
  } catch (error) {
    console.error('Error generating analytics summary:', error);
    res.status(500).json({ error: 'Failed to generate analytics summary' });
  }
});

// Get predictive analytics
router.get('/predictive', authenticateToken, async (req, res) => {
  try {
    // Get recent sprint data for predictions
    const [recentSprints] = await db.execute(`
      SELECT 
        id, sprint_number as number, velocity, completed_points as completedPoints,
        planned_points as plannedPoints, start_date as startDate, end_date as endDate
      FROM sprints 
      WHERE status = 'completed'
      ORDER BY start_date DESC 
      LIMIT 8
    `);

    if (recentSprints.length < 3) {
      return res.json({
        error: 'Insufficient data for predictions',
        message: 'At least 3 completed sprints are required for predictive analytics'
      });
    }

    // Calculate velocity trend using linear regression
    const velocities = recentSprints.map(s => s.velocity || 0);
    const n = velocities.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = velocities.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * velocities[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predictedVelocity = Math.max(0, Math.round(slope * n + intercept));

    // Calculate confidence level based on velocity consistency
    const avgVelocity = sumY / n;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidenceLevel = Math.max(0, Math.min(100, 100 - (stdDev / avgVelocity) * 100));

    // Identify risk factors
    const riskFactors = [];
    
    // Check for declining velocity
    const recentThree = velocities.slice(-3);
    if (recentThree.every((v, i) => i === 0 || v < recentThree[i - 1])) {
      riskFactors.push({
        type: 'velocity_decline',
        severity: 'high',
        description: 'Velocity has been consistently declining over the last 3 sprints'
      });
    }

    // Check for high variance
    if (stdDev > avgVelocity * 0.3) {
      riskFactors.push({
        type: 'high_variance',
        severity: 'medium',
        description: 'High velocity variance indicates inconsistent delivery'
      });
    }

    const predictions = {
      nextSprintVelocity: predictedVelocity,
      confidenceLevel: Math.round(confidenceLevel),
      velocityTrend: slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable',
      riskFactors,
      basedOnSprints: n,
      generatedAt: new Date().toISOString()
    };

    res.json(predictions);
  } catch (error) {
    console.error('Error generating predictive analytics:', error);
    res.status(500).json({ error: 'Failed to generate predictive analytics' });
  }
});

// Export analytics data
router.get('/export/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    const { type = 'summary', timeframe = '6' } = req.query;

    if (!['csv', 'json'].includes(format)) {
      return res.status(400).json({ error: 'Unsupported export format' });
    }

    let data = {};

    switch (type) {
      case 'sprints':
        const [sprints] = await db.execute(`
          SELECT 
            sprint_number, start_date, end_date, planned_points, 
            completed_points, velocity, status
          FROM sprints 
          WHERE start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
          ORDER BY start_date DESC
        `, [timeframe]);
        data = sprints;
        break;

      case 'retrospectives':
        const [retrospectives] = await db.execute(`
          SELECT 
            sr.sprint_id, sr.team_morale, sr.velocity_rating, 
            sr.quality_rating, sr.communication_rating, sr.created_at
          FROM sprint_retrospectives sr
          JOIN sprints s ON sr.sprint_id = s.id
          WHERE s.start_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
          ORDER BY sr.created_at DESC
        `, [timeframe]);
        data = retrospectives;
        break;

      default:
        // Export summary data
        const summaryResponse = await fetch(`${req.protocol}://${req.get('host')}/api/analytics/summary?timeframe=${timeframe}`);
        data = await summaryResponse.json();
    }

    if (format === 'csv') {
      // Convert to CSV
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${Date.now()}.csv"`);
        res.send(csvContent);
      } else {
        res.status(400).json({ error: 'No data available for CSV export' });
      }
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${Date.now()}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

module.exports = router;