import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerformanceMonitoringDashboard from '../PerformanceMonitoringDashboard';

// Mock fetch
global.fetch = jest.fn();

const mockPerformanceData = {
  backend: {
    requests: {
      avgResponseTime: 250,
      total: 1500,
    },
    system: {
      memoryUsage: 384,
      uptime: 7200,
      nodeVersion: 'v18.17.0',
    },
    database: {
      queryCount: 2500,
      slowQueries: 3,
    },
  },
  frontend: {
    pageLoads: {
      avgLoadTime: 1800,
      count: 45,
    },
    coreWebVitals: {
      lcp: {
        count: 20,
        goodCount: 18,
      },
      fid: {
        count: 20,
        goodCount: 19,
      },
      cls: {
        count: 20,
        goodCount: 17,
      },
    },
  },
};

describe('PerformanceMonitoringDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PerformanceMonitoringDashboard />);

    expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time system performance metrics')
    ).toBeInTheDocument();

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders performance data correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('250ms')).toBeInTheDocument();
    });

    // Backend metrics
    expect(screen.getByText('384MB')).toBeInTheDocument();
    expect(screen.getByText('2500')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();

    // Frontend metrics
    expect(screen.getByText('1800ms')).toBeInTheDocument();
    expect(screen.getByText('45 page loads tracked')).toBeInTheDocument();
  });

  it('displays correct status badges based on thresholds', async () => {
    const highResponseTimeData = {
      ...mockPerformanceData,
      backend: {
        ...mockPerformanceData.backend,
        requests: {
          avgResponseTime: 1500, // Above warning threshold
          total: 1500,
        },
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => highResponseTimeData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1500ms')).toBeInTheDocument();
    });

    // Should show warning badge for high response time
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('displays performance alerts for issues', async () => {
    const problematicData = {
      ...mockPerformanceData,
      backend: {
        ...mockPerformanceData.backend,
        requests: {
          avgResponseTime: 1200, // Above threshold
          total: 1500,
        },
        system: {
          ...mockPerformanceData.backend.system,
          memoryUsage: 600, // Above threshold
        },
        database: {
          queryCount: 2500,
          slowQueries: 10, // Above threshold
        },
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => problematicData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Alerts')).toBeInTheDocument();
    });

    // Should show alerts for high response time, memory usage, and slow queries
    expect(screen.getByText(/High response time detected/)).toBeInTheDocument();
    expect(screen.getByText(/High memory usage detected/)).toBeInTheDocument();
    expect(
      screen.getByText(/Multiple slow database queries detected/)
    ).toBeInTheDocument();
  });

  it('shows no alerts when performance is good', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Alerts')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/No performance issues detected/)
    ).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('250ms')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/ });
    fireEvent.click(refreshButton);

    // Should call fetch again
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles auto refresh toggle', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('250ms')).toBeInTheDocument();
    });

    const autoRefreshButton = screen.getByRole('button', {
      name: /Auto Refresh/,
    });
    fireEvent.click(autoRefreshButton);

    // Button should toggle state (visual feedback)
    expect(autoRefreshButton).toBeInTheDocument();
  });

  it('handles load test execution', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerformanceData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'load-test-123',
          status: 'started',
        }),
      });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('250ms')).toBeInTheDocument();
    });

    const loadTestButton = screen.getByRole('button', { name: /Load Test/ });
    fireEvent.click(loadTestButton);

    // Should show running state
    await waitFor(() => {
      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    // Should call load test API
    expect(fetch).toHaveBeenCalledWith('/api/v1/performance/load-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarios: ['default'],
        baseUrl: window.location.origin,
      }),
    });
  });

  it('handles API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load performance data/)
      ).toBeInTheDocument();
    });
  });

  it('calculates Core Web Vitals percentages correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    // LCP: 18/20 = 90%
    expect(screen.getByText('90%')).toBeInTheDocument();
    // FID: 19/20 = 95%
    expect(screen.getByText('95%')).toBeInTheDocument();
    // CLS: 17/20 = 85%
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays system uptime correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    // 7200 seconds = 2 hours
    expect(screen.getByText('Uptime: 2h 0m')).toBeInTheDocument();
  });

  it('renders quick action buttons', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerformanceData,
    });

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('View Trends')).toBeInTheDocument();
    expect(screen.getByText('Query Analysis')).toBeInTheDocument();
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('Health Check')).toBeInTheDocument();
  });
});
