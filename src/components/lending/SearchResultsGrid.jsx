import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  Calendar,
  Star,
  Filter,
} from 'lucide-react';
import ProductCard from './ProductCard';

/**
 * SearchResultsGrid Component
 * Modern search results display with sorting, pagination, and view options
 */
const SearchResultsGrid = ({
  products = [],
  loading = false,
  searchQuery = '',
  onProductSelect,
  onProductAction,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Relevance', icon: Star },
    { value: 'name', label: 'Name', icon: SortAsc },
    { value: 'brand', label: 'Brand', icon: SortAsc },
    { value: 'createdAt', label: 'Date Added', icon: Calendar },
    { value: 'availability', label: 'Availability', icon: Package },
  ];

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!products.length) return [];

    const sorted = [...products].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'brand':
          aValue = a.brand?.toLowerCase() || '';
          bValue = b.brand?.toLowerCase() || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'availability':
          aValue = a.isAvailable ? 1 : 0;
          bValue = b.isAvailable ? 1 : 0;
          break;
        case 'relevance':
        default:
          // For relevance, assume products are already sorted by search service
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [products, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  // Handle sort change
  const handleSortChange = newSortBy => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = page => {
    setCurrentPage(page);
    // Scroll to top of results
    document.getElementById('search-results-top')?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className='flex items-center justify-center gap-2 mt-8'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='flex items-center gap-1'
        >
          <ChevronLeft className='h-4 w-4' />
          Previous
        </Button>

        <div className='flex items-center gap-1'>
          {startPage > 1 && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className='px-2'>...</span>}
            </>
          )}

          {pages.map(page => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size='sm'
              onClick={() => handlePageChange(page)}
              className='min-w-[40px]'
            >
              {page}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className='px-2'>...</span>}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='flex items-center gap-1'
        >
          Next
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    );
  };

  // Render list view item
  const renderListItem = product => (
    <Card key={product.id} className='mb-4 hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-4'>
          {/* Product Image */}
          <div className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0'>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className='w-full h-full object-cover rounded-lg'
              />
            ) : (
              <Package className='h-8 w-8 text-gray-400' />
            )}
          </div>

          {/* Product Details */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between'>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-lg text-gray-900 truncate'>
                  {product.name}
                </h3>
                <p className='text-sm text-gray-600 mt-1'>
                  {product.brand} {product.model && `• ${product.model}`}
                </p>
                <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                  {product.description}
                </p>
              </div>

              <div className='flex flex-col items-end gap-2 ml-4'>
                <Badge
                  variant={product.isAvailable ? 'default' : 'secondary'}
                  className={
                    product.isAvailable ? 'bg-green-100 text-green-800' : ''
                  }
                >
                  {product.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>

                {product.location && (
                  <div className='flex items-center gap-1 text-sm text-gray-500'>
                    <MapPin className='h-3 w-3' />
                    {product.location}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className='flex flex-wrap gap-1 mt-3'>
                {product.tags.slice(0, 4).map((tag, index) => (
                  <Badge key={index} variant='outline' className='text-xs'>
                    {tag}
                  </Badge>
                ))}
                {product.tags.length > 4 && (
                  <Badge variant='outline' className='text-xs'>
                    +{product.tags.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className='flex items-center gap-2 mt-3'>
              <Button
                size='sm'
                onClick={() => onProductSelect?.(product)}
                className='flex items-center gap-1'
              >
                View Details
              </Button>
              {product.isAvailable && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onProductAction?.(product, 'borrow')}
                  className='flex items-center gap-1'
                >
                  Borrow
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-gray-600'>Searching products...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className}`}
      id='search-results-top'
      data-testid='search-results'
    >
      {/* Results Header */}
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4'>
          <div
            className='text-sm text-gray-600'
            data-testid='search-results-count'
          >
            {products.length > 0 ? (
              <>
                Showing {startIndex + 1}-{Math.min(endIndex, products.length)}{' '}
                of {products.length} results
                {searchQuery && (
                  <span className='ml-1' data-testid='search-query-display'>
                    for "<span className='font-medium'>{searchQuery}</span>"
                  </span>
                )}
              </>
            ) : searchQuery ? (
              `No results found for "${searchQuery}"`
            ) : (
              'No products found'
            )}
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* Items per page */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Show:</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className='text-sm border border-gray-300 rounded px-2 py-1'
              data-testid='items-per-page-select'
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Sort by:</span>
            <div className='flex items-center gap-1'>
              {sortOptions.map(option => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleSortChange(option.value)}
                  className='flex items-center gap-1'
                >
                  <option.icon className='h-3 w-3' />
                  {option.label}
                  {sortBy === option.value &&
                    (sortOrder === 'desc' ? (
                      <SortDesc className='h-3 w-3' />
                    ) : (
                      <SortAsc className='h-3 w-3' />
                    ))}
                </Button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className='flex items-center border border-gray-300 rounded'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
              className={`rounded-r-none border-r ${viewMode === 'grid' ? 'active' : ''}`}
              data-testid='grid-view-button'
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
              className={`rounded-l-none ${viewMode === 'list' ? 'active' : ''}`}
              data-testid='list-view-button'
            >
              <List className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      {products.length === 0 ? (
        <Card className='p-12 text-center'>
          <div className='flex flex-col items-center gap-4'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
              <Package className='h-8 w-8 text-gray-400' />
            </div>
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                {searchQuery ? 'No products found' : 'Start your search'}
              </h3>
              <p className='text-gray-600 max-w-md'>
                {searchQuery
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : 'Use the search bar above to find electronics and office components.'}
              </p>
            </div>
            {searchQuery && (
              <Button
                variant='outline'
                onClick={() => window.location.reload()}
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div
              className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              data-testid='results-grid'
            >
              {currentProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => onProductSelect?.(product)}
                  onAction={action => onProductAction?.(product, action)}
                  className='h-full'
                  data-testid='product-card'
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className='space-y-4' data-testid='results-list'>
              {currentProducts.map(renderListItem)}
            </div>
          )}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default SearchResultsGrid;
