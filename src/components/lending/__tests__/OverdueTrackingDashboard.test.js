import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OverdueTrackingDashboard from '../OverdueTrackingDashboard';

// Mock fetch
global.fetch = jest.fn();

const mockOverdueData = [
  {
    transaction_id: 'trans-1',
    product_name: 'MacBook Pro',
    brand: 'Apple',
    model: 'M2',
    category_name: 'Electronics',
    borrower_name: 'John Doe',
    borrower_email: 'john@example.com',
    lend_date: '2024-01-01',
    due_date: '2024-01-15',
    days_overdue: 10,
    escalation_level: 'Medium',
    reminders_sent: 3,
    last_reminder_sent: '2024-01-20'
  },
  {
    transaction_id: 'trans-2',
    product_name: 'Dell Monitor',
    brand: 'Dell',
    model: 'U2720Q',
    category_name: 'Electronics',
    borrower_name: 'Jane Smith',
    borrower_email: 'jane@example.com',
    lend_date: '2023-12-01',
    due_date: '2023-12-31',
    days_overdue: 35,
    escalation_level: 'Critical',
    reminders_sent: 8,
    last_reminder_sent: '2024-01-22'
  }
];

describe('OverdueTrackingDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<OverdueTrackingDashboard />);

    expect(screen.getByText('Loading overdue items...')).toBeInTheDocument();
  });

  it('renders overdue tracking dashboard with data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: {
          count: 2,
          escalationLevels: {
            low: 0,
            medium: 1,
            high: 0,
            critical: 1
          }
        }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Check that overdue items are displayed
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Dell Monitor')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading overdue items/)).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('filters overdue items by search term', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Both items should be visible initially
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Dell Monitor')).toBeInTheDocument();

    // Search for "MacBook"
    const searchInput = screen.getByPlaceholderText(/Search by product, borrower name, or email/);
    fireEvent.change(searchInput, { target: { value: 'MacBook' } });

    // Only MacBook should be visible
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.queryByText('Dell Monitor')).not.toBeInTheDocument();
  });

  it('filters overdue items by escalation level', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Both items should be visible initially
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Dell Monitor')).toBeInTheDocument();

    // Filter by Critical level
    const escalationSelect = screen.getByDisplayValue('All Levels');
    fireEvent.click(escalationSelect);
    
    const criticalOption = screen.getByText('Critical');
    fireEvent.click(criticalOption);

    // Only Critical item should be visible
    expect(screen.queryByText('MacBook Pro')).not.toBeInTheDocument();
    expect(screen.getByText('Dell Monitor')).toBeInTheDocument();
  });

  it('sends reminder when send reminder button is clicked', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: mockOverdueData,
          meta: { count: 2 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: mockOverdueData,
          meta: { count: 2 }
        })
      });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    const sendReminderButtons = screen.getAllByText('Send Reminder');
    fireEvent.click(sendReminderButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/v1/email-notifications/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ transactionId: 'trans-1' })
      });
    });
  });

  it('handles escalation for critical items', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    // Mock window.open
    global.open = jest.fn();

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    const escalateButtons = screen.getAllByText('Escalate');
    expect(escalateButtons).toHaveLength(1); // Only critical items have escalate button

    fireEvent.click(escalateButtons[0]);

    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining('mailto:jane@example.com')
    );
  });

  it('refreshes data when refresh button is clicked', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('displays escalation level badges correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Check escalation level badges
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('displays escalation workflow guide', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Check escalation workflow guide
    expect(screen.getByText('Escalation Workflow')).toBeInTheDocument();
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('displays empty state when no overdue items', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: [],
        meta: { count: 0 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    expect(screen.getByText('No overdue items found')).toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Check that dates are formatted correctly
    expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // Due date
    expect(screen.getByText('12/31/2023')).toBeInTheDocument(); // Due date
  });

  it('displays reminder information correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockOverdueData,
        meta: { count: 2 }
      })
    });

    render(<OverdueTrackingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Item Tracking')).toBeInTheDocument();
    });

    // Check reminder counts
    expect(screen.getByText('3')).toBeInTheDocument(); // First item reminders
    expect(screen.getByText('8')).toBeInTheDocument(); // Second item reminders
  });
});