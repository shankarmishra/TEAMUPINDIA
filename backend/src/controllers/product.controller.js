const Product = require('../models/product.model');
const logger = require('../utils/logger');

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (Seller)
 */
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      seller: req.user._id
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product'
    });
  }
};

/**
 * Get all products with filters
 * @route GET /api/products
 * @access Public
 */
exports.getProducts = async (req, res) => {
  try {
    const { category, sport, minPrice, maxPrice, rating, sort = '-createdAt' } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category.toLowerCase();
    }

    if (sport) {
      query.sport = sport.toLowerCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const products = await Product.find(query)
      .populate('seller', 'name')
      .sort(sort);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};

/**
 * Get single product
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private (Seller)
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user is seller of the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
};

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private (Seller)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user is seller of the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.remove();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
};

/**
 * Add review to product
 * @route POST /api/products/:id/reviews
 * @access Private
 */
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has already reviewed
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Product already reviewed'
      });
    }

    // Add review
    product.reviews.push({
      user: req.user._id,
      rating: Number(rating),
      comment
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
};

/**
 * Update review
 * @route PUT /api/products/:id/reviews/:reviewId
 * @access Private
 */
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the review owner
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review.rating = Number(rating);
    review.comment = comment;

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
};

/**
 * Delete review
 * @route DELETE /api/products/:id/reviews/:reviewId
 * @access Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the review owner
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    product.reviews.pull(req.params.reviewId);
    await product.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
};

/**
 * Search products
 * @route GET /api/products/search
 * @access Public
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, category, sport, minPrice, maxPrice, rating, sort = '-createdAt' } = req.query;
    const query = { isActive: true };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query.category = category.toLowerCase();
    }

    if (sport) {
      query.sport = sport.toLowerCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const products = await Product.find(query)
      .populate('seller', 'name')
      .sort(sort);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    logger.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products'
    });
  }
};

/**
 * Get seller's products
 * @route GET /api/products/seller/products
 * @access Private (Seller)
 */
exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .sort('-createdAt');

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    logger.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller products'
    });
  }
}; 