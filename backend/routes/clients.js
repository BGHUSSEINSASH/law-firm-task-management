const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Create client
router.post('/', authMiddleware, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, type } = req.body;

    if (!name || !contact_person) {
      return res.status(400).json({ success: false, message: 'Name and contact person required' });
    }

    const newId = Math.max(...inMemoryDB.clients.keys(), 0) + 1;
    const newClient = {
      id: newId,
      name,
      contact_person,
      email: email || null,
      phone: phone || null,
      address: address || null,
      type: type || 'individual',
      created_at: new Date()
    };

    inMemoryDB.clients.set(newId, newClient);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: newClient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create client' });
  }
});

// Get all clients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    let clients = Array.from(inMemoryDB.clients.values());

    if (type) {
      clients = clients.filter(c => c.type === type);
    }

    clients = clients.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    res.json({
      success: true,
      clients
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch clients' });
  }
});

// Get client by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);

    if (!inMemoryDB.clients.has(clientId)) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({
      success: true,
      client: inMemoryDB.clients.get(clientId)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch client' });
  }
});

// Update client
router.put('/:id', authMiddleware, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { name, contact_person, email, phone, address, type } = req.body;

    if (!inMemoryDB.clients.has(clientId)) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const client = inMemoryDB.clients.get(clientId);
    const updatedClient = {
      ...client,
      name: name !== undefined ? name : client.name,
      contact_person: contact_person !== undefined ? contact_person : client.contact_person,
      email: email !== undefined ? email : client.email,
      phone: phone !== undefined ? phone : client.phone,
      address: address !== undefined ? address : client.address,
      type: type !== undefined ? type : client.type
    };

    inMemoryDB.clients.set(clientId, updatedClient);

    res.json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);

    if (!inMemoryDB.clients.has(clientId)) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Check if client has tasks
    const tasks = Array.from(inMemoryDB.tasks.values());
    const hasActiveTasks = tasks.some(t => t.client_id === clientId && t.status !== 'completed');

    if (hasActiveTasks) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete client with active tasks' 
      });
    }

    inMemoryDB.clients.delete(clientId);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete client' });
  }
});

module.exports = router;
