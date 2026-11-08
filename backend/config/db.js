const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for local development (not needed on Vercel cloud)
if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
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

  const connectionUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://yaseenbrp25_db_user:T0KqSDVqlP75jolq@cluster0.i74n0fg.mongodb.net/step_house_shoes?retryWrites=true&w=majority';

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
