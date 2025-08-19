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
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { apiService } from '../../api/apiService';
import { logger } from '../../utils/logger';

/**
 * Sprint Planning Table Component
 * Interactive table for managing sprint stories and planning
 */
const SprintPlanningTable = ({ sprint, stories, onStoriesUpdate }) => {
  const [availableStories, setAvailableStories] = useState([]);
  const [selectedStories, setSelectedStories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [showAddStories, setShowAddStories] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load available stories for planning
  useEffect(() => {
    loadAvailableStories();
  }, [sprint]);

  const loadAvailableStories = async () => {
    try {
      const response = await apiService.get('/api/v1/stories');
      const allStories = response.data.data || [];

      // Filter stories that are in backlog and not assigned to current sprint
      const available = allStories.filter(
        story =>
          story.status === 'backlog' &&
          (!story.sprint_id || story.sprint_id !== sprint.id)
      );

      setAvailableStories(available);
    } catch (err) {
      logger.error('Error loading available stories:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const currentPoints = stories.reduce(
        (sum, story) => sum + story.story_points,
        0
      );
      const remainingCapacity = sprint.capacity - currentPoints;

      if (remainingCapacity <= 0) {
        setRecommendations({
          recommendedStories: [],
          message: 'Sprint is at full capacity',
        });
        return;
      }

      const response = await apiService.post(
        '/api/v1/sprints/planning/recommend',
        {
          capacity: remainingCapacity,
          excludeStoryIds: stories.map(s => s.id),
        }
      );

      setRecommendations(response.data.data);
    } catch (err) {
      logger.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStories = async () => {
    if (selectedStories.length === 0) {
      return;
    }

    try {
      await apiService.post(`/api/v1/sprints/${sprint.id}/allocate`, {
        storyIds: selectedStories,
      });

      setSelectedStories([]);
      setShowAddStories(false);
      await onStoriesUpdate();
      await loadAvailableStories();

      logger.info(`${selectedStories.length} stories added to sprint`);
    } catch (err) {
      logger.error('Error adding stories to sprint:', err);
    }
  };

  const handleRemoveStory = async storyId => {
    try {
      await apiService.delete(
        `/api/v1/sprints/${sprint.id}/stories/${storyId}`
      );
      await onStoriesUpdate();
      await loadAvailableStories();

      logger.info('Story removed from sprint');
    } catch (err) {
      logger.error('Error removing story from sprint:', err);
    }
  };

  const handleUpdateStoryStatus = async (storyId, newStatus) => {
    try {
      await apiService.put(`/api/v1/stories/${storyId}`, { status: newStatus });
      await onStoriesUpdate();

      logger.info('Story status updated');
    } catch (err) {
      logger.error('Error updating story status:', err);
    }
  };

  // Filter and sort available stories
  const getFilteredStories = () => {
    let filtered = availableStories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        story =>
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(story => story.priority === filterPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'points':
          return a.story_points - b.story_points;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStories = getFilteredStories();
  const selectedStoryPoints = selectedStories.reduce((sum, storyId) => {
    const story = availableStories.find(s => s.id === storyId);
    return sum + (story ? story.story_points : 0);
  }, 0);

  return (
    <div className='space-y-6'>
      {/* Current Sprint Stories */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Sprint {sprint.number} Stories</CardTitle>
              <CardDescription>Stories assigned to this sprint</CardDescription>
            </div>
            <Dialog open={showAddStories} onOpenChange={setShowAddStories}>
              <DialogTrigger asChild>
                <Button onClick={loadRecommendations}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Stories
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle>Add Stories to Sprint</DialogTitle>
                  <DialogDescription>
                    Select stories to add to Sprint {sprint.number}
                  </DialogDescription>
                </DialogHeader>

                {/* Filters */}
                <div className='flex gap-4 mb-4'>
                  <div className='flex-1'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search stories...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className='pl-10'
                      />
                    </div>
                  </div>
                  <Select
                    value={filterPriority}
                    onValueChange={setFilterPriority}
                  >
                    <SelectTrigger className='w-32'>
                      <Filter className='h-4 w-4 mr-2' />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Priority</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='medium'>Medium</SelectItem>
                      <SelectItem value='low'>Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className='w-32'>
                      <ArrowUpDown className='h-4 w-4 mr-2' />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='priority'>Priority</SelectItem>
                      <SelectItem value='points'>Points</SelectItem>
                      <SelectItem value='title'>Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recommendations */}
                {recommendations && (
                  <div className='mb-4 p-4 bg-blue-50 rounded-lg'>
                    <h4 className='font-medium text-blue-900 mb-2'>
                      Recommended Stories
                    </h4>
                    {recommendations.recommendedStories.length > 0 ? (
                      <div className='text-sm text-blue-800'>
                        {recommendations.recommendedStories.length} stories
                        recommended ({recommendations.totalStoryPoints} points,{' '}
                        {recommendations.capacityUtilization}% capacity)
                      </div>
                    ) : (
                      <div className='text-sm text-blue-800'>
                        {recommendations.message ||
                          'No recommendations available'}
                      </div>
                    )}
                  </div>
                )}

                {/* Available Stories Table */}
                <div className='border rounded-lg'>
                  <div className='max-h-96 overflow-y-auto'>
                    <table className='w-full'>
                      <thead className='bg-gray-50 sticky top-0'>
                        <tr>
                          <th className='w-12 p-3 text-left'>
                            <input
                              type='checkbox'
                              checked={
                                selectedStories.length ===
                                  filteredStories.length &&
                                filteredStories.length > 0
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedStories(
                                    filteredStories.map(s => s.id)
                                  );
                                } else {
                                  setSelectedStories([]);
                                }
                              }}
                            />
                          </th>
                          <th className='p-3 text-left font-medium'>Story</th>
                          <th className='p-3 text-left font-medium'>
                            Priority
                          </th>
                          <th className='p-3 text-left font-medium'>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStories.map(story => (
                          <tr
                            key={story.id}
                            className='border-t hover:bg-gray-50'
                          >
                            <td className='p-3'>
                              <input
                                type='checkbox'
                                checked={selectedStories.includes(story.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedStories([
                                      ...selectedStories,
                                      story.id,
                                    ]);
                                  } else {
                                    setSelectedStories(
                                      selectedStories.filter(
                                        id => id !== story.id
                                      )
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td className='p-3'>
                              <div>
                                <div className='font-medium'>{story.title}</div>
                                <div className='text-sm text-muted-foreground'>
                                  {story.description}
                                </div>
                              </div>
                            </td>
                            <td className='p-3'>
                              <Badge
                                className={getPriorityColor(story.priority)}
                              >
                                {story.priority}
                              </Badge>
                            </td>
                            <td className='p-3 font-medium'>
                              {story.story_points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <DialogFooter>
                  <div className='flex items-center justify-between w-full'>
                    <div className='text-sm text-muted-foreground'>
                      {selectedStories.length} stories selected (
                      {selectedStoryPoints} points)
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => setShowAddStories(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddStories}
                        disabled={selectedStories.length === 0}
                      >
                        Add {selectedStories.length} Stories
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {stories.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No stories assigned to this sprint yet
            </div>
          ) : (
            <div className='space-y-4'>
              {stories.map(story => (
                <div
                  key={story.id}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h4 className='font-medium'>{story.title}</h4>
                      <Badge className={getPriorityColor(story.priority)}>
                        {story.priority}
                      </Badge>
                      <span className='text-sm text-muted-foreground'>
                        {story.story_points} points
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {story.description}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Select
                      value={story.status}
                      onValueChange={value =>
                        handleUpdateStoryStatus(story.id, value)
                      }
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='todo'>To Do</SelectItem>
                        <SelectItem value='in-progress'>In Progress</SelectItem>
                        <SelectItem value='review'>Review</SelectItem>
                        <SelectItem value='done'>Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRemoveStory(story.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SprintPlanningTable;
