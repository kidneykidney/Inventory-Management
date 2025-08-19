import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BorrowingDashboard from '../BorrowingDashboard';

// Mock the toast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock the ReturnProcessDialog component
jest.mock('../../components/lending/ReturnProcessDialog', () => {
  return function MockReturnProcessDialog({ isOpen, onClose, transaction, onReturnSuccess }) {
    if (!isOpen) return null;
    return (
      <div data-testid="return-dialog">
        <div>Return Dialog for {transaction?.productName}</div>
        <button onClick={onReturnSuccess}>Mock Return Success</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

const mockActiveTransactions = [
  {
    id: 'transaction-1',
    productName: 'MacBook Pro',
    productBrand: 'Apple',
    lendDate: '2024-01-01T00:00:00Z',
    dueDate: '2024-01-31T00:00:00Z',
    status: 'active'
  }
];

const mockOverdueTransactions = [
  {
    id: 'transaction-2',
    productName: 'iPad Pro',
    productBrand: 'Apple',
    lendDate: '2023-12-01T00:00:00Z',
    dueDate: '2023-12-31T00:00:00Z',
    status: 'overdue'
  }
];

const mockHistory = [
  {
    id: 'transaction-3',
    productName: 'iPhone',
    productBrand: 'Apple',
    lendDate: '2023-11-01T00:00:00Z',
    dueDate: '2023-11-30T00:00:00Z',
    returnDate: '2023-11-28T00:00:00Z',
    status: 'returned'
  }
];

describe('BorrowingDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
    
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockActiveTransactions })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockOverdueTransactions })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockHistory })
      });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders dashboard with summary cards', async () => {
    render(<BorrowingDashboard />);

    expect(screen.getByText('Loading your borrowing information...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('My Borrowing Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Active Loans')).toBeInTheDocument();
      expect(screen.getByText('Due Soon')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  it('displays correct counts in summary cards', async () => {
    render(<BorrowingDashboard />);

    await waitFor(() => {
      // Active loans count
      expect(screen.getByText('1')).toBeInTheDocument(); // Active count
      // Overdue count
      expect(screen.getByText('1')).toBeInTheDocument(); // Overdue count
    });
  });

  it('shows overdue alert when there are overdue items', async () => {
    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/You have 1 overdue item/)).toBeInTheDocument();
    });
  });

  it('displays active transactions in active tab', async () => {
    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  it('switches to overdue tab and shows overdue transactions', async () => {
    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Click overdue tab
    fireEvent.click(screen.getByText('Overdue (1)'));

    await waitFor(() => {
      expect(screen.getByText('iPad Pro')).toBeInTheDocument();
    });
  });

  it('switches to history tab and shows transaction history', async () => {
    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Click history tab
    fireEvent.click(screen.getByText('History (1)'));

    await waitFor(() => {
      expect(screen.getByText('iPhone')).toBeInTheDocument();
    });
  });

  it('opens return dialog when return button is clicked', async () => {
    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Click return button
    fireEvent.click(screen.getByText('Return Item'));

    await waitFor(() => {
      expect(screen.getByTestId('return-dialog')).toBeInTheDocument();
      expect(screen.getByText('Return Dialog for MacBook Pro')).toBeInTheDocument();
    });
  });

  it('refreshes data when return is successful', async () => {
    // Mock additional API calls for refresh
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockActiveTransactions })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockOverdueTransactions })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockHistory })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }) // Empty active after return
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockOverdueTransactions })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [...mockHistory, mockActiveTransactions[0]] })
      });

    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Click return button
    fireEvent.click(screen.getByText('Return Item'));

    await waitFor(() => {
      expect(screen.getByTestId('return-dialog')).toBeInTheDocument();
    });

    // Simulate successful return
    fireEvent.click(screen.getByText('Mock Return Success'));

    await waitFor(() => {
      // Should make new API calls to refresh data
      expect(fetch).toHaveBeenCalledTimes(6); // Initial 3 + refresh 3
    });
  });

  it('shows empty state for active loans when none exist', async () => {
    // Mock empty active transactions
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      });

    render(<BorrowingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No Active Loans')).toBeInTheDocument();
      expect(screen.getByText('Browse Available Items')).toBeInTheDocument();
    });
  });

  it('shows empty state for overdue items when none exist', async () => {
    // Mock empty overdue transactions
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      });

    render(<BorrowingDashboard />);

    await waitFor(() => {
      // Switch to overdue tab
      fireEvent.click(screen.getByText('Overdue (0)'));
    });

    await waitFor(() => {
      expect(screen.getByText('No Overdue Items')).toBeInTheDocument();
      expect(screen.getByText('Great job! You don\'t have any overdue items.')).toBeInTheDocument();
    });
  });

  it('shows empty state for history when none exists', async () => {
    // Mock empty history
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] })
      });

    render(<BorrowingDashboard />);

    await waitFor(() => {
      // Switch to history tab
      fireEvent.click(screen.getByText('History (0)'));
    });

    await waitFor(() => {
      expect(screen.getByText('No History')).toBeInTheDocument();
      expect(screen.getByText('Your borrowing history will appear here.')).toBeInTheDocument();
    });
  });
});