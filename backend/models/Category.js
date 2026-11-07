const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    targetAudience: {
      type: [String],
      enum: ['Men', 'Women', 'Kids', 'Unisex'],
      default: ['Unisex'],
    },
    occasion: {
      type: String,
      enum: ['Sports', 'Casual', 'Formal', 'Daily', 'School', 'Outdoor'],
      default: 'Casual',
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    subcategories: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save to generate unique slug
categorySchema.pre('save', function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

module.exports = mongoose.model('Category', categorySchema);
