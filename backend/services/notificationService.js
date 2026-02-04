const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// ================== LEGACY EMAIL SUPPORT ==================

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

// ================== ADVANCED NOTIFICATION SERVICE (Firebase) ==================

class NotificationService {
  /**
   * Initialize Firebase Admin SDK
   */
  static initialize() {
    try {
      if (!admin.apps.length) {
        const serviceAccount = require('../config/firebase-service-account.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
      }
      console.log('✓ Firebase Admin SDK initialized');
      return admin;
    } catch (error) {
      console.error('✗ Firebase initialization error:', error);
      return null;
    }
  }

  /**
   * Send push notification to user device(s)
   */
  static async sendPushNotification(userId, notification) {
    try {
      const fcmTokens = [];

      if (fcmTokens.length === 0) {
        console.warn(`No FCM tokens for user ${userId}`);
        return { success: false, reason: 'no-devices' };
      }

      const message = {
        notification: {
          title: notification.title || 'Law Firm Task Management',
          body: notification.body || 'You have a new notification',
        },
        data: {
          type: notification.type || 'general',
          taskId: notification.taskId || '',
          userId: userId.toString(),
          timestamp: new Date().toISOString(),
        },
        webpush: {
          fcmOptions: {
            link: notification.link || '/',
          },
          headers: {
            TTL: '3600',
          },
        },
      };

      const results = await Promise.all(
        fcmTokens.map(async (token) => {
          try {
            return await admin.messaging().send({ ...message, token });
          } catch (error) {
            if (error.code === 'messaging/invalid-registration-token') {
              // Remove invalid token
            }
            return null;
          }
        })
      );

      const successful = results.filter((r) => r !== null).length;
      return { success: true, sent: successful, failed: fcmTokens.length - successful };
    } catch (error) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send multi-channel notification
   */
  static async sendMultiChannelNotification(userId, notification) {
    const results = { email: null, push: null, sms: null };

    try {
      if (notification.channels.includes('email')) {
        results.email = await sendEmail({
          to: notification.email,
          subject: notification.title,
          html: notification.body,
        });
      }

      if (notification.channels.includes('push')) {
        results.push = await this.sendPushNotification(userId, notification);
      }

      if (notification.channels.includes('sms')) {
        results.sms = await sendWhatsapp({
          to: notification.phone,
          message: notification.body,
        });
      }

      return results;
    } catch (error) {
      console.error('Multi-channel notification error:', error);
      return results;
    }
  }

  /**
   * Create in-app notification
   */
  static async createInAppNotification(userId, notification) {
    try {
      const inAppNotification = {
        id: Date.now().toString(),
        userId,
        title: notification.title,
        body: notification.body,
        type: notification.type || 'info',
        data: notification.data || {},
        read: false,
        actionUrl: notification.actionUrl || null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (notification.sendPush !== false) {
        await this.sendPushNotification(userId, notification);
      }

      return inAppNotification;
    } catch (error) {
      console.error('In-app notification error:', error);
      throw error;
    }
  }

  /**
   * Send topic-based notification (broadcast)
   */
  static async sendTopicNotification(topic, notification) {
    try {
      if (!admin.apps.length) {
        console.warn('Firebase not initialized');
        return { success: false };
      }

      const message = {
        notification: { title: notification.title, body: notification.body },
        data: notification.data || {},
        webpush: { fcmOptions: { link: notification.link || '/' } },
        topic,
      };

      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Topic notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule notification for later
   */
  static async scheduleNotification(userId, notification, scheduledFor) {
    try {
      return {
        id: Date.now().toString(),
        userId,
        ...notification,
        scheduledFor: new Date(scheduledFor).toISOString(),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Schedule notification error:', error);
      throw error;
    }
  }
}

module.exports = { sendEmail, sendWhatsapp, NotificationService };
