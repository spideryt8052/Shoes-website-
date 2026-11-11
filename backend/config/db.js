const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for local development (not needed on Vercel cloud)
if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (e) {}
}

// Ensure dotenv is loaded if running locally/standalone
if (!process.env.MONGODB_URI) {
  try {
    const path = require('path');
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    if (!process.env.MONGODB_URI) {
      require('dotenv').config();
    }
  } catch (e) {}
}

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

  const connectionUri = process.env.MONGODB_URI;

  if (!connectionUri) {
    const errorMsg =
      '[MongoDB] MONGODB_URI environment variable is not defined. Please configure MONGODB_URI in your Vercel project environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(connectionUri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        console.log(`[MongoDB] Connected successfully to host: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
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
