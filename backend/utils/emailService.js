const nodemailer = require('nodemailer');

// Creates a reusable Gmail transporter
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.GMAIL_USER || 'yaseenbrp25@gmail.com').trim();
  const pass = (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || 'tndkthxajxeutlbj')
    .trim()
    .replace(/\s+/g, ''); // Remove spaces if user copied as "abcd efgh ijkl mnop"

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });
};

/**
 * Send 6-Digit OTP to an email address via Gmail SMTP
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit numeric OTP code
 * @param {string} purpose - 'Login' | 'Emergency Recovery'
 */
const sendEmailOtpCode = async (toEmail, otp, purpose = 'Admin Counter Login') => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `[EmailService] EMAIL_USER or EMAIL_PASS not set in environment. Skipping SMTP send for ${toEmail}. OTP is: ${otp}`
    );
    return { success: false, reason: 'credentials_missing' };
  }

  const senderUser = process.env.EMAIL_USER || process.env.GMAIL_USER || 'yaseenbrp25@gmail.com';
  const fromAddress = `"NEW MB SHOES Bhagalpur" <${senderUser}>`;
  const targetRecipient = toEmail && toEmail.endsWith('@newmbshoes.com') ? 'yaseenbrp25@gmail.com' : toEmail;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">NEW MB SHOES</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Bhagalpur Multi-Brand Footwear Showroom</p>
      </div>
      
      <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Your Verification OTP Code</h2>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">
          A request was made for <strong>${purpose}</strong>. Use the 6-digit verification code below to proceed:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #f8fafc; border: 2px dashed #0f172a; border-radius: 10px; padding: 14px 28px; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-align: center;">
          ⏳ This code is valid for <strong>15 minutes</strong>.
        </p>
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
          If you did not request this OTP, please ignore this email or notify the showroom admin.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 16px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        📍 D.N. Singh Road, Shah Market (Near Titan World), Bhagalpur<br/>
        Tatarpur Showroom • Tilkamanjhi 3rd Showroom | Ph: +91 94312 14500
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetRecipient,
      subject: `[NEW MB SHOES] Your Verification Code: ${otp}`,
      text: `Your NEW MB SHOES verification OTP is: ${otp}. Valid for 15 minutes.`,
      html: htmlContent,
    });

    console.log(`[EmailService] OTP sent successfully to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${toEmail}:`, error.message);
    const maskedUser = user ? user.slice(0, 3) + '***' : 'none';
    const maskedPass = pass ? pass.slice(0, 2) + '***' + pass.slice(-2) + ` (len=${pass.length})` : 'none';
    return { success: false, error: `${error.message} [auth: user=${maskedUser}, pass=${maskedPass}]` };
  }
};

module.exports = {
  sendEmailOtpCode,
  getTransporter,
};

