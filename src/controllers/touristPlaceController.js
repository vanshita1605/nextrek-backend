// src/controllers/touristPlaceController.js
const TouristPlace = require('../models/TouristPlace');
const City = require('../models/City');

// Get all tourist places with filters
exports.getTouristPlaces = async (req, res) => {
  try {
    const { page = 1, limit = 10, cityId, category, rating, search } = req.query;

    let query = {};
    if (cityId) query.city = cityId;
    if (category) query.category = category;
    if (rating) query.rating = { $gte: parseInt(rating) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const places = await TouristPlace.find(query)
      .populate('city', 'name country')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TouristPlace.countDocuments(query);

    res.json({
      success: true,
      data: {
        places,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get tourist places error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tourist places',
      error: error.message,
    });
  }
};

// Get place by ID
exports.getTouristPlaceById = async (req, res) => {
  try {
    const { placeId } = req.params;

    const place = await TouristPlace.findById(placeId)
      .populate('city', 'name country')
      .populate('reviews')
      .populate('nearbyPlaces', 'name rating');

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Tourist place not found',
      });
    }

    res.json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error('Get place by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get place',
      error: error.message,
    });
  }
};

// Get places by category
exports.getPlacesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const places = await TouristPlace.find({ category })
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TouristPlace.countDocuments({ category });

    res.json({
      success: true,
      data: {
        places,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get places by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get places',
      error: error.message,
    });
  }
};

// Get top-rated places
exports.getTopRatedPlaces = async (req, res) => {
  try {
    const { cityId, limit = 10 } = req.query;

    let query = { rating: { $gte: 4 } };
    if (cityId) query.city = cityId;

    const places = await TouristPlace.find(query)
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: places,
    });
  } catch (error) {
    console.error('Get top-rated places error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top-rated places',
      error: error.message,
    });
  }
};

// Get nearby places
exports.getNearbyPlaces = async (req, res) => {
  try {
    const { placeId } = req.params;

    const place = await TouristPlace.findById(placeId)
      .populate('nearbyPlaces', 'name category rating latitude longitude images');

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Tourist place not found',
      });
    }

    res.json({
      success: true,
      data: place.nearbyPlaces,
    });
  } catch (error) {
    console.error('Get nearby places error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby places',
      error: error.message,
    });
  }
};

// Get safe places
exports.getSafePlaces = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { isSafe: true };
    if (cityId) query.city = cityId;

    const places = await TouristPlace.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TouristPlace.countDocuments(query);

    res.json({
      success: true,
      data: {
        places,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get safe places error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safe places',
      error: error.message,
    });
  }
};
