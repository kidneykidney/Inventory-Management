import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
} from '../ui/dialog';
import { Plus, X } from 'lucide-react';

const UserStoryForm = ({
  isOpen,
  onClose,
  onSubmit,
  story = null,
  epics = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    acceptanceCriteria: [''],
    storyPoints: '',
    priority: 'medium',
    status: 'backlog',
    assignee: '',
    epic: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || '',
        description: story.description || '',
        acceptanceCriteria:
          story.acceptanceCriteria?.length > 0
            ? story.acceptanceCriteria
            : [''],
        storyPoints: story.storyPoints?.toString() || '',
        priority: story.priority || 'medium',
        status: story.status || 'backlog',
        assignee: story.assignee || '',
        epic: story.epic || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        acceptanceCriteria: [''],
        storyPoints: '',
        priority: 'medium',
        status: 'backlog',
        assignee: '',
        epic: '',
      });
    }
    setErrors({});
  }, [story, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (
      formData.storyPoints &&
      (isNaN(parseInt(formData.storyPoints)) ||
        parseInt(formData.storyPoints) < 1)
    ) {
      newErrors.storyPoints = 'Story points must be a positive number';
    }

    const validCriteria = formData.acceptanceCriteria.filter(criteria =>
      criteria.trim()
    );
    if (validCriteria.length === 0) {
      newErrors.acceptanceCriteria =
        'At least one acceptance criteria is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
      acceptanceCriteria: formData.acceptanceCriteria.filter(criteria =>
        criteria.trim()
      ),
      epic: formData.epic === 'no-epic' ? '' : formData.epic,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleAcceptanceCriteriaChange = (index, value) => {
    const newCriteria = [...formData.acceptanceCriteria];
    newCriteria[index] = value;
    setFormData(prev => ({
      ...prev,
      acceptanceCriteria: newCriteria,
    }));

    if (errors.acceptanceCriteria) {
      setErrors(prev => ({
        ...prev,
        acceptanceCriteria: undefined,
      }));
    }
  };

  const addAcceptanceCriteria = () => {
    setFormData(prev => ({
      ...prev,
      acceptanceCriteria: [...prev.acceptanceCriteria, ''],
    }));
  };

  const removeAcceptanceCriteria = index => {
    if (formData.acceptanceCriteria.length > 1) {
      const newCriteria = formData.acceptanceCriteria.filter(
        (_, i) => i !== index
      );
      setFormData(prev => ({
        ...prev,
        acceptanceCriteria: newCriteria,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {story ? 'Edit User Story' : 'Create New User Story'}
          </DialogTitle>
          <DialogDescription>
            {story
              ? 'Update the user story details below.'
              : 'Create a new user story with acceptance criteria and story points.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='As a [role], I want [feature], so that [benefit]'
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className='text-sm text-red-500'>{errors.title}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Provide detailed description of the user story'
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className='text-sm text-red-500'>{errors.description}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Acceptance Criteria *</Label>
            {formData.acceptanceCriteria.map((criteria, index) => (
              <div key={index} className='flex gap-2'>
                <Textarea
                  value={criteria}
                  onChange={e =>
                    handleAcceptanceCriteriaChange(index, e.target.value)
                  }
                  placeholder={'WHEN [condition] THEN [expected result]'}
                  rows={2}
                  className={`flex-1 ${errors.acceptanceCriteria ? 'border-red-500' : ''}`}
                />
                {formData.acceptanceCriteria.length > 1 && (
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => removeAcceptanceCriteria(index)}
                    className='mt-0'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addAcceptanceCriteria}
              className='w-full'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Acceptance Criteria
            </Button>
            {errors.acceptanceCriteria && (
              <p className='text-sm text-red-500'>
                {errors.acceptanceCriteria}
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='storyPoints'>Story Points</Label>
              <Select
                value={formData.storyPoints}
                onValueChange={value => handleInputChange('storyPoints', value)}
              >
                <SelectTrigger
                  className={errors.storyPoints ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder='Select points' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>1</SelectItem>
                  <SelectItem value='2'>2</SelectItem>
                  <SelectItem value='3'>3</SelectItem>
                  <SelectItem value='5'>5</SelectItem>
                  <SelectItem value='8'>8</SelectItem>
                  <SelectItem value='13'>13</SelectItem>
                  <SelectItem value='21'>21</SelectItem>
                </SelectContent>
              </Select>
              {errors.storyPoints && (
                <p className='text-sm text-red-500'>{errors.storyPoints}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={value => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='backlog'>Backlog</SelectItem>
                  <SelectItem value='todo'>To Do</SelectItem>
                  <SelectItem value='in-progress'>In Progress</SelectItem>
                  <SelectItem value='review'>Review</SelectItem>
                  <SelectItem value='done'>Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='assignee'>Assignee</Label>
              <Input
                id='assignee'
                value={formData.assignee}
                onChange={e => handleInputChange('assignee', e.target.value)}
                placeholder='Assign to team member'
              />
            </div>
          </div>

          {epics.length > 0 && (
            <div className='space-y-2'>
              <Label htmlFor='epic'>Epic</Label>
              <Select
                value={formData.epic}
                onValueChange={value => handleInputChange('epic', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select epic (optional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='no-epic'>No Epic</SelectItem>
                  {epics.map(epic => (
                    <SelectItem key={epic.id} value={epic.title}>
                      {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : story
                  ? 'Update Story'
                  : 'Create Story'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserStoryForm;
