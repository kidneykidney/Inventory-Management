import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LendingTable from '../LendingTable';

// Mock data
const mockItems = [
  {
    id: 1,
    sku: 'ELC001',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    brand: 'Apple',
    model: 'MacBook Pro',
    quantity: 5,
    available: 3,
    location: 'Tech Storage A',
    condition: 'excellent',
    tags: ['laptop', 'development', 'design'],
    isAvailable: true,
    lendingPolicy: {
      maxLendingPeriod: 30,
      requiresApproval: true
    }
  },
  {
    id: 2,
    sku: 'OFF001',
    name: 'Ergonomic Office Chair',
    category: 'Office Supplies',
    brand: 'Herman Miller',
    model: 'Aeron',
    quantity: 8,
    available: 6,
    location: 'Office Storage B',
    condition: 'good',
    tags: ['chair', 'ergonomic', 'office'],
    isAvailable: true,
    lendingPolicy: {
      maxLendingPeriod: 90,
      requiresApproval: false
    }
  }
];

const mockProps = {
  items: mockItems,
  onEdit: jest.fn(),
  onLend: jest.fn(),
  onDelete: jest.fn(),
  loading: false
};

describe('LendingTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with lending items', () => {
    render(<LendingTable {...mockProps} />);
    
    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Office Chair')).toBeInTheDocument();
    expect(screen.getByText('Apple MacBook Pro • ELC001')).toBeInTheDocument();
    expect(screen.getByText('Herman Miller Aeron • OFF001')).toBeInTheDocument();
  });

  test('displays correct availability information', () => {
    render(<LendingTable {...mockProps} />);
    
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    expect(screen.getByText('6 / 8')).toBeInTheDocument();
    expect(screen.getAllByText('available')).toHaveLength(2);
  });

  test('shows correct status badges', () => {
    render(<LendingTable {...mockProps} />);
    
    const availableBadges = screen.getAllByText('Available');
    expect(availableBadges).toHaveLength(2);
  });

  test('displays tags correctly', () => {
    render(<LendingTable {...mockProps} />);
    
    expect(screen.getByText('laptop')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.getByText('chair')).toBeInTheDocument();
    expect(screen.getByText('ergonomic')).toBeInTheDocument();
    expect(screen.getByText('office')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingTable {...mockProps} />);
    
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Edit'
    );
    
    if (editButton) {
      await user.click(editButton);
      expect(mockProps.onEdit).toHaveBeenCalledWith(mockItems[0]);
    }
  });

  test('calls onLend when lend button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingTable {...mockProps} />);
    
    const lendButtons = screen.getAllByRole('button');
    const lendButton = lendButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Lend'
    );
    
    if (lendButton) {
      await user.click(lendButton);
      expect(mockProps.onLend).toHaveBeenCalledWith(mockItems[0]);
    }
  });

  test('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingTable {...mockProps} />);
    
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Delete'
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      expect(mockProps.onDelete).toHaveBeenCalledWith(mockItems[0].id);
    }
  });

  test('disables lend button for unavailable items', () => {
    const unavailableItems = [
      {
        ...mockItems[0],
        available: 0,
        isAvailable: false
      }
    ];
    
    render(<LendingTable {...mockProps} items={unavailableItems} />);
    
    const lendButtons = screen.getAllByRole('button');
    const lendButton = lendButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Lend'
    );
    
    expect(lendButton).toBeDisabled();
  });

  test('shows loading state', () => {
    render(<LendingTable {...mockProps} loading={true} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows empty state when no items', () => {
    render(<LendingTable {...mockProps} items={[]} />);
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  test('displays correct status for low stock items', () => {
    const lowStockItems = [
      {
        ...mockItems[0],
        available: 1,
        isAvailable: true
      }
    ];
    
    render(<LendingTable {...mockProps} items={lowStockItems} />);
    
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  test('displays correct status for unavailable items', () => {
    const unavailableItems = [
      {
        ...mockItems[0],
        available: 0,
        isAvailable: false
      }
    ];
    
    render(<LendingTable {...mockProps} items={unavailableItems} />);
    
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  test('handles missing optional fields gracefully', () => {
    const itemsWithMissingFields = [
      {
        id: 1,
        sku: 'TEST001',
        name: 'Test Item',
        category: 'Electronics',
        quantity: 1,
        available: 1,
        location: 'Test Location',
        condition: 'good',
        tags: [],
        isAvailable: true,
        lendingPolicy: {
          maxLendingPeriod: 30,
          requiresApproval: false
        }
        // Missing brand, model, subcategory
      }
    ];
    
    render(<LendingTable {...mockProps} items={itemsWithMissingFields} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('TEST001')).toBeInTheDocument();
  });
});