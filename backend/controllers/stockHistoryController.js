const StockHistory = require('../models/StockHistory');

// @desc    Get stock change audit logs with filters and pagination
// @route   GET /api/stock-history
// @access  Private (Admin)
exports.getStockHistory = async (req, res, next) => {
  try {
    const { productId, changeType, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (productId) {
      query.product = productId;
    }

    if (changeType && changeType !== 'All') {
      query.changeType = changeType;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { productName: regex },
        { adminName: regex },
        { remarks: regex },
        { size: regex },
        { color: regex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await StockHistory.countDocuments(query);
    const history = await StockHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('product', 'name sku primaryImage');

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      history,
    });
  } catch (error) {
    next(error);
  }
};

