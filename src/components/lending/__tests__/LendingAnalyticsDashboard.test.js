import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LendingAnalyticsDashboard from '../LendingAnalyticsDashboard';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}));

// Mock fetch
global.fetch = jest.fn();

const mockAnalyticsData = {
  generatedAt: '2024-01-15T10:00:00Z',
  overview: {
    transactions: {
      total_transactions: 100,
      active_transactions: 20,
      overdue_transactions: 5,
      returned_transactions: 70,
      lost_transactions: 5,
      avg_lending_period: 15.5,
      unique_borrowers: 25,
      products_lent: 40
    },
    products: {
      total_products: 50,
      available_products: 30,
      unavailable_products: 20,
      total_categories: 8
    },
    utilization: {
      utilization_rate: 80.00
    }
  },
  trends: [
    {
      period: '2024-01',
      total_lendings: 15,
      unique_borrowers: 8,
      unique_products: 12,
      returned_count: 12,
      overdue_count: 2,
      avg_lending_period: 14.5
    }
  ],
  popularProducts: [
    {
      id: 'product-1',
      product_name: 'MacBook Pro',
      brand: 'Apple',
      model: 'M2',
      category_name: 'Electronics',
      lending_count: 25,
      avg_lending_period: 14.5,
      overdue_count: 2,
      return_rate: 92.00
    }
  ],
  categoryAnalytics: [
    {
      category_name: 'Electronics',
      total_products: 25,
      total_lendings: 150,
      available_products: 15,
      active_lendings: 10,
      overdue_lendings: 2,
      avg_lending_period: 16.5,
      avg_lendings_per_product: 6.00
    }
  ],
  userBehavior: {
    topBorrowers: [
      {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        total_lendings: 15,
        overdue_count: 1,
        returned_count: 14,
        avg_lending_period: 13.5,
        return_rate: 93.33
      }
    ],
    borrowingPatterns: [
      { day_of_week: 'Monday', lending_count: 25, avg_lending_period: 14.2 }
    ],
    monthlyEngagement: [
      {
        month: '2024-01',
        active_users: 15,
        total_lendings: 45,
        avg_lendings_per_user: 3.00
      }
    ]
  },
  overdueAnalytics: {
    overview: {
      total_overdue: 8,
      avg_days_overdue: 5.5,
      max_days_overdue: 15,
      unique_overdue_borrowers: 6,
      unique_overdue_products: 7
    },
    byCategory: [
      {
        category_name: 'Electronics',
        overdue_count: 5,
        avg_days_overdue: 6.2
      }
    ],
    byUser: [
      {
        username: 'late_user',
        email: 'late@example.com',
        overdue_count: 3,
        avg_days_overdue: 8.5,
        max_days_overdue: 15
      }
    ]
  },
  predictiveAnalytics: {
    trendingProducts: [
      {
        id: 'product-1',
        product_name: 'iPad Pro',
        brand: 'Apple',
        model: '12.9"',
        category_name: 'Electronics',
        recent_lendings: 8,
        historical_lendings: 5,
        growth_rate: 60.00
      }
    ],
    peakPeriods: [
      {
        hour_of_day: 9,
        lending_count: 25,
        avg_hourly_lendings: 15.5,
        relative_activity: 161.29
      }
    ],
    overdueRiskProducts: [
      {
        id: 'product-2',
        product_name: 'Expensive Camera',
        brand: 'Canon',
        model: 'EOS R5',
        total_lendings: 10,
        overdue_count: 3,
        overdue_rate: 30.00,
        avg_lending_period: 25.5
      }
    ]
  },
  performance: {
    system: {
      return_rate: 92.5
    }
  }
};

describe('LendingAnalyticsDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LendingAnalyticsDashboard />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders analytics dashboard with data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    // Check overview cards
    expect(screen.getByText('100')).toBeInTheDocument(); // Total transactions
    expect(screen.getByText('30')).toBeInTheDocument(); // Available products
    expect(screen.getByText('80%')).toBeInTheDocument(); // Utilization rate
    expect(screen.getByText('5')).toBeInTheDocument(); // Overdue items
  });

  it('handles API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading analytics/)).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('exports report when export button is clicked', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  it('switches between different tabs', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    // Click on Popular Products tab
    const productsTab = screen.getByText('Popular Products');
    fireEvent.click(productsTab);

    expect(screen.getByText('Most Popular Products')).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();

    // Click on Categories tab
    const categoriesTab = screen.getByText('Categories');
    fireEvent.click(categoriesTab);

    expect(screen.getByText('Category Distribution')).toBeInTheDocument();

    // Click on User Behavior tab
    const usersTab = screen.getByText('User Behavior');
    fireEvent.click(usersTab);

    expect(screen.getByText('Top Borrowers')).toBeInTheDocument();
    expect(screen.getByText('john_doe')).toBeInTheDocument();

    // Click on Overdue Tracking tab
    const overdueTab = screen.getByText('Overdue Tracking');
    fireEvent.click(overdueTab);

    expect(screen.getByText('Overdue Overview')).toBeInTheDocument();

    // Click on Predictive Analytics tab
    const predictiveTab = screen.getByText('Predictive Analytics');
    fireEvent.click(predictiveTab);

    expect(screen.getByText('Trending Products')).toBeInTheDocument();
    expect(screen.getByText('iPad Pro')).toBeInTheDocument();
  });

  it('displays charts correctly', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    // Check that charts are rendered
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(1); // Trends chart
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('handles empty data gracefully', async () => {
    const emptyData = {
      ...mockAnalyticsData,
      popularProducts: [],
      categoryAnalytics: [],
      userBehavior: {
        topBorrowers: [],
        borrowingPatterns: [],
        monthlyEngagement: []
      }
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: emptyData })
    });

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    // Should still render without errors
    expect(screen.getByText('100')).toBeInTheDocument(); // Total transactions
  });

  it('formats dates and numbers correctly', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockAnalyticsData })
    });

    render(<LendingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Lending Analytics Dashboard')).toBeInTheDocument();
    });

    // Check that the generated date is displayed
    expect(screen.getByText(/Generated on/)).toBeInTheDocument();
    
    // Check that percentages are formatted correctly
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});