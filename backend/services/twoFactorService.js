const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorService {
  /**
   * Generate OTP Secret for a user
   */
  async generateSecret(userEmail, appName = 'Law Firm System') {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: await QRCode.toDataURL(secret.otpauth_url),
      backupCodes: this.generateBackupCodes(10),
    };
  }

  /**
   * Verify OTP Token
   */
  verifyOTP(secret, token) {
    if (!token || token.length !== 6) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time windows (±30 seconds)
    });
  }

  /**
   * Generate Backup Codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  }

  /**
   * Hash Backup Code
   */
  hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify Backup Code
   */
  verifyBackupCode(code, hashedCode) {
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    return hash === hashedCode;
  }

  /**
   * Generate OTP for Email/SMS
   */
  generateEmailOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    return {
      otp,
      expiresAt,
      hash: this.hashOTP(otp),
    };
  }

  /**
   * Hash OTP for storage
   */
  hashOTP(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify Email OTP
   */
  verifyEmailOTP(otp, hashedOtp, expiresAt) {
    if (new Date() > new Date(expiresAt)) {
      return { valid: false, message: 'OTP expired' };
    }

    const hash = this.hashOTP(otp);
    if (hash !== hashedOtp) {
      return { valid: false, message: 'Invalid OTP' };
    }

    return { valid: true, message: 'OTP verified' };
  }
}

module.exports = new TwoFactorService();
