const express = require('express');
const router = express.Router();
const { inMemoryDB } = require('../inMemoryDB');
const { authMiddleware } = require('../middleware/auth');

// Get comprehensive statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const tasks = Array.from(inMemoryDB.tasks.values());
    const users = Array.from(inMemoryDB.users.values());
    const departments = Array.from(inMemoryDB.departments.values());
    const logs = Array.from(inMemoryDB.activity_logs.values());

    // Calculate statistics
    const stats = {
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        approved: tasks.filter(t => t.approval_status === 'approved').length,
        pendingApproval: tasks.filter(t => t.approval_status !== 'approved').length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
        approvalRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.approval_status === 'approved').length / tasks.length) * 100) : 0
      },
      users: {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        lawyers: users.filter(u => u.role === 'lawyer').length,
        departmentHeads: users.filter(u => u.role === 'department_head').length
      },
      departments: {
        total: departments.length,
        withTasks: departments.filter(d => tasks.some(t => t.department_id === d.id)).length
      },
      activities: {
        total: logs.length,
        created: logs.filter(l => l.action === 'created').length,
        updated: logs.filter(l => l.action === 'updated').length,
        approvals: logs.filter(l => l.action.includes('approved')).length,
        stageChanged: logs.filter(l => l.action === 'stage_changed').length
      },
      byDepartment: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        tasks: tasks.filter(t => t.department_id === dept.id).length,
        completed: tasks.filter(t => t.department_id === dept.id && t.status === 'completed').length,
        inProgress: tasks.filter(t => t.department_id === dept.id && t.status === 'in_progress').length,
        pending: tasks.filter(t => t.department_id === dept.id && t.status === 'pending').length
      })),
      byLawyer: users.filter(u => u.role === 'lawyer').map(lawyer => {
        const lawyerTasks = tasks.filter(t => t.assigned_to === lawyer.id);
        return {
          id: lawyer.id,
          name: lawyer.full_name,
          tasks: lawyerTasks.length,
          completed: lawyerTasks.filter(t => t.status === 'completed').length,
          inProgress: lawyerTasks.filter(t => t.status === 'in_progress').length,
          pending: lawyerTasks.filter(t => t.status === 'pending').length,
          approvals: logs.filter(l => l.user_id === lawyer.id && l.action.includes('approved')).length
        };
      })
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// Get dashboard summary
router.get('/dashboard-summary', authMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const tasks = Array.from(inMemoryDB.tasks.values());
    const logs = Array.from(inMemoryDB.activity_logs.values());

    // Get user-specific data
    const userTasks = user.role === 'admin' ? tasks : tasks.filter(t => 
      t.assigned_to === user.id || 
      t.main_lawyer_id === user.id || 
      t.created_by === user.id
    );

    const summary = {
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      },
      tasks: {
        myTasks: user.role === 'admin' ? tasks.length : userTasks.length,
        myCompleted: user.role === 'admin' ? tasks.filter(t => t.status === 'completed').length : userTasks.filter(t => t.status === 'completed').length,
        myPending: user.role === 'admin' ? tasks.filter(t => t.status === 'pending').length : userTasks.filter(t => t.status === 'pending').length,
        myHighPriority: user.role === 'admin' ? tasks.filter(t => t.priority === 'high').length : userTasks.filter(t => t.priority === 'high').length,
        myApprovals: user.role === 'admin' 
          ? tasks.filter(t => t.approval_status === 'pending_admin').length
          : tasks.filter(t => 
              (user.id === t.main_lawyer_id && t.approval_status === 'pending_main_lawyer') ||
              (user.id === t.assigned_to && t.approval_status === 'pending_assigned_lawyer')
            ).length
      },
      recentActivities: logs
        .filter(l => user.role === 'admin' || l.user_id === user.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(l => ({
          id: l.id,
          action: l.action,
          taskId: l.task_id,
          timestamp: l.timestamp
        }))
    };

    res.json({ success: true, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
  }
});

// Get performance metrics
router.get('/performance', authMiddleware, async (req, res) => {
  try {
    const tasks = Array.from(inMemoryDB.tasks.values());
    const logs = Array.from(inMemoryDB.activity_logs.values());

    // Calculate performance metrics
    const metrics = {
      taskMetrics: {
        averageTimeToComplete: calculateAverageTime(tasks),
        averageTimeToApproval: calculateAverageApprovalTime(tasks),
        overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
        taskVelocity: calculateTaskVelocity(logs)
      },
      approvalMetrics: {
        totalApprovals: logs.filter(l => l.action.includes('approved')).length,
        averageApprovalTime: calculateAverageApprovalTimeFromLogs(logs),
        bottlenecks: identifyApprovalBottlenecks(logs)
      },
      teamMetrics: {
        mostActiveUser: findMostActiveUser(logs),
        mostApprovedTasks: findMostApprovedTasks(tasks, logs),
        taskDistribution: calculateTaskDistribution(tasks)
      }
    };

    res.json({ success: true, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch performance metrics' });
  }
});

// Helper functions
function calculateAverageTime(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at && t.created_at);
  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, task) => {
    const time = new Date(task.completed_at) - new Date(task.created_at);
    return sum + time;
  }, 0);

  return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // days
}

function calculateAverageApprovalTime(tasks) {
  const approvedTasks = tasks.filter(t => 
    t.approval_status === 'approved' && 
    t.approved_at_admin && 
    t.created_at
  );
  
  if (approvedTasks.length === 0) return 0;

  const totalTime = approvedTasks.reduce((sum, task) => {
    const time = new Date(task.approved_at_admin) - new Date(task.created_at);
    return sum + time;
  }, 0);

  return Math.round(totalTime / approvedTasks.length / (1000 * 60 * 60 * 24)); // days
}

function calculateAverageApprovalTimeFromLogs(logs) {
  const approvalLogs = logs.filter(l => l.action.includes('approved'));
  if (approvalLogs.length === 0) return 0;
  return Math.round(approvalLogs.length / 7); // Approximation
}

function calculateTaskVelocity(logs) {
  const createdLogs = logs.filter(l => l.action === 'created');
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  return createdLogs.filter(l => new Date(l.timestamp) >= lastWeek).length;
}

function identifyApprovalBottlenecks(logs) {
  const approvalActions = {
    approved_admin: logs.filter(l => l.action === 'approved_admin').length,
    approved_main_lawyer: logs.filter(l => l.action === 'approved_main_lawyer').length,
    approved_assigned_lawyer: logs.filter(l => l.action === 'approved_assigned_lawyer').length
  };

  return approvalActions;
}

function findMostActiveUser(logs) {
  const userActivity = {};

  logs.forEach(log => {
    if (!userActivity[log.user_id]) {
      userActivity[log.user_id] = 0;
    }
    userActivity[log.user_id]++;
  });

  const mostActive = Object.entries(userActivity)
    .sort((a, b) => b[1] - a[1])[0];

  return mostActive ? { userId: mostActive[0], activities: mostActive[1] } : null;
}

function findMostApprovedTasks(tasks, logs) {
  const approvals = logs.filter(l => l.action.includes('approved'));
  const taskApprovalsMap = {};

  approvals.forEach(log => {
    if (!taskApprovalsMap[log.task_id]) {
      taskApprovalsMap[log.task_id] = 0;
    }
    taskApprovalsMap[log.task_id]++;
  });

  return Object.entries(taskApprovalsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([taskId, count]) => ({
      taskId: parseInt(taskId),
      approvalCount: count
    }));
}

function calculateTaskDistribution(tasks) {
  return {
    byStatus: {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    },
    byPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    }
  };
}

module.exports = router;
