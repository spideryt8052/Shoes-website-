const mongoose = require('mongoose');

const removalRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    requesterEmail: {
      type: String,
      required: true,
    },
    requesterRole: {
      type: String,
      default: 'staff',
    },
    itemType: {
      type: String,
      enum: ['product', 'inventory_variant', 'order'],
      default: 'product',
    },
    // Product details (if product removal)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: {
      type: String,
      default: '',
    },
    productSku: {
      type: String,
      default: '',
    },
    productImage: {
      type: String,
      default: '',
    },
    // Variant details (if variant removal)
    variantId: {
      type: String,
      default: '',
    },
    variantSize: {
      type: String,
      default: '',
    },
    variantColor: {
      type: String,
      default: '',
    },
    // Order details (if sale/order removal)
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
    saleAmount: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: [true, 'Removal reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewerName: {
      type: String,
      default: '',
    },
    reviewerRole: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly fetch pending requests and daily counts per requester
removalRequestSchema.index({ requester: 1, createdAt: -1 });
removalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RemovalRequest', removalRequestSchema);

