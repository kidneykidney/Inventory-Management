/**
 * Admin Product Management Component
 * Comprehensive interface for managing products with bulk operations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  MoreHorizontal,
  Package,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bulkImportData, setBulkImportData] = useState('');
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    categoryId: '',
    subcategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    conditionStatus: 'good',
    location: '',
    maxLendingPeriod: 30,
    requiresApproval: false,
    imageUrls: [],
    specifications: {},
    tags: []
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory, selectedCondition, selectedAvailability]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(selectedCondition && { condition: selectedCondition }),
        ...(selectedAvailability && { isAvailable: selectedAvailability })
      });

      const response = await fetch(`/api/v1/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      toast({
        title: "Success",
        description: "Product created successfully"
      });

      setShowAddDialog(false);
      setNewProduct({
        name: '',
        description: '',
        categoryId: '',
        subcategory: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        warrantyExpiry: '',
        conditionStatus: 'good',
        location: '',
        maxLendingPeriod: 30,
        requiresApproval: false,
        imageUrls: [],
        specifications: {},
        tags: []
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/v1/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(selectedProduct)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      toast({
        title: "Success",
        description: "Product updated successfully"
      });

      setShowEditDialog(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBulkImport = async () => {
    try {
      let products;
      try {
        products = JSON.parse(bulkImportData);
      } catch {
        throw new Error('Invalid JSON format');
      }

      if (!Array.isArray(products)) {
        throw new Error('Data must be an array of products');
      }

      const response = await fetch('/api/v1/admin/products/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ products })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import products');
      }

      const result = await response.json();
      
      toast({
        title: "Import Complete",
        description: `${result.data.successful.length} products imported successfully, ${result.data.failed.length} failed`
      });

      setShowBulkImportDialog(false);
      setBulkImportData('');
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getConditionBadge = (condition) => {
    const variants = {
      excellent: 'success',
      good: 'default',
      fair: 'secondary',
      needs_repair: 'destructive'
    };
    return <Badge variant={variants[condition] || 'default'}>{condition}</Badge>;
  };

  const getAvailabilityBadge = (isAvailable) => {
    return isAvailable ? (
      <Badge variant="success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Available
      </Badge>
    ) : (
      <Badge variant="secondary">
        <X className="h-3 w-3 mr-1" />
        Unavailable
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Manage your lending inventory</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Products</DialogTitle>
                <DialogDescription>
                  Import multiple products using JSON format
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-data">Product Data (JSON)</Label>
                  <Textarea
                    id="bulk-data"
                    placeholder='[{"name": "Product 1", "categoryId": "uuid", "brand": "Brand"}]'
                    value={bulkImportData}
                    onChange={(e) => setBulkImportData(e.target.value)}
                    rows={10}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport}>
                    Import Products
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => toast({ title: "Export", description: "Export functionality would be implemented here" })}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product in the lending system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={newProduct.model}
                      onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={newProduct.serialNumber}
                      onChange={(e) => setNewProduct({ ...newProduct, serialNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newProduct.location}
                      onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={newProduct.conditionStatus} onValueChange={(value) => setNewProduct({ ...newProduct, conditionStatus: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="needs_repair">Needs Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxLendingPeriod">Max Lending Period (days)</Label>
                    <Input
                      id="maxLendingPeriod"
                      type="number"
                      value={newProduct.maxLendingPeriod}
                      onChange={(e) => setNewProduct({ ...newProduct, maxLendingPeriod: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Product
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition-filter">Condition</Label>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="All conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conditions</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="needs_repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="availability-filter">Availability</Label>
              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger>
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Products ({products.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand/Model</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.serialNumber && (
                            <p className="text-sm text-gray-500">SN: {product.serialNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category_name || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {product.brand && <p className="font-medium">{product.brand}</p>}
                          {product.model && <p className="text-sm text-gray-500">{product.model}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConditionBadge(product.conditionStatus)}
                      </TableCell>
                      <TableCell>
                        {getAvailabilityBadge(product.isAvailable)}
                      </TableCell>
                      <TableCell>
                        {product.location || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      {selectedProduct && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select value={selectedProduct.categoryId} onValueChange={(value) => setSelectedProduct({ ...selectedProduct, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedProduct.description || ''}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    value={selectedProduct.brand || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, brand: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-model">Model</Label>
                  <Input
                    id="edit-model"
                    value={selectedProduct.model || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-condition">Condition</Label>
                  <Select value={selectedProduct.conditionStatus} onValueChange={(value) => setSelectedProduct({ ...selectedProduct, conditionStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="needs_repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={selectedProduct.location || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductManagement;