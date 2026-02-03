const { inMemoryDB } = require('../inMemoryDB');
const { isDbEnabled, query } = require('../db');
const { getClientIp } = require('../utils/security');

const shouldLog = (req) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

const auditTrail = (req, res, next) => {
  if (!shouldLog(req)) return next();

  res.on('finish', async () => {
    if (res.statusCode >= 400) return;

    const entity = req.baseUrl?.replace('/api/', '') || 'unknown';
    const userId = req.user?.id || null;
    const ip = getClientIp(req);
    const details = {
      path: req.originalUrl,
      method: req.method,
      params: req.params,
      body: req.body
    };

    try {
      if (isDbEnabled()) {
        await query(
          `INSERT INTO activity_logs (entity, entity_id, action, user_id, ip, details, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [entity, req.params?.id ? parseInt(req.params.id, 10) : null, req.method.toLowerCase(), userId, ip, details]
        );
      } else {
        const id = Math.max(...Array.from(inMemoryDB.activity_logs.keys()), 0) + 1;
        inMemoryDB.activity_logs.set(id, {
          id,
          entity,
          entity_id: req.params?.id ? parseInt(req.params.id, 10) : null,
          action: req.method.toLowerCase(),
          user_id: userId,
          ip,
          details,
          timestamp: new Date()
        });
      }
    } catch (error) {
      // Ignore audit failures
    }
  });

  next();
};

module.exports = { auditTrail };
