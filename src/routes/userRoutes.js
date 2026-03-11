// src/routes/userRoutes.js
const express = require('express');
const multer = require('multer');
const {
  getUserProfile,
  updateUserProfile,
  updatePreferences,
  uploadAvatar,
  addEmergencyContact,
  getEmergencyContacts,
  deleteEmergencyContact,
  getTripHistory,
  deleteAccount,
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getUserProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateUserProfile);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', updatePreferences);

/**
 * @route   POST /api/v1/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar', upload.single('avatar'), uploadAvatar);

/**
 * @route   POST /api/v1/users/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private
 */
router.post('/emergency-contacts', addEmergencyContact);

/**
 * @route   GET /api/v1/users/emergency-contacts
 * @desc    Get emergency contacts
 * @access  Private
 */
router.get('/emergency-contacts', getEmergencyContacts);

/**
 * @route   DELETE /api/v1/users/emergency-contacts/:contactId
 * @desc    Delete emergency contact
 * @access  Private
 */
router.delete('/emergency-contacts/:contactId', deleteEmergencyContact);

/**
 * @route   GET /api/v1/users/trip-history
 * @desc    Get user's trip history
 * @access  Private
 */
router.get('/trip-history', getTripHistory);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', deleteAccount);

module.exports = router;
