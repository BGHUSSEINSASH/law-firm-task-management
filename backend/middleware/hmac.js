const crypto = require('crypto');

const verifyHmac = (req, res, next) => {
  const requireHmac = process.env.REQUIRE_HMAC === 'true';
  if (!requireHmac) {
    return next();
  }

  const secret = process.env.HMAC_SECRET || '';
  if (!secret) {
    return res.status(500).json({ success: false, message: 'HMAC secret not configured' });
  }

  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  if (!signature || !timestamp) {
    return res.status(401).json({ success: false, message: 'Missing signature headers' });
  }

  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (!requestTime || Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({ success: false, message: 'Stale request' });
  }

  const payload = JSON.stringify(req.body || {});
  const base = `${req.method}:${req.originalUrl}:${timestamp}:${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(base).digest('hex');

  if (expected !== signature) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  next();
};

module.exports = { verifyHmac };
