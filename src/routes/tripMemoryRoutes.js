// src/routes/tripMemoryRoutes.js
const express = require('express');
const router = express.Router();
const tripMemoryController = require('../controllers/tripMemoryController');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

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

// ============ Photo Upload API ============

/**
 * POST /api/trips/:tripId/memories/upload
 * Upload photo to trip
 */
router.post(
  '/:tripId/memories/upload',
  authMiddleware,
  upload.single('photo'),
  [
    body('caption').optional().isString(),
    body('location').optional().isString(),
    body('takenAt').optional().isISO8601(),
    body('tags').optional().isString(),
  ],
  handleValidationErrors,
  tripMemoryController.uploadPhoto
);

/**
 * GET /api/trips/:tripId/memories
 * Get trip photos/memories with filters
 */
router.get(
  '/:tripId/memories',
  authMiddleware,
  [
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  tripMemoryController.getTripMemories
);

/**
 * GET /api/trips/:tripId/memories/album/:albumName
 * Get photos by album
 */
router.get(
  '/:tripId/memories/album/:albumName',
  authMiddleware,
  tripMemoryController.getAlbum
);

/**
 * POST /api/trips/:tripId/memories/:photoId/like
 * Like a photo
 */
router.post(
  '/:tripId/memories/:photoId/like',
  authMiddleware,
  tripMemoryController.likePhoto
);

/**
 * POST /api/trips/:tripId/memories/:photoId/comment
 * Comment on a photo
 */
router.post(
  '/:tripId/memories/:photoId/comment',
  authMiddleware,
  [
    body('text').notEmpty().withMessage('Comment text is required'),
    body('userRating').optional().isInt({ min: 1, max: 5 }),
  ],
  handleValidationErrors,
  tripMemoryController.commentOnPhoto
);

/**
 * POST /api/trips/:tripId/memories/:photoId/highlight
 * Mark photo as highlight
 */
router.post(
  '/:tripId/memories/:photoId/highlight',
  authMiddleware,
  tripMemoryController.markAsHighlight
);

// ============ Timeline API ============

/**
 * GET /api/trips/:tripId/timeline
 * Get trip timeline
 */
router.get(
  '/:tripId/timeline',
  authMiddleware,
  tripMemoryController.getTimeline
);

/**
 * POST /api/trips/:tripId/timeline/generate
 * Auto-generate timeline
 */
router.post(
  '/:tripId/timeline/generate',
  authMiddleware,
  tripMemoryController.generateTimeline
);

// ============ Trip Summary API ============

/**
 * POST /api/trips/:tripId/summary/generate
 * Auto-generate trip summary
 */
router.post(
  '/:tripId/summary/generate',
  authMiddleware,
  tripMemoryController.generateTripSummary
);

/**
 * GET /api/trips/:tripId/summary
 * Get trip summary
 */
router.get(
  '/:tripId/summary',
  authMiddleware,
  tripMemoryController.getTripSummary
);

/**
 * GET /api/trips/:tripId/summary/stats
 * Get summary statistics
 */
router.get(
  '/:tripId/summary/stats',
  authMiddleware,
  tripMemoryController.getSummaryStats
);

// ============ Journal API ============

/**
 * POST /api/trips/:tripId/journal
 * Add journal entry
 */
router.post(
  '/:tripId/journal',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('date').optional().isISO8601(),
    body('tone').optional().isIn(['happy', 'sad', 'excited', 'reflective', 'nostalgic', 'adventurous', 'curious', 'grateful']),
    body('mood').optional().isInt({ min: 1, max: 5 }),
    body('weather').optional().isString(),
    body('isPrivate').optional().isBoolean(),
  ],
  handleValidationErrors,
  tripMemoryController.addJournalEntry
);

/**
 * GET /api/trips/:tripId/journal
 * Get journal entries
 */
router.get(
  '/:tripId/journal',
  authMiddleware,
  tripMemoryController.getJournalEntries
);

/**
 * POST /api/trips/:tripId/journal/:entryId/favorite
 * Mark journal entry as favorite
 */
router.post(
  '/:tripId/journal/:entryId/favorite',
  authMiddleware,
  tripMemoryController.markEntryAsFavorite
);

/**
 * GET /api/trips/:tripId/journal/insights
 * Get journal insights
 */
router.get(
  '/:tripId/journal/insights',
  authMiddleware,
  tripMemoryController.getJournalInsights
);

module.exports = router;
