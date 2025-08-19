/**
 * Admin Panel Components Tests
 * Unit tests for admin panel components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductManagement from '../ProductManagement';
import UserManagement from '../UserManagement';
import ReportingDashboard from '../ReportingDashboard';

// Mock the toast hook
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock recharts components for testing
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProductManagement Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders product management interface', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });

    renderWithRouter(<ProductManagement />);

    expect(screen.getByText('Product Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your lending inventory')).toBeInTheDocument();
    expect(screen.getByText('Add Product')).toBeInTheDocument();
    expect(screen.getByText('Bulk Import')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('displays products when data is loaded', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'MacBook Pro',
        brand: 'Apple',
        model: 'M2',
        category_name: 'Electronics',
        conditionStatus: 'excellent',
        isAvailable: true,
        location: 'Office A'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProducts,
          pagination: { page: 1, limit: 20, total: 1, pages: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });

    renderWithRouter(<ProductManagement />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('M2')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });

  it('opens add product dialog when button is clicked', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });

    renderWithRouter(<ProductManagement />);

    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Product'));

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
      expect(screen.getByText('Create a new product in the lending system')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });

    renderWithRouter(<ProductManagement />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'MacBook' } });

    expect(searchInput.value).toBe('MacBook');
  });
});

describe('UserManagement Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders user management interface', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 1 }
      })
    });

    renderWithRouter(<UserManagement />);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument();
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  it('displays users when data is loaded', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
        status: 'active',
        department: 'Engineering',
        lastLogin: '2024-01-15T10:00:00Z'
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockUsers,
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
      })
    });

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
  });

  it('handles user search functionality', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 1 }
      })
    });

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(searchInput.value).toBe('John');
  });
});

describe('ReportingDashboard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders reporting dashboard interface', async () => {
    const mockAnalytics = {
      lendingOverview: {
        total_transactions: 1000,
        active_transactions: 75,
        overdue_transactions: 5,
        returned_transactions: 920,
        avg_lending_period: 25
      },
      monthlyTrends: [],
      popularProducts: [],
      productDistribution: [],
      conditionAnalysis: [],
      overdueAnalysis: { count: 5, items: [] }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAnalytics
      })
    });

    renderWithRouter(<ReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Reporting Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive analytics and insights')).toBeInTheDocument();
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
      expect(screen.getByText('Export Excel')).toBeInTheDocument();
    });
  });

  it('displays analytics metrics correctly', async () => {
    const mockAnalytics = {
      lendingOverview: {
        total_transactions: 1000,
        active_transactions: 75,
        overdue_transactions: 5,
        returned_transactions: 920,
        avg_lending_period: 25
      },
      monthlyTrends: [],
      popularProducts: [],
      productDistribution: [],
      conditionAnalysis: [],
      overdueAnalysis: { count: 5, items: [] }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAnalytics
      })
    });

    renderWithRouter(<ReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1K')).toBeInTheDocument(); // Total transactions formatted
      expect(screen.getByText('75')).toBeInTheDocument(); // Active loans
      expect(screen.getByText('25 days')).toBeInTheDocument(); // Avg lending period
    });
  });

  it('handles tab navigation', async () => {
    const mockAnalytics = {
      lendingOverview: {
        total_transactions: 1000,
        active_transactions: 75,
        overdue_transactions: 5,
        returned_transactions: 920,
        avg_lending_period: 25
      },
      monthlyTrends: [],
      popularProducts: [],
      productDistribution: [],
      conditionAnalysis: [],
      overdueAnalysis: { count: 5, items: [] }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAnalytics
      })
    });

    renderWithRouter(<ReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Overdue Analysis')).toBeInTheDocument();
    });

    // Test tab switching
    fireEvent.click(screen.getByText('Trends'));
    await waitFor(() => {
      expect(screen.getByText('Monthly Transaction Trends')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Products'));
    await waitFor(() => {
      expect(screen.getByText('Most Popular Products')).toBeInTheDocument();
    });
  });

  it('renders charts correctly', async () => {
    const mockAnalytics = {
      lendingOverview: {
        total_transactions: 1000,
        active_transactions: 75,
        overdue_transactions: 5,
        returned_transactions: 920,
        avg_lending_period: 25
      },
      monthlyTrends: [
        { month: '2024-01', transactions_count: 85 }
      ],
      popularProducts: [],
      productDistribution: [],
      conditionAnalysis: [
        { condition_status: 'excellent', count: 200 }
      ],
      overdueAnalysis: { count: 5, items: [] }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAnalytics
      })
    });

    renderWithRouter(<ReportingDashboard />);

    await waitFor(() => {
      expect(screen.getAllByTestId('chart-container')).toHaveLength(2); // Two charts on overview tab
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  it('handles API errors in ProductManagement', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithRouter(<ProductManagement />);

    await waitFor(() => {
      expect(screen.getByText('Product Management')).toBeInTheDocument();
    });
  });

  it('handles API errors in UserManagement', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('handles API errors in ReportingDashboard', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithRouter(<ReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Reporting Dashboard')).toBeInTheDocument();
    });
  });
});