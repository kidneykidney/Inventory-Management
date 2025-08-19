import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import searchService from '../../services/searchService';

/**
 * AdvancedSearch Component
 * Provides advanced search with auto-complete, suggestions, and search history
 */
const AdvancedSearch = ({
  products = [],
  onSearch,
  onSuggestionSelect,
  placeholder = 'Search products, brands, models, or tags...',
  showHistory = true,
  showSuggestions = true,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({
    products: [],
    brands: [],
    tags: [],
    categories: [],
  });
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const searchInputRef = useRef(null);
  const suggestionDropdownRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Load search analytics on component mount
  useEffect(() => {
    const analytics = searchService.getSearchAnalytics();
    setSearchHistory(analytics.recentSearches);
    setPopularSearches(analytics.popularSearches);
  }, []);

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(
    searchQuery => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (searchQuery.length >= 2) {
          const newSuggestions = searchService.getSuggestions(
            products,
            searchQuery,
            5
          );
          setSuggestions(newSuggestions);
          setShowSuggestionDropdown(true);
          setSelectedSuggestionIndex(-1);
        } else {
          setSuggestions({
            products: [],
            brands: [],
            tags: [],
            categories: [],
          });
          setShowSuggestionDropdown(false);
        }
      }, 300);
    },
    [products]
  );

  // Handle input change
  const handleInputChange = e => {
    const value = e.target.value;
    setQuery(value);

    if (showSuggestions) {
      fetchSuggestions(value);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setShowSuggestionDropdown(false);

      // Update search history
      const analytics = searchService.getSearchAnalytics();
      setSearchHistory(analytics.recentSearches);
      setPopularSearches(analytics.popularSearches);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion, type) => {
    let searchTerm = '';

    switch (type) {
      case 'product':
        searchTerm = suggestion.name;
        break;
      case 'brand':
      case 'tag':
      case 'category':
        searchTerm = suggestion;
        break;
      default:
        searchTerm = suggestion;
    }

    setQuery(searchTerm);
    setShowSuggestionDropdown(false);
    onSuggestionSelect?.(suggestion, type);
    handleSearch(searchTerm);
  };

  // Handle keyboard navigation
  const handleKeyDown = e => {
    if (!showSuggestionDropdown) return;

    const allSuggestions = [
      ...suggestions.products.map(p => ({ ...p, type: 'product' })),
      ...suggestions.brands.map(b => ({ name: b, type: 'brand' })),
      ...suggestions.tags.map(t => ({ name: t, type: 'tag' })),
      ...suggestions.categories.map(c => ({ name: c, type: 'category' })),
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (
          selectedSuggestionIndex >= 0 &&
          allSuggestions[selectedSuggestionIndex]
        ) {
          const suggestion = allSuggestions[selectedSuggestionIndex];
          handleSuggestionSelect(
            suggestion.name || suggestion,
            suggestion.type
          );
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestionDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        suggestionDropdownRef.current &&
        !suggestionDropdownRef.current.contains(event.target) &&
        !searchInputRef.current?.contains(event.target)
      ) {
        setShowSuggestionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setShowSuggestionDropdown(false);
    onSearch?.('');
  };

  // Render suggestion item
  const renderSuggestionItem = (suggestion, type, index, isSelected) => {
    const displayName = suggestion.name || suggestion;
    const icon =
      {
        product: '📦',
        brand: '🏢',
        tag: '🏷️',
        category: '📁',
      }[type] || '🔍';

    return (
      <button
        key={`${type}-${index}`}
        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500 selected' : ''
        }`}
        onClick={() => handleSuggestionSelect(suggestion, type)}
        data-testid='suggestion-item'
      >
        <span className='text-lg'>{icon}</span>
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-gray-900 truncate'>
            {displayName}
          </div>
          <div className='text-xs text-gray-500 capitalize'>{type}</div>
        </div>
      </button>
    );
  };

  const allSuggestions = [
    ...suggestions.products.map(p => ({ ...p, type: 'product' })),
    ...suggestions.brands.map(b => ({ name: b, type: 'brand' })),
    ...suggestions.tags.map(t => ({ name: t, type: 'tag' })),
    ...suggestions.categories.map(c => ({ name: c, type: 'category' })),
  ];

  const hasSuggestions = allSuggestions.length > 0;

  return (
    <div className={`relative ${className}`} data-testid='advanced-search'>
      {/* Main Search Input */}
      <div className='relative'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            ref={searchInputRef}
            type='text'
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 2 && showSuggestions) {
                setShowSuggestionDropdown(true);
              }
            }}
            className='pl-10 pr-20'
            data-testid='search-input'
          />
          <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
            {query && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={clearSearch}
                className='h-6 w-6 p-0 hover:bg-gray-100'
                data-testid='clear-search-button'
              >
                <X className='h-3 w-3' />
              </Button>
            )}
            <Button
              type='button'
              onClick={() => handleSearch()}
              size='sm'
              className='h-8 px-3'
              data-testid='search-button'
            >
              Search
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className='mt-2 flex items-center gap-2'
        >
          <Filter className='h-4 w-4' />
          Advanced Filters
          {showAdvancedFilters ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </Button>
      </div>

      {/* Suggestion Dropdown */}
      {showSuggestionDropdown && (showSuggestions || hasSuggestions) && (
        <Card
          ref={suggestionDropdownRef}
          className='absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg'
          data-testid='search-suggestions'
        >
          <CardContent className='p-0'>
            {hasSuggestions ? (
              <div className='py-2'>
                <div data-testid='product-suggestions'>
                  {suggestions.products.map((suggestion, index) =>
                    renderSuggestionItem(
                      suggestion,
                      'product',
                      index,
                      index === selectedSuggestionIndex
                    )
                  )}
                </div>
                <div data-testid='brand-suggestions'>
                  {suggestions.brands.map((suggestion, index) =>
                    renderSuggestionItem(
                      suggestion,
                      'brand',
                      index + suggestions.products.length,
                      index + suggestions.products.length ===
                        selectedSuggestionIndex
                    )
                  )}
                </div>
                <div data-testid='tag-suggestions'>
                  {suggestions.tags.map((suggestion, index) =>
                    renderSuggestionItem(
                      suggestion,
                      'tag',
                      index +
                        suggestions.products.length +
                        suggestions.brands.length,
                      index +
                        suggestions.products.length +
                        suggestions.brands.length ===
                        selectedSuggestionIndex
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className='p-4 text-center text-gray-500'>
                No suggestions found
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search History and Popular Searches */}
      {showHistory && !showSuggestionDropdown && !query && (
        <Card className='absolute top-full left-0 right-0 mt-1 z-40 shadow-lg'>
          <CardContent className='p-4'>
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div className='mb-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Clock className='h-4 w-4 text-gray-400' />
                  <span className='text-sm font-medium text-gray-700'>
                    Recent Searches
                  </span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {searchHistory.slice(0, 5).map((search, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='cursor-pointer hover:bg-gray-200'
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <TrendingUp className='h-4 w-4 text-gray-400' />
                  <span className='text-sm font-medium text-gray-700'>
                    Popular Searches
                  </span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {popularSearches.slice(0, 5).map((search, index) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='cursor-pointer hover:bg-gray-50 flex items-center gap-1'
                      onClick={() => {
                        setQuery(search.query);
                        handleSearch(search.query);
                      }}
                    >
                      {search.query}
                      <span className='text-xs text-gray-500'>
                        ({search.count})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {searchHistory.length === 0 && popularSearches.length === 0 && (
              <div className='text-center text-gray-500 py-4'>
                <Search className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                <p className='text-sm'>Start typing to search products</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card className='mt-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Advanced Search Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-gray-600'>
              Advanced filtering options will be implemented here based on your
              specific requirements. This could include date ranges, price
              ranges, specific attributes, etc.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;
