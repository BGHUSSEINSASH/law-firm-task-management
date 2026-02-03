const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorizePermission } = require('../middleware/permissions');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// Log activity helper
const logActivity = (taskId, action, userId, details = {}) => {
  const logId = Math.max(...inMemoryDB.activity_logs.keys(), 0) + 1;
  const log = {
    id: logId,
    task_id: taskId,
    action, // created, updated, approved_admin, approved_main_lawyer, approved_assigned_lawyer, status_changed, stage_changed
    user_id: userId,
    details,
    timestamp: new Date()
  };
  inMemoryDB.activity_logs.set(logId, log);
};

const getDefaultMainLawyerId = () => {
  const mainLawyer = Array.from(inMemoryDB.users.values()).find(
    (u) => u.username === 'lawyer1' || u.full_name?.includes('محام رئيسي')
  );
  if (mainLawyer) return mainLawyer.id;

  const anyLawyer = Array.from(inMemoryDB.users.values()).find((u) => u.role === 'lawyer');
  return anyLawyer?.id || null;
};

const buildApprovalFields = (createdBy) => ({
  approval_status: 'pending_admin',
  // الموافقات الإدارية
  admin_approvers: [createdBy], // الإداريون الذين يمكنهم الموافقة
  approved_by_admin: null, // معرف الإداري الذي وافق
  approved_at_admin: null,
  // الموافقات الأخرى
  approved_by_main_lawyer: null,
  approved_at_main_lawyer: null,
  approved_by_assigned_lawyer: null,
  approved_at_assigned_lawyer: null,
});

// Create task - صلاحية الإنشاء: الإداريون والمديرون فقط
router.post('/', authMiddleware, authorizePermission('tasks:create'), async (req, res) => {
  try {
    const { title, description, department_id, assigned_to, main_lawyer_id, priority, client_id, due_date } = req.body;

    if (!title || !department_id || !client_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!assigned_to) {
      return res.status(400).json({ success: false, message: 'المحامي المكلف مطلوب' });
    }

    const resolvedMainLawyerId = main_lawyer_id || getDefaultMainLawyerId();
    if (!resolvedMainLawyerId) {
      return res.status(400).json({ success: false, message: 'المحامي الرئيسي مطلوب' });
    }

    const newId = Math.max(...inMemoryDB.tasks.keys(), 0) + 1;
    
    // Generate task code: TSK-YYYY-XXX
    const year = new Date().getFullYear();
    const taskCode = `TSK-${year}-${String(newId).padStart(3, '0')}`;
    
    const newTask = {
      id: newId,
      task_code: taskCode,
      client_id,
      title,
      description,
      department_id,
      assigned_to: parseInt(assigned_to),
      main_lawyer_id: parseInt(resolvedMainLawyerId),
      main_lawyer_assigned_by: req.user.id, // من قام بتعيين المحامي الرئيسي
      priority: priority || 'medium',
      status: 'pending',
      stage_id: 1,
      progress: 0,
      created_by: req.user.id, // الإداري الذي أنشأ المهمة
      created_at: new Date(),
      due_date: due_date || null,
      completed_at: null,
      ...buildApprovalFields(req.user.id)
    };

    inMemoryDB.tasks.set(newId, newTask);
    logActivity(newId, 'created', req.user.id, { title, client_id, department_id, assigned_to, main_lawyer_id: resolvedMainLawyerId });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المهمة وتنتظر موافقة الإدارة ثم المحامي الرئيسي ثم المحامي المكلف',
      task: newTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

// Get all tasks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, department_id, assigned_to } = req.query;
    let tasks = Array.from(inMemoryDB.tasks.values());

    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    if (department_id) {
      tasks = tasks.filter(t => t.department_id === parseInt(department_id));
    }

    if (assigned_to) {
      tasks = tasks.filter(t => t.assigned_to === parseInt(assigned_to));
    }

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    if (!inMemoryDB.tasks.has(taskId)) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      task: inMemoryDB.tasks.get(taskId)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
});

// Update task - التحديثات وتعيين المحامي الرئيسي
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, status, assigned_to, priority, due_date, main_lawyer_id } = req.body;

    if (!inMemoryDB.tasks.has(taskId)) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = inMemoryDB.tasks.get(taskId);

    // فقط الإدارة أو مدير النظام أو الإداري الذي أنشأ المهمة يمكنهم تحديثها
    const isCreator = task.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'غير مصرح - فقط الإداري الذي أنشأ المهمة أو الإدارة يمكنهم تحديثها' 
      });
    }

    if (status && task.approval_status !== 'approved' && status !== 'pending') {
      return res.status(400).json({ success: false, message: 'لا يمكن تغيير حالة المهمة قبل اكتمال الموافقات' });
    }
    
    let updatedTask = {
      ...task,
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      due_date: due_date !== undefined ? due_date : task.due_date
    };

    // تعيين المحامي الرئيسي: فقط الإدارة يمكنها
    if (main_lawyer_id !== undefined && parseInt(main_lawyer_id) !== task.main_lawyer_id) {
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'غير مصرح - فقط الإدارة يمكنها تعيين المحامي الرئيسي' 
        });
      }
      updatedTask.main_lawyer_id = parseInt(main_lawyer_id);
      updatedTask.main_lawyer_assigned_by = req.user.id;
      updatedTask.approval_status = updatedTask.approved_by_admin ? 'pending_main_lawyer' : 'pending_admin';
      updatedTask.approved_by_main_lawyer = null;
      updatedTask.approved_at_main_lawyer = null;
      updatedTask.approved_by_assigned_lawyer = null;
      updatedTask.approved_at_assigned_lawyer = null;
    }

    if (assigned_to !== undefined && parseInt(assigned_to) !== task.assigned_to) {
      updatedTask.assigned_to = parseInt(assigned_to);
      updatedTask.approval_status = 'pending_assigned_lawyer';
      updatedTask.approved_by_assigned_lawyer = null;
      updatedTask.approved_at_assigned_lawyer = null;
    }

    if (status === 'completed' && task.status !== 'completed') {
      updatedTask.completed_at = new Date();
    }

    updatedTask.updated_at = new Date();

    inMemoryDB.tasks.set(taskId, updatedTask);
    logActivity(taskId, 'updated', req.user.id, { title, description, status, assigned_to, priority });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// موافقة الإدارة على المهمة - فقط الإداري الذي أنشأها
router.put('/:id/approve/admin', authMiddleware, async (req, res) => {
  try {
    // التحقق من أن المستخدم إداري
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح - موافقة الإدارة فقط' });
    }

    const taskId = parseInt(req.params.id);
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    if (task.approval_status !== 'pending_admin') {
      return res.status(400).json({ success: false, message: 'المهمة ليست في مرحلة موافقة الإدارة' });
    }

    // التحقق من أن هذا الإداري مسموح له بالموافقة (الإداري الذي أنشأ المهمة أو admin عام)
    const isCreator = task.created_by === req.user.id;
    const isMainAdmin = req.user.role === 'admin'; // admin عام يمكنه الموافقة على أي مهمة

    if (!isCreator && !isMainAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'غير مصرح - فقط الإداري الذي أنشأ المهمة أو مدير النظام يمكنهما الموافقة' 
      });
    }

    task.approval_status = 'pending_main_lawyer';
    task.approved_by_admin = req.user.id;
    task.approved_at_admin = new Date();
    task.updated_at = new Date();

    inMemoryDB.tasks.set(taskId, task);
    logActivity(taskId, 'approved_admin', req.user.id, { 
      approval_status: task.approval_status,
      approved_by_admin_name: req.user.full_name 
    });

    res.json({ 
      success: true, 
      message: `تمت موافقة الإدارة من قبل ${req.user.full_name} والآن تنتظر موافقة المحامي الرئيسي`, 
      task 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشلت الموافقة' });
  }
});

// موافقة المحامي الرئيسي - فقط المحامي الرئيسي المعين
router.put('/:id/approve/main-lawyer', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.approval_status !== 'pending_main_lawyer') {
      return res.status(400).json({ success: false, message: 'المهمة ليست في مرحلة موافقة المحامي الرئيسي' });
    }

    // التحقق من أن المحامي الرئيسي هو الذي عين من قبل الإدارة
    if (req.user.id !== task.main_lawyer_id) {
      return res.status(403).json({ success: false, message: 'غير مصرح - فقط المحامي الرئيسي المعين يمكنه الموافقة' });
    }

    task.approval_status = 'pending_assigned_lawyer';
    task.approved_by_main_lawyer = req.user.id;
    task.approved_at_main_lawyer = new Date();
    task.updated_at = new Date();

    inMemoryDB.tasks.set(taskId, task);
    logActivity(taskId, 'approved_main_lawyer', req.user.id, { approval_status: task.approval_status });

    res.json({ success: true, message: 'تمت موافقة المحامي الرئيسي والآن تنتظر موافقة المحامي المكلف', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to approve task' });
  }
});

// موافقة المحامي المكلف
router.put('/:id/approve/assigned-lawyer', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.approval_status !== 'pending_assigned_lawyer') {
      return res.status(400).json({ success: false, message: 'المهمة ليست في مرحلة موافقة المحامي المكلف' });
    }

    if (req.user.id !== task.assigned_to) {
      return res.status(403).json({ success: false, message: 'غير مصرح - المحامي المكلف فقط' });
    }

    task.approval_status = 'approved';
    task.approved_by_assigned_lawyer = req.user.id;
    task.approved_at_assigned_lawyer = new Date();
    task.updated_at = new Date();

    inMemoryDB.tasks.set(taskId, task);
    logActivity(taskId, 'approved_assigned_lawyer', req.user.id, { approval_status: task.approval_status });

    res.json({ success: true, message: 'تمت موافقة المحامي المكلف', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to approve task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    if (!inMemoryDB.tasks.has(taskId)) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    inMemoryDB.tasks.delete(taskId);
    logActivity(taskId, 'deleted', req.user.id, {});

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

// الحصول على المهام المعلقة للموافقة الإدارية
router.get('/pending/admin-approval', authMiddleware, async (req, res) => {
  try {
    // فقط الإداريون يمكنهم رؤية المهام المعلقة للموافقة
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'غير مصرح - فقط الإداريون يمكنهم رؤية المهام المعلقة للموافقة' 
      });
    }

    let tasks = Array.from(inMemoryDB.tasks.values()).filter(t => t.approval_status === 'pending_admin');

    // فقط المهام التي أنشأها هذا الإداري أو جميع المهام إذا كان superadmin
    const isMainAdmin = req.user.id === 1; // نفترض أن المدير الرئيسي لديه ID = 1
    if (!isMainAdmin) {
      tasks = tasks.filter(t => t.created_by === req.user.id);
    }

    const enrichedTasks = tasks.map(task => {
      const client = inMemoryDB.clients.get(task.client_id);
      const creator = inMemoryDB.users.get(task.created_by);
      const mainLawyer = inMemoryDB.users.get(task.main_lawyer_id);
      const assignedLawyer = inMemoryDB.users.get(task.assigned_to);

      return {
        ...task,
        client_name: client?.name || 'غير محدد',
        created_by_name: creator?.full_name || 'غير محدد',
        main_lawyer_name: mainLawyer?.full_name || 'غير محدد',
        assigned_lawyer_name: assignedLawyer?.full_name || 'غير محدد',
        can_approve: task.created_by === req.user.id || isMainAdmin
      };
    });

    res.json({
      success: true,
      count: enrichedTasks.length,
      tasks: enrichedTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل جلب المهام المعلقة' });
  }
});

// متابعة المهمة - فقط الإداري الذي أنشأها أو مدير النظام
router.post('/:id/follow-up', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { notes } = req.body;

    const task = inMemoryDB.tasks.get(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    // فقط الإداري الذي أنشأ المهمة أو مدير النظام (admin)
    const isCreator = task.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'غير مصرح - فقط الإداري الذي أنشأ المهمة أو مدير النظام يمكنهم متابعة هذه المهمة' 
      });
    }

    // إضافة سجل المتابعة
    const followUpId = Math.max(...(inMemoryDB.activity_logs ? Array.from(inMemoryDB.activity_logs.keys()) : [0]), 0) + 1;
    const followUpLog = {
      id: followUpId,
      task_id: taskId,
      action: 'follow_up',
      user_id: req.user.id,
      details: {
        notes: notes || 'متابعة دورية',
        followed_up_by: req.user.full_name,
        followed_up_at: new Date()
      },
      timestamp: new Date()
    };

    if (!inMemoryDB.activity_logs) {
      inMemoryDB.activity_logs = new Map();
    }
    inMemoryDB.activity_logs.set(followUpId, followUpLog);

    // تحديث آخر تاريخ متابعة للمهمة
    task.last_follow_up_by = req.user.id;
    task.last_follow_up_at = new Date();
    task.last_follow_up_notes = notes || 'متابعة دورية';
    inMemoryDB.tasks.set(taskId, task);

    res.json({
      success: true,
      message: 'تمت المتابعة بنجاح',
      follow_up: followUpLog,
      task: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشلت المتابعة' });
  }
});

// الحصول على المهام التي يمكن متابعتها من قبل المستخدم الحالي
router.get('/my-follow-ups', authMiddleware, async (req, res) => {
  try {
    let tasks = Array.from(inMemoryDB.tasks.values());
    
    // المهام التي أنشأها المستخدم أو جميع المهام إذا كان admin
    if (req.user.role !== 'admin') {
      tasks = tasks.filter(t => t.created_by === req.user.id);
    }

    const enrichedTasks = tasks.map(task => ({
      ...task,
      canFollowUp: task.created_by === req.user.id || req.user.role === 'admin',
      last_follow_up_info: {
        by: inMemoryDB.users.get(task.last_follow_up_by)?.full_name || 'لم يتم المتابعة',
        at: task.last_follow_up_at,
        notes: task.last_follow_up_notes
      }
    }));

    res.json({
      success: true,
      count: enrichedTasks.length,
      tasks: enrichedTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل جلب المهام' });
  }
});

// Get activity logs مع معلومات كاملة عن المستخدمين والشركات والأقسام
router.get('/logs/activity', authMiddleware, async (req, res) => {
  try {
    const { task_id } = req.query;
    
    let logs = Array.from(inMemoryDB.activity_logs.values());
    
    // Filter by task_id if provided
    if (task_id) {
      logs = logs.filter(log => log.task_id === parseInt(task_id));
    }
    
    // Enrich logs with full details
    const enrichedLogs = logs.map(log => {
      const task = inMemoryDB.tasks.get(log.task_id);
      const user = inMemoryDB.users.get(log.user_id);
      
      let client = null;
      let department = null;
      let assignedLawyer = null;
      let mainLawyer = null;
      
      if (task) {
        client = inMemoryDB.clients.get(task.client_id);
        department = inMemoryDB.departments.get(task.department_id);
        assignedLawyer = inMemoryDB.users.get(task.assigned_to);
        mainLawyer = inMemoryDB.users.get(task.main_lawyer_id);
      }
      
      return {
        id: log.id,
        task_id: log.task_id,
        task_code: task?.task_code || 'N/A',
        task_title: task?.title || 'مهمة محذوفة',
        action: log.action,
        action_ar: getActionArabic(log.action),
        timestamp: log.timestamp,
        user: {
          id: user?.id,
          name: user?.full_name || 'مستخدم محذوف',
          email: user?.email,
          role: user?.role,
          role_ar: getRoleArabic(user?.role)
        },
        client: {
          id: client?.id,
          name: client?.name || 'غير محدد'
        },
        department: {
          id: department?.id,
          name: department?.name || 'غير محدد'
        },
        assigned_lawyer: {
          id: assignedLawyer?.id,
          name: assignedLawyer?.full_name || 'غير محدد'
        },
        main_lawyer: {
          id: mainLawyer?.id,
          name: mainLawyer?.full_name || 'غير محدد'
        },
        details: log.details
      };
    });
    
    // Sort by timestamp descending (most recent first)
    enrichedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      count: enrichedLogs.length,
      logs: enrichedLogs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
});

// Helper function for Arabic action names
function getActionArabic(action) {
  const actions = {
    created: 'إنشاء المهمة',
    updated: 'تحديث المهمة',
    approved_admin: 'موافقة الإدارة',
    approved_main_lawyer: 'موافقة المحامي الرئيسي',
    approved_assigned_lawyer: 'موافقة المحامي المكلف',
    status_changed: 'تغيير الحالة',
    stage_changed: 'تغيير المرحلة',
    deleted: 'حذف المهمة'
  };
  return actions[action] || action;
}

// Helper function for Arabic role names
function getRoleArabic(role) {
  const roles = {
    admin: 'مدير',
    lawyer: 'محامي',
    department_head: 'رئيس قسم',
    client: 'عميل'
  };
  return roles[role] || role;
}

module.exports = router;
