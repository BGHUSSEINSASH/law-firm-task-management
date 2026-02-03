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

module.exports = router;
