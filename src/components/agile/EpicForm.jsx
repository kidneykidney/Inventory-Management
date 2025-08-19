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

const EpicForm = ({
  isOpen,
  onClose,
  onSubmit,
  epic = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    businessValue: '',
    status: 'planned',
    targetSprint: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (epic) {
      setFormData({
        title: epic.title || '',
        description: epic.description || '',
        businessValue: epic.businessValue || '',
        status: epic.status || 'planned',
        targetSprint: epic.targetSprint || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        businessValue: '',
        status: 'planned',
        targetSprint: '',
      });
    }
    setErrors({});
  }, [epic, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.targetSprint && isNaN(parseInt(formData.targetSprint))) {
      newErrors.targetSprint = 'Target sprint must be a number';
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
      targetSprint: formData.targetSprint
        ? parseInt(formData.targetSprint)
        : null,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{epic ? 'Edit Epic' : 'Create New Epic'}</DialogTitle>
          <DialogDescription>
            {epic
              ? 'Update the epic details below.'
              : 'Create a new epic to organize related user stories.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='Enter epic title'
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
              placeholder='Describe the epic and its goals'
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className='text-sm text-red-500'>{errors.description}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='businessValue'>Business Value</Label>
            <Textarea
              id='businessValue'
              value={formData.businessValue}
              onChange={e => handleInputChange('businessValue', e.target.value)}
              placeholder='Explain the business value this epic provides'
              rows={2}
            />
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
                  <SelectItem value='planned'>Planned</SelectItem>
                  <SelectItem value='in-progress'>In Progress</SelectItem>
                  <SelectItem value='complete'>Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='targetSprint'>Target Sprint</Label>
              <Input
                id='targetSprint'
                type='number'
                value={formData.targetSprint}
                onChange={e =>
                  handleInputChange('targetSprint', e.target.value)
                }
                placeholder='Sprint number'
                min='1'
                className={errors.targetSprint ? 'border-red-500' : ''}
              />
              {errors.targetSprint && (
                <p className='text-sm text-red-500'>{errors.targetSprint}</p>
              )}
            </div>
          </div>

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
              {isLoading ? 'Saving...' : epic ? 'Update Epic' : 'Create Epic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EpicForm;
