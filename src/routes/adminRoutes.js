// src/routes/adminRoutes.js
const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  // City management
  createCity,
  updateCity,
  deleteCity,
  // Tourist place management
  createTouristPlace,
  updateTouristPlace,
  deleteTouristPlace,
  // Food spot management
  createFoodSpot,
  updateFoodSpot,
  deleteFoodSpot,
  // Hotel management
  createHotel,
  updateHotel,
  deleteHotel,
  // Transport management
  createTransport,
  updateTransport,
  deleteTransport,
  // User management
  getAllUsers,
  updateUserRole,
  deactivateUser,
  getDashboardStats,
} = require('../controllers/adminController');

const router = express.Router();

// Apply auth middleware and role check to all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// ============ DASHBOARD ============

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard', getDashboardStats);

// ============ CITIES ============

/**
 * @route   POST /api/v1/admin/cities
 * @desc    Create a new city
 * @access  Admin only
 */
router.post('/cities', createCity);

/**
 * @route   PUT /api/v1/admin/cities/:cityId
 * @desc    Update city
 * @access  Admin only
 */
router.put('/cities/:cityId', updateCity);

/**
 * @route   DELETE /api/v1/admin/cities/:cityId
 * @desc    Delete city
 * @access  Admin only
 */
router.delete('/cities/:cityId', deleteCity);

// ============ TOURIST PLACES ============

/**
 * @route   POST /api/v1/admin/places
 * @desc    Create a new tourist place
 * @access  Admin only
 */
router.post('/places', createTouristPlace);

/**
 * @route   PUT /api/v1/admin/places/:placeId
 * @desc    Update tourist place
 * @access  Admin only
 */
router.put('/places/:placeId', updateTouristPlace);

/**
 * @route   DELETE /api/v1/admin/places/:placeId
 * @desc    Delete tourist place
 * @access  Admin only
 */
router.delete('/places/:placeId', deleteTouristPlace);

// ============ FOOD SPOTS ============

/**
 * @route   POST /api/v1/admin/food
 * @desc    Create a new food spot
 * @access  Admin only
 */
router.post('/food', createFoodSpot);

/**
 * @route   PUT /api/v1/admin/food/:spotId
 * @desc    Update food spot
 * @access  Admin only
 */
router.put('/food/:spotId', updateFoodSpot);

/**
 * @route   DELETE /api/v1/admin/food/:spotId
 * @desc    Delete food spot
 * @access  Admin only
 */
router.delete('/food/:spotId', deleteFoodSpot);

// ============ HOTELS ============

/**
 * @route   POST /api/v1/admin/hotels
 * @desc    Create a new hotel
 * @access  Admin only
 */
router.post('/hotels', createHotel);

/**
 * @route   PUT /api/v1/admin/hotels/:hotelId
 * @desc    Update hotel
 * @access  Admin only
 */
router.put('/hotels/:hotelId', updateHotel);

/**
 * @route   DELETE /api/v1/admin/hotels/:hotelId
 * @desc    Delete hotel
 * @access  Admin only
 */
router.delete('/hotels/:hotelId', deleteHotel);

// ============ TRANSPORT ============

/**
 * @route   POST /api/v1/admin/transport
 * @desc    Create a new transport option
 * @access  Admin only
 */
router.post('/transport', createTransport);

/**
 * @route   PUT /api/v1/admin/transport/:transportId
 * @desc    Update transport option
 * @access  Admin only
 */
router.put('/transport/:transportId', updateTransport);

/**
 * @route   DELETE /api/v1/admin/transport/:transportId
 * @desc    Delete transport option
 * @access  Admin only
 */
router.delete('/transport/:transportId', deleteTransport);

// ============ USER MANAGEMENT ============

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/users', getAllUsers);

/**
 * @route   PUT /api/v1/admin/users/:userId/role
 * @desc    Update user role
 * @access  Admin only
 */
router.put('/users/:userId/role', updateUserRole);

/**
 * @route   PUT /api/v1/admin/users/:userId/deactivate
 * @desc    Deactivate user
 * @access  Admin only
 */
router.put('/users/:userId/deactivate', deactivateUser);

module.exports = router;
