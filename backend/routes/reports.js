const express = require('express');
const PDFDocument = require('pdfkit');
const { authMiddleware, authorize } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');

const router = express.Router();

// PDF report for tasks
router.get('/tasks', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks-report.pdf"');
      res.send(pdfBuffer);
    });

    doc.fontSize(18).text('Tasks Report', { align: 'center' });
    doc.moveDown();

    const tasks = Array.from(inMemoryDB.tasks.values());
    tasks.forEach((task, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${task.task_code || ''} - ${task.title}`);
      doc.fontSize(10).text(`Status: ${task.status} | Priority: ${task.priority}`);
      doc.fontSize(10).text(`Due: ${task.due_date || 'N/A'}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

module.exports = router;
