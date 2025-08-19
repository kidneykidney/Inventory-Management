import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

/**
 * LendingForm component for processing lending transactions
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {Function} props.onSubmit - Callback to submit the form
 * @param {string} props.title - Dialog title
 * @param {Object} props.item - Item being lent
 */
const LendingForm = ({
  isOpen = false,
  onClose,
  onSubmit,
  title = 'Lend Item',
  item = null,
}) => {
  const [formData, setFormData] = useState({
    borrowerName: '',
    borrowerEmail: '',
    purpose: '',
    quantity: 1,
    returnDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Calculate default return date based on lending policy
  useEffect(() => {
    if (item && item.lendingPolicy) {
      const returnDate = new Date();
      returnDate.setDate(
        returnDate.getDate() + item.lendingPolicy.maxLendingPeriod
      );
      setFormData(prev => ({
        ...prev,
        returnDate: returnDate.toISOString().split('T')[0],
        quantity: 1,
      }));
    }
  }, [item]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        borrowerName: '',
        borrowerEmail: '',
        purpose: '',
        quantity: 1,
        returnDate: '',
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.borrowerName.trim()) {
      newErrors.borrowerName = 'Borrower name is required';
    }

    if (!formData.borrowerEmail.trim()) {
      newErrors.borrowerEmail = 'Borrower email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.borrowerEmail)) {
      newErrors.borrowerEmail = 'Please enter a valid email address';
    }

    if (!formData.returnDate) {
      newErrors.returnDate = 'Return date is required';
    }

    // Quantity validation
    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    } else if (item && formData.quantity > item.available) {
      newErrors.quantity = 'Exceeds available quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit && onSubmit(formData);
    }
  };

  const isFormValid = () => {
    return (
      formData.borrowerName.trim() &&
      formData.borrowerEmail.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.borrowerEmail) &&
      formData.returnDate &&
      formData.quantity >= 1 &&
      (!item || formData.quantity <= item.available)
    );
  };

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Process lending for {item.name} (SKU: {item.sku})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4'>
            {/* Item Information */}
            <div className='bg-muted p-3 rounded-md'>
              <div className='text-sm font-medium'>{item.name}</div>
              <div className='text-sm text-muted-foreground'>
                Available Quantity: {item.available}
              </div>
            </div>

            {/* Borrower Name */}
            <div className='space-y-2'>
              <Label htmlFor='borrower-name'>Borrower Name *</Label>
              <Input
                id='borrower-name'
                type='text'
                value={formData.borrowerName}
                onChange={e =>
                  handleInputChange('borrowerName', e.target.value)
                }
                placeholder="Enter borrower's name"
                aria-label='Borrower Name'
                className={errors.borrowerName ? 'border-destructive' : ''}
              />
              {errors.borrowerName && (
                <div className='text-sm text-destructive'>
                  {errors.borrowerName}
                </div>
              )}
            </div>

            {/* Borrower Email */}
            <div className='space-y-2'>
              <Label htmlFor='borrower-email'>Borrower Email *</Label>
              <Input
                id='borrower-email'
                type='email'
                value={formData.borrowerEmail}
                onChange={e =>
                  handleInputChange('borrowerEmail', e.target.value)
                }
                placeholder="Enter borrower's email"
                aria-label='Borrower Email'
                className={errors.borrowerEmail ? 'border-destructive' : ''}
              />
              {errors.borrowerEmail && (
                <div className='text-sm text-destructive'>
                  {errors.borrowerEmail}
                </div>
              )}
            </div>

            {/* Quantity and Return Date */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='quantity'>Quantity</Label>
                <Input
                  id='quantity'
                  type='number'
                  min='1'
                  max={item.available}
                  value={formData.quantity}
                  onChange={e =>
                    handleInputChange('quantity', parseInt(e.target.value) || 1)
                  }
                  aria-label='Quantity'
                  className={errors.quantity ? 'border-destructive' : ''}
                />
                {errors.quantity && (
                  <div className='text-sm text-destructive'>
                    {errors.quantity}
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='return-date'>Return Date</Label>
                <Input
                  id='return-date'
                  type='date'
                  value={formData.returnDate}
                  onChange={e =>
                    handleInputChange('returnDate', e.target.value)
                  }
                  aria-label='Return Date'
                  className={errors.returnDate ? 'border-destructive' : ''}
                />
                {errors.returnDate && (
                  <div className='text-sm text-destructive'>
                    {errors.returnDate}
                  </div>
                )}
              </div>
            </div>

            {/* Purpose */}
            <div className='space-y-2'>
              <Label htmlFor='purpose'>Purpose</Label>
              <Textarea
                id='purpose'
                value={formData.purpose}
                onChange={e => handleInputChange('purpose', e.target.value)}
                placeholder='Reason for borrowing...'
                rows={3}
                aria-label='Purpose'
              />
            </div>

            {/* Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder='Additional notes...'
                rows={2}
                aria-label='Notes'
              />
            </div>
          </div>

          <DialogFooter className='mt-6'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!isFormValid()}
              aria-label='Process Lending'
            >
              <Send className='mr-2 h-4 w-4' />
              Process Lending
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LendingForm;
