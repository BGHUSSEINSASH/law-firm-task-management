const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret || 'your-secret-key');
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    next();
  };
};

module.exports = { authMiddleware, authorize };
