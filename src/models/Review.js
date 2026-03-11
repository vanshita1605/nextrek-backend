// src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    entityType: {
      type: String,
      enum: ['place', 'hotel', 'food', 'transport'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    title: String,
    comment: String,
    photos: [String],
    visitDate: Date,
    verified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        comment: String,
        createdAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ['published', 'pending', 'rejected'],
      default: 'pending',
    },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
