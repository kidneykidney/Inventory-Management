// TypeScript interfaces for Agile development models

export type StoryStatus =
  | 'backlog'
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'done';
export type Priority = 'high' | 'medium' | 'low';
export type SprintStatus = 'planning' | 'active' | 'review' | 'complete';
export type EpicStatus = 'planned' | 'in-progress' | 'complete';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignee?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  priority: Priority;
  status: StoryStatus;
  assignee?: string;
  epicId?: string;
  sprintId?: string;
  tasks: Task[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  businessValue: string;
  status: EpicStatus;
  targetSprint?: number;
  stories: UserStory[];
  priority: Priority;
  estimatedStoryPoints: number;
  completedStoryPoints: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface BurndownPoint {
  date: Date;
  remainingPoints: number;
  idealRemaining: number;
}

export interface Sprint {
  id: string;
  number: number;
  startDate: Date;
  endDate: Date;
  goal: string;
  status: SprintStatus;
  stories: UserStory[];
  velocity: number;
  capacity: number;
  burndownData: BurndownPoint[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryPointEstimate {
  storyId: string;
  estimates: number[];
  finalEstimate: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface BacklogMetrics {
  totalStories: number;
  totalStoryPoints: number;
  storiesByStatus: Record<StoryStatus, number>;
  storiesByPriority: Record<Priority, number>;
  averageStoryPoints: number;
  velocityTrend: number[];
}
