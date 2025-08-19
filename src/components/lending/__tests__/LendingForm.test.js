import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LendingForm from '../LendingForm';

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  title: 'Lend Item',
  item: {
    id: 1,
    name: 'MacBook Pro 16"',
    sku: 'ELC001',
    available: 3,
    lendingPolicy: {
      maxLendingPeriod: 30
    }
  }
};

describe('LendingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders lending form when open', () => {
    render(<LendingForm {...mockProps} />);
    
    expect(screen.getByText('Lend Item')).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro 16" (SKU: ELC001)')).toBeInTheDocument();
    expect(screen.getByText('Available Quantity: 3')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<LendingForm {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Lend Item')).not.toBeInTheDocument();
  });

  test('renders all required form fields', () => {
    render(<LendingForm {...mockProps} />);
    
    expect(screen.getByLabelText(/borrower name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/borrower email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/return date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
  });

  test('sets default return date based on lending policy', () => {
    render(<LendingForm {...mockProps} />);
    
    const returnDateInput = screen.getByLabelText(/return date/i);
    expect(returnDateInput.value).toBeTruthy();
    
    // Should be 30 days from now (based on maxLendingPeriod)
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);
    const expectedDateString = expectedDate.toISOString().split('T')[0];
    
    expect(returnDateInput.value).toBe(expectedDateString);
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /process lending/i });
    await user.click(submitButton);
    
    // Should not call onSubmit if required fields are empty
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  test('validates quantity does not exceed available', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '5'); // More than available (3)
    
    const submitButton = screen.getByRole('button', { name: /process lending/i });
    await user.click(submitButton);
    
    // Should show error or prevent submission
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    // Fill in required fields
    await user.type(screen.getByLabelText(/borrower name/i), 'John Doe');
    await user.type(screen.getByLabelText(/borrower email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/purpose/i), 'Development work');
    
    const submitButton = screen.getByRole('button', { name: /process lending/i });
    await user.click(submitButton);
    
    expect(mockProps.onSubmit).toHaveBeenCalledWith({
      borrowerName: 'John Doe',
      borrowerEmail: 'john@example.com',
      purpose: 'Development work',
      quantity: 1, // Default quantity
      returnDate: expect.any(String),
      notes: ''
    });
  });

  test('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('calls onClose when dialog is closed', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    // Find and click the close button (X) in the dialog
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('validates email format', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const emailInput = screen.getByLabelText(/borrower email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /process lending/i });
    await user.click(submitButton);
    
    // Should not submit with invalid email
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  test('allows quantity selection within available range', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    expect(quantityInput).toHaveAttribute('max', '3');
    expect(quantityInput).toHaveAttribute('min', '1');
    
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');
    
    expect(quantityInput.value).toBe('2');
  });

  test('shows error message for quantity exceeding available', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/exceeds available quantity/i)).toBeInTheDocument();
    });
  });

  test('resets form when item changes', () => {
    const { rerender } = render(<LendingForm {...mockProps} />);
    
    // Change item
    const newItem = {
      ...mockProps.item,
      id: 2,
      name: 'Different Item',
      available: 5
    };
    
    rerender(<LendingForm {...mockProps} item={newItem} />);
    
    expect(screen.getByText('Different Item (SKU: ELC001)')).toBeInTheDocument();
    expect(screen.getByText('Available Quantity: 5')).toBeInTheDocument();
  });

  test('handles missing item gracefully', () => {
    render(<LendingForm {...mockProps} item={null} />);
    
    // Should still render the form but with disabled state or appropriate message
    expect(screen.getByText('Lend Item')).toBeInTheDocument();
  });

  test('disables submit button when form is invalid', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /process lending/i });
    
    // Initially should be disabled (no required fields filled)
    expect(submitButton).toBeDisabled();
    
    // Fill in some but not all required fields
    await user.type(screen.getByLabelText(/borrower name/i), 'John Doe');
    
    // Should still be disabled
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<LendingForm {...mockProps} />);
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/borrower name/i), 'John Doe');
    await user.type(screen.getByLabelText(/borrower email/i), 'john@example.com');
    
    const submitButton = screen.getByRole('button', { name: /process lending/i });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});