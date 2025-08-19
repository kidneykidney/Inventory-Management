import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Calendar, 
  MapPin, 
  Tag, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Package,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * ProductDetailModal Component
 * Displays comprehensive product information in a modal dialog
 */
const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onBorrow, 
  onEdit, 
  isAdmin = false 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs_repair':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasImages = product.imageUrls && product.imageUrls.length > 0;
  const currentImage = hasImages ? product.imageUrls[currentImageIndex] : null;

  const nextImage = () => {
    if (hasImages && currentImageIndex < product.imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (hasImages && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const specifications = product.specifications || {};
  const hasSpecifications = Object.keys(specifications).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </DialogTitle>
              {product.brand && product.model && (
                <DialogDescription className="text-lg text-gray-600">
                  {product.brand} • {product.model}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge 
                variant={product.isAvailable ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {product.isAvailable ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {product.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
              <Badge 
                className={getConditionColor(product.conditionStatus)}
                variant="outline"
              >
                {product.conditionStatus?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {hasImages && product.imageUrls.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={nextImage}
                        disabled={currentImageIndex === product.imageUrls.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 font-medium">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {hasImages && product.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.imageUrls.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="space-y-3">
                {product.serialNumber && (
                  <div className="flex items-center text-sm">
                    <Tag className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-600 w-24">Serial Number:</span>
                    <span className="font-medium">{product.serialNumber}</span>
                  </div>
                )}
                
                {product.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-600 w-24">Location:</span>
                    <span className="font-medium">{product.location}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="text-gray-600 w-24">Max Period:</span>
                  <span className="font-medium">{product.maxLendingPeriod} days</span>
                </div>

                {product.requiresApproval && (
                  <div className="flex items-center text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-3" />
                    <span>Requires approval before lending</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Dates</h3>
              <div className="space-y-3">
                {product.purchaseDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-600 w-24">Purchased:</span>
                    <span className="font-medium">{formatDate(product.purchaseDate)}</span>
                  </div>
                )}
                
                {product.warrantyExpiry && (
                  <div className="flex items-center text-sm">
                    <Shield className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-600 w-24">Warranty:</span>
                    <span className="font-medium">
                      {new Date(product.warrantyExpiry) > new Date() 
                        ? `Until ${formatDate(product.warrantyExpiry)}`
                        : 'Expired'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {hasSpecifications && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {Object.entries(specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => {
                  onEdit?.(product);
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Product
              </Button>
            )}
            
            {!isAdmin && product.isAvailable && (
              <Button
                onClick={() => {
                  onBorrow?.(product);
                  onClose();
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Borrow This Item
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;