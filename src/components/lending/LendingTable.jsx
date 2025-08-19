import React from 'react';
import { Edit, Package, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

/**
 * LendingTable component for displaying lending items in a table format
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of lending items
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Function} props.onLend - Callback for lend action
 * @param {Function} props.onDelete - Callback for delete action
 * @param {boolean} props.loading - Loading state
 */
const LendingTable = ({ items = [], onEdit, onLend, onDelete, loading = false }) => {
  // Get status variant based on availability
  const getStatusVariant = (item) => {
    if (!item.isAvailable) return 'destructive';
    if (item.available <= 2) return 'secondary';
    return 'default';
  };

  // Get status text
  const getStatusText = (item) => {
    if (!item.isAvailable) return 'Unavailable';
    if (item.available <= 2) return 'Low Stock';
    return 'Available';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No items found</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Details</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.brand && item.model ? `${item.brand} ${item.model} • ` : ''}
                  {item.sku}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div>{item.category}</div>
                {item.subcategory && (
                  <div className="text-sm text-muted-foreground">{item.subcategory}</div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div>{item.available} / {item.quantity}</div>
                <div className="text-sm text-muted-foreground">available</div>
              </div>
            </TableCell>
            <TableCell>{item.location}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(item)}>
                {getStatusText(item)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit && onEdit(item)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLend && onLend(item)}
                  disabled={!item.isAvailable}
                  aria-label="Lend"
                >
                  <Package className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete && onDelete(item.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default LendingTable;