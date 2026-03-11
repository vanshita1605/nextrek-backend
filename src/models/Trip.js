// src/models/Trip.js
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    tripName: {
      type: String,
      required: [true, 'Please provide a trip name'],
    },
    description: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    duration: Number, // calculated in days
    Budget: {
      totalBudget: {
        type: Number,
        required: true,
      },
      spent: {
        type: Number,
        default: 0,
      },
      remaining: Number,
      categories: {
        accommodation: { budget: Number, spent: { type: Number, default: 0 } },
        food: { budget: Number, spent: { type: Number, default: 0 } },
        transport: { budget: Number, spent: { type: Number, default: 0 } },
        activities: { budget: Number, spent: { type: Number, default: 0 } },
        shopping: { budget: Number, spent: { type: Number, default: 0 } },
        emergency: { budget: Number, spent: { type: Number, default: 0 } },
      },
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        email: String,
        name: String,
        status: {
          type: String,
          enum: ['invited', 'joined', 'declined'],
          default: 'invited',
        },
        joinedAt: Date,
      },
    ],
    numberOfPeople: {
      type: Number,
      required: true,
    },
    tripType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'group', 'corporate'],
      default: 'group',
    },
    accommodation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
      },
    ],
    activities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TouristPlace',
      },
    ],
    restaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodSpot',
      },
    ],
    transport: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transport',
      },
    ],
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    itinerary: [
      {
        day: Number,
        date: Date,
        activities: [
          {
            name: String,
            time: String,
            location: String,
            placeId: mongoose.Schema.Types.ObjectId,
            cost: Number,
            notes: String,
          },
        ],
      },
    ],
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
    packing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PackingChecklist',
    },
    memories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory',
      },
    ],
    status: {
      type: String,
      enum: ['planned', 'ongoing', 'completed', 'cancelled'],
      default: 'planned',
    },
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
    emergencyContacts: [
      {
        name: String,
        phone: String,
        relation: String,
      },
    ],
    safetyTips: [String],
  },
  { timestamps: true }
);

// Calculate duration before saving
tripSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

// Calculate remaining budget
tripSchema.methods.calculateRemainingBudget = async function () {
  this.Budget.remaining = this.Budget.totalBudget - this.Budget.spent;
  return this.save();
};

module.exports = mongoose.model('Trip', tripSchema);
