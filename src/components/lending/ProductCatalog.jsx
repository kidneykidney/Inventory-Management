import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc,
  Package,
  AlertCircle
} from 'lucide-react';

/**
 * ProductCatalog Component
 * Main catalog interface with search, filtering, and grid/list views
 */
const ProductCatalog = ({ 
  products = [], 
  categories = [],
  loading = false,
  onProductUpdate,
  onProductBorrow,
  isAdmin = false,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Search filter
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        product.categoryId === parseInt(selectedCategory);

      // Condition filter
      const matchesCondition = selectedCondition === 'all' || 
        product.conditionStatus === selectedCondition;

      // Availability filter
      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && product.isAvailable) ||
        (availabilityFilter === 'unavailable' && !product.isAvailable);

      return matchesSearch && matchesCategory && matchesCondition && matchesAvailability;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'brand':
          aValue = (a.brand || '').toLowerCase();
          bValue = (b.brand || '').toLowerCase();
          break;
        case 'condition':
          const conditionOrder = { excellent: 4, good: 3, fair: 2, needs_repair: 1 };
          aValue = conditionOrder[a.conditionStatus] || 0;
          bValue = conditionOrder[b.conditionStatus] || 0;
          break;
        case 'created_at':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedCondition, availabilityFilter, sortBy, sortOrder]);

  const handleProductView = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleProductEdit = (product) => {
    // This would typically open an edit modal or navigate to edit page
    console.log('Edit product:', product);
    onProductUpdate?.(product);
  };

  const handleProductBorrow = (product) => {
    onProductBorrow?.(product);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setAvailabilityFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all' ? selectedCategory : null,
    selectedCondition !== 'all' ? selectedCondition : null,
    availabilityFilter !== 'all' ? availabilityFilter : null
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedProducts.length} of {products.length} products
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                </Badge>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products, brands, models, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Condition Filter */}
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="needs_repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>

            {/* Availability Filter */}
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="available">Available Only</SelectItem>
                <SelectItem value="unavailable">Unavailable Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="condition">Condition</SelectItem>
                <SelectItem value="created_at">Date Added</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 text-center mb-4">
              {products.length === 0 
                ? "No products have been added to the catalog yet."
                : "Try adjusting your search terms or filters to find what you're looking for."
              }
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredAndSortedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleProductView}
              onEdit={handleProductEdit}
              onBorrow={handleProductBorrow}
              isAdmin={isAdmin}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProduct(null);
          }}
          onBorrow={handleProductBorrow}
          onEdit={handleProductEdit}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default ProductCatalog;