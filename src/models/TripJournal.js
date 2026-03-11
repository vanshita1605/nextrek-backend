// src/models/TripJournal.js
const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
  entryId: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  tone: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'reflective', 'nostalgic', 'adventurous', 'curious', 'grateful'],
  },
  mood: {
    type: Number,
    enum: [1, 2, 3, 4, 5], // 1 = sad, 5 = very happy
  },
  weather: String,
  attachments: [
    {
      photoId: String,
      url: String,
      caption: String,
    },
  ],
  tags: [String],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  highlights: [
    {
      text: String,
      sentiment: String,
    },
  ],
  wordCount: Number,
  readingTime: Number, // in minutes
  aiSummary: String,
  sentiment: {
    type: String,
    enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
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

const TripJournalSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  entries: [JournalEntrySchema],
  totalEntries: {
    type: Number,
    default: 0,
  },
  totalWords: {
    type: Number,
    default: 0,
  },
  averageMood: {
    type: Number,
    min: 1,
    max: 5,
  },
  dominantTone: String,
  dominantSentiment: String,
  startDate: Date,
  endDate: Date,
  mostFrequentTags: [
    {
      tag: String,
      count: Number,
    },
  ],
  overallTheme: String,
  favoriteEntries: [
    {
      entryId: String,
      title: String,
      date: Date,
    },
  ],
  insights: {
    bestDay: {
      date: Date,
      mood: Number,
      summary: String,
    },
    worstDay: {
      date: Date,
      mood: Number,
      summary: String,
    },
    mainHighlights: [String],
    personalGrowth: [String],
  },
  isPublic: {
    type: Boolean,
    default: false,
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

TripJournalSchema.index({ tripId: 1, userId: 1 });
TripJournalSchema.index({ 'entries.date': -1 });

module.exports = mongoose.model('TripJournal', TripJournalSchema);
