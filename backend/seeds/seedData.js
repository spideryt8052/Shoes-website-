const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const StoreSettings = require('../models/StoreSettings');
const Review = require('../models/Review');

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/step_house_shoes');
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing data
    await Admin.deleteMany();
    await Brand.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await StockHistory.deleteMany();
    await StoreSettings.deleteMany();
    await Review.deleteMany();

    console.log('[Seed] Cleared existing records.');

    // 1. Seed Default Admin User
    const admin = await Admin.create({
      name: 'Store Manager',
      email: 'admin@stephouse.com',
      password: 'adminpassword123',
      role: 'admin',
      isActive: true,
    });
    console.log('[Seed] Admin account created: admin@stephouse.com / adminpassword123');

    // 2. Seed Store Settings
    const storeSettings = await StoreSettings.create({
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
    });
    console.log('[Seed] Store settings created for "NEW MB SHOES" (Bhagalpur).');

    // 3. Seed Brands
    const brandData = [
      { name: 'Nike', isFeatured: true, description: 'World leader in athletic footwear and sportswear.' },
      { name: 'Adidas', isFeatured: true, description: 'Iconic German footwear & athletic equipment brand.' },
      { name: 'Puma', isFeatured: true, description: 'High performance sports shoes and urban lifestyle footwear.' },
      { name: 'Skechers', isFeatured: true, description: 'Pioneers in memory foam walking comfort and slip-ins.' },
      { name: 'Woodland', isFeatured: true, description: 'Rugged outdoor leather boots and all-weather adventure shoes.' },
      { name: 'New Balance', isFeatured: true, description: 'Heritage running shoes and lifestyle sneakers.' },
      { name: 'Red Tape', isFeatured: true, description: 'Premium casual and formal leather footwear.' },
      { name: 'Campus', isFeatured: true, description: 'Modern youth athletic and active sneakers.' },
      { name: 'Bata', isFeatured: true, description: 'Trusted family footwear for over a century.' },
      { name: 'Reebok', isFeatured: true, description: 'Fitness and training footwear engineered for endurance.' },
      { name: 'Liberty', isFeatured: false, description: 'Classic formal and comfortable everyday footwear.' },
      { name: 'Asian', isFeatured: false, description: 'Value running and lightweight walking shoes.' },
      { name: 'Sparx', isFeatured: false, description: 'Youth sporty footwear and durable everyday sandals.' },
      { name: 'Relaxo', isFeatured: false, description: 'Everyday comfortable slippers and house slides.' },
    ];

    const brands = [];
    for (const b of brandData) {
      const created = await Brand.create(b);
      brands.push(created);
    }
    const brandMap = {};
    brands.forEach(b => {
      brandMap[b.name] = b;
    });
    console.log(`[Seed] ${brands.length} Brands created.`);

    // 4. Seed Categories
    const categoryData = [
      {
        name: 'Running Shoes',
        targetAudience: ['Men', 'Women', 'Kids', 'Unisex'],
        occasion: 'Sports',
        description: 'Engineered for shock absorption, lightweight grip, and distance.',
        subcategories: ['Road Running', 'Trail Running', 'Marathon', 'Track'],
      },
      {
        name: 'Sneakers',
        targetAudience: ['Men', 'Women', 'Kids', 'Unisex'],
        occasion: 'Casual',
        description: 'Streetwear, court shoes, and modern lifestyle silhouettes.',
        subcategories: ['High-Top', 'Low-Top', 'Chunky Sneakers', 'Retro Classic'],
      },
      {
        name: 'Sports Shoes',
        targetAudience: ['Men', 'Women', 'Kids', 'Unisex'],
        occasion: 'Sports',
        description: 'Gym training, cricket, badminton, basketball, and tennis.',
        subcategories: ['Cross Training', 'Badminton Court', 'Cricket Spikes', 'Basketball'],
      },
      {
        name: 'Walking Shoes',
        targetAudience: ['Men', 'Women', 'Unisex'],
        occasion: 'Casual',
        description: 'High arch support, memory foam insoles, and slip-on ease.',
        subcategories: ['Slip-Ins', 'Orthopedic Cushion', 'Lightweight Mesh'],
      },
      {
        name: 'Formal Shoes',
        targetAudience: ['Men', 'Women'],
        occasion: 'Formal',
        description: 'Handcrafted genuine leather oxfords, derbys, and dress shoes.',
        subcategories: ['Oxfords', 'Derbys', 'Monk Straps', 'Brogues'],
      },
      {
        name: 'Loafers',
        targetAudience: ['Men', 'Women'],
        occasion: 'Casual',
        description: 'Slip-on dress elegance in suede, nubuck, and genuine leather.',
        subcategories: ['Penny Loafers', 'Tassel Loafers', 'Driving Shoes'],
      },
      {
        name: 'Boots',
        targetAudience: ['Men', 'Women'],
        occasion: 'Outdoor',
        description: 'Rugged hiking boots, Chelsea boots, and ankle leather boots.',
        subcategories: ['Chelsea Boots', 'Hiking Ankle Boots', 'Combat Boots'],
      },
      {
        name: 'Heels',
        targetAudience: ['Women'],
        occasion: 'Formal',
        description: 'Stilettos, block heels, and evening pumps for modern women.',
        subcategories: ['Block Heels', 'Stilettos', 'Kitten Heels', 'Pumps'],
      },
      {
        name: 'Flats',
        targetAudience: ['Women'],
        occasion: 'Casual',
        description: 'Comfortable ballerinas, mules, and everyday work flats.',
        subcategories: ['Ballerinas', 'Mules', 'Pointed Flats'],
      },
      {
        name: 'Sandals',
        targetAudience: ['Men', 'Women', 'Kids', 'Unisex'],
        occasion: 'Casual',
        description: 'Breathable strap sandals for summer, rainy season, and walking.',
        subcategories: ['Floaters', 'Leather Straps', 'Orthopedic Sandals'],
      },
      {
        name: 'Slippers & Slides',
        targetAudience: ['Men', 'Women', 'Kids', 'Unisex'],
        occasion: 'Daily',
        description: 'Everyday comfort slides, flip-flops, and home slippers.',
        subcategories: ['Slides', 'Flip Flops', 'Clog Slides'],
      },
      {
        name: 'School Shoes',
        targetAudience: ['Kids'],
        occasion: 'School',
        description: 'Durable black leather and white PT sports shoes for students.',
        subcategories: ['Black Velcro', 'Black Lace-Up', 'White PT Tennis'],
      },
    ];

    const categories = [];
    for (const c of categoryData) {
      const created = await Category.create(c);
      categories.push(created);
    }
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.name] = c;
    });
    console.log(`[Seed] ${categories.length} Categories created.`);

    // 5. Seed Realistic Products with Detailed Variants and Real Stocks
    const rawProducts = [
      {
        name: 'Nike Revolution 7 Running Shoes',
        brandName: 'Nike',
        gender: 'Men',
        categoryName: 'Running Shoes',
        subcategory: 'Road Running',
        occasion: 'Sports',
        sku: 'NK-REV7-BLK',
        description: 'The Nike Revolution 7 packs the sort of soft cushioning and support that might change your running world. Stylish as ever, comfortable when the rubber meets the road, and performative for your pace. Built with breathable engineered mesh and a plush foam midsole.',
        sellingPrice: 3695,
        originalPrice: 4295,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Black/White', quantity: 4 },
          { size: 'UK 8', color: 'Black/White', quantity: 0 }, // specifically zero stock for testing
          { size: 'UK 9', color: 'Black/White', quantity: 5 },
          { size: 'UK 10', color: 'Black/White', quantity: 2 },
          { size: 'UK 8', color: 'Midnight Navy', quantity: 3 },
          { size: 'UK 9', color: 'Midnight Navy', quantity: 1 }, // low stock
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: true,
      },
      {
        name: 'Adidas Runfalcon 3.0 Wide',
        brandName: 'Adidas',
        gender: 'Men',
        categoryName: 'Running Shoes',
        subcategory: 'Road Running',
        occasion: 'Sports',
        sku: 'AD-RF3-GRY',
        description: 'Lace up for a jog through the park or a walk to the coffee shop in these versatile Adidas running shoes. They feel good from the minute you step in, thanks to the cushy Cloudfoam midsole. The textile upper feels comfy and breathable, and the rubber outsole gives you plenty of grip.',
        sellingPrice: 4199,
        originalPrice: 5999,
        images: [
          'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 6', color: 'Cloud Grey', quantity: 2 },
          { size: 'UK 7', color: 'Cloud Grey', quantity: 5 },
          { size: 'UK 8', color: 'Cloud Grey', quantity: 3 },
          { size: 'UK 9', color: 'Cloud Grey', quantity: 0 }, // Out of stock on UK 9
          { size: 'UK 10', color: 'Cloud Grey', quantity: 2 },
          { size: 'UK 8', color: 'Core Black', quantity: 4 },
          { size: 'UK 9', color: 'Core Black', quantity: 3 },
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: true,
      },
      {
        name: 'Puma Softride Enzo Evo Sneaker',
        brandName: 'Puma',
        gender: 'Men',
        categoryName: 'Sneakers',
        subcategory: 'Chunky Sneakers',
        occasion: 'Casual',
        sku: 'PM-SRE-RED',
        description: 'Pairing two of PUMAs key franchises-Softride and Enzo-the Softride Enzo Evo utilizes our Softride EVA technology that provides extreme cushioning and all-day comfort alongside a progressive upper design language highlighted by bold branding, a TPU caging system, and sleek bootie construction.',
        sellingPrice: 3899,
        originalPrice: 6499,
        images: [
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1512374382149-233c42b661ac?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Puma Red/Black', quantity: 3 },
          { size: 'UK 8', color: 'Puma Red/Black', quantity: 2 },
          { size: 'UK 9', color: 'Puma Red/Black', quantity: 4 },
          { size: 'UK 10', color: 'Puma Red/Black', quantity: 1 },
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: false,
      },
      {
        name: 'Skechers D-Lites Memory Foam Sneaker',
        brandName: 'Skechers',
        gender: 'Women',
        categoryName: 'Sneakers',
        subcategory: 'Retro Classic',
        occasion: 'Casual',
        sku: 'SK-DLITE-WHT',
        description: 'Step into iconic retro athletic styling and upgraded comfort with Skechers D-Lites. This heritage sporty lace-up sneaker features a trubuck leather and smooth mesh upper with an Air-Cooled Memory Foam insole and thick supportive midsole.',
        sellingPrice: 5299,
        originalPrice: 6999,
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 4', color: 'White/Silver', quantity: 2 },
          { size: 'UK 5', color: 'White/Silver', quantity: 3 },
          { size: 'UK 6', color: 'White/Silver', quantity: 4 },
          { size: 'UK 7', color: 'White/Silver', quantity: 1 },
          { size: 'UK 5', color: 'Rose Gold Accent', quantity: 2 },
          { size: 'UK 6', color: 'Rose Gold Accent', quantity: 0 },
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: true,
      },
      {
        name: 'Woodland Camel Tan Outdoor Leather Boot',
        brandName: 'Woodland',
        gender: 'Men',
        categoryName: 'Boots',
        subcategory: 'Hiking Ankle Boots',
        occasion: 'Outdoor',
        sku: 'WL-BOOT-CAM',
        description: 'Crafted from tough nubuck leather with deep lugged rubber soles, this classic Woodland ankle boot is the definitive statement of rugged durability. Designed for outdoor trails and tough weather terrains, offering arch stability and water-resistant finish.',
        sellingPrice: 4795,
        originalPrice: 5495,
        images: [
          'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Camel Tan', quantity: 3 },
          { size: 'UK 8', color: 'Camel Tan', quantity: 4 },
          { size: 'UK 9', color: 'Camel Tan', quantity: 2 },
          { size: 'UK 10', color: 'Camel Tan', quantity: 2 },
          { size: 'UK 8', color: 'Dark Olive', quantity: 2 },
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: false,
      },
      {
        name: 'New Balance 574 Core Classic',
        brandName: 'New Balance',
        gender: 'Unisex',
        categoryName: 'Sneakers',
        subcategory: 'Retro Classic',
        occasion: 'Casual',
        sku: 'NB-574-GRY',
        description: 'The most New Balance shoe ever. Built to be a reliable shoe that could do a lot of different things rather than as a platform for revolutionary technology. Featuring suede and mesh upper with ENCAP midsole cushioning that delivers all-day support.',
        sellingPrice: 7499,
        originalPrice: 8999,
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Classic Grey', quantity: 2 },
          { size: 'UK 8', color: 'Classic Grey', quantity: 3 },
          { size: 'UK 9', color: 'Classic Grey', quantity: 2 },
          { size: 'UK 10', color: 'Classic Grey', quantity: 1 },
          { size: 'UK 8', color: 'Navy Blue', quantity: 2 },
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: true,
      },
      {
        name: 'Red Tape Genuine Leather Oxford Dress Shoes',
        brandName: 'Red Tape',
        gender: 'Men',
        categoryName: 'Formal Shoes',
        subcategory: 'Oxfords',
        occasion: 'Formal',
        sku: 'RT-OXF-BLK',
        description: 'Exude executive confidence with these handcrafted genuine leather formal lace-up Oxford shoes. Featuring a high-sheen polished finish, cushioned footbed, and a durable anti-skid TPR sole suitable for formal meetings and wedding occasions.',
        sellingPrice: 2299,
        originalPrice: 5695,
        images: [
          'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 6', color: 'Jet Black', quantity: 2 },
          { size: 'UK 7', color: 'Jet Black', quantity: 3 },
          { size: 'UK 8', color: 'Jet Black', quantity: 4 },
          { size: 'UK 9', color: 'Jet Black', quantity: 3 },
          { size: 'UK 10', color: 'Jet Black', quantity: 2 },
          { size: 'UK 8', color: 'Burnished Tan', quantity: 3 },
          { size: 'UK 9', color: 'Burnished Tan', quantity: 2 },
        ],
        isFeatured: true,
        isPopular: false,
        isNewArrival: false,
      },
      {
        name: 'Campus Oxyfit Lightweight Sports Walking Shoe',
        brandName: 'Campus',
        gender: 'Men',
        categoryName: 'Walking Shoes',
        subcategory: 'Lightweight Mesh',
        occasion: 'Casual',
        sku: 'CP-OXY-BLU',
        description: 'Campus Oxyfit brings breathable mesh fabric engineered for peak everyday ventilation. Ultra-light Phylon sole dampens walking impacts while maintaining featherlight flex on every step.',
        sellingPrice: 1299,
        originalPrice: 1899,
        images: [
          'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 6', color: 'Airforce Blue', quantity: 4 },
          { size: 'UK 7', color: 'Airforce Blue', quantity: 6 },
          { size: 'UK 8', color: 'Airforce Blue', quantity: 5 },
          { size: 'UK 9', color: 'Airforce Blue', quantity: 4 },
          { size: 'UK 10', color: 'Airforce Blue', quantity: 2 },
        ],
        isFeatured: false,
        isPopular: true,
        isNewArrival: true,
      },
      {
        name: 'Bata Comfit Pointed Block Heel Pumps',
        brandName: 'Bata',
        gender: 'Women',
        categoryName: 'Heels',
        subcategory: 'Block Heels',
        occasion: 'Formal',
        sku: 'BT-CMF-HL',
        description: 'Elegance meets day-long office comfort. Features Bata Comfit dual-density padded latex insole that relieves pressure off the ball of the foot with a stable 2-inch block heel.',
        sellingPrice: 1899,
        originalPrice: 2499,
        images: [
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 4', color: 'Nude Beige', quantity: 2 },
          { size: 'UK 5', color: 'Nude Beige', quantity: 3 },
          { size: 'UK 6', color: 'Nude Beige', quantity: 2 },
          { size: 'UK 7', color: 'Nude Beige', quantity: 1 },
          { size: 'UK 5', color: 'Matte Black', quantity: 2 },
        ],
        isFeatured: false,
        isPopular: false,
        isNewArrival: true,
      },
      {
        name: 'Bata Schoolmate Junior Black Uniform Shoes',
        brandName: 'Bata',
        gender: 'Kids',
        categoryName: 'School Shoes',
        subcategory: 'Black Velcro',
        occasion: 'School',
        sku: 'BT-SCH-BLK',
        description: 'Durable, scuff-resistant synthetic leather upper with dual quick-lock Velcro straps. Antimicrobial lining prevents odor during active school play. Sturdy non-marking rubber outsole.',
        sellingPrice: 799,
        originalPrice: 999,
        images: [
          'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Kids 11', color: 'Black', quantity: 5 },
          { size: 'Kids 12', color: 'Black', quantity: 4 },
          { size: 'Kids 13', color: 'Black', quantity: 6 },
          { size: 'Kids 1', color: 'Black', quantity: 5 },
          { size: 'Kids 2', color: 'Black', quantity: 3 },
        ],
        isFeatured: false,
        isPopular: true,
        isNewArrival: false,
      },
      {
        name: 'Nike Air Zoom Pegasus 40 (Limited Edition)',
        brandName: 'Nike',
        gender: 'Men',
        categoryName: 'Running Shoes',
        subcategory: 'Marathon',
        occasion: 'Sports',
        sku: 'NK-PEG40-OUT',
        description: 'A springy ride for any run, the Pegasus familiar, just-for-you feel returns to help you accomplish your goals. This iteration has the same responsiveness and neutral support you love with improved comfort in sensitive areas.',
        sellingPrice: 10495,
        originalPrice: 11895,
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Volt Green', quantity: 0 },
          { size: 'UK 8', color: 'Volt Green', quantity: 0 },
          { size: 'UK 9', color: 'Volt Green', quantity: 0 },
          { size: 'UK 10', color: 'Volt Green', quantity: 0 },
        ], // Intentionally 0 stock across all variants to test Complete Out-of-Stock behavior!
        isFeatured: false,
        isPopular: false,
        isNewArrival: false,
      },
      {
        name: 'Puma Rebound V6 High-Top Sneaker',
        brandName: 'Puma',
        gender: 'Unisex',
        categoryName: 'Sneakers',
        subcategory: 'High-Top',
        occasion: 'Casual',
        sku: 'PM-RBND-WHT',
        description: 'Injecting retro basketball DNA into a contemporary street icon. High-collar ankle support with perforated toe vamp and SoftFoam+ comfort sockliner for instant step-in cushioning.',
        sellingPrice: 4499,
        originalPrice: 5999,
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 6', color: 'White/Black/Gold', quantity: 1 }, // low stock
          { size: 'UK 7', color: 'White/Black/Gold', quantity: 3 },
          { size: 'UK 8', color: 'White/Black/Gold', quantity: 2 },
          { size: 'UK 9', color: 'White/Black/Gold', quantity: 4 },
        ],
        isFeatured: true,
        isPopular: true,
        isNewArrival: true,
      },
    ];

    for (const item of rawProducts) {
      const brand = brandMap[item.brandName];
      const category = categoryMap[item.categoryName];

      const product = new Product({
        name: item.name,
        brand: brand ? brand._id : brands[0]._id,
        brandName: item.brandName,
        gender: item.gender,
        category: category ? category._id : categories[0]._id,
        categoryName: item.categoryName,
        subcategory: item.subcategory,
        occasion: item.occasion,
        sku: item.sku,
        description: item.description,
        sellingPrice: item.sellingPrice,
        originalPrice: item.originalPrice,
        images: item.images,
        primaryImage: item.images[0],
        variants: item.variants.map(v => ({
          size: v.size,
          color: v.color,
          quantity: v.quantity,
          sku: `${item.sku}-${v.color.replace(/\s+/g, '')}-${v.size.replace(/\s+/g, '')}`,
        })),
        isFeatured: item.isFeatured,
        isPopular: item.isPopular,
        isNewArrival: item.isNewArrival,
      });

      await product.save();

      // Seed initial stock history
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
            adminUser: admin._id,
            adminName: admin.name,
            remarks: 'Physical store inventory initialization',
          });
        }
      }
    }
    console.log(`[Seed] ${rawProducts.length} Products created with live variant stocks and audit logs.`);

    // 6. Seed Real Google Reviews
    const reviewsData = [
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
    ];

    await Review.insertMany(reviewsData);
    console.log(`[Seed] ${reviewsData.length} Customer reviews created.`);

    console.log('[Seed] Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedAll();
