import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import SprintMetricsCards from './SprintMetricsCards';
import BurndownChart from './BurndownChart';
import SprintPlanningTable from './SprintPlanningTable';
import SprintReviewDialog from './SprintReviewDialog';
import SprintRetrospectiveDialog from './SprintRetrospectiveDialog';
import { apiService } from '../../api/apiService';
import { logger } from '../../utils/logger';

/**
 * Sprint Planning Dashboard Component
 * Main dashboard for sprint planning with metrics, burndown charts, and planning tools
 */
const SprintPlanningDashboard = () => {
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [stories, setStories] = useState([]);
  const [burndownData, setBurndownData] = useState(null);
  const [velocity, setVelocity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showRetrospective, setShowRetrospective] = useState(false);

  // Form states
  const [newSprint, setNewSprint] = useState({
    number: '',
    goal: '',
    capacity: '',
    startDate: '',
    endDate: '',
  });

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sprints
      const sprintsResponse = await apiService.get('/api/v1/sprints');
      const sprintsData = sprintsResponse.data.data || [];
      setSprints(sprintsData);

      // Find current active sprint
      const activeSprint = sprintsData.find(
        sprint => sprint.status === 'active'
      );
      if (activeSprint) {
        setCurrentSprint(activeSprint);

        // Load sprint stories
        const storiesResponse = await apiService.get(
          `/api/v1/sprints/${activeSprint.id}/stories`
        );
        setStories(storiesResponse.data.data.stories || []);

        // Load burndown data
        const burndownResponse = await apiService.get(
          `/api/v1/sprints/${activeSprint.id}/burndown`
        );
        setBurndownData(burndownResponse.data.data);
      }

      // Load team velocity
      const velocityResponse = await apiService.get(
        '/api/v1/sprints/planning/velocity'
      );
      setVelocity(velocityResponse.data.data.averageVelocity || 0);

      logger.info('Sprint planning dashboard data loaded successfully');
    } catch (err) {
      logger.error('Error loading sprint planning dashboard:', err);
      setError('Failed to load sprint planning data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async e => {
    e.preventDefault();
    try {
      const sprintData = {
        ...newSprint,
        number: parseInt(newSprint.number),
        capacity: parseInt(newSprint.capacity),
        status: 'planning',
      };

      await apiService.post('/api/v1/sprints', sprintData);

      setShowCreateSprint(false);
      setNewSprint({
        number: '',
        goal: '',
        capacity: '',
        startDate: '',
        endDate: '',
      });

      await loadDashboardData();
      logger.info('Sprint created successfully');
    } catch (err) {
      logger.error('Error creating sprint:', err);
      setError('Failed to create sprint');
    }
  };

  const handleStartSprint = async sprintId => {
    try {
      await apiService.post(`/api/v1/sprints/${sprintId}/start`);
      await loadDashboardData();
      logger.info('Sprint started successfully');
    } catch (err) {
      logger.error('Error starting sprint:', err);
      setError('Failed to start sprint');
    }
  };

  const handleCompleteSprint = async sprintId => {
    try {
      await apiService.post(`/api/v1/sprints/${sprintId}/complete`);
      await loadDashboardData();
      logger.info('Sprint completed successfully');
    } catch (err) {
      logger.error('Error completing sprint:', err);
      setError('Failed to complete sprint');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'complete':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Loading sprint planning dashboard...</div>
      </div>
    );
  }

  if (error) {
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
          <h1 className='text-3xl font-bold tracking-tight'>Sprint Planning</h1>
          <p className='text-muted-foreground'>
            Manage sprints, track progress, and plan iterations
          </p>
        </div>
        <div className='flex gap-2'>
          <Dialog open={showCreateSprint} onOpenChange={setShowCreateSprint}>
            <DialogTrigger asChild>
              <Button data-testid='create-sprint-button'>Create Sprint</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Create New Sprint</DialogTitle>
                <DialogDescription>
                  Set up a new sprint with goals and capacity planning.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSprint} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium'>Sprint Number</label>
                    <Input
                      type='number'
                      value={newSprint.number}
                      onChange={e =>
                        setNewSprint({ ...newSprint, number: e.target.value })
                      }
                      placeholder='1'
                      data-testid='sprint-number-input'
                      required
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>
                      Capacity (Points)
                    </label>
                    <Input
                      type='number'
                      value={newSprint.capacity}
                      onChange={e =>
                        setNewSprint({ ...newSprint, capacity: e.target.value })
                      }
                      placeholder={velocity.toString()}
                      data-testid='sprint-capacity-input'
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium'>Sprint Goal</label>
                  <Textarea
                    value={newSprint.goal}
                    onChange={e =>
                      setNewSprint({ ...newSprint, goal: e.target.value })
                    }
                    placeholder='What will this sprint achieve?'
                    data-testid='sprint-goal-input'
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium'>Start Date</label>
                    <Input
                      type='date'
                      value={newSprint.startDate}
                      onChange={e =>
                        setNewSprint({
                          ...newSprint,
                          startDate: e.target.value,
                        })
                      }
                      data-testid='sprint-start-date-input'
                      required
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>End Date</label>
                    <Input
                      type='date'
                      value={newSprint.endDate}
                      onChange={e =>
                        setNewSprint({ ...newSprint, endDate: e.target.value })
                      }
                      data-testid='sprint-end-date-input'
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowCreateSprint(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' data-testid='create-sprint-submit'>
                    Create Sprint
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {currentSprint && (
            <>
              <Button
                variant='outline'
                onClick={() => setShowReview(true)}
                disabled={currentSprint.status !== 'active'}
              >
                Sprint Review
              </Button>
              <Button
                variant='outline'
                onClick={() => setShowRetrospective(true)}
                disabled={currentSprint.status !== 'complete'}
              >
                Retrospective
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <SprintMetricsCards
        currentSprint={currentSprint}
        velocity={velocity}
        stories={stories}
      />

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Sprint List */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle>Sprints</CardTitle>
              <CardDescription>All sprints and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {sprints.map(sprint => (
                  <div
                    key={sprint.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>
                          Sprint {sprint.number}
                        </span>
                        <Badge className={getStatusColor(sprint.status)}>
                          {sprint.status}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {sprint.goal}
                      </p>
                      <div className='text-xs text-muted-foreground mt-1'>
                        {sprint.totalStoryPoints || 0}/{sprint.capacity} points
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      {sprint.status === 'planning' && (
                        <Button
                          size='sm'
                          onClick={() => handleStartSprint(sprint.id)}
                        >
                          Start
                        </Button>
                      )}
                      {sprint.status === 'active' && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleCompleteSprint(sprint.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Burndown Chart */}
        <div className='lg:col-span-2'>
          {currentSprint && burndownData ? (
            <BurndownChart data={burndownData} sprint={currentSprint} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart</CardTitle>
                <CardDescription>Sprint progress visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-center h-64 text-muted-foreground'>
                  {currentSprint
                    ? 'Loading burndown data...'
                    : 'No active sprint'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sprint Planning Table */}
      {currentSprint && (
        <SprintPlanningTable
          sprint={currentSprint}
          stories={stories}
          onStoriesUpdate={loadDashboardData}
        />
      )}

      {/* Dialogs */}
      <SprintReviewDialog
        open={showReview}
        onOpenChange={setShowReview}
        sprint={currentSprint}
        stories={stories}
      />

      <SprintRetrospectiveDialog
        open={showRetrospective}
        onOpenChange={setShowRetrospective}
        sprint={currentSprint}
      />
    </div>
  );
};

export default SprintPlanningDashboard;
