const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  purpose: {
    type: String,
    default: 'signup',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // MongoDB TTL index: automatically deletes document after 15 minutes!
  },
});

module.exports = mongoose.model('EmailOtp', emailOtpSchema);

