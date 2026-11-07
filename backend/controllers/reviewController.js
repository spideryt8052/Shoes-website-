const Review = require('../models/Review');
const StoreSettings = require('../models/StoreSettings');

// @desc    Get customer reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(10);

    const settings = await StoreSettings.findOne();

    res.status(200).json({
      success: true,
      googleRating: settings ? settings.googleRating : 4.8,
      totalGoogleReviews: settings ? settings.totalGoogleReviews : 284,
      googleReviewUrl: settings ? settings.googleReviewUrl : 'https://search.google.com/local/writereview',
      googleBusinessProfileUrl: settings ? settings.googleBusinessProfileUrl : 'https://business.google.com',
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for admin panel
// @route   GET /api/reviews/admin
// @access  Private (Admin)
exports.getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a review (by admin or verified visitor)
// @route   POST /api/reviews
// @access  Private (Admin)
exports.createReview = async (req, res, next) => {
  try {
    const { authorName, authorAvatar, rating, reviewText, relativeTime, source, shoesPurchased, isApproved } = req.body;

    if (!authorName || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Author name, rating (1-5), and review text are required',
      });
    }

    const review = await Review.create({
      authorName: authorName.trim(),
      authorAvatar: authorAvatar || '',
      rating: Number(rating),
      reviewText: reviewText.trim(),
      relativeTime: relativeTime || 'Recent visit',
      source: source || 'Google Reviews',
      shoesPurchased: shoesPurchased || '',
      isApproved: isApproved !== undefined ? Boolean(isApproved) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Admin)
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

