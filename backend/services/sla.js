const { inMemoryDB } = require('../inMemoryDB');
const { createNotification } = require('../routes/notifications');

const SLA_CHECK_INTERVAL = parseInt(process.env.SLA_CHECK_INTERVAL_MINUTES || '10', 10);

const runSlaCheck = () => {
  const now = new Date();

  inMemoryDB.tasks.forEach((task, id) => {
    if (!task.due_date || task.status === 'completed') return;

    const dueDate = new Date(task.due_date);
    if (now > dueDate && !task.escalated_at) {
      task.escalated_at = now.toISOString();
      inMemoryDB.tasks.set(id, task);

      const targetUserId = task.created_by || task.main_lawyer_id || task.assigned_to;
      if (targetUserId) {
        createNotification(
          targetUserId,
          'sla',
          'تصعيد تلقائي للمهام',
          `المهمة ${task.task_code || task.title} تجاوزت الموعد النهائي وتم تصعيدها.`,
          'high'
        );
      }
    }
  });
};

const startSlaScheduler = () => {
  setInterval(runSlaCheck, SLA_CHECK_INTERVAL * 60 * 1000);
};

module.exports = { startSlaScheduler };
