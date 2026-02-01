const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Test route
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/files', require('./routes/files'));
  app.use('/api/departments', require('./routes/departments'));
  app.use('/api/lawyers', require('./routes/lawyers'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/statistics', require('./routes/statistics'));
  app.use('/api/clients', require('./routes/clients'));
  app.use('/api/stages', require('./routes/stages'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/invoices', require('./routes/invoices'));
} catch (error) {
  console.error('Error loading routes:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`✓ Test: http://localhost:${PORT}/test`);
  console.log(`✓ Login: http://localhost:${PORT}/api/auth/login`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
  });
});

module.exports = app;
