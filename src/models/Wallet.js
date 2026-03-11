// src/models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        email: String,
        name: String,
        balance: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalBalance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
    settlements: [
      {
        from: mongoose.Schema.Types.ObjectId,
        to: mongoose.Schema.Types.ObjectId,
        amount: Number,
        settled: {
          type: Boolean,
          default: false,
        },
        settledAt: Date,
      },
    ],
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['active', 'settled', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
