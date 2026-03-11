// src/controllers/budgetController.js
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const BudgetService = require('../services/budgetService');

// Estimate budget for a new trip
exports.estimateBudget = async (req, res) => {
  try {
    const { city, duration, numberOfPeople, tripType = 'group' } = req.body;

    if (!city || !duration || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: 'City, duration, and number of people are required',
      });
    }

    const budgetEstimate = await BudgetService.estimateBudget(city, duration, numberOfPeople, tripType);

    res.json({
      success: true,
      message: 'Budget estimated successfully',
      data: budgetEstimate,
    });
  } catch (error) {
    console.error('Budget estimation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate budget',
      error: error.message,
    });
  }
};

// Get category-wise budget breakdown for a trip
exports.getCategoryWiseBudget = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const categoryWiseSpending = await BudgetService.getCategoryWiseSpending(tripId);

    const breakdown = Object.entries(trip.Budget.categories).map(([category, budgetData]) => ({
      category,
      budget: budgetData.budget,
      spent: categoryWiseSpending[category] || 0,
      remaining: budgetData.budget - (categoryWiseSpending[category] || 0),
      percentage: Math.round(((categoryWiseSpending[category] || 0) / budgetData.budget) * 100),
      status:
        (categoryWiseSpending[category] || 0) > budgetData.budget
          ? 'exceeded'
          : (categoryWiseSpending[category] || 0) > budgetData.budget * 0.8
            ? 'warning'
            : 'on-track',
    }));

    res.json({
      success: true,
      data: {
        tripId,
        totalBudget: trip.Budget.totalBudget,
        totalSpent: trip.Budget.spent,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Get category budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category budget',
      error: error.message,
    });
  }
};

// Check if budget is exceeded and get alerts
exports.checkBudgetStatus = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const budgetStatus = await BudgetService.checkBudgetExceeded(tripId);

    // Create notifications if there are high-severity alerts
    const highSeverityAlerts = budgetStatus.alerts.filter((a) => a.severity === 'high');
    if (highSeverityAlerts.length > 0) {
      await BudgetService.createBudgetAlert(tripId, trip.owner, highSeverityAlerts);
    }

    res.json({
      success: true,
      data: budgetStatus,
    });
  } catch (error) {
    console.error('Check budget status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check budget status',
      error: error.message,
    });
  }
};

// Get detailed budget analytics
exports.getBudgetAnalytics = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const analytics = await BudgetService.getBudgetAnalytics(tripId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get budget analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budget analytics',
      error: error.message,
    });
  }
};

// Get budget recommendations
exports.getBudgetRecommendations = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const recommendations = await BudgetService.getBudgetRecommendations(tripId);

    res.json({
      success: true,
      data: {
        tripId,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message,
    });
  }
};

// Generate comprehensive budget report
exports.generateBudgetReport = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const report = await BudgetService.generateBudgetReport(tripId);

    res.json({
      success: true,
      message: 'Budget report generated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

// Calculate expense split (equal split)
exports.calculateEqualSplit = async (req, res) => {
  try {
    const { amount, numberOfPeople } = req.body;

    if (!amount || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: 'Amount and number of people are required',
      });
    }

    if (numberOfPeople < 2) {
      return res.status(400).json({
        success: false,
        message: 'Number of people must be at least 2',
      });
    }

    const split = BudgetService.calculateEqualSplit(amount, numberOfPeople);

    res.json({
      success: true,
      data: split,
    });
  } catch (error) {
    console.error('Calculate split error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate split',
      error: error.message,
    });
  }
};

// Calculate custom expense split
exports.calculateCustomSplit = async (req, res) => {
  try {
    const { amount, splits } = req.body;

    if (!amount || !splits || !Array.isArray(splits)) {
      return res.status(400).json({
        success: false,
        message: 'Amount and splits array are required',
      });
    }

    const result = BudgetService.calculateCustomSplit(amount, splits);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Calculate custom split error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate custom split',
      error: error.message,
    });
  }
};

// Update trip budget based on expenses
exports.updateBudgetFromExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const updatedTrip = await BudgetService.updateTripBudgetSpending(tripId);

    res.json({
      success: true,
      message: 'Budget updated from expenses',
      data: {
        totalBudget: updatedTrip.Budget.totalBudget,
        totalSpent: updatedTrip.Budget.spent,
        remaining: updatedTrip.Budget.remaining,
        categories: updatedTrip.Budget.categories,
      },
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
      error: error.message,
    });
  }
};

// Get expense breakdown by category
exports.getExpenseBreakdown = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const expenses = await Expense.find({
      tripId,
      status: { $ne: 'cancelled' },
    }).populate('paidBy', 'firstName lastName');

    const breakdown = {
      byCategory: {},
      byPerson: {},
      total: 0,
    };

    expenses.forEach((expense) => {
      // By category
      if (!breakdown.byCategory[expense.category]) {
        breakdown.byCategory[expense.category] = {
          count: 0,
          amount: 0,
        };
      }
      breakdown.byCategory[expense.category].count++;
      breakdown.byCategory[expense.category].amount += expense.amount;

      // By person (who paid)
      const payerName = expense.paidBy?.firstName + ' ' + expense.paidBy?.lastName;
      if (!breakdown.byPerson[payerName]) {
        breakdown.byPerson[payerName] = {
          userId: expense.paidBy?._id,
          count: 0,
          amount: 0,
        };
      }
      breakdown.byPerson[payerName].count++;
      breakdown.byPerson[payerName].amount += expense.amount;

      breakdown.total += expense.amount;
    });

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Get expense breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense breakdown',
      error: error.message,
    });
  }
};

// Allocate custom budget for categories
exports.allocateCustomBudget = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { categories } = req.body;

    if (!categories || typeof categories !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Categories object is required',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify total equals trip budget
    const totalAllocated = Object.values(categories).reduce((sum, budget) => sum + budget, 0);
    if (totalAllocated !== trip.Budget.totalBudget) {
      return res.status(400).json({
        success: false,
        message: `Total allocated budget (${totalAllocated}) must equal trip budget (${trip.Budget.totalBudget})`,
      });
    }

    // Update categories
    Object.entries(categories).forEach(([category, budget]) => {
      if (trip.Budget.categories[category]) {
        trip.Budget.categories[category].budget = budget;
      }
    });

    await trip.save();

    res.json({
      success: true,
      message: 'Budget allocation updated successfully',
      data: trip.Budget.categories,
    });
  } catch (error) {
    console.error('Allocate budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate budget',
      error: error.message,
    });
  }
};

// Get projected spending based on current pace
exports.getProjectedSpending = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const analytics = await BudgetService.getBudgetAnalytics(tripId);

    const daysElapsed = analytics.daysElapsed || 1;
    const projectedTotal = Math.round((trip.Budget.spent / daysElapsed) * trip.duration);
    const projectedRemaining = trip.Budget.totalBudget - projectedTotal;
    const projectionAccuracy = (trip.Budget.spent / trip.Budget.totalBudget) * 100;

    res.json({
      success: true,
      data: {
        currentSpent: trip.Budget.spent,
        daysElapsed,
        daysRemaining: trip.duration - daysElapsed,
        dailyAverageSpending: Math.round(trip.Budget.spent / daysElapsed),
        projectedTotal,
        projectedRemaining,
        willExceedBudget: projectedTotal > trip.Budget.totalBudget,
        exceedAmount: Math.max(0, projectedTotal - trip.Budget.totalBudget),
        projectionAccuracy: Math.round(projectionAccuracy),
      },
    });
  } catch (error) {
    console.error('Get projected spending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projected spending',
      error: error.message,
    });
  }
};
