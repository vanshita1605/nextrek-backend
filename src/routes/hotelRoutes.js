// src/routes/hotelRoutes.js
const express = require('express');
const { getHotels, getHotelById, getHotelsByStars, getLuxuryHotels, getBudgetHotels, getHotelsWithAmenities, getAvailableRooms } = require('../controllers/hotelController');

const router = express.Router();

/**
 * @route   GET /api/v1/hotels
 * @desc    Get all hotels with filters
 * @access  Public
 */
router.get('/', getHotels);

/**
 * @route   GET /api/v1/hotels/luxury
 * @desc    Get luxury 5-star hotels
 * @access  Public
 */
router.get('/luxury', getLuxuryHotels);

/**
 * @route   GET /api/v1/hotels/budget
 * @desc    Get budget hotels
 * @access  Public
 */
router.get('/budget', getBudgetHotels);

/**
 * @route   GET /api/v1/hotels/amenities
 * @desc    Get hotels with specific amenities
 * @access  Public
 */
router.get('/amenities', getHotelsWithAmenities);

/**
 * @route   GET /api/v1/hotels/available-rooms
 * @desc    Get available rooms for a hotel
 * @access  Public
 */
router.get('/available-rooms', getAvailableRooms);

/**
 * @route   GET /api/v1/hotels/stars/:stars
 * @desc    Get hotels by star rating
 * @access  Public
 */
router.get('/stars/:stars', getHotelsByStars);

/**
 * @route   GET /api/v1/hotels/:hotelId
 * @desc    Get hotel by ID
 * @access  Public
 */
router.get('/:hotelId', getHotelById);

module.exports = router;
