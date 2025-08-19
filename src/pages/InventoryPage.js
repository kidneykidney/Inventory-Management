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
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SendIcon from '@mui/icons-material/Send';
import { logger } from '../utils/logger';

// Mock data for inventory items
const initialInventoryData = [
  {
    id: 1,
    sku: 'SKU001',
    name: 'Laptop',
    category: 'Electronics',
    quantity: 25,
    location: 'Warehouse A',
    status: 'In Stock',
  },
  {
    id: 2,
    sku: 'SKU002',
    name: 'Office Chair',
    category: 'Furniture',
    quantity: 15,
    location: 'Warehouse B',
    status: 'In Stock',
  },
  {
    id: 3,
    sku: 'SKU003',
    name: 'Printer Ink',
    category: 'Office Supplies',
    quantity: 5,
    location: 'Warehouse A',
    status: 'Low Stock',
  },
  {
    id: 4,
    sku: 'SKU004',
    name: 'Smartphone',
    category: 'Electronics',
    quantity: 30,
    location: 'Warehouse C',
    status: 'In Stock',
  },
  {
    id: 5,
    sku: 'SKU005',
    name: 'Desk',
    category: 'Furniture',
    quantity: 0,
    location: 'Warehouse B',
    status: 'Out of Stock',
  },
  {
    id: 6,
    sku: 'SKU006',
    name: 'Wireless Mouse',
    category: 'Electronics',
    quantity: 45,
    location: 'Warehouse A',
    status: 'In Stock',
  },
  {
    id: 7,
    sku: 'SKU007',
    name: 'Headphones',
    category: 'Electronics',
    quantity: 7,
    location: 'Warehouse C',
    status: 'Low Stock',
  },
  {
    id: 8,
    sku: 'SKU008',
    name: 'File Cabinet',
    category: 'Furniture',
    quantity: 12,
    location: 'Warehouse B',
    status: 'In Stock',
  },
  {
    id: 9,
    sku: 'SKU009',
    name: 'Notebook',
    category: 'Office Supplies',
    quantity: 0,
    location: 'Warehouse A',
    status: 'Out of Stock',
  },
  {
    id: 10,
    sku: 'SKU010',
    name: 'Monitor',
    category: 'Electronics',
    quantity: 18,
    location: 'Warehouse C',
    status: 'In Stock',
  },
];

/**
 * InventoryPage component for inventory management
 * Allows viewing, adding, editing, and lending/giving items
 * @returns {JSX.Element} InventoryPage component
 */
const InventoryPage = () => {
  // State for inventory items
  const [inventoryData, setInventoryData] = useState([...initialInventoryData]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add', 'edit', 'lend', 'give'
  const [currentItem, setCurrentItem] = useState(null);

  // New item form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    location: '',
    notes: '',
  });

  // Transaction state (for lending/giving)
  const [transaction, setTransaction] = useState({
    quantity: 1,
    recipient: '',
    purpose: '',
    returnDate: '', // Only for lending
  });

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  /**
   * Log component mount and initial data
   */
  useEffect(() => {
    logger.info('InventoryPage component mounted');
    logger.debug('Initial inventory data loaded', {
      count: inventoryData.length,
    });

    // In a real app, would fetch inventory data from API
    // Example: fetchInventoryItems()

    return () => {
      logger.info('InventoryPage component unmounted');
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
   * Filter data based on search term and category
   */
  const filteredData = inventoryData.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === '' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  /**
   * Get status color for display
   * @param {string} status - Item status
   * @returns {string} Color name for the chip
   */
  const getStatusColor = status => {
    switch (status) {
      case 'In Stock':
        return 'success';
      case 'Low Stock':
        return 'warning';
      case 'Out of Stock':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Open dialog for add/edit/lend/give actions
   * @param {string} type - Dialog type
   * @param {Object} item - Item to edit (null for add)
   */
  const handleOpenDialog = (type, item = null) => {
    logger.debug(`Opening ${type} dialog`, item);

    setDialogType(type);
    setCurrentItem(item);

    if (type === 'add') {
      // Reset form for new item
      setFormData({
        sku: '',
        name: '',
        category: '',
        quantity: 0,
        location: '',
        notes: '',
      });
    } else if (type === 'edit' && item) {
      // Load item data for editing
      setFormData({
        sku: item.sku,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        location: item.location,
        notes: '',
      });
    } else if ((type === 'lend' || type === 'give') && item) {
      // Reset transaction form
      setTransaction({
        quantity: 1,
        recipient: '',
        purpose: '',
        returnDate: type === 'lend' ? getDefaultReturnDate() : '',
      });
    }

    setOpenDialog(true);
  };

  /**
   * Get default return date (7 days from now)
   * @returns {string} Date string in YYYY-MM-DD format
   */
  const getDefaultReturnDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  /**
   * Close dialog
   */
  const handleCloseDialog = () => {
    logger.debug('Closing dialog');
    setOpenDialog(false);
    setCurrentItem(null);
  };

  /**
   * Handle form field change
   * @param {Event} e - Input change event
   */
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value,
    });
  };

  /**
   * Handle transaction field change
   * @param {Event} e - Input change event
   */
  const handleTransactionChange = e => {
    const { name, value } = e.target;
    setTransaction({
      ...transaction,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value,
    });
  };

  /**
   * Save new or edited item
   */
  const handleSaveItem = () => {
    // Validate form
    if (
      !formData.sku ||
      !formData.name ||
      !formData.category ||
      formData.quantity < 0
    ) {
      setAlert({
        open: true,
        message: 'Please fill in all required fields with valid values',
        severity: 'error',
      });
      return;
    }

    if (dialogType === 'add') {
      // Add new item
      const newItem = {
        id: Math.max(...inventoryData.map(item => item.id), 0) + 1,
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        location: formData.location,
        status: getItemStatus(formData.quantity),
      };

      logger.info('Adding new inventory item', newItem);
      setInventoryData([...inventoryData, newItem]);

      setAlert({
        open: true,
        message: 'Item added successfully',
        severity: 'success',
      });
    } else if (dialogType === 'edit' && currentItem) {
      // Update existing item
      const updatedData = inventoryData.map(item => {
        if (item.id === currentItem.id) {
          const updatedItem = {
            ...item,
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            quantity: formData.quantity,
            location: formData.location,
            status: getItemStatus(formData.quantity),
          };
          logger.info('Updating inventory item', {
            before: item,
            after: updatedItem,
          });
          return updatedItem;
        }
        return item;
      });

      setInventoryData(updatedData);

      setAlert({
        open: true,
        message: 'Item updated successfully',
        severity: 'success',
      });
    }

    handleCloseDialog();
  };

  /**
   * Process lending or giving items
   */
  const handleProcessTransaction = () => {
    // Validate transaction
    if (!transaction.recipient || transaction.quantity <= 0) {
      setAlert({
        open: true,
        message: 'Please enter valid recipient and quantity',
        severity: 'error',
      });
      return;
    }

    if (currentItem && transaction.quantity > currentItem.quantity) {
      setAlert({
        open: true,
        message: `Cannot ${dialogType} more than available quantity`,
        severity: 'error',
      });
      return;
    }

    if (dialogType === 'lend' && !transaction.returnDate) {
      setAlert({
        open: true,
        message: 'Please provide a return date',
        severity: 'error',
      });
      return;
    }

    try {
      // Update item quantity
      const updatedData = inventoryData.map(item => {
        if (item.id === currentItem.id) {
          const newQuantity = item.quantity - transaction.quantity;
          const updatedItem = {
            ...item,
            quantity: newQuantity,
            status: getItemStatus(newQuantity),
          };

          logger.info(`Item ${dialogType === 'lend' ? 'lent' : 'given'}`, {
            item: item.name,
            quantity: transaction.quantity,
            recipient: transaction.recipient,
            purpose: transaction.purpose,
          });

          return updatedItem;
        }
        return item;
      });

      setInventoryData(updatedData);

      setAlert({
        open: true,
        message: `${transaction.quantity} ${currentItem.name}(s) ${dialogType === 'lend' ? 'lent to' : 'given to'} ${transaction.recipient} successfully`,
        severity: 'success',
      });

      handleCloseDialog();
    } catch (error) {
      logger.error('Error processing transaction', error);
      setAlert({
        open: true,
        message: 'An error occurred while processing the transaction',
        severity: 'error',
      });
    }
  };

  /**
   * Delete an inventory item
   * @param {number} id - Item ID to delete
   */
  const handleDeleteItem = id => {
    logger.info('Deleting inventory item', { id });

    const updatedData = inventoryData.filter(item => item.id !== id);
    setInventoryData(updatedData);

    setAlert({
      open: true,
      message: 'Item deleted successfully',
      severity: 'success',
    });
  };

  /**
   * Get status based on quantity
   * @param {number} quantity - Item quantity
   * @returns {string} Status string
   */
  const getItemStatus = quantity => {
    if (quantity <= 0) {
      return 'Out of Stock';
    }
    if (quantity <= 5) {
      return 'Low Stock';
    }
    return 'In Stock';
  };

  /**
   * Close alert message
   */
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  /**
   * Get unique categories for filter
   */
  const categories = [...new Set(inventoryData.map(item => item.category))];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Inventory Management
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
            placeholder='Search inventory...'
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
            <InputLabel id='category-filter-label'>Category</InputLabel>
            <Select
              labelId='category-filter-label'
              id='category-filter'
              value={filterCategory}
              label='Category'
              onChange={e => setFilterCategory(e.target.value)}
              startAdornment={
                <InputAdornment position='start'>
                  <FilterListIcon fontSize='small' />
                </InputAdornment>
              }
            >
              <MenuItem value=''>All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant='contained'
          color='primary'
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add Item
        </Button>
      </Box>

      {/* Inventory Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                <TableCell>SKU</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align='right'>Quantity</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell align='right'>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title='Edit'>
                          <IconButton
                            size='small'
                            onClick={() => handleOpenDialog('edit', item)}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Lend'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleOpenDialog('lend', item)}
                            disabled={item.quantity <= 0}
                          >
                            <HandshakeIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Give'>
                          <IconButton
                            size='small'
                            color='secondary'
                            onClick={() => handleOpenDialog('give', item)}
                            disabled={item.quantity <= 0}
                          >
                            <SendIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Delete'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No inventory items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      {(dialogType === 'add' || dialogType === 'edit') && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>
            {dialogType === 'add'
              ? 'Add Inventory Item'
              : 'Edit Inventory Item'}
          </DialogTitle>
          <DialogContent dividers>
            <Box
              component='form'
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label='SKU'
                name='sku'
                fullWidth
                value={formData.sku}
                onChange={handleFormChange}
                required
              />
              <TextField
                label='Name'
                name='name'
                fullWidth
                value={formData.name}
                onChange={handleFormChange}
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  label='Category'
                  name='category'
                  value={formData.category}
                  onChange={handleFormChange}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                  <MenuItem value='Electronics'>Electronics</MenuItem>
                  <MenuItem value='Furniture'>Furniture</MenuItem>
                  <MenuItem value='Office Supplies'>Office Supplies</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label='Quantity'
                name='quantity'
                type='number'
                fullWidth
                value={formData.quantity}
                onChange={handleFormChange}
                required
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  label='Location'
                  name='location'
                  value={formData.location}
                  onChange={handleFormChange}
                >
                  <MenuItem value='Warehouse A'>Warehouse A</MenuItem>
                  <MenuItem value='Warehouse B'>Warehouse B</MenuItem>
                  <MenuItem value='Warehouse C'>Warehouse C</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label='Notes'
                name='notes'
                multiline
                rows={3}
                fullWidth
                value={formData.notes}
                onChange={handleFormChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant='contained'
              color='primary'
              onClick={handleSaveItem}
            >
              {dialogType === 'add' ? 'Add' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Lend/Give Dialog */}
      {(dialogType === 'lend' || dialogType === 'give') && currentItem && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>
            {dialogType === 'lend' ? 'Lend Item' : 'Give Item'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' gutterBottom>
                {currentItem.name} (SKU: {currentItem.sku})
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Available Quantity: {currentItem.quantity}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Quantity'
                  name='quantity'
                  type='number'
                  fullWidth
                  value={transaction.quantity}
                  onChange={handleTransactionChange}
                  required
                  InputProps={{
                    inputProps: { min: 1, max: currentItem.quantity },
                  }}
                  error={transaction.quantity > currentItem.quantity}
                  helperText={
                    transaction.quantity > currentItem.quantity
                      ? 'Exceeds available quantity'
                      : ''
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label='Recipient'
                  name='recipient'
                  fullWidth
                  value={transaction.recipient}
                  onChange={handleTransactionChange}
                  required
                  placeholder='Employee/Department name'
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label='Purpose'
                  name='purpose'
                  fullWidth
                  value={transaction.purpose}
                  onChange={handleTransactionChange}
                  placeholder='Reason for lending/giving'
                />
              </Grid>

              {dialogType === 'lend' && (
                <Grid item xs={12}>
                  <TextField
                    label='Return Date'
                    name='returnDate'
                    type='date'
                    fullWidth
                    value={transaction.returnDate}
                    onChange={handleTransactionChange}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant='contained'
              color={dialogType === 'lend' ? 'primary' : 'secondary'}
              onClick={handleProcessTransaction}
              disabled={
                transaction.quantity <= 0 ||
                transaction.quantity > currentItem.quantity
              }
            >
              {dialogType === 'lend' ? 'Lend' : 'Give'}
            </Button>
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

export default InventoryPage;
