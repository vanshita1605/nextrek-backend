// src/routes/safetyRoutes.js
const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
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

// Get safe areas in city
router.get('/city/:cityId/safe-areas', safetyController.getSafeAreas);

// Get unsafe areas in city
router.get('/city/:cityId/unsafe-areas', safetyController.getUnsafeAreas);

// Get emergency services in city
router.get('/city/:cityId/emergency-services', safetyController.getEmergencyServices);

// Get nearby police stations
router.get('/city/:cityId/police-stations', safetyController.getNearbyPoliceStations);

// Get nearby hospitals
router.get('/city/:cityId/hospitals', safetyController.getNearbyHospitals);

// Get city safety rating
router.get('/city/:cityId/safety-rating', safetyController.getCitySafetyRating);

// Get safe places
router.get('/city/:cityId/safe-places', safetyController.getSafePlaces);

// Add place to safe list (requires auth)
router.post('/place/:placeId/add-to-safe-list', authMiddleware, safetyController.addToSafeList);

// Report unsafe place (requires auth)
const validateReportUnsafe = [
  body('reason').isString().notEmpty().withMessage('Reason is required'),
  body('description').optional().isString(),
  body('severity').optional().isIn(['low', 'medium', 'high']),
  handleValidationErrors,
];
router.post('/place/:placeId/report-unsafe', authMiddleware, ...validateReportUnsafe, safetyController.reportUnsafePlace);

// ============ Emergency Contacts API ============
// Get user's emergency contacts (requires auth)
router.get('/user/emergency-contacts', authMiddleware, safetyController.getUserEmergencyContacts);

// Add emergency contact (requires auth)
const validateEmergencyContact = [
  body('contactName').isString().notEmpty().withMessage('Contact name is required'),
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number is required'),
  body('relationship').isIn(['family', 'friend', 'colleague', 'doctor', 'lawyer', 'other']).withMessage('Valid relationship required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('address').optional().isString(),
  handleValidationErrors,
];
router.post('/user/emergency-contacts', authMiddleware, ...validateEmergencyContact, safetyController.addEmergencyContact);

// Update emergency contact (requires auth)
router.put('/user/emergency-contacts/:contactId', authMiddleware, safetyController.updateEmergencyContact);

// Delete emergency contact (requires auth)
router.delete('/user/emergency-contacts/:contactId', authMiddleware, safetyController.removeEmergencyContact);

// Verify emergency contact (sends verification code/email)
router.post('/user/emergency-contacts/:contactId/verify', authMiddleware, safetyController.verifyEmergencyContact);

// ============ Nearby Emergency Services API ============
// Get nearby hospitals and police with safety analysis
const validateNearbyEmergencies = [
  body('latitude').isFloat().withMessage('Valid latitude required'),
  body('longitude').isFloat().withMessage('Valid longitude required'),
  body('type').optional().isIn(['hospital', 'police', 'both']),
  handleValidationErrors,
];
router.get('/nearby-emergencies', authMiddleware, ...validateNearbyEmergencies, safetyController.getNearbyEmergenciesWithAnalysis);

// ============ Safety Alerts API ============
// Generate safety alert for user
const validateSafetyAlert = [
  body('city').isString().notEmpty().withMessage('City is required'),
  body('alertType').isIn(['emergency', 'warning', 'info']).withMessage('Valid alert type required'),
  body('severity').isIn(['low', 'medium', 'high']).withMessage('Valid severity required'),
  body('location').isString().notEmpty().withMessage('Location is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  handleValidationErrors,
];
router.post('/alerts/generate', authMiddleware, ...validateSafetyAlert, safetyController.generateSafetyAlert);

// Get user's safety alerts
router.get('/user/alerts', authMiddleware, safetyController.getUserSafetyAlerts);

// Get alerts for specific trip
router.get('/trip/:tripId/safety-alerts', authMiddleware, safetyController.getUserSafetyAlerts);

// Acknowledge/dismiss alert
router.post('/alerts/:alertId/acknowledge', authMiddleware, safetyController.acknowledgeSafetyAlert);

// ============ Trip Safety Analysis API ============
// Analyze trip destinations for safety
router.get('/trip/:tripId/analyze', authMiddleware, safetyController.analyzeTripSafety);

// Get comprehensive trip safety report
router.get('/trip/:tripId/safety-report', authMiddleware, safetyController.getTripSafetyReport);

module.exports = router;
