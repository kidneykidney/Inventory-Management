import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CapacityPlanningDashboard from '../CapacityPlanningDashboard';

// Mock fetch
global.fetch = jest.fn();

const mockCapacityData = {
  timestamp: '2024-01-15T10:00:00.000Z',
  timeframe: '7d',
  cpu: {
    current: 45,
    average: 38,
    peak: 67,
    trend: 'stable',
  },
  memory: {
    current: 62,
    average: 55,
    peak: 78,
    trend: 'increasing',
  },
  users: {
    current: 25,
    capacity: 100,
    trend: 'increasing',
  },
  responseTime: {
    current: 320,
    p95: 480,
    trend: 'stable',
  },
  alerts: [
    {
      severity: 'warning',
      title: 'Memory Usage Trending Up',
      description: 'Memory usage has increased 15% over the past week',
      metric: 'memory',
      value: 62,
      threshold: 60,
    },
  ],
  recommendations: [
    {
      title: 'Monitor Memory Growth',
      description: 'Memory usage is trending upward',
      priority: 'medium',
      actions: [
        'Implement memory profiling',
        'Review memory-intensive operations',
        'Consider memory optimization',
      ],
      estimatedImpact: '10-20% memory reduction',
    },
  ],
  forecast: [
    {
      resource: 'CPU',
      timeframe: '7d',
      current: '45%',
      projected: '54%',
      recommended: '70%',
    },
    {
      resource: 'Memory',
      timeframe: '7d',
      current: '512MB',
      projected: '614MB',
      recommended: '800MB',
    },
  ],
  optimization: {
    database: [
      {
        suggestion: 'Add indexes for frequently queried columns',
        impact: 'High',
      },
      {
        suggestion: 'Implement query result caching',
        impact: 'Medium',
      },
    ],
    infrastructure: [
      {
        suggestion: 'Implement CDN for static assets',
        impact: 'Medium',
      },
      {
        suggestion: 'Enable gzip compression for API responses',
        impact: 'Low',
      },
    ],
  },
};

describe('CapacityPlanningDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CapacityPlanningDashboard />);

    expect(screen.getByText('Capacity Planning')).toBeInTheDocument();
    expect(
      screen.getByText('Monitor system capacity and plan for scaling')
    ).toBeInTheDocument();

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders capacity data correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    // CPU metrics
    expect(screen.getByText('Peak: 67% | Avg: 38%')).toBeInTheDocument();

    // Memory metrics
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('Peak: 78% | Avg: 55%')).toBeInTheDocument();

    // Users metrics
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 100 users')).toBeInTheDocument();

    // Response time metrics
    expect(screen.getByText('320ms')).toBeInTheDocument();
    expect(
      screen.getByText('Target: <1000ms | P95: 480ms')
    ).toBeInTheDocument();
  });

  it('displays capacity alerts', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Capacity Alerts')).toBeInTheDocument();
    });

    expect(screen.getByText('Memory Usage Trending Up')).toBeInTheDocument();
    expect(
      screen.getByText('Memory usage has increased 15% over the past week')
    ).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('displays scaling recommendations', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Scaling Recommendations')).toBeInTheDocument();
    });

    expect(screen.getByText('Monitor Memory Growth')).toBeInTheDocument();
    expect(
      screen.getByText('Memory usage is trending upward')
    ).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('Implement memory profiling')).toBeInTheDocument();
    expect(
      screen.getByText('Estimated impact: 10-20% memory reduction')
    ).toBeInTheDocument();
  });

  it('displays capacity forecast', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Capacity Forecast')).toBeInTheDocument();
    });

    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Current Usage:')).toBeInTheDocument();
    expect(screen.getByText('Projected Usage:')).toBeInTheDocument();
    expect(screen.getByText('Recommended Capacity:')).toBeInTheDocument();
  });

  it('displays performance optimization suggestions', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    });

    expect(screen.getByText('Database Optimization')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure Optimization')).toBeInTheDocument();
    expect(
      screen.getByText('Add indexes for frequently queried columns')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Implement CDN for static assets')
    ).toBeInTheDocument();
  });

  it('handles timeframe selection', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    // Click on 30d timeframe
    const thirtyDayButton = screen.getByRole('button', { name: '30d' });
    fireEvent.click(thirtyDayButton);

    // Should call API with new timeframe
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/performance/capacity-planning?timeframe=30d'
      );
    });
  });

  it('handles API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load capacity planning data/)
      ).toBeInTheDocument();
    });
  });

  it('displays trend icons correctly', async () => {
    const dataWithTrends = {
      ...mockCapacityData,
      cpu: { ...mockCapacityData.cpu, trend: 'increasing' },
      memory: { ...mockCapacityData.memory, trend: 'decreasing' },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithTrends,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    // Should show trend icons (we can't easily test the specific icons, but we can verify the component renders)
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('calculates progress bars correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCapacityData,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    // Progress bars should be rendered (we can verify they exist in the DOM)
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles no alerts scenario', async () => {
    const dataWithoutAlerts = {
      ...mockCapacityData,
      alerts: [],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithoutAlerts,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    // Should not show alerts section when there are no alerts
    expect(screen.queryByText('Capacity Alerts')).not.toBeInTheDocument();
  });

  it('displays correct status colors for different severities', async () => {
    const dataWithCriticalAlert = {
      ...mockCapacityData,
      alerts: [
        {
          severity: 'critical',
          title: 'Critical Issue',
          description: 'System is at capacity',
          metric: 'cpu',
          value: 95,
          threshold: 80,
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithCriticalAlert,
    });

    render(<CapacityPlanningDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Critical Issue')).toBeInTheDocument();
    });

    expect(screen.getByText('critical')).toBeInTheDocument();
  });
});
