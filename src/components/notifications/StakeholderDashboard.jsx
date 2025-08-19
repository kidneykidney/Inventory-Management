import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import notificationService from '../../services/notificationService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StakeholderDashboard = ({ projectId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');

  useEffect(() => {
    fetchDashboardData();
  }, [projectId, selectedTimeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData = {
        currentSprint: {
          number: 5,
          name: 'Sprint 5 - Notification System',
          progress: 75,
          daysRemaining: 3,
          totalDays: 14,
          completedStories: 8,
          totalStories: 12,
          velocity: 42,
        },
        teamMetrics: {
          totalMembers: 6,
          activeMembers: 5,
          capacity: 240,
          utilization: 85,
        },
        projectHealth: {
          onTrack: 8,
          atRisk: 3,
          blocked: 1,
          completed: 45,
        },
        velocityTrend: {
          labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'],
          data: [32, 38, 35, 41, 42],
        },
        burndownData: {
          labels: Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`),
          planned: [
            60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0,
          ],
          actual: [60, 58, 54, 50, 45, 42, 38, 35, 30, 25, 20, 15, 10, 6, 3],
        },
        storyDistribution: {
          labels: ['Completed', 'In Progress', 'To Do', 'Blocked'],
          data: [45, 8, 15, 2],
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        },
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  const velocityChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Team Velocity Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Story Points',
        },
      },
    },
  };

  const burndownChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sprint Burndown Chart',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Story Points Remaining',
        },
      },
    },
  };

  const storyDistributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Story Distribution',
      },
    },
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Stakeholder Dashboard</h1>
          <p className='text-muted-foreground'>
            Real-time project insights and team performance metrics
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button
            variant={selectedTimeframe === 'current' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('current')}
          >
            Current Sprint
          </Button>
          <Button
            variant={selectedTimeframe === 'quarter' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('quarter')}
          >
            This Quarter
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Current Sprint
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              Sprint {dashboardData.currentSprint.number}
            </div>
            <div className='flex items-center space-x-2 mt-2'>
              <Progress
                value={dashboardData.currentSprint.progress}
                className='flex-1'
              />
              <span className='text-sm text-muted-foreground'>
                {dashboardData.currentSprint.progress}%
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              {dashboardData.currentSprint.daysRemaining} days remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Team Velocity</CardTitle>
            <TrendingUp className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {dashboardData.currentSprint.velocity}
            </div>
            <p className='text-xs text-green-600 mt-1'>
              +2.4% from last sprint
            </p>
            <p className='text-xs text-muted-foreground'>
              Story points completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Team Capacity</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {dashboardData.teamMetrics.utilization}%
            </div>
            <div className='flex items-center space-x-2 mt-2'>
              <Progress
                value={dashboardData.teamMetrics.utilization}
                className='flex-1'
              />
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              {dashboardData.teamMetrics.activeMembers}/
              {dashboardData.teamMetrics.totalMembers} members active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Stories Completed
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {dashboardData.currentSprint.completedStories}/
              {dashboardData.currentSprint.totalStories}
            </div>
            <div className='flex items-center space-x-2 mt-2'>
              <Progress
                value={
                  (dashboardData.currentSprint.completedStories /
                    dashboardData.currentSprint.totalStories) *
                  100
                }
                className='flex-1'
              />
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Sprint progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Velocity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: dashboardData.velocityTrend.labels,
                datasets: [
                  {
                    label: 'Velocity',
                    data: dashboardData.velocityTrend.data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                  },
                ],
              }}
              options={velocityChartOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sprint Burndown</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: dashboardData.burndownData.labels,
                datasets: [
                  {
                    label: 'Planned',
                    data: dashboardData.burndownData.planned,
                    borderColor: 'rgb(156, 163, 175)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderDash: [5, 5],
                  },
                  {
                    label: 'Actual',
                    data: dashboardData.burndownData.actual,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                  },
                ],
              }}
              options={burndownChartOptions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Project Health and Story Distribution */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Project Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {dashboardData.projectHealth.onTrack}
                </div>
                <div className='text-sm text-muted-foreground'>On Track</div>
                <Badge
                  variant='secondary'
                  className='mt-1 bg-green-100 text-green-800'
                >
                  Good
                </Badge>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {dashboardData.projectHealth.atRisk}
                </div>
                <div className='text-sm text-muted-foreground'>At Risk</div>
                <Badge
                  variant='secondary'
                  className='mt-1 bg-yellow-100 text-yellow-800'
                >
                  Watch
                </Badge>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {dashboardData.projectHealth.blocked}
                </div>
                <div className='text-sm text-muted-foreground'>Blocked</div>
                <Badge variant='destructive' className='mt-1'>
                  Action Needed
                </Badge>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {dashboardData.projectHealth.completed}
                </div>
                <div className='text-sm text-muted-foreground'>Completed</div>
                <Badge
                  variant='secondary'
                  className='mt-1 bg-blue-100 text-blue-800'
                >
                  Done
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Story Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut
              data={{
                labels: dashboardData.storyDistribution.labels,
                datasets: [
                  {
                    data: dashboardData.storyDistribution.data,
                    backgroundColor: dashboardData.storyDistribution.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  },
                ],
              }}
              options={storyDistributionOptions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StakeholderDashboard;
