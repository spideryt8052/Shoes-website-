const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const storeSettingsRoutes = require('./routes/storeSettingsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const stockHistoryRoutes = require('./routes/stockHistoryRoutes');
const saleRoutes = require('./routes/saleRoutes');
const removalRequestRoutes = require('./routes/removalRequestRoutes');

const mongoSanitize = require('./middleware/sanitize');
const { apiLimiter, burstLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security HTTP Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Path normalization for serverless rewrites (ensure /api is prefixed if stripped)
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Middleware & NoSQL Injection Protection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize);

// DDoS & Spam Throttling on API endpoints
app.use('/api', burstLimiter);
app.use('/api', apiLimiter);

// Restrict CORS to authorized showroom & development domains
const allowedOrigins = [
  'https://shoes-website-yaseenbrp25-6387.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by Security Policy'));
      }
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure database connection middleware for serverless / standard execution
app.use(async (req, res, next) => {
  // Let health check and root check respond even if DB is failing, to make debugging easy
  if (req.path === '/api/health' || req.path === '/api' || req.path === '/api/') {
    try {
      await connectDB();
    } catch (err) {
      console.warn('[MongoDB Diagnostic Check]: DB connection pending or failed:', err.message);
    }
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[MongoDB Middleware Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please verify MONGODB_URI in Vercel Environment Variables and whitelist IP (0.0.0.0/0) in MongoDB Atlas.',
      error: err.message,
    });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health & status endpoints
app.get(['/api', '/api/'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'NEW MB SHOES Bhagalpur API is running smoothly on Vercel!',
    database: isDbConnected ? 'Connected' : 'Disconnected / Connecting',
    dbState: mongoose.connection.readyState,
    showroom: 'NEW MB SHOES, D.N. Singh Road, Shah Market, Khalifabagh Chowk, Tatarpur, Bhagalpur',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json({
    success: isDbConnected,
    message: isDbConnected ? 'Backend is running' : 'Backend is running (database disconnected)',
    database: isDbConnected ? 'connected' : 'disconnected',
    showroom: 'NEW MB SHOES Bhagalpur',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/store-settings', storeSettingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/removal-requests', removalRequestRoutes);

// Centralized error handling
app.use(errorHandler);

module.exports = app;

