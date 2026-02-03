const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST) return { skipped: true };

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });

  return { sent: true };
};

const sendWhatsapp = async ({ to, message }) => {
  // تكامل واتساب اختياري عبر Webhook (مزود خارجي)
  if (!process.env.WHATSAPP_WEBHOOK_URL) return { skipped: true };

  const payload = {
    to,
    message,
    api_key: process.env.WHATSAPP_API_KEY
  };

  await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return { sent: true };
};

module.exports = { sendEmail, sendWhatsapp };
