import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Package,
  Star,
  Tag,
  Building,
  Clock,
  RefreshCw,
} from 'lucide-react';
import searchService from '../../services/searchService';

/**
 * AdvancedFilterSidebar Component
 * Collapsible sidebar with multi-criteria filtering options
 */
const AdvancedFilterSidebar = ({
  products = [],
  filters = {},
  onFiltersChange,
  onClearFilters,
  className = '',
  isOpen = true,
  onToggle,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    availability: true,
    condition: true,
    brand: false,
    location: false,
    tags: false,
    dateRange: false,
    lendingPeriod: false,
  });
  const [filterSuggestions, setFilterSuggestions] = useState({
    brands: [],
    locations: [],
    tags: [],
    conditions: [],
    lendingPeriods: [],
  });

  // Load filter suggestions when products change
  useEffect(() => {
    if (products.length > 0) {
      const suggestions = searchService.getFilterSuggestions(products);
      setFilterSuggestions(suggestions);
    }
  }, [products]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Toggle section expansion
  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Update filter value
  const updateFilter = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Toggle array filter value
  const toggleArrayFilter = (key, value) => {
    const currentArray = localFilters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    updateFilter(key, newArray);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters?.();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, value]) => {
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

  // Render collapsible section
  const renderSection = (title, key, icon, children) => {
    const isExpanded = expandedSections[key];

    return (
      <div className='border-b border-gray-200 last:border-b-0'>
        <button
          onClick={() => toggleSection(key)}
          className='w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors'
        >
          <div className='flex items-center gap-3'>
            {React.createElement(icon, { className: 'h-4 w-4 text-gray-500' })}
            <span className='font-medium text-gray-900'>{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className='h-4 w-4 text-gray-500' />
          ) : (
            <ChevronDown className='h-4 w-4 text-gray-500' />
          )}
        </button>

        {isExpanded && <div className='px-4 pb-4'>{children}</div>}
      </div>
    );
  };

  // Render checkbox list
  const renderCheckboxList = (items, filterKey, selectedItems = []) => (
    <div className='space-y-2 max-h-48 overflow-y-auto'>
      {items.map((item, index) => (
        <label
          key={index}
          className='flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded'
        >
          <input
            type='checkbox'
            checked={selectedItems.includes(item)}
            onChange={() => toggleArrayFilter(filterKey, item)}
            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
          />
          <span className='text-sm text-gray-700 flex-1'>{item}</span>
          <span className='text-xs text-gray-500'>
            (
            {
              products.filter(
                p =>
                  p[filterKey.slice(0, -1)] === item ||
                  (Array.isArray(p[filterKey.slice(0, -1)]) &&
                    p[filterKey.slice(0, -1)].includes(item))
              ).length
            }
            )
          </span>
        </label>
      ))}
    </div>
  );

  // Render radio list
  const renderRadioList = (items, filterKey, selectedValue) => (
    <div className='space-y-2'>
      <label className='flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded'>
        <input
          type='radio'
          name={filterKey}
          value='all'
          checked={!selectedValue || selectedValue === 'all'}
          onChange={() => updateFilter(filterKey, 'all')}
          className='text-blue-600 focus:ring-blue-500'
        />
        <span className='text-sm text-gray-700'>All</span>
      </label>
      {items.map((item, index) => (
        <label
          key={index}
          className='flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded'
        >
          <input
            type='radio'
            name={filterKey}
            value={item.value || item}
            checked={selectedValue === (item.value || item)}
            onChange={() => updateFilter(filterKey, item.value || item)}
            className='text-blue-600 focus:ring-blue-500'
          />
          <span className='text-sm text-gray-700 flex-1'>
            {item.label || item}
          </span>
          {item.count && (
            <span className='text-xs text-gray-500'>({item.count})</span>
          )}
        </label>
      ))}
    </div>
  );

  const activeFilterCount = getActiveFilterCount();

  if (!isOpen) {
    return (
      <Button
        variant='outline'
        onClick={onToggle}
        className='fixed left-4 top-1/2 transform -translate-y-1/2 z-40 flex items-center gap-2'
      >
        <Filter className='h-4 w-4' />
        Filters
        {activeFilterCount > 0 && (
          <Badge
            variant='default'
            className='ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs'
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Filter className='h-5 w-5 text-gray-600' />
            <h2 className='font-semibold text-gray-900'>Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant='default' className='h-5 px-2 text-xs'>
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-1'>
            {activeFilterCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClearFilters}
                className='text-xs flex items-center gap-1'
              >
                <RefreshCw className='h-3 w-3' />
                Clear
              </Button>
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggle}
              className='p-1'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Sections */}
      <div className='overflow-y-auto max-h-[calc(100vh-120px)]'>
        {/* Category Filter */}
        {renderSection(
          'Category',
          'category',
          Package,
          renderRadioList(
            [
              {
                value: 'electronics',
                label: 'Electronics',
                count: products.filter(p => p.category === 'electronics')
                  .length,
              },
              {
                value: 'office_supplies',
                label: 'Office Supplies',
                count: products.filter(p => p.category === 'office_supplies')
                  .length,
              },
              {
                value: 'furniture',
                label: 'Furniture',
                count: products.filter(p => p.category === 'furniture').length,
              },
              {
                value: 'tools',
                label: 'Tools',
                count: products.filter(p => p.category === 'tools').length,
              },
            ],
            'categoryId',
            localFilters.categoryId
          )
        )}

        {/* Availability Filter */}
        {renderSection(
          'Availability',
          'availability',
          Package,
          renderRadioList(
            [
              {
                value: 'available',
                label: 'Available',
                count: products.filter(p => p.isAvailable).length,
              },
              {
                value: 'unavailable',
                label: 'Unavailable',
                count: products.filter(p => !p.isAvailable).length,
              },
            ],
            'availability',
            localFilters.availability
          )
        )}

        {/* Condition Filter */}
        {renderSection(
          'Condition',
          'condition',
          Star,
          renderRadioList(
            [
              {
                value: 'excellent',
                label: 'Excellent',
                count: products.filter(p => p.conditionStatus === 'excellent')
                  .length,
              },
              {
                value: 'good',
                label: 'Good',
                count: products.filter(p => p.conditionStatus === 'good')
                  .length,
              },
              {
                value: 'fair',
                label: 'Fair',
                count: products.filter(p => p.conditionStatus === 'fair')
                  .length,
              },
              {
                value: 'needs_repair',
                label: 'Needs Repair',
                count: products.filter(
                  p => p.conditionStatus === 'needs_repair'
                ).length,
              },
            ],
            'condition',
            localFilters.condition
          )
        )}

        {/* Brand Filter */}
        {filterSuggestions.brands.length > 0 &&
          renderSection(
            'Brand',
            'brand',
            Building,
            renderCheckboxList(
              filterSuggestions.brands,
              'brands',
              localFilters.brand || []
            )
          )}

        {/* Location Filter */}
        {renderSection(
          'Location',
          'location',
          MapPin,
          <div className='space-y-3'>
            <Input
              placeholder='Filter by location...'
              value={localFilters.location || ''}
              onChange={e => updateFilter('location', e.target.value)}
              className='text-sm'
            />
            {filterSuggestions.locations.length > 0 && (
              <div className='space-y-1'>
                <div className='text-xs text-gray-500 mb-2'>
                  Common locations:
                </div>
                <div className='flex flex-wrap gap-1'>
                  {filterSuggestions.locations
                    .slice(0, 6)
                    .map((location, index) => (
                      <Badge
                        key={index}
                        variant='outline'
                        className='cursor-pointer hover:bg-gray-100 text-xs'
                        onClick={() => updateFilter('location', location)}
                      >
                        {location}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags Filter */}
        {filterSuggestions.tags.length > 0 &&
          renderSection(
            'Tags',
            'tags',
            Tag,
            <div className='space-y-3'>
              <div className='flex flex-wrap gap-1 max-h-32 overflow-y-auto'>
                {filterSuggestions.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant={
                      (localFilters.tags || []).includes(tag)
                        ? 'default'
                        : 'outline'
                    }
                    className='cursor-pointer hover:bg-gray-100 text-xs'
                    onClick={() => toggleArrayFilter('tags', tag)}
                  >
                    {tag}
                    {(localFilters.tags || []).includes(tag) && (
                      <X className='h-3 w-3 ml-1' />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Date Range Filter */}
        {renderSection(
          'Date Added',
          'dateRange',
          Calendar,
          <div className='space-y-3'>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>From:</label>
              <Input
                type='date'
                value={localFilters.dateRange?.start || ''}
                onChange={e =>
                  updateFilter('dateRange', {
                    ...localFilters.dateRange,
                    start: e.target.value,
                  })
                }
                className='text-sm'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>To:</label>
              <Input
                type='date'
                value={localFilters.dateRange?.end || ''}
                onChange={e =>
                  updateFilter('dateRange', {
                    ...localFilters.dateRange,
                    end: e.target.value,
                  })
                }
                className='text-sm'
              />
            </div>
          </div>
        )}

        {/* Lending Period Filter */}
        {renderSection(
          'Max Lending Period',
          'lendingPeriod',
          Clock,
          <div className='space-y-3'>
            <div>
              <label className='block text-xs text-gray-600 mb-2'>
                Up to {localFilters.maxLendingPeriod || 30} days
              </label>
              <input
                type='range'
                min='1'
                max='90'
                value={localFilters.maxLendingPeriod || 30}
                onChange={e =>
                  updateFilter('maxLendingPeriod', Number(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <div className='flex justify-between text-xs text-gray-500 mt-1'>
                <span>1 day</span>
                <span>90 days</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {activeFilterCount > 0 && (
        <div className='p-4 border-t border-gray-200 bg-gray-50'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-600'>
              {products.length} products match your filters
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={handleClearFilters}
              className='flex items-center gap-1'
            >
              <RefreshCw className='h-3 w-3' />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterSidebar;
