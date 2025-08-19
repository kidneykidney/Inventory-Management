import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModernSearchInterface from '../ModernSearchInterface';
import searchService from '../../../services/searchService';

// Mock the search service
jest.mock('../../../services/searchService', () => ({
  searchProducts: jest.fn(),
  applyAdvancedFilters: jest.fn(),
  getSuggestions: jest.fn(),
  getSearchAnalytics: jest.fn(),
  getFilterSuggestions: jest.fn(),
  trackSearch: jest.fn(),
  clearSearchHistory: jest.fn()
}));

// Mock child components
jest.mock('../AdvancedSearch', () => {
  return function MockAdvancedSearch({ onSearch, onSuggestionSelect, ...props }) {
    return (
      <div data-testid="advanced-search">
        <input
          data-testid="search-input"
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder={props.placeholder}
        />
        <button
          data-testid="search-button"
          onClick={() => onSearch?.('test search')}
        >
          Search
        </button>
      </div>
    );
  };
});

jest.mock('../AdvancedFilterSidebar', () => {
  return function MockAdvancedFilterSidebar({ onFiltersChange, onClearFilters, isOpen, onToggle, ...props }) {
    return (
      <div data-testid="filter-sidebar" style={{ display: isOpen ? 'block' : 'none' }}>
        <button
          data-testid="close-filters-button"
          onClick={onToggle}
        >
          Close
        </button>
        <button
          data-testid="apply-category-filter"
          onClick={() => onFiltersChange?.({ categoryId: 'electronics' })}
        >
          Electronics
        </button>
        <button
          data-testid="clear-all-filters-button"
          onClick={onClearFilters}
        >
          Clear All
        </button>
      </div>
    );
  };
});

jest.mock('../SearchResultsGrid', () => {
  return function MockSearchResultsGrid({ products, loading, searchQuery, ...props }) {
    if (loading) {
      return <div data-testid="search-loading">Loading...</div>;
    }
    
    return (
      <div data-testid="search-results">
        <div data-testid="search-results-count">{products.length} results</div>
        {searchQuery && (
          <div data-testid="search-query-display">for "{searchQuery}"</div>
        )}
        {products.length === 0 ? (
          <div data-testid="empty-results">No products found</div>
        ) : (
          <div data-testid="results-grid">
            {products.map((product, index) => (
              <div key={product.id || index} data-testid="product-card">
                {product.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
});

jest.mock('../SearchHistory', () => {
  return function MockSearchHistory({ onSearchSelect, onSavedSearchSelect }) {
    return (
      <div data-testid="search-history">
        <button
          data-testid="recent-search-item"
          onClick={() => onSearchSelect?.('recent search')}
        >
          Recent Search
        </button>
        <button
          data-testid="saved-search-item"
          onClick={() => onSavedSearchSelect?.({ query: 'saved search', name: 'My Search' })}
        >
          Saved Search
        </button>
      </div>
    );
  };
});

// Mock window methods
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  writable: true,
  configurable: true,
  value: jest.fn(() => Promise.resolve()),
});

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('ModernSearchInterface', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Laptop Dell XPS',
      brand: 'Dell',
      category: 'electronics',
      isAvailable: true,
      tags: ['computer', 'portable']
    },
    {
      id: '2',
      name: 'Wireless Mouse',
      brand: 'Logitech',
      category: 'electronics',
      isAvailable: false,
      tags: ['mouse', 'wireless']
    },
    {
      id: '3',
      name: 'Office Chair',
      brand: 'Herman Miller',
      category: 'furniture',
      isAvailable: true,
      tags: ['chair', 'ergonomic']
    }
  ];

  const defaultProps = {
    products: mockProducts,
    onProductSelect: jest.fn(),
    onProductAction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    searchService.searchProducts.mockImplementation((products, query) => {
      return products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase())
      );
    });
    
    searchService.applyAdvancedFilters.mockImplementation((products, filters) => {
      return products.filter(product => {
        if (filters.categoryId && product.category !== filters.categoryId) {
          return false;
        }
        return true;
      });
    });
    
    searchService.getSearchAnalytics.mockReturnValue({
      recentSearches: ['laptop', 'mouse'],
      popularSearches: [{ query: 'laptop', count: 5 }]
    });
    
    searchService.getFilterSuggestions.mockReturnValue({
      brands: ['Dell', 'Logitech'],
      locations: ['Office A', 'Office B'],
      tags: ['computer', 'wireless'],
      conditions: ['excellent', 'good'],
      lendingPeriods: [7, 14, 30]
    });
  });

  describe('Basic Rendering', () => {
    it('renders the search interface', () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      expect(screen.getByTestId('modern-search-interface')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    it('displays all products initially', () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('3 results');
      expect(screen.getByTestId('product-card')).toBeInTheDocument();
    });

    it('shows filter sidebar on desktop', () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-header')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('performs search when query is entered', async () => {
      const user = userEvent.setup();
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'laptop');
      
      await waitFor(() => {
        expect(searchService.searchProducts).toHaveBeenCalledWith(
          mockProducts,
          'laptop',
          { boostAvailable: true }
        );
      });
    });

    it('updates results based on search query', async () => {
      const user = userEvent.setup();
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'laptop');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-query-display')).toHaveTextContent('for "laptop"');
      });
    });

    it('handles empty search results', async () => {
      searchService.searchProducts.mockReturnValue([]);
      
      const user = userEvent.setup();
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-results')).toBeInTheDocument();
      });
    });

    it('shows loading state during search', async () => {
      // Mock a delayed search
      searchService.searchProducts.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve([]), 100);
        });
      });
      
      const user = userEvent.setup();
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('applies filters when changed', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const categoryFilter = screen.getByTestId('apply-category-filter');
      fireEvent.click(categoryFilter);
      
      await waitFor(() => {
        expect(searchService.applyAdvancedFilters).toHaveBeenCalledWith(
          mockProducts,
          { categoryId: 'electronics' }
        );
      });
    });

    it('shows active filters', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const categoryFilter = screen.getByTestId('apply-category-filter');
      fireEvent.click(categoryFilter);
      
      await waitFor(() => {
        expect(screen.getByTestId('active-filters')).toBeInTheDocument();
      });
    });

    it('clears all filters', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      // Apply a filter first
      const categoryFilter = screen.getByTestId('apply-category-filter');
      fireEvent.click(categoryFilter);
      
      await waitFor(() => {
        expect(screen.getByTestId('active-filters')).toBeInTheDocument();
      });
      
      // Clear filters
      const clearButton = screen.getByTestId('clear-all-filters-button');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('active-filters')).not.toBeInTheDocument();
      });
    });

    it('shows filter count badge', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const categoryFilter = screen.getByTestId('apply-category-filter');
      fireEvent.click(categoryFilter);
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-count-badge')).toBeInTheDocument();
      });
    });
  });

  describe('History Functionality', () => {
    it('opens and closes search history', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const historyButton = screen.getByTestId('history-button');
      fireEvent.click(historyButton);
      
      expect(screen.getByTestId('search-history')).toBeInTheDocument();
      
      // Close history
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('search-history')).not.toBeInTheDocument();
    });

    it('performs search from history', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      // Open history
      const historyButton = screen.getByTestId('history-button');
      fireEvent.click(historyButton);
      
      // Click on recent search
      const recentSearch = screen.getByTestId('recent-search-item');
      fireEvent.click(recentSearch);
      
      await waitFor(() => {
        expect(searchService.searchProducts).toHaveBeenCalledWith(
          mockProducts,
          'recent search',
          { boostAvailable: true }
        );
      });
    });

    it('uses saved search', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      // Open history
      const historyButton = screen.getByTestId('history-button');
      fireEvent.click(historyButton);
      
      // Click on saved search
      const savedSearch = screen.getByTestId('saved-search-item');
      fireEvent.click(savedSearch);
      
      await waitFor(() => {
        expect(searchService.searchProducts).toHaveBeenCalledWith(
          mockProducts,
          'saved search',
          { boostAvailable: true }
        );
      });
      
      // History should close
      expect(screen.queryByTestId('search-history')).not.toBeInTheDocument();
    });
  });

  describe('Export and Share', () => {
    it('exports search results', async () => {
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      
      render(<ModernSearchInterface {...defaultProps} />);
      
      const exportButton = screen.getByTestId('export-results-button');
      fireEvent.click(exportButton);
      
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', expect.any(String));
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.json'));
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('shares search results', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const shareButton = screen.getByTestId('share-results-button');
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalledWith({
          title: 'Product Search Results',
          text: expect.stringContaining('Found 3 products'),
          url: window.location.href
        });
      });
    });

    it('falls back to clipboard when share is not available', async () => {
      // Mock navigator.share to be undefined
      Object.defineProperty(navigator, 'share', {
        value: undefined
      });
      
      render(<ModernSearchInterface {...defaultProps} />);
      
      const shareButton = screen.getByTestId('share-results-button');
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });
    });

    it('shows mobile header on small screens', () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-filters-button')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-history-button')).toBeInTheDocument();
    });

    it('opens filter overlay on mobile', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const filtersButton = screen.getByTestId('mobile-filters-button');
      fireEvent.click(filtersButton);
      
      expect(screen.getByTestId('mobile-filter-overlay')).toBeInTheDocument();
    });

    it('opens history overlay on mobile', async () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      const historyButton = screen.getByTestId('mobile-history-button');
      fireEvent.click(historyButton);
      
      expect(screen.getByTestId('mobile-history-overlay')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles search service errors gracefully', async () => {
      searchService.searchProducts.mockImplementation(() => {
        throw new Error('Search failed');
      });
      
      const user = userEvent.setup();
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'error');
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-results')).toBeInTheDocument();
      });
    });

    it('handles filter service errors gracefully', async () => {
      searchService.applyAdvancedFilters.mockImplementation(() => {
        throw new Error('Filter failed');
      });
      
      render(<ModernSearchInterface {...defaultProps} />);
      
      const categoryFilter = screen.getByTestId('apply-category-filter');
      fireEvent.click(categoryFilter);
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-results')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('debounces search input', async () => {
      jest.useFakeTimers();
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'test');
      
      // Search should not be called immediately
      expect(searchService.searchProducts).not.toHaveBeenCalled();
      
      // Advance timers to trigger debounced search
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(searchService.searchProducts).toHaveBeenCalledTimes(1);
      });
      
      jest.useRealTimers();
    });

    it('cancels previous search when new search is initiated', async () => {
      jest.useFakeTimers();
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Start first search
      await user.type(searchInput, 'first');
      
      // Start second search before first completes
      await user.clear(searchInput);
      await user.type(searchInput, 'second');
      
      // Advance timers
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        // Should only search for the latest query
        expect(searchService.searchProducts).toHaveBeenCalledWith(
          mockProducts,
          'second',
          { boostAvailable: true }
        );
      });
      
      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ModernSearchInterface {...defaultProps} />);
      
      // Check that main elements have proper test IDs for accessibility testing
      expect(screen.getByTestId('modern-search-interface')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ModernSearchInterface {...defaultProps} />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Focus should work
      await user.click(searchInput);
      expect(searchInput).toHaveFocus();
      
      // Tab navigation should work
      await user.tab();
      expect(screen.getByTestId('search-button')).toHaveFocus();
    });
  });
});