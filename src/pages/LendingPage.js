import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { Search, Filter, ShoppingCart, Clock, MapPin } from 'lucide-react';

const LendingPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/v1/lending/products?isAvailable=true');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch products',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags.some(tag =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        product => product.categoryId === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  };

  const addToCart = product => {
    if (!cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
      toast({
        title: 'Added to Cart',
        description: `${product.name} has been added to your lending cart`,
      });
    } else {
      toast({
        title: 'Already in Cart',
        description: `${product.name} is already in your cart`,
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = productId => {
    setCart(cart.filter(item => item.id !== productId));
    toast({
      title: 'Removed from Cart',
      description: 'Item removed from your lending cart',
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to your cart before checking out',
        variant: 'destructive',
      });
      return;
    }

    try {
      const checkoutPromises = cart.map(product =>
        fetch('/api/v1/lending-transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            productId: product.id,
            conditionLent: 'good',
            notes: `Borrowed via lending page on ${new Date().toLocaleDateString()}`,
          }),
        })
      );

      const responses = await Promise.all(checkoutPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast({
          title: 'Checkout Successful',
          description: `Successfully borrowed ${successful.length} item(s)`,
        });
        setCart([]);
        fetchProducts(); // Refresh to update availability
      }

      if (failed.length > 0) {
        toast({
          title: 'Partial Checkout',
          description: `${failed.length} item(s) could not be borrowed`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      toast({
        title: 'Checkout Failed',
        description: 'An error occurred during checkout',
        variant: 'destructive',
      });
    }
  };

  const ProductCard = ({ product }) => (
    <Card className='h-full hover:shadow-lg transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex justify-between items-start'>
          <CardTitle className='text-lg font-semibold line-clamp-2'>
            {product.name}
          </CardTitle>
          <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
            {product.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <span className='font-medium'>{product.brand}</span>
          {product.model && <span>• {product.model}</span>}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {product.imageUrls && product.imageUrls.length > 0 && (
          <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className='w-full h-full object-cover'
              onError={e => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        <p className='text-sm text-gray-600 line-clamp-3'>
          {product.description}
        </p>

        <div className='flex items-center gap-4 text-sm text-gray-500'>
          <div className='flex items-center gap-1'>
            <MapPin className='w-4 h-4' />
            <span>{product.location || 'Not specified'}</span>
          </div>
          <div className='flex items-center gap-1'>
            <Clock className='w-4 h-4' />
            <span>{product.maxLendingPeriod} days max</span>
          </div>
        </div>

        {product.tags && product.tags.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant='outline' className='text-xs'>
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant='outline' className='text-xs'>
                +{product.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className='flex gap-2 pt-2'>
          <Button
            onClick={() => addToCart(product)}
            disabled={
              !product.isAvailable || cart.find(item => item.id === product.id)
            }
            className='flex-1'
            size='sm'
          >
            <ShoppingCart className='w-4 h-4 mr-2' />
            {cart.find(item => item.id === product.id)
              ? 'In Cart'
              : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-lg'>Loading available items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Lending Library</h1>
        <p className='text-gray-600'>
          Browse and borrow available electronics and office equipment
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className='mb-6 space-y-4 md:space-y-0 md:flex md:gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Search products, brands, or tags...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex gap-2'>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <Button variant='outline' size='sm'>
            <Filter className='w-4 h-4 mr-2' />
            Filters
          </Button>
        </div>
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Alert className='mb-6'>
          <ShoppingCart className='h-4 w-4' />
          <AlertDescription className='flex justify-between items-center'>
            <span>{cart.length} item(s) in your lending cart</span>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={() => setCart([])}>
                Clear Cart
              </Button>
              <Button size='sm' onClick={handleCheckout}>
                Checkout
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Products Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-500 mb-4'>
            {searchTerm || selectedCategory
              ? 'No products match your search criteria'
              : 'No products available'}
          </div>
          {(searchTerm || selectedCategory) && (
            <Button
              variant='outline'
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LendingPage;
