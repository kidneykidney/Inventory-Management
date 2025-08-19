import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

// Modern UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';

// Lending Components
import LendingTable from '../components/lending/LendingTable';
import LendingFilters from '../components/lending/LendingFilters';
import LendingForm from '../components/lending/LendingForm';

import { logger } from '../utils/logger';

// Mock data for lending items (transformed from inventory)
const initialLendingData = [
  {
    id: 1,
    sku: 'ELC001',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    subcategory: 'Laptops',
    brand: 'Apple',
    model: 'MacBook Pro',
    serialNumber: 'C02XW0XHJGH5',
    specifications: {
      processor: 'M1 Pro',
      memory: '16GB',
      storage: '512GB SSD',
      display: '16-inch Retina'
    },
    quantity: 5,
    available: 3,
    location: 'Tech Storage A',
    condition: 'excellent',
    tags: ['laptop', 'development', 'design'],
    isAvailable: true,
    lendingPolicy: {
      maxLendingPeriod: 30,
      requiresApproval: true
    }
  },
  {
    id: 2,
    sku: 'OFF001',
    name: 'Ergonomic Office Chair',
    category: 'Office Supplies',
    subcategory: 'Furniture',
    brand: 'Herman Miller',
    model: 'Aeron',
    serialNumber: 'HM2023001',
    specifications: {
      material: 'Mesh',
      adjustable: 'Height, Arms, Tilt',
      warranty: '12 years'
    },
    quantity: 8,
    available: 6,
    location: 'Office Storage B',
    condition: 'good',
    tags: ['chair', 'ergonomic', 'office'],
    isAvailable: true,
    lendingPolicy: {
      maxLendingPeriod: 90,
      requiresApproval: false
    }
  },
  {
    id: 3,
    sku: 'ELC002',
    name: 'iPad Pro 12.9"',
    category: 'Electronics',
    subcategory: 'Tablets',
    brand: 'Apple',
    model: 'iPad Pro',
    serialNumber: 'DMPH2LL/A',
    specifications: {
      display: '12.9-inch Liquid Retina',
      storage: '256GB',
      connectivity: 'Wi-Fi + Cellular'
    },
    quantity: 3,
    available: 0,
    location: 'Tech Storage A',
    condition: 'excellent',
    tags: ['tablet', 'design', 'presentation'],
    isAvailable: false,
    lendingPolicy: {
      maxLendingPeriod: 14,
      requiresApproval: true
    }
  }
];

/**
 * Modern Lending System Page
 * Replaces the old inventory page with lending-focused functionality
 */
const LendingSystemPage = () => {
  const { toast } = useToast();
  
  // State management
  const [lendingData, setLendingData] = useState([...initialLendingData]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLendDialogOpen, setIsLendDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Electronics',
    subcategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    location: '',
    condition: 'excellent',
    tags: '',
    maxLendingPeriod: 30,
    requiresApproval: false
  });
  


  useEffect(() => {
    logger.info('LendingSystemPage component mounted');
    logger.debug('Initial lending data loaded', { count: lendingData.length });
  }, []);

  // Filter data based on search and filters
  const filteredData = lendingData.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesAvailability = 
      filterAvailability === 'all' || 
      (filterAvailability === 'available' && item.isAvailable) ||
      (filterAvailability === 'unavailable' && !item.isAvailable);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Get unique categories
  const categories = [...new Set(lendingData.map(item => item.category))];

  // Status badge variant based on availability
  const getStatusVariant = (item) => {
    if (!item.isAvailable) return 'destructive';
    if (item.available <= 2) return 'secondary';
    return 'default';
  };

  // Status text
  const getStatusText = (item) => {
    if (!item.isAvailable) return 'Unavailable';
    if (item.available <= 2) return 'Low Stock';
    return 'Available';
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // Reset forms
  const resetForms = () => {
    setFormData({
      sku: '',
      name: '',
      category: 'Electronics',
      subcategory: '',
      brand: '',
      model: '',
      serialNumber: '',
      quantity: 1,
      location: '',
      condition: 'excellent',
      tags: '',
      maxLendingPeriod: 30,
      requiresApproval: false
    });
  };

  // Add new item
  const handleAddItem = () => {
    if (!formData.name || !formData.sku || !formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const newItem = {
      id: Math.max(...lendingData.map(item => item.id), 0) + 1,
      ...formData,
      available: formData.quantity,
      specifications: {},
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isAvailable: formData.quantity > 0,
      lendingPolicy: {
        maxLendingPeriod: formData.maxLendingPeriod,
        requiresApproval: formData.requiresApproval
      }
    };

    setLendingData(prev => [...prev, newItem]);
    setIsAddDialogOpen(false);
    resetForms();
    
    toast({
      title: 'Success',
      description: 'Item added successfully to lending system'
    });

    logger.info('New lending item added', newItem);
  };

  // Edit item
  const handleEditItem = () => {
    if (!selectedItem) return;

    const updatedData = lendingData.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isAvailable: formData.quantity > 0,
          available: Math.min(formData.quantity, item.available),
          lendingPolicy: {
            maxLendingPeriod: formData.maxLendingPeriod,
            requiresApproval: formData.requiresApproval
          }
        };
      }
      return item;
    });

    setLendingData(updatedData);
    setIsEditDialogOpen(false);
    setSelectedItem(null);
    resetForms();
    
    toast({
      title: 'Success',
      description: 'Item updated successfully'
    });

    logger.info('Lending item updated', { id: selectedItem.id });
  };

  // Process lending
  const handleProcessLending = (formData) => {
    if (!selectedItem) {
      toast({
        title: 'Error',
        description: 'No item selected for lending',
        variant: 'destructive'
      });
      return;
    }

    // Update item availability
    const updatedData = lendingData.map(item => {
      if (item.id === selectedItem.id) {
        const newAvailable = item.available - formData.quantity;
        return {
          ...item,
          available: newAvailable,
          isAvailable: newAvailable > 0
        };
      }
      return item;
    });

    setLendingData(updatedData);
    setIsLendDialogOpen(false);
    setSelectedItem(null);
    
    toast({
      title: 'Lending Processed',
      description: `${formData.quantity} ${selectedItem.name}(s) lent to ${formData.borrowerName}`
    });

    logger.info('Item lent successfully', {
      item: selectedItem.name,
      quantity: formData.quantity,
      borrower: formData.borrowerName
    });
  };

  // Delete item
  const handleDeleteItem = (id) => {
    setLendingData(prev => prev.filter(item => item.id !== id));
    toast({
      title: 'Item Deleted',
      description: 'Item removed from lending system'
    });
    logger.info('Lending item deleted', { id });
  };

  // Open edit dialog
  const openEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory || '',
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      quantity: item.quantity,
      location: item.location,
      condition: item.condition,
      tags: item.tags.join(', '),
      maxLendingPeriod: item.lendingPolicy.maxLendingPeriod,
      requiresApproval: item.lendingPolicy.requiresApproval
    });
    setIsEditDialogOpen(true);
  };

  // Open lending dialog
  const openLendingDialog = (item) => {
    setSelectedItem(item);
    setIsLendDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Electronics & Office Components</h1>
          <p className="text-muted-foreground">Manage lending and borrowing of company equipment</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filters */}
      <LendingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterAvailability={filterAvailability}
        onAvailabilityChange={setFilterAvailability}
        categories={categories}
        onAddItem={() => setIsAddDialogOpen(true)}
      />

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lending Items</CardTitle>
          <CardDescription>
            {filteredData.length} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LendingTable
            items={filteredData}
            onEdit={openEditDialog}
            onLend={openLendingDialog}
            onDelete={handleDeleteItem}
            loading={false}
          />
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to the lending system
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
                placeholder="e.g., ELC001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="e.g., MacBook Pro 16 inch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleFormChange('subcategory', e.target.value)}
                placeholder="e.g., Laptops"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
                placeholder="e.g., Apple"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleFormChange('model', e.target.value)}
                placeholder="e.g., MacBook Pro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleFormChange('serialNumber', e.target.value)}
                placeholder="e.g., C02XW0XHJGH5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                placeholder="e.g., Tech Storage A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => handleFormChange('condition', value)}>
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
            <div className="col-span-2 space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleFormChange('tags', e.target.value)}
                placeholder="e.g., laptop, development, design"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update item information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => handleFormChange('tags', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lending Dialog */}
      <LendingForm
        isOpen={isLendDialogOpen}
        onClose={() => setIsLendDialogOpen(false)}
        onSubmit={handleProcessLending}
        title="Lend Item"
        item={selectedItem}
      />
    </div>
  );
};

export default LendingSystemPage;