const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
    },
    relativeTime: {
      type: String,
      default: 'Recent visit',
    },
    verifiedCustomer: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['Google Reviews', 'Customer Feedback', 'Store Visitor'],
      default: 'Google Reviews',
    },
    shoesPurchased: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Review', reviewSchema);

