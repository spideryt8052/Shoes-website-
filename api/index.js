const connectDB = require('../backend/config/db');
const app = require('../backend/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Serverless Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please check MONGODB_URI in Vercel environment variables.',
      error: error.message,
    });
  }
};

