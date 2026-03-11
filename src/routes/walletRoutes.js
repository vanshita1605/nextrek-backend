// src/routes/walletRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const walletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// Create wallet
const validateCreateWallet = [
  body('tripId').isString().notEmpty().withMessage('TripId is required'),
  body('users').optional().isArray(),
  body('currency').optional().isString(),
  handleValidationErrors,
];
router.post('/', authMiddleware, ...validateCreateWallet, walletController.createWallet);

// Specific routes (must be before generic /:tripId)
// Get wallet balance
router.get('/:tripId/balance', authMiddleware, walletController.getWalletBalance);

// Get group wallet balances
router.get('/:tripId/group-balances', authMiddleware, walletController.getGroupWalletBalances);

// Get per-user balance
router.get('/:tripId/user-balance', authMiddleware, walletController.getPerUserBalance);

// Get group expense history
router.get('/:tripId/expense-history', authMiddleware, walletController.getGroupExpenseHistory);

// Calculate expense split
const validateCalculateSplit = [
  body('amount').isFloat({ gt: 0 }).withMessage('Invalid amount'),
  body('splitType').isIn(['equal', 'custom', 'itemwise']).withMessage('Invalid split type'),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant required'),
  handleValidationErrors,
];
router.post('/:tripId/calculate-split', authMiddleware, ...validateCalculateSplit, walletController.calculateExpenseSplit);

// Get settlement suggestions
router.get('/:tripId/settle-suggestions', authMiddleware, walletController.getSettlementSuggestions);

// Add money to wallet
const validateAddMoney = [
  body('amount').isFloat({ gt: 0 }).withMessage('Invalid amount'),
  body('paymentMethod').optional().isString(),
  handleValidationErrors,
];
router.post('/:tripId/add-money', authMiddleware, ...validateAddMoney, walletController.addMoneyToWallet);

// Add expense
const validateAddExpense = [
  body('amount').isFloat({ gt: 0 }).withMessage('Invalid amount'),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('description').optional().isString(),
  body('splitType').optional().isIn(['equal', 'custom']).withMessage('Invalid split type'),
  handleValidationErrors,
];
router.post('/:tripId/expenses', authMiddleware, ...validateAddExpense, walletController.addExpense);

// Get user's share in trip
router.get('/:tripId/user-share', authMiddleware, walletController.getUserShare);

// Get settlement details
router.get('/:tripId/settlements', authMiddleware, walletController.getSettlementDetails);

// Settle payment between users
const validateSettlePayment = [
  body('fromUserId').isString().notEmpty().withMessage('FromUserId is required'),
  body('toUserId').isString().notEmpty().withMessage('ToUserId is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Invalid amount'),
  handleValidationErrors,
];
router.post('/:tripId/settle-payment', authMiddleware, ...validateSettlePayment, walletController.settlePayment);

// Get wallet transactions
router.get('/:tripId/transactions', authMiddleware, walletController.getWalletTransactions);

// Close wallet
router.put('/:tripId/close', authMiddleware, walletController.closeWallet);

// Generic routes (at the end)
// Get wallet by trip
router.get('/:tripId', authMiddleware, walletController.getWalletByTrip);

module.exports = router;
