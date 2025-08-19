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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const EpicCard = ({ epic, onEdit, onDelete, onViewStories }) => {
  const getStatusColor = status => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const completedStories =
    epic.stories?.filter(story => story.status === 'done').length || 0;
  const totalStories = epic.stories?.length || 0;
  const progress =
    totalStories > 0 ? (completedStories / totalStories) * 100 : 0;

  return (
    <Card className='hover:shadow-md transition-shadow duration-200'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='text-lg font-semibold text-gray-900 mb-2'>
              {epic.title}
            </CardTitle>
            <div className='flex items-center gap-2 mb-2'>
              <Badge className={getStatusColor(epic.status)}>
                {epic.status.replace('-', ' ')}
              </Badge>
              <span className='text-sm text-gray-500'>
                {completedStories}/{totalStories} stories
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEdit(epic)}>
                <Edit className='h-4 w-4 mr-2' />
                Edit Epic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewStories(epic)}>
                View Stories
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(epic.id)}
                className='text-red-600'
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete Epic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className='text-sm text-gray-600 mb-4'>
          {epic.description}
        </CardDescription>

        {epic.businessValue && (
          <div className='mb-4'>
            <h4 className='text-sm font-medium text-gray-700 mb-1'>
              Business Value
            </h4>
            <p className='text-sm text-gray-600'>{epic.businessValue}</p>
          </div>
        )}

        <div className='mb-4'>
          <div className='flex justify-between text-sm text-gray-600 mb-1'>
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {epic.targetSprint && (
          <div className='text-sm text-gray-500'>
            Target Sprint: {epic.targetSprint}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EpicCard;
