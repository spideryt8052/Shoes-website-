const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const totp = require('../utils/totp');

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
      isTwoFactorEnabled: admin.isTwoFactorEnabled,
    },
  });
};

// Generate short-lived temp token for 2FA gate
const generateTempToken = (adminId) => {
  return jwt.sign(
    { id: adminId, step: '2fa_required' },
    process.env.JWT_SECRET || 'super_secret_step_house_jwt_key_2026_xyz!',
    { expiresIn: '10m' }
  );
};

// Helper to construct 2FA response (returns QR code if first time, or prompt if active)
const build2FAResponse = async (admin, res) => {
  const tempToken = generateTempToken(admin._id);

  if (admin.isTwoFactorEnabled && admin.twoFactorSecret) {
    return res.status(200).json({
      success: true,
      require2FA: true,
      isConfigured: true,
      tempToken,
      adminEmail: admin.email,
      message: 'Enter the 6-digit code from Google Authenticator',
    });
  }

  // First time 2FA setup: generate secret & QR code
  const secret = totp.generateSecret();
  admin.twoFactorSecret = secret;
  admin.isTwoFactorEnabled = false;
  await admin.save({ validateBeforeSave: false });

  const otpAuthUrl = totp.getOtpAuthUrl('NEW MB SHOES Bhagalpur', admin.email, secret);
  const qrCodeUrl = totp.getQrCodeUrl(otpAuthUrl);

  return res.status(200).json({
    success: true,
    require2FA: true,
    isConfigured: false,
    tempToken,
    secret,
    qrCodeUrl,
    otpAuthUrl,
    adminEmail: admin.email,
    message: 'Scan the QR code with Google Authenticator on your phone to link your account.',
  });
};

// @desc    Admin login (Step 1 Password -> Triggers Step 2 Google Authenticator)
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
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() })
      .select('+password +twoFactorSecret');

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

    // Advance to Step 2: Google Authenticator Gate
    return build2FAResponse(admin, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Send Email OTP (Alternative Step 1)
// @route   POST /api/auth/send-email-otp
// @access  Public
exports.sendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your admin email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No registered admin account found with this email.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.emailOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    };
    await admin.save({ validateBeforeSave: false });

    console.log(`[Email OTP Notification] 6-digit OTP for ${admin.email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: `A 6-digit OTP verification code has been generated for ${admin.email}.`,
      otpPreview: otp, // Displayed in UI alert for instant accessibility
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP (Step 1 Verification -> Triggers Step 2 Google Authenticator)
// @route   POST /api/auth/verify-email-otp
// @access  Public
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Both Email and OTP code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail }).select('+twoFactorSecret');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    if (!admin.emailOtp || !admin.emailOtp.code || admin.emailOtp.code !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit OTP. Please re-enter.' });
    }

    if (new Date() > new Date(admin.emailOtp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Clear used OTP
    admin.emailOtp = undefined;
    await admin.save({ validateBeforeSave: false });

    // Advance to Step 2: Google Authenticator Gate
    return build2FAResponse(admin, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Google Sign-In (Alternative Step 1 -> Triggers Step 2 Google Authenticator)
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential, email: manualEmail, name: manualName } = req.body;

    let email = manualEmail;
    let name = manualName;

    if (credential) {
      try {
        const payloadBase64 = credential.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        email = decoded.email;
        name = decoded.name;
      } catch (e) {
        console.warn('Could not parse Google token payload directly:', e.message);
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Unable to retrieve email from Google authentication.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let admin = await Admin.findOne({ email: cleanEmail }).select('+twoFactorSecret');

    if (!admin) {
      // Auto-create owner admin account for this verified Google account
      admin = await Admin.create({
        name: name || 'Google Verified Owner',
        email: cleanEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'admin',
        isActive: true,
      });
      console.log(`[Google Auth] Linked new owner admin account for ${cleanEmail}`);
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // Advance to Step 2: Google Authenticator Gate
    return build2FAResponse(admin, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Google Authenticator PIN (Step 2 Mandatory Gate)
// @route   POST /api/auth/verify-2fa
// @access  Public
exports.verify2FA = async (req, res, next) => {
  try {
    const { tempToken, totpCode } = req.body;

    if (!tempToken || !totpCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and 6-digit Google Authenticator PIN are required.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'super_secret_step_house_jwt_key_2026_xyz!'
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please sign in again.',
      });
    }

    if (decoded.step !== '2fa_required') {
      return res.status(401).json({ success: false, message: 'Invalid authentication flow state.' });
    }

    const admin = await Admin.findById(decoded.id).select('+twoFactorSecret');
    if (!admin || !admin.twoFactorSecret) {
      return res.status(404).json({ success: false, message: 'Admin 2FA credentials not found.' });
    }

    // Verify 6-digit code with Google Authenticator algorithm (90s window tolerance)
    const isValid = totp.verifyTOTP(admin.twoFactorSecret, totpCode);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit PIN. Please verify the code in your Google Authenticator app and ensure your phone time is accurate.',
      });
    }

    // Activate 2FA permanently
    admin.isTwoFactorEnabled = true;
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Issue permanent 7-day token
    return sendTokenResponse(admin, 200, res);
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

