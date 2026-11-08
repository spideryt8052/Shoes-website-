const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      default: 'STEP HOUSE',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Premium Multi-Brand Footwear Destination',
      trim: true,
    },
    shopLogo: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: true,
      default: 'Plot 42, Commercial Avenue, Fashion Street, Sector 18',
    },
    city: {
      type: String,
      default: 'Metropolis',
    },
    state: {
      type: String,
      default: 'State',
    },
    pincode: {
      type: String,
      default: '110001',
    },
    contactNumber: {
      type: String,
      required: true,
      default: '+91 98765 43210',
    },
    alternateContact: {
      type: String,
      default: '+91 91234 56789',
    },
    email: {
      type: String,
      default: 'info@stephouse.com',
    },
    openingTime: {
      type: String,
      default: '10:00 AM',
    },
    closingTime: {
      type: String,
      default: '09:30 PM',
    },
    workingDays: {
      type: String,
      default: 'Monday - Sunday (All 7 Days Open)',
    },
    googleMapsLocationUrl: {
      type: String,
      default: 'https://maps.google.com/?q=Step+House+Shoe+Store',
    },
    googleMapsEmbedUrl: {
      type: String,
      default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.541249764516!2d77.3209553!3d28.5730303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDM0JzIyLjkiTiA3N8KwMTknMTUuNCJF!5e0!3m2!1sen!2sin!4v1650000000000!5m2!1sen!2sin',
    },
    googleBusinessProfileUrl: {
      type: String,
      default: 'https://business.google.com',
    },
    googleReviewUrl: {
      type: String,
      default: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    },
    shopDescription: {
      type: String,
      default: 'Step House is your authorized multi-brand footwear showroom offering authentic shoes from global leaders like Nike, Adidas, Puma, Skechers, Woodland, and Bata. Visit our physical store for trial, comfort fitting, and instant purchase.',
    },
    googleSheetWebhookUrl: {
      type: String,
      default: '',
      trim: true,
    },
    autoSyncGoogleSheet: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 2,
      min: 1,
    },
    googleRating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    totalGoogleReviews: {
      type: Number,
      default: 284,
    },
    announcementBanner: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: '👟 Visit our physical showroom today to experience authentic comfort fit and seasonal discounts!' },
    },
    heroBannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&auto=format&fit=crop&q=80',
    },
    showroomPhotos: [
      {
        type: String,
      },
    ],
    branches: [
      {
        name: { type: String, required: true },
        tag: { type: String, default: 'Branch' },
        address: { type: String, required: true },
        landmark: { type: String, default: '' },
        city: { type: String, default: 'Bhagalpur' },
        state: { type: String, default: 'Bihar' },
        pincode: { type: String, default: '812001' },
        contactNumber: { type: String, default: '+91 94312 14500' },
        googleMapsLocationUrl: { type: String, required: true },
        googleMapsEmbedUrl: { type: String, default: '' },
        openingHours: { type: String, default: '10:00 AM - 09:30 PM (All 7 Days)' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);

