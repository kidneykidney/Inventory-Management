import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressTrackingDashboard from '../ProgressTrackingDashboard';
import { apiService } from '../../../api/apiService';

// Mock the API service
jest.mock('../../../api/apiService', () => ({
  apiService: {
    get: jest.fn(),
  },
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid='line-chart'>Line Chart</div>,
  Bar: () => <div data-testid='bar-chart'>Bar Chart</div>,
}));

// Mock child components
jest.mock('../VelocityChart', () => {
  return function MockVelocityChart({ data, currentSprint }) {
    return (
      <div data-testid='velocity-chart'>
        Velocity Chart - Sprint: {currentSprint?.number || 'None'}
      </div>
    );
  };
});

jest.mock('../BurnupChart', () => {
  return function MockBurnupChart({ data, sprint }) {
    return (
      <div data-testid='burnup-chart'>
        Burnup Chart - Sprint: {sprint?.number || 'None'}
      </div>
    );
  };
});

jest.mock('../TeamCapacityVisualization', () => {
  return function MockTeamCapacityVisualization({ data, sprint }) {
    return (
      <div data-testid='team-capacity'>
        Team Capacity - Sprint: {sprint?.number || 'None'}
      </div>
    );
  };
});

jest.mock('../ProgressMetricsCards', () => {
  return function MockProgressMetricsCards({ metrics, sprint }) {
    return (
      <div data-testid='progress-metrics'>
        Progress Metrics - Sprint: {sprint?.number || 'None'}
      </div>
    );
  };
});

describe('ProgressTrackingDashboard', () => {
  const mockSprints = [
    {
      id: '1',
      number: 1,
      status: 'complete',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      goal: 'Complete user authentication',
    },
    {
      id: '2',
      number: 2,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-01-28',
      goal: 'Implement dashboard features',
    },
  ];

  const mockVelocityData = [
    { number: 1, plannedPoints: 20, completedPoints: 18, velocity: 18 },
    { number: 2, plannedPoints: 25, completedPoints: 22, velocity: 22 },
  ];

  const mockBurnupData = {
    burnupData: [
      { date: '2024-01-15', totalScope: 25, completedWork: 0 },
      { date: '2024-01-16', totalScope: 25, completedWork: 5 },
    ],
    scopeChange: 0,
    isOnTrack: true,
    projectionAccuracy: 80,
  };

  const mockTeamCapacity = {
    teamMembers: [
      {
        id: '1',
        name: 'John Doe',
        role: 'Developer',
        capacity: 40,
        allocated: 35,
        assignedStories: [],
      },
    ],
    totalCapacity: 40,
    totalAllocated: 35,
    utilizationRate: 87.5,
  };

  const mockProgressMetrics = {
    velocityTrend: { current: 22, change: 10 },
    sprintProgress: {
      completionRate: 60,
      completedStories: 3,
      totalStories: 5,
    },
    teamUtilization: { rate: 87.5, activeMembers: 1 },
    qualityMetrics: { score: 8.5, testsPass: 95 },
    riskIndicators: [],
    predictiveAnalytics: { completionForecast: 'On Time', confidence: 'high' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default API responses
    apiService.get.mockImplementation(url => {
      if (url === '/api/v1/sprints') {
        return Promise.resolve({ data: { data: mockSprints } });
      }
      if (url === '/api/v1/sprints/velocity') {
        return Promise.resolve({ data: { data: mockVelocityData } });
      }
      if (url.includes('/burnup')) {
        return Promise.resolve({ data: { data: mockBurnupData } });
      }
      if (url.includes('/capacity')) {
        return Promise.resolve({ data: { data: mockTeamCapacity } });
      }
      if (url.includes('/metrics')) {
        return Promise.resolve({ data: { data: mockProgressMetrics } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders loading state initially', () => {
    render(<ProgressTrackingDashboard />);

    expect(
      screen.getByText('Loading progress tracking dashboard...')
    ).toBeInTheDocument();
  });

  it('renders dashboard with data after loading', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Real-time sprint progress, velocity tracking, and team capacity visualization'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('velocity-chart')).toBeInTheDocument();
    expect(screen.getByTestId('progress-metrics')).toBeInTheDocument();
  });

  it('displays sprint selector with available sprints', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });

    // Check if sprint selector is present
    const sprintSelector = screen.getByRole('combobox');
    expect(sprintSelector).toBeInTheDocument();
  });

  it('shows active sprint by default', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('velocity-chart')).toBeInTheDocument();
    });

    // Should show the active sprint (Sprint 2)
    expect(screen.getByText('Velocity Chart - Sprint: 2')).toBeInTheDocument();
    expect(
      screen.getByText('Progress Metrics - Sprint: 2')
    ).toBeInTheDocument();
  });

  it('loads sprint-specific data when sprint is selected', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });

    // Verify that sprint-specific API calls were made
    expect(apiService.get).toHaveBeenCalledWith('/api/v1/sprints/2/burnup');
    expect(apiService.get).toHaveBeenCalledWith('/api/v1/sprints/2/capacity');
    expect(apiService.get).toHaveBeenCalledWith('/api/v1/sprints/2/metrics');
  });

  it('displays burnup chart when data is available', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('burnup-chart')).toBeInTheDocument();
    });

    expect(screen.getByText('Burnup Chart - Sprint: 2')).toBeInTheDocument();
  });

  it('displays team capacity visualization when data is available', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('team-capacity')).toBeInTheDocument();
    });

    expect(screen.getByText('Team Capacity - Sprint: 2')).toBeInTheDocument();
  });

  it('shows real-time status indicators', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Real-time Status')).toBeInTheDocument();
    });

    expect(screen.getByText('System Online')).toBeInTheDocument();
    expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
    expect(screen.getByText('Data Range')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Should make API calls again
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(10); // Initial calls + refresh calls
    });
  });

  it('handles API errors gracefully', async () => {
    apiService.get.mockRejectedValue(new Error('API Error'));

    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load dashboard data')
      ).toBeInTheDocument();
    });
  });

  it('shows no active sprint message when no sprints are active', async () => {
    const inactiveSprints = mockSprints.map(sprint => ({
      ...sprint,
      status: 'complete',
    }));

    apiService.get.mockImplementation(url => {
      if (url === '/api/v1/sprints') {
        return Promise.resolve({ data: { data: inactiveSprints } });
      }
      if (url === '/api/v1/sprints/velocity') {
        return Promise.resolve({ data: { data: mockVelocityData } });
      }
      return Promise.resolve({ data: { data: null } });
    });

    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });

    // Should select the most recent sprint instead
    expect(screen.getByText('Velocity Chart - Sprint: 2')).toBeInTheDocument();
  });

  it('displays error message when sprint-specific data fails to load', async () => {
    apiService.get.mockImplementation(url => {
      if (url === '/api/v1/sprints') {
        return Promise.resolve({ data: { data: mockSprints } });
      }
      if (url === '/api/v1/sprints/velocity') {
        return Promise.resolve({ data: { data: mockVelocityData } });
      }
      if (
        url.includes('/burnup') ||
        url.includes('/capacity') ||
        url.includes('/metrics')
      ) {
        return Promise.reject(new Error('Sprint data error'));
      }
      return Promise.resolve({ data: { data: null } });
    });

    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load sprint data')
      ).toBeInTheDocument();
    });
  });

  it('sets up auto-refresh interval', async () => {
    jest.useFakeTimers();

    render(<ProgressTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });

    // Clear the initial API calls
    jest.clearAllMocks();

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/api/v1/sprints');
    });

    jest.useRealTimers();
  });
});
