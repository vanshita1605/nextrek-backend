// src/models/QuickCommerceProduct.js
const mongoose = require('mongoose');

const QuickCommerceProductSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
  },
  productName: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['groceries', 'food', 'pharmacy', 'electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'other'],
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String, // Cloudinary URL
  },
  images: [String],
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
  unit: {
    type: String,
    enum: ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'dozen'],
    default: 'pcs',
  },
  sku: String,
  brand: String,
  tags: [String],
  specifications: {
    type: Map,
    of: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deliveryTime: {
    type: Number, // in minutes
    default: 30,
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
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

QuickCommerceProductSchema.index({ partnerId: 1, category: 1 });
QuickCommerceProductSchema.index({ productName: 'text', description: 'text' });

module.exports = mongoose.model('QuickCommerceProduct', QuickCommerceProductSchema);
