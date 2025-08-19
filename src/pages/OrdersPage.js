import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { logger } from '../utils/logger';

// Mock data for orders
const mockOrdersData = [
  {
    id: 1,
    orderNumber: 'ORD-2023-001',
    supplier: 'Tech Solutions Ltd',
    status: 'pending',
    orderDate: '2023-07-10',
    expectedDate: '2023-07-20',
    receivedDate: null,
    totalAmount: 12500.0,
    items: [
      {
        id: 1,
        productName: 'Laptop',
        sku: 'SKU001',
        quantity: 5,
        unitPrice: 1500.0,
        totalPrice: 7500.0,
      },
      {
        id: 2,
        productName: 'Wireless Mouse',
        sku: 'SKU006',
        quantity: 10,
        unitPrice: 50.0,
        totalPrice: 500.0,
      },
      {
        id: 3,
        productName: 'Monitor',
        sku: 'SKU010',
        quantity: 3,
        unitPrice: 1500.0,
        totalPrice: 4500.0,
      },
    ],
  },
  {
    id: 2,
    orderNumber: 'ORD-2023-002',
    supplier: 'Office Furnishings Inc',
    status: 'ordered',
    orderDate: '2023-07-15',
    expectedDate: '2023-07-30',
    receivedDate: null,
    totalAmount: 8000.0,
    items: [
      {
        id: 1,
        productName: 'Office Chair',
        sku: 'SKU002',
        quantity: 10,
        unitPrice: 200.0,
        totalPrice: 2000.0,
      },
      {
        id: 2,
        productName: 'Desk',
        sku: 'SKU005',
        quantity: 5,
        unitPrice: 1000.0,
        totalPrice: 5000.0,
      },
      {
        id: 3,
        productName: 'File Cabinet',
        sku: 'SKU008',
        quantity: 3,
        unitPrice: 333.33,
        totalPrice: 1000.0,
      },
    ],
  },
  {
    id: 3,
    orderNumber: 'ORD-2023-003',
    supplier: 'Office Supplies Co',
    status: 'received',
    orderDate: '2023-06-20',
    expectedDate: '2023-07-05',
    receivedDate: '2023-07-03',
    totalAmount: 1500.0,
    items: [
      {
        id: 1,
        productName: 'Printer Ink',
        sku: 'SKU003',
        quantity: 20,
        unitPrice: 30.0,
        totalPrice: 600.0,
      },
      {
        id: 2,
        productName: 'Notebook',
        sku: 'SKU009',
        quantity: 50,
        unitPrice: 10.0,
        totalPrice: 500.0,
      },
      {
        id: 3,
        productName: 'Pens (Box)',
        sku: 'SKU011',
        quantity: 20,
        unitPrice: 20.0,
        totalPrice: 400.0,
      },
    ],
  },
  {
    id: 4,
    orderNumber: 'ORD-2023-004',
    supplier: 'Tech Solutions Ltd',
    status: 'cancelled',
    orderDate: '2023-06-25',
    expectedDate: '2023-07-10',
    receivedDate: null,
    totalAmount: 3500.0,
    items: [
      {
        id: 1,
        productName: 'Smartphone',
        sku: 'SKU004',
        quantity: 5,
        unitPrice: 700.0,
        totalPrice: 3500.0,
      },
    ],
  },
  {
    id: 5,
    orderNumber: 'ORD-2023-005',
    supplier: 'Office Supplies Co',
    status: 'pending',
    orderDate: '2023-07-18',
    expectedDate: '2023-08-01',
    receivedDate: null,
    totalAmount: 900.0,
    items: [
      {
        id: 1,
        productName: 'Printer Paper (Reams)',
        sku: 'SKU012',
        quantity: 30,
        unitPrice: 10.0,
        totalPrice: 300.0,
      },
      {
        id: 2,
        productName: 'Stapler',
        sku: 'SKU013',
        quantity: 10,
        unitPrice: 15.0,
        totalPrice: 150.0,
      },
      {
        id: 3,
        productName: 'Tape Dispenser',
        sku: 'SKU014',
        quantity: 15,
        unitPrice: 10.0,
        totalPrice: 150.0,
      },
      {
        id: 4,
        productName: 'Scissors',
        sku: 'SKU015',
        quantity: 20,
        unitPrice: 15.0,
        totalPrice: 300.0,
      },
    ],
  },
];

// Mock suppliers
const suppliers = [
  { id: 1, name: 'Tech Solutions Ltd' },
  { id: 2, name: 'Office Furnishings Inc' },
  { id: 3, name: 'Office Supplies Co' },
];

// Mock products
const products = [
  { id: 1, name: 'Laptop', sku: 'SKU001', price: 1500.0 },
  { id: 2, name: 'Office Chair', sku: 'SKU002', price: 200.0 },
  { id: 3, name: 'Printer Ink', sku: 'SKU003', price: 30.0 },
  { id: 4, name: 'Smartphone', sku: 'SKU004', price: 700.0 },
  { id: 5, name: 'Desk', sku: 'SKU005', price: 1000.0 },
  { id: 6, name: 'Wireless Mouse', sku: 'SKU006', price: 50.0 },
  { id: 7, name: 'Headphones', sku: 'SKU007', price: 100.0 },
  { id: 8, name: 'File Cabinet', sku: 'SKU008', price: 333.33 },
  { id: 9, name: 'Notebook', sku: 'SKU009', price: 10.0 },
  { id: 10, name: 'Monitor', sku: 'SKU010', price: 1500.0 },
];

/**
 * OrdersPage component
 * Manages purchase orders from suppliers
 * @returns {JSX.Element} OrdersPage component
 */
const OrdersPage = () => {
  // Orders state
  const [orders, setOrders] = useState([...mockOrdersData]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New order state
  const [orderForm, setOrderForm] = useState({
    supplier: '',
    expectedDate: '',
    notes: '',
    items: [{ product: '', quantity: 1, unitPrice: 0 }],
  });

  // Order creation stepper
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Supplier', 'Add Items', 'Review Order'];

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  /**
   * Log component mount
   */
  useEffect(() => {
    logger.info('OrdersPage mounted');

    return () => {
      logger.info('OrdersPage unmounted');
    };
  }, []);

  /**
   * Handle page change
   * @param {Event} event - Page change event
   * @param {number} newPage - New page number
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Handle rows per page change
   * @param {Event} event - Rows per page change event
   */
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Filter orders based on search term and status
   */
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  /**
   * Get status color for display
   * @param {string} status - Order status
   * @returns {string} Color name for the chip
   */
  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'ordered':
        return 'info';
      case 'received':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Format status text for display
   * @param {string} status - Order status
   * @returns {string} Formatted status text
   */
  const formatStatus = status => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /**
   * Open order creation dialog
   */
  const handleOpenDialog = () => {
    logger.debug('Opening order creation dialog');
    setOrderForm({
      supplier: '',
      expectedDate: '',
      notes: '',
      items: [{ product: '', quantity: 1, unitPrice: 0 }],
    });
    setActiveStep(0);
    setDialogOpen(true);
  };

  /**
   * Open order details dialog
   * @param {Object} order - Order to view
   */
  const handleOpenViewDialog = order => {
    logger.debug('Opening order details dialog', {
      orderNumber: order.orderNumber,
    });
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  /**
   * Close all dialogs
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setViewDialogOpen(false);
    setSelectedOrder(null);
  };

  /**
   * Handle supplier selection change
   * @param {Event} e - Change event
   */
  const handleSupplierChange = e => {
    setOrderForm({
      ...orderForm,
      supplier: e.target.value,
    });
  };

  /**
   * Handle expected date change
   * @param {Event} e - Change event
   */
  const handleDateChange = e => {
    setOrderForm({
      ...orderForm,
      expectedDate: e.target.value,
    });
  };

  /**
   * Handle notes change
   * @param {Event} e - Change event
   */
  const handleNotesChange = e => {
    setOrderForm({
      ...orderForm,
      notes: e.target.value,
    });
  };

  /**
   * Add new item row to order
   */
  const handleAddItemRow = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { product: '', quantity: 1, unitPrice: 0 }],
    });
  };

  /**
   * Remove item row from order
   * @param {number} index - Index of item to remove
   */
  const handleRemoveItemRow = index => {
    const updatedItems = [...orderForm.items];
    updatedItems.splice(index, 1);
    setOrderForm({
      ...orderForm,
      items: updatedItems,
    });
  };

  /**
   * Handle item field change
   * @param {number} index - Index of item to update
   * @param {string} field - Field to update
   * @param {any} value - New value
   */
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // If product changed, update unit price
    if (field === 'product') {
      const selectedProduct = products.find(p => p.name === value);
      if (selectedProduct) {
        updatedItems[index].unitPrice = selectedProduct.price;
      }
    }

    setOrderForm({
      ...orderForm,
      items: updatedItems,
    });
  };

  /**
   * Calculate total order amount
   * @returns {number} Total order amount
   */
  const calculateOrderTotal = () => {
    return orderForm.items.reduce((total, item) => {
      const product = products.find(p => p.name === item.product);
      const price = product ? product.price : item.unitPrice;
      return total + price * item.quantity;
    }, 0);
  };

  /**
   * Go to next step in order creation
   */
  const handleNextStep = () => {
    setActiveStep(activeStep + 1);
  };

  /**
   * Go to previous step in order creation
   */
  const handleBackStep = () => {
    setActiveStep(activeStep - 1);
  };

  /**
   * Create new order
   */
  const handleCreateOrder = () => {
    // Validate required fields
    if (
      !orderForm.supplier ||
      !orderForm.expectedDate ||
      orderForm.items.some(item => !item.product || item.quantity < 1)
    ) {
      setAlert({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error',
      });
      return;
    }

    // Create new order
    const newOrder = {
      id: Math.max(...orders.map(o => o.id)) + 1,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      supplier: orderForm.supplier,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: orderForm.expectedDate,
      receivedDate: null,
      totalAmount: calculateOrderTotal(),
      items: orderForm.items.map((item, index) => {
        const product = products.find(p => p.name === item.product);
        return {
          id: index + 1,
          productName: item.product,
          sku: product ? product.sku : '',
          quantity: item.quantity,
          unitPrice: product ? product.price : item.unitPrice,
          totalPrice:
            (product ? product.price : item.unitPrice) * item.quantity,
        };
      }),
    };

    // Add to orders
    setOrders([newOrder, ...orders]);

    // Close dialog
    handleCloseDialog();

    // Show success message
    setAlert({
      open: true,
      message: `Order ${newOrder.orderNumber} created successfully`,
      severity: 'success',
    });

    logger.info('New order created', { orderNumber: newOrder.orderNumber });
  };

  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {string} status - New status
   */
  const handleUpdateStatus = (id, status) => {
    const updatedOrders = orders.map(order => {
      if (order.id === id) {
        const updatedOrder = {
          ...order,
          status,
          receivedDate:
            status === 'received'
              ? new Date().toISOString().split('T')[0]
              : order.receivedDate,
        };
        logger.info('Order status updated', {
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus: status,
        });
        return updatedOrder;
      }
      return order;
    });

    setOrders(updatedOrders);

    // Close dialog if open
    if (viewDialogOpen) {
      handleCloseDialog();
    }

    // Show success message
    setAlert({
      open: true,
      message: `Order status updated to ${formatStatus(status)}`,
      severity: 'success',
    });
  };

  /**
   * Delete order
   * @param {number} id - Order ID
   */
  const handleDeleteOrder = id => {
    const orderToDelete = orders.find(order => order.id === id);

    if (orderToDelete) {
      // Remove from orders
      const updatedOrders = orders.filter(order => order.id !== id);
      setOrders(updatedOrders);

      logger.info('Order deleted', { orderNumber: orderToDelete.orderNumber });

      // Show success message
      setAlert({
        open: true,
        message: `Order ${orderToDelete.orderNumber} deleted`,
        severity: 'success',
      });
    }
  };

  /**
   * Close alert
   */
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Purchase Orders
      </Typography>

      {/* Action Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder='Search orders...'
            size='small'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel id='status-filter-label'>Status</InputLabel>
            <Select
              labelId='status-filter-label'
              id='status-filter'
              value={filterStatus}
              label='Status'
              onChange={e => setFilterStatus(e.target.value)}
              startAdornment={
                <InputAdornment position='start'>
                  <FilterListIcon fontSize='small' />
                </InputAdornment>
              }
            >
              <MenuItem value=''>All Statuses</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='ordered'>Ordered</MenuItem>
              <MenuItem value='received'>Received</MenuItem>
              <MenuItem value='cancelled'>Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Button
          variant='contained'
          color='primary'
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Order
        </Button>
      </Box>

      {/* Orders Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                <TableCell>Order Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Expected Date</TableCell>
                <TableCell align='right'>Total (₹)</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(order => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(order.status)}
                        color={getStatusColor(order.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>{order.expectedDate}</TableCell>
                    <TableCell align='right'>
                      {order.totalAmount.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title='View Details'>
                          <IconButton
                            size='small'
                            onClick={() => handleOpenViewDialog(order)}
                          >
                            <VisibilityIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        {order.status === 'pending' && (
                          <Tooltip title='Mark as Ordered'>
                            <IconButton
                              size='small'
                              color='info'
                              onClick={() =>
                                handleUpdateStatus(order.id, 'ordered')
                              }
                            >
                              <ReceiptIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}

                        {order.status === 'ordered' && (
                          <Tooltip title='Mark as Received'>
                            <IconButton
                              size='small'
                              color='success'
                              onClick={() =>
                                handleUpdateStatus(order.id, 'received')
                              }
                            >
                              <ReceiptIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}

                        {(order.status === 'pending' ||
                          order.status === 'ordered') && (
                          <Tooltip title='Cancel Order'>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() =>
                                handleUpdateStatus(order.id, 'cancelled')
                              }
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create Order Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant='h6'>Create New Order</Typography>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{ width: '70%' }}
            >
              {steps.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id='supplier-label'>Supplier</InputLabel>
                  <Select
                    labelId='supplier-label'
                    id='supplier'
                    value={orderForm.supplier}
                    label='Supplier'
                    onChange={handleSupplierChange}
                  >
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Expected Delivery Date'
                  type='date'
                  fullWidth
                  required
                  value={orderForm.expectedDate}
                  onChange={handleDateChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Notes'
                  multiline
                  rows={3}
                  fullWidth
                  value={orderForm.notes}
                  onChange={handleNotesChange}
                  placeholder='Additional information for the supplier'
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <>
              {orderForm.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth required>
                      <InputLabel id={`product-label-${index}`}>
                        Product
                      </InputLabel>
                      <Select
                        labelId={`product-label-${index}`}
                        id={`product-${index}`}
                        value={item.product}
                        label='Product'
                        onChange={e =>
                          handleItemChange(index, 'product', e.target.value)
                        }
                      >
                        {products.map(product => (
                          <MenuItem key={product.id} value={product.name}>
                            {product.name} ({product.sku})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label='Quantity'
                      type='number'
                      fullWidth
                      required
                      value={item.quantity}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'quantity',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label='Unit Price (₹)'
                      type='number'
                      fullWidth
                      required
                      value={item.unitPrice}
                      disabled={!!item.product}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'unitPrice',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={2}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant='body2' sx={{ mr: 1 }}>
                        Total: ₹
                        {(
                          (item.product
                            ? products.find(p => p.name === item.product)
                                ?.price || 0
                            : item.unitPrice) * item.quantity
                        ).toFixed(2)}
                      </Typography>
                      {orderForm.items.length > 1 && (
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleRemoveItemRow(index)}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              ))}

              <Button
                variant='outlined'
                startIcon={<AddIcon />}
                onClick={handleAddItemRow}
                sx={{ mt: 2 }}
              >
                Add Item
              </Button>
            </>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Order Summary
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant='body2' color='text.secondary'>
                    Supplier
                  </Typography>
                  <Typography variant='body1'>{orderForm.supplier}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant='body2' color='text.secondary'>
                    Order Date
                  </Typography>
                  <Typography variant='body1'>
                    {new Date().toISOString().split('T')[0]}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant='body2' color='text.secondary'>
                    Expected Date
                  </Typography>
                  <Typography variant='body1'>
                    {orderForm.expectedDate}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant='subtitle1' gutterBottom>
                Items
              </Typography>

              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ mb: 3 }}
              >
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align='right'>Quantity</TableCell>
                      <TableCell align='right'>Unit Price (₹)</TableCell>
                      <TableCell align='right'>Total (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderForm.items.map((item, index) => {
                      const product = products.find(
                        p => p.name === item.product
                      );
                      const unitPrice = product
                        ? product.price
                        : item.unitPrice;
                      const totalPrice = unitPrice * item.quantity;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {item.product} {product ? `(${product.sku})` : ''}
                          </TableCell>
                          <TableCell align='right'>{item.quantity}</TableCell>
                          <TableCell align='right'>
                            ₹{unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell align='right'>
                            ₹{totalPrice.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align='right'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Total
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                        ₹{calculateOrderTotal().toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {orderForm.notes && (
                <Box>
                  <Typography variant='subtitle1' gutterBottom>
                    Notes
                  </Typography>
                  <Paper variant='outlined' sx={{ p: 2 }}>
                    <Typography variant='body2'>{orderForm.notes}</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>

          {activeStep > 0 && <Button onClick={handleBackStep}>Back</Button>}

          {activeStep < steps.length - 1 ? (
            <Button
              variant='contained'
              onClick={handleNextStep}
              disabled={
                (activeStep === 0 &&
                  (!orderForm.supplier || !orderForm.expectedDate)) ||
                (activeStep === 1 &&
                  orderForm.items.some(
                    item => !item.product || item.quantity < 1
                  ))
              }
            >
              Next
            </Button>
          ) : (
            <Button
              variant='contained'
              color='primary'
              onClick={handleCreateOrder}
            >
              Create Order
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      {selectedOrder && (
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseDialog}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant='h6'>
                Order Details: {selectedOrder.orderNumber}
              </Typography>
              <Chip
                label={formatStatus(selectedOrder.status)}
                color={getStatusColor(selectedOrder.status)}
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Typography variant='body2' color='text.secondary'>
                  Supplier
                </Typography>
                <Typography variant='body1'>
                  {selectedOrder.supplier}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant='body2' color='text.secondary'>
                  Order Date
                </Typography>
                <Typography variant='body1'>
                  {selectedOrder.orderDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant='body2' color='text.secondary'>
                  Expected Date
                </Typography>
                <Typography variant='body1'>
                  {selectedOrder.expectedDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant='body2' color='text.secondary'>
                  Received Date
                </Typography>
                <Typography variant='body1'>
                  {selectedOrder.receivedDate || 'Not received yet'}
                </Typography>
              </Grid>
            </Grid>

            <Typography variant='subtitle1' gutterBottom>
              Items
            </Typography>

            <TableContainer component={Paper} variant='outlined' sx={{ mb: 3 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align='right'>Quantity</TableCell>
                    <TableCell align='right'>Unit Price (₹)</TableCell>
                    <TableCell align='right'>Total (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell align='right'>{item.quantity}</TableCell>
                      <TableCell align='right'>
                        ₹{item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell align='right'>
                        ₹{item.totalPrice.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align='right'
                      sx={{ fontWeight: 'bold' }}
                    >
                      Total
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                      ₹{selectedOrder.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>

            {selectedOrder.status === 'pending' && (
              <>
                <Button
                  variant='contained'
                  color='info'
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'ordered')
                  }
                >
                  Mark as Ordered
                </Button>
                <Button
                  variant='outlined'
                  color='error'
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'cancelled')
                  }
                >
                  Cancel Order
                </Button>
              </>
            )}

            {selectedOrder.status === 'ordered' && (
              <>
                <Button
                  variant='contained'
                  color='success'
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'received')
                  }
                >
                  Mark as Received
                </Button>
                <Button
                  variant='outlined'
                  color='error'
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'cancelled')
                  }
                >
                  Cancel Order
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Alert message */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant='filled'
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrdersPage;
