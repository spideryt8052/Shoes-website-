// Vercel Serverless Function entry point
const app = require('../backend/app');

// Vercel natively supports exporting an Express app directly
module.exports = app;
