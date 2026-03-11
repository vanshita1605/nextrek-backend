// src/models/FoodSpot.js
const mongoose = require('mongoose');

const foodSpotSchema = new mongoose.Schema(
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
    cuisine: [String],
    category: {
      type: String,
      enum: ['restaurant', 'cafe', 'bar', 'bakery', 'street_food', 'fast_food'],
    },
    latitude: Number,
    longitude: Number,
    address: String,
    priceRange: {
      min: Number,
      max: Number,
      currency: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    images: [String],
    menu: [
      {
        itemName: String,
        price: Number,
        vegetarian: Boolean,
        vegan: Boolean,
        glutenFree: Boolean,
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    timings: {
      open: String,
      close: String,
      closedOn: [String],
    },
    contactNumber: String,
    website: String,
    deliveryAvailable: Boolean,
    reservationRequired: Boolean,
    parking: Boolean,
    wifi: Boolean,
    speciality: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodSpot', foodSpotSchema);
