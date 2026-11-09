const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check cookies
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in as an administrator.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_step_house_jwt_key_2026_xyz!');

    // Security Gate: Reject temporary 2FA gate tokens! They cannot access protected APIs!
    if (decoded.step === '2fa_required' || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Two-factor authentication required. Please verify with your 6-digit Google Authenticator PIN.',
      });
    }

    // Find admin user
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or deactivated.',
      });
    }

    const isMaster = admin.isMaster || ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'].includes(admin.email?.toLowerCase());
    if (!isMaster && admin.isApproved === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval by the Developer / Master Admin.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

// Role-based authorization (Developer / Master ID automatically authorized for all operations)
const authorize = (...roles) => {
  return (req, res, next) => {
    const isMaster =
      req.admin.isMaster ||
      req.admin.role === 'developer' ||
      ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'].includes(req.admin.email?.toLowerCase());

    if (isMaster || roles.includes(req.admin.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Admin role '${req.admin.role}' is not authorized to perform this operation.`,
    });
  };
};

module.exports = { protect, authorize };

