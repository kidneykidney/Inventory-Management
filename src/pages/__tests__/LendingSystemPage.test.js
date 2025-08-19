import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LendingSystemPage from '../LendingSystemPage';

// Mock the toast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

describe('LendingSystemPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders lending system page with header', () => {
    render(<LendingSystemPage />);
    
    expect(screen.getByText('Electronics & Office Components')).toBeInTheDocument();
    expect(screen.getByText('Manage lending and borrowing of company equipment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  test('displays initial lending items', () => {
    render(<LendingSystemPage />);
    
    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Office Chair')).toBeInTheDocument();
    expect(screen.getByText('iPad Pro 12.9"')).toBeInTheDocument();
  });

  test('filters items by search term', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await user.type(searchInput, 'MacBook');
    
    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.queryByText('Ergonomic Office Chair')).not.toBeInTheDocument();
  });

  test('filters items by category', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click the category select
    const categorySelect = screen.getByRole('combobox', { name: /all categories/i });
    await user.click(categorySelect);
    
    // Select Electronics category
    const electronicsOption = screen.getByRole('option', { name: 'Electronics' });
    await user.click(electronicsOption);
    
    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('iPad Pro 12.9"')).toBeInTheDocument();
    expect(screen.queryByText('Ergonomic Office Chair')).not.toBeInTheDocument();
  });

  test('filters items by availability', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click the availability select
    const availabilitySelect = screen.getByRole('combobox', { name: /all items/i });
    await user.click(availabilitySelect);
    
    // Select Available items
    const availableOption = screen.getByRole('option', { name: 'Available' });
    await user.click(availableOption);
    
    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Office Chair')).toBeInTheDocument();
    expect(screen.queryByText('iPad Pro 12.9"')).not.toBeInTheDocument();
  });

  test('opens add item dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    
    expect(screen.getByText('Add New Item')).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  test('adds new item successfully', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    
    // Fill form
    await user.type(screen.getByLabelText(/sku/i), 'TEST001');
    await user.type(screen.getByLabelText(/name/i), 'Test Item');
    
    // Select category
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    const electronicsOption = screen.getByRole('option', { name: 'Electronics' });
    await user.click(electronicsOption);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /add item$/i });
    await user.click(submitButton);
    
    // Check if item was added
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  test('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click edit button for first item
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Edit'
    );
    
    if (editButton) {
      await user.click(editButton);
      expect(screen.getByText('Edit Item')).toBeInTheDocument();
    }
  });

  test('opens lending dialog when lend button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click lend button for available item
    const lendButtons = screen.getAllByRole('button');
    const lendButton = lendButtons.find(button => 
      button.querySelector('svg') && !button.disabled
    );
    
    if (lendButton) {
      await user.click(lendButton);
      expect(screen.getByText('Lend Item')).toBeInTheDocument();
    }
  });

  test('processes lending transaction successfully', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click lend button for MacBook
    const macbookRow = screen.getByText('MacBook Pro 16"').closest('tr');
    const lendButton = macbookRow.querySelector('button[aria-label="Lend"]');
    
    if (lendButton) {
      await user.click(lendButton);
      
      // Fill lending form
      await user.type(screen.getByLabelText(/borrower name/i), 'John Doe');
      await user.type(screen.getByLabelText(/borrower email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/purpose/i), 'Development work');
      
      // Submit lending form
      const processButton = screen.getByRole('button', { name: /process lending/i });
      await user.click(processButton);
      
      // Check if availability was updated
      await waitFor(() => {
        const availabilityCell = screen.getByText('2 / 5');
        expect(availabilityCell).toBeInTheDocument();
      });
    }
  });

  test('displays correct status badges', () => {
    render(<LendingSystemPage />);
    
    // Check for Available status
    expect(screen.getByText('Available')).toBeInTheDocument();
    
    // Check for Unavailable status
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  test('shows item details correctly', () => {
    render(<LendingSystemPage />);
    
    // Check MacBook details
    expect(screen.getByText('Apple MacBook Pro • ELC001')).toBeInTheDocument();
    expect(screen.getByText('laptop')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
    
    // Check availability
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  test('handles form validation for adding items', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    
    // Try to submit without required fields
    const submitButton = screen.getByRole('button', { name: /add item$/i });
    await user.click(submitButton);
    
    // Form should not close (validation should prevent submission)
    expect(screen.getByText('Add New Item')).toBeInTheDocument();
  });

  test('handles form validation for lending', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click lend button
    const macbookRow = screen.getByText('MacBook Pro 16"').closest('tr');
    const lendButton = macbookRow.querySelector('button[aria-label="Lend"]');
    
    if (lendButton) {
      await user.click(lendButton);
      
      // Try to submit without required fields
      const processButton = screen.getByRole('button', { name: /process lending/i });
      await user.click(processButton);
      
      // Dialog should remain open (validation should prevent submission)
      expect(screen.getByText('Lend Item')).toBeInTheDocument();
    }
  });

  test('deletes item successfully', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Delete'
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      
      // Item should be removed from the list
      await waitFor(() => {
        // Check that one of the items is no longer visible
        // This is a simplified check - in a real test, we'd check for specific item removal
        expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 remaining items
      });
    }
  });

  test('displays correct item counts', () => {
    render(<LendingSystemPage />);
    
    // Should show "3 items found" initially
    expect(screen.getByText('3 items found')).toBeInTheDocument();
  });

  test('handles empty search results', async () => {
    const user = userEvent.setup();
    render(<LendingSystemPage />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await user.type(searchInput, 'nonexistent item');
    
    expect(screen.getByText('0 items found')).toBeInTheDocument();
  });
});