// src/controllers/hotelController.js
const Hotel = require('../models/Hotel');

// Get all hotels with filters
exports.getHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10, cityId, stars, rating, search, priceMin, priceMax } = req.query;

    let query = {};
    if (cityId) query.city = cityId;
    if (stars) query.stars = parseInt(stars);
    if (rating) query.rating = { $gte: parseInt(rating) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Price range filter for rooms
    if (priceMin || priceMax) {
      query.rooms = {
        $elemMatch: {
          price: {
            ...(priceMin && { $gte: parseInt(priceMin) }),
            ...(priceMax && { $lte: parseInt(priceMax) }),
          },
        },
      };
    }

    const hotels = await Hotel.find(query)
      .populate('city', 'name country')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: {
        hotels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

// Get hotel by ID
exports.getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId)
      .populate('city', 'name country')
      .populate('reviews');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error('Get hotel by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hotel',
      error: error.message,
    });
  }
};

// Get hotels by star rating
exports.getHotelsByStars = async (req, res) => {
  try {
    const { stars } = req.params;
    const { page = 1, limit = 10, cityId } = req.query;

    let query = { stars: parseInt(stars) };
    if (cityId) query.city = cityId;

    const hotels = await Hotel.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: {
        hotels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get hotels by stars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

// Get luxury hotels (5-star)
exports.getLuxuryHotels = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { stars: 5 };
    if (cityId) query.city = cityId;

    const hotels = await Hotel.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: {
        hotels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get luxury hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get luxury hotels',
      error: error.message,
    });
  }
};

// Get budget hotels
exports.getBudgetHotels = async (req, res) => {
  try {
    const { cityId, page = 1, limit = 10 } = req.query;

    let query = { stars: { $lte: 2 } };
    if (cityId) query.city = cityId;

    const hotels = await Hotel.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: {
        hotels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get budget hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budget hotels',
      error: error.message,
    });
  }
};

// Get hotels with specific amenities
exports.getHotelsWithAmenities = async (req, res) => {
  try {
    const { amenities, cityId, page = 1, limit = 10 } = req.query;

    const amenityArray = amenities.split(',');

    let query = {
      amenities: { $all: amenityArray },
    };
    if (cityId) query.city = cityId;

    const hotels = await Hotel.find(query)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: {
        hotels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get hotels with amenities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

// Get available room types
exports.getAvailableRooms = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate } = req.query;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const availableRooms = hotel.rooms.filter((room) => room.available);

    res.json({
      success: true,
      data: {
        hotel: {
          id: hotel._id,
          name: hotel.name,
          checkInTime: hotel.checkInTime,
          checkOutTime: hotel.checkOutTime,
        },
        rooms: availableRooms,
        checkIn: checkInDate,
        checkOut: checkOutDate,
      },
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available rooms',
      error: error.message,
    });
  }
};
