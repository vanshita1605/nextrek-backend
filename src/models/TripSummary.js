// src/models/TripSummary.js
const mongoose = require('mongoose');

const TripSummarySchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: String,
  overview: String,
  duration: {
    startDate: Date,
    endDate: Date,
    daysCount: Number,
  },
  destinations: [
    {
      name: String,
      daysSpent: Number,
      highlights: [String],
      photos: Number,
    },
  ],
  statistics: {
    totalPhotos: Number,
    totalJournalEntries: Number,
    totalActivities: Number,
    totalExpense: Number,
    averageDailyExpense: Number,
    totalDistance: Number,
    highestMood: Number,
    lowestMood: Number,
    averageMood: Number,
    dominantSentiment: String,
  },
  highlights: [
    {
      title: String,
      description: String,
      date: Date,
      photo: String,
      sentiment: String,
      importance: Number,
    },
  ],
  bestMoments: [
    {
      momentId: String,
      title: String,
      description: String,
      photo: String,
      date: Date,
    },
  ],
  topLocations: [
    {
      name: String,
      visitCount: Number,
      averageRating: Number,
      topPhoto: String,
    },
  ],
  topActivities: [
    {
      name: String,
      category: String,
      count: Number,
      averageRating: Number,
    },
  ],
  topFoods: [
    {
      name: String,
      restaurant: String,
      rating: Number,
    },
  ],
  personalInsights: {
    theme: String,
    learnings: [String],
    favoriteMemory: String,
    mostChallenging: String,
    personalGrowth: [String],
    recommendations: [String],
  },
  moodJourney: [
    {
      date: Date,
      mood: Number,
      sentiment: String,
      summary: String,
    },
  ],
  travelStyle: {
    type: String,
    enum: ['adventurous', 'relaxed', 'cultural', 'luxury', 'budget', 'family', 'solo', 'mixed'],
  },
  favoritePhoto: {
    url: String,
    caption: String,
    date: Date,
  },
  coverPhoto: {
    url: String,
    caption: String,
  },
  shareableLinks: {
    publicUrl: String,
    qrCode: String,
    accessCode: String,
  },
  aiGenerated: {
    summaryText: String,
    keyTakeaways: [String],
    suggestedCaptions: [String],
    generatedAt: Date,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

TripSummarySchema.index({ tripId: 1, userId: 1 });

module.exports = mongoose.model('TripSummary', TripSummarySchema);
