const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const StockHistory = require('../models/StockHistory');
const StoreSettings = require('../models/StoreSettings');

// @desc    Get inventory matrix of all products with variant breakdown
// @route   GET /api/inventory
// @access  Private (Admin)
exports.getInventory = async (req, res, next) => {
  try {
    const { search, brand, category, status, page = 1, limit = 20 } = req.query;

    // Fetch store threshold for low stock
    const settings = await StoreSettings.findOne();
    const threshold = settings ? settings.lowStockThreshold : 2;

    const query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { brandName: regex }, { sku: regex }];
    }

    if (brand && brand !== 'All') {
      query.brandName = brand;
    }

    if (category && category !== 'All') {
      query.categoryName = category;
    }

    if (status === 'outOfStock') {
      query.totalStock = 0;
    } else if (status === 'lowStock') {
      query.totalStock = { $gt: 0, $lte: threshold };
    } else if (status === 'inStock') {
      query.totalStock = { $gt: threshold };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('name sku brandName categoryName sellingPrice primaryImage variants totalStock isAvailable updatedAt');

    // Enrich with computed status and low stock items
    const enrichedProducts = products.map(prod => {
      const p = prod.toObject();
      let stockStatus = 'inStock';
      if (p.totalStock === 0) stockStatus = 'outOfStock';
      else if (p.totalStock <= threshold) stockStatus = 'lowStock';

      // Check variant level warnings
      const lowVariants = (p.variants || []).filter(v => v.quantity <= threshold);
      const outOfStockVariants = (p.variants || []).filter(v => v.quantity === 0);

      return {
        ...p,
        stockStatus,
        hasLowVariant: lowVariants.length > 0,
        outOfStockVariantCount: outOfStockVariants.length,
      };
    });

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      lowStockThreshold: threshold,
      products: enrichedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single variant stock quantity with audit logging
// @route   POST /api/inventory/update-variant
// @access  Private (Admin)
exports.updateVariantStock = async (req, res, next) => {
  try {
    const {
      productId,
      variantId,
      newQuantity,
      changeType = 'Manual Adjustment', // 'Stock In', 'Stock Out', 'Manual Adjustment'
      remarks = '',
    } = req.body;

    if (!productId || !variantId || newQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Variant ID, and new quantity are required',
      });
    }

    const parsedQty = Math.max(0, parseInt(newQuantity, 10));

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found on product' });
    }

    const previousQuantity = variant.quantity;
    const quantityChanged = parsedQty - previousQuantity;

    // Update variant quantity
    variant.quantity = parsedQty;

    // Save product (pre-save recalculates totalStock and isAvailable)
    await product.save();

    // Determine changeType if not manually customized
    let resolvedChangeType = changeType;
    if (changeType === 'Manual Adjustment') {
      if (quantityChanged > 0) resolvedChangeType = 'Stock In';
      else if (quantityChanged < 0) resolvedChangeType = 'Stock Out';
    }

    // Record stock movement history
    const historyRecord = await StockHistory.create({
      product: product._id,
      productName: product.name,
      variantId: variant._id,
      size: variant.size,
      color: variant.color,
      previousQuantity,
      newQuantity: parsedQty,
      quantityChanged,
      changeType: resolvedChangeType,
      adminUser: req.admin ? req.admin._id : null,
      adminName: req.admin ? req.admin.name : 'Store Manager',
      remarks: remarks || `Adjusted ${variant.color} / Size ${variant.size} from ${previousQuantity} to ${parsedQty}`,
    });

    res.status(200).json({
      success: true,
      message: `Stock updated for ${product.name} (Size ${variant.size}, ${variant.color})`,
      updatedVariant: variant,
      totalProductStock: product.totalStock,
      isAvailable: product.isAvailable,
      historyRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch stock updates (e.g. bulk restock or inventory count)
// @route   POST /api/inventory/batch-update
// @access  Private (Admin)
exports.batchStockAdjustment = async (req, res, next) => {
  try {
    const { updates, remarks = 'Batch inventory update' } = req.body;
    // updates = [{ productId, variantId, newQuantity, changeType }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    const results = [];

    for (const item of updates) {
      const { productId, variantId, newQuantity, changeType = 'Manual Adjustment' } = item;
      const product = await Product.findById(productId);
      if (!product) continue;

      const variant = product.variants.id(variantId);
      if (!variant) continue;

      const prevQty = variant.quantity;
      const parsedQty = Math.max(0, parseInt(newQuantity, 10));
      const diff = parsedQty - prevQty;

      variant.quantity = parsedQty;
      await product.save();

      await StockHistory.create({
        product: product._id,
        productName: product.name,
        variantId: variant._id,
        size: variant.size,
        color: variant.color,
        previousQuantity: prevQty,
        newQuantity: parsedQty,
        quantityChanged: diff,
        changeType,
        adminUser: req.admin ? req.admin._id : null,
        adminName: req.admin ? req.admin.name : 'Store Manager',
        remarks: remarks || `Batch adjusted ${variant.color} / ${variant.size}`,
      });

      results.push({
        productId: product._id,
        variantId: variant._id,
        size: variant.size,
        color: variant.color,
        previousQuantity: prevQty,
        newQuantity: parsedQty,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.length} inventory updates`,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & inventory KPIs
// @route   GET /api/inventory/dashboard-stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne();
    const threshold = settings ? settings.lowStockThreshold : 2;

    const totalProducts = await Product.countDocuments();
    const totalBrands = await Brand.countDocuments({ isActive: true });
    const inStockProducts = await Product.countDocuments({ totalStock: { $gt: threshold } });
    const lowStockProducts = await Product.countDocuments({ totalStock: { $gt: 0, $lte: threshold } });
    const outOfStockProducts = await Product.countDocuments({ totalStock: 0 });

    // Aggregate total units in inventory across all products
    const stockUnitsAggregation = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$totalStock' },
        },
      },
    ]);
    const totalStockUnits = stockUnitsAggregation.length > 0 ? stockUnitsAggregation[0].totalUnits : 0;

    // Recently added products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('name sku brandName categoryName sellingPrice totalStock isAvailable primaryImage createdAt');

    // Recent stock activity logs
    const recentStockHistory = await StockHistory.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('product', 'name primaryImage');

    // Products requiring attention (low stock or zero stock)
    const alertProducts = await Product.find({
      $or: [{ totalStock: 0 }, { totalStock: { $lte: threshold } }],
    })
      .sort({ totalStock: 1 })
      .limit(8)
      .select('name sku brandName totalStock variants primaryImage');

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalBrands,
        totalStockUnits,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        lowStockThreshold: threshold,
      },
      recentProducts,
      recentStockHistory,
      alertProducts,
    });
  } catch (error) {
    next(error);
  }
};

