// src/models/Hotel.js
const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
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
    stars: {
      type: Number,
      min: 1,
      max: 5,
    },
    latitude: Number,
    longitude: Number,
    address: String,
    contactNumber: String,
    email: String,
    website: String,
    images: [String],
    rooms: [
      {
        roomType: String, // e.g., single, double, suite
        capacity: Number,
        price: {
          perNight: Number,
          currency: String,
        },
        amenities: [String],
        quantity: Number,
        available: Boolean,
      },
    ],
    amenities: [String],
    facilities: [String],
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
    checkInTime: String,
    checkOutTime: String,
    cancellationPolicy: String,
    parking: Boolean,
    wifi: {
      type: Boolean,
      default: true,
    },
    gym: Boolean,
    pool: Boolean,
    restaurant: Boolean,
    bar: Boolean,
    concierge: Boolean,
    petsAllowed: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);
