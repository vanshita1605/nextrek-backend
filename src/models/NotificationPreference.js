// src/models/NotificationPreference.js
const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  globalNotifications: {
    type: Boolean,
    default: true,
  },
  notificationTypes: {
    tripInvitations: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    budgetAlerts: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    expenseUpdates: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
    },
    paymentReminders: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
    },
    activityReminders: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
    },
    weatherAlerts: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
    },
    safetyAlerts: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
    },
    promoDeals: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    bookingConfirmations: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
    },
    orderUpdates: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
    },
    messages: {
      enabled: { type: Boolean, default: true },
      channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: String, // HH:MM format
    endTime: String, // HH:MM format
    timezone: String,
    allowHighPriority: { type: Boolean, default: true },
  },
  doNotDisturb: {
    enabled: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
  },
  language: {
    type: String,
    default: 'en',
  },
  frequency: {
    type: String,
    enum: ['instant', 'hourly', 'daily', 'weekly', 'never'],
    default: 'instant',
  },
  batching: {
    enabled: { type: Boolean, default: false },
    maxNotificationsPerBatch: { type: Number, default: 5 },
    sendFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
