// src/models/PartnerAccount.js
const mongoose = require('mongoose');

const PartnerAccountSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuickCommercePartner',
    required: true,
    unique: true,
    index: true,
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  apiSecret: {
    type: String,
    required: true,
  },
  webhookUrl: String,
  webhookSecret: String,
  integrationStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'deactivated'],
    default: 'pending',
  },
  connectedAt: Date,
  lastSyncedAt: Date,
  apiCallsCount: {
    type: Number,
    default: 0,
  },
  successfulCalls: {
    type: Number,
    default: 0,
  },
  failedCalls: {
    type: Number,
    default: 0,
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 100,
    },
    requestsPerDay: {
      type: Number,
      default: 10000,
    },
  },
  ipWhitelist: [String],
  features: {
    productListing: {
      type: Boolean,
      default: true,
    },
    orderManagement: {
      type: Boolean,
      default: true,
    },
    realTimeTracking: {
      type: Boolean,
      default: true,
    },
    analyticsAccess: {
      type: Boolean,
      default: false,
    },
  },
  settings: {
    autoSyncProducts: {
      type: Boolean,
      default: true,
    },
    autoUpdateOrderStatus: {
      type: Boolean,
      default: true,
    },
    enableNotifications: {
      type: Boolean,
      default: true,
    },
  },
  integrationDetails: {
    platform: {
      type: String,
      enum: ['custom', 'shopify', 'woocommerce', 'prestashop', 'magento', 'other'],
    },
    version: String,
    lastUpdated: Date,
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
  },
  documents: {
    integrationAgreement: String,
    technicalSpec: String,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PartnerAccount', PartnerAccountSchema);
