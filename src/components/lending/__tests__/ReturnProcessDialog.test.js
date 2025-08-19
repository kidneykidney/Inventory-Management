import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReturnProcessDialog from '../ReturnProcessDialog';

// Mock the toast hook
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockTransaction = {
  id: 'transaction-123',
  productName: 'MacBook Pro',
  productBrand: 'Apple',
  productModel: '13-inch',
  lendDate: '2024-01-01T00:00:00Z',
  dueDate: '2024-01-31T00:00:00Z',
  status: 'active',
};

describe('ReturnProcessDialog', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders dialog when open', () => {
    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    expect(screen.getByText('Return Item')).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ReturnProcessDialog
        isOpen={false}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    expect(screen.queryByText('Return Item')).not.toBeInTheDocument();
  });

  it('shows condition options', () => {
    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Damaged')).toBeInTheDocument();
  });

  it('shows damage warning when damaged condition is selected', () => {
    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    // Click on damaged condition
    fireEvent.click(screen.getByLabelText(/damaged/i));

    expect(screen.getByText('Damage Reported')).toBeInTheDocument();
    expect(
      screen.getByText(/Please provide detailed notes about the damage/)
    ).toBeInTheDocument();
  });

  it('shows overdue warning for overdue items', () => {
    const overdueTransaction = {
      ...mockTransaction,
      status: 'overdue',
      dueDate: '2023-12-01T00:00:00Z', // Past date
    };

    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={jest.fn()}
        transaction={overdueTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    expect(screen.getByText(/This item is.*overdue/)).toBeInTheDocument();
  });

  it('submits return successfully', async () => {
    const mockOnReturnSuccess = jest.fn();
    const mockOnClose = jest.fn();

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={mockOnClose}
        transaction={mockTransaction}
        onReturnSuccess={mockOnReturnSuccess}
      />
    );

    // Fill in notes
    fireEvent.change(screen.getByPlaceholderText(/Any additional comments/), {
      target: { value: 'Item returned in good condition' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Return Item'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/lending-transactions/transaction-123/return',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: expect.stringContaining('good'),
        })
      );
    });

    await waitFor(() => {
      expect(mockOnReturnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles return failure', async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, message: 'Return failed' }),
    });

    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Return Item'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Dialog should remain open on failure
    expect(screen.getByText('Return Item')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const mockOnClose = jest.fn();

    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={mockOnClose}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows adding notes', () => {
    render(
      <ReturnProcessDialog
        isOpen={true}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onReturnSuccess={jest.fn()}
      />
    );

    const notesTextarea = screen.getByPlaceholderText(
      /Any additional comments/
    );
    fireEvent.change(notesTextarea, {
      target: { value: 'Test notes' },
    });

    expect(notesTextarea.value).toBe('Test notes');
  });
});
