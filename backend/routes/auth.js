const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB, initializeData, getUserByEmail } = require('../inMemoryDB');

const router = express.Router();

// Initialize data on startup
initializeData();

const getJwtSecret = () => process.env.JWT_SECRET;

// Register
router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
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
      role,
      department_id: department_id || null,
      created_at: new Date()
    };

    inMemoryDB.users.set(newUserId, newUser);

    const jwtSecret = getJwtSecret();
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      jwtSecret || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
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

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
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
    res.status(500).json({ success: false, message: 'Login failed' });
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
