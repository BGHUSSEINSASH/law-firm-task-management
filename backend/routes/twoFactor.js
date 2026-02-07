const express = require('express');
const router = express.Router();
const twoFactorService = require('../services/twoFactorService');
const notificationService = require('../services/notificationService');
const inMemoryDB = require('../inMemoryDB');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/2fa/setup
 * Generate QR code for 2FA setup
 */
router.get('/setup', authMiddleware, async (req, res) => {
  try {
    const user = inMemoryDB.users.get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { secret, qrCode, backupCodes } = await twoFactorService.generateSecret(
      user.email,
      'Law Firm Task Management'
    );

    // Store temporarily (user must confirm setup)
    user.tempTwoFactorSecret = secret;
    user.tempBackupCodes = backupCodes.map((code) => twoFactorService.hashBackupCode(code));

    res.json({
      qrCode,
      backupCodes, // Show to user once, they must save them
      secret, // Also provide secret for manual entry
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
});

/**
 * POST /api/2fa/verify-setup
 * Verify OTP and enable 2FA
 */
router.post('/verify-setup', authMiddleware, (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = inMemoryDB.users.get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.tempTwoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not initiated' });
    }

    // Verify OTP
    if (!twoFactorService.verifyOTP(user.tempTwoFactorSecret, otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.tempTwoFactorSecret;
    user.backupCodes = user.tempBackupCodes;
    user.tempTwoFactorSecret = null;
    user.tempBackupCodes = null;

    // Create security event
    inMemoryDB.activityLogs.push({
      id: Math.random(),
      user_id: user.id,
      action: 'enable_2fa',
      entity: 'user',
      details: { ip: req.ip },
      created_at: new Date().toISOString(),
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA
 */
router.post('/disable', authMiddleware, (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = inMemoryDB.users.get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA not enabled' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];

    // Create security event
    inMemoryDB.activityLogs.push({
      id: Math.random(),
      user_id: user.id,
      action: 'disable_2fa',
      entity: 'user',
      details: { ip: req.ip },
      created_at: new Date().toISOString(),
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
});

/**
 * POST /api/2fa/verify-login
 * Verify OTP during login (2nd step)
 */
router.post('/verify-login', async (req, res) => {
  try {
    const { email, otp, backupCode } = req.body;

    if (!email || (!otp && !backupCode)) {
      return res.status(400).json({ message: 'Email and OTP/Backup Code required' });
    }

    const user = inMemoryDB.users.find((u) => u.email === email);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: 'User not found or 2FA not enabled' });
    }

    let verified = false;

    // Verify OTP
    if (otp) {
      verified = twoFactorService.verifyOTP(user.twoFactorSecret, otp);
    }

    // Verify Backup Code
    if (backupCode && !verified) {
      const index = user.backupCodes.findIndex(
        (code) => twoFactorService.verifyBackupCode(backupCode, code)
      );
      if (index !== -1) {
        verified = true;
        // Remove used backup code
        user.backupCodes.splice(index, 1);
      }
    }

    if (!verified) {
      return res.status(401).json({ message: 'Invalid OTP or backup code' });
    }

    // Generate session token (temporary, for final login step)
    const jwt = require('jsonwebtoken');
    const tempToken = jwt.sign(
      { id: user.id, email: user.email, verified2FA: true },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '5m' } // Short lived token
    );

    res.json({ token: tempToken, message: '2FA verified' });
  } catch (error) {
    console.error('2FA login error:', error);
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
});

/**
 * POST /api/2fa/send-email-otp
 * Send OTP via email for login verification
 */
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = inMemoryDB.users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { otp, expiresAt, hash } = twoFactorService.generateEmailOTP();

    // Store OTP temporarily
    user.emailOTP = hash;
    user.emailOTPExpires = expiresAt;

    // Send email
    await notificationService.sendEmail(
      email,
      'Your Login OTP',
      `Your one-time password is: ${otp}\n\nThis code expires in 10 minutes.`
    );

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

/**
 * GET /api/2fa/status
 * Get 2FA status for current user
 */
router.get('/status', authMiddleware, (req, res) => {
  try {
    const user = inMemoryDB.users.get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      enabled: user.twoFactorEnabled || false,
      backupCodesRemaining: user.backupCodes ? user.backupCodes.length : 0,
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ message: 'Failed to get 2FA status' });
  }
});

/**
 * POST /api/2fa/regenerate-backup-codes
 * Regenerate backup codes
 */
router.post('/regenerate-backup-codes', authMiddleware, (req, res) => {
  try {
    const user = inMemoryDB.users.get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA not enabled' });
    }

    const backupCodes = twoFactorService.generateBackupCodes(10);
    user.backupCodes = backupCodes.map((code) => twoFactorService.hashBackupCode(code));

    res.json({
      backupCodes, // Show new codes to user
      message: 'Backup codes regenerated',
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({ message: 'Failed to regenerate backup codes' });
  }
});

module.exports = router;
