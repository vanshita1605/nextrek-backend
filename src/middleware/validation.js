// src/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
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

const validateRegister = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest,
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

const validateVerifyOTP = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  validateRequest,
];

const validateTrip = [
  body('tripName').notEmpty().withMessage('Trip name is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('totalBudget').isFloat({ min: 0 }).withMessage('Valid budget is required'),
  validateRequest,
];

const validateExpense = [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('category').isIn(['accommodation', 'food', 'transport', 'activities', 'shopping', 'emergency', 'other']).withMessage('Valid category is required'),
  validateRequest,
];

module.exports = {
  validateRequest,
  validateRegister,
  validateLogin,
  validateVerifyOTP,
  validateTrip,
  validateExpense,
};
