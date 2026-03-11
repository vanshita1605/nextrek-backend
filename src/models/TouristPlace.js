// src/models/TouristPlace.js
const mongoose = require('mongoose');

const touristPlaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['monument', 'museum', 'park', 'temple', 'beach', 'market', 'adventure', 'cultural'],
    },
    latitude: Number,
    longitude: Number,
    address: String,
    entryFee: {
      adult: Number,
      child: Number,
      senior: Number,
      currency: String,
    },
    timings: {
      open: String,
      close: String,
      closedOn: [String], // days of week
    },
    duration: String, // e.g., "2-3 hours"
    images: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    visitedBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        visitDate: Date,
        rating: Number,
      },
    ],
    isSafe: {
      type: Boolean,
      default: true,
    },
    safetyNotes: String,
    restrooms: Boolean,
    parking: Boolean,
    foodAvailable: Boolean,
    guidedTours: Boolean,
    bestTimeToVisit: String,
    nearbyPlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TouristPlace',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TouristPlace', touristPlaceSchema);
