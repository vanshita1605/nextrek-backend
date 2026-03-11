// src/routes/packingChecklistRoutes.js
const express = require('express');
const router = express.Router();
const packingChecklistController = require('../controllers/packingChecklistController');
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

// Generate checklist for trip (with smart rules engine and weather)
const validateGenerateChecklist = [
  body('season').optional().isString(),
  body('tripType').optional().isString(),
  body('interests').optional().isArray(),
  body('fetchWeather').optional().isBoolean(),
  handleValidationErrors,
];
router.post('/:tripId/generate', authMiddleware, ...validateGenerateChecklist, packingChecklistController.generateChecklist);

// Get checklist for trip
router.get('/:tripId', authMiddleware, packingChecklistController.getChecklist);

// Get destination weather & alerts
router.get('/:tripId/weather', authMiddleware, packingChecklistController.getDestinationWeather);

// Get smart packing suggestions based on weather and trip type
const validatePackingSuggestions = [
  body('destination').optional().isString(),
  body('tripType').optional().isString(),
  body('season').optional().isString(),
  body('interests').optional().isArray(),
  handleValidationErrors,
];
router.post('/:tripId/suggestions', authMiddleware, ...validatePackingSuggestions, packingChecklistController.getPackingSuggestions);

// Update item status
const validateUpdateItem = [
  body('isChecked').isBoolean(),
  body('notes').optional().isString(),
  handleValidationErrors,
];
router.put('/:checklistId/item/:itemIndex', authMiddleware, ...validateUpdateItem, packingChecklistController.updateItemStatus);

// Add custom item
const validateAddCustomItem = [
  body('item').isString().notEmpty().withMessage('Item is required'),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  handleValidationErrors,
];
router.post('/:checklistId/item', authMiddleware, ...validateAddCustomItem, packingChecklistController.addCustomItem);

// Delete item
router.delete('/:checklistId/item/:itemIndex', authMiddleware, packingChecklistController.deleteItem);

// Get progress
router.get('/:tripId/progress', authMiddleware, packingChecklistController.getProgress);

module.exports = router;
