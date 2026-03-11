// src/controllers/cityController.js
const City = require('../models/City');
const redisClient = require('../config/redis');

// Get all cities with pagination and filters
exports.getCities = async (req, res) => {
  try {
    const { page = 1, limit = 10, country, search, sortBy = 'name' } = req.query;

    // Check cache first
    const cacheKey = `cities_${page}_${limit}_${country}_${search}_${sortBy}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: JSON.parse(cachedData),
        source: 'cache',
      });
    }

    let query = {};
    if (country) query.country = country;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    if (sortBy === 'name') sortOptions.name = 1;
    if (sortBy === 'safetyRating') sortOptions.safetyRating = -1;
    if (sortBy === 'popularity') sortOptions.rating = -1;

    const cities = await City.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await City.countDocuments(query);

    const response = {
      cities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json({
      success: true,
      data: response,
      source: 'database',
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cities',
      error: error.message,
    });
  }
};

// Get city by ID with all related data
exports.getCityById = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId)
      .populate('touristPlaces')
      .populate('foodSpots')
      .populate('hotels')
      .populate('transports');

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    res.json({
      success: true,
      data: city,
    });
  } catch (error) {
    console.error('Get city by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get city',
      error: error.message,
    });
  }
};

// Get cities by country
exports.getCitiesByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const cities = await City.find({ country })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await City.countDocuments({ country });

    res.json({
      success: true,
      data: {
        cities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get cities by country error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cities',
      error: error.message,
    });
  }
};

// Get cities with safety rating
exports.getSafeCities = async (req, res) => {
  try {
    const { minRating = 3, page = 1, limit = 10 } = req.query;

    const cities = await City.find({ safetyRating: { $gte: minRating } })
      .sort({ safetyRating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await City.countDocuments({ safetyRating: { $gte: minRating } });

    res.json({
      success: true,
      data: {
        cities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get safe cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safe cities',
      error: error.message,
    });
  }
};

// Get emergency contacts for a city
exports.getEmergencyServices = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    res.json({
      success: true,
      data: city.emergencyContacts,
    });
  } catch (error) {
    console.error('Get emergency services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency services',
      error: error.message,
    });
  }
};

// Get safe and unsafe areas for a city
exports.getSafetyInfo = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    res.json({
      success: true,
      data: {
        safeAreas: city.safeAreas,
        unsafeAreas: city.unsafeAreas,
        safetyRating: city.safetyRating,
      },
    });
  } catch (error) {
    console.error('Get safety info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safety info',
      error: error.message,
    });
  }
};
