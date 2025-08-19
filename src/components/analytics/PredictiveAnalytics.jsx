import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react';

const PredictiveAnalytics = ({
  sprintData = [],
  teamData = {},
  historicalData = [],
}) => {
  const [predictions, setPredictions] = useState({});
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [trends, setTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    calculatePredictions();
    analyzeTrends();
    generateRecommendations();
  }, [sprintData, teamData, historicalData]);

  const calculatePredictions = () => {
    if (sprintData.length < 3) return;

    const recentSprints = sprintData.slice(-6);
    const velocities = recentSprints.map(s => s.velocity || 0);
    const completionRates = recentSprints.map(s => {
      if (!s.stories || s.stories.length === 0) return 0;
      return (
        (s.stories.filter(story => story.status === 'done').length /
          s.stories.length) *
        100
      );
    });

    // Linear regression for velocity prediction
    const velocityPrediction = calculateLinearRegression(velocities);
    const completionPrediction = calculateLinearRegression(completionRates);

    // Calculate confidence based on data consistency
    const velocityVariance = calculateVariance(velocities);
    const confidence = Math.max(
      0,
      Math.min(100, 100 - (velocityVariance / Math.max(...velocities)) * 100)
    );

    // Predict next 3 sprints
    const nextSprints = [];
    for (let i = 1; i <= 3; i++) {
      nextSprints.push({
        sprintNumber: (sprintData[sprintData.length - 1]?.number || 0) + i,
        predictedVelocity: Math.max(
          0,
          Math.round(velocityPrediction.predict(velocities.length + i))
        ),
        predictedCompletion: Math.max(
          0,
          Math.min(
            100,
            Math.round(completionPrediction.predict(completionRates.length + i))
          )
        ),
        confidence: Math.max(50, confidence - i * 10), // Decrease confidence for further predictions
      });
    }

    // Risk assessment
    const riskFactors = assessRiskFactors(recentSprints);

    // Capacity planning
    const capacityPrediction = calculateCapacityNeeds(nextSprints, teamData);

    setPredictions({
      nextSprints,
      riskFactors,
      capacityPrediction,
      seasonalTrends: calculateSeasonalTrends(),
    });

    setConfidenceLevel(confidence);
  };

  const calculateLinearRegression = values => {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope,
      intercept,
      predict: x => slope * x + intercept,
    };
  };

  const calculateVariance = values => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return (
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length
    );
  };

  const assessRiskFactors = sprints => {
    const risks = [];

    // Velocity declining trend
    const recentVelocities = sprints.slice(-3).map(s => s.velocity || 0);
    if (
      recentVelocities.every((v, i) => i === 0 || v < recentVelocities[i - 1])
    ) {
      risks.push({
        type: 'velocity_decline',
        severity: 'high',
        description: 'Velocity has been consistently declining',
        impact: 'Delivery timelines may be at risk',
      });
    }

    // High bug count
    const avgBugs =
      sprints.reduce((sum, s) => sum + (s.bugCount || 0), 0) / sprints.length;
    if (avgBugs > 5) {
      risks.push({
        type: 'quality_issues',
        severity: 'medium',
        description: 'Higher than average bug count detected',
        impact: 'Quality and velocity may be impacted',
      });
    }

    // Low completion rates
    const avgCompletion =
      sprints.reduce((sum, s) => {
        if (!s.stories || s.stories.length === 0) return sum;
        return (
          sum +
          (s.stories.filter(story => story.status === 'done').length /
            s.stories.length) *
            100
        );
      }, 0) / sprints.length;

    if (avgCompletion < 70) {
      risks.push({
        type: 'low_completion',
        severity: 'high',
        description: 'Story completion rate below 70%',
        impact: 'Sprint goals consistently not being met',
      });
    }

    // Team capacity issues
    if (teamData.capacity && teamData.utilization > 90) {
      risks.push({
        type: 'over_capacity',
        severity: 'medium',
        description: 'Team utilization above 90%',
        impact: 'Burnout risk and quality degradation',
      });
    }

    return risks;
  };

  const calculateCapacityNeeds = (nextSprints, team) => {
    const avgPointsPerHour = 0.4; // Assumption: 1 story point = 2.5 hours

    return nextSprints.map(sprint => {
      const estimatedHours = sprint.predictedVelocity / avgPointsPerHour;
      const currentCapacity = team.capacity || 80; // Default 80 hours per sprint
      const utilizationRate = (estimatedHours / currentCapacity) * 100;

      return {
        sprint: sprint.sprintNumber,
        estimatedHours: Math.round(estimatedHours),
        currentCapacity,
        utilizationRate: Math.round(utilizationRate),
        recommendation:
          utilizationRate > 90
            ? 'reduce_scope'
            : utilizationRate < 60
              ? 'increase_scope'
              : 'optimal',
      };
    });
  };

  const calculateSeasonalTrends = () => {
    // Analyze historical data for seasonal patterns
    if (historicalData.length < 12) return null;

    const monthlyData = historicalData.reduce((acc, sprint) => {
      const month = new Date(sprint.startDate).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(sprint.velocity || 0);
      return acc;
    }, {});

    return Object.keys(monthlyData).map(month => ({
      month: parseInt(month),
      avgVelocity: Math.round(
        monthlyData[month].reduce((a, b) => a + b, 0) /
          monthlyData[month].length
      ),
      dataPoints: monthlyData[month].length,
    }));
  };

  const analyzeTrends = () => {
    if (sprintData.length < 4) return;

    const recentSprints = sprintData.slice(-8);
    const trendAnalysis = [];

    // Velocity trend
    const velocities = recentSprints.map(s => s.velocity || 0);
    const velocityTrend = calculateTrendDirection(velocities);
    trendAnalysis.push({
      metric: 'Velocity',
      direction: velocityTrend.direction,
      strength: velocityTrend.strength,
      current: velocities[velocities.length - 1],
      change:
        velocities[velocities.length - 1] - velocities[velocities.length - 2],
    });

    // Quality trend (based on bug count)
    const bugCounts = recentSprints.map(s => s.bugCount || 0);
    const qualityTrend = calculateTrendDirection(bugCounts.map(b => -b)); // Invert for quality
    trendAnalysis.push({
      metric: 'Quality',
      direction: qualityTrend.direction,
      strength: qualityTrend.strength,
      current: bugCounts[bugCounts.length - 1],
      change: bugCounts[bugCounts.length - 1] - bugCounts[bugCounts.length - 2],
    });

    // Team satisfaction trend
    if (historicalData.length > 0) {
      const satisfactionScores = historicalData
        .slice(-6)
        .map(d => d.teamSatisfaction || 5);
      const satisfactionTrend = calculateTrendDirection(satisfactionScores);
      trendAnalysis.push({
        metric: 'Team Satisfaction',
        direction: satisfactionTrend.direction,
        strength: satisfactionTrend.strength,
        current: satisfactionScores[satisfactionScores.length - 1],
        change:
          satisfactionScores[satisfactionScores.length - 1] -
          satisfactionScores[satisfactionScores.length - 2],
      });
    }

    setTrends(trendAnalysis);
  };

  const calculateTrendDirection = values => {
    const regression = calculateLinearRegression(values);
    const direction =
      regression.slope > 0.1
        ? 'increasing'
        : regression.slope < -0.1
          ? 'decreasing'
          : 'stable';
    const strength =
      Math.abs(regression.slope) > 1
        ? 'strong'
        : Math.abs(regression.slope) > 0.3
          ? 'moderate'
          : 'weak';

    return { direction, strength };
  };

  const generateRecommendations = () => {
    const recs = [];

    // Based on velocity trends
    if (
      trends.find(t => t.metric === 'Velocity' && t.direction === 'decreasing')
    ) {
      recs.push({
        type: 'velocity',
        priority: 'high',
        title: 'Address Velocity Decline',
        description:
          'Team velocity has been declining. Consider reviewing sprint planning and removing blockers.',
        actions: [
          'Review sprint retrospectives',
          'Identify and remove blockers',
          'Consider team capacity adjustments',
        ],
      });
    }

    // Based on risk factors
    if (predictions.riskFactors?.some(r => r.severity === 'high')) {
      recs.push({
        type: 'risk',
        priority: 'high',
        title: 'High Risk Factors Detected',
        description:
          'Multiple high-severity risk factors identified that may impact delivery.',
        actions: [
          'Address quality issues',
          'Review team capacity',
          'Implement risk mitigation strategies',
        ],
      });
    }

    // Based on capacity predictions
    const overCapacityCount =
      predictions.capacityPrediction?.filter(c => c.utilizationRate > 90)
        .length || 0;
    if (overCapacityCount > 1) {
      recs.push({
        type: 'capacity',
        priority: 'medium',
        title: 'Capacity Management Needed',
        description: 'Team may be over-capacity in upcoming sprints.',
        actions: [
          'Reduce sprint scope',
          'Consider additional resources',
          'Prioritize critical features',
        ],
      });
    }

    // Based on seasonal trends
    if (predictions.seasonalTrends) {
      const currentMonth = new Date().getMonth();
      const currentSeasonData = predictions.seasonalTrends.find(
        s => s.month === currentMonth
      );
      if (currentSeasonData && currentSeasonData.avgVelocity < 15) {
        recs.push({
          type: 'seasonal',
          priority: 'low',
          title: 'Seasonal Velocity Pattern',
          description:
            'Historical data shows lower velocity during this period.',
          actions: [
            'Plan for reduced capacity',
            'Focus on high-priority items',
            'Consider team development activities',
          ],
        });
      }
    }

    setRecommendations(recs);
  };

  const TrendIndicator = ({ trend }) => {
    const getIcon = () => {
      if (trend.direction === 'increasing')
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      if (trend.direction === 'decreasing')
        return <TrendingDown className='h-4 w-4 text-red-500' />;
      return <Activity className='h-4 w-4 text-gray-500' />;
    };

    const getColor = () => {
      if (trend.metric === 'Quality') {
        return trend.direction === 'increasing'
          ? 'text-green-600'
          : trend.direction === 'decreasing'
            ? 'text-red-600'
            : 'text-gray-600';
      }
      return trend.direction === 'increasing'
        ? 'text-green-600'
        : trend.direction === 'decreasing'
          ? 'text-red-600'
          : 'text-gray-600';
    };

    return (
      <div className='flex items-center space-x-2'>
        {getIcon()}
        <span className={`font-medium ${getColor()}`}>
          {trend.direction} ({trend.strength})
        </span>
        <Badge variant='outline'>
          {trend.change > 0 ? '+' : ''}
          {trend.change}
        </Badge>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Confidence Level */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Target className='h-5 w-5' />
            <span>Prediction Confidence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-4'>
            <Progress value={confidenceLevel} className='flex-1' />
            <Badge
              variant={
                confidenceLevel >= 70
                  ? 'default'
                  : confidenceLevel >= 50
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {Math.round(confidenceLevel)}%
            </Badge>
          </div>
          <p className='text-sm text-gray-600 mt-2'>
            Based on {sprintData.length} sprints of historical data
          </p>
        </CardContent>
      </Card>

      {/* Next Sprint Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Sprint Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {predictions.nextSprints?.map((sprint, index) => (
              <Card key={index} className='border-2 border-dashed'>
                <CardContent className='p-4'>
                  <div className='text-center'>
                    <h3 className='font-semibold mb-2'>
                      Sprint {sprint.sprintNumber}
                    </h3>
                    <div className='space-y-2'>
                      <div>
                        <div className='text-2xl font-bold text-blue-600'>
                          {sprint.predictedVelocity}
                        </div>
                        <div className='text-sm text-gray-600'>
                          Predicted Velocity
                        </div>
                      </div>
                      <div>
                        <div className='text-lg font-semibold text-green-600'>
                          {sprint.predictedCompletion}%
                        </div>
                        <div className='text-sm text-gray-600'>
                          Completion Rate
                        </div>
                      </div>
                      <Badge
                        variant={
                          sprint.confidence >= 70 ? 'default' : 'secondary'
                        }
                      >
                        {sprint.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {trends.map((trend, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 border rounded-lg'
              >
                <div>
                  <h4 className='font-medium'>{trend.metric}</h4>
                  <p className='text-sm text-gray-600'>
                    Current: {trend.current}
                  </p>
                </div>
                <TrendIndicator trend={trend} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {predictions.riskFactors && predictions.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <AlertTriangle className='h-5 w-5 text-orange-500' />
              <span>Risk Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {predictions.riskFactors.map((risk, index) => (
                <Alert
                  key={index}
                  className={
                    risk.severity === 'high'
                      ? 'border-red-200'
                      : 'border-orange-200'
                  }
                >
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='font-medium'>{risk.description}</p>
                        <p className='text-sm text-gray-600 mt-1'>
                          {risk.impact}
                        </p>
                      </div>
                      <Badge
                        variant={
                          risk.severity === 'high' ? 'destructive' : 'secondary'
                        }
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity Planning */}
      {predictions.capacityPrediction && (
        <Card>
          <CardHeader>
            <CardTitle>Capacity Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {predictions.capacityPrediction.map((capacity, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div>
                    <h4 className='font-medium'>Sprint {capacity.sprint}</h4>
                    <p className='text-sm text-gray-600'>
                      {capacity.estimatedHours}h / {capacity.currentCapacity}h
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Progress
                      value={Math.min(100, capacity.utilizationRate)}
                      className='w-24'
                    />
                    <Badge
                      variant={
                        capacity.recommendation === 'reduce_scope'
                          ? 'destructive'
                          : capacity.recommendation === 'increase_scope'
                            ? 'secondary'
                            : 'default'
                      }
                    >
                      {capacity.utilizationRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Zap className='h-5 w-5 text-blue-500' />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recommendations.map((rec, index) => (
                <div key={index} className='border rounded-lg p-4'>
                  <div className='flex items-start justify-between mb-2'>
                    <h4 className='font-medium'>{rec.title}</h4>
                    <Badge
                      variant={
                        rec.priority === 'high'
                          ? 'destructive'
                          : rec.priority === 'medium'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className='text-sm text-gray-600 mb-3'>
                    {rec.description}
                  </p>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Suggested Actions:</p>
                    <ul className='text-sm text-gray-600 list-disc list-inside space-y-1'>
                      {rec.actions.map((action, actionIndex) => (
                        <li key={actionIndex}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictiveAnalytics;
