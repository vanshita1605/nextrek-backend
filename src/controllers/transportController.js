// src/controllers/transportController.js
const Transport = require('../models/Transport');

// Get all transport options
exports.getTransports = async (req, res) => {
  try {
    const { page = 1, limit = 10, cityId, type, search } = req.query;

    let query = {};
    if (cityId) query.city = cityId;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const transports = await Transport.find(query)
      .populate('city', 'name country')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transport.countDocuments(query);

    res.json({
      success: true,
      data: {
        transports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transports',
      error: error.message,
    });
  }
};

// Get transport by ID
exports.getTransportById = async (req, res) => {
  try {
    const { transportId } = req.params;

    const transport = await Transport.findById(transportId)
      .populate('city', 'name country')
      .populate('reviews');

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport option not found',
      });
    }

    res.json({
      success: true,
      data: transport,
    });
  } catch (error) {
    console.error('Get transport by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transport',
      error: error.message,
    });
  }
};

// Get transports by type
exports.getTransportsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, cityId } = req.query;

    let query = { type };
    if (cityId) query.city = cityId;

    const transports = await Transport.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transport.countDocuments(query);

    res.json({
      success: true,
      data: {
        transports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transports by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transports',
      error: error.message,
    });
  }
};

// Get taxis
exports.getTaxis = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { type: 'taxi' };
    if (cityId) query.city = cityId;

    const taxis = await Transport.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transport.countDocuments(query);

    res.json({
      success: true,
      data: {
        taxis,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get taxis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get taxis',
      error: error.message,
    });
  }
};

// Get bike rentals
exports.getBikeRentals = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { type: 'bike' };
    if (cityId) query.city = cityId;

    const bikes = await Transport.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transport.countDocuments(query);

    res.json({
      success: true,
      data: {
        bikes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get bike rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bike rentals',
      error: error.message,
    });
  }
};

// Get car rentals
exports.getCarRentals = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { type: 'car' };
    if (cityId) query.city = cityId;

    const cars = await Transport.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transport.countDocuments(query);

    res.json({
      success: true,
      data: {
        cars,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get car rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get car rentals',
      error: error.message,
    });
  }
};

// Get 24/7 available transports
exports.get24_7Transports = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { 'timings.available24_7': true };
    if (cityId) query.city = cityId;

    const transports = await Transport.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transport.countDocuments(query);

    res.json({
      success: true,
      data: {
        transports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get 24/7 transports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 24/7 transports',
      error: error.message,
    });
  }
};

// Calculate transport cost
exports.calculateTransportCost = async (req, res) => {
  try {
    const { transportType, distance, hours, passengers } = req.body;

    // allow zero values; require at least one of distance or hours to be present (not null/undefined)
    if (distance == null && hours == null) {
      return res.status(400).json({
        success: false,
        message: 'Distance or hours is required',
      });
    }

    // Base rates for different transport types
    const baseRates = {
      taxi: { basePrice: 50, pricePerKm: 15, pricePerHour: 200 },
      uber: { basePrice: 40, pricePerKm: 12, pricePerHour: 180 },
      bus: { basePrice: 20, pricePerKm: 5, pricePerHour: 100 },
      train: { basePrice: 30, pricePerKm: 3, pricePerHour: 150 },
      flight: { basePrice: 5000, pricePerKm: 0.5, pricePerHour: 0 },
      car_rental: { basePrice: 1000, pricePerKm: 0, pricePerHour: 500 },
    };

    const type = transportType?.toLowerCase() || 'taxi';
    const rate = baseRates[type] || baseRates.taxi;

    let baseCost = rate.basePrice || 0;
    let distanceCost = (distance || 0) * (rate.pricePerKm || 0);
    let hoursCost = (hours || 0) * (rate.pricePerHour || 0);
    
    const totalCost = baseCost + distanceCost + hoursCost;
    const passengerCount = passengers || 1;
    const costPerPassenger = totalCost / passengerCount;

    res.json({
      success: true,
      data: {
        transportType: type,
        distance: distance || 0,
        hours: hours || 0,
        passengers: passengerCount,
        baseCost,
        distanceCost,
        hoursCost,
        totalCost: Math.round(totalCost),
        costPerPassenger: Math.round(costPerPassenger),
        estimatedTime: hours || Math.ceil((distance || 0) / 50), // assuming 50km/hr average
      },
    });
  } catch (error) {
    console.error('Calculate cost error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate cost',
      error: error.message,
    });
  }
};

// Get top-rated transports
exports.getTopRatedTransports = async (req, res) => {
  try {
    const { cityId, limit = 10, type } = req.query;

    let query = { rating: { $gte: 4 } };
    if (cityId) query.city = cityId;
    if (type) query.type = type;

    const transports = await Transport.find(query)
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transports,
    });
  } catch (error) {
    console.error('Get top-rated transports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top-rated transports',
      error: error.message,
    });
  }
};
