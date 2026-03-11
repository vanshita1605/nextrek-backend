// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
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

// Create review
const validateCreateReview = [
  body('entityType').isString().notEmpty().withMessage('EntityType is required'),
  body('entityId').isString().notEmpty().withMessage('EntityId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isString(),
  body('description').optional().isString(),
  handleValidationErrors,
];
router.post('/', authMiddleware, ...validateCreateReview, reviewController.createReview);

// Get reviews for entity
router.get('/entity/:entityType/:entityId', reviewController.getEntityReviews);

// Get user's reviews
router.get('/user/my-reviews', authMiddleware, reviewController.getUserReviews);

// Update review
const validateUpdateReview = [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().isString(),
  body('description').optional().isString(),
  handleValidationErrors,
];
router.put('/:reviewId', authMiddleware, ...validateUpdateReview, reviewController.updateReview);

// Delete review
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

// Mark review as helpful
router.post('/:reviewId/helpful', authMiddleware, reviewController.markHelpful);

// Report review
const validateReportReview = [
  body('reason').isString().notEmpty().withMessage('Reason is required'),
  body('description').optional().isString(),
  handleValidationErrors,
];
router.post('/:reviewId/report', authMiddleware, ...validateReportReview, reviewController.reportReview);

// Admin: Approve review
router.put('/:reviewId/approve', authMiddleware, reviewController.approveReview);

// Admin: Reject review
const validateRejectReview = [
  body('reason').optional().isString(),
  handleValidationErrors,
];
router.put('/:reviewId/reject', authMiddleware, ...validateRejectReview, reviewController.rejectReview);

module.exports = router;
