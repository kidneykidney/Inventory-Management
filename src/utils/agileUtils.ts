import {
  UserStory,
  Epic,
  Sprint,
  Priority,
  StoryStatus,
  BacklogMetrics,
} from '../types/agile';

// Story point estimation utilities
export const FIBONACCI_SEQUENCE = [1, 2, 3, 5, 8, 13, 21] as const;

/**
 * Calculate the average of story point estimates using planning poker methodology
 */
export const calculateAverageEstimate = (estimates: number[]): number => {
  if (estimates.length === 0) return 0;

  const sum = estimates.reduce((acc, estimate) => acc + estimate, 0);
  const average = sum / estimates.length;

  // Round to nearest Fibonacci number
  return getNearestFibonacci(average);
};

/**
 * Get the nearest Fibonacci number for story point estimation
 */
export const getNearestFibonacci = (value: number): number => {
  if (value <= 0) return 1;

  let closest = FIBONACCI_SEQUENCE[0];
  let minDiff = Math.abs(value - closest);

  for (const fib of FIBONACCI_SEQUENCE) {
    const diff = Math.abs(value - fib);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fib;
    }
  }

  return closest;
};

/**
 * Calculate confidence level based on estimate variance
 */
export const calculateEstimateConfidence = (
  estimates: number[]
): 'low' | 'medium' | 'high' => {
  if (estimates.length < 2) return 'low';

  const average =
    estimates.reduce((sum, est) => sum + est, 0) / estimates.length;
  const variance =
    estimates.reduce((sum, est) => sum + Math.pow(est - average, 2), 0) /
    estimates.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate coefficient of variation (CV)
  const cv = standardDeviation / average;

  if (cv <= 0.2) return 'high';
  if (cv <= 0.4) return 'medium';
  return 'low';
};

// Priority management utilities
export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Calculate priority score for story ordering
 */
export const calculatePriorityScore = (story: UserStory): number => {
  const priorityWeight = PRIORITY_WEIGHTS[story.priority];
  const storyPointWeight = story.storyPoints / 21; // Normalize to 0-1 scale
  const ageWeight = getStoryAgeWeight(story.createdAt);

  return priorityWeight * 0.5 + storyPointWeight * 0.3 + ageWeight * 0.2;
};

/**
 * Get age weight for story prioritization (older stories get higher weight)
 */
export const getStoryAgeWeight = (createdAt: Date): number => {
  const now = new Date();
  const ageInDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Stories older than 30 days get maximum weight
  return Math.min(ageInDays / 30, 1);
};

/**
 * Sort stories by priority score (highest first)
 */
export const sortStoriesByPriority = (stories: UserStory[]): UserStory[] => {
  return [...stories].sort(
    (a, b) => calculatePriorityScore(b) - calculatePriorityScore(a)
  );
};

/**
 * Filter stories by status
 */
export const filterStoriesByStatus = (
  stories: UserStory[],
  status: StoryStatus
): UserStory[] => {
  return stories.filter(story => story.status === status);
};

/**
 * Filter stories by priority
 */
export const filterStoriesByPriority = (
  stories: UserStory[],
  priority: Priority
): UserStory[] => {
  return stories.filter(story => story.priority === priority);
};

// Backlog metrics and analytics
/**
 * Calculate comprehensive backlog metrics
 */
export const calculateBacklogMetrics = (
  stories: UserStory[]
): BacklogMetrics => {
  const totalStories = stories.length;
  const totalStoryPoints = stories.reduce(
    (sum, story) => sum + story.storyPoints,
    0
  );

  const storiesByStatus: Record<StoryStatus, number> = {
    backlog: 0,
    todo: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
  };

  const storiesByPriority: Record<Priority, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  stories.forEach(story => {
    storiesByStatus[story.status]++;
    storiesByPriority[story.priority]++;
  });

  const averageStoryPoints =
    totalStories > 0 ? totalStoryPoints / totalStories : 0;

  return {
    totalStories,
    totalStoryPoints,
    storiesByStatus,
    storiesByPriority,
    averageStoryPoints,
    velocityTrend: [], // Will be calculated from sprint data
  };
};

/**
 * Calculate epic completion percentage
 */
export const calculateEpicCompletion = (epic: Epic): number => {
  if (epic.stories.length === 0) return 0;

  const completedStories = epic.stories.filter(
    story => story.status === 'done'
  );
  return Math.round((completedStories.length / epic.stories.length) * 100);
};

/**
 * Calculate epic story points completion
 */
export const calculateEpicStoryPointsCompletion = (epic: Epic): number => {
  const totalPoints = epic.stories.reduce(
    (sum, story) => sum + story.storyPoints,
    0
  );
  if (totalPoints === 0) return 0;

  const completedPoints = epic.stories
    .filter(story => story.status === 'done')
    .reduce((sum, story) => sum + story.storyPoints, 0);

  return Math.round((completedPoints / totalPoints) * 100);
};

/**
 * Get stories ready for sprint planning (backlog status, estimated)
 */
export const getSprintReadyStories = (stories: UserStory[]): UserStory[] => {
  return stories.filter(
    story =>
      story.status === 'backlog' &&
      story.storyPoints > 0 &&
      story.acceptanceCriteria.length > 0
  );
};

/**
 * Calculate team velocity from completed sprints
 */
export const calculateTeamVelocity = (sprints: Sprint[]): number => {
  const completedSprints = sprints.filter(
    sprint => sprint.status === 'complete'
  );

  if (completedSprints.length === 0) return 0;

  const totalVelocity = completedSprints.reduce(
    (sum, sprint) => sum + sprint.velocity,
    0
  );
  return Math.round(totalVelocity / completedSprints.length);
};

/**
 * Suggest optimal sprint capacity based on story points and team velocity
 */
export const suggestSprintCapacity = (
  availableStories: UserStory[],
  teamVelocity: number,
  bufferPercentage = 0.8
): UserStory[] => {
  const adjustedCapacity = Math.floor(teamVelocity * bufferPercentage);
  const sortedStories = sortStoriesByPriority(availableStories);

  const selectedStories: UserStory[] = [];
  let currentPoints = 0;

  for (const story of sortedStories) {
    if (currentPoints + story.storyPoints <= adjustedCapacity) {
      selectedStories.push(story);
      currentPoints += story.storyPoints;
    }
  }

  return selectedStories;
};

/**
 * Generate unique ID for stories, epics, and sprints
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format story for display in UI components
 */
export const formatStoryForDisplay = (story: UserStory): string => {
  return `[${story.storyPoints}pts] ${story.title}`;
};

/**
 * Validate story is ready for sprint inclusion
 */
export const isStorySprintReady = (story: UserStory): boolean => {
  return (
    story.status === 'backlog' &&
    story.storyPoints > 0 &&
    story.acceptanceCriteria.length > 0 &&
    story.description.length >= 20
  );
};
