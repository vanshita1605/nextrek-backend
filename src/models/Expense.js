// src/models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['accommodation', 'food', 'transport', 'activities', 'shopping', 'emergency', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    description: String,
    date: {
      type: Date,
      default: Date.now,
    },
    receipt: {
      url: String,
      uploadedAt: Date,
    },
    splitBetween: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        amount: Number,
      },
    ],
    splitType: {
      type: String,
      enum: ['equal', 'custom', 'itemwise'],
      default: 'equal',
    },
    status: {
      type: String,
      enum: ['pending', 'settled', 'cancelled'],
      default: 'pending',
    },
    tags: [String],
    location: String,
    attachments: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
