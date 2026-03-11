// src/models/TripMemory.js
const mongoose = require('mongoose');

const PhotoMetadataSchema = new mongoose.Schema({
  photoId: String,
  url: {
    type: String,
    required: true,
  },
  thumbnail: String,
  caption: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  takenAt: Date,
  cameraMetadata: {
    device: String,
    model: String,
    timestamp: Date,
  },
  tags: [String],
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      userRating: Number,
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isHighlight: {
    type: Boolean,
    default: false,
  },
  aiDescription: String,
  sentiment: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'calm', 'neutral', 'unknown'],
  },
  detectedObjects: [String], // AI-detected: people, landmarks, animals, etc.
});

const TripMemorySchema = new mongoose.Schema({
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
  title: String,
  description: String,
  photos: [PhotoMetadataSchema],
  totalPhotos: {
    type: Number,
    default: 0,
  },
  totalHighlights: {
    type: Number,
    default: 0,
  },
  memories: [
    {
      type: String, // Story text
      photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TripMemory.photos',
      },
      createdAt: Date,
    },
  ],
  sharedWith: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      permission: {
        type: String,
        enum: ['view', 'edit', 'comment'],
        default: 'view',
      },
      sharedAt: Date,
    },
  ],
  albums: [
    {
      name: String,
      description: String,
      photos: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TripMemory.photos',
        },
      ],
      createdAt: Date,
    },
  ],
  isPublic: {
    type: Boolean,
    default: false,
  },
  storageUsed: {
    type: Number,
    default: 0, // in MB
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

TripMemorySchema.index({ tripId: 1, userId: 1 });

module.exports = mongoose.model('TripMemory', TripMemorySchema);
