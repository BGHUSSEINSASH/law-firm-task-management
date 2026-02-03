const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
require('dotenv').config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';
const useCookies = process.env.USE_COOKIES === 'true';
const allowAllCors = process.env.CORS_ALLOW_ALL === 'true';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://law-firm07506050.web.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowAllCors || !isProduction) {
      return callback(null, true);
    }

    const allowList = [...defaultOrigins, ...allowedOrigins];
    if (allowList.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isProduction ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات كثيرة، حاول لاحقاً' }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use('/api', apiLimiter);

if (useCookies) {
  app.use(cookieParser());
  app.use(csrf({ cookie: true }));
  app.get('/api/auth/csrf', (req, res) => {
    res.json({ success: true, csrfToken: req.csrfToken() });
  });
}

// Test route
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Routes
try {
  app.use('/api/auth', authLimiter, require('./routes/auth'));
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
  app.use('/api/security', require('./routes/security'));
} catch (error) {
  console.error('Error loading routes:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.message === 'Not allowed by CORS'
    ? 403
    : (err.status || 500);

  console.error('Error:', err);
  res.status(statusCode).json({
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
