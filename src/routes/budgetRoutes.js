// src/routes/budgetRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  estimateBudget,
  getCategoryWiseBudget,
  checkBudgetStatus,
  getBudgetAnalytics,
  getBudgetRecommendations,
  generateBudgetReport,
  calculateEqualSplit,
  calculateCustomSplit,
  updateBudgetFromExpenses,
  getExpenseBreakdown,
  allocateCustomBudget,
  getProjectedSpending,
} = require('../controllers/budgetController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/budget/estimate
 * @desc    Estimate budget for a new trip
 * @access  Private
 */
router.post('/estimate', estimateBudget);

/**
 * @route   GET /api/v1/budget/:tripId/category-wise
 * @desc    Get category-wise budget breakdown
 * @access  Private
 */
router.get('/:tripId/category-wise', getCategoryWiseBudget);

/**
 * @route   GET /api/v1/budget/:tripId/status
 * @desc    Check budget status and get alerts
 * @access  Private
 */
router.get('/:tripId/status', checkBudgetStatus);

/**
 * @route   GET /api/v1/budget/:tripId/analytics
 * @desc    Get detailed budget analytics
 * @access  Private
 */
router.get('/:tripId/analytics', getBudgetAnalytics);

/**
 * @route   GET /api/v1/budget/:tripId/recommendations
 * @desc    Get budget recommendations
 * @access  Private
 */
router.get('/:tripId/recommendations', getBudgetRecommendations);

/**
 * @route   GET /api/v1/budget/:tripId/report
 * @desc    Generate comprehensive budget report
 * @access  Private
 */
router.get('/:tripId/report', generateBudgetReport);

/**
 * @route   GET /api/v1/budget/:tripId/expense-breakdown
 * @desc    Get expense breakdown by category and person
 * @access  Private
 */
router.get('/:tripId/expense-breakdown', getExpenseBreakdown);

/**
 * @route   GET /api/v1/budget/:tripId/projected-spending
 * @desc    Get projected spending based on current pace
 * @access  Private
 */
router.get('/:tripId/projected-spending', getProjectedSpending);

/**
 * @route   PUT /api/v1/budget/:tripId/update
 * @desc    Update trip budget from expenses
 * @access  Private
 */
router.put('/:tripId/update', updateBudgetFromExpenses);

/**
 * @route   PUT /api/v1/budget/:tripId/allocate
 * @desc    Allocate custom budget for categories
 * @access  Private
 */
router.put('/:tripId/allocate', allocateCustomBudget);

/**
 * @route   POST /api/v1/budget/split/equal
 * @desc    Calculate equal expense split
 * @access  Private
 */
router.post('/split/equal', calculateEqualSplit);

/**
 * @route   POST /api/v1/budget/split/custom
 * @desc    Calculate custom expense split
 * @access  Private
 */
router.post('/split/custom', calculateCustomSplit);

module.exports = router;
