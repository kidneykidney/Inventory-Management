import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import UserStoryCard from '../UserStoryCard';

const mockStory = {
  id: '1',
  title: 'Test User Story',
  description: 'Test story description',
  acceptanceCriteria: [
    'WHEN user does X THEN Y happens',
    'WHEN user does A THEN B happens',
    'WHEN user does C THEN D happens',
  ],
  storyPoints: 5,
  priority: 'high',
  status: 'in-progress',
  assignee: 'John Doe',
  epic: 'Test Epic',
  tasks: [
    { id: '1', completed: true },
    { id: '2', completed: false },
  ],
};

const mockHandlers = {
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

const renderWithDndContext = component => {
  return render(<DndContext>{component}</DndContext>);
};

describe('UserStoryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders story information correctly', () => {
    renderWithDndContext(<UserStoryCard story={mockStory} {...mockHandlers} />);

    expect(screen.getByText('Test User Story')).toBeInTheDocument();
    expect(screen.getByText('Test story description')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Epic')).toBeInTheDocument();
  });

  it('displays acceptance criteria correctly', () => {
    renderWithDndContext(<UserStoryCard story={mockStory} {...mockHandlers} />);

    expect(screen.getByText('Acceptance Criteria')).toBeInTheDocument();
    expect(
      screen.getByText('WHEN user does X THEN Y happens')
    ).toBeInTheDocument();
    expect(
      screen.getByText('WHEN user does A THEN B happens')
    ).toBeInTheDocument();
    expect(screen.getByText('+1 more criteria')).toBeInTheDocument();
  });

  it('displays task completion status', () => {
    renderWithDndContext(<UserStoryCard story={mockStory} {...mockHandlers} />);

    expect(screen.getByText('1/2 tasks completed')).toBeInTheDocument();
  });

  it('displays correct status colors', () => {
    const statuses = [
      { status: 'backlog', expectedClass: 'bg-gray-100' },
      { status: 'todo', expectedClass: 'bg-blue-100' },
      { status: 'in-progress', expectedClass: 'bg-yellow-100' },
      { status: 'review', expectedClass: 'bg-purple-100' },
      { status: 'done', expectedClass: 'bg-green-100' },
    ];

    statuses.forEach(({ status, expectedClass }) => {
      const storyWithStatus = { ...mockStory, status };
      const { unmount } = renderWithDndContext(
        <UserStoryCard story={storyWithStatus} {...mockHandlers} />
      );

      const statusBadge = screen.getByText(status.replace('-', ' '));
      expect(statusBadge).toHaveClass(expectedClass);

      unmount();
    });
  });

  it('displays correct priority colors', () => {
    const priorities = [
      { priority: 'high', expectedClass: 'bg-red-100' },
      { priority: 'medium', expectedClass: 'bg-yellow-100' },
      { priority: 'low', expectedClass: 'bg-green-100' },
    ];

    priorities.forEach(({ priority, expectedClass }) => {
      const storyWithPriority = { ...mockStory, priority };
      const { unmount } = renderWithDndContext(
        <UserStoryCard story={storyWithPriority} {...mockHandlers} />
      );

      const priorityBadge = screen.getByText(priority);
      expect(priorityBadge).toHaveClass(expectedClass);

      unmount();
    });
  });

  it('handles story without acceptance criteria', () => {
    const storyWithoutCriteria = { ...mockStory, acceptanceCriteria: [] };
    renderWithDndContext(
      <UserStoryCard story={storyWithoutCriteria} {...mockHandlers} />
    );

    expect(screen.queryByText('Acceptance Criteria')).not.toBeInTheDocument();
  });

  it('handles story without assignee', () => {
    const storyWithoutAssignee = { ...mockStory, assignee: '' };
    renderWithDndContext(
      <UserStoryCard story={storyWithoutAssignee} {...mockHandlers} />
    );

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('handles story without epic', () => {
    const storyWithoutEpic = { ...mockStory, epic: '' };
    renderWithDndContext(
      <UserStoryCard story={storyWithoutEpic} {...mockHandlers} />
    );

    expect(screen.queryByText('Test Epic')).not.toBeInTheDocument();
  });

  it('handles story without story points', () => {
    const storyWithoutPoints = { ...mockStory, storyPoints: null };
    renderWithDndContext(
      <UserStoryCard story={storyWithoutPoints} {...mockHandlers} />
    );

    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
  });

  it('handles story without tasks', () => {
    const storyWithoutTasks = { ...mockStory, tasks: [] };
    renderWithDndContext(
      <UserStoryCard story={storyWithoutTasks} {...mockHandlers} />
    );

    expect(screen.queryByText(/tasks completed/)).not.toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', () => {
    renderWithDndContext(<UserStoryCard story={mockStory} {...mockHandlers} />);

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const editButton = screen.getByText('Edit Story');
    fireEvent.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockStory);
  });

  it('calls onDelete when delete is clicked', () => {
    renderWithDndContext(<UserStoryCard story={mockStory} {...mockHandlers} />);

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const deleteButton = screen.getByText('Delete Story');
    fireEvent.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockStory.id);
  });

  it('shows only first 2 acceptance criteria with more indicator', () => {
    renderWithDndContext(<UserStoryCard story={mockStory} {...mockHandlers} />);

    expect(
      screen.getByText('WHEN user does X THEN Y happens')
    ).toBeInTheDocument();
    expect(
      screen.getByText('WHEN user does A THEN B happens')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('WHEN user does C THEN D happens')
    ).not.toBeInTheDocument();
    expect(screen.getByText('+1 more criteria')).toBeInTheDocument();
  });

  it('does not show more indicator when 2 or fewer criteria', () => {
    const storyWithFewCriteria = {
      ...mockStory,
      acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
    };
    renderWithDndContext(
      <UserStoryCard story={storyWithFewCriteria} {...mockHandlers} />
    );

    expect(screen.queryByText(/more criteria/)).not.toBeInTheDocument();
  });
});
