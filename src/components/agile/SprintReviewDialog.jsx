import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { CheckCircle, XCircle, Clock, Target } from 'lucide-react';

/**
 * Sprint Review Dialog Component
 * Dialog for conducting sprint reviews with completed work summary
 */
const SprintReviewDialog = ({ open, onOpenChange, sprint, stories }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [stakeholderFeedback, setStakeholderFeedback] = useState('');

  if (!sprint || !stories) {
    return null;
  }

  // Calculate sprint metrics
  const totalStories = stories.length;
  const completedStories = stories.filter(story => story.status === 'done');
  const inProgressStories = stories.filter(
    story => story.status === 'in-progress'
  );
  const reviewStories = stories.filter(story => story.status === 'review');

  const totalPoints = stories.reduce(
    (sum, story) => sum + story.story_points,
    0
  );
  const completedPoints = completedStories.reduce(
    (sum, story) => sum + story.story_points,
    0
  );
  const completionRate =
    totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Group stories by status for display
  const storyGroups = {
    completed: completedStories,
    inProgress: inProgressStories,
    review: reviewStories,
    todo: stories.filter(story => story.status === 'todo'),
  };

  const handleSaveReview = () => {
    // In a real implementation, this would save the review data
    console.log('Sprint Review Data:', {
      sprintId: sprint.id,
      reviewNotes,
      stakeholderFeedback,
      metrics: {
        totalStories,
        completedStories: completedStories.length,
        totalPoints,
        completedPoints,
        completionRate,
      },
    });

    // Reset form and close dialog
    setReviewNotes('');
    setStakeholderFeedback('');
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Sprint {sprint.number} Review</DialogTitle>
          <DialogDescription>
            Review completed work and gather stakeholder feedback
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Sprint Summary Metrics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Target className='h-5 w-5 text-blue-600' />
                  <div>
                    <div className='text-2xl font-bold'>{totalStories}</div>
                    <div className='text-sm text-muted-foreground'>
                      Total Stories
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='text-2xl font-bold text-green-600'>
                      {completedStories.length}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <div className='h-5 w-5 rounded-full bg-blue-600' />
                  <div>
                    <div className='text-2xl font-bold text-blue-600'>
                      {completedPoints}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Points Done
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <div className='h-5 w-5 rounded-full bg-purple-600' />
                  <div>
                    <div className='text-2xl font-bold text-purple-600'>
                      {completionRate}%
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sprint Goal */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Sprint Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>{sprint.goal}</p>
              <div className='mt-2'>
                <Badge
                  className={
                    completionRate >= 80
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {completionRate >= 80
                    ? 'Goal Achieved'
                    : 'Partially Achieved'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Completed Stories */}
          {storyGroups.completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  Completed Stories ({storyGroups.completed.length})
                </CardTitle>
                <CardDescription>
                  Stories that were successfully completed this sprint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {storyGroups.completed.map(story => (
                    <div
                      key={story.id}
                      className='flex items-center justify-between p-3 bg-green-50 rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h4 className='font-medium'>{story.title}</h4>
                          <Badge className={getPriorityColor(story.priority)}>
                            {story.priority}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          {story.description}
                        </p>
                      </div>
                      <div className='text-sm font-medium text-green-600'>
                        {story.story_points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* In Progress/Review Stories */}
          {(storyGroups.inProgress.length > 0 ||
            storyGroups.review.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-yellow-600' />
                  Incomplete Stories (
                  {storyGroups.inProgress.length + storyGroups.review.length})
                </CardTitle>
                <CardDescription>
                  Stories that need to be moved to the next sprint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[...storyGroups.inProgress, ...storyGroups.review].map(
                    story => (
                      <div
                        key={story.id}
                        className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-medium'>{story.title}</h4>
                            <Badge className={getPriorityColor(story.priority)}>
                              {story.priority}
                            </Badge>
                            <Badge variant='outline'>{story.status}</Badge>
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            {story.description}
                          </p>
                        </div>
                        <div className='text-sm font-medium text-yellow-600'>
                          {story.story_points} pts
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Notes */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Review Notes</CardTitle>
              <CardDescription>
                Document key achievements, challenges, and observations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='What went well? What challenges did we face? What did we learn?'
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Stakeholder Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Stakeholder Feedback</CardTitle>
              <CardDescription>
                Capture feedback from product owners and stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='Stakeholder comments, suggestions, and feedback on delivered features...'
                value={stakeholderFeedback}
                onChange={e => setStakeholderFeedback(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveReview}>Save Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SprintReviewDialog;
