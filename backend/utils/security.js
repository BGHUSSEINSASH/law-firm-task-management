const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const getDeviceFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const language = req.headers['accept-language'] || 'unknown';
  const ip = getClientIp(req);
  const raw = `${userAgent}|${language}|${ip}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getEncryptionKey = () => process.env.ENCRYPTION_KEY || '';

const encryptSensitive = (value) => {
  if (!value) return value;
  const key = getEncryptionKey();
  if (!key) return value;

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptSensitive = (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('enc:')) return value;
  const key = getEncryptionKey();
  if (!key) return value;

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) return value;

  const [, ivHex, tagHex, dataHex] = value.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
};

const passwordMeetsPolicy = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 10) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasLower && hasUpper && hasNumber && hasSymbol;
};

const logSecurityEvent = (inMemoryDB, payload) => {
  const id = Math.max(...Array.from(inMemoryDB.activity_logs.keys()), 0) + 1;
  const entry = {
    id,
    type: 'security',
    created_at: new Date().toISOString(),
    ...payload
  };
  inMemoryDB.activity_logs.set(id, entry);

  if (process.env.SECURITY_LOG_TO_FILE === 'true') {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync('security.log', line, { encoding: 'utf8' });
    } catch (err) {
      // ignore file logging errors
    }
  }

  if (process.env.SECURITY_WEBHOOK_URL) {
    try {
      const url = new URL(process.env.SECURITY_WEBHOOK_URL);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      req.on('error', () => {});
      req.write(JSON.stringify(entry));
      req.end();
    } catch (err) {
      // ignore webhook errors
    }
  }

  return entry;
};

module.exports = {
  getClientIp,
  getDeviceFingerprint,
  hashToken,
  encryptSensitive,
  decryptSensitive,
  passwordMeetsPolicy,
  logSecurityEvent
};
