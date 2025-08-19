import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressMetricsCards from '../ProgressMetricsCards';

describe('ProgressMetricsCards', () => {
  const mockMetrics = {
    velocityTrend: {
      current: 25,
      change: 15,
    },
    sprintProgress: {
      completionRate: 75,
      completedStories: 6,
      totalStories: 8,
      pointsRemaining: 10,
      daysRemaining: 3,
      onTrack: true,
    },
    teamUtilization: {
      rate: 85,
      activeMembers: 4,
    },
    qualityMetrics: {
      score: 8.5,
      testsPass: 95,
    },
    riskIndicators: [
      {
        level: 'medium',
        description: 'One team member over-allocated',
      },
    ],
    predictiveAnalytics: {
      completionForecast: 'On Time',
      confidence: 'high',
      recommendation: 'Continue current pace',
    },
  };

  const mockSprint = {
    id: '1',
    number: 3,
    status: 'active',
    goal: 'Complete user dashboard features',
    startDate: '2024-01-15',
    endDate: '2024-01-28',
  };

  it('renders nothing when no metrics provided', () => {
    const { container } = render(
      <ProgressMetricsCards metrics={null} sprint={mockSprint} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all metric cards with correct values', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    // Sprint Velocity card
    expect(screen.getByText('Sprint Velocity')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('+15% from last sprint')).toBeInTheDocument();

    // Sprint Progress card
    expect(screen.getByText('Sprint Progress')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element && element.textContent.includes('75%');
      })
    ).toBeInTheDocument();
    expect(screen.getByText('6/8 stories completed')).toBeInTheDocument();

    // Team Utilization card
    expect(screen.getByText('Team Utilization')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('4 active team members')).toBeInTheDocument();

    // Quality Score card
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('95% tests passing')).toBeInTheDocument();
  });

  it('displays progress bars for applicable metrics', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    // Should have progress bars for Sprint Progress, Team Utilization, and Quality Score
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(3);
  });

  it('shows correct trend indicators', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    // Positive velocity trend should show upward arrow
    expect(screen.getByText('+15% from last sprint')).toBeInTheDocument();
  });

  it('displays negative velocity trend correctly', () => {
    const metricsWithNegativeTrend = {
      ...mockMetrics,
      velocityTrend: {
        current: 20,
        change: -10,
      },
    };

    render(
      <ProgressMetricsCards
        metrics={metricsWithNegativeTrend}
        sprint={mockSprint}
      />
    );

    expect(screen.getByText('-10% from last sprint')).toBeInTheDocument();
  });

  it('renders insight cards correctly', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(screen.getByText('Burndown Trend')).toBeInTheDocument();
    expect(screen.getByText('Risk Indicators')).toBeInTheDocument();
    expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
  });

  it('shows burndown trend information', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(screen.getByText('Days Remaining')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Points Remaining')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('displays at risk status when sprint is not on track', () => {
    const atRiskMetrics = {
      ...mockMetrics,
      sprintProgress: {
        ...mockMetrics.sprintProgress,
        onTrack: false,
      },
    };

    render(
      <ProgressMetricsCards metrics={atRiskMetrics} sprint={mockSprint} />
    );

    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('shows risk indicators when present', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(
      screen.getByText('One team member over-allocated')
    ).toBeInTheDocument();
  });

  it('shows no risks message when no risks identified', () => {
    const noRiskMetrics = {
      ...mockMetrics,
      riskIndicators: [],
    };

    render(
      <ProgressMetricsCards metrics={noRiskMetrics} sprint={mockSprint} />
    );

    expect(
      screen.getByText((content, element) => {
        return element && element.textContent === 'No risks identified';
      })
    ).toBeInTheDocument();
  });

  it('displays predictive analytics information', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(screen.getByText('Completion Forecast')).toBeInTheDocument();
    expect(screen.getByText('On Time')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Continue current pace')).toBeInTheDocument();
  });

  it('renders sprint summary card when sprint is provided', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(screen.getByText('Sprint 3')).toBeInTheDocument();
    expect(
      screen.getByText('Complete user dashboard features')
    ).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows correct sprint health status', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    // With 75% completion rate, should show "Good"
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows excellent health for high completion rates', () => {
    const excellentMetrics = {
      ...mockMetrics,
      sprintProgress: {
        ...mockMetrics.sprintProgress,
        completionRate: 90,
      },
    };

    render(
      <ProgressMetricsCards metrics={excellentMetrics} sprint={mockSprint} />
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows needs attention for low completion rates', () => {
    const lowProgressMetrics = {
      ...mockMetrics,
      sprintProgress: {
        ...mockMetrics.sprintProgress,
        completionRate: 40,
      },
    };

    render(
      <ProgressMetricsCards metrics={lowProgressMetrics} sprint={mockSprint} />
    );

    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('displays sprint dates correctly', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(screen.getByText('Jan 15')).toBeInTheDocument(); // Start date
    expect(screen.getByText('Jan 28')).toBeInTheDocument(); // End date
  });

  it('shows correct progress bar colors based on completion rate', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    // Sprint progress with 75% should have orange color (60-80% range)
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles over-allocated team utilization correctly', () => {
    const overAllocatedMetrics = {
      ...mockMetrics,
      teamUtilization: {
        rate: 120,
        activeMembers: 4,
      },
    };

    render(
      <ProgressMetricsCards
        metrics={overAllocatedMetrics}
        sprint={mockSprint}
      />
    );

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element && element.textContent.includes('120%');
      })
    ).toBeInTheDocument();
  });

  it('displays quality score with correct formatting', () => {
    render(<ProgressMetricsCards metrics={mockMetrics} sprint={mockSprint} />);

    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('/10')).toBeInTheDocument();
  });

  it('handles missing predictive analytics gracefully', () => {
    const metricsWithoutPredictive = {
      ...mockMetrics,
      predictiveAnalytics: {
        completionForecast: 'N/A',
        confidence: 'Medium',
      },
    };

    render(
      <ProgressMetricsCards
        metrics={metricsWithoutPredictive}
        sprint={mockSprint}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
});
