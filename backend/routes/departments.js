const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Create department
router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name required' });
    }

    const newId = Math.max(...inMemoryDB.departments.keys(), 0) + 1;
    const newDepartment = {
      id: newId,
      name,
      description,
      created_at: new Date()
    };

    inMemoryDB.departments.set(newId, newDepartment);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: newDepartment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
});

// Get all departments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const departments = Array.from(inMemoryDB.departments.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// Update department
router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const departmentId = parseInt(req.params.id);

    if (!inMemoryDB.departments.has(departmentId)) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const department = inMemoryDB.departments.get(departmentId);
    const updatedDepartment = {
      ...department,
      name: name || department.name,
      description: description !== undefined ? description : department.description
    };

    inMemoryDB.departments.set(departmentId, updatedDepartment);

    res.json({
      success: true,
      message: 'Department updated successfully',
      department: updatedDepartment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);

    if (!inMemoryDB.departments.has(departmentId)) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    inMemoryDB.departments.delete(departmentId);

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

module.exports = router;
