import React, { useState } from 'react';
import { Plus, Code, AlertTriangle, Clock } from 'lucide-react';
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
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

/**
 * Technical Debt Form component for creating technical debt stories
 */
const TechnicalDebtForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    effort: 1,
    impact: 'medium',
    assignee: '',
    dueDate: '',
    tags: '',
    relatedFiles: '',
    businessJustification: '',
    acceptanceCriteria: '',
    definition: '',
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'UI Framework',
    'Backend',
    'Testing',
    'Performance',
    'Security',
    'Documentation',
    'Architecture',
    'Dependencies',
    'Code Quality',
    'Database',
  ];

  const teams = [
    'Frontend Team',
    'Backend Team',
    'QA Team',
    'DevOps Team',
    'Full Stack Team',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.businessJustification.trim()) {
      newErrors.businessJustification = 'Business justification is required';
    }

    if (!formData.acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = 'Acceptance criteria is required';
    }

    if (formData.effort < 1 || formData.effort > 21) {
      newErrors.effort = 'Effort must be between 1 and 21 story points';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (validateForm()) {
      const technicalDebtStory = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag),
        relatedFiles: formData.relatedFiles
          .split('\n')
          .map(file => file.trim())
          .filter(file => file),
        createdDate: new Date().toISOString().split('T')[0],
        status: 'todo',
        type: 'technical-debt',
      };

      onSubmit && onSubmit(technicalDebtStory);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      effort: 1,
      impact: 'medium',
      assignee: '',
      dueDate: '',
      tags: '',
      relatedFiles: '',
      businessJustification: '',
      acceptanceCriteria: '',
      definition: '',
    });
    setErrors({});
  };

  const getPriorityIcon = priority => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className='h-4 w-4 text-red-600' />;
      case 'medium':
        return <Clock className='h-4 w-4 text-yellow-600' />;
      case 'low':
        return <Code className='h-4 w-4 text-green-600' />;
      default:
        return <Code className='h-4 w-4' />;
    }
  };

  const getEffortDescription = effort => {
    if (effort <= 3) return 'Small - Can be completed in a few hours';
    if (effort <= 8) return 'Medium - Requires 1-2 days of work';
    if (effort <= 13) return 'Large - Requires 3-5 days of work';
    return 'Extra Large - Requires more than a week';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Code className='h-5 w-5' />
            Create Technical Debt Story
          </DialogTitle>
          <DialogDescription>
            Document technical debt that needs to be addressed in future sprints
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left Column */}
            <div className='space-y-4'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Title *</Label>
                    <Input
                      id='title'
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      placeholder='Brief description of the technical debt'
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <div className='text-sm text-destructive'>
                        {errors.title}
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description'>Description *</Label>
                    <Textarea
                      id='description'
                      value={formData.description}
                      onChange={e =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder='Detailed description of the technical debt and its impact'
                      rows={4}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && (
                      <div className='text-sm text-destructive'>
                        {errors.description}
                      </div>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='category'>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={value =>
                          handleInputChange('category', value)
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.category ? 'border-destructive' : ''
                          }
                        >
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <div className='text-sm text-destructive'>
                          {errors.category}
                        </div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='assignee'>Assignee</Label>
                      <Select
                        value={formData.assignee}
                        onValueChange={value =>
                          handleInputChange('assignee', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select team' />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map(team => (
                            <SelectItem key={team} value={team}>
                              {team}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Priority and Effort */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Priority & Effort</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='priority'>Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={value =>
                          handleInputChange('priority', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='high'>
                            <div className='flex items-center gap-2'>
                              <AlertTriangle className='h-4 w-4 text-red-600' />
                              High
                            </div>
                          </SelectItem>
                          <SelectItem value='medium'>
                            <div className='flex items-center gap-2'>
                              <Clock className='h-4 w-4 text-yellow-600' />
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem value='low'>
                            <div className='flex items-center gap-2'>
                              <Code className='h-4 w-4 text-green-600' />
                              Low
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='impact'>Impact</Label>
                      <Select
                        value={formData.impact}
                        onValueChange={value =>
                          handleInputChange('impact', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='high'>High</SelectItem>
                          <SelectItem value='medium'>Medium</SelectItem>
                          <SelectItem value='low'>Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='effort'>Effort (SP)</Label>
                      <Input
                        id='effort'
                        type='number'
                        min='1'
                        max='21'
                        value={formData.effort}
                        onChange={e =>
                          handleInputChange(
                            'effort',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className={errors.effort ? 'border-destructive' : ''}
                      />
                      {errors.effort && (
                        <div className='text-sm text-destructive'>
                          {errors.effort}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='text-sm text-muted-foreground'>
                    {getEffortDescription(formData.effort)}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='dueDate'>Target Due Date</Label>
                    <Input
                      id='dueDate'
                      type='date'
                      value={formData.dueDate}
                      onChange={e =>
                        handleInputChange('dueDate', e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className='space-y-4'>
              {/* Business Context */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Business Context</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='businessJustification'>
                      Business Justification *
                    </Label>
                    <Textarea
                      id='businessJustification'
                      value={formData.businessJustification}
                      onChange={e =>
                        handleInputChange(
                          'businessJustification',
                          e.target.value
                        )
                      }
                      placeholder='Why is this technical debt important to address? What business value will be gained?'
                      rows={3}
                      className={
                        errors.businessJustification ? 'border-destructive' : ''
                      }
                    />
                    {errors.businessJustification && (
                      <div className='text-sm text-destructive'>
                        {errors.businessJustification}
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='acceptanceCriteria'>
                      Acceptance Criteria *
                    </Label>
                    <Textarea
                      id='acceptanceCriteria'
                      value={formData.acceptanceCriteria}
                      onChange={e =>
                        handleInputChange('acceptanceCriteria', e.target.value)
                      }
                      placeholder='What needs to be done to consider this technical debt resolved?'
                      rows={4}
                      className={
                        errors.acceptanceCriteria ? 'border-destructive' : ''
                      }
                    />
                    {errors.acceptanceCriteria && (
                      <div className='text-sm text-destructive'>
                        {errors.acceptanceCriteria}
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='definition'>Definition of Done</Label>
                    <Textarea
                      id='definition'
                      value={formData.definition}
                      onChange={e =>
                        handleInputChange('definition', e.target.value)
                      }
                      placeholder='Additional criteria that must be met (tests, documentation, etc.)'
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Technical Details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='relatedFiles'>Related Files</Label>
                    <Textarea
                      id='relatedFiles'
                      value={formData.relatedFiles}
                      onChange={e =>
                        handleInputChange('relatedFiles', e.target.value)
                      }
                      placeholder='List files that need to be modified (one per line)'
                      rows={4}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='tags'>Tags</Label>
                    <Input
                      id='tags'
                      value={formData.tags}
                      onChange={e => handleInputChange('tags', e.target.value)}
                      placeholder='Comma-separated tags (e.g., ui, migration, performance)'
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className='mt-6'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>
              <Plus className='mr-2 h-4 w-4' />
              Create Technical Debt Story
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicalDebtForm;
