const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Get security audit logs (admin only)
router.get('/logs', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const logs = Array.from(inMemoryDB.activity_logs.values())
      .filter(l => l.type === 'security')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch security logs' });
  }
});

// Backup in-memory database (admin only)
router.get('/backup', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const data = {};
    Object.keys(inMemoryDB).forEach((key) => {
      const value = inMemoryDB[key];
      if (value instanceof Map) {
        data[key] = Array.from(value.entries());
      } else {
        data[key] = value;
      }
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create backup' });
  }
});

// Restore in-memory database (admin only)
router.post('/restore', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Backup data required' });
    }

    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        inMemoryDB[key] = new Map(value);
      } else {
        inMemoryDB[key] = value;
      }
    });

    res.json({ success: true, message: 'Backup restored' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to restore backup' });
  }
});

module.exports = router;
