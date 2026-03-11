// src/controllers/packingChecklistController.js
const PackingChecklist = require('../models/PackingChecklist');
const Trip = require('../models/Trip');
const City = require('../models/City');
const User = require('../models/User');
const WeatherService = require('../services/weatherService');
const PackingRulesEngine = require('../services/packingRulesEngine');

// Predefined packing items by category
const PACKING_CATEGORIES = {
  clothing: [
    'T-shirts',
    'Jeans/Trousers',
    'Shorts',
    'Dress/Formal wear',
    'Jacket/Hoodie',
    'Underwear',
    'Socks',
    'Comfortable shoes',
    'Formal shoes',
    'Sandals/Flip flops',
    'Swimwear',
    'Hat/Cap',
    'Scarf',
    'Gloves',
    'Sweater',
    'Thermal wear',
  ],
  toiletries: [
    'Toothbrush',
    'Toothpaste',
    'Deodorant',
    'Shampoo',
    'Conditioner',
    'Body wash',
    'Face wash',
    'Moisturizer',
    'Sunscreen',
    'Lip balm',
    'Razor',
    'Shaving cream',
    'Nail clipper',
    'Comb/Brush',
    'Feminine hygiene products',
    'Medications',
  ],
  documents: [
    'Passport',
    'Visa',
    'Travel tickets',
    'Hotel confirmations',
    'Travel insurance',
    'ID card',
    'Driving license',
    'Bank statements',
    'Emergency contacts',
    'Travel itinerary',
    'Health records',
  ],
  electronics: [
    'Mobile phone',
    'Charger',
    'Power bank',
    'Laptop',
    'Camera',
    'Headphones',
    'Universal adapter',
    'USB cables',
    'Smartwatch',
    'Portable speaker',
    'E-reader',
  ],
  miscellaneous: [
    'Wallet',
    'Backpack',
    'Luggage',
    'Travel pillow',
    'Eye mask',
    'Earplugs',
    'Trash bags',
    'Duct tape',
    'Sewing kit',
    'First aid kit',
    'Notebook',
    'Pen',
    'Book/Magazine',
    'Travel guide',
    'Reusable water bottle',
    'Snacks',
  ],
  weatherSpecific: [
    'Raincoat/Umbrella',
    'Snow boots',
    'Winter coat',
    'Beach cover-up',
    'Hiking boots',
    'Insect repellent',
    'Sunhat',
    'Waterproof bag',
  ],
  tripTypeSpecific: [
    'Hiking gear',
    'Adventure equipment',
    'Business casual',
    'Party outfits',
    'Yoga mat',
    'Snorkeling gear',
  ],
};

// Generate checklist based on smart rules engine with weather integration
exports.generateChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { season, tripType, interests = [], fetchWeather = true } = req.body;

    const trip = await Trip.findById(tripId)
      .populate('city')
      .populate('owner', 'firstName lastName');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify authorization
    if (trip.owner._id.toString() !== req.userId
      && !trip.participants.some((p) => p.userId.toString() === req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create checklist for this trip',
      });
    }

    // Check if checklist already exists
    const existingChecklist = await PackingChecklist.findOne({ tripId });
    if (existingChecklist) {
      return res.status(400).json({
        success: false,
        message: 'Checklist already exists for this trip',
      });
    }

    // Get weather data if requested
    let weatherData = null;
    const cityName = trip.city?.name || 'Unknown';
    if (fetchWeather && trip.city) {
      const weatherResult = await WeatherService.getWeatherForCity(
        cityName,
        trip.city.country || ''
      );
      if (weatherResult.success) {
        weatherData = weatherResult.weather;
      }
    }

    // Use packing rules engine to generate checklist
    const ruleResult = await PackingRulesEngine.generatePackingChecklist({
      destination: cityName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tripType: tripType || trip.tripType || 'leisure',
      weather: weatherData,
      season,
      interests,
    });

    if (!ruleResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate checklist',
        error: ruleResult.error,
      });
    }

    // Convert checklist structure to categories format for model
    const categories = [];
    Object.entries(ruleResult.checklist).forEach(([categoryKey, categoryData]) => {
      categories.push({
        categoryName: categoryData.name,
        items: categoryData.items.map((item) => ({
          name: item.name,
          packed: false,
          priority: item.priority || 'medium',
          quantity: item.quantity || 1,
          notes: '',
          addedBy: req.userId,
        })),
      });
    });

    // Save checklist to database
    const checklist = new PackingChecklist({
      tripId,
      season: ruleResult.metadata.season,
      weatherConditions: ruleResult.metadata.weather?.condition || 'unknown',
      tripType: tripType || trip.tripType || 'leisure',
      categories,
      completionPercentage: 0,
      customItems: [],
      weatherAlerts: ruleResult.metadata.alerts,
      generatedWith: 'smart-engine',
    });

    await checklist.save();

    res.status(201).json({
      success: true,
      message: 'Packing checklist generated successfully with smart rules engine',
      data: {
        checklist,
        metadata: ruleResult.metadata,
        statistics: {
          totalItems: categories.reduce((sum, cat) => sum + cat.items.length, 0),
          totalCategories: categories.length,
          estimatedPackTime: '2-3 hours',
        },
      },
    });
  } catch (error) {
    console.error('Generate checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate checklist',
      error: error.message,
    });
  }
};

// Get checklist for trip
exports.getChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;

    const checklist = await PackingChecklist.findOne({ tripId });
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found',
      });
    }

    res.json({
      success: true,
      data: checklist,
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get checklist',
      error: error.message,
    });
  }
};

// Update item status
exports.updateItemStatus = async (req, res) => {
  try {
    const { checklistId, itemIndex } = req.params;
    const { isChecked, notes } = req.body;

    const checklist = await PackingChecklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found',
      });
    }

    if (!checklist.items[itemIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    checklist.items[itemIndex].isChecked = isChecked;
    if (notes !== undefined) {
      checklist.items[itemIndex].notes = notes;
    }

    await checklist.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: checklist.items[itemIndex],
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message,
    });
  }
};

// Add custom item
exports.addCustomItem = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { item, category, priority } = req.body;

    if (!item || !category) {
      return res.status(400).json({
        success: false,
        message: 'Item and category are required',
      });
    }

    const checklist = await PackingChecklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found',
      });
    }

    checklist.items.push({
      category,
      item,
      isChecked: false,
      priority: priority || 'medium',
      notes: 'Custom item',
      isCustom: true,
    });

    await checklist.save();

    res.status(201).json({
      success: true,
      message: 'Custom item added',
      data: checklist.items[checklist.items.length - 1],
    });
  } catch (error) {
    console.error('Add custom item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add custom item',
      error: error.message,
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { checklistId, itemIndex } = req.params;

    const checklist = await PackingChecklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found',
      });
    }

    checklist.items.splice(itemIndex, 1);
    await checklist.save();

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message,
    });
  }
};

// Get progress
exports.getProgress = async (req, res) => {
  try {
    const { tripId } = req.params;

    const checklist = await PackingChecklist.findOne({ tripId });
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found',
      });
    }

    const totalItems = checklist.items.length;
    const checkedItems = checklist.items.filter((item) => item.isChecked).length;
    const progressPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    const itemsByCategory = {};
    checklist.items.forEach((item) => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = {
          total: 0,
          checked: 0,
        };
      }
      itemsByCategory[item.category].total += 1;
      if (item.isChecked) {
        itemsByCategory[item.category].checked += 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalItems,
        checkedItems,
        progressPercentage,
        itemsByCategory,
        uncheckedItems: checklist.items.filter((item) => !item.isChecked),
      },
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress',
      error: error.message,
    });
  }
};

// Get weather data for destination
exports.getDestinationWeather = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId).populate('city');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const cityName = trip.city?.name || 'Unknown';
    const country = trip.city?.country || '';

    // Get weather
    const weatherResult = await WeatherService.getWeatherForCity(
      cityName,
      country
    );

    if (!weatherResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get weather data',
        error: weatherResult.error,
      });
    }

    // Get weather alerts
    const alerts = WeatherService.getWeatherAlerts(weatherResult);

    // Get forecast
    const forecastResult = await WeatherService.getWeatherForecast(
      cityName,
      country,
      5
    );

    res.json({
      success: true,
      data: {
        tripId,
        destination: cityName,
        currentWeather: weatherResult.weather,
        forecast: forecastResult.success ? forecastResult.forecast : [],
        alerts,
        recommendations: this.getPackingRecommendations(weatherResult.weather, alerts),
      },
    });
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather data',
      error: error.message,
    });
  }
};

// Get packing recommendations based on weather
exports.getPackingSuggestions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { destination, tripType, season, interests = [] } = req.body;

    // Get weather if destination provided
    let weatherData = null;
    let alerts = [];

    if (destination) {
      const weatherResult = await WeatherService.getWeatherForCity(destination);
      if (weatherResult.success) {
        weatherData = weatherResult.weather;
        alerts = WeatherService.getWeatherAlerts(weatherResult);
      }
    }

    // Use packing rules engine
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    const ruleResult = await PackingRulesEngine.generatePackingChecklist({
      destination: destination || 'Generic',
      startDate: now,
      endDate,
      tripType: tripType || 'leisure',
      weather: weatherData,
      season,
      interests,
    });

    if (!ruleResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate suggestions',
        error: ruleResult.error,
      });
    }

    // Get weather-based suggestions
    const weatherSuggestions = alerts.map((alert) => ({
      type: alert.type,
      message: alert.message,
      items: this.getItemsForAlert(alert.type),
    }));

    res.json({
      success: true,
      data: {
        tripId,
        checklist: ruleResult.checklist,
        metadata: ruleResult.metadata,
        suggestions: weatherSuggestions,
        statistics: {
          totalItems: Object.values(ruleResult.checklist).reduce(
            (sum, cat) => sum + cat.items.length,
            0
          ),
          estimatedWeight: '5-10 kg (varies by selection)',
        },
      },
    });
  } catch (error) {
    console.error('Get packing suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get packing suggestions',
      error: error.message,
    });
  }
};

// Helper to get packing recommendations
const getPackingRecommendations = (weather, alerts) => {
  const recommendations = [];

  alerts.forEach((alert) => {
    recommendations.push({
      alert: alert.message,
      recommendations: getItemsForAlert(alert.type),
    });
  });

  return recommendations;
};

// Helper to get items for specific alert type
const getItemsForAlert = (alertType) => {
  const itemMap = {
    extreme_cold: [
      'Thermal underwear',
      'Winter coat',
      'Winter boots',
      'Warm hat and gloves',
      'Scarf',
      'Hand warmers',
    ],
    cold: ['Jacket', 'Long pants', 'Closed shoes', 'Warm socks'],
    extreme_heat: [
      'Lightweight clothing',
      'Sunscreen (SPF 50+)',
      'Hat with brim',
      'Sunglasses',
      'Water bottle (keep hydrated)',
    ],
    hot: [
      'Light colored clothing',
      'Sunscreen',
      'Hat',
      'Sunglasses',
    ],
    rain: ['Rain jacket', 'Waterproof bag', 'Umbrella', 'Water-resistant shoes'],
    snow: ['Snow boots', 'Snow pants', 'Snow gloves', 'Winter hat'],
    high_wind: ['Wind-resistant jacket', 'Hair clips', 'Small bag for wind'],
    thunderstorm: [
      'Umbrella',
      'Rain jacket',
      'Change of clothes',
      'Indoor activity ideas',
    ],
  };

  return itemMap[alertType] || [];
};

// Helper function to detect season
const detectSeason = (date) => {
  const month = new Date(date).getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

// Helper function to get priority
const getPriority = (category) => {
  const priorityMap = {
    documents: 'high',
    toiletries: 'high',
    electronics: 'high',
    clothing: 'medium',
    miscellaneous: 'low',
  };
  return priorityMap[category] || 'medium';
};
