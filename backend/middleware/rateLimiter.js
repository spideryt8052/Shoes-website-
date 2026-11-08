const rateLimit = require('express-rate-limit');

// Strict limiter for admin login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter for public API endpoints (protects against spam & server slowdown)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 800, // Allow each IP up to 800 catalog requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rapid-fire burst protection (blocks abusive bots sending 35+ calls in 5 seconds)
const burstLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 40,
  message: {
    success: false,
    message: 'Too many rapid requests. Please wait a few seconds.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter, burstLimiter };
