import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent } from '../ui/card';

/**
 * LendingFilters component for filtering and searching lending items
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback for search term changes
 * @param {string} props.filterCategory - Current category filter
 * @param {Function} props.onCategoryChange - Callback for category filter changes
 * @param {string} props.filterAvailability - Current availability filter
 * @param {Function} props.onAvailabilityChange - Callback for availability filter changes
 * @param {Array} props.categories - Available categories for filtering
 * @param {Function} props.onAddItem - Callback for add item action
 */
const LendingFilters = ({
  searchTerm = '',
  onSearchChange,
  filterCategory = '',
  onCategoryChange,
  filterAvailability = '',
  onAvailabilityChange,
  categories = [],
  onAddItem,
}) => {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex flex-wrap gap-4 items-center'>
          {/* Search Input */}
          <div className='flex-1 min-w-[200px]'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search items, SKU, brand, or tags...'
                value={searchTerm}
                onChange={e => onSearchChange && onSearchChange(e.target.value)}
                className='pl-10'
                aria-label='Search items'
              />
            </div>
          </div>

          {/* Category Filter */}
          <Select
            value={filterCategory}
            onValueChange={onCategoryChange}
            aria-label='Filter by category'
          >
            <SelectTrigger className='w-[180px]' aria-label='All Categories'>
              <SelectValue placeholder='All Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Availability Filter */}
          <Select
            value={filterAvailability}
            onValueChange={onAvailabilityChange}
            aria-label='Filter by availability'
          >
            <SelectTrigger className='w-[180px]' aria-label='All Items'>
              <SelectValue placeholder='All Items' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Items</SelectItem>
              <SelectItem value='available'>Available</SelectItem>
              <SelectItem value='unavailable'>Unavailable</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Item Button */}
          <Button onClick={onAddItem} className='ml-auto' aria-label='Add Item'>
            <Plus className='mr-2 h-4 w-4' />
            Add Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LendingFilters;
