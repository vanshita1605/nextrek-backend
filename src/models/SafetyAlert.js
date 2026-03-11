// src/models/SafetyAlert.js
const mongoose = require('mongoose');

const safetyAlertSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    city: {
      type: String,
      required: true,
    },
    country: String,
    alertType: {
      type: String,
      enum: ['natural_disaster', 'crime', 'health', 'political', 'weather', 'transportation', 'general'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    affectedAreas: [
      {
        areaName: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        radius: Number, // in km
      },
    ],
    recommendations: [String],
    source: {
      type: String,
      enum: ['government', 'who', 'news', 'user_report', 'ai_generated'],
      default: 'user_report',
    },
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    acknowledgedBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        acknowledgedAt: Date,
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SafetyAlert', safetyAlertSchema);
