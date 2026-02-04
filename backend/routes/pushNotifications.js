const express = require('express');
const router = express.Router();
const pushNotificationService = require('../services/pushNotificationService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   POST /api/notifications/push/send
 * @desc    Send push notification to a user
 * @access  Private (Admin/Manager)
 */
router.post('/push/send', authenticate, async (req, res) => {
  try {
    const { userId, deviceToken, title, body, data, imageUrl, deepLink, priority, sound } = req.body;

    if (!deviceToken || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Device token, title, and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      imageUrl,
      deepLink,
      priority: priority || 'high',
      sound: sound || 'default',
      userId,
      type: 'push',
      id: `${Date.now()}_${userId || 'unknown'}`
    };

    const result = await pushNotificationService.sendToDevice(deviceToken, notification);

    res.json(result);
  } catch (error) {
    logger.error('Send push notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send push notification'
    });
  }
});

/**
 * @route   POST /api/notifications/push/send-multiple
 * @desc    Send push notification to multiple devices
 * @access  Private (Admin/Manager)
 */
router.post('/push/send-multiple', authenticate, async (req, res) => {
  try {
    const { deviceTokens, title, body, data, imageUrl, deepLink } = req.body;

    if (!deviceTokens || !Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Device tokens array is required'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      imageUrl,
      deepLink,
      type: 'push-multiple'
    };

    const result = await pushNotificationService.sendToMultipleDevices(deviceTokens, notification);

    res.json(result);
  } catch (error) {
    logger.error('Send multiple push notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send push notifications'
    });
  }
});

/**
 * @route   POST /api/notifications/push/topic
 * @desc    Send push notification to a topic
 * @access  Private (Admin)
 */
router.post('/push/topic', authenticate, async (req, res) => {
  try {
    const { topic, title, body, data, imageUrl, deepLink } = req.body;

    if (!topic || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Topic, title, and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      imageUrl,
      deepLink,
      type: 'topic'
    };

    const result = await pushNotificationService.sendToTopic(topic, notification);

    res.json(result);
  } catch (error) {
    logger.error('Send topic notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send topic notification'
    });
  }
});

/**
 * @route   POST /api/notifications/push/subscribe
 * @desc    Subscribe device tokens to a topic
 * @access  Private
 */
router.post('/push/subscribe', authenticate, async (req, res) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Tokens array and topic are required'
      });
    }

    const result = await pushNotificationService.subscribeToTopic(tokens, topic);

    res.json(result);
  } catch (error) {
    logger.error('Subscribe to topic error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to topic'
    });
  }
});

/**
 * @route   POST /api/notifications/push/unsubscribe
 * @desc    Unsubscribe device tokens from a topic
 * @access  Private
 */
router.post('/push/unsubscribe', authenticate, async (req, res) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Tokens array and topic are required'
      });
    }

    const result = await pushNotificationService.unsubscribeFromTopic(tokens, topic);

    res.json(result);
  } catch (error) {
    logger.error('Unsubscribe from topic error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from topic'
    });
  }
});

/**
 * @route   POST /api/notifications/push/silent
 * @desc    Send silent notification for background sync
 * @access  Private
 */
router.post('/push/silent', authenticate, async (req, res) => {
  try {
    const { deviceToken, action, data } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        error: 'Device token is required'
      });
    }

    const result = await pushNotificationService.sendSilentNotification(deviceToken, {
      action: action || 'sync',
      ...data
    });

    res.json(result);
  } catch (error) {
    logger.error('Send silent notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send silent notification'
    });
  }
});

/**
 * @route   POST /api/notifications/push/action
 * @desc    Send notification with action buttons
 * @access  Private
 */
router.post('/push/action', authenticate, async (req, res) => {
  try {
    const { deviceToken, title, body, actions, category, data } = req.body;

    if (!deviceToken || !title || !body || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Device token, title, body, and actions are required'
      });
    }

    const notification = {
      title,
      body,
      actions,
      category: category || 'DEFAULT_CATEGORY',
      data: data || {},
      type: 'action'
    };

    const result = await pushNotificationService.sendActionNotification(deviceToken, notification);

    res.json(result);
  } catch (error) {
    logger.error('Send action notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send action notification'
    });
  }
});

/**
 * @route   GET /api/notifications/push/analytics
 * @desc    Get push notification analytics
 * @access  Private (Admin)
 */
router.get('/push/analytics', authenticate, async (req, res) => {
  try {
    const analytics = pushNotificationService.getAnalytics();
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * @route   POST /api/notifications/push/analytics/reset
 * @desc    Reset push notification analytics
 * @access  Private (Admin)
 */
router.post('/push/analytics/reset', authenticate, async (req, res) => {
  try {
    pushNotificationService.resetAnalytics();
    
    res.json({
      success: true,
      message: 'Analytics reset successfully'
    });
  } catch (error) {
    logger.error('Reset analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset analytics'
    });
  }
});

/**
 * @route   POST /api/notifications/device/register
 * @desc    Register device token for user
 * @access  Private
 */
router.post('/device/register', authenticate, async (req, res) => {
  try {
    const { deviceToken, platform, deviceInfo } = req.body;
    const userId = req.user.id;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        error: 'Device token is required'
      });
    }

    // TODO: Store device token in database
    // await DeviceToken.create({
    //   userId,
    //   token: deviceToken,
    //   platform: platform || 'unknown',
    //   deviceInfo: deviceInfo || {},
    //   lastUsed: new Date()
    // });

    logger.info(`Device token registered for user ${userId}`);

    res.json({
      success: true,
      message: 'Device token registered successfully'
    });
  } catch (error) {
    logger.error('Register device token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register device token'
    });
  }
});

/**
 * @route   DELETE /api/notifications/device/unregister
 * @desc    Unregister device token
 * @access  Private
 */
router.delete('/device/unregister', authenticate, async (req, res) => {
  try {
    const { deviceToken } = req.body;
    const userId = req.user.id;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        error: 'Device token is required'
      });
    }

    // TODO: Remove device token from database
    // await DeviceToken.destroy({
    //   where: { userId, token: deviceToken }
    // });

    logger.info(`Device token unregistered for user ${userId}`);

    res.json({
      success: true,
      message: 'Device token unregistered successfully'
    });
  } catch (error) {
    logger.error('Unregister device token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister device token'
    });
  }
});

module.exports = router;
