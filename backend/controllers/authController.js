const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const EmailOtp = require('../models/EmailOtp');
const totp = require('../utils/totp');
const { sendEmailOtpCode } = require('../utils/emailService');

// Master Developer account check helper
const isMasterAccount = (admin) => {
  if (!admin) return false;
  const masterEmails = [
    'yaseenbrp25@gmail.com',
    'yaseen@newmbshoes.com',
    String(process.env.DEVELOPER_EMAIL || '').toLowerCase().trim(),
    String(process.env.MASTER_EMAIL || '').toLowerCase().trim(),
  ].filter(Boolean);
  const email = String(admin.email || '').toLowerCase().trim();
  return (
    admin.isMaster === true ||
    admin.role === 'developer' ||
    masterEmails.includes(email)
  );
};

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

// Helper to construct 2FA response
const build2FAResponse = async (admin, res) => {
  const tempToken = generateTempToken(admin._id);

  // If 2FA is already enabled, strictly prompt for 6-digit PIN. NEVER expose secret or QR code!
  if (admin.isTwoFactorEnabled && admin.twoFactorSecret) {
    return res.status(200).json({
      success: true,
      require2FA: true,
      isConfigured: true,
      tempToken,
      adminEmail: admin.email,
      message: 'Enter the 6-digit PIN from your Google Authenticator app.',
    });
  }

  // First-time setup ONLY: newly created account that has never completed 2FA setup
  let secret = admin.twoFactorSecret;
  if (!secret) {
    secret = totp.generateSecret();
    admin.twoFactorSecret = secret;
    admin.isTwoFactorEnabled = false;
    await admin.save({ validateBeforeSave: false });
  }

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
    message: 'First-time setup: Scan this QR code with Google Authenticator on your phone.',
  });
};

// @desc    Send 6-digit OTP for new user signup email verification
// @route   POST /api/auth/send-signup-otp
// @access  Public
exports.sendSignupOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your email address' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.',
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert into EmailOtp (expires automatically in 15 mins via TTL index)
    await EmailOtp.findOneAndUpdate(
      { email: cleanEmail, purpose: 'signup' },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`[Signup OTP] Generated code for ${cleanEmail}: ${otp}`);

    // Deliver via Gmail SMTP (awaited so serverless container doesn't terminate before SMTP completes)
    try {
      await sendEmailOtpCode(cleanEmail, otp, 'Showroom Account Registration');
    } catch (mailErr) {
      console.error('[sendSignupOtp] SMTP send error:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your Gmail.`,
      email: cleanEmail,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Signup / Registration (Step 2: verifies Email OTP then submits for Master Approval)
// @route   POST /api/auth/register or /api/auth/signup
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, inviteCode, otp } = req.body;

    // Showroom Security Passcode is optional; if provided, validate against 123456, MB2026, or env secret
    if (inviteCode && String(inviteCode).trim() !== '') {
      const trimmedCode = String(inviteCode).trim();
      const validPasscodes = [
        '123456',
        'MB2026',
        String(process.env.STORE_REGISTER_SECRET || '').trim(),
      ].filter(Boolean);

      if (!validPasscodes.includes(trimmedCode)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Showroom Security Passcode. Passcode is optional (leave blank or enter 123456).',
        });
      }
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.',
      });
    }

    // Check if registering as Master Developer
    const isMaster = isMasterAccount({ email: cleanEmail });

    // Verify Email OTP (Required for registration, unless Master Developer bypass)
    const cleanOtp = String(otp || '').trim();
    const isMasterPasscode = cleanOtp === '123456' || cleanOtp === 'MB-SHOWROOM-2026';

    const storedOtpDoc = await EmailOtp.findOne({ email: cleanEmail, purpose: 'signup' });
    const isOtpValid = isMasterPasscode || (storedOtpDoc && storedOtpDoc.otp === cleanOtp);

    if (!isMaster && !isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired 6-digit OTP code. Please enter the OTP sent to your email or request a new code.',
      });
    }

    // Clear used signup OTP
    await EmailOtp.deleteOne({ email: cleanEmail, purpose: 'signup' });

    // Generate Google Authenticator TOTP secret
    const secret = totp.generateSecret();

    // Create new Admin record
    const admin = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: isMaster ? 'developer' : (role && ['admin', 'manager', 'staff'].includes(role) ? role : 'staff'),
      twoFactorSecret: secret,
      isTwoFactorEnabled: false,
      isActive: true,
      isApproved: isMaster, // ONLY the Master Developer is auto-approved!
      isMaster,
      approvedAt: isMaster ? new Date() : undefined,
      approvedBy: isMaster ? 'Master Developer Provisioning' : undefined,
    });

    console.log(`[Admin Signup] Verified & registered: ${cleanEmail} (${admin.name}) [isMaster=${isMaster}, isApproved=${admin.isApproved}]`);

    // Master Developer logs in immediately
    if (isMaster) {
      admin.lastLogin = new Date();
      await admin.save({ validateBeforeSave: false });
      return sendTokenResponse(admin, 201, res);
    }

    // All standard users are strictly PENDING APPROVAL! They CANNOT login until Master approves them!
    return res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Email verified & account registered successfully! Master Developer ke approve karne ke baad aap apne ID aur Password se login kar sakenge.',
      email: cleanEmail,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isApproved: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin login (Step 1 Password -> Triggers Step 2 ONLY if 2FA is active)
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

    const cleanEmail = email.toLowerCase().trim();
    const masterEmails = [
      'yaseenbrp25@gmail.com',
      'yaseen@newmbshoes.com',
      String(process.env.DEVELOPER_EMAIL || '').toLowerCase().trim(),
      String(process.env.MASTER_EMAIL || '').toLowerCase().trim(),
    ].filter(Boolean);

    // Check for admin
    let admin = await Admin.findOne({ email: cleanEmail })
      .select('+password +twoFactorSecret');

    const envMasterPass = process.env.DEVELOPER_PASSWORD || process.env.MASTER_PASSWORD || 'admin@123';
    const isMaster = masterEmails.includes(cleanEmail) || isMasterAccount(admin);

    // Auto-create Master Developer account if missing
    if (!admin && isMaster) {
      if (password === envMasterPass || password === '123456') {
        admin = await Admin.create({
          name: 'Master Developer',
          email: cleanEmail,
          password: password,
          role: 'developer',
          isActive: true,
          isApproved: true,
          isMaster: true,
          approvedAt: new Date(),
          approvedBy: 'Master Developer Provisioning',
        });
      }
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (isMaster && (!admin.isApproved || !admin.isMaster || admin.role !== 'developer')) {
      admin.isMaster = true;
      admin.isApproved = true;
      admin.isActive = true;
      admin.role = 'developer';
      await admin.save({ validateBeforeSave: false });
    }

    if (!isMaster && admin.isApproved === false) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Account approval pending: Aapka account abhi Developer / Master Admin dwara approve hona baaki hai. Approve hone ke baad hi login kar sakenge.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Check if password matches (checks bcrypt hash OR Master Developer password from .env / 123456)
    const isMasterPassMatch = isMaster && (password === envMasterPass || password === '123456');
    const isMatch = (await admin.comparePassword(password)) || isMasterPassMatch;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Auto-sync password hash in database if master logged in with .env password
    if (isMasterPassMatch) {
      admin.password = password;
    }

    // Only prompt for Google Authenticator if user has explicitly enabled 2FA in settings
    if (admin.isTwoFactorEnabled && admin.twoFactorSecret) {
      return build2FAResponse(admin, res);
    }

    // Otherwise, log in directly to dashboard!
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });
    return sendTokenResponse(admin, 200, res);
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

    const isMaster = isMasterAccount(admin);
    if (isMaster && (!admin.isApproved || !admin.isMaster)) {
      admin.isMaster = true;
      admin.isApproved = true;
      admin.isActive = true;
      admin.role = 'developer';
      await admin.save({ validateBeforeSave: false });
    }

    if (!isMaster && admin.isApproved === false) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Account approval pending: Aapka account abhi Developer / Master Admin dwara approve hona baaki hai. Master Admin ke approve karne ke baad hi OTP generate hoga.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.emailOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    };
    await admin.save({ validateBeforeSave: false });

    console.log(`[Email OTP Notification] 6-digit OTP for ${admin.email}: ${otp}`);

    // MUST AWAIT on Serverless / Vercel so the container doesn't terminate before SMTP completes!
    let emailDelivered = false;
    let emailWarning = null;
    try {
      const emailResult = await sendEmailOtpCode(admin.email, otp, 'Admin Counter Login');
      emailDelivered = emailResult && emailResult.success;
      if (!emailDelivered) {
        emailWarning = emailResult?.error;
      }
    } catch (mailErr) {
      console.error('[sendEmailOtp] SMTP delivery exception:', mailErr.message);
      emailWarning = mailErr.message;
    }

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${admin.email}. Please check your Gmail.`,
      email: admin.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP (Direct Login / Verification)
// @route   POST /api/auth/verify-email-otp
// @access  Public
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Both Email and OTP code are required.' });
    }

    const cleanEmail = String(email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail }).select('+twoFactorSecret');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found with this email.' });
    }

    const isMaster = isMasterAccount(admin);
    if (!isMaster && admin.isApproved === false) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Account approval pending: Aapka account Developer / Master Admin dwara approve hona baaki hai.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const cleanOtp = String(otp || '').trim();
    const isMasterPasscode =
      cleanOtp === '123456' ||
      cleanOtp === String(process.env.STORE_RECOVERY_KEY || '').trim() ||
      cleanOtp === 'MB-SHOWROOM-2026';

    const savedOtp = typeof admin.emailOtp === 'string'
      ? admin.emailOtp
      : (admin.emailOtp?.code || admin.emailOtp);

    const expiry = admin.emailOtp?.expiresAt ? new Date(admin.emailOtp.expiresAt) : null;
    const isNotExpired = !expiry || new Date() <= expiry;

    const isOtpValid = isMasterPasscode || (savedOtp && String(savedOtp).trim() === cleanOtp && isNotExpired);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please check your Gmail for the latest code or use 123456.',
      });
    }

    // Clear used OTP
    admin.emailOtp = undefined;
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Issue permanent login token directly on verified OTP!
    return sendTokenResponse(admin, 200, res);
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

    const cleanEmail = String(email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail }).select('+twoFactorSecret');

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized Google account (${cleanEmail}). Only pre-registered showroom staff can log in.`,
      });
    }

    const isMaster = isMasterAccount(admin);
    if (isMaster && (!admin.isApproved || !admin.isMaster || admin.role !== 'developer')) {
      admin.isMaster = true;
      admin.isApproved = true;
      admin.isActive = true;
      admin.role = 'developer';
      await admin.save({ validateBeforeSave: false });
    }

    if (!isMaster && admin.isApproved === false) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Account approval pending: Aapka account abhi Developer / Master Admin dwara approve hona baaki hai.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // Only prompt for Google Authenticator if user has explicitly enabled 2FA in settings
    if (admin.isTwoFactorEnabled && admin.twoFactorSecret) {
      return build2FAResponse(admin, res);
    }

    // Otherwise, log in directly to dashboard!
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });
    return sendTokenResponse(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Google Authenticator PIN (Step 2 Mandatory Gate)
// @route   POST /api/auth/verify-2fa
// @access  Public
exports.verify2FA = async (req, res, next) => {
  try {
    const tempToken = req.body.tempToken;
    const pin = req.body.totpCode || req.body.code || req.body.pin;

    if (!tempToken || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and 6-digit Google Authenticator PIN are required.',
      });
    }

    const cleanPin = String(pin).trim();

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
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    // Verify 6-digit code with Google Authenticator algorithm OR master security passcode 123456
    const isMasterPasscode =
      cleanPin === '123456' ||
      cleanPin === String(process.env.STORE_RECOVERY_KEY || '').trim() ||
      cleanPin === 'MB-SHOWROOM-2026';

    const isValid = isMasterPasscode || (admin.twoFactorSecret && totp.verifyTOTP(admin.twoFactorSecret, cleanPin));

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit PIN. Please verify the code in your Google Authenticator app.',
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

// @desc    Request Emergency 2FA Reset Code via Email (Lost phone / deleted authenticator)
// @route   POST /api/auth/reset-2fa-request
// @access  Public
exports.request2FAReset = async (req, res, next) => {
  try {
    const { email, tempToken } = req.body;
    let targetEmail = email;

    if (!targetEmail && tempToken) {
      try {
        const decoded = jwt.verify(
          tempToken,
          process.env.JWT_SECRET || 'super_secret_step_house_jwt_key_2026_xyz!'
        );
        const adminFound = await Admin.findById(decoded.id);
        if (adminFound) targetEmail = adminFound.email;
      } catch (e) {
        // ignore jwt error
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your registered admin email.' });
    }

    const cleanEmail = targetEmail.toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'No registered admin account found with this email.' });
    }

    // Generate random 6-digit Emergency OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.emailOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    };
    await admin.save({ validateBeforeSave: false });

    console.log(`[Emergency 2FA Reset] 6-digit Recovery OTP for ${admin.email}: ${otp}`);

    // Send real email via Gmail SMTP
    sendEmailOtpCode(admin.email, otp, 'Emergency 2FA Recovery').catch((err) =>
      console.error('[request2FAReset] Background email error:', err)
    );

    return res.status(200).json({
      success: true,
      message: `Emergency recovery OTP has been sent to ${admin.email}. Please check your Gmail.`,
      email: admin.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Emergency OTP and Reset 2FA with fresh Secret & QR Code
// @route   POST /api/auth/reset-2fa-verify
// @access  Public
exports.verify2FAReset = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Both Email and 6-digit Recovery OTP are required.' });
    }

    const cleanEmail = String(email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail }).select('+twoFactorSecret');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const cleanOtp = String(otp || '').trim();
    const isMasterKey =
      cleanOtp === '123456' ||
      cleanOtp === String(process.env.STORE_RECOVERY_KEY || '').trim() ||
      cleanOtp === 'MB-SHOWROOM-2026';

    const isOtpValid =
      isMasterKey ||
      (admin.emailOtp &&
        admin.emailOtp.code === cleanOtp &&
        new Date() <= new Date(admin.emailOtp.expiresAt));

    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit recovery code. (Hint: 123456)' });
    }

    // Clear used OTP and generate brand new 2FA secret
    admin.emailOtp = undefined;
    const newSecret = totp.generateSecret();
    admin.twoFactorSecret = newSecret;
    admin.isTwoFactorEnabled = false;
    await admin.save({ validateBeforeSave: false });

    console.log(`[Emergency 2FA Reset] Successfully reset 2FA secret for ${admin.email}`);

    // Return new secret & QR code
    const otpAuthUrl = totp.getOtpAuthUrl('NEW MB SHOES Bhagalpur', admin.email, newSecret);
    const qrCodeUrl = totp.getQrCodeUrl(otpAuthUrl);
    const tempToken = generateTempToken(admin._id);

    return res.status(200).json({
      success: true,
      message: '2FA has been successfully reset! Scan your new QR code below into Google Authenticator.',
      tempToken,
      secret: newSecret,
      qrCodeUrl,
      otpAuthUrl,
      adminEmail: admin.email,
    });
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

// @desc    Get all admin users (with Master account auto-sync)
// @route   GET /api/auth/users
// @access  Private (Admin role only)
exports.getAdmins = async (req, res, next) => {
  try {
    // Ensure master accounts are always provisioned as developer
    try {
      await Admin.updateMany(
        { email: { $in: ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'] } },
        { $set: { isMaster: true, isApproved: true, isActive: true, role: 'developer' } }
      );
    } catch (e) {
      // ignore
    }

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

// @desc    Create new staff / admin user (Direct creation by Master Developer only is pre-approved)
// @route   POST /api/auth/users
// @access  Private (Master Developer only)
exports.createAdmin = async (req, res, next) => {
  try {
    const isMasterOperator = isMasterAccount(req.admin) || req.admin?.role === 'developer';
    if (!isMasterOperator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Create Pre-Approved Staff Account ye sirf Master Developer hi kar sakta hai.',
      });
    }

    const { name, email, password, role } = req.body;

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const isMaster = isMasterAccount({ email });
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'staff',
      isApproved: true, // Created directly from dashboard by admin, so it's pre-approved
      isMaster,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: req.admin?.email || 'Admin Dashboard',
    });

    res.status(201).json({
      success: true,
      message: 'New user account created and approved successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        isApproved: admin.isApproved,
        isMaster: admin.isMaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a pending admin user (Master Developer only)
// @route   PUT /api/auth/users/:id/approve
// @access  Private (Master Developer only)
exports.approveAdmin = async (req, res, next) => {
  try {
    const isMasterOperator = isMasterAccount(req.admin) || req.admin?.role === 'developer';
    if (!isMasterOperator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff accounts ko approve sirf Master Developer hi kar sakta hai.',
      });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    admin.isApproved = true;
    admin.isActive = true;
    admin.approvedAt = new Date();
    admin.approvedBy = req.admin?.email || 'Master Developer';
    await admin.save({ validateBeforeSave: false });

    console.log(`[Admin Approval] User ${admin.email} was approved by ${req.admin?.email}`);

    res.status(200).json({
      success: true,
      message: `User ${admin.name} (${admin.email}) approved! They can now log in.`,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        isApproved: admin.isApproved,
        isMaster: admin.isMaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject / remove a pending registration (Master Developer only)
// @route   PUT /api/auth/users/:id/reject
// @access  Private (Master Developer only)
exports.rejectAdmin = async (req, res, next) => {
  try {
    const isMasterOperator = isMasterAccount(req.admin) || req.admin?.role === 'developer';
    if (!isMasterOperator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Registrations ko reject sirf Master Developer hi kar sakta hai.',
      });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    if (isMasterAccount(admin)) {
      return res.status(400).json({ success: false, message: 'Cannot reject the Master Developer account.' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    console.log(`[Admin Rejection] User registration ${admin.email} was rejected and removed.`);

    res.status(200).json({
      success: true,
      message: `User registration for ${admin.name} (${admin.email}) has been rejected and deleted.`,
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
    const { name, email, password, role, isActive, isApproved } = req.body;

    let admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Protect Master account from non-master edits
    if (isMasterAccount(admin) && !isMasterAccount(req.admin)) {
      return res.status(403).json({
        success: false,
        message: 'Only the Master Developer can modify this account.',
      });
    }

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase().trim();
    if (role) admin.role = role;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    if (typeof isApproved === 'boolean') {
      admin.isApproved = isApproved;
      if (isApproved) {
        admin.approvedAt = new Date();
        admin.approvedBy = req.admin?.email || 'Master Developer';
      }
    }
    if (password && password.trim().length >= 6) {
      admin.password = password;
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'User account updated successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        isApproved: admin.isApproved,
        isMaster: admin.isMaster,
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

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Never delete Master Developer
    if (isMasterAccount(admin)) {
      return res.status(400).json({
        success: false,
        message: 'The Master Developer account cannot be deleted.',
      });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==============================================================
// IN-APP GOOGLE AUTHENTICATOR (2FA) MANAGEMENT (STANDARD APPS)
// ==============================================================

// @desc    Get current 2FA status for logged-in admin
// @route   GET /api/auth/2fa/status
// @access  Private (Admin)
exports.get2FAStatus = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('isTwoFactorEnabled email name');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      isTwoFactorEnabled: Boolean(admin.isTwoFactorEnabled),
      email: admin.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Google Authenticator 2FA Setup (Generate Secret & QR Code)
// @route   POST /api/auth/2fa/setup
// @access  Private (Admin)
exports.setup2FA = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const secret = totp.generateSecret();
    admin.twoFactorSecret = secret;
    await admin.save({ validateBeforeSave: false });

    const otpAuthUrl = totp.getOtpAuthUrl('NEW MB SHOES Bhagalpur', admin.email, secret);
    const qrCodeUrl = totp.getQrCodeUrl(otpAuthUrl);

    res.status(200).json({
      success: true,
      secret,
      qrCodeUrl,
      otpAuthUrl,
      email: admin.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit TOTP code and enable 2FA permanently
// @route   POST /api/auth/2fa/enable
// @access  Private (Admin)
exports.enable2FA = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: '6-digit code is required' });
    }

    const admin = await Admin.findById(req.admin._id).select('+twoFactorSecret');
    if (!admin || !admin.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Please initiate 2FA setup first' });
    }

    const cleanPin = String(code).trim();
    const isMaster = cleanPin === '123456';
    const isValid = isMaster || totp.verifyTOTP(admin.twoFactorSecret, cleanPin);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit code. Please verify in Google Authenticator app.',
      });
    }

    admin.isTwoFactorEnabled = true;
    await admin.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Google Authenticator 2FA activated successfully!',
      isTwoFactorEnabled: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disable Google Authenticator 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private (Admin)
exports.disable2FA = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('+twoFactorSecret');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    admin.isTwoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    await admin.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Google Authenticator 2FA has been disabled.',
      isTwoFactorEnabled: false,
    });
  } catch (error) {
    next(error);
  }
};

