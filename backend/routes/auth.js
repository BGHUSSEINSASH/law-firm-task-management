const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB, initializeData, getUserByEmail } = require('../inMemoryDB');
const { createNotification } = require('./notifications');
const {
  getClientIp,
  getDeviceFingerprint,
  hashToken,
  encryptSensitive,
  passwordMeetsPolicy,
  logSecurityEvent
} = require('../utils/security');

const router = express.Router();

// Initialize data on startup
initializeData();

const getJwtSecret = () => process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || '15', 10);
const PASSWORD_ROTATION_DAYS = parseInt(process.env.PASSWORD_ROTATION_DAYS || '90', 10);
const ENABLE_CAPTCHA = process.env.ENABLE_CAPTCHA === 'true';
const CAPTCHA_THRESHOLD = parseInt(process.env.CAPTCHA_THRESHOLD || '3', 10);
const CAPTCHA_TEST_TOKEN = process.env.CAPTCHA_TEST_TOKEN || '123456';

const buildAccessToken = (payload) => {
  const jwtSecret = getJwtSecret();
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    return null;
  }
  return jwt.sign(
    { ...payload, type: 'access' },
    jwtSecret || 'your-secret-key',
    { expiresIn: ACCESS_TOKEN_TTL }
  );
};

const issueRefreshToken = (userId, deviceId, req) => {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const id = Math.max(...Array.from(inMemoryDB.refresh_tokens.keys()), 0) + 1;
  inMemoryDB.refresh_tokens.set(id, {
    id,
    user_id: userId,
    device_id: deviceId,
    token_hash: tokenHash,
    user_agent: req?.headers?.['user-agent'] || 'unknown',
    ip: getClientIp(req || {}),
    last_used_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    revoked_at: null
  });

  return token;
};

const rotateRefreshToken = (userId, deviceId, tokenHash, req) => {
  const existing = Array.from(inMemoryDB.refresh_tokens.values())
    .find(t => t.token_hash === tokenHash && t.user_id === userId && !t.revoked_at);

  if (existing) {
    existing.revoked_at = new Date().toISOString();
    inMemoryDB.refresh_tokens.set(existing.id, existing);
  }

  return issueRefreshToken(userId, deviceId, req);
};

const getIpAttempts = (ip) => inMemoryDB.login_attempts.get(ip) || { count: 0, last_attempt: null };
const recordFailedAttempt = (ip) => {
  const current = getIpAttempts(ip);
  const updated = { count: current.count + 1, last_attempt: new Date().toISOString() };
  inMemoryDB.login_attempts.set(ip, updated);
  return updated;
};

// Register
router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters'),
    body('role').trim().notEmpty().withMessage('Role required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { username, email, password, full_name, role, department_id } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!passwordMeetsPolicy(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password policy failed. Use upper/lowercase, number, symbol, min 10 chars.'
      });
    }

    if (getUserByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = Math.max(...inMemoryDB.users.keys(), 0) + 1;

    const newUser = {
      id: newUserId,
      email,
      password: hashedPassword,
      username,
      full_name,
      full_name_encrypted: encryptSensitive(full_name),
      email_encrypted: encryptSensitive(email),
      role,
      department_id: department_id || null,
      failed_login_attempts: 0,
      lock_until: null,
      last_login_at: null,
      password_changed_at: new Date(),
      known_devices: [],
      created_at: new Date()
    };

    inMemoryDB.users.set(newUserId, newUser);

    const token = buildAccessToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    if (!token) {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const deviceId = getDeviceFingerprint(req);
    const refreshToken = issueRefreshToken(newUser.id, deviceId, req);

    logSecurityEvent(inMemoryDB, {
      action: 'register',
      user_id: newUser.id,
      ip: getClientIp(req),
      device_id: deviceId
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      refresh_token: refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const ip = getClientIp(req);
    const ipAttempt = getIpAttempts(ip);

    if (ENABLE_CAPTCHA && ipAttempt.count >= CAPTCHA_THRESHOLD) {
      if (req.body.captcha_token !== CAPTCHA_TEST_TOKEN) {
        return res.status(429).json({
          success: false,
          message: 'CAPTCHA required'
        });
      }
    }

    const user = getUserByEmail(email);
    if (!user) {
      logSecurityEvent(inMemoryDB, {
        action: 'login_failed',
        reason: 'user_not_found',
        email,
        ip
      });
      recordFailedAttempt(ip);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'الحساب مقفل مؤقتاً بسبب محاولات فاشلة',
        lock_until: user.lock_until
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      user.last_failed_at = new Date().toISOString();
      recordFailedAttempt(ip);

      if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        user.lock_until = lockUntil.toISOString();
        user.failed_login_attempts = 0;
        logSecurityEvent(inMemoryDB, {
          action: 'account_locked',
          user_id: user.id,
          ip: getClientIp(req)
        });
      }

      inMemoryDB.users.set(user.id, user);
      logSecurityEvent(inMemoryDB, {
        action: 'login_failed',
        user_id: user.id,
        ip
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.failed_login_attempts = 0;
    user.lock_until = null;
    user.last_login_at = new Date().toISOString();

    const token = buildAccessToken({ id: user.id, email: user.email, role: user.role });
    if (!token) {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const deviceId = getDeviceFingerprint(req);
    if (!user.known_devices) {
      user.known_devices = [];
    }

    const isNewDevice = !user.known_devices.includes(deviceId);
    if (isNewDevice) {
      user.known_devices.push(deviceId);
      createNotification(
        user.id,
        'security',
        'تسجيل دخول من جهاز جديد',
        'تم تسجيل الدخول من جهاز/متصفح جديد على حسابك.',
        'high'
      );
    }

    const refreshToken = issueRefreshToken(user.id, deviceId, req);

    const passwordAgeDays = user.password_changed_at
      ? Math.floor((Date.now() - new Date(user.password_changed_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const passwordExpired = passwordAgeDays >= PASSWORD_ROTATION_DAYS;

    inMemoryDB.users.set(user.id, user);
    logSecurityEvent(inMemoryDB, {
      action: 'login_success',
      user_id: user.id,
      ip,
      device_id: deviceId,
      new_device: isNewDevice
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        must_change_password: passwordExpired
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const tokenHash = hashToken(refresh_token);
    const stored = Array.from(inMemoryDB.refresh_tokens.values())
      .find(t => t.token_hash === tokenHash && !t.revoked_at);

    if (!stored) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    if (new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }

    const user = inMemoryDB.users.get(stored.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const deviceId = getDeviceFingerprint(req);
    if (stored.device_id !== deviceId) {
      return res.status(401).json({ success: false, message: 'Device mismatch' });
    }

    stored.last_used_at = new Date().toISOString();
    inMemoryDB.refresh_tokens.set(stored.id, stored);

    const token = buildAccessToken({ id: user.id, email: user.email, role: user.role });
    if (!token) {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const newRefresh = rotateRefreshToken(user.id, deviceId, tokenHash, req);

    logSecurityEvent(inMemoryDB, {
      action: 'refresh_success',
      user_id: user.id,
      ip: getClientIp(req),
      device_id: deviceId
    });

    res.json({ success: true, token, refresh_token: newRefresh });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
});

// Logout (revoke refresh token)
router.post('/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const tokenHash = hashToken(refresh_token);
    const stored = Array.from(inMemoryDB.refresh_tokens.values())
      .find(t => t.token_hash === tokenHash && !t.revoked_at);

    if (stored) {
      stored.revoked_at = new Date().toISOString();
      inMemoryDB.refresh_tokens.set(stored.id, stored);
      logSecurityEvent(inMemoryDB, {
        action: 'logout',
        user_id: stored.user_id,
        ip: getClientIp(req),
        device_id: stored.device_id
      });
    }

    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Old and new password required' });
    }

    if (!passwordMeetsPolicy(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password policy failed. Use upper/lowercase, number, symbol, min 10 chars.'
      });
    }

    const user = inMemoryDB.users.get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(old_password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.password_changed_at = new Date().toISOString();
    inMemoryDB.users.set(user.id, user);

    logSecurityEvent(inMemoryDB, {
      action: 'password_changed',
      user_id: user.id,
      ip: getClientIp(req)
    });

    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// List sessions
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = Array.from(inMemoryDB.refresh_tokens.values())
      .filter(t => t.user_id === req.user.id && !t.revoked_at)
      .map(t => ({
        id: t.id,
        device_id: t.device_id,
        user_agent: t.user_agent,
        ip: t.ip,
        last_used_at: t.last_used_at,
        created_at: t.created_at,
        expires_at: t.expires_at
      }))
      .sort((a, b) => new Date(b.last_used_at) - new Date(a.last_used_at));

    res.json({ success: true, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// Revoke session
router.post('/sessions/revoke', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session id required' });
    }

    const session = inMemoryDB.refresh_tokens.get(parseInt(session_id, 10));
    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.revoked_at = new Date().toISOString();
    inMemoryDB.refresh_tokens.set(session.id, session);

    logSecurityEvent(inMemoryDB, {
      action: 'session_revoked',
      user_id: req.user.id,
      ip: getClientIp(req),
      device_id: session.device_id
    });

    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to revoke session' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = inMemoryDB.users.get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

module.exports = router;
