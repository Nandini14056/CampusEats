const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const router = express.Router();
const {
  getAllProducts,
  getSellersProducts,
  addNewProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');

// GET /api/products - public, all available products
router.get('/', getAllProducts);

// GET /api/products/seller - seller's own products
router.get('/seller', protect, requireRole('seller'), getSellersProducts);

// POST /api/products - seller adds product
router.post('/', protect, requireRole('seller'), upload.single('image'), addNewProduct);

// PATCH /api/products/:id - seller updates product
router.patch('/:id', protect, requireRole('seller'), upload.single('image'), updateProduct);

// DELETE /api/products/:id
router.delete('/:id', protect, requireRole('seller'), deleteProduct);

module.exports = router;
