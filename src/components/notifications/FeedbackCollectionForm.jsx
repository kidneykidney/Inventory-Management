import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Star, MessageSquare, Send, Plus } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useToast } from '../../hooks/use-toast';

const FeedbackCollectionForm = ({ sprintId, onFeedbackSubmitted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    rating: 0,
    title: '',
    description: '',
    priority: 'medium',
    anonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const feedbackTypes = [
    { value: 'sprint_review', label: 'Sprint Review' },
    { value: 'retrospective', label: 'Sprint Retrospective' },
    { value: 'process_improvement', label: 'Process Improvement' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'general', label: 'General Feedback' },
  ];

  const categories = [
    { value: 'team_performance', label: 'Team Performance' },
    { value: 'communication', label: 'Communication' },
    { value: 'tools_process', label: 'Tools & Process' },
    { value: 'planning', label: 'Sprint Planning' },
    { value: 'delivery', label: 'Delivery Quality' },
    { value: 'collaboration', label: 'Collaboration' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    {
      value: 'medium',
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-800',
    },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRatingChange = rating => {
    setFormData(prev => ({
      ...prev,
      rating,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.type || !formData.title || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        ...formData,
        sprintId,
        submittedAt: new Date().toISOString(),
      };

      await notificationService.submitFeedback(feedbackData);

      toast({
        title: 'Success',
        description: 'Feedback submitted successfully',
      });

      // Reset form
      setFormData({
        type: '',
        category: '',
        rating: 0,
        title: '',
        description: '',
        priority: 'medium',
        anonymous: false,
      });

      setIsOpen(false);

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className='flex space-x-1'>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type='button'
            onClick={() => !readonly && onRatingChange(star)}
            className={`${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } transition-transform`}
            disabled={readonly}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className='flex items-center space-x-2'>
          <MessageSquare className='h-4 w-4' />
          <span>Provide Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <MessageSquare className='h-5 w-5' />
            <span>Submit Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts and suggestions about the
            current sprint or overall process.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='type'>Feedback Type *</Label>
              <Select
                value={formData.type}
                onValueChange={value => handleInputChange('type', value)}
              >
                <SelectTrigger aria-label="Feedback Type">
                  <SelectValue placeholder='Select feedback type' />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category'>Category</Label>
              <Select
                value={formData.category}
                onValueChange={value => handleInputChange('category', value)}
              >
                <SelectTrigger aria-label="Category">
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='rating'>Overall Rating</Label>
            <div className='flex items-center space-x-3'>
              <StarRating
                rating={formData.rating}
                onRatingChange={handleRatingChange}
              />
              <span className='text-sm text-muted-foreground'>
                {formData.rating > 0 ? `${formData.rating}/5` : 'No rating'}
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='Brief summary of your feedback'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Provide detailed feedback, suggestions, or concerns...'
              rows={4}
              required
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => handleInputChange('priority', value)}
              >
                <SelectTrigger aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className='flex items-center space-x-2'>
                        <Badge className={priority.color}>
                          {priority.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center space-x-2 pt-6'>
              <input
                type='checkbox'
                id='anonymous'
                checked={formData.anonymous}
                onChange={e => handleInputChange('anonymous', e.target.checked)}
                className='rounded border-gray-300'
              />
              <Label htmlFor='anonymous' className='text-sm'>
                Submit anonymously
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <Send className='h-4 w-4' />
                  <span>Submit Feedback</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackCollectionForm;
