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
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Plus, Trash2, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';

/**
 * Sprint Retrospective Dialog Component
 * Dialog for conducting sprint retrospectives with structured feedback
 */
const SprintRetrospectiveDialog = ({ open, onOpenChange, sprint }) => {
  const [wentWell, setWentWell] = useState(['']);
  const [improvements, setImprovements] = useState(['']);
  const [actionItems, setActionItems] = useState([
    { item: '', assignee: '', dueDate: '' },
  ]);
  const [teamMood, setTeamMood] = useState(5);
  const [additionalNotes, setAdditionalNotes] = useState('');

  if (!sprint) {
    return null;
  }

  const addItem = (setter, currentItems) => {
    setter([...currentItems, '']);
  };

  const removeItem = (setter, currentItems, index) => {
    if (currentItems.length > 1) {
      setter(currentItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (setter, currentItems, index, value) => {
    const updated = [...currentItems];
    updated[index] = value;
    setter(updated);
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { item: '', assignee: '', dueDate: '' }]);
  };

  const removeActionItem = index => {
    if (actionItems.length > 1) {
      setActionItems(actionItems.filter((_, i) => i !== index));
    }
  };

  const updateActionItem = (index, field, value) => {
    const updated = [...actionItems];
    updated[index][field] = value;
    setActionItems(updated);
  };

  const handleSaveRetrospective = () => {
    // In a real implementation, this would save the retrospective data
    const retrospectiveData = {
      sprintId: sprint.id,
      wentWell: wentWell.filter(item => item.trim()),
      improvements: improvements.filter(item => item.trim()),
      actionItems: actionItems.filter(item => item.item.trim()),
      teamMood,
      additionalNotes,
      date: new Date().toISOString(),
    };

    console.log('Sprint Retrospective Data:', retrospectiveData);

    // Reset form and close dialog
    setWentWell(['']);
    setImprovements(['']);
    setActionItems([{ item: '', assignee: '', dueDate: '' }]);
    setTeamMood(5);
    setAdditionalNotes('');
    onOpenChange(false);
  };

  const getMoodEmoji = mood => {
    if (mood <= 2) {
      return '😞';
    }
    if (mood <= 4) {
      return '😐';
    }
    if (mood <= 6) {
      return '🙂';
    }
    if (mood <= 8) {
      return '😊';
    }
    return '🤩';
  };

  const getMoodColor = mood => {
    if (mood <= 2) {
      return 'text-red-600';
    }
    if (mood <= 4) {
      return 'text-orange-600';
    }
    if (mood <= 6) {
      return 'text-yellow-600';
    }
    if (mood <= 8) {
      return 'text-green-600';
    }
    return 'text-blue-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Sprint {sprint.number} Retrospective</DialogTitle>
          <DialogDescription>
            Reflect on the sprint and identify improvements for the future
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Team Mood */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <span className='text-2xl'>{getMoodEmoji(teamMood)}</span>
                Team Mood
              </CardTitle>
              <CardDescription>
                How did the team feel about this sprint overall?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <span className='text-sm text-muted-foreground'>Poor</span>
                  <input
                    type='range'
                    min='1'
                    max='10'
                    value={teamMood}
                    onChange={e => setTeamMood(parseInt(e.target.value))}
                    className='flex-1'
                  />
                  <span className='text-sm text-muted-foreground'>
                    Excellent
                  </span>
                </div>
                <div className='text-center'>
                  <span
                    className={`text-lg font-medium ${getMoodColor(teamMood)}`}
                  >
                    {teamMood}/10 - {getMoodEmoji(teamMood)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Went Well */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <ThumbsUp className='h-5 w-5 text-green-600' />
                What Went Well
              </CardTitle>
              <CardDescription>
                Celebrate successes and positive aspects of the sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {wentWell.map((item, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <Textarea
                      placeholder='What positive thing happened during this sprint?'
                      value={item}
                      onChange={e =>
                        updateItem(setWentWell, wentWell, index, e.target.value)
                      }
                      rows={2}
                      className='flex-1'
                    />
                    <div className='flex flex-col gap-1'>
                      {index === wentWell.length - 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addItem(setWentWell, wentWell)}
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      )}
                      {wentWell.length > 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            removeItem(setWentWell, wentWell, index)
                          }
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What Could Be Improved */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <ThumbsDown className='h-5 w-5 text-red-600' />
                What Could Be Improved
              </CardTitle>
              <CardDescription>
                Identify challenges and areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {improvements.map((item, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <Textarea
                      placeholder='What could we do better next sprint?'
                      value={item}
                      onChange={e =>
                        updateItem(
                          setImprovements,
                          improvements,
                          index,
                          e.target.value
                        )
                      }
                      rows={2}
                      className='flex-1'
                    />
                    <div className='flex flex-col gap-1'>
                      {index === improvements.length - 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addItem(setImprovements, improvements)}
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      )}
                      {improvements.length > 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            removeItem(setImprovements, improvements, index)
                          }
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Lightbulb className='h-5 w-5 text-yellow-600' />
                Action Items
              </CardTitle>
              <CardDescription>
                Specific actions to take based on retrospective insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {actionItems.map((actionItem, index) => (
                  <div key={index} className='p-4 border rounded-lg space-y-3'>
                    <div className='flex items-start gap-2'>
                      <Textarea
                        placeholder='What specific action will we take?'
                        value={actionItem.item}
                        onChange={e =>
                          updateActionItem(index, 'item', e.target.value)
                        }
                        rows={2}
                        className='flex-1'
                      />
                      {actionItems.length > 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => removeActionItem(index)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='text-sm font-medium'>Assignee</label>
                        <Input
                          placeholder='Who will do this?'
                          value={actionItem.assignee}
                          onChange={e =>
                            updateActionItem(index, 'assignee', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className='text-sm font-medium'>Due Date</label>
                        <Input
                          type='date'
                          value={actionItem.dueDate}
                          onChange={e =>
                            updateActionItem(index, 'dueDate', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  onClick={addActionItem}
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Action Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Additional Notes</CardTitle>
              <CardDescription>
                Any other observations or thoughts about the sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='Additional insights, observations, or notes...'
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveRetrospective}>Save Retrospective</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SprintRetrospectiveDialog;
