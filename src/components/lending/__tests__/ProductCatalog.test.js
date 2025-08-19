import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCatalog from '../ProductCatalog';

// Mock child components
jest.mock('../ProductCard', () => {
  return function MockProductCard({ product, onView, onEdit, onBorrow }) {
    return (
      <div data-testid={`product-card-${product.id}`}>
        <h3>{product.name}</h3>
        <button onClick={() => onView(product)}>View</button>
        <button onClick={() => onEdit(product)}>Edit</button>
        <button onClick={() => onBorrow(product)}>Borrow</button>
      </div>
    );
  };
});

jest.mock('../ProductDetailModal', () => {
  return function MockProductDetailModal({ product, isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="product-detail-modal">
        <h2>{product?.name}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Grid3X3: () => <div data-testid="grid-icon" />,
  List: () => <div data-testid="list-icon" />,
  SortAsc: () => <div data-testid="sort-asc-icon" />,
  SortDesc: () => <div data-testid="sort-desc-icon" />,
  Package: () => <div data-testid="package-icon" />
}));

const mockProducts = [
  {
    id: 'product-1',
    name: 'MacBook Pro 16"',
    description: 'High-performance laptop',
    brand: 'Apple',
    model: 'MacBook Pro',
    categoryId: 1,
    conditionStatus: 'excellent',
    isAvailable: true,
    maxLendingPeriod: 30,
    tags: ['laptop', 'development'],
    createdAt: '2023-01-15T00:00:00Z'
  },
  {
    id: 'product-2',
    name: 'Dell Monitor 27"',
    description: '4K display monitor',
    brand: 'Dell',
    model: 'UltraSharp',
    categoryId: 2,
    conditionStatus: 'good',
    isAvailable: false,
    maxLendingPeriod: 14,
    tags: ['monitor', 'display'],
    createdAt: '2023-02-01T00:00:00Z'
  },
  {
    id: 'product-3',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    brand: 'Logitech',
    model: 'MX Master',
    categoryId: 1,
    conditionStatus: 'fair',
    isAvailable: true,
    maxLendingPeriod: 7,
    tags: ['mouse', 'wireless'],
    createdAt: '2023-01-20T00:00:00Z'
  }
];

const mockCategories = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Monitors' },
  { id: 3, name: 'Accessories' }
];

describe('ProductCatalog', () => {
  const defaultProps = {
    products: mockProducts,
    categories: mockCategories,
    loading: false,
    onProductUpdate: jest.fn(),
    onProductBorrow: jest.fn(),
    isAdmin: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders catalog header with product count', () => {
    render(<ProductCatalog {...defaultProps} />);

    expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 products')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    render(<ProductCatalog {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
    expect(screen.queryByText('Product Catalog')).not.toBeInTheDocument();
  });

  it('renders all products by default', () => {
    render(<ProductCatalog {...defaultProps} />);

    expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-product-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-product-3')).toBeInTheDocument();
  });

  it('filters products by search term', async () => {
    render(<ProductCatalog {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search products, brands, models, or tags...');
    fireEvent.change(searchInput, { target: { value: 'MacBook' } });

    await waitFor(() => {
      expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-3')).not.toBeInTheDocument();
    });

    expect(screen.getByText('1 of 3 products')).toBeInTheDocument();
  });

  it('filters products by category', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Open category select and choose Electronics
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.click(categorySelect);
    
    const electronicsOption = screen.getByText('Electronics');
    fireEvent.click(electronicsOption);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('product-card-product-3')).toBeInTheDocument();
    });

    expect(screen.getByText('2 of 3 products')).toBeInTheDocument();
  });

  it('filters products by availability', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Filter for available only
    const availabilitySelect = screen.getByDisplayValue('All Items');
    fireEvent.click(availabilitySelect);
    
    const availableOption = screen.getByText('Available Only');
    fireEvent.click(availableOption);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('product-card-product-3')).toBeInTheDocument();
    });

    expect(screen.getByText('2 of 3 products')).toBeInTheDocument();
  });

  it('filters products by condition', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Filter by excellent condition
    const conditionSelect = screen.getByDisplayValue('All Conditions');
    fireEvent.click(conditionSelect);
    
    const excellentOption = screen.getByText('Excellent');
    fireEvent.click(excellentOption);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-3')).not.toBeInTheDocument();
    });

    expect(screen.getByText('1 of 3 products')).toBeInTheDocument();
  });

  it('sorts products correctly', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Change sort to brand
    const sortSelect = screen.getByDisplayValue('Name');
    fireEvent.click(sortSelect);
    
    const brandOption = screen.getByText('Brand');
    fireEvent.click(brandOption);

    // Products should be sorted by brand: Apple, Dell, Logitech
    await waitFor(() => {
      const productCards = screen.getAllByTestId(/product-card-/);
      expect(productCards[0]).toHaveAttribute('data-testid', 'product-card-product-1'); // Apple
      expect(productCards[1]).toHaveAttribute('data-testid', 'product-card-product-2'); // Dell
      expect(productCards[2]).toHaveAttribute('data-testid', 'product-card-product-3'); // Logitech
    });
  });

  it('toggles sort order', async () => {
    render(<ProductCatalog {...defaultProps} />);

    const sortOrderButton = screen.getByText('A-Z');
    fireEvent.click(sortOrderButton);

    await waitFor(() => {
      expect(screen.getByText('Z-A')).toBeInTheDocument();
      expect(screen.getByTestId('sort-desc-icon')).toBeInTheDocument();
    });
  });

  it('clears all filters', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Apply some filters
    const searchInput = screen.getByPlaceholderText('Search products, brands, models, or tags...');
    fireEvent.change(searchInput, { target: { value: 'MacBook' } });

    await waitFor(() => {
      expect(screen.getByText('1 active filter')).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(searchInput.value).toBe('');
      expect(screen.getByText('3 of 3 products')).toBeInTheDocument();
      expect(screen.queryByText('active filter')).not.toBeInTheDocument();
    });
  });

  it('toggles between grid and list view modes', () => {
    render(<ProductCatalog {...defaultProps} />);

    const listViewButton = screen.getByTestId('list-icon').closest('button');
    fireEvent.click(listViewButton);

    // Check that the container class changes (this would need to be tested with actual DOM structure)
    expect(listViewButton).toHaveClass('bg-blue-600'); // Assuming active state styling
  });

  it('shows empty state when no products match filters', async () => {
    render(<ProductCatalog {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search products, brands, models, or tags...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your search terms or filters to find what you're looking for.")).toBeInTheDocument();
      expect(screen.getByTestId('package-icon')).toBeInTheDocument();
    });
  });

  it('shows empty state when no products exist', () => {
    render(<ProductCatalog {...defaultProps} products={[]} />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('No products have been added to the catalog yet.')).toBeInTheDocument();
  });

  it('opens product detail modal when product is viewed', async () => {
    render(<ProductCatalog {...defaultProps} />);

    const viewButton = screen.getAllByText('View')[0];
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('product-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });
  });

  it('closes product detail modal', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Open modal
    const viewButton = screen.getAllByText('View')[0];
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('product-detail-modal')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('product-detail-modal')).not.toBeInTheDocument();
    });
  });

  it('calls onProductUpdate when product is edited', () => {
    render(<ProductCatalog {...defaultProps} />);

    const editButton = screen.getAllByText('Edit')[0];
    fireEvent.click(editButton);

    expect(defaultProps.onProductUpdate).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('calls onProductBorrow when product is borrowed', () => {
    render(<ProductCatalog {...defaultProps} />);

    const borrowButton = screen.getAllByText('Borrow')[0];
    fireEvent.click(borrowButton);

    expect(defaultProps.onProductBorrow).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('searches across multiple fields', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Search by tag
    const searchInput = screen.getByPlaceholderText('Search products, brands, models, or tags...');
    fireEvent.change(searchInput, { target: { value: 'wireless' } });

    await waitFor(() => {
      expect(screen.getByTestId('product-card-product-3')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-2')).not.toBeInTheDocument();
    });

    // Search by brand
    fireEvent.change(searchInput, { target: { value: 'Dell' } });

    await waitFor(() => {
      expect(screen.getByTestId('product-card-product-2')).toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-card-product-3')).not.toBeInTheDocument();
    });
  });

  it('handles multiple active filters correctly', async () => {
    render(<ProductCatalog {...defaultProps} />);

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search products, brands, models, or tags...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    // Apply category filter
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.click(categorySelect);
    const electronicsOption = screen.getByText('Electronics');
    fireEvent.click(electronicsOption);

    await waitFor(() => {
      expect(screen.getByText('2 active filters')).toBeInTheDocument();
    });
  });
});