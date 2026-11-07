const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories with subcategories and counts
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res, next) => {
  try {
    const { targetAudience, occasion } = req.query;
    const query = { isActive: true };

    if (targetAudience && targetAudience !== 'All') {
      query.targetAudience = { $in: [targetAudience, 'Unisex'] };
    }

    if (occasion && occasion !== 'All') {
      query.occasion = occasion;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    // Aggregate product counts per category
    const catCounts = await Product.aggregate([
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 },
          totalStock: { $sum: '$totalStock' },
        },
      },
    ]);

    const countMap = {};
    catCounts.forEach(c => {
      countMap[c._id.toLowerCase()] = { count: c.count, stock: c.totalStock };
    });

    const enriched = categories.map(cat => {
      const cObj = cat.toObject();
      const stats = countMap[cat.name.toLowerCase()] || { count: 0, stock: 0 };
      return {
        ...cObj,
        productCount: stats.count,
        totalStockUnits: stats.stock,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      categories: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, targetAudience, occasion, description, imageUrl, subcategories, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: `Category "${name}" already exists` });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      targetAudience: targetAudience || ['Unisex'],
      occasion: occasion || 'Casual',
      description: description || '',
      imageUrl: imageUrl || '',
      subcategories: Array.isArray(subcategories) ? subcategories.map(s => s.trim()) : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, targetAudience, occasion, description, imageUrl, subcategories, isActive } = req.body;

    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldName = category.name;

    if (name && name.trim() !== '') {
      category.name = name.trim();
    }
    if (targetAudience) category.targetAudience = targetAudience;
    if (occasion) category.occasion = occasion;
    if (description !== undefined) category.description = description;
    if (imageUrl !== undefined) category.imageUrl = imageUrl;
    if (subcategories !== undefined) {
      category.subcategories = Array.isArray(subcategories) ? subcategories.map(s => s.trim()) : [];
    }
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    if (name && name.trim() !== oldName) {
      await Product.updateMany({ category: category._id }, { categoryName: category.name });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: It contains ${productCount} active products. Reassign or delete those products first.`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

