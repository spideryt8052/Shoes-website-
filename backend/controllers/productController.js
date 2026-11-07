const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const StockHistory = require('../models/StockHistory');

// @desc    Get all products with dynamic search, multi-faceted filtering, sorting, & pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      gender,
      brand,
      category,
      subcategory,
      occasion,
      minPrice,
      maxPrice,
      size,
      color,
      availability, // 'inStock', 'outOfStock', or 'all'
      sort = 'newest',
      page = 1,
      limit = 12,
      featured,
      popular,
      newArrival,
    } = req.query;

    const query = {};

    // 1. Text Search
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { brandName: searchRegex },
        { categoryName: searchRegex },
        { subcategory: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
      ];
    }

    // 2. Gender filter (e.g. Men includes Unisex)
    if (gender && gender !== 'All') {
      if (gender === 'Men') {
        query.gender = { $in: ['Men', 'Unisex'] };
      } else if (gender === 'Women') {
        query.gender = { $in: ['Women', 'Unisex'] };
      } else if (gender === 'Kids') {
        query.gender = 'Kids';
      } else {
        query.gender = gender;
      }
    }

    // 3. Brand filter
    if (brand && brand !== 'All') {
      const brandsList = Array.isArray(brand) ? brand : brand.split(',');
      query.brandName = { $in: brandsList.map(b => new RegExp(`^${b.trim()}$`, 'i')) };
    }

    // 4. Category filter
    if (category && category !== 'All') {
      const catsList = Array.isArray(category) ? category : category.split(',');
      query.categoryName = { $in: catsList.map(c => new RegExp(`^${c.trim()}$`, 'i')) };
    }

    // 5. Subcategory
    if (subcategory && subcategory !== 'All') {
      query.subcategory = new RegExp(`^${subcategory.trim()}$`, 'i');
    }

    // 6. Occasion (Sports, Casual, Formal)
    if (occasion && occasion !== 'All') {
      query.occasion = occasion;
    }

    // 7. Price bounds
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    // 8. Availability filter (Real stock backed)
    if (availability === 'inStock') {
      query.totalStock = { $gt: 0 };
    } else if (availability === 'outOfStock') {
      query.totalStock = 0;
    }

    // 9. Shoe size filter (matches variants where size is available and qty > 0)
    if (size && size !== 'All') {
      const sizesList = Array.isArray(size) ? size : size.split(',');
      query.variants = {
        $elemMatch: {
          size: { $in: sizesList.map(s => s.trim()) },
          quantity: { $gt: 0 },
        },
      };
    }

    // 10. Color filter
    if (color && color !== 'All') {
      const colorsList = Array.isArray(color) ? color : color.split(',');
      const colorQuery = {
        $elemMatch: {
          color: { $in: colorsList.map(c => new RegExp(`^${c.trim()}$`, 'i')) },
          quantity: { $gt: 0 },
        },
      };
      if (query.variants) {
        query.$and = [
          { variants: query.variants },
          { variants: colorQuery },
        ];
        delete query.variants;
      } else {
        query.variants = colorQuery;
      }
    }

    // Specific flags
    if (featured === 'true') query.isFeatured = true;
    if (popular === 'true') query.isPopular = true;
    if (newArrival === 'true') query.isNewArrival = true;

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortOption = { sellingPrice: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { sellingPrice: -1 };
    } else if (sort === 'popular') {
      sortOption = { isPopular: -1, viewCount: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'name-asc') {
      sortOption = { name: 1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('brand', 'name slug logoUrl')
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalProducts / limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages,
      currentPage: pageNum,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:identifier
// @access  Public
exports.getProductByIdOrSlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let product;

    // Check if valid ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier)
        .populate('brand', 'name slug logoUrl')
        .populate('category', 'name slug');
    }

    // Fallback to slug or SKU
    if (!product) {
      product = await Product.findOne({
        $or: [
          { slug: identifier.toLowerCase() },
          { sku: identifier.toUpperCase() },
        ],
      })
        .populate('brand', 'name slug logoUrl')
        .populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment view count
    product.viewCount = (product.viewCount || 0) + 1;
    await product.save({ validateBeforeSave: false });

    // Find related products from same category or brand
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { brandName: product.brandName },
        { categoryName: product.categoryName },
      ],
    })
      .limit(4)
      .select('name slug brandName sellingPrice originalPrice primaryImage images totalStock isAvailable variants');

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product with variants & initial stock
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      customBrandName,
      gender,
      category,
      subcategory,
      occasion,
      sku,
      description,
      sellingPrice,
      originalPrice,
      images,
      variants, // Array of { size, color, quantity, sku }
      isFeatured,
      isPopular,
      isNewArrival,
    } = req.body;

    // Resolve Brand: either existing ObjectId, or custom brand name
    let brandDoc;
    if (customBrandName && customBrandName.trim()) {
      const trimmedBrand = customBrandName.trim();
      brandDoc = await Brand.findOne({ name: new RegExp(`^${trimmedBrand}$`, 'i') });
      if (!brandDoc) {
        brandDoc = await Brand.create({
          name: trimmedBrand,
          slug: trimmedBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        });
      }
    } else if (brand) {
      if (typeof brand === 'string' && brand.match(/^[0-9a-fA-F]{24}$/)) {
        brandDoc = await Brand.findById(brand);
      }
      if (!brandDoc && typeof brand === 'string' && brand.trim() !== '') {
        brandDoc = await Brand.findOne({ name: new RegExp(`^${brand.trim()}$`, 'i') });
        if (!brandDoc) {
          brandDoc = await Brand.create({
            name: brand.trim(),
            slug: brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          });
        }
      }
    }

    if (!brandDoc) {
      return res.status(400).json({ success: false, message: 'Please select an existing brand or enter a custom brand name' });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'Invalid Category selected' });
    }

    // Check SKU duplicate
    const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Product with SKU "${sku}" already exists` });
    }

    // Prepare variants
    const formattedVariants = (variants || []).map(v => ({
      size: String(v.size).trim(),
      color: String(v.color).trim(),
      quantity: Number(v.quantity) || 0,
      sku: v.sku ? String(v.sku).trim() : `${sku.toUpperCase()}-${v.color}-${v.size}`,
    }));

    const product = new Product({
      name: name.trim(),
      brand: brandDoc._id,
      brandName: brandDoc.name,
      gender,
      category: categoryDoc._id,
      categoryName: categoryDoc.name,
      subcategory: subcategory ? subcategory.trim() : '',
      occasion: occasion || 'Casual',
      sku: sku.toUpperCase().trim(),
      description,
      sellingPrice: Number(sellingPrice),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images: Array.isArray(images) && images.length > 0 ? images : ['/placeholder-shoe.jpg'],
      primaryImage: Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder-shoe.jpg',
      variants: formattedVariants,
      isFeatured: Boolean(isFeatured),
      isPopular: Boolean(isPopular),
      isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : true,
    });

    await product.save();

    // Record initial stock history for each variant
    for (const v of product.variants) {
      if (v.quantity > 0) {
        await StockHistory.create({
          product: product._id,
          productName: product.name,
          variantId: v._id,
          size: v.size,
          color: v.color,
          previousQuantity: 0,
          newQuantity: v.quantity,
          quantityChanged: v.quantity,
          changeType: 'Initial Stock',
          adminUser: req.admin._id,
          adminName: req.admin.name,
          remarks: 'Initial product stock creation',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully with live inventory data',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details and variants
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      brand,
      customBrandName,
      gender,
      category,
      subcategory,
      occasion,
      sku,
      description,
      sellingPrice,
      originalPrice,
      images,
      variants,
      isFeatured,
      isPopular,
      isNewArrival,
    } = req.body;

    if (name) product.name = name.trim();
    if (gender) product.gender = gender;
    if (subcategory !== undefined) product.subcategory = subcategory.trim();
    if (occasion) product.occasion = occasion;
    if (description) product.description = description;
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (images && Array.isArray(images) && images.length > 0) {
      product.images = images;
      product.primaryImage = images[0];
    }
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isPopular !== undefined) product.isPopular = Boolean(isPopular);
    if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);

    // Update brand if changed or custom brand provided
    if (customBrandName && customBrandName.trim()) {
      const trimmedBrand = customBrandName.trim();
      let brandDoc = await Brand.findOne({ name: new RegExp(`^${trimmedBrand}$`, 'i') });
      if (!brandDoc) {
        brandDoc = await Brand.create({
          name: trimmedBrand,
          slug: trimmedBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        });
      }
      product.brand = brandDoc._id;
      product.brandName = brandDoc.name;
    } else if (brand && brand !== product.brand.toString()) {
      let brandDoc;
      if (typeof brand === 'string' && brand.match(/^[0-9a-fA-F]{24}$/)) {
        brandDoc = await Brand.findById(brand);
      }
      if (!brandDoc && typeof brand === 'string' && brand.trim() !== '') {
        brandDoc = await Brand.findOne({ name: new RegExp(`^${brand.trim()}$`, 'i') });
        if (!brandDoc) {
          brandDoc = await Brand.create({
            name: brand.trim(),
            slug: brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          });
        }
      }
      if (brandDoc) {
        product.brand = brandDoc._id;
        product.brandName = brandDoc.name;
      }
    }

    // Update category if changed
    if (category && category !== product.category.toString()) {
      const catDoc = await Category.findById(category);
      if (catDoc) {
        product.category = catDoc._id;
        product.categoryName = catDoc.name;
      }
    }

    // Update SKU if changed
    if (sku && sku.toUpperCase() !== product.sku) {
      const duplicate = await Product.findOne({
        sku: sku.toUpperCase().trim(),
        _id: { $ne: product._id },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `SKU "${sku}" is already in use by another product` });
      }
      product.sku = sku.toUpperCase().trim();
    }

    // Update variants if supplied
    if (variants && Array.isArray(variants)) {
      // Map existing variants to detect stock changes for history logs
      const oldVariantsMap = new Map();
      product.variants.forEach(v => {
        oldVariantsMap.set(`${v.color}-${v.size}`, v.quantity);
      });

      product.variants = variants.map(v => ({
        size: String(v.size).trim(),
        color: String(v.color).trim(),
        quantity: Number(v.quantity) || 0,
        sku: v.sku || `${product.sku}-${v.color}-${v.size}`,
      }));

      // Log stock adjustments
      for (const v of product.variants) {
        const key = `${v.color}-${v.size}`;
        const oldQty = oldVariantsMap.get(key) !== undefined ? oldVariantsMap.get(key) : 0;
        const newQty = v.quantity;
        if (oldQty !== newQty) {
          const diff = newQty - oldQty;
          await StockHistory.create({
            product: product._id,
            productName: product.name,
            size: v.size,
            color: v.color,
            previousQuantity: oldQty,
            newQuantity: newQty,
            quantityChanged: diff,
            changeType: diff > 0 ? 'Stock In' : 'Stock Out',
            adminUser: req.admin._id,
            adminName: req.admin.name,
            remarks: 'Product updated from admin panel',
          });
        }
      }
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Clean up stock history for deleted product
    await StockHistory.deleteMany({ product: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Product and associated inventory history deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product images
// @route   POST /api/products/upload-images
// @access  Private (Admin)
exports.uploadImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
  }

  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    imageUrls,
  });
};

