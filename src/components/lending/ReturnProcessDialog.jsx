import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';

const ReturnProcessDialog = ({
  isOpen,
  onClose,
  transaction,
  onReturnSuccess,
}) => {
  const [conditionReturned, setConditionReturned] = useState('good');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const conditionOptions = [
    {
      value: 'excellent',
      label: 'Excellent',
      description: 'Like new condition',
      color: 'bg-green-100 text-green-800',
    },
    {
      value: 'good',
      label: 'Good',
      description: 'Minor wear, fully functional',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      value: 'fair',
      label: 'Fair',
      description: 'Noticeable wear but functional',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 'damaged',
      label: 'Damaged',
      description: 'Requires repair or replacement',
      color: 'bg-red-100 text-red-800',
    },
  ];

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/v1/lending-transactions/${transaction.id}/return`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            conditionReturned,
            notes: notes.trim(),
            returnDate: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Item Returned Successfully',
          description: `${transaction.productName || transaction.product_name} has been returned`,
        });
        onReturnSuccess();
        onClose();
        resetForm();
      } else {
        toast({
          title: 'Return Failed',
          description: data.message || 'Failed to process return',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing return:', error);
      toast({
        title: 'Return Failed',
        description: 'An error occurred while processing the return',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setConditionReturned('good');
    setNotes('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!transaction) return null;

  const getDaysOverdue = () => {
    const today = new Date();
    const dueDate = new Date(transaction.dueDate);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isOverdue = transaction.status === 'overdue' || getDaysOverdue() > 0;
  const daysOverdue = getDaysOverdue();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Return Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Item Information */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-semibold text-lg mb-2'>
              {transaction.productName || transaction.product_name}
            </h3>
            <div className='text-sm text-gray-600 space-y-1'>
              <p>
                <strong>Brand:</strong>{' '}
                {transaction.productBrand || transaction.brand}
              </p>
              {transaction.productModel && (
                <p>
                  <strong>Model:</strong> {transaction.productModel}
                </p>
              )}
              <p>
                <strong>Borrowed:</strong>{' '}
                {new Date(transaction.lendDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Due Date:</strong>{' '}
                {new Date(transaction.dueDate).toLocaleDateString()}
              </p>
            </div>

            {isOverdue && (
              <div className='mt-3 flex items-center gap-2 text-red-600'>
                <AlertTriangle className='w-4 h-4' />
                <span className='text-sm font-medium'>
                  This item is {daysOverdue} day(s) overdue
                </span>
              </div>
            )}
          </div>

          {/* Condition Selection */}
          <div className='space-y-3'>
            <Label className='text-base font-medium'>
              Item Condition Upon Return
            </Label>
            <div className='grid grid-cols-1 gap-2'>
              {conditionOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    conditionReturned === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type='radio'
                    name='condition'
                    value={option.value}
                    checked={conditionReturned === option.value}
                    onChange={e => setConditionReturned(e.target.value)}
                    className='sr-only'
                  />
                  <div className='flex items-center justify-between w-full'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{option.label}</span>
                        <Badge className={option.color}>{option.label}</Badge>
                      </div>
                      <p className='text-sm text-gray-600 mt-1'>
                        {option.description}
                      </p>
                    </div>
                    {conditionReturned === option.value && (
                      <CheckCircle className='w-5 h-5 text-blue-500' />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className='space-y-2'>
            <Label htmlFor='notes' className='text-base font-medium'>
              Additional Notes (Optional)
            </Label>
            <Textarea
              id='notes'
              placeholder='Any additional comments about the item condition, issues encountered, or feedback...'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className='resize-none'
            />
          </div>

          {/* Damage Warning */}
          {conditionReturned === 'damaged' && (
            <div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='w-5 h-5 text-red-600 mt-0.5' />
                <div>
                  <h4 className='font-medium text-red-800'>Damage Reported</h4>
                  <p className='text-sm text-red-700 mt-1'>
                    Please provide detailed notes about the damage. An
                    administrator will review the item and may contact you for
                    additional information.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='min-w-[100px]'
            >
              {isSubmitting ? 'Processing...' : 'Return Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnProcessDialog;
