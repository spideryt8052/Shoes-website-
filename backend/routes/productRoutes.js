const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public catalog routes
router.get('/', getProducts);
router.get('/:identifier', getProductByIdOrSlug);

// Protected admin routes
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/upload-images', protect, upload.array('images', 8), uploadImages);

module.exports = router;

