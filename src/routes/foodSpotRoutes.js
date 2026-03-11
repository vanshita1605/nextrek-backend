// src/routes/foodSpotRoutes.js
const express = require('express');
const { getFoodSpots, getFoodSpotById, getFoodSpotsByCategory, getFoodSpotsByCuisine, getFoodSpotsWithDelivery, getTopRatedFoodSpots, searchMenuItems } = require('../controllers/foodSpotController');

const router = express.Router();

/**
 * @route   GET /api/v1/food
 * @desc    Get all food spots with filters
 * @access  Public
 */
router.get('/', getFoodSpots);

/**
 * @route   GET /api/v1/food/top-rated
 * @desc    Get top-rated food spots
 * @access  Public
 */
router.get('/top-rated', getTopRatedFoodSpots);

/**
 * @route   GET /api/v1/food/delivery
 * @desc    Get food spots with delivery available
 * @access  Public
 */
router.get('/delivery', getFoodSpotsWithDelivery);

/**
 * @route   GET /api/v1/food/search-menu
 * @desc    Search menu items
 * @access  Public
 */
router.get('/search-menu', searchMenuItems);

/**
 * @route   GET /api/v1/food/category/:category
 * @desc    Get food spots by category
 * @access  Public
 */
router.get('/category/:category', getFoodSpotsByCategory);

/**
 * @route   GET /api/v1/food/cuisine/:cuisine
 * @desc    Get food spots by cuisine
 * @access  Public
 */
router.get('/cuisine/:cuisine', getFoodSpotsByCuisine);

/**
 * @route   GET /api/v1/food/:spotId
 * @desc    Get food spot by ID
 * @access  Public
 */
router.get('/:spotId', getFoodSpotById);

module.exports = router;
