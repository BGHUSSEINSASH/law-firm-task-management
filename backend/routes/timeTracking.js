const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const inMemoryDB = require('../inMemoryDB');

// In-memory time logs storage
const timeLogs = new Map(); // taskId -> [logs]
const activeTimers = new Map(); // userId -> { taskId, startTime }

/**
 * POST /api/time-tracking/start
 * Start tracking time on a task
 */
router.post('/start', authMiddleware, (req, res) => {
  try {
    const { taskId, description } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const task = inMemoryDB.tasks.get(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if already tracking
    if (activeTimers.has(req.user.id)) {
      return res.status(400).json({ message: 'Already tracking time' });
    }

    const startTime = new Date();
    activeTimers.set(req.user.id, {
      taskId,
      startTime,
      description: description || '',
    });

    res.json({
      message: 'Time tracking started',
      startTime,
      taskId,
    });
  } catch (error) {
    console.error('Start time tracking error:', error);
    res.status(500).json({ message: 'Failed to start time tracking' });
  }
});

/**
 * POST /api/time-tracking/stop
 * Stop tracking time on a task
 */
router.post('/stop', authMiddleware, (req, res) => {
  try {
    const timer = activeTimers.get(req.user.id);
    if (!timer) {
      return res.status(400).json({ message: 'No active time tracking' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime - timer.startTime) / 1000); // in seconds
    const durationMinutes = (duration / 60).toFixed(2);

    const timeLog = {
      id: Math.random(),
      taskId: timer.taskId,
      user_id: req.user.id,
      startTime: timer.startTime,
      endTime,
      duration, // in seconds
      durationMinutes: parseFloat(durationMinutes),
      description: timer.description,
      date: new Date().toISOString().split('T')[0],
    };

    // Store time log
    if (!timeLogs.has(timer.taskId)) {
      timeLogs.set(timer.taskId, []);
    }
    timeLogs.get(timer.taskId).push(timeLog);

    // Activity log
    inMemoryDB.activityLogs.push({
      id: Math.random(),
      user_id: req.user.id,
      action: 'time_logged',
      entity: 'time_log',
      details: { taskId: timer.taskId, duration: durationMinutes },
      created_at: new Date().toISOString(),
    });

    // Remove timer
    activeTimers.delete(req.user.id);

    res.json({
      message: 'Time tracking stopped',
      timeLog,
    });
  } catch (error) {
    console.error('Stop time tracking error:', error);
    res.status(500).json({ message: 'Failed to stop time tracking' });
  }
});

/**
 * GET /api/time-tracking/active
 * Get active timer for current user
 */
router.get('/active', authMiddleware, (req, res) => {
  try {
    const timer = activeTimers.get(req.user.id);
    if (!timer) {
      return res.json({ active: false });
    }

    const elapsedSeconds = Math.floor((new Date() - timer.startTime) / 1000);

    res.json({
      active: true,
      taskId: timer.taskId,
      startTime: timer.startTime,
      elapsedSeconds,
      elapsedMinutes: (elapsedSeconds / 60).toFixed(2),
      description: timer.description,
    });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ message: 'Failed to get active timer' });
  }
});

/**
 * GET /api/time-tracking/task/:taskId
 * Get time logs for a task
 */
router.get('/task/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const logs = timeLogs.get(taskId) || [];

    // Calculate totals
    const totalSeconds = logs.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(2);

    res.json({
      logs,
      totalSeconds,
      totalMinutes: (totalSeconds / 60).toFixed(2),
      totalHours: parseFloat(totalHours),
    });
  } catch (error) {
    console.error('Get task time logs error:', error);
    res.status(500).json({ message: 'Failed to fetch time logs' });
  }
});

/**
 * GET /api/time-tracking/user/:userId
 * Get time logs for a user (for reporting)
 */
router.get('/user/:userId', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Collect all logs for user
    const userLogs = [];
    for (const taskLogs of timeLogs.values()) {
      const filtered = taskLogs.filter(
        (log) => log.user_id === parseInt(userId)
      );
      userLogs.push(...filtered);
    }

    // Filter by date if provided
    let filtered = userLogs;
    if (startDate) {
      filtered = filtered.filter((log) => log.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((log) => log.date <= endDate);
    }

    // Calculate totals
    const totalSeconds = filtered.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(2);

    // Group by date
    const byDate = {};
    filtered.forEach((log) => {
      if (!byDate[log.date]) {
        byDate[log.date] = [];
      }
      byDate[log.date].push(log);
    });

    res.json({
      logs: filtered,
      byDate,
      totalSeconds,
      totalHours: parseFloat(totalHours),
    });
  } catch (error) {
    console.error('Get user time logs error:', error);
    res.status(500).json({ message: 'Failed to fetch time logs' });
  }
});

/**
 * DELETE /api/time-tracking/:logId
 * Delete a time log
 */
router.delete('/:logId', authMiddleware, (req, res) => {
  try {
    const { logId } = req.params;

    // Find and delete log
    for (const [taskId, logs] of timeLogs.entries()) {
      const index = logs.findIndex((log) => log.id === parseInt(logId));
      if (index !== -1) {
        const log = logs[index];
        if (log.user_id !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized' });
        }

        logs.splice(index, 1);

        return res.json({ message: 'Time log deleted' });
      }
    }

    res.status(404).json({ message: 'Time log not found' });
  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({ message: 'Failed to delete time log' });
  }
});

/**
 * GET /api/time-tracking/report
 * Generate time tracking report
 */
router.get('/report', authMiddleware, (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let allLogs = [];
    for (const taskLogs of timeLogs.values()) {
      allLogs.push(...taskLogs);
    }

    // Filter by user if specified
    if (userId) {
      allLogs = allLogs.filter((log) => log.user_id === parseInt(userId));
    }

    // Filter by date range
    if (startDate) {
      allLogs = allLogs.filter((log) => log.date >= startDate);
    }
    if (endDate) {
      allLogs = allLogs.filter((log) => log.date <= endDate);
    }

    // Group by user and task
    const byUserTask = {};
    const byUser = {};

    allLogs.forEach((log) => {
      const key = `${log.user_id}-${log.taskId}`;
      if (!byUserTask[key]) {
        byUserTask[key] = {
          user_id: log.user_id,
          taskId: log.taskId,
          logs: [],
          totalHours: 0,
        };
      }
      byUserTask[key].logs.push(log);

      // Calculate totals
      const totalSeconds = byUserTask[key].logs.reduce(
        (sum, l) => sum + l.duration,
        0
      );
      byUserTask[key].totalHours = (totalSeconds / 3600).toFixed(2);

      // Group by user
      if (!byUser[log.user_id]) {
        byUser[log.user_id] = {
          user_id: log.user_id,
          logs: [],
          totalHours: 0,
        };
      }
      byUser[log.user_id].logs.push(log);

      const userTotalSeconds = byUser[log.user_id].logs.reduce(
        (sum, l) => sum + l.duration,
        0
      );
      byUser[log.user_id].totalHours = (userTotalSeconds / 3600).toFixed(2);
    });

    res.json({
      totalLogs: allLogs.length,
      byUser,
      byUserTask,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

module.exports = router;
