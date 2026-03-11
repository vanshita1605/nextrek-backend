// src/routes/touristPlaceRoutes.js
const express = require('express');
const { getTouristPlaces, getTouristPlaceById, getPlacesByCategory, getTopRatedPlaces, getNearbyPlaces, getSafePlaces } = require('../controllers/touristPlaceController');

const router = express.Router();

/**
 * @route   GET /api/v1/places
 * @desc    Get all tourist places with filters
 * @access  Public
 */
router.get('/', getTouristPlaces);

/**
 * @route   GET /api/v1/places/top-rated
 * @desc    Get top-rated places
 * @access  Public
 */
router.get('/top-rated', getTopRatedPlaces);

/**
 * @route   GET /api/v1/places/safe
 * @desc    Get safe places
 * @access  Public
 */
router.get('/safe', getSafePlaces);

/**
 * @route   GET /api/v1/places/category/:category
 * @desc    Get places by category
 * @access  Public
 */
router.get('/category/:category', getPlacesByCategory);

/**
 * @route   GET /api/v1/places/:placeId
 * @desc    Get place by ID
 * @access  Public
 */
router.get('/:placeId', getTouristPlaceById);

/**
 * @route   GET /api/v1/places/:placeId/nearby
 * @desc    Get nearby places
 * @access  Public
 */
router.get('/:placeId/nearby', getNearbyPlaces);

module.exports = router;
