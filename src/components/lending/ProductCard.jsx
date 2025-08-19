import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Tag, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Edit
} from 'lucide-react';

/**
 * ProductCard Component
 * Displays a product in a modern card layout with image, specifications, and actions
 */
const ProductCard = ({ 
  product, 
  onView, 
  onEdit, 
  onBorrow,
  showActions = true,
  isAdmin = false 
}) => {
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

  const getAvailabilityIcon = (isAvailable) => {
    return isAvailable ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const primaryImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:shadow-xl">
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-t-lg bg-gray-50">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-48 w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="h-48 w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                <Tag className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 font-medium">{product.name}</p>
            </div>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={product.isAvailable ? "default" : "destructive"}
            className="flex items-center gap-1 shadow-sm"
          >
            {getAvailabilityIcon(product.isAvailable)}
            {product.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>

        {/* Condition Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            className={`${getConditionColor(product.conditionStatus)} shadow-sm`}
            variant="outline"
          >
            {product.conditionStatus?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {product.name}
            </CardTitle>
            {product.brand && product.model && (
              <p className="text-sm text-gray-600 mt-1">
                {product.brand} • {product.model}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Key Specifications */}
        <div className="space-y-2 mb-4">
          {product.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span>{product.location}</span>
            </div>
          )}
          
          {product.serialNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <Tag className="h-4 w-4 mr-2 text-gray-400" />
              <span>SN: {product.serialNumber}</span>
            </div>
          )}

          {product.purchaseDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>Purchased: {formatDate(product.purchaseDate)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge 
                variant="secondary" 
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
              >
                +{product.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Lending Period */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Max lending period:</span>
          <span className="font-medium">{product.maxLendingPeriod} days</span>
        </div>

        {/* Requires Approval */}
        {product.requiresApproval && (
          <div className="flex items-center text-sm text-amber-600 mt-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Requires approval</span>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="pt-0 pb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(product)}
            className="flex-1 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
          
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(product)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          
          {!isAdmin && product.isAvailable && (
            <Button
              size="sm"
              onClick={() => onBorrow?.(product)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Borrow
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCard;