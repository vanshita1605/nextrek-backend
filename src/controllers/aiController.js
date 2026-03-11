// src/controllers/aiController.js
const AIService = require('../services/aiService');
const Trip = require('../models/Trip');
const User = require('../models/User');
const City = require('../models/City');
const ChatMessage = require('../models/ChatMessage');

// Get travel recommendations
exports.getTravelRecommendations = async (req, res) => {
  try {
    const { city, tripType = 'leisure', budget, days } = req.body;

    if (!city || !budget || !days) {
      return res.status(400).json({
        success: false,
        message: 'City, budget, and days are required',
      });
    }

    const result = await AIService.generateTravelRecommendations(city, tripType, budget, days);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        city,
        tripType,
        budget,
        days,
        recommendations: result.recommendations,
      },
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message,
    });
  }
};

// Get budget advice for a trip
exports.getBudgetAdvice = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user is trip owner or participant
    if (
      trip.owner.toString() !== req.userId
      && !trip.participants.some((p) => p.userId.toString() === req.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this trip',
      });
    }

    const result = await AIService.getBudgetAdvice(tripId, req.userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get budget advice',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        tripId,
        advice: result.advice,
      },
    });
  } catch (error) {
    console.error('Get budget advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budget advice',
      error: error.message,
    });
  }
};

// Get packing suggestions
exports.getPackingSuggestions = async (req, res) => {
  try {
    const { city, season, duration } = req.body;

    if (!city || !duration) {
      return res.status(400).json({
        success: false,
        message: 'City and duration are required',
      });
    }

    const detectedSeason = season || detectSeason(new Date());

    const result = await AIService.getPackingSuggestions(city, detectedSeason, duration);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        city,
        season: detectedSeason,
        duration,
        suggestions: result.suggestions,
      },
    });
  } catch (error) {
    console.error('Get packing suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get packing suggestions',
      error: error.message,
    });
  }
};

// Get itinerary suggestions
exports.getItinerarySuggestions = async (req, res) => {
  try {
    const { city, days, interests = [], budget } = req.body;

    if (!city || !days) {
      return res.status(400).json({
        success: false,
        message: 'City and days are required',
      });
    }

    const result = await AIService.getItinerarySuggestions(
      city,
      days,
      interests,
      budget || 'flexible',
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get itinerary',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        city,
        days,
        interests,
        budget,
        itinerary: result.itinerary,
      },
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get itinerary suggestions',
      error: error.message,
    });
  }
};

// Get safety and local tips
exports.getSafetyAndLocalTips = async (req, res) => {
  try {
    const { city, country } = req.body;

    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required',
      });
    }

    const result = await AIService.getSafetyAndLocalTips(city, country);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get tips',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        city,
        country,
        tips: result.tips,
      },
    });
  } catch (error) {
    console.error('Get safety tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safety tips',
      error: error.message,
    });
  }
};

// Ask general question
exports.askQuestion = async (req, res) => {
  try {
    const { question, tripId } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required',
      });
    }

    const context = {};

    if (tripId) {
      const trip = await Trip.findById(tripId);
      if (trip) {
        context.tripDetails = {
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.Budget?.total,
          participants: trip.participants.length,
        };
      }
    }

    const result = await AIService.askQuestion(question, context);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to answer question',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        question,
        answer: result.answer,
        tripId: tripId || null,
      },
    });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to answer question',
      error: error.message,
    });
  }
};

// Get meal plan recommendations
exports.getMealPlanRecommendations = async (req, res) => {
  try {
    const { city, days, dietaryPreferences = [] } = req.body;

    if (!city || !days) {
      return res.status(400).json({
        success: false,
        message: 'City and days are required',
      });
    }

    const result = await AIService.generateMealPlan(city, days, dietaryPreferences);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate meal plan',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        city,
        days,
        dietaryPreferences,
        mealPlan: result.mealPlan,
      },
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plan',
      error: error.message,
    });
  }
};

// Start new chat conversation
exports.startChatConversation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { firstMessage } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify user is trip participant
    const isParticipant = trip.owner.toString() === req.userId
      || trip.participants.some((p) => p.userId.toString() === req.userId);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trip',
      });
    }

    const result = await AIService.startNewConversation(tripId, req.userId, firstMessage);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to start conversation',
        error: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Start chat conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start conversation',
      error: error.message,
    });
  }
};

// Send message in chat
exports.sendChatMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message are required',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Get trip context for AI
    const context = {
      tripDetails: {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.Budget?.total,
        spent: trip.Budget?.spent,
        participants: trip.participants.length,
      },
    };

    const result = await AIService.chatWithAssistant(tripId, req.userId, conversationId, message, context);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: result.conversationId,
        assistantMessage: result.message,
        messageId: result.messageId,
      },
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// Get conversation history
exports.getConversationHistory = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { conversationId } = req.query;
    const { limit = 50 } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    // Verify user is part of the trip
    const trip = await Trip.findById(tripId);
    const isParticipant = trip.owner.toString() === req.userId
      || trip.participants.some((p) => p.userId.toString() === req.userId);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trip',
      });
    }

    const result = await AIService.getConversationHistory(conversationId, parseInt(limit));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get conversation',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        conversationId,
        tripId,
        messages: result.messages,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation history',
      error: error.message,
    });
  }
};

// Delete message (enforces read-only)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await AIService.deleteMessage(messageId, req.userId);

    if (!result.success) {
      const statusCode = result.allowed === false ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: result.reason || result.error,
      });
    }

    res.json({
      success: true,
      message: result.message,
      deletedMessageId: result.deletedMessageId,
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
};

// Edit message (enforces read-only for AI messages)
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'New message content is required',
      });
    }

    const result = await AIService.editMessage(messageId, req.userId, message);

    if (!result.success) {
      const statusCode = result.allowed === false ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: result.reason || result.error,
      });
    }

    res.json({
      success: true,
      message: result.message,
      updatedMessage: result.updatedMessage,
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: error.message,
    });
  }
};

// Rate message helpfulness
exports.rateMessageHelpfulness = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { helpful, feedback = '' } = req.body;

    if (helpful === undefined || helpful === null) {
      return res.status(400).json({
        success: false,
        message: 'Helpful flag is required',
      });
    }

    const result = await AIService.rateMessageHelpfulness(messageId, req.userId, helpful, feedback);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to rate message',
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: result.message,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Rate message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate message',
      error: error.message,
    });
  }
};

// Get all conversations for a trip
exports.getTripConversations = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify user is part of the trip
    const isParticipant = trip.owner.toString() === req.userId
      || trip.participants.some((p) => p.userId.toString() === req.userId);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trip',
      });
    }

    const result = await AIService.getTripConversations(tripId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get conversations',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        tripId,
        conversations: result.conversations,
        total: result.conversations.length,
      },
    });
  } catch (error) {
    console.error('Get trip conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message,
    });
  }
};

// Get conversation summary
exports.getConversationSummary = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await AIService.getConversationSummary(conversationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.summary,
    });
  } catch (error) {
    console.error('Get conversation summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation summary',
      error: error.message,
    });
  }
};

// Helper function to detect season
function detectSeason(date) {
  const month = new Date(date).getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}
