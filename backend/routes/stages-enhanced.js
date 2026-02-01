const express = require('express');
const router = express.Router();
const { inMemoryDB } = require('../inMemoryDB');
const { authMiddleware, authorize } = require('../middleware/auth');

// Log activity helper
const logActivity = (action, userId, resource, resourceId, details = '') => {
  const logId = Math.max(...Array.from(inMemoryDB.activity_logs.keys()), 0) + 1;
  const log = {
    id: logId,
    action,
    user_id: userId,
    resource,
    resource_id: resourceId,
    details,
    timestamp: new Date()
  };
  inMemoryDB.activity_logs.set(logId, log);
};

// GET جميع المراحل مع البيانات المتكاملة
router.get('/api/stages', authMiddleware, async (req, res) => {
  try {
    const stages = Array.from(inMemoryDB.stages.values()).sort((a, b) => a.order - b.order);
    const tasks = Array.from(inMemoryDB.tasks.values());
    
    // حساب إحصائيات كل مرحلة
    const enrichedStages = stages.map(stage => {
      const stageTasks = tasks.filter(t => t.stage_id === stage.id);
      const approvedTasks = stageTasks.filter(t => t.approval_status === 'approved').length;
      const pendingTasks = stageTasks.filter(t => !t.approval_status || t.approval_status !== 'approved').length;
      
      return {
        ...stage,
        task_count: stageTasks.length,
        approved_count: approvedTasks,
        pending_count: pendingTasks,
        completion_percentage: stageTasks.length > 0 
          ? Math.round((approvedTasks / stageTasks.length) * 100)
          : 0
      };
    });

    res.json(enrichedStages);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المراحل', error: error.message });
  }
});

// GET مرحلة محددة مع التفاصيل الكاملة
router.get('/api/stages/:id', authMiddleware, async (req, res) => {
  try {
    const stage = inMemoryDB.stages.get(parseInt(req.params.id));
    if (!stage) {
      return res.status(404).json({ message: 'المرحلة غير موجودة' });
    }

    const tasks = Array.from(inMemoryDB.tasks.values()).filter(t => t.stage_id === parseInt(req.params.id));
    const approvalStats = {
      total: tasks.length,
      approved: tasks.filter(t => t.approved_by_admin && t.approved_by_main_lawyer && t.approved_by_assigned_lawyer).length,
      pending_admin: tasks.filter(t => !t.approved_by_admin).length,
      pending_main_lawyer: tasks.filter(t => !t.approved_by_main_lawyer).length,
      pending_assigned_lawyer: tasks.filter(t => !t.approved_by_assigned_lawyer).length
    };

    res.json({
      ...stage,
      tasks: tasks,
      approval_stats: approvalStats
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المرحلة', error: error.message });
  }
});

// POST إضافة مرحلة جديدة
router.post('/api/stages', authMiddleware, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const { name, order, color, description, requirements, approval_type } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'اسم المرحلة مطلوب' });
    }

    const newId = Math.max(...Array.from(inMemoryDB.stages.keys()), 0) + 1;
    const newStage = {
      id: newId,
      name,
      order: order || newId,
      color: color || '#E0E7FF',
      description: description || '',
      requirements: requirements || '',
      approval_type: approval_type || 'single',
      created_at: new Date(),
      created_by: req.user.id,
      is_active: true
    };

    inMemoryDB.stages.set(newId, newStage);
    
    logActivity('create_stage', req.user.id, 'stages', newId, `تم إنشاء مرحلة جديدة: ${name}`);

    res.status(201).json(newStage);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء المرحلة', error: error.message });
  }
});

// PUT تحديث مرحلة
router.put('/api/stages/:id', authMiddleware, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const stageId = parseInt(req.params.id);
    const stage = inMemoryDB.stages.get(stageId);
    if (!stage) {
      return res.status(404).json({ message: 'المرحلة غير موجودة' });
    }

    const { name, order, color, description, requirements, approval_type, is_active } = req.body;

    const updatedStage = {
      ...stage,
      name: name || stage.name,
      order: order || stage.order,
      color: color || stage.color,
      description: description || stage.description,
      requirements: requirements || stage.requirements,
      approval_type: approval_type || stage.approval_type,
      is_active: is_active !== undefined ? is_active : stage.is_active,
      updated_at: new Date(),
      updated_by: req.user.id
    };

    inMemoryDB.stages.set(stageId, updatedStage);

    logActivity('update_stage', req.user.id, 'stages', stageId, `تم تحديث المرحلة: ${name}`);

    res.json(updatedStage);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المرحلة', error: error.message });
  }
});

// DELETE حذف مرحلة
router.delete('/api/stages/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const stageId = parseInt(req.params.id);
    const tasks = Array.from(inMemoryDB.tasks.values()).filter(t => t.stage_id === stageId);
    if (tasks.length > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف مرحلة تحتوي على مهام' });
    }

    const stage = inMemoryDB.stages.get(stageId);
    inMemoryDB.stages.delete(stageId);

    logActivity('delete_stage', req.user.id, 'stages', stageId, `تم حذف المرحلة: ${stage.name}`);

    res.json({ message: 'تم حذف المرحلة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المرحلة', error: error.message });
  }
});

// PUT نقل مهمة بين المراحل
router.put('/api/stages/task/:taskId/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const stageId = parseInt(req.params.stageId);
    
    const task = inMemoryDB.tasks.get(taskId);
    if (!task) {
      return res.status(404).json({ message: 'المهمة غير موجودة' });
    }

    const targetStage = inMemoryDB.stages.get(stageId);
    if (!targetStage) {
      return res.status(404).json({ message: 'المرحلة المستهدفة غير موجودة' });
    }

    // التحقق من الموافقات المطلوبة قبل النقل
    if (targetStage.approval_type !== 'admin_only') {
      if (!task.approved_by_admin) {
        return res.status(400).json({ message: 'يجب الموافقة من الإدارة أولاً' });
      }
    }

    const stages = Array.from(inMemoryDB.stages.values()).sort((a, b) => a.order - b.order);
    const totalStages = stages.length;
    const stageOrder = stages.findIndex(s => s.id === stageId);
    const progress = Math.round(((stageOrder + 1) / totalStages) * 100);

    const updatedTask = {
      ...task,
      stage_id: stageId,
      progress: progress,
      status: stageOrder === totalStages - 1 ? 'completed' : 'in_progress',
      last_moved_at: new Date(),
      moved_by: req.user.id
    };

    inMemoryDB.tasks.set(taskId, updatedTask);

    logActivity('move_task', req.user.id, 'tasks', taskId, `نقل إلى مرحلة: ${targetStage.name}, التقدم: ${progress}%`);

    res.json({
      message: 'تم نقل المهمة بنجاح',
      task: updatedTask,
      stage: targetStage,
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في نقل المهمة', error: error.message });
  }
});

// GET جميع المهام في مرحلة محددة
router.get('/api/stages/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = Array.from(inMemoryDB.tasks.values()).filter(t => t.stage_id === parseInt(req.params.id));
    
    const enrichedTasks = tasks.map(task => ({
      ...task,
      approval_summary: {
        admin: task.approved_by_admin ? '✓ موافق' : '⏳ في الانتظار',
        main_lawyer: task.approved_by_main_lawyer ? '✓ موافق' : '⏳ في الانتظار',
        assigned_lawyer: task.approved_by_assigned_lawyer ? '✓ موافق' : '⏳ في الانتظار'
      }
    }));

    res.json(enrichedTasks);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب مهام المرحلة', error: error.message });
  }
});

// POST موافقة على مهمة من مرحلة
router.post('/api/stages/:stageId/tasks/:taskId/approve', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const task = inMemoryDB.tasks.get(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'المهمة غير موجودة' });
    }

    const updatedTask = { ...task };

    // تحديث حالة الموافقة بناءً على دور المستخدم
    if (req.user.role === 'admin') {
      updatedTask.approved_by_admin = true;
    } else if (req.user.role === 'lawyer') {
      if (task.assigned_lawyer_id === req.user.id) {
        updatedTask.approved_by_assigned_lawyer = true;
      } else {
        updatedTask.approved_by_main_lawyer = true;
      }
    }

    // إذا كانت جميع الموافقات موجودة، حدث حالة الموافقة
    if (updatedTask.approved_by_admin && updatedTask.approved_by_main_lawyer && updatedTask.approved_by_assigned_lawyer) {
      updatedTask.approval_status = 'approved';
    } else {
      updatedTask.approval_status = 'pending';
    }

    updatedTask.last_approved_at = new Date();
    updatedTask.approved_by = req.user.id;

    inMemoryDB.tasks.set(taskId, updatedTask);

    logActivity('approve_task', req.user.id, 'tasks', taskId, `موافقة على المهمة في المرحلة`);

    res.json({
      message: 'تمت الموافقة على المهمة',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الموافقة على المهمة', error: error.message });
  }
});

// GET إحصائيات شاملة للمراحل والموافقات
router.get('/api/stages-analytics/summary', authMiddleware, async (req, res) => {
  try {
    const stages = Array.from(inMemoryDB.stages.values());
    const tasks = Array.from(inMemoryDB.tasks.values());

    const summary = {
      total_stages: stages.length,
      total_tasks: tasks.length,
      approved_tasks: tasks.filter(t => t.approval_status === 'approved').length,
      pending_approval_tasks: tasks.filter(t => !t.approval_status || t.approval_status !== 'approved').length,
      completed_stages: stages.filter(s => {
        const stageTasks = tasks.filter(t => t.stage_id === s.id);
        return stageTasks.length > 0 && stageTasks.every(t => t.approval_status === 'approved');
      }).length,
      stages_data: stages.map(stage => {
        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
        return {
          id: stage.id,
          name: stage.name,
          task_count: stageTasks.length,
          approved_count: stageTasks.filter(t => t.approval_status === 'approved').length,
          pending_count: stageTasks.filter(t => !t.approval_status || t.approval_status !== 'approved').length,
          requirements: stage.requirements
        };
      })
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب إحصائيات المراحل', error: error.message });
  }
});

module.exports = router;
