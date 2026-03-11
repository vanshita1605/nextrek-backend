// src/routes/tripRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateTrip } = require('../middleware/validation');
const {
  createTrip,
  getTripById,
  getUserTrips,
  updateTrip,
  deleteTrip,
  inviteUsersToTrip,
  respondToInvitation,
  removeParticipant,
  addActivityToItinerary,
  updateActivityInItinerary,
  deleteActivityFromItinerary,
  getTripExpenses,
  getTripSummary,
} = require('../controllers/tripController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ============ TRIP CRUD ============

/**
 * @route   POST /api/v1/trips
 * @desc    Create a new trip
 * @access  Private
 */
router.post('/', validateTrip, createTrip);

/**
 * @route   GET /api/v1/trips
 * @desc    Get all trips for logged-in user
 * @access  Private
 */
router.get('/', getUserTrips);

/**
 * @route   GET /api/v1/trips/:tripId
 * @desc    Get trip details by ID
 * @access  Private
 */
router.get('/:tripId', getTripById);

/**
 * @route   PUT /api/v1/trips/:tripId
 * @desc    Update trip
 * @access  Private (owner only)
 */
router.put('/:tripId', updateTrip);

/**
 * @route   DELETE /api/v1/trips/:tripId
 * @desc    Delete trip
 * @access  Private (owner only)
 */
router.delete('/:tripId', deleteTrip);

// ============ TRIP PARTICIPANTS ============

/**
 * @route   POST /api/v1/trips/:tripId/invite
 * @desc    Invite users to trip
 * @access  Private (owner only)
 */
router.post('/:tripId/invite', inviteUsersToTrip);

/**
 * @route   POST /api/v1/trips/:tripId/respond-invitation
 * @desc    Accept or decline trip invitation
 * @access  Private
 */
router.post('/:tripId/respond-invitation', respondToInvitation);

/**
 * @route   DELETE /api/v1/trips/:tripId/participants/:participantId
 * @desc    Remove participant from trip
 * @access  Private (owner only)
 */
router.delete('/:tripId/participants/:participantId', removeParticipant);

// ============ ITINERARY ============

/**
 * @route   POST /api/v1/trips/:tripId/itinerary
 * @desc    Add activity to itinerary
 * @access  Private
 */
router.post('/:tripId/itinerary', addActivityToItinerary);

/**
 * @route   PUT /api/v1/trips/:tripId/itinerary/:day/:activityId
 * @desc    Update activity in itinerary
 * @access  Private
 */
router.put('/:tripId/itinerary/:day/:activityId', updateActivityInItinerary);

/**
 * @route   DELETE /api/v1/trips/:tripId/itinerary/:day/:activityId
 * @desc    Delete activity from itinerary
 * @access  Private
 */
router.delete('/:tripId/itinerary/:day/:activityId', deleteActivityFromItinerary);

// ============ FINANCIALS ============

/**
 * @route   GET /api/v1/trips/:tripId/expenses
 * @desc    Get trip expenses with category breakdown
 * @access  Private
 */
router.get('/:tripId/expenses', getTripExpenses);

/**
 * @route   GET /api/v1/trips/:tripId/summary
 * @desc    Get trip summary with statistics
 * @access  Private
 */
router.get('/:tripId/summary', getTripSummary);

module.exports = router;
