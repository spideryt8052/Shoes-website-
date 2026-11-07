const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    size: {
      type: String,
      default: 'All Sizes',
    },
    color: {
      type: String,
      default: 'All Colors',
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    quantityChanged: {
      type: Number,
      required: true,
    },
    changeType: {
      type: String,
      enum: ['Stock In', 'Stock Out', 'Manual Adjustment', 'Initial Stock', 'Damaged / Removed', 'Bulk Restock'],
      required: true,
      index: true,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    adminName: {
      type: String,
      default: 'System Admin',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockHistory', stockHistorySchema);

