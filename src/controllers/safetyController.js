// src/controllers/safetyController.js
const City = require('../models/City');
const TouristPlace = require('../models/TouristPlace');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const SafetyAlert = require('../models/SafetyAlert');
const SafetyAnalysisService = require('../services/safetyAnalysisService');

// Get safe areas in city
exports.getSafeAreas = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    const safeAreas = city.safetyAreas?.safe || [];
    const paginatedAreas = safeAreas.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        city: {
          name: city.name,
          safetyRating: city.safetyRating,
        },
        safeAreas: paginatedAreas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: safeAreas.length,
          pages: Math.ceil(safeAreas.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get safe areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safe areas',
      error: error.message,
    });
  }
};

// Get unsafe areas in city
exports.getUnsafeAreas = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    const unsafeAreas = city.safetyAreas?.unsafe || [];
    const paginatedAreas = unsafeAreas.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        city: {
          name: city.name,
          safetyRating: city.safetyRating,
        },
        unsafeAreas: paginatedAreas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: unsafeAreas.length,
          pages: Math.ceil(unsafeAreas.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get unsafe areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unsafe areas',
      error: error.message,
    });
  }
};

// Get emergency services in city
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

    const emergencyServices = city.emergencyContacts || [];

    res.json({
      success: true,
      data: {
        city: {
          name: city.name,
          country: city.country,
        },
        emergencyServices,
      },
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

// Get police stations nearby
exports.getNearbyPoliceStations = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    const policeStations = city.emergencyContacts
      ?.filter((contact) => contact.type === 'police')
      .map((contact) => ({
        name: contact.name,
        type: contact.type,
        phoneNumber: contact.phoneNumber,
        address: contact.address,
        coordinates: contact.coordinates,
        availability: contact.availability,
      })) || [];

    res.json({
      success: true,
      data: {
        city: city.name,
        policeStations,
        totalStations: policeStations.length,
      },
    });
  } catch (error) {
    console.error('Get police stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get police stations',
      error: error.message,
    });
  }
};

// Get nearby hospitals
exports.getNearbyHospitals = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    const hospitals = city.emergencyContacts
      ?.filter((contact) => contact.type === 'hospital')
      .map((contact) => ({
        name: contact.name,
        type: contact.type,
        phoneNumber: contact.phoneNumber,
        address: contact.address,
        coordinates: contact.coordinates,
        availability: contact.availability,
        services: contact.services || [],
      })) || [];

    res.json({
      success: true,
      data: {
        city: city.name,
        hospitals,
        totalHospitals: hospitals.length,
      },
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hospitals',
      error: error.message,
    });
  }
};

// Get city safety rating
exports.getCitySafetyRating = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    const safetyTips = city.safetyTips || [];

    res.json({
      success: true,
      data: {
        city: city.name,
        safetyRating: city.safetyRating,
        safetyRatingDescription: getSafetyDescription(city.safetyRating),
        safeAreas: city.safetyAreas?.safe?.length || 0,
        unsafeAreas: city.safetyAreas?.unsafe?.length || 0,
        safetyTips,
        recommendations: generateSafetyRecommendations(city.safetyRating),
      },
    });
  } catch (error) {
    console.error('Get safety rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safety rating',
      error: error.message,
    });
  }
};

// Get safe places (tourist places with safety flag)
exports.getSafePlaces = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const places = await TouristPlace.find({
      city: cityId,
      isSafety: true,
    })
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TouristPlace.countDocuments({
      city: cityId,
      isSafety: true,
    });

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

// Add location to safe list (user save)
exports.addToSafeList = async (req, res) => {
  try {
    const { placeId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.preferences.safePlaces) {
      user.preferences.safePlaces = [];
    }

    if (user.preferences.safePlaces.includes(placeId)) {
      return res.status(400).json({
        success: false,
        message: 'Place already in safe list',
      });
    }

    user.preferences.safePlaces.push(placeId);
    await user.save();

    res.json({
      success: true,
      message: 'Place added to safe list',
      data: {
        placeId,
      },
    });
  } catch (error) {
    console.error('Add to safe list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to safe list',
      error: error.message,
    });
  }
};

// Report unsafe place
exports.reportUnsafePlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { reason, description, severity } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    const place = await TouristPlace.findById(placeId);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found',
      });
    }

    if (!place.safetyReports) {
      place.safetyReports = [];
    }

    place.safetyReports.push({
      reportedBy: req.userId,
      reason,
      description,
      severity: severity || 'medium',
      reportedAt: new Date(),
    });

    // If severe or multiple reports, flag the place
    if (place.safetyReports.length >= 3 || severity === 'high') {
      place.isSafety = false;
    }

    await place.save();

    res.json({
      success: true,
      message: 'Safety report submitted',
      data: {
        placeId,
        totalReports: place.safetyReports.length,
      },
    });
  } catch (error) {
    console.error('Report unsafe place error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report place',
      error: error.message,
    });
  }
};

// Get user's emergency contacts
exports.getUserEmergencyContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.userId }).sort('priority');

    res.json({
      success: true,
      data: {
        contacts,
        total: contacts.length,
      },
    });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency contacts',
      error: error.message,
    });
  }
};

// Add emergency contact
exports.addEmergencyContact = async (req, res) => {
  try {
    const { name, phoneNumber, relationship, email, address, type, country, notes } = req.body;

    if (!name || !phoneNumber || !relationship) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and relationship are required',
      });
    }

    const contact = new EmergencyContact({
      userId: req.userId,
      name,
      phoneNumber,
      relationship,
      email,
      address,
      type: type || 'personal',
      country,
      notes,
      priority: 3,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Emergency contact added',
      data: contact,
    });
  } catch (error) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message,
    });
  }
};

// Update emergency contact
exports.updateEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const updates = req.body;

    const contact = await EmergencyContact.findOne({ _id: contactId, userId: req.userId });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    Object.assign(contact, updates);
    await contact.save();

    res.json({
      success: true,
      message: 'Contact updated',
      data: contact,
    });
  } catch (error) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message,
    });
  }
};

// Delete emergency contact
exports.deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const result = await EmergencyContact.deleteOne({ _id: contactId, userId: req.userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted',
    });
  } catch (error) {
    console.error('Delete emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message,
    });
  }
};

// Get nearby hospitals with distance
exports.getNearbyHospitalsWithDistance = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { latitude, longitude } = req.query;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const hospitals = (city.emergencyContacts || [])
      .filter((contact) => contact.type === 'hospital')
      .map((contact) => {
        const distance = SafetyAnalysisService.calculateDistance(
          userLat,
          userLon,
          contact.coordinates?.latitude,
          contact.coordinates?.longitude
        );

        return {
          id: contact._id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          address: contact.address,
          coordinates: contact.coordinates,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnits: 'km',
          availability: contact.availability,
          services: contact.services,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        city: city.name,
        hospitals,
        nearest: hospitals[0] || null,
        total: hospitals.length,
      },
    });
  } catch (error) {
    console.error('Get nearby hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby hospitals',
      error: error.message,
    });
  }
};

// Get nearby police stations with distance
exports.getNearbyPoliceWithDistance = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { latitude, longitude } = req.query;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const police = (city.emergencyContacts || [])
      .filter((contact) => contact.type === 'police')
      .map((contact) => {
        const distance = SafetyAnalysisService.calculateDistance(
          userLat,
          userLon,
          contact.coordinates?.latitude,
          contact.coordinates?.longitude
        );

        return {
          id: contact._id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          address: contact.address,
          coordinates: contact.coordinates,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnits: 'km',
          availability: contact.availability,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        city: city.name,
        policeStations: police,
        nearest: police[0] || null,
        total: police.length,
      },
    });
  } catch (error) {
    console.error('Get nearby police error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby police stations',
      error: error.message,
    });
  }
};

// Analyze location safety
exports.analyzeLocationSafety = async (req, res) => {
  try {
    const { city } = req.body;
    const { latitude, longitude } = req.body;

    if (!city || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'City, latitude, and longitude are required',
      });
    }

    const safetyAnalysis = await SafetyAnalysisService.analyzeLocationSafety(
      { coordinates: { latitude, longitude } },
      city
    );

    if (!safetyAnalysis.success === false) {
      const recommendations = SafetyAnalysisService.getSafetyRecommendations(
        safetyAnalysis.riskLevel
      );

      res.json({
        success: true,
        data: {
          location: { latitude, longitude, city },
          ...safetyAnalysis,
          recommendations,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to analyze location'
      });
    }
  } catch (error) {
    console.error('Analyze location safety error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze location safety',
      error: error.message,
    });
  }
};

// Get active safety alerts for a city
exports.getActiveSafetyAlerts = async (req, res) => {
  try {
    const { city } = req.query;
    const { severity, alertType } = req.query;

    let query = {
      isActive: true,
      expiresAt: { $gt: new Date() },
    };

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (severity) {
      query.severity = severity;
    }

    if (alertType) {
      query.alertType = alertType;
    }

    const alerts = await SafetyAlert.find(query)
      .sort({ severity: -1, createdAt: -1 })
      .limit(50);

    const grouped = {
      critical: alerts.filter((a) => a.severity === 'critical'),
      high: alerts.filter((a) => a.severity === 'high'),
      medium: alerts.filter((a) => a.severity === 'medium'),
      low: alerts.filter((a) => a.severity === 'low'),
    };

    res.json({
      success: true,
      data: {
        alerts,
        grouped,
        total: alerts.length,
        criticalCount: grouped.critical.length,
      },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message,
    });
  }
};

// Create safety alert
exports.createSafetyAlert = async (req, res) => {
  try {
    const {
      city,
      country,
      alertType,
      severity,
      title,
      description,
      affectedAreas,
      recommendations,
      expiresAt,
    } = req.body;

    if (!city || !alertType || !severity || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing',
      });
    }

    const alert = new SafetyAlert({
      userId: req.userId,
      city,
      country,
      alertType,
      severity,
      title,
      description,
      affectedAreas,
      recommendations,
      source: 'user_report',
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      isActive: true,
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: 'Safety alert created',
      data: alert,
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message,
    });
  }
};

// Acknowledge safety alert
exports.acknowledgeSafetyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await SafetyAlert.findByIdAndUpdate(
      alertId,
      {
        $addToSet: {
          acknowledgedBy: {
            userId: req.userId,
            acknowledgedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: alert,
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message,
    });
  }
};

// Delete emergency contact (alias for deleteEmergencyContact)
exports.removeEmergencyContact = exports.deleteEmergencyContact;

// Verify emergency contact (send verification code)
exports.verifyEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await EmergencyContact.findOne({ _id: contactId, userId: req.userId });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // TODO: Send verification code via email or SMS
    // For now, just mark as verified in dev mode
    contact.verified = true;
    contact.verificationCode = verificationCode;
    await contact.save();

    res.json({
      success: true,
      message: 'Verification code sent',
      data: {
        contactId: contact._id,
        contact: contact.phoneNumber || contact.email,
        note: 'Check your email or SMS for the verification code'
      },
    });
  } catch (error) {
    console.error('Verify emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification',
      error: error.message,
    });
  }
};

// Get nearby emergencies with safety analysis
exports.getNearbyEmergenciesWithAnalysis = async (req, res) => {
  try {
    const { latitude, longitude, type = 'both' } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Get nearby hospitals and police
    const result = await SafetyAnalysisService.checkNearbyEmergencies(userLat, userLon, type);

    // Analyze area safety
    const areaAnalysis = await SafetyAnalysisService.analyzeAreaSafety(userLat, userLon);

    res.json({
      success: true,
      data: {
        location: { latitude: userLat, longitude: userLon },
        emergencies: result,
        areaAnalysis,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Get nearby emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby emergency services',
      error: error.message,
    });
  }
};

// Generate safety alert
exports.generateSafetyAlert = async (req, res) => {
  try {
    const { city, location, alertType, severity, description, tripId } = req.body;

    if (!location || !alertType || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Location, alertType, and severity are required',
      });
    }

    const alert = new SafetyAlert({
      userId: req.userId,
      tripId: tripId || null,
      alertType,
      severity,
      location,
      description,
      recommendedAction: SafetyAnalysisService.getRecommendedAction(alertType, severity),
      isAcknowledged: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: 'Safety alert generated',
      data: alert,
    });
  } catch (error) {
    console.error('Generate safety alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate safety alert',
      error: error.message,
    });
  }
};

// Get user's safety alerts
exports.getUserSafetyAlerts = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status = 'all' } = req.query;

    let query = { userId: req.userId };
    
    if (tripId) {
      query.tripId = tripId;
    }

    if (status === 'acknowledged') {
      query.isAcknowledged = true;
    } else if (status === 'unacknowledged') {
      query.isAcknowledged = false;
    }

    // Also filter out expired alerts
    query.expiresAt = { $gt: new Date() };

    const alerts = await SafetyAlert.find(query)
      .sort({ severity: -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        acknowledged: alerts.filter(a => a.isAcknowledged).length,
        unacknowledged: alerts.filter(a => !a.isAcknowledged).length,
      },
    });
  } catch (error) {
    console.error('Get user safety alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get safety alerts',
      error: error.message,
    });
  }
};

// Analyze trip for safety
exports.analyzeTripSafety = async (req, res) => {
  try {
    const { tripId } = req.params;

    const Trip = require('../models/Trip');
    const trip = await Trip.findById(tripId).populate('destination');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Analyze all cities in trip
    const cities = [
      trip.destination?.name || trip.destination,
      ...(trip.cities || [])
    ];

    const analysis = await SafetyAnalysisService.analyzeTripSafety(cities);

    // Generate alerts for unsafe areas
    for (const city of cities) {
      const cityAnalysis = await SafetyAnalysisService.analyzeAreaSafety(city);
      if (cityAnalysis.riskLevel > 3) {
        // Create alert for unsafe areas
        await SafetyAlert.create({
          userId: req.userId,
          tripId,
          alertType: 'warning',
          severity: cityAnalysis.riskLevel > 4 ? 'high' : 'medium',
          location: city,
          description: `Travel alert for ${city}: Safety rating is ${cityAnalysis.riskLevel}/5`,
          recommendedAction: generateSafetyRecommendations(5 - cityAnalysis.riskLevel)[0],
          isAcknowledged: false,
        });
      }
    }

    res.json({
      success: true,
      data: {
        tripId,
        destination: trip.destination,
        ...analysis,
        recommendations: generateSafetyRecommendations(5 - (analysis.averageRating || 3)),
      },
    });
  } catch (error) {
    console.error('Analyze trip safety error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze trip safety',
      error: error.message,
    });
  }
};

// Get trip safety report
exports.getTripSafetyReport = async (req, res) => {
  try {
    const { tripId } = req.params;

    const Trip = require('../models/Trip');
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Get all alerts for this trip
    const alerts = await SafetyAlert.find({ tripId }).sort({ severity: -1 });

    // Get emergency contacts
    const emergencyContacts = await EmergencyContact.find({ userId: req.userId });

    // Comprehensive analysis
    const analysis = await SafetyAnalysisService.analyzeTripSafety(
      [trip.destination, ...(trip.cities || [])]
    );

    res.json({
      success: true,
      data: {
        tripId,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        safetyAnalysis: analysis,
        activeAlerts: alerts.filter(a => !a.isAcknowledged && a.expiresAt > new Date()),
        allAlerts: alerts,
        emergencyContacts: {
          total: emergencyContacts.length,
          contacts: emergencyContacts,
        },
        recommendations: generateSafetyRecommendations(5 - (analysis.averageRating || 3)),
      },
    });
  } catch (error) {
    console.error('Get trip safety report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate safety report',
      error: error.message,
    });
  }
};

// Get travel safety analysis for trip
exports.getTravelSafetyAnalysis = async (req, res) => {
  try {
    const { tripId } = req.params;

    const Trip = require('../models/Trip');
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const cities = [trip.destination, ...(trip.cities || [])];
    const analysis = await SafetyAnalysisService.analyzeTripSafety(cities);

    if (analysis.success) {
      res.json({
        success: true,
        data: {
          tripId,
          ...analysis.data,
        },
      });
    } else {
      res.status(500).json(analysis);
    }
  } catch (error) {
    console.error('Get trip safety analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trip safety analysis',
      error: error.message,
    });
  }
};

// Helper function to get safety description
function getSafetyDescription(rating) {
  if (rating >= 4.5) return 'Very Safe';
  if (rating >= 3.5) return 'Safe';
  if (rating >= 2.5) return 'Moderate';
  if (rating >= 1.5) return 'Unsafe';
  return 'Very Unsafe';
}

// Helper function to generate safety recommendations
function generateSafetyRecommendations(rating) {
  if (rating >= 4.5) {
    return [
      'This is a very safe destination',
      'Standard travel precautions apply',
      'Enjoy your trip with confidence',
    ];
  } else if (rating >= 3.5) {
    return [
      'This destination is generally safe',
      'Avoid traveling alone at night',
      'Keep valuables secure',
      'Stay in well-lit, populated areas',
    ];
  } else if (rating >= 2.5) {
    return [
      'Exercise increased caution',
      'Avoid certain areas at night',
      'Keep emergency numbers handy',
      'Travel in groups when possible',
      'Register with your embassy',
    ];
  } else {
    return [
      'Exercise extreme caution',
      'Avoid travel if possible',
      'Keep emergency numbers at hand',
      'Stay in contact with others',
      'Consider travel insurance',
      'Register with your embassy',
    ];
  }
}
