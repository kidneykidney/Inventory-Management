import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdvancedSearch from '../AdvancedSearch';
import searchService from '../../../services/searchService';

// Mock the search service
jest.mock('../../../services/searchService', () => ({
  getSuggestions: jest.fn(),
  getSearchAnalytics: jest.fn(),
  searchProducts: jest.fn(),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid='search-icon' />,
  X: () => <div data-testid='x-icon' />,
  Clock: () => <div data-testid='clock-icon' />,
  TrendingUp: () => <div data-testid='trending-icon' />,
  Filter: () => <div data-testid='filter-icon' />,
  ChevronDown: () => <div data-testid='chevron-down-icon' />,
  ChevronUp: () => <div data-testid='chevron-up-icon' />,
}));

const mockProducts = [
  {
    id: 'product-1',
    name: 'MacBook Pro 16"',
    brand: 'Apple',
    model: 'MacBook Pro',
    categoryName: 'Electronics',
    tags: ['laptop', 'development'],
  },
  {
    id: 'product-2',
    name: 'Dell Monitor 27"',
    brand: 'Dell',
    model: 'UltraSharp',
    categoryName: 'Monitors',
    tags: ['monitor', 'display'],
  },
];

const mockSuggestions = {
  products: [{ id: 'product-1', name: 'MacBook Pro 16"' }],
  brands: ['Apple'],
  tags: ['laptop'],
  categories: ['Electronics'],
};

const mockAnalytics = {
  recentSearches: ['macbook', 'dell monitor'],
  popularSearches: [
    { query: 'macbook', count: 5 },
    { query: 'monitor', count: 3 },
  ],
  totalSearches: 10,
};

describe('AdvancedSearch', () => {
  const defaultProps = {
    products: mockProducts,
    onSearch: jest.fn(),
    onSuggestionSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    searchService.getSearchAnalytics.mockReturnValue(mockAnalytics);
    searchService.getSuggestions.mockReturnValue(mockSuggestions);
  });

  it('renders search input with placeholder', () => {
    render(<AdvancedSearch {...defaultProps} />);

    expect(
      screen.getByPlaceholderText('Search products, brands, models, or tags...')
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders custom placeholder when provided', () => {
    render(
      <AdvancedSearch
        {...defaultProps}
        placeholder='Custom search placeholder'
      />
    );

    expect(
      screen.getByPlaceholderText('Custom search placeholder')
    ).toBeInTheDocument();
  });

  it('calls onSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );
    const searchButton = screen.getByText('Search');

    await user.type(input, 'MacBook');
    await user.click(searchButton);

    expect(defaultProps.onSearch).toHaveBeenCalledWith('MacBook');
  });

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'MacBook');
    await user.keyboard('{Enter}');

    expect(defaultProps.onSearch).toHaveBeenCalledWith('MacBook');
  });

  it('clears search when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'MacBook');
    expect(input.value).toBe('MacBook');

    const clearButton = screen.getByTestId('x-icon').closest('button');
    await user.click(clearButton);

    expect(input.value).toBe('');
    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    await waitFor(() => {
      expect(searchService.getSuggestions).toHaveBeenCalledWith(
        mockProducts,
        'Mac',
        5
      );
    });
  });

  it('displays product suggestions', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
      expect(screen.getByText('product')).toBeInTheDocument();
    });
  });

  it('displays brand suggestions', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'App');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('brand')).toBeInTheDocument();
    });
  });

  it('displays tag suggestions', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'lap');

    await waitFor(() => {
      expect(screen.getByText('laptop')).toBeInTheDocument();
      expect(screen.getByText('tag')).toBeInTheDocument();
    });
  });

  it('handles suggestion selection', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });

    await user.click(screen.getByText('MacBook Pro 16"'));

    expect(defaultProps.onSuggestionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'MacBook Pro 16"' }),
      'product'
    );
    expect(defaultProps.onSearch).toHaveBeenCalledWith('MacBook Pro 16"');
  });

  it('navigates suggestions with keyboard', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });

    // Navigate down
    await user.keyboard('{ArrowDown}');

    // The first suggestion should be highlighted
    const firstSuggestion = screen
      .getByText('MacBook Pro 16"')
      .closest('button');
    expect(firstSuggestion).toHaveClass('bg-blue-50');

    // Press Enter to select
    await user.keyboard('{Enter}');

    expect(defaultProps.onSuggestionSelect).toHaveBeenCalled();
  });

  it('closes suggestions with Escape key', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('MacBook Pro 16"')).not.toBeInTheDocument();
    });
  });

  it('shows search history when input is empty', async () => {
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    // Focus on input to show history
    await act(async () => {
      input.focus();
    });

    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('macbook')).toBeInTheDocument();
      expect(screen.getByText('dell monitor')).toBeInTheDocument();
    });
  });

  it('shows popular searches', async () => {
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    // Focus on input to show history
    await act(async () => {
      input.focus();
    });

    await waitFor(() => {
      expect(screen.getByText('Popular Searches')).toBeInTheDocument();
      expect(screen.getByText('macbook')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
      expect(screen.getByText('monitor')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });
  });

  it('handles clicking on search history items', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    // Focus on input to show history
    await act(async () => {
      input.focus();
    });

    await waitFor(() => {
      expect(screen.getByText('macbook')).toBeInTheDocument();
    });

    await user.click(screen.getByText('macbook'));

    expect(input.value).toBe('macbook');
    expect(defaultProps.onSearch).toHaveBeenCalledWith('macbook');
  });

  it('toggles advanced filters panel', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const advancedFiltersButton = screen.getByText('Advanced Filters');

    expect(
      screen.queryByText('Advanced Search Filters')
    ).not.toBeInTheDocument();

    await user.click(advancedFiltersButton);

    expect(screen.getByText('Advanced Search Filters')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();

    await user.click(advancedFiltersButton);

    expect(
      screen.queryByText('Advanced Search Filters')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
  });

  it('hides suggestions when showSuggestions is false', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} showSuggestions={false} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    // Wait a bit to ensure suggestions don't appear
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    expect(screen.queryByText('MacBook Pro 16"')).not.toBeInTheDocument();
  });

  it('hides search history when showHistory is false', async () => {
    render(<AdvancedSearch {...defaultProps} showHistory={false} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    // Focus on input
    await act(async () => {
      input.focus();
    });

    // Wait a bit to ensure history doesn't appear
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
  });

  it('debounces suggestion requests', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    // Type quickly
    await user.type(input, 'Mac', { delay: 50 });

    // Should only call getSuggestions once after debounce
    await waitFor(() => {
      expect(searchService.getSuggestions).toHaveBeenCalledTimes(1);
    });
  });

  it('closes suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AdvancedSearch {...defaultProps} />
        <div data-testid='outside-element'>Outside</div>
      </div>
    );

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'Mac');

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });

    // Click outside
    await user.click(screen.getByTestId('outside-element'));

    await waitFor(() => {
      expect(screen.queryByText('MacBook Pro 16"')).not.toBeInTheDocument();
    });
  });

  it('handles empty suggestions gracefully', async () => {
    const user = userEvent.setup();
    searchService.getSuggestions.mockReturnValue({
      products: [],
      brands: [],
      tags: [],
      categories: [],
    });

    render(<AdvancedSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Search products, brands, models, or tags...'
    );

    await user.type(input, 'xyz');

    await waitFor(() => {
      expect(screen.getByText('No suggestions found')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <AdvancedSearch {...defaultProps} className='custom-search-class' />
    );

    expect(container.firstChild).toHaveClass('custom-search-class');
  });
});
