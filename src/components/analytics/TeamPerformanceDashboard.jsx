import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Award,
} from 'lucide-react';

const TeamPerformanceDashboard = ({
  teamData,
  sprintData,
  retrospectiveData,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('last6sprints');
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  useEffect(() => {
    calculatePerformanceMetrics();
  }, [teamData, sprintData, retrospectiveData, selectedTimeframe]);

  const calculatePerformanceMetrics = () => {
    if (!sprintData || !teamData) return;

    const metrics = {
      averageVelocity: calculateAverageVelocity(),
      velocityTrend: calculateVelocityTrend(),
      burndownAccuracy: calculateBurndownAccuracy(),
      storyCompletionRate: calculateStoryCompletionRate(),
      qualityMetrics: calculateQualityMetrics(),
      teamSatisfaction: calculateTeamSatisfaction(),
      predictiveVelocity: calculatePredictiveVelocity(),
    };

    setPerformanceMetrics(metrics);
  };

  const calculateAverageVelocity = () => {
    const recentSprints = sprintData.slice(-6);
    const totalVelocity = recentSprints.reduce(
      (sum, sprint) => sum + (sprint.completedPoints || 0),
      0
    );
    return Math.round(totalVelocity / recentSprints.length);
  };

  const calculateVelocityTrend = () => {
    const recentSprints = sprintData.slice(-6);
    return recentSprints.map((sprint, index) => ({
      sprint: `Sprint ${sprint.number}`,
      planned: sprint.plannedPoints || 0,
      completed: sprint.completedPoints || 0,
      velocity: sprint.velocity || 0,
      trend:
        index > 0 ? sprint.velocity - recentSprints[index - 1].velocity : 0,
    }));
  };

  const calculateBurndownAccuracy = () => {
    const recentSprints = sprintData.slice(-6);
    let accurateCount = 0;

    recentSprints.forEach(sprint => {
      if (sprint.burndownData) {
        const finalDay = sprint.burndownData[sprint.burndownData.length - 1];
        if (finalDay && Math.abs(finalDay.remaining) <= 2) {
          accurateCount++;
        }
      }
    });

    return Math.round((accurateCount / recentSprints.length) * 100);
  };

  const calculateStoryCompletionRate = () => {
    const recentSprints = sprintData.slice(-6);
    return recentSprints.map(sprint => ({
      sprint: `Sprint ${sprint.number}`,
      planned: sprint.stories?.length || 0,
      completed:
        sprint.stories?.filter(story => story.status === 'done').length || 0,
      completionRate: sprint.stories?.length
        ? Math.round(
            (sprint.stories.filter(story => story.status === 'done').length /
              sprint.stories.length) *
              100
          )
        : 0,
    }));
  };

  const calculateQualityMetrics = () => {
    const recentSprints = sprintData.slice(-6);
    return recentSprints.map(sprint => ({
      sprint: `Sprint ${sprint.number}`,
      bugCount: sprint.bugCount || 0,
      testCoverage: sprint.testCoverage || 0,
      codeReviewScore: sprint.codeReviewScore || 0,
      technicalDebt: sprint.technicalDebtHours || 0,
    }));
  };

  const calculateTeamSatisfaction = () => {
    if (!retrospectiveData) return [];

    return retrospectiveData.slice(-6).map(retro => ({
      sprint: `Sprint ${retro.sprintId}`,
      morale: retro.teamMorale || 0,
      velocity: retro.velocityRating || 0,
      quality: retro.qualityRating || 0,
      communication: retro.communicationRating || 0,
      average:
        Math.round(
          ((retro.teamMorale +
            retro.velocityRating +
            retro.qualityRating +
            retro.communicationRating) /
            4) *
            10
        ) / 10,
    }));
  };

  const calculatePredictiveVelocity = () => {
    const recentVelocities = sprintData.slice(-6).map(s => s.velocity || 0);
    const trend =
      recentVelocities.slice(-3).reduce((sum, v, i, arr) => {
        if (i === 0) return 0;
        return sum + (v - arr[i - 1]);
      }, 0) / 2;

    const baseVelocity = recentVelocities[recentVelocities.length - 1] || 0;
    return Math.max(0, Math.round(baseVelocity + trend));
  };

  const MetricCard = ({ title, value, trend, icon: Icon, color = 'blue' }) => (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {trend !== undefined && (
              <div className='flex items-center mt-1'>
                {trend > 0 ? (
                  <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                ) : trend < 0 ? (
                  <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
                ) : null}
                <span
                  className={`text-sm ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {trend > 0 ? '+' : ''}
                  {trend}
                </span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 text-${color}-500`} />
        </div>
      </CardContent>
    </Card>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className='space-y-6'>
      {/* Key Metrics Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          title='Average Velocity'
          value={performanceMetrics.averageVelocity || 0}
          trend={performanceMetrics.velocityTrend
            ?.slice(-2)
            .reduce(
              (acc, curr, i, arr) =>
                i === 1 ? curr.velocity - arr[0].velocity : acc,
              0
            )}
          icon={Target}
          color='blue'
        />
        <MetricCard
          title='Burndown Accuracy'
          value={`${performanceMetrics.burndownAccuracy || 0}%`}
          icon={Clock}
          color='green'
        />
        <MetricCard
          title='Story Completion'
          value={`${performanceMetrics.storyCompletionRate?.slice(-1)[0]?.completionRate || 0}%`}
          icon={Award}
          color='purple'
        />
        <MetricCard
          title='Team Satisfaction'
          value={
            performanceMetrics.teamSatisfaction?.slice(-1)[0]?.average || 0
          }
          icon={Users}
          color='orange'
        />
      </div>

      <Tabs defaultValue='velocity' className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='velocity'>Velocity</TabsTrigger>
          <TabsTrigger value='quality'>Quality</TabsTrigger>
          <TabsTrigger value='satisfaction'>Satisfaction</TabsTrigger>
          <TabsTrigger value='completion'>Completion</TabsTrigger>
          <TabsTrigger value='predictive'>Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value='velocity' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Velocity Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={performanceMetrics.velocityTrend || []}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='sprint' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='planned'
                    stroke='#8884d8'
                    name='Planned Points'
                  />
                  <Line
                    type='monotone'
                    dataKey='completed'
                    stroke='#82ca9d'
                    name='Completed Points'
                  />
                  <Line
                    type='monotone'
                    dataKey='velocity'
                    stroke='#ffc658'
                    name='Velocity'
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='quality' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <AreaChart data={performanceMetrics.qualityMetrics || []}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='sprint' />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type='monotone'
                      dataKey='testCoverage'
                      stackId='1'
                      stroke='#8884d8'
                      fill='#8884d8'
                      name='Test Coverage %'
                    />
                    <Area
                      type='monotone'
                      dataKey='codeReviewScore'
                      stackId='2'
                      stroke='#82ca9d'
                      fill='#82ca9d'
                      name='Code Review Score'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bug Count & Technical Debt</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <BarChart data={performanceMetrics.qualityMetrics || []}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='sprint' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='bugCount' fill='#ff7300' name='Bug Count' />
                    <Bar
                      dataKey='technicalDebt'
                      fill='#413ea0'
                      name='Technical Debt (hrs)'
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='satisfaction' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Team Satisfaction Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <RadarChart
                  data={performanceMetrics.teamSatisfaction?.slice(-1) || []}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey='category' />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar
                    name='Current Sprint'
                    dataKey='morale'
                    stroke='#8884d8'
                    fill='#8884d8'
                    fillOpacity={0.6}
                  />
                  <Radar
                    name='Velocity'
                    dataKey='velocity'
                    stroke='#82ca9d'
                    fill='#82ca9d'
                    fillOpacity={0.6}
                  />
                  <Radar
                    name='Quality'
                    dataKey='quality'
                    stroke='#ffc658'
                    fill='#ffc658'
                    fillOpacity={0.6}
                  />
                  <Radar
                    name='Communication'
                    dataKey='communication'
                    stroke='#ff7300'
                    fill='#ff7300'
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='completion' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Story Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={performanceMetrics.storyCompletionRate || []}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='sprint' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='planned'
                    fill='#8884d8'
                    name='Planned Stories'
                  />
                  <Bar
                    dataKey='completed'
                    fill='#82ca9d'
                    name='Completed Stories'
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className='mt-4 space-y-2'>
                {performanceMetrics.storyCompletionRate?.map(
                  (sprint, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm font-medium'>
                        {sprint.sprint}
                      </span>
                      <div className='flex items-center space-x-2'>
                        <Progress
                          value={sprint.completionRate}
                          className='w-24'
                        />
                        <Badge
                          variant={
                            sprint.completionRate >= 80
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {sprint.completionRate}%
                        </Badge>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='predictive' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Predictive Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center'>
                  <div className='text-4xl font-bold text-blue-600 mb-2'>
                    {performanceMetrics.predictiveVelocity || 0}
                  </div>
                  <p className='text-gray-600'>
                    Predicted points for next sprint
                  </p>
                  <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-blue-800'>
                      Based on recent velocity trends and team performance
                      patterns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Capacity Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span>Team Capacity</span>
                    <Badge>{teamData?.capacity || 0} hrs/sprint</Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span>Predicted Workload</span>
                    <Badge variant='outline'>
                      {Math.round(
                        (performanceMetrics.predictiveVelocity || 0) * 2.5
                      )}{' '}
                      hrs
                    </Badge>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      (((performanceMetrics.predictiveVelocity || 0) * 2.5) /
                        (teamData?.capacity || 1)) *
                        100
                    )}
                    className='w-full'
                  />
                  <p className='text-xs text-gray-600'>
                    Utilization:{' '}
                    {Math.round(
                      (((performanceMetrics.predictiveVelocity || 0) * 2.5) /
                        (teamData?.capacity || 1)) *
                        100
                    )}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamPerformanceDashboard;
