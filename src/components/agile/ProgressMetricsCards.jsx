import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Target, 
  Clock, 
  Users, 
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react';

/**
 * Progress Metrics Cards Component
 * Displays key progress metrics in modern card format
 */
const ProgressMetricsCards = ({ metrics, sprint }) => {
  if (!metrics) {
    return null;
  }

  const {
    velocityTrend,
    sprintProgress,
    teamUtilization,
    qualityMetrics,
    riskIndicators,
    predictiveAnalytics
  } = metrics;

  // Calculate derived metrics
  const completionRate = sprintProgress?.completionRate || 0;
  const velocityChange = velocityTrend?.change || 0;
  const utilizationRate = teamUtilization?.rate || 0;
  const qualityScore = qualityMetrics?.score || 0;

  // Define metric cards configuration
  const metricCards = [
    {
      title: 'Sprint Velocity',
      value: velocityTrend?.current || 0,
      unit: 'pts',
      description: `${velocityChange >= 0 ? '+' : ''}${velocityChange}% from last sprint`,
      icon: velocityChange >= 0 ? TrendingUp : TrendingDown,
      color: velocityChange >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: velocityChange >= 0 ? 'bg-green-50' : 'bg-red-50',
      trend: {
        value: Math.abs(velocityChange),
        direction: velocityChange >= 0 ? 'up' : 'down'
      }
    },
    {
      title: 'Sprint Progress',
      value: completionRate,
      unit: '%',
      description: `${sprintProgress?.completedStories || 0}/${sprintProgress?.totalStories || 0} stories completed`,
      icon: Target,
      color: completionRate >= 80 ? 'text-green-600' : completionRate >= 60 ? 'text-orange-600' : 'text-red-600',
      bgColor: completionRate >= 80 ? 'bg-green-50' : completionRate >= 60 ? 'bg-orange-50' : 'bg-red-50',
      progress: completionRate,
      progressColor: completionRate >= 80 ? 'bg-green-500' : completionRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
    },
    {
      title: 'Team Utilization',
      value: utilizationRate,
      unit: '%',
      description: `${teamUtilization?.activeMembers || 0} active team members`,
      icon: Users,
      color: utilizationRate >= 85 && utilizationRate <= 100 ? 'text-green-600' : 'text-orange-600',
      bgColor: utilizationRate >= 85 && utilizationRate <= 100 ? 'bg-green-50' : 'bg-orange-50',
      progress: Math.min(utilizationRate, 100),
      progressColor: utilizationRate > 100 ? 'bg-red-500' : utilizationRate >= 85 ? 'bg-green-500' : 'bg-orange-500'
    },
    {
      title: 'Quality Score',
      value: qualityScore,
      unit: '/10',
      description: `${qualityMetrics?.testsPass || 0}% tests passing`,
      icon: qualityScore >= 8 ? CheckCircle : qualityScore >= 6 ? Activity : AlertTriangle,
      color: qualityScore >= 8 ? 'text-green-600' : qualityScore >= 6 ? 'text-orange-600' : 'text-red-600',
      bgColor: qualityScore >= 8 ? 'bg-green-50' : qualityScore >= 6 ? 'bg-orange-50' : 'bg-red-50',
      progress: (qualityScore / 10) * 100,
      progressColor: qualityScore >= 8 ? 'bg-green-500' : qualityScore >= 6 ? 'bg-orange-500' : 'bg-red-500'
    }
  ];

  // Additional insight cards
  const insightCards = [
    {
      title: 'Burndown Trend',
      icon: BarChart3,
      content: (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Days Remaining</span>
            <span className='font-medium'>{sprintProgress?.daysRemaining || 0}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Points Remaining</span>
            <span className='font-medium'>{sprintProgress?.pointsRemaining || 0}</span>
          </div>
          <div className='flex items-center gap-2'>
            {sprintProgress?.onTrack ? (
              <>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span className='text-sm text-green-600'>On Track</span>
              </>
            ) : (
              <>
                <AlertTriangle className='h-4 w-4 text-orange-600' />
                <span className='text-sm text-orange-600'>At Risk</span>
              </>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Risk Indicators',
      icon: AlertTriangle,
      content: (
        <div className='space-y-2'>
          {riskIndicators?.map((risk, index) => (
            <div key={index} className='flex items-center gap-2'>
              <div className={`w-2 h-2 rounded-full ${
                risk.level === 'high' ? 'bg-red-500' : 
                risk.level === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
              }`} />
              <span className='text-sm'>{risk.description}</span>
            </div>
          )) || (
            <div className='flex items-center gap-2 text-green-600'>
              <CheckCircle className='h-4 w-4' />
              <span className='text-sm'>No risks identified</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Predictive Analytics',
      icon: Zap,
      content: (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Completion Forecast</span>
            <span className='font-medium'>{predictiveAnalytics?.completionForecast || 'N/A'}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Confidence</span>
            <Badge variant='outline' className='text-xs'>
              {predictiveAnalytics?.confidence || 'Medium'}
            </Badge>
          </div>
          {predictiveAnalytics?.recommendation && (
            <div className='text-xs text-muted-foreground mt-2'>
              {predictiveAnalytics.recommendation}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className='space-y-6'>
      {/* Main Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className='relative overflow-hidden'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metric.value}
                  <span className='text-sm font-normal text-muted-foreground ml-1'>
                    {metric.unit}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {metric.description}
                </p>

                {/* Progress bar for applicable metrics */}
                {metric.progress !== undefined && (
                  <div className='mt-3'>
                    <Progress 
                      value={metric.progress} 
                      className='h-2'
                      indicatorClassName={metric.progressColor}
                    />
                  </div>
                )}

                {/* Trend indicator */}
                {metric.trend && (
                  <div className='flex items-center gap-1 mt-2'>
                    {metric.trend.direction === 'up' ? (
                      <TrendingUp className='h-3 w-3 text-green-600' />
                    ) : (
                      <TrendingDown className='h-3 w-3 text-red-600' />
                    )}
                    <span className={`text-xs ${
                      metric.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend.value}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insight Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {insightCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Icon className='h-4 w-4' />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {card.content}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sprint Summary Card */}
      {sprint && (
        <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  Sprint {sprint.number}
                  <Badge 
                    className={
                      sprint.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : sprint.status === 'planning'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {sprint.status}
                  </Badge>
                </CardTitle>
                <CardDescription className='mt-1'>
                  {sprint.goal}
                </CardDescription>
              </div>
              <div className='text-right'>
                <div className='text-sm text-muted-foreground'>Sprint Health</div>
                <div className='flex items-center gap-1 mt-1'>
                  {completionRate >= 80 ? (
                    <>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <span className='text-sm font-medium text-green-600'>Excellent</span>
                    </>
                  ) : completionRate >= 60 ? (
                    <>
                      <Activity className='h-4 w-4 text-orange-600' />
                      <span className='text-sm font-medium text-orange-600'>Good</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className='h-4 w-4 text-red-600' />
                      <span className='text-sm font-medium text-red-600'>Needs Attention</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-lg font-bold text-blue-600'>
                  {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className='text-sm text-muted-foreground'>Start Date</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-bold text-purple-600'>
                  {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className='text-sm text-muted-foreground'>End Date</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-bold text-green-600'>
                  {sprintProgress?.completedStories || 0}
                </div>
                <div className='text-sm text-muted-foreground'>Stories Done</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-bold text-orange-600'>
                  {sprintProgress?.totalStories || 0}
                </div>
                <div className='text-sm text-muted-foreground'>Total Stories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressMetricsCards;