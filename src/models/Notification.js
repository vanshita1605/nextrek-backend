// src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['budget_alert', 'safety_alert', 'packing_reminder', 'trip_invitation', 'expense_split', 'trip_update', 'review_response', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntity: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
    },
    data: mongoose.Schema.Types.Mixed,
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in-app'],
      default: 'in-app',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    actionUrl: String,
    sentTo: {
      email: Boolean,
      sms: Boolean,
      push: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
