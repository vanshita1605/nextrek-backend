// src/models/Transport.js
const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema(
  {
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    type: {
      type: String,
      enum: ['taxi', 'bike', 'car', 'bus', 'train', 'flight', 'metro', 'auto'],
      required: true,
    },
    companyName: String,
    contactNumber: String,
    email: String,
    website: String,
    description: String,
    basePrice: {
      amount: Number,
      perKm: Boolean,
      perHour: Boolean,
      currency: String,
    },
    pricePerKm: Number,
    pricePerHour: Number,
    vehicles: [
      {
        name: String,
        capacity: Number,
        image: String,
        amenities: [String],
        rate: Number,
      },
    ],
    timings: {
      open: String,
      close: String,
      available24_7: Boolean,
    },
    pickupLocations: [
      {
        name: String,
        address: String,
        contactNumber: String,
      },
    ],
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
    safetyFeatures: [String],
    insuranceCovered: Boolean,
    driverRating: Number,
    paymentMethods: [String],
    refundPolicy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transport', transportSchema);
