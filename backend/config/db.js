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

// Sanitize connection URI in case of accidental wrapping quotes or "MONGODB_URI=" prefix
const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let str = rawUri.trim();
  str = str.replace(/^["']|["']$/g, '').trim();
  if (/^MONGODB_URI\s*[:=]\s*/i.test(str)) {
    str = str.replace(/^MONGODB_URI\s*[:=]\s*/i, '').trim();
  }
  str = str.replace(/^["']|["']$/g, '').trim();
  return str;
};

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

  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    const errorMsg =
      '[MongoDB] MONGODB_URI environment variable is not defined. Please configure MONGODB_URI in your Vercel project environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const connectionUri = sanitizeMongoUri(rawUri);

  if (!connectionUri.startsWith('mongodb://') && !connectionUri.startsWith('mongodb+srv://')) {
    const errorMsg = `[MongoDB] Invalid MONGODB_URI format. Must start with "mongodb://" or "mongodb+srv://". (Received prefix: "${connectionUri.slice(0, 20)}...")`;
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
