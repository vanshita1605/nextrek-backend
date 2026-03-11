// src/controllers/notificationController.js
const Notification = require('../models/Notification');
const NotificationAlert = require('../models/NotificationAlert');
const NotificationPreference = require('../models/NotificationPreference');
const UserDevice = require('../models/UserDevice');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const emailService = require('../utils/email');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', type } = req.query;

    let query = { userId: req.userId };

    if (status === 'read') {
      query.isRead = true;
    } else if (status === 'unread') {
      query.isRead = false;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message,
    });
  }
};

// Get notification detail
exports.getNotificationDetail = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify it belongs to the user
    if (notification.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this notification',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Get notification detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification detail',
      error: error.message,
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: error.message,
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message,
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.userId });

    res.json({
      success: true,
      message: 'All notifications deleted',
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications',
      error: error.message,
    });
  }
};

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
        inApp: true,
        budgetAlerts: true,
        tripUpdates: true,
        recommendedPlaces: true,
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message,
    });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const {
      email, sms, push, inApp, budgetAlerts, tripUpdates, recommendedPlaces,
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.notificationPreferences = {
      email: email !== undefined ? email : user.notificationPreferences?.email,
      sms: sms !== undefined ? sms : user.notificationPreferences?.sms,
      push: push !== undefined ? push : user.notificationPreferences?.push,
      inApp: inApp !== undefined ? inApp : user.notificationPreferences?.inApp,
      budgetAlerts: budgetAlerts !== undefined ? budgetAlerts : user.notificationPreferences?.budgetAlerts,
      tripUpdates: tripUpdates !== undefined ? tripUpdates : user.notificationPreferences?.tripUpdates,
      recommendedPlaces: recommendedPlaces !== undefined ? recommendedPlaces : user.notificationPreferences?.recommendedPlaces,
    };

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
};

// Get notification by type
exports.getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const notifications = await Notification.find({
      userId: req.userId,
      type,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({
      userId: req.userId,
      type,
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message,
    });
  }
};

// Create in-app notification (for internal use via service)
exports.createNotification = async (req, res) => {
  try {
    const { type, title, body, priority = 'medium', channel = 'in-app', relatedEntity } = req.body;
    const recipientId = req.userId;

    if (!type || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'type, title, and body are required',
      });
    }

    // Validate enum values
    const validTypes = ['budget_alert', 'safety_alert', 'packing_reminder', 'trip_invitation', 'expense_split', 'trip_update', 'review_response', 'system'];
    const validPriorities = ['high', 'medium', 'low'];
    const validChannels = ['email', 'sms', 'push', 'in-app'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
      });
    }

    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
      });
    }

    const notification = new Notification({
      recipientId,
      type,
      title,
      message: body,
      priority,
      channel,
      relatedEntity,
      read: false,
    });

    await notification.save();

    // Send via channel if email
    if (channel === 'email') {
      const user = await User.findById(recipientId);
      if (user?.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: title,
          html: `<p>${body}</p>`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message,
    });
  }
};

// Get notification summary (stats)
exports.getNotificationSummary = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId });

    const summary = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      byType: {},
      byChannel: {},
    };

    notifications.forEach((notification) => {
      summary.byType[notification.type] = (summary.byType[notification.type] || 0) + 1;
      notification.channels?.forEach((channel) => {
        summary.byChannel[channel] = (summary.byChannel[channel] || 0) + 1;
      });
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get summary',
      error: error.message,
    });
  }
};

// ============ Device Management (FCM) ============

/**
 * Register device for push notifications
 * POST /api/notifications/devices/register
 */
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, fcmToken, deviceType, deviceName, osVersion, appVersion, brand, model } =
      req.body;

    if (!deviceId || !fcmToken || !deviceType) {
      return res.status(400).json({
        success: false,
        message: 'deviceId, fcmToken, and deviceType are required',
      });
    }

    const result = await NotificationService.registerDevice(req.userId, {
      deviceId,
      fcmToken,
      deviceType,
      deviceName,
      osVersion,
      appVersion,
      brand,
      model,
    });

    res.json(result);
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error.message,
    });
  }
};

/**
 * Unregister device
 * POST /api/notifications/devices/:deviceId/unregister
 */
exports.unregisterDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await NotificationService.unregisterDevice(req.userId, deviceId);

    res.json(result);
  } catch (error) {
    console.error('Unregister device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister device',
      error: error.message,
    });
  }
};

/**
 * Get user devices
 * GET /api/notifications/devices
 */
exports.getUserDevices = async (req, res) => {
  try {
    const devices = await UserDevice.find({ userId: req.userId });

    res.json({
      success: true,
      devices,
      total: devices.length,
    });
  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error.message,
    });
  }
};

/**
 * Toggle notifications for device
 * PUT /api/notifications/devices/:deviceId/toggle
 */
exports.toggleDeviceNotifications = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { enabled } = req.body;

    const device = await UserDevice.findOneAndUpdate(
      { userId: req.userId, deviceId },
      { notificationsEnabled: enabled },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    res.json({
      success: true,
      message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
      device,
    });
  } catch (error) {
    console.error('Toggle device notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle notifications',
      error: error.message,
    });
  }
};

// ============ Notification Preferences ============

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.userId });

    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.userId });
      await preferences.save();
    }

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message,
    });
  }
};

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const updates = req.body;

    let preferences = await NotificationPreference.findOne({ userId: req.userId });

    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.userId });
    }

    Object.assign(preferences, updates);
    await preferences.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
};

/**
 * Toggle notification type
 * PUT /api/notifications/preferences/toggle/:type
 */
exports.toggleNotificationType = async (req, res) => {
  try {
    const { type } = req.params;
    const { enabled } = req.body;

    const pathKey = `notificationTypes.${type}.enabled`;

    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId: req.userId },
      { [pathKey]: enabled },
      { new: true }
    );

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferences not found',
      });
    }

    res.json({
      success: true,
      message: `${type} notifications ${enabled ? 'enabled' : 'disabled'}`,
      preferences,
    });
  } catch (error) {
    console.error('Toggle notification type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle notification type',
      error: error.message,
    });
  }
};

/**
 * Set quiet hours
 * PUT /api/notifications/preferences/quiet-hours
 */
exports.setQuietHours = async (req, res) => {
  try {
    const { enabled, startTime, endTime, timezone, allowHighPriority } = req.body;

    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          'quietHours.enabled': enabled,
          'quietHours.startTime': startTime,
          'quietHours.endTime': endTime,
          'quietHours.timezone': timezone,
          'quietHours.allowHighPriority': allowHighPriority,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Quiet hours updated',
      preferences,
    });
  } catch (error) {
    console.error('Set quiet hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set quiet hours',
      error: error.message,
    });
  }
};

// ============ Alerts ============

/**
 * Get alerts
 * GET /api/notifications/alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, severity, tripId } = req.query;

    let query = { userId: req.userId };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (severity) {
      query.severity = severity;
    }

    if (tripId) {
      query.tripId = tripId;
    }

    const skip = (page - 1) * limit;

    const alerts = await NotificationAlert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NotificationAlert.countDocuments(query);

    res.json({
      success: true,
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message,
    });
  }
};

/**
 * Resolve alert
 * POST /api/notifications/alerts/:alertId/resolve
 */
exports.resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await NotificationAlert.findOneAndUpdate(
      { alertId, userId: req.userId },
      {
        $set: {
          isActive: false,
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: req.userId,
        },
        $push: {
          acknowledgments: {
            userId: req.userId,
            acknowledgedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert resolved',
      alert,
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message,
    });
  }
};

/**
 * Acknowledge alert
 * POST /api/notifications/alerts/:alertId/acknowledge
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await NotificationAlert.findOneAndUpdate(
      { alertId, userId: req.userId },
      {
        $push: {
          acknowledgments: {
            userId: req.userId,
            acknowledgedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert acknowledged',
      alert,
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message,
    });
  }
};

/**
 * Send test notification
 * POST /api/notifications/test
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const { type = 'payment_pending', priority = 'high' } = req.body;

    const result = await NotificationService.createNotification(req.userId, {
      type,
      title: 'Test Notification',
      body: 'This is a test notification from Tripz',
      priority,
      image: 'https://via.placeholder.com/150',
      deepLink: '/trips',
      action: 'open_app',
    });

    res.json(result);
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
};
