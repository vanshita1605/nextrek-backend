// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

// Middleware to validate express-validator results
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * ============ Notification APIs ============
 */

/**
 * Get all notifications with pagination
 * GET /api/notifications
 */
router.get('/', 
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isString(),
  query('isRead').optional().isBoolean(),
  handleValidationErrors,
  notificationController.getUserNotifications
);

/**
 * Get notification detail
 * GET /api/notifications/:notificationId
 */
router.get('/:notificationId',
  param('notificationId').isMongoId(),
  handleValidationErrors,
  notificationController.getNotificationDetail
);

/**
 * Get notifications by type
 * GET /api/notifications/type/:type
 */
router.get('/type/:type',
  param('type').isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  notificationController.getNotificationsByType
);

/**
 * Get unread count
 * GET /api/notifications/unread/count
 */
router.get('/unread/count',
  notificationController.getUnreadCount
);

/**
 * Get notification summary/stats
 * GET /api/notifications/stats/summary
 */
router.get('/stats/summary',
  notificationController.getNotificationSummary
);

/**
 * Create notification (internal/manual)
 * POST /api/notifications
 */
router.post('/',
  body('type').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'max']),
  body('relatedId').optional().isString(),
  body('action').optional().isString(),
  handleValidationErrors,
  notificationController.createNotification
);

/**
 * Mark single notification as read
 * PUT /api/notifications/:notificationId/read
 */
router.put('/:notificationId/read',
  param('notificationId').isMongoId(),
  handleValidationErrors,
  notificationController.markAsRead
);

/**
 * Mark all notifications as read
 * PUT /api/notifications/read/all
 */
router.put('/read/all', 
  notificationController.markAllAsRead
);

/**
 * Delete single notification
 * DELETE /api/notifications/:notificationId
 */
router.delete('/:notificationId',
  param('notificationId').isMongoId(),
  handleValidationErrors,
  notificationController.deleteNotification
);

/**
 * Delete all notifications
 * DELETE /api/notifications/clear/all
 */
router.delete('/clear/all',
  notificationController.deleteAllNotifications
);

/**
 * Send test notification
 * POST /api/notifications/test
 */
router.post('/test',
  body('type').optional().isString(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'max']),
  handleValidationErrors,
  notificationController.sendTestNotification
);

/**
 * ============ Device Management ============
 */

/**
 * Register device
 * POST /api/notifications/devices/register
 */
router.post('/devices/register',
  body('deviceId').isString().notEmpty(),
  body('fcmToken').isString().notEmpty(),
  body('deviceType').isIn(['ios', 'android', 'web']),
  body('deviceName').optional().isString(),
  body('osVersion').optional().isString(),
  body('appVersion').optional().isString(),
  body('brand').optional().isString(),
  body('model').optional().isString(),
  handleValidationErrors,
  notificationController.registerDevice
);

/**
 * Get user devices
 * GET /api/notifications/devices
 */
router.get('/devices', 
  notificationController.getUserDevices
);

/**
 * Unregister device
 * POST /api/notifications/devices/:deviceId/unregister
 */
router.post('/devices/:deviceId/unregister',
  param('deviceId').isString().notEmpty(),
  handleValidationErrors,
  notificationController.unregisterDevice
);

/**
 * Toggle device notifications
 * PUT /api/notifications/devices/:deviceId/toggle
 */
router.put('/devices/:deviceId/toggle',
  param('deviceId').isString().notEmpty(),
  body('enabled').isBoolean(),
  handleValidationErrors,
  notificationController.toggleDeviceNotifications
);

/**
 * ============ Preferences ============
 */

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
router.get('/preferences',
  notificationController.getPreferences
);

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
router.put('/preferences',
  body('globalNotifications').optional().isBoolean(),
  body('notificationTypes').optional().isObject(),
  body('quietHours').optional().isObject(),
  body('frequency').optional().isString(),
  handleValidationErrors,
  notificationController.updatePreferences
);

/**
 * Toggle notification type preference
 * PUT /api/notifications/preferences/toggle/:type
 */
router.put('/preferences/toggle/:type',
  param('type').isString().notEmpty(),
  body('enabled').isBoolean(),
  handleValidationErrors,
  notificationController.toggleNotificationType
);

/**
 * Set quiet hours
 * PUT /api/notifications/preferences/quiet-hours
 */
router.put('/preferences/quiet-hours',
  body('enabled').isBoolean(),
  body('startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('timezone').optional().isString(),
  body('allowHighPriority').optional().isBoolean(),
  handleValidationErrors,
  notificationController.setQuietHours
);

/**
 * ============ Alerts ============
 */

/**
 * Get alerts
 * GET /api/notifications/alerts
 */
router.get('/alerts',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean(),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('tripId').optional().isMongoId(),
  handleValidationErrors,
  notificationController.getAlerts
);

/**
 * Resolve alert
 * POST /api/notifications/alerts/:alertId/resolve
 */
router.post('/alerts/:alertId/resolve',
  param('alertId').isString().notEmpty(),
  handleValidationErrors,
  notificationController.resolveAlert
);

/**
 * Acknowledge alert
 * POST /api/notifications/alerts/:alertId/acknowledge
 */
router.post('/alerts/:alertId/acknowledge',
  param('alertId').isString().notEmpty(),
  handleValidationErrors,
  notificationController.acknowledgeAlert
);

module.exports = router;
