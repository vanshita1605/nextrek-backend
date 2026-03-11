// src/models/QuickCommerceOrder.js
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuickCommerceProduct',
    required: true,
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: Number,
  discountedPrice: Number,
  totalPrice: Number,
  image: String,
});

const QuickCommerceOrderSchema = new mongoose.Schema({
  orderId: {
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
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'wallet', 'cash_on_delivery'],
  },
  deliveryAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  deliveryAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryAgent',
  },
  specialInstructions: String,
  appliedCoupon: String,
  couponDiscount: {
    type: Number,
    default: 0,
  },
  orderNotes: [{
    note: String,
    createdAt: Date,
  }],
  cancellationReason: String,
  cancellationRequestedAt: Date,
  cancelledAt: Date,
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'processing', 'completed'],
    default: 'none',
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  ratings: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
    },
    ratedAt: Date,
  },
  review: String,
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

QuickCommerceOrderSchema.index({ userId: 1, createdAt: -1 });
QuickCommerceOrderSchema.index({ partnerId: 1, status: 1 });

module.exports = mongoose.model('QuickCommerceOrder', QuickCommerceOrderSchema);
