// src/models/PackingChecklist.js
const mongoose = require('mongoose');

const packingChecklistSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
    },
    season: String,
    weatherConditions: String,
    tripType: String,
    categories: [
      {
        categoryName: String,
        items: [
          {
            name: String,
            packed: {
              type: Boolean,
              default: false,
            },
            priority: {
              type: String,
              enum: ['high', 'medium', 'low'],
            },
            quantity: Number,
            notes: String,
            addedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          },
        ],
      },
    ],
    completionPercentage: {
      type: Number,
      default: 0,
    },
    customItems: [
      {
        name: String,
        packed: Boolean,
        priority: String,
      },
    ],
    weatherAlerts: [
      {
        type: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        message: String,
      },
    ],
    generatedWith: {
      type: String,
      enum: ['smart-engine', 'manual'],
      default: 'smart-engine',
    },
    lastUpdated: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PackingChecklist', packingChecklistSchema);
