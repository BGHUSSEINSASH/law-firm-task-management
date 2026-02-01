const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

// Get all invoices
router.get('/', authMiddleware, (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    let invoices = Array.from(inMemoryDB.invoices.values());

    // Filter by status if provided
    if (status && status !== 'all') {
      invoices = invoices.filter(i => i.status === status);
    }

    // Sort by creation date (newest first)
    invoices = invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ data: invoices, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      invoice_number,
      client_name,
      client_email,
      amount,
      description,
      due_date,
      status = 'pending'
    } = req.body;

    const id = inMemoryDB.invoices.size + 1;
    const invoice = {
      id,
      invoice_number,
      client_name,
      client_email,
      amount: parseFloat(amount),
      description,
      due_date,
      status,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    inMemoryDB.invoices.set(id, invoice);
    res.json({ data: invoice, success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update invoice
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const invoice = inMemoryDB.invoices.get(id);

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    const updated = {
      ...invoice,
      ...req.body,
      updated_at: new Date(),
      id: invoice.id
    };

    inMemoryDB.invoices.set(id, updated);
    res.json({ data: updated, success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = inMemoryDB.invoices.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    res.json({ message: 'تم حذف الفاتورة بنجاح', success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
