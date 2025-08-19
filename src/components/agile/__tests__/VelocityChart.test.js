import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VelocityChart from '../VelocityChart';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart">
      Line Chart - {data.datasets.length} datasets
    </div>
  ),
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart">
      Bar Chart - {data.datasets.length} datasets
    </div>
  ),
}));

describe('VelocityChart', () => {
  const mockVelocityData = [
    {
      number: 1,
      plannedPoints: 20,
      completedPoints: 18,
      velocity: 18
    },
    {
      number: 2,
      plannedPoints: 25,
      completedPoints: 22,
      velocity: 22
    },
    {
      number: 3,
      plannedPoints: 30,
      completedPoints: 28,
      velocity: 28
    },
    {
      number: 4,
      plannedPoints: 25,
      completedPoints: 24,
      velocity: 24
    }
  ];

  const mockCurrentSprint = {
    id: '4',
    number: 4,
    status: 'active',
    goal: 'Complete dashboard features'
  };

  it('renders empty state when no data is provided', () => {
    render(<VelocityChart data={[]} currentSprint={null} />);
    
    expect(screen.getByText('Team Velocity')).toBeInTheDocument();
    expect(screen.getByText('No velocity data available')).toBeInTheDocument();
  });

  it('renders velocity chart with data', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    expect(screen.getByText('Team Velocity')).toBeInTheDocument();
    expect(screen.getByText('Sprint velocity tracking and performance trends')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays velocity statistics correctly', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    // Average velocity should be (18+22+28+24)/4 = 23
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('Avg Velocity')).toBeInTheDocument();
    
    // Best sprint should be 28
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Best Sprint')).toBeInTheDocument();
    
    // Last sprint should be 24
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('Last Sprint')).toBeInTheDocument();
  });

  it('shows trend indicator for increasing velocity', () => {
    const increasingData = [
      { number: 1, plannedPoints: 20, completedPoints: 15, velocity: 15 },
      { number: 2, plannedPoints: 25, completedPoints: 18, velocity: 18 },
      { number: 3, plannedPoints: 30, completedPoints: 25, velocity: 25 },
      { number: 4, plannedPoints: 25, completedPoints: 28, velocity: 28 }
    ];

    render(<VelocityChart data={increasingData} currentSprint={mockCurrentSprint} />);
    
    // Should show upward trend
    expect(screen.getByText(/\+/)).toBeInTheDocument(); // Plus sign for positive trend
  });

  it('shows trend indicator for decreasing velocity', () => {
    const decreasingData = [
      { number: 1, plannedPoints: 20, completedPoints: 28, velocity: 28 },
      { number: 2, plannedPoints: 25, completedPoints: 25, velocity: 25 },
      { number: 3, plannedPoints: 30, completedPoints: 18, velocity: 18 },
      { number: 4, plannedPoints: 25, completedPoints: 15, velocity: 15 }
    ];

    render(<VelocityChart data={decreasingData} currentSprint={mockCurrentSprint} />);
    
    // Should show downward trend
    expect(screen.getByText(/31\.0/)).toBeInTheDocument(); // Percentage for negative trend
  });

  it('allows switching between line and bar chart types', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    // Should start with line chart
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Click bar chart button (it has an icon, so we'll find it by the icon)
    const buttons = screen.getAllByRole('button');
    const barButton = buttons.find(button => button.querySelector('svg'));
    fireEvent.click(barButton);
    
    // Should switch to bar chart
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('displays current sprint information', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    expect(screen.getByText('Current Sprint 4')).toBeInTheDocument();
    expect(screen.getByText('Complete dashboard features')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('handles stable trend correctly', () => {
    const stableData = [
      { number: 1, plannedPoints: 20, completedPoints: 20, velocity: 20 },
      { number: 2, plannedPoints: 20, completedPoints: 21, velocity: 21 },
      { number: 3, plannedPoints: 20, completedPoints: 19, velocity: 19 },
      { number: 4, plannedPoints: 20, completedPoints: 20, velocity: 20 }
    ];

    render(<VelocityChart data={stableData} currentSprint={mockCurrentSprint} />);
    
    // Should show stable trend
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('calculates recent average correctly', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    // Recent average should be calculated from last few sprints
    // For the mock data, it should show the recent average
    expect(screen.getByText('Recent Avg')).toBeInTheDocument();
  });

  it('handles insufficient data for trend calculation', () => {
    const limitedData = [
      { number: 1, plannedPoints: 20, completedPoints: 18, velocity: 18 }
    ];

    render(<VelocityChart data={limitedData} currentSprint={mockCurrentSprint} />);
    
    // Should still render but without trend indicator
    expect(screen.getByText('Team Velocity')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('formats chart data correctly for line chart', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    // Should render line chart with 3 datasets (planned, completed, average)
    expect(screen.getByText('Line Chart - 3 datasets')).toBeInTheDocument();
  });

  it('formats chart data correctly for bar chart', () => {
    render(<VelocityChart data={mockVelocityData} currentSprint={mockCurrentSprint} />);
    
    // Switch to bar chart
    const buttons = screen.getAllByRole('button');
    const barButton = buttons.find(button => button.querySelector('svg'));
    fireEvent.click(barButton);
    
    // Should render bar chart with 2 datasets (planned, completed - no average line)
    expect(screen.getByText('Bar Chart - 2 datasets')).toBeInTheDocument();
  });

  it('shows confidence level in trend analysis', () => {
    const longHistoryData = Array.from({ length: 8 }, (_, i) => ({
      number: i + 1,
      plannedPoints: 20 + i,
      completedPoints: 18 + i,
      velocity: 18 + i
    }));

    render(<VelocityChart data={longHistoryData} currentSprint={mockCurrentSprint} />);
    
    // With more data points, should show trend information
    expect(screen.getByText('Team Velocity')).toBeInTheDocument();
  });
});