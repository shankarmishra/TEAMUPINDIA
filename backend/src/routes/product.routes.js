const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  addReview,
  updateReview,
  deleteReview,
  searchProducts,
  getSellerProducts
} = require('../controllers/product.controller');

// Validation middleware
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['equipment', 'apparel', 'accessories']).withMessage('Invalid category'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('images').isArray().withMessage('Images must be an array')
];

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Protected routes
router.use(protect);

// Seller routes
router.get('/seller/products', authorize('seller'), getSellerProducts);
router.post('/', authorize('seller'), createProduct);
router.put('/:id', authorize('seller'), updateProduct);
router.delete('/:id', authorize('seller'), deleteProduct);

// Review routes
router.post('/:id/reviews', addReview);
router.put('/:id/reviews/:reviewId', updateReview);
router.delete('/:id/reviews/:reviewId', deleteReview);

module.exports = router; 