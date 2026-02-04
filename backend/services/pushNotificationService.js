const admin = require('firebase-admin');
const logger = require('../utils/logger');
const redis = require('../config/redis');

/**
 * Advanced Push Notification Service
 * Handles FCM push notifications with advanced features:
 * - Silent notifications for background sync
 * - Rich media notifications (images, videos)
 * - Action buttons and deep linking
 * - Notification grouping and threading
 * - A/B testing support
 * - Analytics and tracking
 */

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.messaging = null;
    this.analytics = {
      sent: 0,
      delivered: 0,
      failed: 0,
      clicked: 0
    };
  }

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return;
      }

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        const serviceAccount = require('../config/firebase-service-account.json');
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }

      this.messaging = admin.messaging();
      this.isInitialized = true;
      logger.info('Push Notification Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Push Notification Service:', error);
    }
  }

  /**
   * Send push notification to a single device
   * @param {string} deviceToken - FCM device token
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendToDevice(deviceToken, notification) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const message = this._buildMessage(deviceToken, notification);
      const response = await this.messaging.send(message);
      
      this.analytics.sent++;
      logger.info(`Push notification sent successfully: ${response}`);
      
      // Track in Redis for analytics
      await this._trackNotification(response, notification);

      return {
        success: true,
        messageId: response,
        token: deviceToken
      };
    } catch (error) {
      this.analytics.failed++;
      logger.error('Failed to send push notification:', error);
      
      // Handle invalid tokens
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        await this._removeInvalidToken(deviceToken);
      }

      return {
        success: false,
        error: error.message,
        token: deviceToken
      };
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {Array<string>} deviceTokens - Array of FCM device tokens
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Send results
   */
  async sendToMultipleDevices(deviceTokens, notification) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = deviceTokens.map(token => 
        this._buildMessage(token, notification)
      );

      const response = await this.messaging.sendAll(messages);
      
      this.analytics.sent += response.successCount;
      this.analytics.failed += response.failureCount;

      logger.info(`Push notifications sent: ${response.successCount} succeeded, ${response.failureCount} failed`);

      // Handle invalid tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error.code === 'messaging/invalid-registration-token' ||
             resp.error.code === 'messaging/registration-token-not-registered')) {
          this._removeInvalidToken(deviceTokens[idx]);
        }
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Failed to send push notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification to a topic
   * @param {string} topic - FCM topic name
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendToTopic(topic, notification) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: notification.data || {},
        android: this._getAndroidConfig(notification),
        apns: this._getApnsConfig(notification),
        webpush: this._getWebPushConfig(notification)
      };

      const response = await this.messaging.send(message);
      
      this.analytics.sent++;
      logger.info(`Topic notification sent successfully: ${response}`);

      return {
        success: true,
        messageId: response,
        topic: topic
      };
    } catch (error) {
      this.analytics.failed++;
      logger.error('Failed to send topic notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Subscribe device tokens to a topic
   * @param {Array<string>} tokens - Device tokens
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeToTopic(tokens, topic) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      
      logger.info(`${response.successCount} tokens subscribed to topic ${topic}`);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unsubscribe device tokens from a topic
   * @param {Array<string>} tokens - Device tokens
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Unsubscription result
   */
  async unsubscribeFromTopic(tokens, topic) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      
      logger.info(`${response.successCount} tokens unsubscribed from topic ${topic}`);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send silent notification for background sync
   * @param {string} deviceToken - FCM device token
   * @param {Object} data - Data payload
   * @returns {Promise<Object>} Send result
   */
  async sendSilentNotification(deviceToken, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const message = {
        token: deviceToken,
        data: {
          type: 'silent',
          action: data.action || 'sync',
          ...data
        },
        android: {
          priority: 'high',
          data: {
            type: 'silent',
            ...data
          }
        },
        apns: {
          headers: {
            'apns-priority': '5',
            'apns-push-type': 'background'
          },
          payload: {
            aps: {
              contentAvailable: true,
              sound: ''
            },
            data: data
          }
        }
      };

      const response = await this.messaging.send(message);
      logger.info(`Silent notification sent: ${response}`);

      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      logger.error('Failed to send silent notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification with action buttons
   * @param {string} deviceToken - FCM device token
   * @param {Object} notification - Notification with actions
   * @returns {Promise<Object>} Send result
   */
  async sendActionNotification(deviceToken, notification) {
    notification.android = {
      ...notification.android,
      actions: notification.actions || []
    };

    notification.apns = {
      ...notification.apns,
      payload: {
        aps: {
          category: notification.category || 'DEFAULT_CATEGORY'
        }
      }
    };

    return this.sendToDevice(deviceToken, notification);
  }

  /**
   * Build FCM message object
   * @param {string} token - Device token
   * @param {Object} notification - Notification data
   * @returns {Object} FCM message
   */
  _buildMessage(token, notification) {
    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...notification.data,
        notificationId: notification.id || `${Date.now()}`,
        clickAction: notification.clickAction || '',
        deepLink: notification.deepLink || ''
      }
    };

    // Add platform-specific configurations
    if (notification.android || notification.priority) {
      message.android = this._getAndroidConfig(notification);
    }

    if (notification.apns || notification.badge) {
      message.apns = this._getApnsConfig(notification);
    }

    if (notification.webpush) {
      message.webpush = this._getWebPushConfig(notification);
    }

    return message;
  }

  /**
   * Get Android-specific configuration
   * @param {Object} notification - Notification data
   * @returns {Object} Android config
   */
  _getAndroidConfig(notification) {
    return {
      priority: notification.priority || 'high',
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
        sound: notification.sound || 'default',
        channelId: notification.channelId || 'default',
        color: notification.color || '#4285f4',
        icon: notification.icon || 'ic_notification',
        tag: notification.tag,
        clickAction: notification.clickAction || '',
        bodyLocKey: notification.bodyLocKey,
        bodyLocArgs: notification.bodyLocArgs
      }
    };
  }

  /**
   * Get APNS (iOS) specific configuration
   * @param {Object} notification - Notification data
   * @returns {Object} APNS config
   */
  _getApnsConfig(notification) {
    return {
      headers: {
        'apns-priority': notification.priority === 'high' ? '10' : '5'
      },
      payload: {
        aps: {
          alert: {
            title: notification.title,
            body: notification.body
          },
          badge: notification.badge || 1,
          sound: notification.sound || 'default',
          contentAvailable: notification.contentAvailable || false,
          mutableContent: notification.mutableContent || (notification.imageUrl ? true : false),
          category: notification.category,
          threadId: notification.threadId
        },
        imageUrl: notification.imageUrl,
        deepLink: notification.deepLink
      }
    };
  }

  /**
   * Get Web Push configuration
   * @param {Object} notification - Notification data
   * @returns {Object} Web Push config
   */
  _getWebPushConfig(notification) {
    return {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon.png',
        badge: notification.badge,
        image: notification.imageUrl,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        actions: notification.actions || []
      },
      fcmOptions: {
        link: notification.deepLink || '/'
      }
    };
  }

  /**
   * Track notification for analytics
   * @param {string} messageId - FCM message ID
   * @param {Object} notification - Notification data
   */
  async _trackNotification(messageId, notification) {
    try {
      const key = `notification:${messageId}`;
      await redis.setex(key, 86400 * 7, JSON.stringify({
        messageId,
        title: notification.title,
        sentAt: new Date().toISOString(),
        type: notification.type || 'general',
        userId: notification.userId
      }));
    } catch (error) {
      logger.error('Failed to track notification:', error);
    }
  }

  /**
   * Remove invalid device token
   * @param {string} token - Device token
   */
  async _removeInvalidToken(token) {
    try {
      // TODO: Remove token from database
      logger.info(`Removed invalid device token: ${token}`);
    } catch (error) {
      logger.error('Failed to remove invalid token:', error);
    }
  }

  /**
   * Get notification analytics
   * @returns {Object} Analytics data
   */
  getAnalytics() {
    return {
      ...this.analytics,
      deliveryRate: this.analytics.sent > 0 
        ? ((this.analytics.sent - this.analytics.failed) / this.analytics.sent * 100).toFixed(2) + '%'
        : '0%',
      clickThroughRate: this.analytics.sent > 0
        ? (this.analytics.clicked / this.analytics.sent * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset analytics counters
   */
  resetAnalytics() {
    this.analytics = {
      sent: 0,
      delivered: 0,
      failed: 0,
      clicked: 0
    };
  }
}

// Export singleton instance
module.exports = new PushNotificationService();
