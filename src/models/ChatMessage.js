// src/models/ChatMessage.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
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
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'suggestion', 'warning', 'info'],
      default: 'text',
    },
    context: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
    metadata: {
      tokens: Number,
      model: String,
      responseTime: Number,
    },
    readOnly: {
      type: Boolean,
      default: true,
      description: 'If true, user cannot delete or modify this message',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [String],
    helpful: {
      type: Boolean,
      default: null,
    },
    feedback: String,
  },
  { timestamps: true }
);

// Index for conversation retrieval
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ tripId: 1, userId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
