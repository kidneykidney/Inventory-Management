import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Search,
  Filter,
  X,
  Menu,
  History,
  Settings,
  Download,
  Share2,
} from 'lucide-react';
import AdvancedSearch from './AdvancedSearch';
import AdvancedFilterSidebar from './AdvancedFilterSidebar';
import SearchResultsGrid from './SearchResultsGrid';
import SearchHistory from './SearchHistory';
import searchService from '../../services/searchService';

/**
 * ModernSearchInterface Component
 * Complete modern search interface with all advanced features
 */
const ModernSearchInterface = ({
  products = [],
  onProductSelect,
  onProductAction,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize with all products
  useEffect(() => {
    setFilteredProducts(products);
    setSearchResults(products);
  }, [products]);

  // Debounced search function
  const performSearch = useCallback(
    (query, currentFilters = filters) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        setLoading(true);

        try {
          let results = products;

          // Apply text search if query exists
          if (query && query.trim()) {
            results = searchService.searchProducts(products, query, {
              boostAvailable: true,
            });
          }

          // Apply filters
          if (Object.keys(currentFilters).length > 0) {
            results = searchService.applyAdvancedFilters(
              results,
              currentFilters
            );
          }

          setSearchResults(results);
          setFilteredProducts(results);
          setHasSearched(
            query.trim().length > 0 || Object.keys(currentFilters).length > 0
          );
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          setFilteredProducts([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [products, filters]
  );

  // Handle search query change
  const handleSearch = query => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Handle filter changes
  const handleFiltersChange = newFilters => {
    setFilters(newFilters);
    performSearch(searchQuery, newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    performSearch(searchQuery, {});
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion, type) => {
    let searchTerm = '';

    switch (type) {
      case 'product':
        searchTerm = suggestion.name || suggestion;
        break;
      case 'brand':
        // Set brand filter instead of search
        handleFiltersChange({ ...filters, brand: [suggestion] });
        return;
      case 'tag':
        // Set tag filter instead of search
        handleFiltersChange({ ...filters, tags: [suggestion] });
        return;
      case 'category':
        // Set category filter instead of search
        handleFiltersChange({ ...filters, categoryId: suggestion });
        return;
      default:
        searchTerm = suggestion;
    }

    setSearchQuery(searchTerm);
    performSearch(searchTerm);
  };

  // Handle saved search selection
  const handleSavedSearchSelect = savedSearch => {
    setSearchQuery(savedSearch.query);
    performSearch(savedSearch.query);
    setShowHistory(false);
  };

  // Export search results
  const handleExportResults = () => {
    const dataStr = JSON.stringify(searchResults, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `search-results-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Share search results
  const handleShareResults = async () => {
    const shareData = {
      title: 'Product Search Results',
      text: `Found ${searchResults.length} products${searchQuery ? ` for "${searchQuery}"` : ''}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (Array.isArray(value) && value.length > 0) count++;
        else if (typeof value === 'string' && value.trim()) count++;
        else if (typeof value === 'object' && (value.start || value.end))
          count++;
        else if (typeof value === 'number') count++;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div
      className={`min-h-screen bg-gray-50 ${className}`}
      data-testid='modern-search-interface'
    >
      {/* Mobile Header */}
      {isMobile && (
        <div
          className='bg-white border-b border-gray-200 p-4 sticky top-0 z-30'
          data-testid='mobile-header'
        >
          <div className='flex items-center gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2'
              data-testid='mobile-filters-button'
            >
              <Filter className='h-4 w-4' />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant='default'
                  className='h-5 px-2 text-xs'
                  data-testid='filter-count-badge'
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowHistory(!showHistory)}
              className='flex items-center gap-2'
              data-testid='mobile-history-button'
            >
              <History className='h-4 w-4' />
              History
            </Button>
          </div>
        </div>
      )}

      <div className='flex h-screen'>
        {/* Filter Sidebar */}
        <div
          className={`${
            isMobile
              ? `fixed inset-y-0 left-0 z-40 w-80 transform transition-transform ${
                  showFilters ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'w-80 flex-shrink-0'
          }`}
          data-testid={isMobile ? 'mobile-filter-overlay' : 'desktop-sidebar'}
        >
          <AdvancedFilterSidebar
            products={products}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            isOpen={!isMobile || showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            className='h-full'
            data-testid='filter-sidebar'
          />
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col min-w-0'>
          {/* Search Header */}
          <div className='bg-white border-b border-gray-200 p-6 sticky top-0 z-20'>
            <div className='max-w-4xl mx-auto'>
              <div className='flex items-center gap-4 mb-4'>
                <div className='flex-1'>
                  <AdvancedSearch
                    products={products}
                    onSearch={handleSearch}
                    onSuggestionSelect={handleSuggestionSelect}
                    placeholder='Search electronics, office components, brands, or tags...'
                    showHistory={true}
                    showSuggestions={true}
                  />
                </div>

                {!isMobile && (
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setShowHistory(!showHistory)}
                      className='flex items-center gap-2'
                      data-testid='history-button'
                    >
                      <History className='h-4 w-4' />
                      History
                    </Button>

                    {searchResults.length > 0 && (
                      <>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleExportResults}
                          className='flex items-center gap-2'
                          data-testid='export-results-button'
                        >
                          <Download className='h-4 w-4' />
                          Export
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleShareResults}
                          className='flex items-center gap-2'
                          data-testid='share-results-button'
                        >
                          <Share2 className='h-4 w-4' />
                          Share
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div
                  className='flex items-center gap-2 flex-wrap'
                  data-testid='active-filters'
                >
                  <span className='text-sm text-gray-600'>Active filters:</span>
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value === 'all') return null;

                    if (Array.isArray(value) && value.length > 0) {
                      return value.map((item, index) => (
                        <Badge
                          key={`${key}-${index}`}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {key}: {item}
                          <button
                            onClick={() => {
                              const newValue = value.filter(v => v !== item);
                              handleFiltersChange({
                                ...filters,
                                [key]:
                                  newValue.length > 0 ? newValue : undefined,
                              });
                            }}
                            className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                            data-testid={`remove-filter-${item}`}
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      ));
                    } else if (typeof value === 'string' && value.trim()) {
                      return (
                        <Badge
                          key={key}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {key}: {value}
                          <button
                            onClick={() =>
                              handleFiltersChange({
                                ...filters,
                                [key]: undefined,
                              })
                            }
                            className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                            data-testid={`remove-filter-${key}`}
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      );
                    } else if (
                      typeof value === 'object' &&
                      (value.start || value.end)
                    ) {
                      return (
                        <Badge
                          key={key}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {key}: {value.start || 'any'} - {value.end || 'any'}
                          <button
                            onClick={() =>
                              handleFiltersChange({
                                ...filters,
                                [key]: undefined,
                              })
                            }
                            className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                            data-testid={`remove-filter-${key}`}
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      );
                    } else if (typeof value === 'number') {
                      return (
                        <Badge
                          key={key}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {key}: {value}
                          <button
                            onClick={() =>
                              handleFiltersChange({
                                ...filters,
                                [key]: undefined,
                              })
                            }
                            className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                            data-testid={`remove-filter-${key}`}
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      );
                    }
                    return null;
                  })}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleClearFilters}
                    className='text-xs text-gray-500 hover:text-red-600'
                    data-testid='clear-all-filters-button'
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-hidden'>
            <div className='flex h-full'>
              {/* Search Results */}
              <div className='flex-1 overflow-y-auto'>
                <div className='p-6'>
                  <SearchResultsGrid
                    products={searchResults}
                    loading={loading}
                    searchQuery={searchQuery}
                    onProductSelect={onProductSelect}
                    onProductAction={onProductAction}
                  />
                </div>
              </div>

              {/* History Sidebar */}
              {showHistory && (
                <div
                  className={`${
                    isMobile
                      ? 'fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-gray-200'
                      : 'w-80 border-l border-gray-200 bg-white'
                  } overflow-y-auto`}
                >
                  <div className='p-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='font-semibold text-gray-900'>
                        Search History
                      </h2>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowHistory(false)}
                        className='p-1'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                    <SearchHistory
                      onSearchSelect={handleSearch}
                      onSavedSearchSelect={handleSavedSearchSelect}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && (showFilters || showHistory) && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-30'
          onClick={() => {
            setShowFilters(false);
            setShowHistory(false);
          }}
        />
      )}
    </div>
  );
};

export default ModernSearchInterface;
