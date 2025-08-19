import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, X } from 'lucide-react';

const SprintRetrospectiveForm = ({
  sprintId,
  onSubmit,
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    sprintId: sprintId || '',
    whatWentWell: initialData?.whatWentWell || [''],
    whatCouldImprove: initialData?.whatCouldImprove || [''],
    actionItems: initialData?.actionItems || [
      { description: '', assignee: '', priority: 'medium' },
    ],
    teamMorale: initialData?.teamMorale || 5,
    velocityRating: initialData?.velocityRating || 5,
    qualityRating: initialData?.qualityRating || 5,
    communicationRating: initialData?.communicationRating || 5,
    additionalNotes: initialData?.additionalNotes || '',
  });

  const addItem = field => {
    setFormData(prev => ({
      ...prev,
      [field]: [
        ...prev[field],
        field === 'actionItems'
          ? { description: '', assignee: '', priority: 'medium' }
          : '',
      ],
    }));
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const updateActionItem = (index, key, value) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      whatWentWell: formData.whatWentWell.filter(item => item.trim()),
      whatCouldImprove: formData.whatCouldImprove.filter(item => item.trim()),
      actionItems: formData.actionItems.filter(item => item.description.trim()),
    };
    onSubmit(cleanedData);
  };

  const RatingInput = ({ label, value, onChange }) => (
    <div className='space-y-2'>
      <Label>{label} (1-10)</Label>
      <div className='flex items-center space-x-2'>
        <Input
          type='range'
          min='1'
          max='10'
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className='flex-1'
        />
        <Badge variant='outline' className='w-8 text-center'>
          {value}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader>
        <CardTitle>Sprint Retrospective - Sprint {sprintId}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* What Went Well */}
          <div className='space-y-3'>
            <Label className='text-lg font-semibold text-green-700'>
              What Went Well
            </Label>
            {formData.whatWentWell.map((item, index) => (
              <div key={index} className='flex items-center space-x-2'>
                <Textarea
                  value={item}
                  onChange={e =>
                    updateItem('whatWentWell', index, e.target.value)
                  }
                  placeholder='Describe something that went well...'
                  className='flex-1'
                  rows={2}
                />
                {formData.whatWentWell.length > 1 && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => removeItem('whatWentWell', index)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => addItem('whatWentWell')}
              className='w-full'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Item
            </Button>
          </div>

          {/* What Could Improve */}
          <div className='space-y-3'>
            <Label className='text-lg font-semibold text-orange-700'>
              What Could Improve
            </Label>
            {formData.whatCouldImprove.map((item, index) => (
              <div key={index} className='flex items-center space-x-2'>
                <Textarea
                  value={item}
                  onChange={e =>
                    updateItem('whatCouldImprove', index, e.target.value)
                  }
                  placeholder='Describe something that could be improved...'
                  className='flex-1'
                  rows={2}
                />
                {formData.whatCouldImprove.length > 1 && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => removeItem('whatCouldImprove', index)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => addItem('whatCouldImprove')}
              className='w-full'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Item
            </Button>
          </div>

          {/* Action Items */}
          <div className='space-y-3'>
            <Label className='text-lg font-semibold text-blue-700'>
              Action Items
            </Label>
            {formData.actionItems.map((item, index) => (
              <Card key={index} className='p-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='md:col-span-2'>
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={e =>
                        updateActionItem(index, 'description', e.target.value)
                      }
                      placeholder='Describe the action item...'
                      rows={2}
                    />
                  </div>
                  <div className='space-y-4'>
                    <div>
                      <Label>Assignee</Label>
                      <Input
                        value={item.assignee}
                        onChange={e =>
                          updateActionItem(index, 'assignee', e.target.value)
                        }
                        placeholder='Who will handle this?'
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <select
                        value={item.priority}
                        onChange={e =>
                          updateActionItem(index, 'priority', e.target.value)
                        }
                        className='w-full p-2 border rounded-md'
                      >
                        <option value='low'>Low</option>
                        <option value='medium'>Medium</option>
                        <option value='high'>High</option>
                      </select>
                    </div>
                  </div>
                </div>
                {formData.actionItems.length > 1 && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => removeItem('actionItems', index)}
                    className='mt-2'
                  >
                    <X className='h-4 w-4 mr-2' />
                    Remove
                  </Button>
                )}
              </Card>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => addItem('actionItems')}
              className='w-full'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Action Item
            </Button>
          </div>

          {/* Ratings */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <RatingInput
              label='Team Morale'
              value={formData.teamMorale}
              onChange={value =>
                setFormData(prev => ({ ...prev, teamMorale: value }))
              }
            />
            <RatingInput
              label='Velocity Rating'
              value={formData.velocityRating}
              onChange={value =>
                setFormData(prev => ({ ...prev, velocityRating: value }))
              }
            />
            <RatingInput
              label='Quality Rating'
              value={formData.qualityRating}
              onChange={value =>
                setFormData(prev => ({ ...prev, qualityRating: value }))
              }
            />
            <RatingInput
              label='Communication Rating'
              value={formData.communicationRating}
              onChange={value =>
                setFormData(prev => ({ ...prev, communicationRating: value }))
              }
            />
          </div>

          {/* Additional Notes */}
          <div className='space-y-2'>
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.additionalNotes}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  additionalNotes: e.target.value,
                }))
              }
              placeholder='Any additional observations or notes...'
              rows={4}
            />
          </div>

          <Button type='submit' className='w-full'>
            Save Retrospective
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SprintRetrospectiveForm;
