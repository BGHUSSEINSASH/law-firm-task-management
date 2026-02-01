const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Create lawyer
router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { user_id, specialization, max_tasks } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const newId = Math.max(...inMemoryDB.lawyers.keys(), 0) + 1;
    const newLawyer = {
      id: newId,
      user_id,
      specialization: specialization || 'متخصص عام',
      max_tasks: max_tasks || 10,
      assigned_tasks: 0,
      workload_percentage: 0,
      created_at: new Date()
    };

    inMemoryDB.lawyers.set(newId, newLawyer);

    res.status(201).json({
      success: true,
      message: 'Lawyer profile created successfully',
      lawyer: newLawyer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create lawyer profile' });
  }
});

// Get all lawyers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const lawyers = Array.from(inMemoryDB.lawyers.values()).map(lawyer => {
      const user = inMemoryDB.users.get(lawyer.user_id) || {};
      return {
        ...lawyer,
        full_name: user.full_name,
        email: user.email
      };
    }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

    res.json({
      success: true,
      lawyers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch lawyers' });
  }
});

// Get lawyer by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);

    if (!inMemoryDB.lawyers.has(lawyerId)) {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    const lawyer = inMemoryDB.lawyers.get(lawyerId);
    const user = inMemoryDB.users.get(lawyer.user_id) || {};

    res.json({
      success: true,
      lawyer: {
        ...lawyer,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch lawyer' });
  }
});

// Update lawyer
router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    const { specialization, max_tasks, workload_percentage } = req.body;

    if (!inMemoryDB.lawyers.has(lawyerId)) {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    const lawyer = inMemoryDB.lawyers.get(lawyerId);
    const updatedLawyer = {
      ...lawyer,
      specialization: specialization !== undefined ? specialization : lawyer.specialization,
      max_tasks: max_tasks !== undefined ? max_tasks : lawyer.max_tasks,
      workload_percentage: workload_percentage !== undefined ? workload_percentage : lawyer.workload_percentage
    };

    inMemoryDB.lawyers.set(lawyerId, updatedLawyer);

    res.json({
      success: true,
      message: 'Lawyer updated successfully',
      lawyer: updatedLawyer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update lawyer' });
  }
});

// Delete lawyer
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);

    if (!inMemoryDB.lawyers.has(lawyerId)) {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    inMemoryDB.lawyers.delete(lawyerId);

    res.json({
      success: true,
      message: 'Lawyer deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete lawyer' });
  }
});

module.exports = router;
