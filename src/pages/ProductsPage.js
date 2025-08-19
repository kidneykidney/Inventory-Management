import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Mock product data
const mockProductData = [
  {
    id: 1,
    name: 'Laptop',
    sku: 'SKU001',
    category: 'Electronics',
    price: 999.99,
    description:
      'High-performance business laptop with 16GB RAM and 512GB SSD.',
    image: 'https://via.placeholder.com/300x200?text=Laptop',
  },
  {
    id: 2,
    name: 'Office Chair',
    sku: 'SKU002',
    category: 'Furniture',
    price: 199.99,
    description: 'Ergonomic office chair with lumbar support.',
    image: 'https://via.placeholder.com/300x200?text=Office+Chair',
  },
  {
    id: 3,
    name: 'Printer Ink',
    sku: 'SKU003',
    category: 'Office Supplies',
    price: 29.99,
    description: 'Compatible ink cartridges for laser printers.',
    image: 'https://via.placeholder.com/300x200?text=Printer+Ink',
  },
  {
    id: 4,
    name: 'Smartphone',
    sku: 'SKU004',
    category: 'Electronics',
    price: 699.99,
    description: 'Latest model smartphone with advanced camera system.',
    image: 'https://via.placeholder.com/300x200?text=Smartphone',
  },
  {
    id: 5,
    name: 'Desk',
    sku: 'SKU005',
    category: 'Furniture',
    price: 299.99,
    description: 'Spacious computer desk with cable management system.',
    image: 'https://via.placeholder.com/300x200?text=Desk',
  },
  {
    id: 6,
    name: 'Wireless Mouse',
    sku: 'SKU006',
    category: 'Electronics',
    price: 49.99,
    description: 'Ergonomic wireless mouse with long battery life.',
    image: 'https://via.placeholder.com/300x200?text=Wireless+Mouse',
  },
];

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [page, setPage] = useState(1);
  const productsPerPage = 6;

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Filter products based on search term and category
  const filteredProducts = mockProductData.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === '' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get products for current page
  const currentProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  // Get total pages
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Handle dialog open for add/edit
  const handleOpenDialog = (product = null) => {
    setCurrentProduct(product);
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProduct(null);
  };

  // Get unique categories for filter
  const categories = [
    ...new Set(mockProductData.map(product => product.category)),
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Products
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
            placeholder='Search products...'
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
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {currentProducts.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
              }}
            >
              <CardMedia
                component='img'
                height='160'
                image={product.image}
                alt={product.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Typography variant='h6' component='div' gutterBottom>
                    {product.name}
                  </Typography>
                  <Chip
                    label={product.category}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                </Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  SKU: {product.sku}
                </Typography>
                <Typography variant='h6' color='primary' gutterBottom>
                  ₹{product.price.toFixed(2)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {product.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <IconButton
                  size='small'
                  onClick={() => handleOpenDialog(product)}
                >
                  <EditIcon fontSize='small' />
                </IconButton>
                <IconButton size='small' color='error'>
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {filteredProducts.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant='h6' color='text.secondary'>
                No products found.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color='primary'
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {currentProduct ? 'Edit Product' : 'Add Product'}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component='form'
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label='Name'
              fullWidth
              defaultValue={currentProduct?.name || ''}
            />
            <TextField
              label='SKU'
              fullWidth
              defaultValue={currentProduct?.sku || ''}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label='Category'
                defaultValue={currentProduct?.category || ''}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label='Price'
              type='number'
              fullWidth
              defaultValue={currentProduct?.price || ''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>₹</InputAdornment>
                ),
              }}
            />
            <TextField
              label='Description'
              multiline
              rows={4}
              fullWidth
              defaultValue={currentProduct?.description || ''}
            />
            <TextField
              label='Image URL'
              fullWidth
              defaultValue={currentProduct?.image || ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleCloseDialog}
          >
            {currentProduct ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
