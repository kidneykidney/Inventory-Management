const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { LendingProduct, ProductCategory } = require('../models/lendingModels');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * @route GET /api/lending/products
 * @desc Get all products with optional filtering
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      categoryId: req.query.categoryId,
      isAvailable:
        req.query.isAvailable !== undefined
          ? req.query.isAvailable === 'true'
          : undefined,
      brand: req.query.brand,
      condition: req.query.condition,
      location: req.query.location,
      search: req.query.search,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const products = await LendingProduct.findAll(filters);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/lending/products/:id
 * @desc Get product by ID
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await LendingProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/lending/products
 * @desc Create new product
 * @access Private (Admin only)
 */
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const productData = {
        ...req.body,
        specifications: req.body.specifications
          ? JSON.parse(req.body.specifications)
          : {},
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        productData.imageUrls = req.files.map(
          file => `/uploads/products/${file.filename}`
        );
      }

      const product = new LendingProduct(productData);
      await product.save();

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      logger.error('Error creating product:', error);

      // Clean up uploaded files if product creation failed
      if (req.files && req.files.length > 0) {
        req.files.forEach(async file => {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Error deleting uploaded file:', unlinkError);
          }
        });
      }

      res.status(400).json({
        success: false,
        message: 'Failed to create product',
        error: error.message,
      });
    }
  }
);

/**
 * @route PUT /api/lending/products/:id
 * @desc Update product
 * @access Private (Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  upload.array('images', 5),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const existingProduct = await LendingProduct.findById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      const productData = {
        ...req.body,
        id: req.params.id,
        specifications: req.body.specifications
          ? JSON.parse(req.body.specifications)
          : existingProduct.specifications,
        tags: req.body.tags ? JSON.parse(req.body.tags) : existingProduct.tags,
      };

      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        productData.imageUrls = req.files.map(
          file => `/uploads/products/${file.filename}`
        );
      } else if (req.body.keepExistingImages === 'true') {
        productData.imageUrls = existingProduct.imageUrls;
      }

      const product = new LendingProduct(productData);
      await product.save();

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      logger.error('Error updating product:', error);

      // Clean up uploaded files if product update failed
      if (req.files && req.files.length > 0) {
        req.files.forEach(async file => {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Error deleting uploaded file:', unlinkError);
          }
        });
      }

      res.status(400).json({
        success: false,
        message: 'Failed to update product',
        error: error.message,
      });
    }
  }
);

/**
 * @route DELETE /api/lending/products/:id
 * @desc Delete product
 * @access Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const product = await LendingProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Delete associated image files
    if (product.imageUrls && product.imageUrls.length > 0) {
      for (const imageUrl of product.imageUrls) {
        try {
          const imagePath = path.join(__dirname, '../../', imageUrl);
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          logger.warn('Could not delete image file:', unlinkError.message);
        }
      }
    }

    const deleted = await LendingProduct.deleteById(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/lending/products/statistics
 * @desc Get product statistics
 * @access Private (Admin only)
 */
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const statistics = await LendingProduct.getStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    logger.error('Error fetching product statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/lending/categories
 * @desc Get all product categories
 * @access Private
 */
router.get('/categories/all', authenticateToken, async (req, res) => {
  try {
    const categories = await ProductCategory.findAll();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/lending/categories
 * @desc Create new product category
 * @access Private (Admin only)
 */
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { name, description, parentId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const category = await ProductCategory.create({
      name: name.trim(),
      description: description?.trim(),
      parentId: parentId || null,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/lending/search/suggestions
 * @desc Get search suggestions for products
 * @access Private
 */
router.get('/search/suggestions', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          products: [],
          brands: [],
          tags: [],
        },
      });
    }

    const searchTerm = `%${query}%`;

    // Get product name suggestions
    const [productSuggestions] =
      await require('../config/database').monitoredQuery(
        `
      SELECT DISTINCT name
      FROM lending_products
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 5
    `,
        [searchTerm]
      );

    // Get brand suggestions
    const [brandSuggestions] =
      await require('../config/database').monitoredQuery(
        `
      SELECT DISTINCT brand
      FROM lending_products
      WHERE brand LIKE ? AND brand IS NOT NULL
      ORDER BY brand
      LIMIT 5
    `,
        [searchTerm]
      );

    // Get tag suggestions
    const [tagSuggestions] = await require('../config/database').monitoredQuery(
      `
      SELECT DISTINCT tag
      FROM product_tags
      WHERE tag LIKE ?
      ORDER BY tag
      LIMIT 5
    `,
      [searchTerm]
    );

    res.json({
      success: true,
      data: {
        products: productSuggestions.map(p => p.name),
        brands: brandSuggestions.map(b => b.brand),
        tags: tagSuggestions.map(t => t.tag),
      },
    });
  } catch (error) {
    logger.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions',
      error: error.message,
    });
  }
});

module.exports = router;
