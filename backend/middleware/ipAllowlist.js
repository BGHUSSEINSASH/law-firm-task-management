const { getClientIp, logSecurityEvent } = require('../utils/security');
const { inMemoryDB } = require('../inMemoryDB');

const ipAllowlist = (req, res, next) => {
  const allowlist = (process.env.ALLOWED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    return next();
  }

  const ip = getClientIp(req);
  const allowed = allowlist.includes(ip);

  if (!allowed) {
    logSecurityEvent(inMemoryDB, {
      action: 'ip_blocked',
      ip,
      path: req.path
    });
    return res.status(403).json({ success: false, message: 'IP غير مسموح' });
  }

  next();
};

module.exports = { ipAllowlist };
