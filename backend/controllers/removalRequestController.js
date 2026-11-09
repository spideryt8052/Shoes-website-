const RemovalRequest = require('../models/RemovalRequest');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockHistory = require('../models/StockHistory');
const cache = require('../utils/cache');

// Helper to determine start and end of current day (IST / local server time)
const getDayBounds = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

// @desc    Submit a removal request (Staff item/order removal)
// @route   POST /api/removal-requests
// @access  Private (Staff / Admin / Developer)
exports.createRemovalRequest = async (req, res, next) => {
  try {
    const {
      itemType = 'product',
      productId,
      variantId,
      saleId,
      reason,
    } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kripya item remove karne ka reason (karan) likhein.',
      });
    }

    const { startOfDay, endOfDay } = getDayBounds();

    // Check daily quota: max 5 requests per day for staff
    const requestsToday = await RemovalRequest.countDocuments({
      requester: req.admin._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const isMasterOrAdmin =
      req.admin.role === 'developer' ||
      req.admin.role === 'admin' ||
      req.admin.isMaster === true;

    // Daily limit of 5 requests strictly applies to staff accounts
    if (!isMasterOrAdmin && requestsToday >= 5) {
      return res.status(400).json({
        success: false,
        message:
          'Daily removal limit reached: Ek din me aap maximum 5 item/order remove karne ki request hi bhej sakte hain.',
        requestsToday,
        remainingToday: 0,
        maxDaily: 5,
      });
    }

    let productName = '';
    let productSku = '';
    let productImage = '';
    let variantSize = '';
    let variantColor = '';
    let invoiceNumber = '';
    let saleAmount = 0;

    // Fetch product snapshot
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        productName = product.name;
        productSku = product.sku;
        productImage = product.primaryImage || (product.images && product.images[0]) || '';

        if (variantId && product.variants) {
          const foundVariant = product.variants.find(
            (v) => String(v._id) === String(variantId)
          );
          if (foundVariant) {
            variantSize = foundVariant.size;
            variantColor = foundVariant.color;
          }
        }
      }
    }

    // Fetch sale/order snapshot
    if (saleId) {
      const sale = await Sale.findById(saleId);
      if (sale) {
        invoiceNumber = sale.invoiceNumber || '';
        saleAmount = sale.totalAmount || 0;
        if (!productName && sale.items && sale.items.length > 0) {
          productName = sale.items.map((i) => i.name).join(', ');
        }
      }
    }

    const removalRequest = await RemovalRequest.create({
      requester: req.admin._id,
      requesterName: req.admin.name,
      requesterEmail: req.admin.email,
      requesterRole: req.admin.role || 'staff',
      itemType,
      product: productId || null,
      productName,
      productSku,
      productImage,
      variantId: variantId || '',
      variantSize,
      variantColor,
      saleId: saleId || null,
      invoiceNumber,
      saleAmount,
      reason: reason.trim(),
      status: 'pending',
    });

    const updatedRequestsToday = requestsToday + 1;
    const remainingToday = Math.max(0, 5 - updatedRequestsToday);

    res.status(201).json({
      success: true,
      message:
        'Item removal request safaltapoorvak bhej di gayi hai! Admin ya Developer ke approve karte hi ye remove ho jayega.',
      request: removalRequest,
      requestsToday: updatedRequestsToday,
      remainingToday,
      maxDaily: 5,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily removal quota status for logged-in user
// @route   GET /api/removal-requests/daily-status
// @access  Private
exports.getDailyStatus = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getDayBounds();

    const requestsToday = await RemovalRequest.countDocuments({
      requester: req.admin._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.status(200).json({
      success: true,
      requestsToday,
      maxDaily: 5,
      remainingToday: Math.max(0, 5 - requestsToday),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get removal requests list
// @route   GET /api/removal-requests
// @access  Private
exports.getRemovalRequests = async (req, res, next) => {
  try {
    const isMasterOrAdmin =
      req.admin.role === 'developer' ||
      req.admin.role === 'admin' ||
      req.admin.isMaster === true;

    let filter = {};

    // Staff can only view their own submitted requests
    if (!isMasterOrAdmin) {
      filter.requester = req.admin._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await RemovalRequest.find(filter)
      .sort('-createdAt')
      .populate('requester', 'name email role');

    const pendingCount = await RemovalRequest.countDocuments(
      isMasterOrAdmin ? { status: 'pending' } : { requester: req.admin._id, status: 'pending' }
    );

    const { startOfDay, endOfDay } = getDayBounds();
    const requestsToday = await RemovalRequest.countDocuments({
      requester: req.admin._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      pendingCount,
      requestsToday,
      maxDaily: 5,
      remainingToday: Math.max(0, 5 - requestsToday),
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a removal request and delete the item/product
// @route   PUT /api/removal-requests/:id/approve
// @access  Private (Admin / Developer only)
exports.approveRemovalRequest = async (req, res, next) => {
  try {
    const isMasterOrAdmin =
      req.admin.role === 'developer' ||
      req.admin.role === 'admin' ||
      req.admin.isMaster === true;

    if (!isMasterOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Removal request approve sirf Admin aur Developer hi kar sakte hain.',
      });
    }

    const request = await RemovalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Removal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}.`,
      });
    }

    // Execute actual removal depending on itemType
    if (request.itemType === 'product' && request.product) {
      await Product.findByIdAndDelete(request.product);
      await StockHistory.deleteMany({ product: request.product });
      cache.clearTag('products:');
      cache.clearTag('inventory:');
    } else if (request.itemType === 'order' && request.saleId) {
      await Sale.findByIdAndDelete(request.saleId);
    } else if (request.itemType === 'inventory_variant' && request.product && request.variantId) {
      await Product.updateOne(
        { _id: request.product },
        { $pull: { variants: { _id: request.variantId } } }
      );
      cache.clearTag('products:');
      cache.clearTag('inventory:');
    }

    request.status = 'approved';
    request.reviewedBy = req.admin._id;
    request.reviewerName = req.admin.name;
    request.reviewerRole = req.admin.role;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Removal request for "${request.productName || request.invoiceNumber || 'Item'}" approved and permanently deleted!`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a removal request
// @route   PUT /api/removal-requests/:id/reject
// @access  Private (Admin / Developer only)
exports.rejectRemovalRequest = async (req, res, next) => {
  try {
    const isMasterOrAdmin =
      req.admin.role === 'developer' ||
      req.admin.role === 'admin' ||
      req.admin.isMaster === true;

    if (!isMasterOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Removal request reject sirf Admin aur Developer hi kar sakte hain.',
      });
    }

    const request = await RemovalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Removal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}.`,
      });
    }

    request.status = 'rejected';
    request.rejectionReason = req.body.rejectionReason || req.body.reason || 'Rejected by Admin / Developer';
    request.reviewedBy = req.admin._id;
    request.reviewerName = req.admin.name;
    request.reviewerRole = req.admin.role;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Removal request for "${request.productName || request.invoiceNumber || 'Item'}" has been rejected.`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

