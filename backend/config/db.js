const mongoose = require('mongoose');

// Cache connection across serverless invocations (Vercel)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const missingErr = new Error(
        'MONGODB_URI environment variable is missing! Please configure MONGODB_URI in Vercel Project Settings > Environment Variables.'
      );
      console.error(`[MongoDB Error]: ${missingErr.message}`);
      throw missingErr;
    }
  }

  const connectionUri = uri || 'mongodb://127.0.0.1:27017/step_house_shoes';

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(connectionUri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        console.log(`[MongoDB] Connected successfully to host: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
