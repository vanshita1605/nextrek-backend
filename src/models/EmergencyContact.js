// src/models/EmergencyContact.js
const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      enum: ['family', 'friend', 'colleague', 'other'],
      required: true,
    },
    email: String,
    address: String,
    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      description: 'Priority order for contact (1 = highest)',
    },
    type: {
      type: String,
      enum: ['personal', 'hospital', 'police', 'embassy', 'other'],
      default: 'personal',
    },
    country: String,
    active: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
