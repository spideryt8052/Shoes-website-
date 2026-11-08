const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    brandName: {
      type: String,
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1 pair'],
      default: 1,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: 'UPI / QR',
      index: true,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    adminName: {
      type: String,
      default: 'Store Staff',
    },
    remarks: {
      type: String,
      default: '',
    },
    syncedToGoogleSheet: {
      type: Boolean,
      default: false,
    },
    syncedAt: {
      type: Date,
    },
    saleDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for date filtering and reporting
saleSchema.index({ saleDate: -1, brandName: 1 });

module.exports = mongoose.model('Sale', saleSchema);

