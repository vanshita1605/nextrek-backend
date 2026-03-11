// src/controllers/foodSpotController.js
const FoodSpot = require('../models/FoodSpot');

// Get all food spots with filters
exports.getFoodSpots = async (req, res) => {
  try {
    const { page = 1, limit = 10, cityId, category, cuisine, rating, search, priceRange } = req.query;

    let query = {};
    if (cityId) query.city = cityId;
    if (category) query.category = category;
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (rating) query.rating = { $gte: parseInt(rating) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      query.$and = [
        { 'priceRange.min': { $gte: parseInt(min) } },
        { 'priceRange.max': { $lte: parseInt(max) } },
      ];
    }

    const foodSpots = await FoodSpot.find(query)
      .populate('city', 'name country')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FoodSpot.countDocuments(query);

    res.json({
      success: true,
      data: {
        foodSpots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get food spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get food spots',
      error: error.message,
    });
  }
};

// Get food spot by ID
exports.getFoodSpotById = async (req, res) => {
  try {
    const { spotId } = req.params;

    const spot = await FoodSpot.findById(spotId)
      .populate('city', 'name country')
      .populate('reviews');

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Food spot not found',
      });
    }

    res.json({
      success: true,
      data: spot,
    });
  } catch (error) {
    console.error('Get food spot by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get food spot',
      error: error.message,
    });
  }
};

// Get food spots by category
exports.getFoodSpotsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, cityId } = req.query;

    let query = { category };
    if (cityId) query.city = cityId;

    const spots = await FoodSpot.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FoodSpot.countDocuments(query);

    res.json({
      success: true,
      data: {
        spots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get food spots by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get food spots',
      error: error.message,
    });
  }
};

// Get food spots by cuisine
exports.getFoodSpotsByCuisine = async (req, res) => {
  try {
    const { cuisine } = req.params;
    const { page = 1, limit = 10, cityId } = req.query;

    let query = { cuisine: { $in: [cuisine] } };
    if (cityId) query.city = cityId;

    const spots = await FoodSpot.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FoodSpot.countDocuments(query);

    res.json({
      success: true,
      data: {
        spots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get food spots by cuisine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get food spots',
      error: error.message,
    });
  }
};

// Get food spots with delivery
exports.getFoodSpotsWithDelivery = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { deliveryAvailable: true };
    if (cityId) query.city = cityId;

    const spots = await FoodSpot.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FoodSpot.countDocuments(query);

    res.json({
      success: true,
      data: {
        spots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get delivery spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery spots',
      error: error.message,
    });
  }
};

// Get top-rated food spots
exports.getTopRatedFoodSpots = async (req, res) => {
  try {
    const { cityId, limit = 10 } = req.query;

    let query = { rating: { $gte: 4 } };
    if (cityId) query.city = cityId;

    const spots = await FoodSpot.find(query)
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: spots,
    });
  } catch (error) {
    console.error('Get top-rated food spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top-rated food spots',
      error: error.message,
    });
  }
};

// Search menu items
exports.searchMenuItems = async (req, res) => {
  try {
    const { search, vegetarian, vegan, glutenFree, cityId, page = 1, limit = 10 } = req.query;

    let query = {};
    if (cityId) query.city = cityId;

    let menuQuery = [];
    if (search) menuQuery.push({ menu: { $elemMatch: { itemName: { $regex: search, $options: 'i' } } } });
    if (vegetarian === 'true') menuQuery.push({ menu: { $elemMatch: { vegetarian: true } } });
    if (vegan === 'true') menuQuery.push({ menu: { $elemMatch: { vegan: true } } });
    if (glutenFree === 'true') menuQuery.push({ menu: { $elemMatch: { glutenFree: true } } });

    if (menuQuery.length > 0) {
      query.$or = menuQuery;
    }

    const spots = await FoodSpot.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FoodSpot.countDocuments(query);

    res.json({
      success: true,
      data: {
        spots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Search menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search menu items',
      error: error.message,
    });
  }
};
