const crypto = require('crypto');

// Standard RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Decode Base32 string to Buffer
function base32Decode(str) {
  const cleaned = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

// Encode Buffer to Base32 string
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

// Generate new random Base32 secret for Google Authenticator (default 20 bytes = 32 chars)
function generateSecret(length = 20) {
  const randomBytes = crypto.randomBytes(length);
  return base32Encode(randomBytes);
}

// Generate TOTP for specific time window (RFC 6238)
function generateTOTP(secret, timeOffset = 0, step = 30, digits = 6) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / step) + timeOffset;

  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

// Verify TOTP token with +/- 1 time step window tolerance (90 seconds total)
function verifyTOTP(secret, token, window = 1) {
  if (!secret || !token) return false;
  const cleanToken = token.toString().trim();
  if (cleanToken.length !== 6) return false;

  for (let i = -window; i <= window; i++) {
    const generated = generateTOTP(secret, i);
    if (generated === cleanToken) {
      return true;
    }
  }
  return false;
}

// Format otpauth:// URL for scanning in Google Authenticator
function getOtpAuthUrl(issuer, accountName, secret) {
  const cleanIssuer = encodeURIComponent(issuer || 'NEW MB SHOES');
  const cleanAccount = encodeURIComponent(accountName || 'admin');
  return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Generate QR Code URL via reliable public generator
function getQrCodeUrl(otpAuthUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpAuthUrl)}`;
}

module.exports = {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  getOtpAuthUrl,
  getQrCodeUrl,
};
