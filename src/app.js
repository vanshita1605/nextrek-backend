// src/app.js
/**
 * Express Application Configuration
 * Centralized Express app setup with middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// ============================================
// MIDDLEWARE IMPORTS
// ============================================

const { errorHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// ============================================
// ROUTES IMPORTS
// ============================================

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cityRoutes = require('./routes/cityRoutes');
const touristPlaceRoutes = require('./routes/touristPlaceRoutes');
const foodSpotRoutes = require('./routes/foodSpotRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const transportRoutes = require('./routes/transportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tripRoutes = require('./routes/tripRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const walletRoutes = require('./routes/walletRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const packingChecklistRoutes = require('./routes/packingChecklistRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const quickCommerceRoutes = require('./routes/quickCommerceRoutes');
const tripMemoryRoutes = require('./routes/tripMemoryRoutes');

// ============================================
// CREATE EXPRESS APP
// ============================================

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

/**
 * Helmet: Secure HTTP headers
 * Sets various HTTP headers to help protect from well-known web vulnerabilities
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// ============================================
// CORS CONFIGURATION
// ============================================

/**
 * CORS: Cross-Origin Resource Sharing
 * Allows requests from specified origins
 */
app.use(cors());

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================

/**
 * Parse incoming request bodies
 * JSON and URL-encoded formats with increased limit for file uploads
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================

/**
 * Log incoming requests (development only)
 * Format: [timestamp] METHOD PATH
 * Note: In production, use Morgan for better performance
 */
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// SYSTEM ENDPOINTS
// ============================================

/**
 * Health Check Endpoint
 * GET /api/health
 * Returns server status and uptime
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Version Endpoint
 * GET /api/version
 * Returns API version information
 */
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    name: 'Smart Travel Planning & Budget Management System',
    description: 'Complete travel planning, budgeting, and collaboration backend',
    apiVersion: 'v1',
  });
});

// ============================================
// API ROUTES
// ============================================

/**
 * Authentication Routes
 * POST /api/v1/auth/register - Register user
 * POST /api/v1/auth/login - Login user
 * POST /api/v1/auth/refresh - Refresh token
 * POST /api/v1/auth/logout - Logout user
 * POST /api/v1/auth/forgot-password - Request password reset
 * POST /api/v1/auth/reset-password - Reset password
 * PUT /api/v1/auth/change-password - Change password
 */
app.use('/api/v1/auth', authRoutes);

/**
 * User Routes
 * GET /api/v1/users/profile - Get user profile
 * PUT /api/v1/users/profile - Update profile
 * PUT /api/v1/users/avatar - Upload avatar
 * DELETE /api/v1/users/account - Delete account
 * GET /api/v1/users/emergency-contacts - Get emergency contacts
 * POST /api/v1/users/emergency-contacts - Add emergency contact
 */
app.use('/api/v1/users', userRoutes);

/**
 * Travel Data Routes - Cities
 * GET /api/v1/cities - List cities
 * GET /api/v1/cities/:id - Get city details
 * GET /api/v1/cities/safe-areas/:cityId - Get safe areas
 */
app.use('/api/v1/cities', cityRoutes);

/**
 * Travel Data Routes - Tourist Places
 * GET /api/v1/tourist-places - List places
 * GET /api/v1/tourist-places/:id - Get place details
 * GET /api/v1/tourist-places/nearby - Get nearby places
 */
app.use('/api/v1/tourist-places', touristPlaceRoutes);

/**
 * Travel Data Routes - Food Spots
 * GET /api/v1/food-spots - List food spots
 * GET /api/v1/food-spots/:id - Get spot details
 * GET /api/v1/food-spots/by-cuisine - Filter by cuisine
 */
app.use('/api/v1/food-spots', foodSpotRoutes);

/**
 * Travel Data Routes - Hotels
 * GET /api/v1/hotels - List hotels
 * GET /api/v1/hotels/:id - Get hotel details
 * GET /api/v1/hotels/availability - Check availability
 */
app.use('/api/v1/hotels', hotelRoutes);

/**
 * Travel Data Routes - Transport
 * GET /api/v1/transport - List transport options
 * GET /api/v1/transport/by-type - Filter by type
 * POST /api/v1/transport/calculate-cost - Calculate transport cost
 */
app.use('/api/v1/transport', transportRoutes);

/**
 * Trip Management Routes
 * GET /api/v1/trips - Get user's trips
 * POST /api/v1/trips - Create trip
 * GET /api/v1/trips/:id - Get trip details
 * PUT /api/v1/trips/:id - Update trip
 * DELETE /api/v1/trips/:id - Delete trip
 * POST /api/v1/trips/:id/invite - Invite participant
 * POST /api/v1/trips/:id/accept-invite - Accept invitation
 * GET /api/v1/trips/:id/participants - Get participants
 * POST /api/v1/trips/:id/itinerary - Add itinerary
 */
app.use('/api/v1/trips', tripRoutes);

/**
 * Budget Management Routes
 * GET /api/v1/budget/:tripId - Get trip budget
 * POST /api/v1/budget/:tripId - Create budget
 * PUT /api/v1/budget/:tripId - Update budget
 * GET /api/v1/budget/:tripId/analytics - Get budget analytics
 * POST /api/v1/budget/:tripId/alert - Set budget alert
 */
app.use('/api/v1/budget', budgetRoutes);

/**
 * Wallet Management Routes
 * GET /api/v1/trips/:tripId/wallet - Get wallet
 * POST /api/v1/trips/:tripId/wallet/add-funds - Add funds
 * POST /api/v1/trips/:tripId/wallet/expense - Add expense
 * POST /api/v1/trips/:tripId/wallet/split - Split expense
 * POST /api/v1/trips/:tripId/wallet/settle - Settle debts
 */
app.use('/api/v1/trips/:tripId/wallet', walletRoutes);

/**
 * Reviews & Ratings Routes
 * GET /api/v1/reviews - Get reviews
 * POST /api/v1/reviews - Create review
 * PUT /api/v1/reviews/:id - Update review
 * DELETE /api/v1/reviews/:id - Delete review
 */
app.use('/api/v1/reviews', reviewRoutes);

/**
 * Packing Checklist Routes
 * GET /api/v1/packing/:tripId - Get checklist
 * POST /api/v1/packing/:tripId/generate - Generate checklist
 * PUT /api/v1/packing/:tripId - Update checklist
 */
app.use('/api/v1/packing', packingChecklistRoutes);

/**
 * Safety Routes
 * GET /api/v1/safety/areas - Get safe/unsafe areas
 * GET /api/v1/safety/tips/:destination - Get safety tips
 * GET /api/v1/safety/emergency-services/:cityId - Get emergency services
 */
app.use('/api/v1/safety', safetyRoutes);

/**
 * Notifications & Alerts Routes (22 endpoints)
 * Device management, notifications CRUD, preferences, alerts
 * See NOTIFICATIONS_API_GUIDE.md for complete documentation
 */
app.use('/api/v1/notifications', notificationRoutes);

/**
 * AI Assistant Routes
 * POST /api/v1/ai/recommendations - Get recommendations
 * POST /api/v1/ai/budget-advice - Get budget advice
 * POST /api/v1/ai/packing-suggestions - Get packing suggestions
 * POST /api/v1/ai/itinerary-suggestions - Get itinerary suggestions
 */
app.use('/api/v1/ai', aiRoutes);

/**
 * Quick Commerce Routes (21 endpoints)
 * Product listing, order creation, tracking, partner integration
 * See quickCommerceRoutes.js for complete documentation
 */
app.use('/api/v1/quick-commerce', quickCommerceRoutes);

/**
 * Trip Memory & Journal Routes (14 endpoints)
 * Photo uploads, timeline generation, auto-summaries
 * See tripMemoryRoutes.js for complete documentation
 */
app.use('/api/v1/trip-memory', tripMemoryRoutes);

/**
 * Admin Routes
 * GET /api/v1/admin/users - List users
 * GET /api/v1/admin/stats - Get platform statistics
 * POST /api/v1/admin/content - Manage content
 */
app.use('/api/v1/admin', adminRoutes);

// ============================================
// 404 ERROR HANDLER
// ============================================

/**
 * Handle undefined routes
 * Returns 404 error with requested path
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

/**
 * Centralized Error Handling Middleware
 * Must be last middleware in the chain
 * Handles all errors thrown by route handlers and middleware
 */
app.use(errorHandler);

// ============================================
// EXPORTS
// ============================================

module.exports = app;
