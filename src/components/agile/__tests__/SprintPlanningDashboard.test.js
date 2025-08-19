import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SprintPlanningDashboard from '../SprintPlanningDashboard';
import { apiService } from '../../../api/apiService';

// Mock axios
jest.mock('axios');

// Mock the API service
jest.mock('../../../api/apiService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiService = apiService;

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid='burndown-chart'>Burndown Chart</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div>TrendingUp</div>,
  Target: () => <div>Target</div>,
  Clock: () => <div>Clock</div>,
  Users: () => <div>Users</div>,
  Plus: () => <div>Plus</div>,
  Search: () => <div>Search</div>,
  Filter: () => <div>Filter</div>,
  ArrowUpDown: () => <div>ArrowUpDown</div>,
  CheckCircle: () => <div>CheckCircle</div>,
  XCircle: () => <div>XCircle</div>,
  Lightbulb: () => <div>Lightbulb</div>,
  ThumbsUp: () => <div>ThumbsUp</div>,
  ThumbsDown: () => <div>ThumbsDown</div>,
  Trash2: () => <div>Trash2</div>,
  TrendingDown: () => <div>TrendingDown</div>,
  Minus: () => <div>Minus</div>,
  X: () => <div>X</div>,
}));

describe('SprintPlanningDashboard', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock default API responses
    mockApiService.get.mockImplementation(url => {
      switch (url) {
        case '/api/v1/sprints':
          return Promise.resolve({
            data: {
              success: true,
              data: [
                {
                  id: 'sprint-1',
                  number: 1,
                  goal: 'Test sprint goal',
                  status: 'planning',
                  capacity: 20,
                  startDate: '2024-01-15',
                  endDate: '2024-01-29',
                  storyCount: 0,
                  totalStoryPoints: 0,
                  completedStoryPoints: 0,
                },
              ],
            },
          });
        case '/api/v1/sprints/planning/velocity':
          return Promise.resolve({
            data: {
              success: true,
              data: { averageVelocity: 15 },
            },
          });
        default:
          return Promise.resolve({ data: { success: true, data: [] } });
      }
    });
  });

  describe('Component Rendering', () => {
    it('renders the main dashboard elements', async () => {
      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Manage sprints, track progress, and plan iterations'
          )
        ).toBeInTheDocument();
        expect(screen.getByTestId('create-sprint-button')).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      render(<SprintPlanningDashboard />);

      expect(
        screen.getByText('Loading sprint planning dashboard...')
      ).toBeInTheDocument();
    });

    it('displays metrics cards after loading', async () => {
      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Team Velocity')).toBeInTheDocument();
        expect(screen.getByText('Sprint Progress')).toBeInTheDocument();
        expect(screen.getByText('Days Remaining')).toBeInTheDocument();
        expect(screen.getByText('Active Stories')).toBeInTheDocument();
      });
    });

    it('displays sprint list', async () => {
      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sprints')).toBeInTheDocument();
        expect(
          screen.getByText('All sprints and their status')
        ).toBeInTheDocument();
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
        expect(screen.getByText('Test sprint goal')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint Creation', () => {
    it('opens create sprint dialog when button is clicked', async () => {
      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('create-sprint-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('create-sprint-button'));

      expect(screen.getByText('Create New Sprint')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Set up a new sprint with goals and capacity planning.'
        )
      ).toBeInTheDocument();
    });

    it('displays form fields in create dialog', async () => {
      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('create-sprint-button'));
      });

      expect(screen.getByTestId('sprint-number-input')).toBeInTheDocument();
      expect(screen.getByTestId('sprint-goal-input')).toBeInTheDocument();
      expect(screen.getByTestId('sprint-capacity-input')).toBeInTheDocument();
      expect(screen.getByTestId('sprint-start-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('sprint-end-date-input')).toBeInTheDocument();
    });

    it('creates a new sprint when form is submitted', async () => {
      mockApiService.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Sprint created successfully',
          data: { id: 'new-sprint', number: 2 },
        },
      });

      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('create-sprint-button'));
      });

      // Fill form
      fireEvent.change(screen.getByTestId('sprint-number-input'), {
        target: { value: '2' },
      });
      fireEvent.change(screen.getByTestId('sprint-goal-input'), {
        target: { value: 'New sprint goal' },
      });
      fireEvent.change(screen.getByTestId('sprint-capacity-input'), {
        target: { value: '25' },
      });
      fireEvent.change(screen.getByTestId('sprint-start-date-input'), {
        target: { value: '2024-02-01' },
      });
      fireEvent.change(screen.getByTestId('sprint-end-date-input'), {
        target: { value: '2024-02-15' },
      });

      // Submit form
      fireEvent.click(screen.getByTestId('create-sprint-submit'));

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/sprints', {
          number: 2,
          goal: 'New sprint goal',
          capacity: 25,
          startDate: '2024-02-01',
          endDate: '2024-02-15',
          status: 'planning',
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      mockApiService.get.mockRejectedValue(new Error('API Error'));

      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load sprint planning data')
        ).toBeInTheDocument();
      });
    });

    it('handles sprint creation errors', async () => {
      mockApiService.post.mockRejectedValue(new Error('Creation failed'));

      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('create-sprint-button'));
      });

      // Fill and submit form
      fireEvent.change(screen.getByTestId('sprint-number-input'), {
        target: { value: '2' },
      });
      fireEvent.change(screen.getByTestId('sprint-goal-input'), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByTestId('sprint-capacity-input'), {
        target: { value: '20' },
      });
      fireEvent.change(screen.getByTestId('sprint-start-date-input'), {
        target: { value: '2024-02-01' },
      });
      fireEvent.change(screen.getByTestId('sprint-end-date-input'), {
        target: { value: '2024-02-15' },
      });

      fireEvent.click(screen.getByTestId('create-sprint-submit'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create sprint')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint Actions', () => {
    it('starts a sprint when start button is clicked', async () => {
      mockApiService.post.mockResolvedValue({
        data: { success: true, message: 'Sprint started successfully' },
      });

      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        const startButton = screen.getByText('Start');
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/sprints/sprint-1/start'
        );
      });
    });
  });

  describe('Active Sprint Display', () => {
    it('displays burndown chart for active sprint', async () => {
      // Mock active sprint
      mockApiService.get.mockImplementation(url => {
        switch (url) {
          case '/api/v1/sprints':
            return Promise.resolve({
              data: {
                success: true,
                data: [
                  {
                    id: 'active-sprint',
                    number: 1,
                    status: 'active',
                    capacity: 20,
                  },
                ],
              },
            });
          case '/api/v1/sprints/active-sprint/stories':
            return Promise.resolve({
              data: { success: true, data: { stories: [] } },
            });
          case '/api/v1/sprints/active-sprint/burndown':
            return Promise.resolve({
              data: {
                success: true,
                data: {
                  totalStoryPoints: 20,
                  completedStoryPoints: 5,
                  burndownData: [],
                },
              },
            });
          default:
            return Promise.resolve({
              data: { success: true, data: { averageVelocity: 15 } },
            });
        }
      });

      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('burndown-chart')).toBeInTheDocument();
      });
    });

    it('displays no active sprint message when no sprint is active', async () => {
      // Mock no active sprint
      mockApiService.get.mockImplementation(url => {
        switch (url) {
          case '/api/v1/sprints':
            return Promise.resolve({
              data: {
                success: true,
                data: [
                  {
                    id: 'planning-sprint',
                    number: 1,
                    status: 'planning',
                    capacity: 20,
                  },
                ],
              },
            });
          default:
            return Promise.resolve({
              data: { success: true, data: { averageVelocity: 15 } },
            });
        }
      });

      render(<SprintPlanningDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No active sprint')).toBeInTheDocument();
      });
    });
  });
});
