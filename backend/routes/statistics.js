const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const tasks = Array.from(inMemoryDB.tasks.values());
    
    const stats = {
      pending_tasks: tasks.filter(t => t.status === 'pending').length,
      in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      overdue_tasks: tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length,
      total_tasks: tasks.length,
      total_departments: inMemoryDB.departments.size,
      total_lawyers: Array.from(inMemoryDB.users.values()).filter(u => u.role === 'lawyer').length
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// Get tasks by department
router.get('/tasks-by-department', authMiddleware, async (req, res) => {
  try {
    const tasksByDept = {};
    const tasks = Array.from(inMemoryDB.tasks.values());
    const departments = Array.from(inMemoryDB.departments.values());

    departments.forEach(dept => {
      tasksByDept[dept.id] = {
        name: dept.name,
        task_count: tasks.filter(t => t.department_id === dept.id).length
      };
    });

    const data = Object.values(tasksByDept).sort((a, b) => b.task_count - a.task_count);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// Get tasks by lawyer
router.get('/tasks-by-lawyer', authMiddleware, async (req, res) => {
  try {
    const tasksByLawyer = {};
    const tasks = Array.from(inMemoryDB.tasks.values());
    const users = Array.from(inMemoryDB.users.values()).filter(u => u.role === 'lawyer');

    users.forEach(user => {
      const assignedTasks = tasks.filter(t => t.assigned_to === user.id);
      tasksByLawyer[user.id] = {
        full_name: user.full_name,
        assigned_tasks: assignedTasks.length
      };
    });

    const data = Object.values(tasksByLawyer).sort((a, b) => b.assigned_tasks - a.assigned_tasks);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
