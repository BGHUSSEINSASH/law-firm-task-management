const express = require('express');
const PDFDocument = require('pdfkit');
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

const buildDateRange = (dateRange) => {
  const now = new Date();
  if (dateRange === 'all') return null;

  const start = new Date(now);
  if (dateRange === 'week') {
    start.setDate(now.getDate() - 7);
  } else if (dateRange === 'month') {
    start.setMonth(now.getMonth() - 1);
  } else if (dateRange === 'quarter') {
    start.setMonth(now.getMonth() - 3);
  } else if (dateRange === 'year') {
    start.setFullYear(now.getFullYear() - 1);
  }
  return { start, end: now };
};

const filterTasks = (tasks, status, dateRange) => {
  let filtered = tasks;
  if (status && status !== 'all') {
    if (status === 'overdue') {
      filtered = filtered.filter(
        t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      );
    } else {
      filtered = filtered.filter(t => t.status === status);
    }
  }

  const range = buildDateRange(dateRange);
  if (range) {
    filtered = filtered.filter(t => {
      const created = t.created_at ? new Date(t.created_at) : null;
      return created && created >= range.start && created <= range.end;
    });
  }

  return filtered;
};

const sendPdf = (res, title, builder) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
    res.send(pdfBuffer);
  });

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  builder(doc);
  doc.end();
};

// Unified PDF report generator
router.get('/generate', authMiddleware, async (req, res) => {
  try {
    const { type = 'tasks', status = 'all', dateRange = 'week' } = req.query;
    const tasks = Array.from(inMemoryDB.tasks.values());
    const filteredTasks = filterTasks(tasks, status, dateRange);

    if (type === 'tasks') {
      return sendPdf(res, 'tasks-report', (doc) => {
        filteredTasks.forEach((task, idx) => {
          doc.fontSize(12).text(`${idx + 1}. ${task.task_code || ''} - ${task.title}`);
          doc.fontSize(10).text(`Status: ${task.status} | Priority: ${task.priority}`);
          doc.fontSize(10).text(`Due: ${task.due_date || 'N/A'}`);
          doc.moveDown();
        });
      });
    }

    if (type === 'performance') {
      return sendPdf(res, 'performance-report', (doc) => {
        const completed = filteredTasks.filter(t => t.status === 'completed').length;
        const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
        const pending = filteredTasks.filter(t => t.status === 'pending').length;
        const total = filteredTasks.length;

        doc.fontSize(12).text(`Total Tasks: ${total}`);
        doc.fontSize(12).text(`Completed: ${completed}`);
        doc.fontSize(12).text(`In Progress: ${inProgress}`);
        doc.fontSize(12).text(`Pending: ${pending}`);
      });
    }

    if (type === 'sla') {
      return sendPdf(res, 'sla-report', (doc) => {
        const overdue = filteredTasks.filter(
          t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        ).length;
        const total = filteredTasks.length;
        const compliance = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

        doc.fontSize(12).text(`Total Tasks: ${total}`);
        doc.fontSize(12).text(`Overdue: ${overdue}`);
        doc.fontSize(12).text(`SLA Compliance: ${compliance}%`);
      });
    }

    if (type === 'revenue') {
      return sendPdf(res, 'revenue-report', (doc) => {
        const invoices = Array.from(inMemoryDB.invoices.values());
        const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
        doc.fontSize(12).text(`Invoices: ${invoices.length}`);
        doc.fontSize(12).text(`Total Revenue: ${totalRevenue}`);
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid report type' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// PDF report for tasks
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = Array.from(inMemoryDB.tasks.values());
    return sendPdf(res, 'tasks-report', (doc) => {
      tasks.forEach((task, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${task.task_code || ''} - ${task.title}`);
        doc.fontSize(10).text(`Status: ${task.status} | Priority: ${task.priority}`);
        doc.fontSize(10).text(`Due: ${task.due_date || 'N/A'}`);
        doc.moveDown();
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

module.exports = router;
