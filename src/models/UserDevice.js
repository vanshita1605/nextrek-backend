// src/models/UserDevice.js
const mongoose = require('mongoose');

const UserDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  fcmToken: {
    type: String,
    required: true,
    index: true,
  },
  deviceType: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true,
  },
  deviceName: String,
  osVersion: String,
  appVersion: String,
  brand: String,
  model: String,
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  notificationsEnabled: {
    type: Boolean,
    default: true,
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

UserDeviceSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('UserDevice', UserDeviceSchema);
