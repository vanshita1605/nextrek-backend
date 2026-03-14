// src/services/notificationService.js
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const Notification = require('../models/Notification');
const NotificationAlert = require('../models/NotificationAlert');
const NotificationPreference = require('../models/NotificationPreference');
const UserDevice = require('../models/UserDevice');
const User = require('../models/User');

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class NotificationService {
  /**
   * Register device for push notifications
   */
  static async registerDevice(userId, deviceData) {
    try {
      let device = await UserDevice.findOne({
        userId,
        deviceId: deviceData.deviceId,
      });

      if (device) {
        // Update existing device
        device.fcmToken = deviceData.fcmToken;
        device.isActive = true;
        device.lastActive = new Date();
        if (deviceData.appVersion) device.appVersion = deviceData.appVersion;
      } else {
        // Create new device
        device = new UserDevice({
          userId,
          deviceId: deviceData.deviceId,
          fcmToken: deviceData.fcmToken,
          deviceType: deviceData.deviceType,
          deviceName: deviceData.deviceName,
          osVersion: deviceData.osVersion,
          appVersion: deviceData.appVersion,
          brand: deviceData.brand,
          model: deviceData.model,
          isActive: true,
          notificationsEnabled: true,
        });
      }

      await device.save();

      return {
        success: true,
        message: 'Device registered successfully',
        deviceId: device._id,
      };
    } catch (error) {
      console.error('Register device error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unregister device
   */
  static async unregisterDevice(userId, deviceId) {
    try {
      const device = await UserDevice.findOneAndUpdate(
        { userId, deviceId },
        { isActive: false, lastActive: new Date() },
        { new: true }
      );

      if (!device) {
        return { success: false, message: 'Device not found' };
      }

      return {
        success: true,
        message: 'Device unregistered successfully',
      };
    } catch (error) {
      console.error('Unregister device error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification via FCM
   */
  static async sendPushNotification(userId, notificationData, deviceFilter = {}) {
    try {
      const devices = await UserDevice.find({
        userId,
        isActive: true,
        notificationsEnabled: true,
        ...deviceFilter,
      });

      if (devices.length === 0) {
        return { success: false, message: 'No active devices found' };
      }

      const fcmTokens = devices.map(d => d.fcmToken);
      let successCount = 0;
      let failureCount = 0;
      const failedTokens = [];

      // Send to all devices
      for (const token of fcmTokens) {
        try {
          const message = {
            token,
            notification: {
              title: notificationData.title,
              body: notificationData.body,
              imageUrl: notificationData.image,
            },
            android: {
              priority: this.getPriority(notificationData.priority),
              notification: {
                title: notificationData.title,
                body: notificationData.body,
                sound: 'default',
                channelId: 'default_channel',
                icon: 'notification_icon',
                color: '#FF6B00',
                tag: notificationData.type,
              },
            },
            apns: {
              headers: {
                'apns-priority': this.getAPNSPriority(notificationData.priority),
              },
              payload: {
                aps: {
                  alert: {
                    title: notificationData.title,
                    body: notificationData.body,
                  },
                  sound: 'default',
                  badge: 1,
                  'custom-key': 'value',
                },
              },
            },
            webpush: {
              notification: {
                title: notificationData.title,
                body: notificationData.body,
                icon: notificationData.image || 'logo_icon.png',
              },
            },
            data: {
              action: notificationData.action || 'open_app',
              deepLink: notificationData.deepLink || '',
              relatedId: notificationData.relatedId || '',
              type: notificationData.type,
              ...notificationData.actionData,
            },
          };

          const response = await admin.messaging().send(message);
          successCount++;

          // Update notification record
          if (notificationData.notificationId) {
            await Notification.findByIdAndUpdate(notificationData.notificationId, {
              $set: {
                'channels.push.sent': true,
                'channels.push.sentAt': new Date(),
                'channels.push.status': 'sent',
                'channels.push.fcmMessageId': response,
              },
            });
          }
        } catch (error) {
          console.error(`Failed to send to token ${token}:`, error.message);
          failureCount++;
          failedTokens.push(token);

          // Mark invalid token as inactive
          if (
            error.code === 'messaging/invalid-argument' ||
            error.code === 'messaging/authentication-error'
          ) {
            await UserDevice.updateOne({ fcmToken: token }, { isActive: false });
          }
        }
      }

      return {
        success: true,
        successCount,
        failureCount,
        failedTokens,
        message: `Sent to ${successCount} device(s)`,
      };
    } catch (error) {
      console.error('Send push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(userId, emailData) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        return { success: false, message: 'User or email not found' };
      }

      const from = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@tripz.com';
      const msg = {
        to: user.email,
        from,
        subject: emailData.subject || emailData.title,
        html: this.generateEmailTemplate(emailData),
      };

      await sgMail.send(msg);

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('Send email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate email template
   */
  static generateEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${data.title}</h2>
            </div>
            <div class="content">
              <p>${data.body}</p>
              <p>${data.description || ''}</p>
              ${data.deepLink ? `<p><a href="${data.deepLink}" class="button">View Details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>Tripz - Your Travel Companion</p>
              <p><a href="${process.env.APP_URL}/settings/notifications">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Create notification with multi-channel support
   */
  static async createNotification(userId, notificationData) {
    try {
      // Get user preferences
      let preferences = await NotificationPreference.findOne({ userId });
      if (!preferences) {
        preferences = new NotificationPreference({ userId });
        await preferences.save();
      }

      // Check if global notifications are disabled
      if (!preferences.globalNotifications) {
        return { success: false, message: 'Notifications disabled by user' };
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        if (notificationData.priority !== 'max') {
          return { success: false, message: 'Quiet hours active' };
        }
      }

      // Generate notification ID
      const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create notification record
      const notification = new Notification({
        notificationId,
        userId,
        type: notificationData.type,
        title: notificationData.title,
        body: notificationData.body,
        description: notificationData.description,
        priority: notificationData.priority || 'normal',
        relatedTo: notificationData.relatedTo,
        relatedId: notificationData.relatedId,
        relatedModel: notificationData.relatedModel,
        image: notificationData.image,
        deepLink: notificationData.deepLink,
        action: notificationData.action,
        actionData: notificationData.actionData,
        channels: {
          inApp: { sent: true, sentAt: new Date() },
        },
        metadata: notificationData.metadata,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      await notification.save();

      // Determine which channels to use
      const channelsToUse = this.getChannelsForNotification(notificationData.type, preferences);

      // Send via push notification
      if (channelsToUse.push) {
        await this.sendPushNotification(userId, {
          ...notificationData,
          notificationId: notification._id,
        });
        notification.channels.push.sent = true;
        notification.channels.push.sentAt = new Date();
      }

      // Send via email
      if (channelsToUse.email) {
        const emailResult = await this.sendEmailNotification(userId, notificationData);
        if (emailResult.success) {
          notification.channels.email.sent = true;
          notification.channels.email.sentAt = new Date();
        }
      }

      // TODO: Send via SMS if enabled
      if (channelsToUse.sms) {
        // SMS implementation
        notification.channels.sms.sent = true;
        notification.channels.sms.sentAt = new Date();
      }

      await notification.save();

      return {
        success: true,
        notification,
        message: 'Notification created and sent',
      };
    } catch (error) {
      console.error('Create notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get channels for notification type
   */
  static getChannelsForNotification(notificationType, preferences) {
    const typeMap = {
      trip_invitation: 'tripInvitations',
      budget_alert: 'budgetAlerts',
      expense_added: 'expenseUpdates',
      payment_pending: 'paymentReminders',
      activity_reminder: 'activityReminders',
      weather_alert: 'weatherAlerts',
      safety_alert: 'safetyAlerts',
      deal_available: 'promoDeals',
      restaurant_booking: 'bookingConfirmations',
      order_status: 'orderUpdates',
      message_received: 'messages',
    };

    const prefType = typeMap[notificationType] || 'messages';
    const prefs = preferences.notificationTypes[prefType];

    return {
      push: prefs?.channels?.push !== false,
      email: prefs?.channels?.email !== false,
      sms: prefs?.channels?.sms !== false,
    };
  }

  /**
   * Check if in quiet hours
   */
  static isInQuietHours(preferences) {
    if (!preferences.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const startTime = preferences.quietHours.startTime;
    const endTime = preferences.quietHours.endTime;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Create alert notification
   */
  static async createAlert(userId, tripId, alertData) {
    try {
      const alertId = `ALERT-${tripId}-${Date.now()}`;

      const alert = new NotificationAlert({
        alertId,
        userId,
        tripId,
        alertType: alertData.alertType,
        severity: alertData.severity || 'medium',
        title: alertData.title,
        message: alertData.message,
        metadata: alertData.metadata,
        condition: alertData.condition,
        isActive: true,
        recurrence: alertData.recurrence || { enabled: false },
        actions: alertData.actions || [],
      });

      await alert.save();

      // Create notification from alert
      const notification = await this.createNotification(userId, {
        type: alertData.alertType,
        title: `Alert: ${alertData.title}`,
        body: alertData.message,
        priority: alertData.severity === 'critical' ? 'max' : 'high',
        relatedTo: 'trip',
        relatedId: tripId,
        relatedModel: 'Trip',
        action: 'open_trip',
        actionData: { tripId: tripId.toString() },
      });

      alert.notificationId = notification.notification?._id;
      await alert.save();

      return {
        success: true,
        alert,
        message: 'Alert created successfully',
      };
    } catch (error) {
      console.error('Create alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger notifications for budget exceeded
   */
  static async triggerBudgetAlert(tripId, currentSpend, budget, userId) {
    try {
      const percentageUsed = (currentSpend / budget) * 100;
      let alertType = null;

      if (percentageUsed >= 100) {
        alertType = 'budget_exceeded';
      } else if (percentageUsed >= 90) {
        alertType = 'budget_warning';
      }

      if (alertType) {
        return await this.createAlert(userId, tripId, {
          alertType,
          severity: alertType === 'budget_exceeded' ? 'high' : 'medium',
          title: `Budget ${alertType === 'budget_exceeded' ? 'Exceeded' : 'Warning'}`,
          message: `You have spent ₹${currentSpend} out of ₹${budget} (${percentageUsed.toFixed(1)}%)`,
          condition: {
            metric: 'budget',
            operator: alertType === 'budget_exceeded' ? 'gte' : 'gte',
            threshold: alertType === 'budget_exceeded' ? '100%' : '90%',
            currentValue: `${percentageUsed.toFixed(1)}%`,
          },
          actions: [
            { action: 'view_trip', label: 'View Trip' },
            { action: 'reduce_budget', label: 'Adjust Budget' },
          ],
        });
      }

      return { success: false, message: 'No alert needed' };
    } catch (error) {
      console.error('Trigger budget alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
        { new: true }
      );

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get priority for FCM
   */
  static getPriority(priority) {
    const priorityMap = {
      low: 'normal',
      normal: 'normal',
      high: 'high',
      max: 'high',
    };
    return priorityMap[priority] || 'normal';
  }

  /**
   * Get APNS priority
   */
  static getAPNSPriority(priority) {
    const priorityMap = {
      low: '1',
      normal: '10',
      high: '10',
      max: '10',
    };
    return priorityMap[priority] || '10';
  }
}

module.exports = NotificationService;
