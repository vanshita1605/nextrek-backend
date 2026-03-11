// src/routes/cityRoutes.js
const express = require('express');
const { getCities, getCityById, getCitiesByCountry, getSafeCities, getEmergencyServices, getSafetyInfo } = require('../controllers/cityController');

const router = express.Router();

/**
 * @route   GET /api/v1/cities
 * @desc    Get all cities with filters
 * @access  Public
 */
router.get('/', getCities);

/**
 * @route   GET /api/v1/cities/safe
 * @desc    Get safe cities with optional minimum rating
 * @access  Public
 */
router.get('/safe', getSafeCities);

/**
 * @route   GET /api/v1/cities/:cityId
 * @desc    Get city by ID with all related data
 * @access  Public
 */
router.get('/:cityId', getCityById);

/**
 * @route   GET /api/v1/cities/country/:country
 * @desc    Get cities by country
 * @access  Public
 */
router.get('/country/:country', getCitiesByCountry);

/**
 * @route   GET /api/v1/cities/:cityId/emergency-services
 * @desc    Get emergency services for a city
 * @access  Public
 */
router.get('/:cityId/emergency-services', getEmergencyServices);

/**
 * @route   GET /api/v1/cities/:cityId/safety-info
 * @desc    Get safety information for a city
 * @access  Public
 */
router.get('/:cityId/safety-info', getSafetyInfo);

module.exports = router;
