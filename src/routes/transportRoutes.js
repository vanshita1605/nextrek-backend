// src/routes/transportRoutes.js
const express = require('express');
const { getTransports, getTransportById, getTransportsByType, getTaxis, getBikeRentals, getCarRentals, get24_7Transports, calculateTransportCost, getTopRatedTransports } = require('../controllers/transportController');

const router = express.Router();

/**
 * @route   GET /api/v1/transport
 * @desc    Get all transport options
 * @access  Public
 */
router.get('/', getTransports);

/**
 * @route   GET /api/v1/transport/taxis
 * @desc    Get taxi options
 * @access  Public
 */
router.get('/taxis', getTaxis);

/**
 * @route   GET /api/v1/transport/bikes
 * @desc    Get bike rental options
 * @access  Public
 */
router.get('/bikes', getBikeRentals);

/**
 * @route   GET /api/v1/transport/cars
 * @desc    Get car rental options
 * @access  Public
 */
router.get('/cars', getCarRentals);

/**
 * @route   GET /api/v1/transport/24-7
 * @desc    Get 24/7 available transports
 * @access  Public
 */
router.get('/24-7', get24_7Transports);

/**
 * @route   GET /api/v1/transport/top-rated
 * @desc    Get top-rated transports
 * @access  Public
 */
router.get('/top-rated', getTopRatedTransports);

/**
 * @route   POST /api/v1/transport/calculate-cost
 * @desc    Calculate transport cost
 * @access  Public
 */
router.post('/calculate-cost', calculateTransportCost);

/**
 * @route   GET /api/v1/transport/type/:type
 * @desc    Get transports by type
 * @access  Public
 */
router.get('/type/:type', getTransportsByType);

/**
 * @route   GET /api/v1/transport/:transportId
 * @desc    Get transport by ID
 * @access  Public
 */
router.get('/:transportId', getTransportById);

module.exports = router;
