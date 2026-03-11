// src/models/OrderTracking.js
const mongoose = require('mongoose');

const TrackingEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'picked_up', 'out_for_delivery', 'arrived', 'delivered', 'cancelled', 'failed'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  description: String,
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryAgent',
  },
  notes: String,
});

const OrderTrackingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuickCommerceOrder',
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  currentStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'picked_up', 'out_for_delivery', 'arrived', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date,
  },
  deliveryAgent: {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAgent',
    },
    name: String,
    phone: String,
    rating: Number,
    vehicleDetails: String,
    profileImage: String,
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  events: [TrackingEventSchema],
  distanceTraveled: {
    type: Number,
    default: 0,
  },
  estimatedDistance: Number,
  eta: Date,
  delayReason: String,
  isDelayed: {
    type: Boolean,
    default: false,
  },
  supportContactNumber: String,
  liveTrackingEnabled: {
    type: Boolean,
    default: true,
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

OrderTrackingSchema.index({ userId: 1, currentStatus: 1 });
OrderTrackingSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

module.exports = mongoose.model('OrderTracking', OrderTrackingSchema);
