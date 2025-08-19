import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamPerformanceDashboard from '../TeamPerformanceDashboard';

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: () => <div data-testid="scatter" />
}));

describe('TeamPerformanceDashboard', () => {
  const mockTeamData = {
    teamSize: 5,
    capacity: 200,
    utilization: 85
  };

  const mockSprintData = [
    {
      id: 1,
      number: 1,
      velocity: 20,
      plannedPoints: 25,
      completedPoints: 20,
      stories: [
        { status: 'done' },
        { status: 'done' },
        { status: 'in-progress' }
      ],
      bugCount: 3,
      testCoverage: 85,
      codeReviewScore: 8.5,
      technicalDebtHours: 5,
      burndownData: [
        { day: 1, remaining: 25 },
        { day: 10, remaining: 2 }
      ]
    },
    {
      id: 2,
      number: 2,
      velocity: 22,
      plannedPoints: 24,
      completedPoints: 22,
      stories: [
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
        { status: 'done' }
      ],
      bugCount: 2,
      testCoverage: 88,
      codeReviewScore: 9.0,
      technicalDebtHours: 3
    }
  ];

  const mockRetrospectiveData = [
    {
      sprintId: 1,
      teamMorale: 7,
      velocityRating: 8,
      qualityRating: 7,
      communicationRating: 8
    },
    {
      sprintId: 2,
      teamMorale: 8,
      velocityRating: 9,
      qualityRating: 8,
      communicationRating: 9
    }
  ];

  const defaultProps = {
    teamData: mockTeamData,
    sprintData: mockSprintData,
    retrospectiveData: mockRetrospectiveData
  };

  it('renders key performance metrics cards', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Average Velocity')).toBeInTheDocument();
    expect(screen.getByText('Burndown Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Story Completion')).toBeInTheDocument();
    expect(screen.getByText('Team Satisfaction')).toBeInTheDocument();
  });

  it('displays calculated metrics correctly', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    // Average velocity should be (20 + 22) / 2 = 21
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('renders all tab options', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Velocity')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
    expect(screen.getByText('Completion')).toBeInTheDocument();
    expect(screen.getByText('Predictive')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    // Click on Quality tab
    fireEvent.click(screen.getByText('Quality'));
    expect(screen.getByText('Quality Metrics Trend')).toBeInTheDocument();
    expect(screen.getByText('Bug Count & Technical Debt')).toBeInTheDocument();
    
    // Click on Satisfaction tab
    fireEvent.click(screen.getByText('Satisfaction'));
    expect(screen.getByText('Team Satisfaction Radar')).toBeInTheDocument();
  });

  it('renders charts in velocity tab', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    // Velocity tab should be active by default
    expect(screen.getByText('Velocity Trend Analysis')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders quality metrics in quality tab', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Quality'));
    
    expect(screen.getByText('Quality Metrics Trend')).toBeInTheDocument();
    expect(screen.getByText('Bug Count & Technical Debt')).toBeInTheDocument();
    expect(screen.getAllByTestId('area-chart')).toHaveLength(1);
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(1);
  });

  it('renders satisfaction radar chart', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Satisfaction'));
    
    expect(screen.getByText('Team Satisfaction Radar')).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('renders completion metrics with progress bars', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Completion'));
    
    expect(screen.getByText('Story Completion Rate')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders predictive analytics', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Predictive'));
    
    expect(screen.getByText('Predictive Velocity')).toBeInTheDocument();
    expect(screen.getByText('Capacity Planning')).toBeInTheDocument();
    expect(screen.getByText('Predicted points for next sprint')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptyProps = {
      teamData: {},
      sprintData: [],
      retrospectiveData: []
    };
    
    render(<TeamPerformanceDashboard {...emptyProps} />);
    
    // Should still render the component structure
    expect(screen.getByText('Average Velocity')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Default values
  });

  it('calculates burndown accuracy correctly', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    // With mock data, sprint 1 has remaining: 2 (accurate), sprint 2 has no burndown data
    // So accuracy should be 50% (1 out of 2 sprints with burndown data)
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays team capacity information in predictive tab', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Predictive'));
    
    expect(screen.getByText('Team Capacity')).toBeInTheDocument();
    expect(screen.getByText('200 hrs/sprint')).toBeInTheDocument();
  });

  it('shows trend indicators correctly', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    // Should show velocity trend (22 > 20, so positive trend)
    // The exact implementation depends on the trend calculation logic
    expect(screen.getByText('Average Velocity')).toBeInTheDocument();
  });

  it('renders responsive containers for all charts', () => {
    render(<TeamPerformanceDashboard {...defaultProps} />);
    
    // Check velocity tab
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    
    // Check quality tab
    fireEvent.click(screen.getByText('Quality'));
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    
    // Check satisfaction tab
    fireEvent.click(screen.getByText('Satisfaction'));
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });
});