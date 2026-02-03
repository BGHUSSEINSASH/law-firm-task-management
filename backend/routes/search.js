const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Advanced search (in-memory)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, entity } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const query = q.toLowerCase();

    const searchTasks = () => Array.from(inMemoryDB.tasks.values())
      .filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.task_code?.toLowerCase().includes(query)
      );

    const searchClients = () => Array.from(inMemoryDB.clients.values())
      .filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
      );

    const searchUsers = () => Array.from(inMemoryDB.users.values())
      .filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query)
      )
      .map(u => ({
        id: u.id,
        full_name: u.full_name,
        username: u.username,
        email: req.user?.role === 'admin' ? u.email : undefined,
        role: u.role
      }));

    let results = {};
    if (!entity || entity === 'all') {
      results = {
        tasks: searchTasks(),
        clients: searchClients(),
        users: searchUsers()
      };
    } else if (entity === 'tasks') {
      results = { tasks: searchTasks() };
    } else if (entity === 'clients') {
      results = { clients: searchClients() };
    } else if (entity === 'users') {
      results = { users: searchUsers() };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid entity' });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

module.exports = router;
