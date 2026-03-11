// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// Get travel recommendations
const validateTravelRecs = [
  body('city').isString().notEmpty().withMessage('City is required'),
  body('budget').isFloat({ gt: 0 }).withMessage('Valid budget is required'),
  body('days').isInt({ gt: 0 }).withMessage('Days must be positive'),
  body('tripType').optional().isString(),
  handleValidationErrors,
];
router.post('/recommendations', authMiddleware, ...validateTravelRecs, aiController.getTravelRecommendations);

// Get budget advice
router.get('/budget-advice/:tripId', authMiddleware, aiController.getBudgetAdvice);

// Get packing suggestions
const validatePackingSuggestions = [
  body('city').isString().notEmpty().withMessage('City is required'),
  body('duration').isInt({ gt: 0 }).withMessage('Duration must be positive'),
  body('season').optional().isString(),
  handleValidationErrors,
];
router.post('/packing-suggestions', authMiddleware, ...validatePackingSuggestions, aiController.getPackingSuggestions);

// Get itinerary suggestions
const validateItinerary = [
  body('city').isString().notEmpty().withMessage('City is required'),
  body('days').isInt({ gt: 0 }).withMessage('Days must be positive'),
  body('interests').optional().isArray(),
  body('budget').optional().isFloat({ gt: 0 }),
  handleValidationErrors,
];
router.post('/itinerary', authMiddleware, ...validateItinerary, aiController.getItinerarySuggestions);

// Get safety and local tips
const validateSafetyTips = [
  body('city').isString().notEmpty().withMessage('City is required'),
  body('country').isString().notEmpty().withMessage('Country is required'),
  handleValidationErrors,
];
router.post('/safety-tips', authMiddleware, ...validateSafetyTips, aiController.getSafetyAndLocalTips);

// Ask question
const validateAskQuestion = [
  body('question').isString().notEmpty().withMessage('Question is required'),
  body('tripId').optional().isString(),
  handleValidationErrors,
];
router.post('/ask', authMiddleware, ...validateAskQuestion, aiController.askQuestion);

// Get meal plan recommendations
const validateMealPlan = [
  body('city').isString().notEmpty().withMessage('City is required'),
  body('days').isInt({ gt: 0 }).withMessage('Days must be positive'),
  body('dietaryPreferences').optional().isArray(),
  handleValidationErrors,
];
router.post('/meal-plan', authMiddleware, ...validateMealPlan, aiController.getMealPlanRecommendations);

// Chat routes
// Start new chat conversation
const validateStartChat = [
  body('firstMessage').optional().isString(),
  handleValidationErrors,
];
router.post('/chat/:tripId/start', authMiddleware, ...validateStartChat, aiController.startChatConversation);

// Send message in conversation
const validateChatMessage = [
  body('conversationId').isString().notEmpty().withMessage('Conversation ID is required'),
  body('message').isString().notEmpty().withMessage('Message is required'),
  handleValidationErrors,
];
router.post('/chat/:tripId/message', authMiddleware, ...validateChatMessage, aiController.sendChatMessage);

// Get conversation history
router.get('/chat/:tripId/history', authMiddleware, aiController.getConversationHistory);

// Get all conversations for a trip
router.get('/chat/:tripId/conversations', authMiddleware, aiController.getTripConversations);

// Get conversation summary
router.get('/chat/summary/:conversationId', authMiddleware, aiController.getConversationSummary);

// Delete message (enforces read-only)
router.delete('/chat/message/:messageId', authMiddleware, aiController.deleteMessage);

// Edit message (enforces read-only)
const validateEditMessage = [
  body('message').isString().notEmpty().withMessage('Message is required'),
  handleValidationErrors,
];
router.put('/chat/message/:messageId', authMiddleware, ...validateEditMessage, aiController.editMessage);

// Rate message helpfulness
const validateRateMessage = [
  body('helpful').isBoolean().withMessage('Helpful flag is required'),
  body('feedback').optional().isString(),
  handleValidationErrors,
];
router.post('/chat/message/:messageId/rate', authMiddleware, ...validateRateMessage, aiController.rateMessageHelpfulness);

module.exports = router;
