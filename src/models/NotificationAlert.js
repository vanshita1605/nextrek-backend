// src/models/NotificationAlert.js
const mongoose = require('mongoose');

const NotificationAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
  },
  alertType: {
    type: String,
    enum: [
      'budget_exceeded',
      'budget_warning',
      'payment_due',
      'payment_overdue',
      'activity_starting_soon',
      'activity_rescheduled',
      'weather_change',
      'dangerous_area',
      'flight_delay',
      'hotel_confirmation',
      'price_drop',
      'destination_alert',
      'document_expiry_warning',
      'device_offline',
      'unusual_activity',
      'custom_alert',
    ],
    required: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: Map,
    of: String,
  },
  condition: {
    metric: String, // e.g., 'budget', 'temperature', 'safety_rating'
    operator: String, // 'equals', 'gt', 'lt', 'gte', 'lte'
    threshold: String,
    currentValue: String,
  },
  triggerTime: {
    type: Date,
    default: Date.now,
  },
  nextCheckTime: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  acknowledgments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      acknowledgedAt: Date,
    },
  ],
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
  },
  recurrence: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['once', 'hourly', 'daily', 'weekly'] },
    nextOccurrence: Date,
    totalOccurrences: Number,
    occurrenceCount: { type: Number, default: 0 },
  },
  actions: [
    {
      action: String, // 'view_trip', 'reduce_budget', 'dismiss'
      label: String,
      metadata: Map,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

NotificationAlertSchema.index({ userId: 1, isActive: 1 });
NotificationAlertSchema.index({ tripId: 1, alertType: 1 });

module.exports = mongoose.model('NotificationAlert', NotificationAlertSchema);
