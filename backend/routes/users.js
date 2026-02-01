const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Get all users
router.get('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const users = Array.from(inMemoryDB.users.values())
      .map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id: user.department_id,
        created_at: user.created_at
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!inMemoryDB.users.has(userId)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = inMemoryDB.users.get(userId);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id: user.department_id,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Get users by role
router.get('/role/:role', authMiddleware, async (req, res) => {
  try {
    const users = Array.from(inMemoryDB.users.values())
      .filter(u => u.role === req.params.role)
      .map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id: user.department_id,
        created_at: user.created_at
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

module.exports = router;
