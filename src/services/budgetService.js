// src/services/budgetService.js
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

/**
 * Budget Service - Handles all budget-related calculations and logic
 */

class BudgetService {
  /**
   * Calculate category-wise budget breakdown based on total budget and trip type
   */
  static calculateCategoryBudget(totalBudget, tripType = 'group') {
    const allocations = {
      solo: {
        accommodation: 0.35,
        food: 0.25,
        transport: 0.15,
        activities: 0.15,
        shopping: 0.07,
        emergency: 0.03,
      },
      couple: {
        accommodation: 0.30,
        food: 0.25,
        transport: 0.20,
        activities: 0.15,
        shopping: 0.07,
        emergency: 0.03,
      },
      family: {
        accommodation: 0.25,
        food: 0.30,
        transport: 0.20,
        activities: 0.15,
        shopping: 0.07,
        emergency: 0.03,
      },
      group: {
        accommodation: 0.30,
        food: 0.20,
        transport: 0.20,
        activities: 0.20,
        shopping: 0.07,
        emergency: 0.03,
      },
      corporate: {
        accommodation: 0.30,
        food: 0.20,
        transport: 0.25,
        activities: 0.15,
        shopping: 0.05,
        emergency: 0.05,
      },
    };

    const allocation = allocations[tripType] || allocations.group;

    return {
      accommodation: {
        budget: Math.round(totalBudget * allocation.accommodation),
        spent: 0,
      },
      food: {
        budget: Math.round(totalBudget * allocation.food),
        spent: 0,
      },
      transport: {
        budget: Math.round(totalBudget * allocation.transport),
        spent: 0,
      },
      activities: {
        budget: Math.round(totalBudget * allocation.activities),
        spent: 0,
      },
      shopping: {
        budget: Math.round(totalBudget * allocation.shopping),
        spent: 0,
      },
      emergency: {
        budget: Math.round(totalBudget * allocation.emergency),
        spent: 0,
      },
    };
  }

  /**
   * Estimate budget based on various factors
   */
  static async estimateBudget(city, duration, numberOfPeople, tripType = 'group') {
    try {
      const City = require('../models/City');
      
      let foundCity = null;
      let dailyBudgetPerPerson = 2000; // Default budget per person per day (INR)
      let currency = 'INR';
      
      // Try to find city in database
      if (city) {
        // Check if city is a valid MongoDB ID
        if (String(city).match(/^[0-9a-fA-F]{24}$/)) {
          foundCity = await City.findById(city);
        } else if (typeof city === 'string') {
          // Try to find by city name (case-insensitive)
          foundCity = await City.findOne({ name: { $regex: city, $options: 'i' } });
        }
      }

      // Use found city data or defaults
      if (foundCity) {
        dailyBudgetPerPerson = foundCity.averageBudgetPerDay?.budget || 2000;
        currency = foundCity.currency || 'INR';
      } else {
        // Provide default estimates for major Indian cities
        const defaultCityBudgets = {
          'jaipur': 1800,
          'delhi': 2500,
          'mumbai': 3000,
          'bangalore': 2800,
          'hyderabad': 2000,
          'kolkata': 1500,
          'chennai': 1800,
          'pune': 2200,
          'goa': 2000,
          'agra': 1600,
          'varanasi': 1400,
          'paris': 4000,
          'london': 4500,
          'dubai': 3500,
          'bangkok': 1500,
          'singapore': 3200,
          'tokyo': 4000,
          'new york': 5000,
          'los angeles': 4000,
          'sydney': 3500,
        };

        const cityNameLower = city?.toLowerCase?.() || '';
        dailyBudgetPerPerson = defaultCityBudgets[cityNameLower] || 2000;
      }

      const totalBudget = Math.round(dailyBudgetPerPerson * duration * numberOfPeople);

      // Add contingency (10%)
      const contingencyBuffer = Math.round(totalBudget * 0.10);

      const response = {
        baseBudget: totalBudget,
        contingencyBuffer,
        recommendedBudget: totalBudget + contingencyBuffer,
        dailyBudgetPerPerson,
        daysOfTravel: duration,
        numberOfPeople,
        totalTravelers: duration * numberOfPeople,
        currency: currency,
        breakdown: this.calculateCategoryBudget(totalBudget + contingencyBuffer, tripType),
      };

      // Add note only if using default estimate
      if (!foundCity) {
        response.note = `Using default estimate for ${city}. Update city details in database for custom estimates.`;
      }

      return response;
    } catch (error) {
      throw new Error(`Budget estimation failed: ${error.message}`);
    }
  }

  /**
   * Get current spending in each category for a trip
   */
  static async getCategoryWiseSpending(tripId) {
    try {
      const expenses = await Expense.find({
        tripId,
        status: { $ne: 'cancelled' },
      });

      const spending = {
        accommodation: 0,
        food: 0,
        transport: 0,
        activities: 0,
        shopping: 0,
        emergency: 0,
        other: 0,
      };

      expenses.forEach((expense) => {
        spending[expense.category] = (spending[expense.category] || 0) + expense.amount;
      });

      return spending;
    } catch (error) {
      throw new Error(`Failed to get category-wise spending: ${error.message}`);
    }
  }

  /**
   * Update trip budget with current spending
   */
  static async updateTripBudgetSpending(tripId) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const expenses = await Expense.find({
        tripId,
        status: { $ne: 'cancelled' },
      });

      // Calculate total spent
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Update category-wise spending
      const categories = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'emergency'];
      categories.forEach((category) => {
        const categoryExpenses = expenses.filter((e) => e.category === category);
        const categorySpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        trip.Budget.categories[category].spent = categorySpent;
      });

      trip.Budget.spent = totalSpent;
      trip.Budget.remaining = trip.Budget.totalBudget - totalSpent;

      await trip.save();
      return trip;
    } catch (error) {
      throw new Error(`Failed to update budget spending: ${error.message}`);
    }
  }

  /**
   * Check if spending exceeds budget for a category or total
   */
  static async checkBudgetExceeded(tripId) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Update budget first
      await this.updateTripBudgetSpending(tripId);

      const alerts = [];

      // Check category-wise budget
      const categories = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'emergency'];
      categories.forEach((category) => {
        const budget = trip.Budget.categories[category].budget;
        const spent = trip.Budget.categories[category].spent;
        const percentage = (spent / budget) * 100;

        if (percentage > 100) {
          alerts.push({
            type: 'category_exceeded',
            category,
            spent,
            budget,
            percentage: Math.round(percentage),
            severity: 'high',
          });
        } else if (percentage > 80) {
          alerts.push({
            type: 'category_warning',
            category,
            spent,
            budget,
            percentage: Math.round(percentage),
            severity: 'medium',
          });
        }
      });

      // Check total budget
      const totalPercentage = (trip.Budget.spent / trip.Budget.totalBudget) * 100;
      if (totalPercentage > 100) {
        alerts.push({
          type: 'total_exceeded',
          spent: trip.Budget.spent,
          budget: trip.Budget.totalBudget,
          percentage: Math.round(totalPercentage),
          severity: 'high',
        });
      } else if (totalPercentage > 80) {
        alerts.push({
          type: 'total_warning',
          spent: trip.Budget.spent,
          budget: trip.Budget.totalBudget,
          percentage: Math.round(totalPercentage),
          severity: 'medium',
        });
      }

      return {
        hasAlerts: alerts.length > 0,
        alerts,
        budgetStatus: {
          spent: trip.Budget.spent,
          total: trip.Budget.totalBudget,
          remaining: trip.Budget.remaining,
          percentage: Math.round(totalPercentage),
        },
      };
    } catch (error) {
      throw new Error(`Failed to check budget: ${error.message}`);
    }
  }

  /**
   * Create notification for budget alerts
   */
  static async createBudgetAlert(tripId, userId, alerts) {
    try {
      for (const alert of alerts) {
        let message = '';
        let title = '';

        if (alert.type === 'category_exceeded') {
          title = `Budget Exceeded: ${alert.category}`;
          message = `${alert.category} spending (${alert.percentage}%) has exceeded the allocated budget. Spent: Rs.${alert.spent} / Budget: Rs.${alert.budget}`;
        } else if (alert.type === 'category_warning') {
          title = `Budget Warning: ${alert.category}`;
          message = `${alert.category} spending is at ${alert.percentage}% of the allocated budget. Spent: Rs.${alert.spent} / Budget: Rs.${alert.budget}`;
        } else if (alert.type === 'total_exceeded') {
          title = 'Total Budget Exceeded';
          message = `Trip total spending (${alert.percentage}%) has exceeded the total allocated budget. Spent: Rs.${alert.spent} / Budget: Rs.${alert.budget}`;
        } else if (alert.type === 'total_warning') {
          title = 'Total Budget Warning';
          message = `Trip spending is at ${alert.percentage}% of the total allocated budget. Spent: Rs.${alert.spent} / Budget: Rs.${alert.budget}`;
        }

        const notification = new Notification({
          recipientId: userId,
          type: 'budget_alert',
          title,
          message,
          relatedEntity: {
            entityType: 'Trip',
            entityId: tripId,
          },
          priority: alert.severity === 'high' ? 'high' : 'medium',
          channel: 'in-app',
        });

        await notification.save();
      }
    } catch (error) {
      console.error('Failed to create budget alert:', error);
    }
  }

  /**
   * Get budget analytics for a trip
   */
  static async getBudgetAnalytics(tripId) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      await this.updateTripBudgetSpending(tripId);

      const categoryAnalytics = {};
      const categories = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'emergency'];

      categories.forEach((category) => {
        const budget = trip.Budget.categories[category].budget;
        const spent = trip.Budget.categories[category].spent;
        const percentage = (spent / budget) * 100;

        categoryAnalytics[category] = {
          budget,
          spent,
          remaining: budget - spent,
          percentage: Math.round(percentage),
          status: percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'on-track',
        };
      });

      const dailySpendingRate = trip.Budget.spent / trip.duration;
      const projectedSpending = dailySpendingRate * trip.duration;
      const projectedRemaining = trip.Budget.totalBudget - projectedSpending;

      return {
        summary: {
          totalBudget: trip.Budget.totalBudget,
          totalSpent: trip.Budget.spent,
          totalRemaining: trip.Budget.remaining,
          percentage: Math.round((trip.Budget.spent / trip.Budget.totalBudget) * 100),
          status: trip.Budget.spent > trip.Budget.totalBudget ? 'exceeded' : 'on-track',
        },
        categories: categoryAnalytics,
        dailyMetrics: {
          dailySpendingRate: Math.round(dailySpendingRate),
          projectedSpending: Math.round(projectedSpending),
          projectedRemaining: Math.round(projectedRemaining),
          dailyBudgetLimit: Math.round(trip.Budget.totalBudget / trip.duration),
        },
        daysElapsed: Math.ceil((new Date() - trip.startDate) / (1000 * 60 * 60 * 24)),
        daysRemaining: trip.duration - Math.ceil((new Date() - trip.startDate) / (1000 * 60 * 60 * 24)),
      };
    } catch (error) {
      throw new Error(`Failed to get budget analytics: ${error.message}`);
    }
  }

  /**
   * Get budget recommendations based on spending patterns
   */
  static async getBudgetRecommendations(tripId) {
    try {
      const analytics = await this.getBudgetAnalytics(tripId);
      const recommendations = [];

      // Check category-wise recommendations
      Object.entries(analytics.categories).forEach(([category, data]) => {
        if (data.status === 'exceeded') {
          recommendations.push({
            category,
            type: 'reduce_spending',
            message: `${category} is over budget by Rs.${Math.abs(data.remaining)}. Try to reduce spending in this category.`,
            priority: 'high',
          });
        } else if (data.status === 'warning') {
          recommendations.push({
            category,
            type: 'monitor_spending',
            message: `${category} is at ${data.percentage}% of budget. Be cautious with further spending.`,
            priority: 'medium',
          });
        } else if (data.remaining > data.budget * 0.3) {
          recommendations.push({
            category,
            type: 'has_headroom',
            message: `${category} has good headroom with Rs.${data.remaining} remaining.`,
            priority: 'low',
          });
        }
      });

      // Overall recommendation
      if (analytics.summary.status === 'exceeded') {
        recommendations.unshift({
          category: 'overall',
          type: 'total_exceeded',
          message: `Total trip budget has been exceeded by Rs.${Math.abs(analytics.summary.totalRemaining)}. Avoid non-essential spending.`,
          priority: 'high',
        });
      } else if (analytics.dailyMetrics.dailySpendingRate > analytics.dailyMetrics.dailyBudgetLimit) {
        recommendations.unshift({
          category: 'overall',
          type: 'overspending_pace',
          message: `Current spending pace (Rs.${analytics.dailyMetrics.dailySpendingRate}/day) exceeds daily limit. Adjust spending pattern.`,
          priority: 'high',
        });
      }

      return recommendations;
    } catch (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  /**
   * Split expenses equally among participants
   */
  static calculateEqualSplit(amount, numberOfPeople) {
    const perPerson = Math.round((amount / numberOfPeople) * 100) / 100;
    const remainder = Math.round((amount - perPerson * numberOfPeople) * 100) / 100;

    return {
      perPerson,
      remainder,
      split: Array(numberOfPeople).fill(perPerson),
    };
  }

  /**
   * Calculate custom split for expenses
   */
  static calculateCustomSplit(amount, splits) {
    const totalShares = splits.reduce((sum, split) => sum + split.share, 0);
    const result = splits.map((split) => ({
      userId: split.userId,
      amount: Math.round((split.share / totalShares) * amount * 100) / 100,
    }));

    return result;
  }

  /**
   * Generate budget report
   */
  static async generateBudgetReport(tripId) {
    try {
      const trip = await Trip.findById(tripId).populate('participants.userId', 'firstName lastName email');
      if (!trip) {
        throw new Error('Trip not found');
      }

      const analytics = await this.getBudgetAnalytics(tripId);
      const recommendations = await this.getBudgetRecommendations(tripId);

      return {
        trip: {
          id: trip._id,
          name: trip.tripName,
          duration: trip.duration,
          startDate: trip.startDate,
          endDate: trip.endDate,
          participants: trip.participants.length,
        },
        analytics,
        recommendations,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate budget report: ${error.message}`);
    }
  }
}

module.exports = BudgetService;
