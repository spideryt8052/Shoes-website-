const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: [true, 'Size is required for variant'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required for variant'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
    },
    brandName: {
      type: String,
      required: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ['Men', 'Women', 'Kids', 'Unisex'],
      required: [true, 'Target gender is required'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    categoryName: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: '',
      trim: true,
    },
    occasion: {
      type: String,
      enum: ['Sports', 'Casual', 'Formal', 'Daily', 'School', 'Outdoor'],
      default: 'Casual',
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price must be positive'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be positive'],
    },
    images: {
      type: [String],
      validate: [val => val.length > 0, 'At least one product image is required'],
    },
    primaryImage: {
      type: String,
    },
    variants: [variantSchema],
    totalStock: {
      type: Number,
      default: 0,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for available sizes (only sizes where quantity > 0)
productSchema.virtual('inStockSizes').get(function () {
  if (!this.variants) return [];
  const sizes = new Set();
  this.variants.forEach(v => {
    if (v.quantity > 0) sizes.add(v.size);
  });
  return Array.from(sizes);
});

// Virtual for all sizes defined in variants
productSchema.virtual('allSizes').get(function () {
  if (!this.variants) return [];
  const sizes = new Set();
  this.variants.forEach(v => sizes.add(v.size));
  return Array.from(sizes);
});

// Virtual for available colors
productSchema.virtual('inStockColors').get(function () {
  if (!this.variants) return [];
  const colors = new Set();
  this.variants.forEach(v => {
    if (v.quantity > 0) colors.add(v.color);
  });
  return Array.from(colors);
});

// Virtual for all colors defined in variants
productSchema.virtual('allColors').get(function () {
  if (!this.variants) return [];
  const colors = new Set();
  this.variants.forEach(v => colors.add(v.color));
  return Array.from(colors);
});

// Calculate total stock and availability before saving
productSchema.pre('save', function () {
  // Generate primaryImage
  if (this.images && this.images.length > 0 && !this.primaryImage) {
    this.primaryImage = this.images[0];
  }

  // Generate slug
  if (this.isModified('name') || !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.slug = `${baseSlug}-${this.sku.toLowerCase()}`;
  }

  // Calculate total stock from variants
  if (this.variants && Array.isArray(this.variants)) {
    this.totalStock = this.variants.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  } else {
    this.totalStock = 0;
  }

  // Set overall availability status based directly on totalStock
  this.isAvailable = this.totalStock > 0;
});

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  brandName: 'text',
  categoryName: 'text',
  subcategory: 'text',
});

// Compound indexes for ultra-fast catalog and stock queries
productSchema.index({ totalStock: 1, updatedAt: -1 });
productSchema.index({ isAvailable: 1, createdAt: -1 });
productSchema.index({ brandName: 1, isAvailable: 1 });
productSchema.index({ categoryName: 1, isAvailable: 1 });
productSchema.index({ isFeatured: 1, isAvailable: 1 });
productSchema.index({ isNewArrival: 1, isAvailable: 1 });
productSchema.index({ 'variants.quantity': 1 });

module.exports = mongoose.model('Product', productSchema);
