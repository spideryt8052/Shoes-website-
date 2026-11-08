// Vercel Serverless Function entry point
let app;
let loadError = null;

try {
  app = require('../backend/app');
} catch (err) {
  try {
    const path = require('path');
    app = require(path.join(process.cwd(), 'backend', 'app'));
  } catch (err2) {
    console.error('[Vercel Boot Error]: Failed to load backend application:', err2);
    loadError = err2;
  }
}

module.exports = (req, res) => {
  if (loadError || !app) {
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize backend application on Vercel.',
      error: loadError ? loadError.message : 'Unknown load error',
      stack: loadError ? loadError.stack : null,
      cwd: process.cwd(),
    });
  }

  return app(req, res);
};
