import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MoreHorizontal, Edit, Trash2, User, Target } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const UserStoryCard = ({ story, onEdit, onDelete, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableIsDragging ? 0.5 : 1,
  };

  const getStatusColor = status => {
    switch (status) {
      case 'backlog':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'todo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing ${
        sortableIsDragging ? 'shadow-lg' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='text-base font-semibold text-gray-900 mb-2'>
              {story.title}
            </CardTitle>
            <div className='flex items-center gap-2 mb-2 flex-wrap'>
              <Badge className={getStatusColor(story.status)}>
                {story.status.replace('-', ' ')}
              </Badge>
              <Badge className={getPriorityColor(story.priority)}>
                {story.priority}
              </Badge>
              {story.storyPoints && (
                <Badge variant='outline' className='text-xs'>
                  {story.storyPoints} pts
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEdit(story)}>
                <Edit className='h-4 w-4 mr-2' />
                Edit Story
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(story.id)}
                className='text-red-600'
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete Story
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className='text-sm text-gray-600 mb-4'>
          {story.description}
        </CardDescription>

        {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
          <div className='mb-4'>
            <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center'>
              <Target className='h-4 w-4 mr-1' />
              Acceptance Criteria
            </h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              {story.acceptanceCriteria.slice(0, 2).map((criteria, index) => (
                <li key={index} className='flex items-start'>
                  <span className='text-gray-400 mr-2'>•</span>
                  <span className='flex-1'>{criteria}</span>
                </li>
              ))}
              {story.acceptanceCriteria.length > 2 && (
                <li className='text-gray-400 text-xs'>
                  +{story.acceptanceCriteria.length - 2} more criteria
                </li>
              )}
            </ul>
          </div>
        )}

        <div className='flex items-center justify-between text-sm text-gray-500'>
          {story.assignee && (
            <div className='flex items-center'>
              <User className='h-4 w-4 mr-1' />
              <span>{story.assignee}</span>
            </div>
          )}
          {story.epic && (
            <div className='text-xs bg-gray-100 px-2 py-1 rounded'>
              {story.epic}
            </div>
          )}
        </div>

        {story.tasks && story.tasks.length > 0 && (
          <div className='mt-3 pt-3 border-t border-gray-100'>
            <div className='text-xs text-gray-500'>
              {story.tasks.filter(task => task.completed).length}/
              {story.tasks.length} tasks completed
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserStoryCard;
