const express = require('express');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const templatesPath = path.join(__dirname, '..', 'templates', 'contract_templates.json');

const loadTemplates = () => JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

router.get('/', authMiddleware, async (req, res) => {
  try {
    const templates = loadTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to load templates' });
  }
});

router.post('/render', authMiddleware, async (req, res) => {
  try {
    const { template_id, variables } = req.body;
    const templates = loadTemplates();
    const template = templates.find(t => t.id === parseInt(template_id, 10));

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    let content = template.content;
    const vars = variables || {};
    Object.keys(vars).forEach((key) => {
      content = content.replaceAll(`{{${key}}}`, vars[key]);
    });

    res.json({ success: true, rendered: content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to render template' });
  }
});

module.exports = router;
