const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StoreSettings = require('../models/StoreSettings');
const Review = require('../models/Review');

async function updateStore() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/step_house_shoes');
  console.log('Connected to MongoDB...');

  const updatedSettings = {
    shopName: 'NEW MB SHOES',
    tagline: 'Multi-Brand Footwear Showroom | Bhagalpur',
    address: 'D.N. Singh Road, Shah Market (Near Titan World), Khalifabagh Chowk, Tatarpur',
    city: 'Bhagalpur',
    state: 'Bihar',
    pincode: '812001',
    contactNumber: '+91 94312 14500',
    alternateContact: '+91 94312 14501',
    email: 'contact@newmbshoes.com',
    openingTime: '10:00 AM',
    closingTime: '09:30 PM',
    workingDays: 'Open All 7 Days (Mon - Sun)',
    googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
    googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
    googleBusinessProfileUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJKee6jMZL8DkRBVnKzNakO44',
    shopDescription: 'NEW MB SHOES is Bhagalpur\'s premier multi-brand footwear showroom located at Shah Market, D.N. Singh Road. We offer genuine collections of sports shoes, sneakers, formal shoes, boots, heels, and kids school shoes. Visit our physical showroom for perfect trials & fittings.',
    lowStockThreshold: 2,
    googleRating: 4.3,
    totalGoogleReviews: 128,
    announcementBanner: {
      enabled: true,
      text: '📍 Visit NEW MB SHOES across our 3 showrooms in Bhagalpur (Shah Market, Tatarpur, Tilkamanjhi) for authentic branded footwear!',
    },
    branches: [
      {
        name: 'NEW MB SHOES (Main Flagship Showroom)',
        tag: 'Branch 1 (Main Store)',
        address: 'D.N. Singh Road, Shah Market (Near Titan World), Khalifabagh Chowk, Tatarpur, Bhagalpur - 812001',
        landmark: 'Near Titan World, Shah Market, Khalifabagh Chowk',
        city: 'Bhagalpur',
        state: 'Bihar',
        pincode: '812001',
        contactNumber: '+91 94312 14500',
        googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
        openingHours: '10:00 AM - 09:30 PM (All 7 Days Open)',
        isPrimary: true,
      },
      {
        name: 'MB SHOES (Tatarpur Showroom)',
        tag: 'Branch 2 (Market)',
        address: 'Tatarpur Main Market Road, Near Chowk, Bhagalpur - 812002',
        landmark: 'Tatarpur Chowk Market Road',
        city: 'Bhagalpur',
        state: 'Bihar',
        pincode: '812002',
        contactNumber: '+91 94312 14500',
        googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
        openingHours: '10:00 AM - 09:30 PM (All 7 Days Open)',
        isPrimary: false,
      },
      {
        name: 'MB SHOES (Tilkamanjhi 3rd Showroom)',
        tag: 'Branch 3 (Tilkamanjhi)',
        address: 'Tilkamanjhi Main Road / Chowk, Bhagalpur - 812001',
        landmark: 'Near Tilkamanjhi Chowk',
        city: 'Bhagalpur',
        state: 'Bihar',
        pincode: '812001',
        contactNumber: '+91 94312 14500',
        googleMapsLocationUrl: 'https://maps.app.goo.gl/38363DB6kC7D1Qiv5',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.10!2d86.999969!3d25.2535303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f037032e2bf8bf%3A0x29f99a87912db23a!2sMB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
        openingHours: '10:00 AM - 09:30 PM (All 7 Days Open)',
        isPrimary: false,
      },
    ],
  };

  let store = await StoreSettings.findOne();
  if (store) {
    Object.assign(store, updatedSettings);
    await store.save();
    console.log('✓ StoreSettings updated in MongoDB for "NEW MB SHOES"');
  } else {
    store = await StoreSettings.create(updatedSettings);
    console.log('✓ StoreSettings created in MongoDB for "NEW MB SHOES"');
  }

  // Update reviews
  await Review.deleteMany({});
  await Review.insertMany([
    {
      authorName: 'Rohan Sharma',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      reviewText: 'Best footwear showroom in Bhagalpur! Found genuine Nike Revolution 7 in my exact size UK 9 at Shah Market showroom. The staff helped me try both sizes 8 and 9 patiently to ensure perfect comfort. Way better than ordering online.',
      relativeTime: '2 weeks ago',
      source: 'Google Reviews',
      shoesPurchased: 'Nike Revolution 7 (Size UK 9)',
      verifiedCustomer: true,
    },
    {
      authorName: 'Priya Mehra',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      reviewText: 'Visited NEW MB SHOES after checking their website catalogue. Everything shown In Stock was actually available right on their shelf! Bought Skechers sneakers. Authentic store billing and very polite staff at Khalifabagh Chowk.',
      relativeTime: '1 month ago',
      source: 'Google Reviews',
      shoesPurchased: 'Skechers D-Lites (Size UK 5)',
      verifiedCustomer: true,
    },
    {
      authorName: 'Amitav Ghosh',
      authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      reviewText: 'Great multi-brand collection in Bhagalpur under one roof. Picked up Woodland Camel boots. The staff also showed me Red Tape formal shoes. Clean showroom with authentic brands.',
      relativeTime: '3 weeks ago',
      source: 'Google Reviews',
      shoesPurchased: 'Woodland Camel Tan Boots (Size UK 8)',
      verifiedCustomer: true,
    },
    {
      authorName: 'Sunita Verma',
      authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      rating: 4,
      reviewText: 'Bought school shoes for my son. Good quality Bata shoes with genuine warranty. Helpful staff who measured his foot size accurately before recommending the right shoe.',
      relativeTime: '1 month ago',
      source: 'Google Reviews',
      shoesPurchased: 'Bata Schoolmate Junior',
      verifiedCustomer: true,
    },
  ]);
  console.log('✓ Reviews updated with verified Bhagalpur customer experiences.');

  process.exit(0);
}

updateStore().catch((err) => {
  console.error(err);
  process.exit(1);
});

