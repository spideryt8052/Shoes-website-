const StoreSettings = require('../models/StoreSettings');

// @desc    Get store configuration and physical location details
// @route   GET /api/store-settings
// @access  Public
exports.getStoreSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({
        shopName: 'STEP HOUSE',
        tagline: 'Premium Multi-Brand Footwear Destination',
        address: 'Plot 42, Commercial Avenue, Fashion Street, Sector 18',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        contactNumber: '+91 98765 43210',
        openingTime: '10:00 AM',
        closingTime: '09:30 PM',
        workingDays: 'Monday - Sunday (All 7 Days Open)',
        shopDescription: 'Step House is your authorized multi-brand footwear showroom offering authentic shoes from global leaders like Nike, Adidas, Puma, Skechers, Woodland, and Bata. Visit our physical store for trial, comfort fitting, and instant purchase.',
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update store settings (branding, hours, maps, low stock threshold)
// @route   PUT /api/store-settings
// @access  Private (Admin)
exports.updateStoreSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

