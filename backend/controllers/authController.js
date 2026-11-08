const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Helper to generate JWT and send cookie
const sendTokenResponse = (admin, statusCode, res) => {
  const token = jwt.sign(
    { id: admin._id, role: admin.role, email: admin.email },
    process.env.JWT_SECRET || 'super_secret_step_house_jwt_key_2026_xyz!',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      lastLogin: admin.lastLogin,
    },
  });
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update lastLogin
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Update current logged-in admin profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    if (name && name.trim()) admin.name = name.trim();
    if (email && email.trim()) admin.email = email.toLowerCase().trim();
    if (password && password.trim().length >= 6) {
      admin.password = password.trim();
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully!',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admin users
// @route   GET /api/auth/users
// @access  Private (Admin role only)
exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-password').sort('-createdAt');
    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new staff / admin user
// @route   POST /api/auth/users
// @access  Private (Admin role only)
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An admin account with this email already exists',
      });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'staff',
    });

    res.status(201).json({
      success: true,
      message: 'New admin account created successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin user
// @route   PUT /api/auth/users/:id
// @access  Private (Admin role only)
exports.updateAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    let admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase().trim();
    if (role) admin.role = role;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    if (password && password.trim().length >= 6) {
      admin.password = password;
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete admin user
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin role only)
exports.deleteAdmin = async (req, res, next) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account while logged in',
      });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

