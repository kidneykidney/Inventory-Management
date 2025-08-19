import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EpicCard from '../EpicCard';

const mockEpic = {
  id: '1',
  title: 'Test Epic',
  description: 'Test epic description',
  businessValue: 'Test business value',
  status: 'in-progress',
  targetSprint: 2,
  stories: [
    { id: '1', status: 'done' },
    { id: '2', status: 'in-progress' },
    { id: '3', status: 'todo' },
  ],
};

const mockHandlers = {
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onViewStories: jest.fn(),
};

describe('EpicCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders epic information correctly', () => {
    render(<EpicCard epic={mockEpic} {...mockHandlers} />);

    expect(screen.getByText('Test Epic')).toBeInTheDocument();
    expect(screen.getByText('Test epic description')).toBeInTheDocument();
    expect(screen.getByText('Test business value')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('1/3 stories')).toBeInTheDocument();
    expect(screen.getByText('Target Sprint: 2')).toBeInTheDocument();
  });

  it('calculates progress correctly', () => {
    render(<EpicCard epic={mockEpic} {...mockHandlers} />);

    // 1 out of 3 stories completed = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('displays correct status color for in-progress', () => {
    render(<EpicCard epic={mockEpic} {...mockHandlers} />);

    const statusBadge = screen.getByText('in progress');
    expect(statusBadge).toHaveClass(
      'bg-yellow-100',
      'text-yellow-800',
      'border-yellow-200'
    );
  });

  it('displays correct status color for planned', () => {
    const plannedEpic = { ...mockEpic, status: 'planned' };
    render(<EpicCard epic={plannedEpic} {...mockHandlers} />);

    const statusBadge = screen.getByText('planned');
    expect(statusBadge).toHaveClass(
      'bg-blue-100',
      'text-blue-800',
      'border-blue-200'
    );
  });

  it('displays correct status color for complete', () => {
    const completeEpic = { ...mockEpic, status: 'complete' };
    render(<EpicCard epic={completeEpic} {...mockHandlers} />);

    const statusBadge = screen.getByText('complete');
    expect(statusBadge).toHaveClass(
      'bg-green-100',
      'text-green-800',
      'border-green-200'
    );
  });

  it('handles epic with no stories', () => {
    const epicWithoutStories = { ...mockEpic, stories: [] };
    render(<EpicCard epic={epicWithoutStories} {...mockHandlers} />);

    expect(screen.getByText('0/0 stories')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', () => {
    render(<EpicCard epic={mockEpic} {...mockHandlers} />);

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const editButton = screen.getByText('Edit Epic');
    fireEvent.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockEpic);
  });

  it('calls onDelete when delete is clicked', () => {
    render(<EpicCard epic={mockEpic} {...mockHandlers} />);

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const deleteButton = screen.getByText('Delete Epic');
    fireEvent.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockEpic.id);
  });

  it('calls onViewStories when view stories is clicked', () => {
    render(<EpicCard epic={mockEpic} {...mockHandlers} />);

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const viewStoriesButton = screen.getByText('View Stories');
    fireEvent.click(viewStoriesButton);

    expect(mockHandlers.onViewStories).toHaveBeenCalledWith(mockEpic);
  });

  it('does not render business value section when not provided', () => {
    const epicWithoutBusinessValue = { ...mockEpic, businessValue: '' };
    render(<EpicCard epic={epicWithoutBusinessValue} {...mockHandlers} />);

    expect(screen.queryByText('Business Value')).not.toBeInTheDocument();
  });

  it('does not render target sprint when not provided', () => {
    const epicWithoutTargetSprint = { ...mockEpic, targetSprint: null };
    render(<EpicCard epic={epicWithoutTargetSprint} {...mockHandlers} />);

    expect(screen.queryByText(/Target Sprint:/)).not.toBeInTheDocument();
  });
});
