// src/models/Memory.js
const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: String,
    description: String,
    date: {
      type: Date,
      default: Date.now,
    },
    location: String,
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TouristPlace',
    },
    photos: [
      {
        url: String,
        caption: String,
        uploadedAt: Date,
      },
    ],
    videos: [
      {
        url: String,
        caption: String,
        duration: Number,
      },
    ],
    relatedExpenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
    emotions: [String], // e.g., ['happy', 'excited', 'relaxed']
    companions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tags: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    journal: String,
    isPublic: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        comment: String,
        createdAt: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Memory', memorySchema);
