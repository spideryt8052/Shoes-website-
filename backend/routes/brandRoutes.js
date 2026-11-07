const express = require('express');
const router = express.Router();
const {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');
const { protect } = require('../middleware/auth');

router.get('/', getAllBrands);
router.get('/:id', getBrandById);
router.post('/', protect, createBrand);
router.put('/:id', protect, updateBrand);
router.delete('/:id', protect, deleteBrand);

module.exports = router;

