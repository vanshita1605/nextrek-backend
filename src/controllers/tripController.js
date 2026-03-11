// src/controllers/tripController.js
const Trip = require('../models/Trip');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const PackingChecklist = require('../models/PackingChecklist');
const { sendTripInvitationEmail } = require('../utils/email');

// Create a new trip
exports.createTrip = async (req, res) => {
  try {
    const { tripName, description, city, startDate, endDate, numberOfPeople, tripType, totalBudget, budgetCategories } = req.body;

    // Validate required fields
    if (!tripName || !city || !startDate || !endDate || !numberOfPeople || !totalBudget) {
      return res.status(400).json({
        success: false,
        message: 'tripName, city, startDate, endDate, numberOfPeople, and totalBudget are required',
      });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Validate numberOfPeople
    if (numberOfPeople < 1) {
      return res.status(400).json({
        success: false,
        message: 'numberOfPeople must be at least 1',
      });
    }

    // Handle city - can be city ID or city name
    let cityId = city;
    const City = require('../models/City');
    
    if (!city.match(/^[0-9a-fA-F]{24}$/)) {
      // city is not a valid MongoDB ID, try to find by name
      const cityDoc = await City.findOne({ name: new RegExp(`^${city}$`, 'i') });
      if (!cityDoc) {
        return res.status(404).json({
          success: false,
          message: `City "${city}" not found`,
        });
      }
      cityId = cityDoc._id;
    }

    // Create trip
    const trip = new Trip({
      tripName,
      description,
      owner: req.userId,
      city: cityId,
      startDate,
      endDate,
      numberOfPeople,
      tripType: tripType || 'group',
      Budget: {
        totalBudget,
        categories: budgetCategories || {
          accommodation: { budget: totalBudget * 0.3, spent: 0 },
          food: { budget: totalBudget * 0.2, spent: 0 },
          transport: { budget: totalBudget * 0.2, spent: 0 },
          activities: { budget: totalBudget * 0.2, spent: 0 },
          shopping: { budget: totalBudget * 0.07, spent: 0 },
          emergency: { budget: totalBudget * 0.03, spent: 0 },
        },
      },
      participants: [
        {
          userId: req.userId,
          name: req.user?.firstName + ' ' + req.user?.lastName,
          email: req.user?.email,
          status: 'joined',
          joinedAt: new Date(),
        },
      ],
    });

    await trip.save();

    // Create wallet for the trip
    const wallet = new Wallet({
      tripId: trip._id,
      users: [
        {
          userId: req.userId,
          email: req.user?.email,
          name: req.user?.firstName + ' ' + req.user?.lastName,
          balance: 0,
        },
      ],
      currency: req.user?.preferences?.currency || 'INR',
    });

    await wallet.save();

    // Update trip with wallet reference
    trip.wallet = wallet._id;
    await trip.save();

    // Add trip to user's trips array
    const user = await User.findById(req.userId);
    user.trips.push(trip._id);
    await user.save();

    await trip.populate('city', 'name country');
    await trip.populate('wallet');

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message,
    });
  }
};

// Get trip by ID
exports.getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('owner', 'firstName lastName email avatar')
      .populate('city', 'name country description')
      .populate('accommodation')
      .populate('activities')
      .populate('restaurants')
      .populate('transport')
      .populate('wallet')
      .populate('expenses')
      .populate('memories')
      .populate('packing')
      .populate('participants.userId', 'firstName lastName email avatar');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user has access to this trip
    const hasAccess =
      trip.owner._id.toString() === req.userId ||
      trip.participants.some((p) => p.userId?._id.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this trip',
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trip',
      error: error.message,
    });
  }
};

// Get all trips for logged-in user
exports.getUserTrips = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt' } = req.query;

    let query = {
      $or: [
        { owner: req.userId },
        { 'participants.userId': req.userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    if (sortBy === 'upcoming') {
      sortOptions.startDate = 1;
    } else if (sortBy === 'recent') {
      sortOptions.createdAt = -1;
    }

    const trips = await Trip.find(query)
      .populate('city', 'name country')
      .populate('owner', 'firstName lastName')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get user trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trips',
      error: error.message,
    });
  }
};

// Update trip
exports.updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const updates = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user is trip owner
    if (trip.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only trip owner can update trip',
      });
    }

    // Update allowed fields
    const allowedUpdates = ['tripName', 'description', 'startDate', 'endDate', 'numberOfPeople', 'tripType', 'status', 'tags', 'isPublic', 'Budget', 'emergencyContacts', 'safetyTips'];
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        trip[key] = updates[key];
      }
    });

    await trip.save();
    await trip.populate('city', 'name country');
    await trip.populate('wallet');

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: trip,
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message,
    });
  }
};

// Delete trip
exports.deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user is trip owner
    if (trip.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only trip owner can delete trip',
      });
    }

    // Delete associated wallet
    if (trip.wallet) {
      await Wallet.findByIdAndDelete(trip.wallet);
    }

    // Remove trip from all participants' trip lists
    await User.updateMany(
      { _id: { $in: trip.participants.map((p) => p.userId) } },
      { $pull: { trips: tripId } }
    );

    await Trip.findByIdAndDelete(tripId);

    res.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip',
      error: error.message,
    });
  }
};

// Invite users to trip
exports.inviteUsersToTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid email array is required',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (trip.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only trip owner can invite users',
      });
    }

    const newParticipants = [];

    for (const email of emails) {
      const excludedUser = await User.findOne({ email });

      // Check if already invited
      const alreadyInvited = trip.participants.some((p) => p.email === email);
      if (alreadyInvited) {
        continue;
      }

      newParticipants.push({
        email,
        userId: excludedUser?._id || null,
        name: excludedUser ? excludedUser.firstName + ' ' + excludedUser.lastName : email,
        status: 'invited',
      });

      // Send invitation email
      await sendTripInvitationEmail(
        email,
        trip.tripName,
        `${process.env.APP_URL}/trips/${tripId}/join`
      );
    }

    trip.participants.push(...newParticipants);
    await trip.save();

    res.json({
      success: true,
      message: 'Invitations sent successfully',
      data: trip.participants,
    });
  } catch (error) {
    console.error('Invite users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitations',
      error: error.message,
    });
  }
};

// Accept/Decline trip invitation
exports.respondToInvitation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "accept" or "decline"',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const participant = trip.participants.find(
      (p) => p.email === req.user.email && p.status === 'invited'
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (action === 'accept') {
      participant.status = 'joined';
      participant.userId = req.userId;
      participant.joinedAt = new Date();

      // Add trip to user's trips
      const user = await User.findById(req.userId);
      if (!user.trips.includes(tripId)) {
        user.trips.push(tripId);
        await user.save();
      }

      // Add user to wallet
      const wallet = await Wallet.findById(trip.wallet);
      const userInWallet = wallet.users.find((u) => u.userId.toString() === req.userId);
      if (!userInWallet) {
        wallet.users.push({
          userId: req.userId,
          email: req.user.email,
          name: req.user.firstName + ' ' + req.user.lastName,
          balance: 0,
        });
        await wallet.save();
      }
    } else {
      trip.participants = trip.participants.filter((p) => p.email !== req.user.email);
    }

    await trip.save();

    res.json({
      success: true,
      message: `Trip ${action}ed successfully`,
      data: trip,
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to invitation',
      error: error.message,
    });
  }
};

// Remove participant from trip
exports.removeParticipant = async (req, res) => {
  try {
    const { tripId, participantId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (trip.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only trip owner can remove participants',
      });
    }

    trip.participants = trip.participants.filter(
      (p) => p.userId?.toString() !== participantId && p._id.toString() !== participantId
    );

    await trip.save();

    res.json({
      success: true,
      message: 'Participant removed from trip',
      data: trip.participants,
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant',
      error: error.message,
    });
  }
};

// Add activity to itinerary
exports.addActivityToItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { day, date, name, time, location, placeId, cost, notes } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check access
    const hasAccess =
      trip.owner.toString() === req.userId ||
      trip.participants.some((p) => p.userId?.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trip',
      });
    }

    let dayItinerary = trip.itinerary.find((item) => item.day === day);

    if (!dayItinerary) {
      dayItinerary = {
        day,
        date: date || new Date(),
        activities: [],
      };
      trip.itinerary.push(dayItinerary);
    }

    dayItinerary.activities.push({
      name,
      time,
      location,
      placeId,
      cost: cost || 0,
      notes,
    });

    await trip.save();

    res.json({
      success: true,
      message: 'Activity added to itinerary',
      data: dayItinerary,
    });
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add activity',
      error: error.message,
    });
  }
};

// Update activity in itinerary
exports.updateActivityInItinerary = async (req, res) => {
  try {
    const { tripId, day, activityId } = req.params;
    const updates = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const dayItinerary = trip.itinerary.find((item) => item.day === parseInt(day));
    if (!dayItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Day not found in itinerary',
      });
    }

    const activity = dayItinerary.activities.find((a) => a._id.toString() === activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    Object.assign(activity, updates);
    await trip.save();

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: dayItinerary,
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message,
    });
  }
};

// Delete activity from itinerary
exports.deleteActivityFromItinerary = async (req, res) => {
  try {
    const { tripId, day, activityId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const dayItinerary = trip.itinerary.find((item) => item.day === parseInt(day));
    if (!dayItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Day not found in itinerary',
      });
    }

    dayItinerary.activities = dayItinerary.activities.filter((a) => a._id.toString() !== activityId);
    await trip.save();

    res.json({
      success: true,
      message: 'Activity deleted from itinerary',
      data: dayItinerary,
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message,
    });
  }
};

// Get trip expenses
exports.getTripExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 10, category } = req.query;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    let query = { tripId };
    if (category) {
      query.category = category;
    }

    const Expense = require('../models/Expense');
    const expenses = await Expense.find(query)
      .populate('paidBy', 'firstName lastName email')
      .populate('splitBetween.userId', 'firstName lastName email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    const categoryWiseTotal = {};
    for (const expense of expenses) {
      if (!categoryWiseTotal[expense.category]) {
        categoryWiseTotal[expense.category] = 0;
      }
      categoryWiseTotal[expense.category] += expense.amount;
    }

    res.json({
      success: true,
      data: {
        expenses,
        categoryWiseTotal,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get trip expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses',
      error: error.message,
    });
  }
};

// Get trip summary
exports.getTripSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('city', 'name')
      .populate('participants.userId', 'firstName lastName');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Calculate statistics
    const Expense = require('../models/Expense');
    const expenses = await Expense.find({ tripId });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const averageExpensePerPerson = totalExpenses / trip.participants.length;

    const budget = trip.Budget;
    const budgetUtilization = {
      accommodation: budget.categories.accommodation.spent / budget.categories.accommodation.budget,
      food: budget.categories.food.spent / budget.categories.food.budget,
      transport: budget.categories.transport.spent / budget.categories.transport.budget,
      activities: budget.categories.activities.spent / budget.categories.activities.budget,
      shopping: budget.categories.shopping.spent / budget.categories.shopping.budget,
      emergency: budget.categories.emergency.spent / budget.categories.emergency.budget,
    };

    res.json({
      success: true,
      data: {
        tripName: trip.tripName,
        city: trip.city?.name,
        duration: trip.duration,
        startDate: trip.startDate,
        endDate: trip.endDate,
        participants: trip.participants.length,
        totalBudget: budget.totalBudget,
        totalSpent: budget.spent,
        remaining: budget.remaining,
        totalExpenses,
        averageExpensePerPerson,
        budgetUtilization,
        status: trip.status,
      },
    });
  } catch (error) {
    console.error('Get trip summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trip summary',
      error: error.message,
    });
  }
};
