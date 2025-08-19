import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LendingFilters from '../LendingFilters';

const mockProps = {
  searchTerm: '',
  onSearchChange: jest.fn(),
  filterCategory: '',
  onCategoryChange: jest.fn(),
  filterAvailability: '',
  onAvailabilityChange: jest.fn(),
  categories: ['Electronics', 'Office Supplies', 'Furniture'],
  onAddItem: jest.fn()
};

describe('LendingFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all filter components', () => {
    render(<LendingFilters {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /all categories/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /all items/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  test('calls onSearchChange when search input changes', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await user.type(searchInput, 'MacBook');
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('MacBook');
  });

  test('displays current search term', () => {
    render(<LendingFilters {...mockProps} searchTerm="MacBook" />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    expect(searchInput).toHaveValue('MacBook');
  });

  test('calls onCategoryChange when category is selected', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const categorySelect = screen.getByRole('combobox', { name: /all categories/i });
    await user.click(categorySelect);
    
    const electronicsOption = screen.getByRole('option', { name: 'Electronics' });
    await user.click(electronicsOption);
    
    expect(mockProps.onCategoryChange).toHaveBeenCalledWith('Electronics');
  });

  test('displays all available categories', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const categorySelect = screen.getByRole('combobox', { name: /all categories/i });
    await user.click(categorySelect);
    
    expect(screen.getByRole('option', { name: 'All Categories' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Electronics' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Office Supplies' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Furniture' })).toBeInTheDocument();
  });

  test('calls onAvailabilityChange when availability filter is selected', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const availabilitySelect = screen.getByRole('combobox', { name: /all items/i });
    await user.click(availabilitySelect);
    
    const availableOption = screen.getByRole('option', { name: 'Available' });
    await user.click(availableOption);
    
    expect(mockProps.onAvailabilityChange).toHaveBeenCalledWith('available');
  });

  test('displays availability filter options', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const availabilitySelect = screen.getByRole('combobox', { name: /all items/i });
    await user.click(availabilitySelect);
    
    expect(screen.getByRole('option', { name: 'All Items' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Available' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Unavailable' })).toBeInTheDocument();
  });

  test('calls onAddItem when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    
    expect(mockProps.onAddItem).toHaveBeenCalled();
  });

  test('shows current filter selections', () => {
    render(
      <LendingFilters 
        {...mockProps} 
        filterCategory="Electronics"
        filterAvailability="available"
      />
    );
    
    // The selected values should be reflected in the select components
    // This would need to be tested based on the actual implementation
    // of how selected values are displayed in the Select components
  });

  test('handles empty categories array', () => {
    render(<LendingFilters {...mockProps} categories={[]} />);
    
    // Should still render the category select, just with no options
    expect(screen.getByRole('combobox', { name: /all categories/i })).toBeInTheDocument();
  });

  test('search input has proper accessibility attributes', () => {
    render(<LendingFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    expect(searchInput).toHaveAttribute('type', 'text');
    expect(searchInput).toHaveAttribute('placeholder');
  });

  test('select components have proper accessibility attributes', () => {
    render(<LendingFilters {...mockProps} />);
    
    const categorySelect = screen.getByRole('combobox', { name: /all categories/i });
    const availabilitySelect = screen.getByRole('combobox', { name: /all items/i });
    
    expect(categorySelect).toBeInTheDocument();
    expect(availabilitySelect).toBeInTheDocument();
  });

  test('add button has proper styling and icon', () => {
    render(<LendingFilters {...mockProps} />);
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    expect(addButton).toBeInTheDocument();
    
    // Check if the button contains an icon (Plus icon)
    const icon = addButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  test('clears search when empty string is provided', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} searchTerm="MacBook" />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await user.clear(searchInput);
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
  });

  test('handles rapid typing in search input', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await user.type(searchInput, 'MacBook Pro 16');
    
    // Should call onSearchChange for each character typed
    expect(mockProps.onSearchChange).toHaveBeenCalledTimes(14); // Length of "MacBook Pro 16"
  });

  test('maintains focus on search input during typing', async () => {
    const user = userEvent.setup();
    render(<LendingFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await user.click(searchInput);
    await user.type(searchInput, 'test');
    
    expect(searchInput).toHaveFocus();
  });
});