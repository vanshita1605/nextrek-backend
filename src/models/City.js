// src/models/City.js
const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: String,
    latitude: Number,
    longitude: Number,
    description: String,
    population: Number,
    bestTimeToVisit: {
      start: String, // e.g., "October"
      end: String,
    },
    weather: {
      avgTemperature: Number,
      avgHumidity: Number,
      season: String,
    },
    averageBudgetPerDay: {
      budget: Number,
      currency: String,
    },
    language: [String],
    currency: String,
    timezone: String,
    image: String,
    gallery: [String],
    highlights: [String],
    safetyRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    touristPlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TouristPlace',
      },
    ],
    foodSpots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodSpot',
      },
    ],
    hotels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
      },
    ],
    transports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transport',
      },
    ],
    emergencyContacts: [
      {
        name: String,
        phone: String,
        type: {
          type: String,
          enum: ['police', 'hospital', 'fire', 'ambulance'],
        },
        location: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],
    safeAreas: [
      {
        name: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        radius: Number,
      },
    ],
    unsafeAreas: [
      {
        name: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        radius: Number,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('City', citySchema);
