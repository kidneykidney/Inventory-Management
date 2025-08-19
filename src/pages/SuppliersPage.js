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
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Avatar,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { logger } from '../utils/logger';

// Mock data for suppliers
const mockSuppliersData = [
  {
    id: 1,
    name: 'Tech Solutions Ltd',
    contactPerson: 'Amit Kumar',
    email: 'amit.kumar@techsolutions.com',
    phone: '+91 9876543210',
    address: 'Koramangala, Bangalore, Karnataka - 560034',
    category: 'Electronics',
    rating: 4.5,
    active: true,
    notes: 'Reliable supplier for all electronic items',
    lastOrderDate: '2023-07-10',
  },
  {
    id: 2,
    name: 'Office Furnishings Inc',
    contactPerson: 'Priya Singh',
    email: 'priya@officefurnishings.com',
    phone: '+91 9876543211',
    address: 'HSR Layout, Bangalore, Karnataka - 560102',
    category: 'Furniture',
    rating: 4.2,
    active: true,
    notes: 'High quality office furniture with good discounts for bulk orders',
    lastOrderDate: '2023-07-15',
  },
  {
    id: 3,
    name: 'Office Supplies Co',
    contactPerson: 'Rajesh Verma',
    email: 'rajesh@officesupplies.co.in',
    phone: '+91 9876543212',
    address: 'Whitefield, Bangalore, Karnataka - 560066',
    category: 'Stationery',
    rating: 3.8,
    active: true,
    notes: 'Fast delivery, competitive prices',
    lastOrderDate: '2023-06-20',
  },
  {
    id: 4,
    name: 'Global Tech Imports',
    contactPerson: 'Neeraj Patel',
    email: 'neeraj@globaltechimports.com',
    phone: '+91 9876543213',
    address: 'Indira Nagar, Bangalore, Karnataka - 560038',
    category: 'Electronics',
    rating: 4.0,
    active: false,
    notes: 'International supplier, longer lead times but competitive prices',
    lastOrderDate: '2023-05-05',
  },
  {
    id: 5,
    name: 'Ergonomic Solutions',
    contactPerson: 'Sunita Reddy',
    email: 'sunita@ergosolutions.in',
    phone: '+91 9876543214',
    address: 'JP Nagar, Bangalore, Karnataka - 560078',
    category: 'Furniture',
    rating: 4.7,
    active: true,
    notes: 'Specializes in ergonomic office equipment',
    lastOrderDate: '2023-06-12',
  },
];

// Mock orders data for supplier detail view
const mockOrdersData = [
  {
    id: 1,
    orderNumber: 'ORD-2023-001',
    supplier: 'Tech Solutions Ltd',
    status: 'received',
    orderDate: '2023-07-10',
    receivedDate: '2023-07-18',
    totalAmount: 12500.0,
  },
  {
    id: 2,
    orderNumber: 'ORD-2023-002',
    supplier: 'Office Furnishings Inc',
    status: 'ordered',
    orderDate: '2023-07-15',
    receivedDate: null,
    totalAmount: 8000.0,
  },
  {
    id: 4,
    orderNumber: 'ORD-2023-004',
    supplier: 'Tech Solutions Ltd',
    status: 'cancelled',
    orderDate: '2023-06-25',
    receivedDate: null,
    totalAmount: 3500.0,
  },
];

/**
 * SuppliersPage component
 * Manages supplier information
 * @returns {JSX.Element} SuppliersPage component
 */
const SuppliersPage = () => {
  // Suppliers state
  const [suppliers, setSuppliers] = useState([...mockSuppliersData]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    notes: '',
    active: true,
  });

  // Detail dialog tab state
  const [detailTabValue, setDetailTabValue] = useState(0);

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
    logger.info('SuppliersPage mounted');

    return () => {
      logger.info('SuppliersPage unmounted');
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
   * Filter suppliers based on search term
   */
  const filteredSuppliers = suppliers.filter(supplier => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchTermLower) ||
      supplier.contactPerson.toLowerCase().includes(searchTermLower) ||
      supplier.email.toLowerCase().includes(searchTermLower) ||
      supplier.category.toLowerCase().includes(searchTermLower)
    );
  });

  /**
   * Open dialog for adding a new supplier
   */
  const handleOpenAddDialog = () => {
    logger.debug('Opening add supplier dialog');
    setFormMode('add');
    setSupplierForm({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      notes: '',
      active: true,
    });
    setDialogOpen(true);
  };

  /**
   * Open dialog for editing a supplier
   * @param {Object} supplier - Supplier to edit
   */
  const handleOpenEditDialog = supplier => {
    logger.debug('Opening edit supplier dialog', { supplierId: supplier.id });
    setFormMode('edit');
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      category: supplier.category,
      notes: supplier.notes || '',
      active: supplier.active,
    });
    setDialogOpen(true);
  };

  /**
   * Open supplier details dialog
   * @param {Object} supplier - Supplier to view
   */
  const handleOpenDetailDialog = supplier => {
    logger.debug('Opening supplier details dialog', {
      supplierId: supplier.id,
    });
    setSelectedSupplier(supplier);
    setDetailDialogOpen(true);
    setDetailTabValue(0);
  };

  /**
   * Close all dialogs
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDetailDialogOpen(false);
    setSelectedSupplier(null);
  };

  /**
   * Handle form field change
   * @param {Event} e - Change event
   */
  const handleFormChange = e => {
    const { name, value, checked } = e.target;
    setSupplierForm({
      ...supplierForm,
      [name]: name === 'active' ? checked : value,
    });
  };

  /**
   * Handle detail tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleDetailTabChange = (event, newValue) => {
    setDetailTabValue(newValue);
  };

  /**
   * Save supplier (add or edit)
   */
  const handleSaveSupplier = () => {
    // Validate form fields
    if (!supplierForm.name) {
      setAlert({
        open: true,
        message: 'Supplier name is required',
        severity: 'error',
      });
      return;
    }

    try {
      if (formMode === 'add') {
        // Create new supplier
        const newSupplier = {
          id: Math.max(...suppliers.map(s => s.id), 0) + 1,
          ...supplierForm,
          active:
            supplierForm.active !== undefined ? supplierForm.active : true,
          rating: 0,
          lastOrderDate: null,
        };

        // Add to suppliers
        setSuppliers([...suppliers, newSupplier]);

        // Show success message
        setAlert({
          open: true,
          message: `Supplier ${newSupplier.name} added successfully`,
          severity: 'success',
        });

        logger.info('New supplier added', { supplier: newSupplier.name });
      } else {
        // Update existing supplier
        const updatedSuppliers = suppliers.map(supplier => {
          if (supplier.id === selectedSupplier.id) {
            const updatedSupplier = {
              ...supplier,
              ...supplierForm,
            };
            logger.info('Supplier updated', {
              supplier: updatedSupplier.name,
              changes: Object.keys(supplierForm).join(', '),
            });
            return updatedSupplier;
          }
          return supplier;
        });

        // Update suppliers
        setSuppliers(updatedSuppliers);

        // Show success message
        setAlert({
          open: true,
          message: `Supplier ${supplierForm.name} updated successfully`,
          severity: 'success',
        });
      }

      // Close dialog
      handleCloseDialog();
    } catch (error) {
      logger.error('Error saving supplier', error);
      setAlert({
        open: true,
        message: 'An error occurred while saving the supplier',
        severity: 'error',
      });
    }
  };

  /**
   * Delete supplier
   * @param {number} id - Supplier ID
   */
  const handleDeleteSupplier = id => {
    const supplierToDelete = suppliers.find(supplier => supplier.id === id);

    if (supplierToDelete) {
      // Remove from suppliers
      const updatedSuppliers = suppliers.filter(supplier => supplier.id !== id);
      setSuppliers(updatedSuppliers);

      // Show success message
      setAlert({
        open: true,
        message: `Supplier ${supplierToDelete.name} deleted`,
        severity: 'success',
      });

      logger.info('Supplier deleted', { supplier: supplierToDelete.name });
    }
  };

  /**
   * Toggle supplier active status
   * @param {number} id - Supplier ID
   */
  const handleToggleActive = id => {
    const updatedSuppliers = suppliers.map(supplier => {
      if (supplier.id === id) {
        const updatedSupplier = {
          ...supplier,
          active: !supplier.active,
        };

        logger.info('Supplier status toggled', {
          supplier: supplier.name,
          active: updatedSupplier.active,
        });

        return updatedSupplier;
      }
      return supplier;
    });

    setSuppliers(updatedSuppliers);

    // Update selected supplier if detail dialog is open
    if (selectedSupplier && selectedSupplier.id === id) {
      setSelectedSupplier({
        ...selectedSupplier,
        active: !selectedSupplier.active,
      });
    }

    // Show success message
    const supplier = suppliers.find(s => s.id === id);
    setAlert({
      open: true,
      message: `Supplier ${supplier.name} ${!supplier.active ? 'activated' : 'deactivated'}`,
      severity: 'success',
    });
  };

  /**
   * Close alert
   */
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  /**
   * Get supplier orders
   * @param {number} supplierId - Supplier ID
   * @returns {Array} Supplier orders
   */
  const getSupplierOrders = supplierName => {
    return mockOrdersData.filter(order => order.supplier === supplierName);
  };

  /**
   * Get initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  const getInitials = name => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Suppliers
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
        <TextField
          placeholder='Search suppliers...'
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
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        />

        <Button
          variant='contained'
          color='primary'
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Supplier
        </Button>
      </Box>

      {/* Suppliers Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align='center'>Status</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(supplier => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.category}</TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={supplier.active ? 'Active' : 'Inactive'}
                        color={supplier.active ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title='View Details'>
                          <IconButton
                            size='small'
                            onClick={() => handleOpenDetailDialog(supplier)}
                          >
                            <VisibilityIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Edit'>
                          <IconButton
                            size='small'
                            onClick={() => handleOpenEditDialog(supplier)}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={supplier.active ? 'Deactivate' : 'Activate'}
                        >
                          <IconButton
                            size='small'
                            color={supplier.active ? 'warning' : 'success'}
                            onClick={() => handleToggleActive(supplier.id)}
                          >
                            <BusinessIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Delete'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No suppliers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={filteredSuppliers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Supplier Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {formMode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Company Name'
                name='name'
                fullWidth
                value={supplierForm.name}
                onChange={handleFormChange}
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Contact Person'
                name='contactPerson'
                fullWidth
                value={supplierForm.contactPerson}
                onChange={handleFormChange}
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Email'
                name='email'
                type='email'
                fullWidth
                value={supplierForm.email}
                onChange={handleFormChange}
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Phone'
                name='phone'
                fullWidth
                value={supplierForm.phone}
                onChange={handleFormChange}
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Address'
                name='address'
                fullWidth
                multiline
                rows={3}
                value={supplierForm.address}
                onChange={handleFormChange}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Category'
                name='category'
                fullWidth
                value={supplierForm.category}
                onChange={handleFormChange}
                placeholder='e.g., Electronics, Furniture'
                margin='normal'
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <Typography variant='body1' sx={{ mr: 2 }}>
                  Status:
                </Typography>
                <Chip
                  label={supplierForm.active ? 'Active' : 'Inactive'}
                  color={supplierForm.active ? 'success' : 'default'}
                  onClick={() =>
                    setSupplierForm({
                      ...supplierForm,
                      active: !supplierForm.active,
                    })
                  }
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Notes'
                name='notes'
                fullWidth
                multiline
                rows={3}
                value={supplierForm.notes}
                onChange={handleFormChange}
                margin='normal'
                placeholder='Additional information about this supplier'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleSaveSupplier}
            disabled={
              !supplierForm.name || !supplierForm.email || !supplierForm.phone
            }
          >
            {formMode === 'add' ? 'Add Supplier' : 'Update Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplier Detail Dialog */}
      {selectedSupplier && (
        <Dialog
          open={detailDialogOpen}
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
              <Typography variant='h6'>{selectedSupplier.name}</Typography>
              <Chip
                label={selectedSupplier.active ? 'Active' : 'Inactive'}
                color={selectedSupplier.active ? 'success' : 'default'}
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Tabs
              value={detailTabValue}
              onChange={handleDetailTabChange}
              indicatorColor='primary'
              textColor='primary'
              variant='fullWidth'
              sx={{ mb: 3 }}
            >
              <Tab label='Details' />
              <Tab label='Orders' />
            </Tabs>

            {detailTabValue === 0 && (
              <Box>
                <Card variant='outlined' sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 56,
                          height: 56,
                          mr: 2,
                        }}
                      >
                        {getInitials(selectedSupplier.name)}
                      </Avatar>
                      <Box>
                        <Typography variant='h6'>
                          {selectedSupplier.name}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {selectedSupplier.category}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='subtitle2' color='text.secondary'>
                          Contact Person
                        </Typography>
                        <Typography variant='body1'>
                          {selectedSupplier.contactPerson}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant='subtitle2' color='text.secondary'>
                          Last Order
                        </Typography>
                        <Typography variant='body1'>
                          {selectedSupplier.lastOrderDate || 'No orders yet'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon color='action' sx={{ mr: 1 }} />
                          <Typography variant='body1'>
                            {selectedSupplier.email}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon color='action' sx={{ mr: 1 }} />
                          <Typography variant='body1'>
                            {selectedSupplier.phone}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <BusinessIcon
                            color='action'
                            sx={{ mr: 1, mt: 0.5 }}
                          />
                          <Typography variant='body1'>
                            {selectedSupplier.address}
                          </Typography>
                        </Box>
                      </Grid>

                      {selectedSupplier.notes && (
                        <Grid item xs={12}>
                          <Typography
                            variant='subtitle2'
                            color='text.secondary'
                            gutterBottom
                          >
                            Notes
                          </Typography>
                          <Paper variant='outlined' sx={{ p: 1.5 }}>
                            <Typography variant='body2'>
                              {selectedSupplier.notes}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                <Box
                  sx={{
                    mt: 3,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                  }}
                >
                  <Button
                    variant='outlined'
                    startIcon={<EditIcon />}
                    onClick={() => {
                      handleCloseDialog();
                      handleOpenEditDialog(selectedSupplier);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={selectedSupplier.active ? 'outlined' : 'contained'}
                    color={selectedSupplier.active ? 'warning' : 'success'}
                    onClick={() => {
                      handleToggleActive(selectedSupplier.id);
                      handleCloseDialog();
                    }}
                  >
                    {selectedSupplier.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </Box>
              </Box>
            )}

            {detailTabValue === 1 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6'>Orders History</Typography>
                  <Button
                    variant='outlined'
                    startIcon={<ShoppingCartIcon />}
                    size='small'
                    onClick={handleCloseDialog}
                  >
                    New Order
                  </Button>
                </Box>

                {getSupplierOrders(selectedSupplier.name).length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow
                          sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                        >
                          <TableCell>Order Number</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align='right'>Amount (₹)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getSupplierOrders(selectedSupplier.name).map(order => (
                          <TableRow key={order.id} hover>
                            <TableCell>{order.orderNumber}</TableCell>
                            <TableCell>{order.orderDate}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)
                                }
                                color={
                                  order.status === 'received'
                                    ? 'success'
                                    : order.status === 'ordered'
                                      ? 'info'
                                      : order.status === 'pending'
                                        ? 'warning'
                                        : 'error'
                                }
                                size='small'
                              />
                            </TableCell>
                            <TableCell align='right'>
                              ₹{order.totalAmount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper variant='outlined' sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant='body1'>
                      No orders found for this supplier.
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
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

export default SuppliersPage;
