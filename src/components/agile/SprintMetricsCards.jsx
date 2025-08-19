import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Target, Clock, Users } from 'lucide-react';

/**
 * Sprint Metrics Cards Component
 * Displays key sprint metrics in card format
 */
const SprintMetricsCards = ({ currentSprint, velocity, stories }) => {
  // Calculate metrics
  const totalStoryPoints = stories.reduce(
    (sum, story) => sum + story.story_points,
    0
  );
  const completedStoryPoints = stories
    .filter(story => story.status === 'done')
    .reduce((sum, story) => sum + story.story_points, 0);

  const completionRate =
    totalStoryPoints > 0
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
      : 0;
  const remainingPoints = totalStoryPoints - completedStoryPoints;

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!currentSprint || !currentSprint.endDate) {
      return 0;
    }
    const endDate = new Date(currentSprint.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  // Story status distribution
  const storyStatusCounts = {
    todo: stories.filter(s => s.status === 'todo').length,
    'in-progress': stories.filter(s => s.status === 'in-progress').length,
    review: stories.filter(s => s.status === 'review').length,
    done: stories.filter(s => s.status === 'done').length,
  };

  const metrics = [
    {
      title: 'Team Velocity',
      value: velocity,
      description: 'Average story points per sprint',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Sprint Progress',
      value: `${completionRate}%`,
      description: `${completedStoryPoints}/${totalStoryPoints} story points`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progress: completionRate,
    },
    {
      title: 'Days Remaining',
      value: daysRemaining,
      description: currentSprint
        ? `Until ${new Date(currentSprint.endDate).toLocaleDateString()}`
        : 'No active sprint',
      icon: Clock,
      color: daysRemaining <= 2 ? 'text-red-600' : 'text-orange-600',
      bgColor: daysRemaining <= 2 ? 'bg-red-50' : 'bg-orange-50',
    },
    {
      title: 'Active Stories',
      value: storyStatusCounts['in-progress'],
      description: `${stories.length} total stories`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {metrics.map((metric, index) => {
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
              <div className='text-2xl font-bold'>{metric.value}</div>
              <p className='text-xs text-muted-foreground'>
                {metric.description}
              </p>

              {/* Progress bar for sprint progress */}
              {metric.progress !== undefined && (
                <div className='mt-3'>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-green-600 h-2 rounded-full transition-all duration-300'
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Current Sprint Info Card */}
      {currentSprint && (
        <Card className='md:col-span-2 lg:col-span-4'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  Sprint {currentSprint.number}
                  <Badge
                    className={
                      currentSprint.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : currentSprint.status === 'planning'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {currentSprint.status}
                  </Badge>
                </CardTitle>
                <CardDescription className='mt-1'>
                  {currentSprint.goal}
                </CardDescription>
              </div>
              <div className='text-right'>
                <div className='text-sm text-muted-foreground'>Capacity</div>
                <div className='text-lg font-semibold'>
                  {totalStoryPoints}/{currentSprint.capacity} points
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-600'>
                  {storyStatusCounts.todo}
                </div>
                <div className='text-sm text-muted-foreground'>To Do</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {storyStatusCounts['in-progress']}
                </div>
                <div className='text-sm text-muted-foreground'>In Progress</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {storyStatusCounts.review}
                </div>
                <div className='text-sm text-muted-foreground'>Review</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {storyStatusCounts.done}
                </div>
                <div className='text-sm text-muted-foreground'>Done</div>
              </div>
            </div>

            {/* Sprint dates */}
            <div className='mt-4 pt-4 border-t'>
              <div className='flex justify-between text-sm text-muted-foreground'>
                <span>
                  Start:{' '}
                  {new Date(currentSprint.startDate).toLocaleDateString()}
                </span>
                <span>
                  End: {new Date(currentSprint.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SprintMetricsCards;
