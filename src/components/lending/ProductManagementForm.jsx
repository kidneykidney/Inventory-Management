import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Upload, 
  X, 
  Plus, 
  Save, 
  AlertCircle,
  Image as ImageIcon,
  Tag
} from 'lucide-react';

/**
 * ProductManagementForm Component
 * Form for creating and editing products with image upload and specifications
 */
const ProductManagementForm = ({ 
  product = null, 
  categories = [],
  onSave, 
  onCancel,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
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
    isAvailable: true,
    maxLendingPeriod: 30,
    requiresApproval: false,
    specifications: {},
    tags: []
  });

  const [images, setImages] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [errors, setErrors] = useState({});

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId?.toString() || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        model: product.model || '',
        serialNumber: product.serialNumber || '',
        purchaseDate: product.purchaseDate ? product.purchaseDate.split('T')[0] : '',
        warrantyExpiry: product.warrantyExpiry ? product.warrantyExpiry.split('T')[0] : '',
        conditionStatus: product.conditionStatus || 'good',
        location: product.location || '',
        isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
        maxLendingPeriod: product.maxLendingPeriod || 30,
        requiresApproval: product.requiresApproval || false,
        specifications: product.specifications || {},
        tags: product.tags || []
      });
    }
  }, [product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Clean up object URLs
      const removed = prev.find(img => img.id === imageId);
      if (removed && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim()
        }
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (keyToRemove) => {
    setFormData(prev => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([key]) => key !== keyToRemove)
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.maxLendingPeriod < 1 || formData.maxLendingPeriod > 365) {
      newErrors.maxLendingPeriod = 'Max lending period must be between 1 and 365 days';
    }

    if (formData.serialNumber && formData.serialNumber.length > 100) {
      newErrors.serialNumber = 'Serial number must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'specifications' || key === 'tags') {
        submitData.append(key, JSON.stringify(value));
      } else {
        submitData.append(key, value);
      }
    });

    // Add images
    images.forEach(image => {
      if (image.file) {
        submitData.append('images', image.file);
      }
    });

    try {
      await onSave(submitData);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleInputChange('categoryId', value)}
              >
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Enter model"
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                placeholder="Enter serial number"
                className={errors.serialNumber ? 'border-red-500' : ''}
              />
              {errors.serialNumber && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.serialNumber}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Condition and Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Condition & Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select 
                value={formData.conditionStatus} 
                onValueChange={(value) => handleInputChange('conditionStatus', value)}
              >
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
              <Label htmlFor="maxLendingPeriod">Max Lending Period (days) *</Label>
              <Input
                id="maxLendingPeriod"
                type="number"
                min="1"
                max="365"
                value={formData.maxLendingPeriod}
                onChange={(e) => handleInputChange('maxLendingPeriod', parseInt(e.target.value))}
                className={errors.maxLendingPeriod ? 'border-red-500' : ''}
              />
              {errors.maxLendingPeriod && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.maxLendingPeriod}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                />
                <Label htmlFor="isAvailable">Available for lending</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => handleInputChange('requiresApproval', checked)}
                />
                <Label htmlFor="requiresApproval">Requires approval</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Important Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="warrantyExpiry"
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="images" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <Upload className="h-4 w-4" />
                Upload Images
              </div>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </Label>
            <p className="text-sm text-gray-600">
              Upload up to 5 images (JPG, PNG, GIF, WebP)
            </p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map(image => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt="Product"
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              value={newSpecKey}
              onChange={(e) => setNewSpecKey(e.target.value)}
              placeholder="Specification name"
            />
            <Input
              value={newSpecValue}
              onChange={(e) => setNewSpecValue(e.target.value)}
              placeholder="Value"
            />
            <Button type="button" onClick={addSpecification} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Spec
            </Button>
          </div>

          {Object.keys(formData.specifications).length > 0 && (
            <div className="space-y-2">
              {Object.entries(formData.specifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{key}:</span>
                    <span className="ml-2 text-gray-600">{value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecification(key)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductManagementForm;