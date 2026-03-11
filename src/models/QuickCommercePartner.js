// src/models/QuickCommercePartner.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const PartnerSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    index: true,
  },
  businessType: {
    type: String,
    enum: ['grocery_store', 'restaurant', 'pharmacy', 'supermarket', 'convenience_store', 'general_store'],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  businessRegistration: {
    gstNumber: String,
    panNumber: String,
    licenseNumber: String,
    registrationDate: Date,
  },
  address: {
    street: String,
    city: {
      type: String,
      required: true,
    },
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    verified: {
      type: Boolean,
      default: false,
    },
  },
  contact: {
    ownerName: String,
    ownerPhone: String,
    managerName: String,
    managerPhone: String,
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  deliveryRadius: {
    type: Number,
    default: 5, // in km
  },
  logo: String, // Cloudinary URL
  banner: String,
  description: String,
  website: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  commissionRate: {
    type: Number,
    default: 15, // percentage
  },
  minimumOrderValue: {
    type: Number,
    default: 100,
  },
  supportEmail: String,
  supportPhone: String,
  apiKey: {
    type: String,
    unique: true,
  },
  apiSecret: {
    type: String,
  },
  webhookUrl: String,
  documents: {
    gst: String,
    pan: String,
    license: String,
    bankProof: String,
  },
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

// Hash password before saving
PartnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcryptjs.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
PartnerSchema.methods.matchPassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

PartnerSchema.index({ city: 1, isActive: 1 });
PartnerSchema.index({ businessType: 1 });

module.exports = mongoose.model('QuickCommercePartner', PartnerSchema);
