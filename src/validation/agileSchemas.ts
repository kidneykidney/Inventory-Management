import * as Yup from 'yup';
import {
  Priority,
  StoryStatus,
  EpicStatus,
  SprintStatus,
} from '../types/agile';

// Validation schema for Task creation and updates
export const taskSchema = Yup.object({
  title: Yup.string()
    .required('Task title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: Yup.string()
    .required('Task description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  assignee: Yup.string()
    .optional()
    .min(2, 'Assignee name must be at least 2 characters'),
  estimatedHours: Yup.number()
    .optional()
    .min(0.5, 'Estimated hours must be at least 0.5')
    .max(40, 'Estimated hours must not exceed 40'),
  actualHours: Yup.number()
    .optional()
    .min(0, 'Actual hours cannot be negative')
    .max(80, 'Actual hours must not exceed 80'),
});

// Validation schema for User Story creation and updates
export const userStorySchema = Yup.object({
  title: Yup.string()
    .required('Story title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title must not exceed 150 characters'),
  description: Yup.string()
    .required('Story description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  acceptanceCriteria: Yup.array()
    .of(
      Yup.string().min(
        10,
        'Each acceptance criterion must be at least 10 characters'
      )
    )
    .min(1, 'At least one acceptance criterion is required')
    .max(10, 'Maximum 10 acceptance criteria allowed'),
  storyPoints: Yup.number()
    .required('Story points are required')
    .oneOf(
      [1, 2, 3, 5, 8, 13, 21],
      'Story points must be a valid Fibonacci number (1, 2, 3, 5, 8, 13, 21)'
    ),
  priority: Yup.string()
    .required('Priority is required')
    .oneOf(
      ['high', 'medium', 'low'] as Priority[],
      'Priority must be high, medium, or low'
    ),
  status: Yup.string()
    .required('Status is required')
    .oneOf(
      ['backlog', 'todo', 'in-progress', 'review', 'done'] as StoryStatus[],
      'Invalid status'
    ),
  assignee: Yup.string()
    .optional()
    .min(2, 'Assignee name must be at least 2 characters'),
  epicId: Yup.string().optional().uuid('Epic ID must be a valid UUID'),
  sprintId: Yup.string().optional().uuid('Sprint ID must be a valid UUID'),
  tags: Yup.array()
    .of(Yup.string().min(2, 'Tag must be at least 2 characters'))
    .max(10, 'Maximum 10 tags allowed'),
});

// Validation schema for Epic creation and updates
export const epicSchema = Yup.object({
  title: Yup.string()
    .required('Epic title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: Yup.string()
    .required('Epic description is required')
    .min(30, 'Description must be at least 30 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  businessValue: Yup.string()
    .required('Business value is required')
    .min(20, 'Business value must be at least 20 characters')
    .max(500, 'Business value must not exceed 500 characters'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(
      ['planned', 'in-progress', 'complete'] as EpicStatus[],
      'Invalid epic status'
    ),
  priority: Yup.string()
    .required('Priority is required')
    .oneOf(
      ['high', 'medium', 'low'] as Priority[],
      'Priority must be high, medium, or low'
    ),
  targetSprint: Yup.number()
    .optional()
    .min(1, 'Target sprint must be at least 1')
    .max(100, 'Target sprint must not exceed 100'),
});

// Validation schema for Sprint creation and updates
export const sprintSchema = Yup.object({
  number: Yup.number()
    .required('Sprint number is required')
    .min(1, 'Sprint number must be at least 1')
    .max(1000, 'Sprint number must not exceed 1000'),
  startDate: Yup.date()
    .required('Start date is required')
    .min(new Date(), 'Start date cannot be in the past'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date')
    .test(
      'duration',
      'Sprint duration must be between 1 and 4 weeks',
      function (value) {
        const { startDate } = this.parent;
        if (!startDate || !value) return true;

        const diffTime = Math.abs(value.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 7 && diffDays <= 28;
      }
    ),
  goal: Yup.string()
    .required('Sprint goal is required')
    .min(10, 'Sprint goal must be at least 10 characters')
    .max(300, 'Sprint goal must not exceed 300 characters'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(
      ['planning', 'active', 'review', 'complete'] as SprintStatus[],
      'Invalid sprint status'
    ),
  capacity: Yup.number()
    .required('Team capacity is required')
    .min(1, 'Capacity must be at least 1')
    .max(200, 'Capacity must not exceed 200'),
});

// Validation for story point estimation
export const storyPointEstimateSchema = Yup.object({
  storyId: Yup.string()
    .required('Story ID is required')
    .uuid('Story ID must be a valid UUID'),
  estimates: Yup.array()
    .of(
      Yup.number().oneOf(
        [1, 2, 3, 5, 8, 13, 21],
        'Each estimate must be a valid Fibonacci number'
      )
    )
    .min(1, 'At least one estimate is required')
    .max(10, 'Maximum 10 estimates allowed'),
  finalEstimate: Yup.number()
    .required('Final estimate is required')
    .oneOf(
      [1, 2, 3, 5, 8, 13, 21],
      'Final estimate must be a valid Fibonacci number'
    ),
  confidence: Yup.string()
    .required('Confidence level is required')
    .oneOf(
      ['low', 'medium', 'high'],
      'Confidence must be low, medium, or high'
    ),
});
