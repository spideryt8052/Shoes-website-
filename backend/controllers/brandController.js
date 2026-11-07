const Brand = require('../models/Brand');
const Product = require('../models/Product');

// @desc    Get all brands (with product counts)
// @route   GET /api/brands
// @access  Public
exports.getAllBrands = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };

    const brands = await Brand.find(query).sort({ isFeatured: -1, name: 1 });

    // Aggregate product count for each brand
    const brandCounts = await Product.aggregate([
      {
        $group: {
          _id: '$brandName',
          count: { $sum: 1 },
          totalStock: { $sum: '$totalStock' },
        },
      },
    ]);

    const countMap = {};
    brandCounts.forEach(b => {
      countMap[b._id.toLowerCase()] = { count: b.count, stock: b.totalStock };
    });

    const enrichedBrands = brands.map(b => {
      const bObj = b.toObject();
      const stats = countMap[b.name.toLowerCase()] || { count: 0, stock: 0 };
      return {
        ...bObj,
        productCount: stats.count,
        totalStockUnits: stats.stock,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedBrands.length,
      brands: enrichedBrands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(200).json({ success: true, brand });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private (Admin)
exports.createBrand = async (req, res, next) => {
  try {
    const { name, logoUrl, description, isFeatured, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }

    const existing = await Brand.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      return res.status(400).json({ success: false, message: `Brand "${name.trim()}" already exists` });
    }

    const brand = await Brand.create({
      name: name.trim(),
      logoUrl: logoUrl || '',
      description: description || '',
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Brand added successfully',
      brand,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private (Admin)
exports.updateBrand = async (req, res, next) => {
  try {
    const { name, logoUrl, description, isFeatured, isActive } = req.body;

    let brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const oldName = brand.name;

    if (name && name.trim() !== '') {
      const duplicate = await Brand.findOne({
        name: new RegExp(`^${name.trim()}$`, 'i'),
        _id: { $ne: brand._id },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Brand "${name}" already exists` });
      }
      brand.name = name.trim();
    }

    if (logoUrl !== undefined) brand.logoUrl = logoUrl;
    if (description !== undefined) brand.description = description;
    if (isFeatured !== undefined) brand.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) brand.isActive = Boolean(isActive);

    await brand.save();

    // If brand name changed, cascade update product brandName
    if (name && name.trim() !== oldName) {
      await Product.updateMany({ brand: brand._id }, { brandName: brand.name });
    }

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      brand,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private (Admin)
exports.deleteBrand = async (req, res, next) => {
  try {
    const productCount = await Product.countDocuments({ brand: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete brand: It is linked to ${productCount} active products. Reassign or remove those products first.`,
      });
    }

    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

