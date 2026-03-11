// src/controllers/adminController.js
const City = require('../models/City');
const TouristPlace = require('../models/TouristPlace');
const FoodSpot = require('../models/FoodSpot');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============ CITY MANAGEMENT ============

exports.createCity = async (req, res) => {
  try {
    const { name, country, state, latitude, longitude, description, population, bestTimeToVisit, weather, averageBudgetPerDay, language, currency, timezone, highlights, safetyRating, image } = req.body;

    const existingCity = await City.findOne({ name: name.toLowerCase() });
    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: 'City already exists',
      });
    }

    const city = new City({
      name,
      country,
      state,
      latitude,
      longitude,
      description,
      population,
      bestTimeToVisit,
      weather,
      averageBudgetPerDay,
      language,
      currency,
      timezone,
      highlights,
      safetyRating,
      image,
    });

    await city.save();

    res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: city,
    });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message,
    });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const updates = req.body;

    const city = await City.findByIdAndUpdate(cityId, updates, { new: true, runValidators: true });
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    res.json({
      success: true,
      message: 'City updated successfully',
      data: city,
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message,
    });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findByIdAndDelete(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    res.json({
      success: true,
      message: 'City deleted successfully',
    });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message,
    });
  }
};

// ============ TOURIST PLACE MANAGEMENT ============

exports.createTouristPlace = async (req, res) => {
  try {
    const { name, city, description, category, latitude, longitude, address, entryFee, timings, duration, rating, isSafe, safetyNotes, restrooms, parking, foodAvailable, guidedTours, bestTimeToVisit } = req.body;

    const place = new TouristPlace({
      name,
      city,
      description,
      category,
      latitude,
      longitude,
      address,
      entryFee,
      timings,
      duration,
      rating,
      isSafe,
      safetyNotes,
      restrooms,
      parking,
      foodAvailable,
      guidedTours,
      bestTimeToVisit,
    });

    await place.save();

    res.status(201).json({
      success: true,
      message: 'Tourist place created successfully',
      data: place,
    });
  } catch (error) {
    console.error('Create tourist place error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tourist place',
      error: error.message,
    });
  }
};

exports.updateTouristPlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const updates = req.body;

    const place = await TouristPlace.findByIdAndUpdate(placeId, updates, { new: true, runValidators: true });
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Tourist place not found',
      });
    }

    res.json({
      success: true,
      message: 'Tourist place updated successfully',
      data: place,
    });
  } catch (error) {
    console.error('Update tourist place error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tourist place',
      error: error.message,
    });
  }
};

exports.deleteTouristPlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    const place = await TouristPlace.findByIdAndDelete(placeId);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Tourist place not found',
      });
    }

    res.json({
      success: true,
      message: 'Tourist place deleted successfully',
    });
  } catch (error) {
    console.error('Delete tourist place error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tourist place',
      error: error.message,
    });
  }
};

// ============ FOOD SPOT MANAGEMENT ============

exports.createFoodSpot = async (req, res) => {
  try {
    const { name, city, description, cuisine, category, latitude, longitude, address, priceRange, rating, timings, contactNumber, website, deliveryAvailable, reservationRequired, parking, wifi, speciality } = req.body;

    const spot = new FoodSpot({
      name,
      city,
      description,
      cuisine,
      category,
      latitude,
      longitude,
      address,
      priceRange,
      rating,
      timings,
      contactNumber,
      website,
      deliveryAvailable,
      reservationRequired,
      parking,
      wifi,
      speciality,
    });

    await spot.save();

    res.status(201).json({
      success: true,
      message: 'Food spot created successfully',
      data: spot,
    });
  } catch (error) {
    console.error('Create food spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create food spot',
      error: error.message,
    });
  }
};

exports.updateFoodSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const updates = req.body;

    const spot = await FoodSpot.findByIdAndUpdate(spotId, updates, { new: true, runValidators: true });
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Food spot not found',
      });
    }

    res.json({
      success: true,
      message: 'Food spot updated successfully',
      data: spot,
    });
  } catch (error) {
    console.error('Update food spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update food spot',
      error: error.message,
    });
  }
};

exports.deleteFoodSpot = async (req, res) => {
  try {
    const { spotId } = req.params;

    const spot = await FoodSpot.findByIdAndDelete(spotId);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Food spot not found',
      });
    }

    res.json({
      success: true,
      message: 'Food spot deleted successfully',
    });
  } catch (error) {
    console.error('Delete food spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food spot',
      error: error.message,
    });
  }
};

// ============ HOTEL MANAGEMENT ============

exports.createHotel = async (req, res) => {
  try {
    const { name, city, description, stars, latitude, longitude, address, contactNumber, email, website, amenities, facilities, rating, checkInTime, checkOutTime, cancellationPolicy, parking, wifi, gym, pool, restaurant, bar, concierge, petsAllowed, rooms } = req.body;

    const hotel = new Hotel({
      name,
      city,
      description,
      stars,
      latitude,
      longitude,
      address,
      contactNumber,
      email,
      website,
      amenities,
      facilities,
      rating,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      parking,
      wifi,
      gym,
      pool,
      restaurant,
      bar,
      concierge,
      petsAllowed,
      rooms,
    });

    await hotel.save();

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: hotel,
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hotel',
      error: error.message,
    });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const updates = req.body;

    const hotel = await Hotel.findByIdAndUpdate(hotelId, updates, { new: true, runValidators: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: hotel,
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hotel',
      error: error.message,
    });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findByIdAndDelete(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hotel',
      error: error.message,
    });
  }
};

// ============ TRANSPORT MANAGEMENT ============

exports.createTransport = async (req, res) => {
  try {
    const { city, type, companyName, contactNumber, email, website, description, basePrice, pricePerKm, pricePerHour, vehicles, timings, pickupLocations, rating, safetyFeatures, insuranceCovered, driverRating, paymentMethods, refundPolicy } = req.body;

    const transport = new Transport({
      city,
      type,
      companyName,
      contactNumber,
      email,
      website,
      description,
      basePrice,
      pricePerKm,
      pricePerHour,
      vehicles,
      timings,
      pickupLocations,
      rating,
      safetyFeatures,
      insuranceCovered,
      driverRating,
      paymentMethods,
      refundPolicy,
    });

    await transport.save();

    res.status(201).json({
      success: true,
      message: 'Transport option created successfully',
      data: transport,
    });
  } catch (error) {
    console.error('Create transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transport',
      error: error.message,
    });
  }
};

exports.updateTransport = async (req, res) => {
  try {
    const { transportId } = req.params;
    const updates = req.body;

    const transport = await Transport.findByIdAndUpdate(transportId, updates, { new: true, runValidators: true });
    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    res.json({
      success: true,
      message: 'Transport updated successfully',
      data: transport,
    });
  } catch (error) {
    console.error('Update transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transport',
      error: error.message,
    });
  }
};

exports.deleteTransport = async (req, res) => {
  try {
    const { transportId } = req.params;

    const transport = await Transport.findByIdAndDelete(transportId);
    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    res.json({
      success: true,
      message: 'Transport deleted successfully',
    });
  } catch (error) {
    console.error('Delete transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transport',
      error: error.message,
    });
  }
};

// ============ USER MANAGEMENT ============

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCities = await City.countDocuments();
    const totalPlaces = await TouristPlace.countDocuments();
    const totalFoodSpots = await FoodSpot.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    const totalTransports = await Transport.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCities,
        totalPlaces,
        totalFoodSpots,
        totalHotels,
        totalTransports,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
};
