import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import VelocityChart from './VelocityChart';
import BurnupChart from './BurnupChart';
import TeamCapacityVisualization from './TeamCapacityVisualization';
import ProgressMetricsCards from './ProgressMetricsCards';
import { apiService } from '../../api/apiService';
import { logger } from '../../utils/logger';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Users,
  BarChart3,
  Calendar,
} from 'lucide-react';

/**
 * Progress Tracking Dashboard Component
 * Real-time dashboard for tracking sprint progress, velocity, and team capacity
 */
const ProgressTrackingDashboard = () => {
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [velocityData, setVelocityData] = useState([]);
  const [burnupData, setBurnupData] = useState(null);
  const [teamCapacity, setTeamCapacity] = useState(null);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadDashboardData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Load data when selected sprint changes
  useEffect(() => {
    if (selectedSprintId) {
      loadSprintSpecificData(selectedSprintId);
    }
  }, [selectedSprintId]);

  const loadDashboardData = async () => {
    try {
      setError(null);

      // Load all sprints
      const sprintsResponse = await apiService.get('/api/v1/sprints');
      const sprintsData = sprintsResponse.data.data || [];
      setSprints(sprintsData);

      // Find current active sprint
      const activeSprint = sprintsData.find(
        sprint => sprint.status === 'active'
      );

      if (activeSprint) {
        setCurrentSprint(activeSprint);
        setSelectedSprintId(activeSprint.id);
      } else if (sprintsData.length > 0) {
        // If no active sprint, select the most recent one
        const mostRecent = sprintsData.sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate)
        )[0];
        setCurrentSprint(mostRecent);
        setSelectedSprintId(mostRecent.id);
      }

      // Load velocity data for all sprints
      const velocityResponse = await apiService.get('/api/v1/sprints/velocity');
      setVelocityData(velocityResponse.data.data || []);

      logger.info('Progress tracking dashboard data loaded successfully');
    } catch (err) {
      logger.error('Error loading progress tracking dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSprintSpecificData = async sprintId => {
    try {
      // Load burnup data
      const burnupResponse = await apiService.get(
        `/api/v1/sprints/${sprintId}/burnup`
      );
      setBurnupData(burnupResponse.data.data);

      // Load team capacity data
      const capacityResponse = await apiService.get(
        `/api/v1/sprints/${sprintId}/capacity`
      );
      setTeamCapacity(capacityResponse.data.data);

      // Load progress metrics
      const metricsResponse = await apiService.get(
        `/api/v1/sprints/${sprintId}/metrics`
      );
      setProgressMetrics(metricsResponse.data.data);

      logger.info(`Sprint-specific data loaded for sprint ${sprintId}`);
    } catch (err) {
      logger.error(`Error loading sprint-specific data for ${sprintId}:`, err);
      setError('Failed to load sprint data');
    }
  };

  const handleSprintChange = sprintId => {
    const sprint = sprints.find(s => s.id === sprintId);
    setCurrentSprint(sprint);
    setSelectedSprintId(sprintId);
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  if (loading && !currentSprint) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Loading progress tracking dashboard...</div>
      </div>
    );
  }

  if (error && !currentSprint) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-red-600'>{error}</div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Progress Tracking
          </h1>
          <p className='text-muted-foreground'>
            Real-time sprint progress, velocity tracking, and team capacity
            visualization
          </p>
        </div>
        <div className='flex items-center gap-4'>
          {/* Sprint Selector */}
          <Select value={selectedSprintId} onValueChange={handleSprintChange}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Select Sprint' />
            </SelectTrigger>
            <SelectContent>
              {sprints.map(sprint => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  <div className='flex items-center gap-2'>
                    <span>Sprint {sprint.number}</span>
                    <Badge
                      variant={
                        sprint.status === 'active' ? 'default' : 'secondary'
                      }
                      className='text-xs'
                    >
                      {sprint.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button variant='outline' onClick={handleRefresh} disabled={loading}>
            <Activity className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress Metrics Cards */}
      {progressMetrics && (
        <ProgressMetricsCards
          metrics={progressMetrics}
          sprint={currentSprint}
        />
      )}

      {/* Main Dashboard Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Velocity Chart */}
        <div className='lg:col-span-1'>
          <VelocityChart data={velocityData} currentSprint={currentSprint} />
        </div>

        {/* Burnup Chart */}
        <div className='lg:col-span-1'>
          {burnupData ? (
            <BurnupChart data={burnupData} sprint={currentSprint} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5' />
                  Burnup Chart
                </CardTitle>
                <CardDescription>
                  Sprint scope and completion tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-center h-64 text-muted-foreground'>
                  {loading
                    ? 'Loading burnup data...'
                    : 'No burnup data available'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Team Capacity Visualization */}
      {teamCapacity && (
        <TeamCapacityVisualization data={teamCapacity} sprint={currentSprint} />
      )}

      {/* Real-time Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Real-time Status
          </CardTitle>
          <CardDescription>Live updates and system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-3 bg-green-50 rounded-lg'>
              <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
              <div>
                <div className='font-medium text-green-800'>System Online</div>
                <div className='text-sm text-green-600'>
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
              <Clock className='h-4 w-4 text-blue-600' />
              <div>
                <div className='font-medium text-blue-800'>Auto-refresh</div>
                <div className='text-sm text-blue-600'>Every 30 seconds</div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-purple-50 rounded-lg'>
              <Calendar className='h-4 w-4 text-purple-600' />
              <div>
                <div className='font-medium text-purple-800'>Data Range</div>
                <div className='text-sm text-purple-600'>Last 12 sprints</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2 text-red-800'>
              <div className='w-2 h-2 bg-red-500 rounded-full' />
              <span className='font-medium'>Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressTrackingDashboard;
