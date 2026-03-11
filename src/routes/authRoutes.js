// src/routes/authRoutes.js

const express = require('express');

const {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyOTP,
  resendOTP
} = require('../controllers/authController');

const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const {
  validateRegister,
  validateLogin,
  validateVerifyOTP
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, validateRegister, register);


/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, login);


/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify registration OTP and activate account
 * @access  Public
 */
router.post('/verify-otp', authLimiter, validateVerifyOTP, verifyOTP);


/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend verification OTP
 * @access  Public
 */
router.post('/resend-otp', authLimiter, resendOTP);


/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);


/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, logout);


/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', authMiddleware, getCurrentUser);


/**
 * @route   POST /api/v1/auth/request-password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post('/request-password-reset', authLimiter, requestPasswordReset);


/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);


/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password for logged in user
 * @access  Private
 */
router.post('/change-password', authMiddleware, changePassword);


module.exports = router;
