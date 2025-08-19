import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LendingPage from '../LendingPage';

// Mock the toast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockProducts = [
  {
    id: 'product-1',
    name: 'MacBook Pro',
    description: 'High-performance laptop',
    brand: 'Apple',
    model: '13-inch',
    categoryId: 'cat-1',
    location: 'Office A',
    maxLendingPeriod: 30,
    isAvailable: true,
    tags: ['laptop', 'development'],
    imageUrls: ['https://example.com/image1.jpg'],
  },
  {
    id: 'product-2',
    name: 'iPad Pro',
    description: 'Professional tablet',
    brand: 'Apple',
    model: '12.9-inch',
    categoryId: 'cat-1',
    location: 'Office B',
    maxLendingPeriod: 14,
    isAvailable: false,
    tags: ['tablet', 'design'],
    imageUrls: [],
  },
];

const mockCategories = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Office Supplies' },
];

describe('LendingPage', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');

    // Mock successful API responses
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockProducts }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockCategories }),
      });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders lending page with products', async () => {
    render(<LendingPage />);

    expect(screen.getByText('Loading available items...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lending Library')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('iPad Pro')).toBeInTheDocument();
    });
  });

  it('filters products by search term', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('iPad Pro')).toBeInTheDocument();
    });

    // Search for MacBook
    const searchInput = screen.getByPlaceholderText(
      'Search products, brands, or tags...'
    );
    fireEvent.change(searchInput, { target: { value: 'MacBook' } });

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.queryByText('iPad Pro')).not.toBeInTheDocument();
    });
  });

  it('filters products by category', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Select Electronics category
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('iPad Pro')).toBeInTheDocument();
    });
  });

  it('adds product to cart', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Click add to cart for MacBook Pro
    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('1 item(s) in your lending cart')
      ).toBeInTheDocument();
      expect(screen.getByText('In Cart')).toBeInTheDocument();
    });
  });

  it('prevents adding unavailable items to cart', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('iPad Pro')).toBeInTheDocument();
    });

    // iPad Pro should show as unavailable
    const unavailableButton = screen.getByText('Add to Cart').closest('button');
    expect(unavailableButton).toBeDisabled();
  });

  it('clears cart when clear cart is clicked', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Add item to cart
    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('1 item(s) in your lending cart')
      ).toBeInTheDocument();
    });

    // Clear cart
    fireEvent.click(screen.getByText('Clear Cart'));

    await waitFor(() => {
      expect(
        screen.queryByText('1 item(s) in your lending cart')
      ).not.toBeInTheDocument();
    });
  });

  it('processes checkout successfully', async () => {
    // Mock successful checkout
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockProducts }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockCategories }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockProducts }),
      });

    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Add item to cart
    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('1 item(s) in your lending cart')
      ).toBeInTheDocument();
    });

    // Checkout
    fireEvent.click(screen.getByText('Checkout'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/lending-transactions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        })
      );
    });
  });

  it('shows no results message when no products match filters', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Search for non-existent product
    const searchInput = screen.getByPlaceholderText(
      'Search products, brands, or tags...'
    );
    fireEvent.change(searchInput, { target: { value: 'NonExistentProduct' } });

    await waitFor(() => {
      expect(
        screen.getByText('No products match your search criteria')
      ).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  it('clears filters when clear filters button is clicked', async () => {
    render(<LendingPage />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText(
      'Search products, brands, or tags...'
    );
    fireEvent.change(searchInput, { target: { value: 'NonExistentProduct' } });

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    // Clear filters
    fireEvent.click(screen.getByText('Clear Filters'));

    await waitFor(() => {
      expect(searchInput.value).toBe('');
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });
  });
});
