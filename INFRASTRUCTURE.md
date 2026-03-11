# Backend Infrastructure Documentation

## Core Backend Infrastructure Overview

This document outlines the complete backend infrastructure for the Smart Travel Planning & Budget Management System.

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── app.js                          # Express app configuration (ENTRY POINT FOR APP SETUP)
│   ├── server.js                       # Server entry point (PROCESS ENTRY POINT)
│   ├── config/                         # Configuration files
│   │   ├── database.js                # MongoDB connection configuration
│   │   └── redis.js                   # Redis cache configuration
│   ├── middleware/                     # Middleware functions
│   │   ├── auth.js                    # JWT authentication & role-based access
│   │   ├── errorHandler.js            # Centralized error handling
│   │   ├── rateLimiter.js             # Rate limiting configuration
│   │   └── validation.js              # Input validation schemas
│   ├── controllers/                    # Request handlers (18 files)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── tripController.js
│   │   ├── budgetController.js
│   │   ├── walletController.js
│   │   ├── cityController.js
│   │   ├── touristPlaceController.js
│   │   ├── foodSpotController.js
│   │   ├── hotelController.js
│   │   ├── transportController.js
│   │   ├── reviewController.js
│   │   ├── packingChecklistController.js
│   │   ├── safetyController.js
│   │   ├── notificationController.js
│   │   ├── aiController.js
│   │   ├── adminController.js
│   │   ├── quickCommerceController.js
│   │   └── tripMemoryController.js
│   ├── routes/                         # API route definitions (18 files)
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── tripRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── walletRoutes.js
│   │   ├── cityRoutes.js
│   │   ├── touristPlaceRoutes.js
│   │   ├── foodSpotRoutes.js
│   │   ├── hotelRoutes.js
│   │   ├── transportRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── packingChecklistRoutes.js
│   │   ├── safetyRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── quickCommerceRoutes.js
│   │   └── tripMemoryRoutes.js
│   ├── models/                         # Database models (Mongoose schemas - 18 files)
│   │   ├── User.js
│   │   ├── Trip.js
│   │   ├── Expense.js
│   │   ├── Wallet.js
│   │   ├── Transaction.js
│   │   ├── City.js
│   │   ├── TouristPlace.js
│   │   ├── FoodSpot.js
│   │   ├── Hotel.js
│   │   ├── Transport.js
│   │   ├── Review.js
│   │   ├── PackingChecklist.js
│   │   ├── Notification.js
│   │   ├── UserDevice.js
│   │   ├── NotificationPreference.js
│   │   ├── NotificationAlert.js
│   │   ├── QuickCommerceProduct.js
│   │   ├── QuickCommerceOrder.js
│   │   ├── TripMemory.js
│   │   ├── TripTimeline.js
│   │   ├── TripJournal.js
│   │   └── TripSummary.js
│   ├── services/                       # Business logic layer (9 files)
│   │   ├── notificationService.js     # Multi-channel notifications with FCM
│   │   ├── quickCommerceService.js    # Commerce platform logic
│   │   ├── tripMemoryService.js       # Photo & timeline management
│   │   ├── budgetService.js           # Budget calculations
│   │   ├── splitService.js            # Expense splitting
│   │   ├── aiService.js               # AI recommendations & analysis
│   │   ├── safetyAnalysisService.js   # Safety area analysis
│   │   ├── weatherService.js          # Weather data integration
│   │   └── packingRulesEngine.js      # Packing checklist generation
│   └── utils/                          # Utility functions & tools
│       ├── jwt.js                     # JWT token utilities
│       ├── email.js                   # Email sending utilities
│       └── [other utilities]
├── package.json                        # Node dependencies
├── .env.example                        # Environment variables template
├── README.md                           # Project setup guide
├── API_DOCUMENTATION.md               # Complete API reference
├── IMPLEMENTATION_SUMMARY.md          # Feature implementation summary
├── NOTIFICATIONS_API_GUIDE.md         # Notifications API documentation
├── COMPLETION_REPORT.md               # System completion status
└── INFRASTRUCTURE.md                  # This file
```

---

## 🎯 Entry Points

### 1. **server.js** - Process Entry Point
**Location:** `src/server.js`

**Purpose:**
- Main entry point for the Node.js process
- Initializes database connections
- Starts the Express server
- Handles graceful shutdown
- Manages process-level error handling

**Key Responsibilities:**
```javascript
1. Load environment variables (dotenv)
2. Import Express app configuration (app.js)
3. Connect to MongoDB database
4. Initialize Redis client
5. Start HTTP server on specified port
6. Handle SIGTERM/SIGINT signals for graceful shutdown
7. Handle uncaught exceptions and unhandled rejections
```

**Usage:**
```bash
npm start          # Production: node src/server.js
npm run dev        # Development: nodemon src/server.js
```

### 2. **app.js** - Express Configuration
**Location:** `src/app.js`

**Purpose:**
- Centralized Express application setup
- Middleware pipeline configuration
- Route mounting
- Error handling setup
- Security configuration

**Key Components:**
```javascript
1. Security Middleware (Helmet, CORS)
2. Body Parser Configuration
3. Request Logging
4. System Endpoints (health, version)
5. API Routes (18 route groups)
6. 404 Handler
7. Global Error Handler
```

**Separation of Concerns:**
- `app.js`: Express configuration (what to do with requests)
- `server.js`: Server startup (when to start and how to manage lifecycle)

---

## 🔧 Core Infrastructure Components

### 1. Configuration Layer (`config/`)

#### database.js
**Purpose:** MongoDB connection setup and initialization

**Features:**
- Connection pooling
- Error handling and reconnect logic
- Environment-based connection strings
- Mongoose options configuration

**Usage:**
```javascript
const connectDB = require('./config/database');
connectDB(); // Called in server.js
```

#### redis.js
**Purpose:** Redis cache client initialization

**Features:**
- Redis connection setup
- Event handlers (connect, error, disconnect)
- Optional caching for frequently accessed data
- TTL support for automatic expiration

**Usage:**
```javascript
const redisClient = require('./config/redis');
// Use for caching: redisClient.set(key, value, 'EX', ttl)
```

---

### 2. Middleware Layer (`middleware/`)

#### auth.js
**Purpose:** JWT authentication and role-based access control (RBAC)

**Exports:**
- `authMiddleware(req, res, next)` - Verifies JWT token
- `roleMiddleware(allowedRoles)` - Checks user role

**Features:**
- JWT verification
- User ID extraction from token
- User data loading
- Role-based access control
- Detailed error messages

**Usage:**
```javascript
app.get('/route', authMiddleware, controller);
app.get('/admin-route', authMiddleware, roleMiddleware(['admin']), controller);
```

#### errorHandler.js
**Purpose:** Centralized error handling middleware

**Exports:**
- `errorHandler(err, req, res, next)` - Main error handler

**Features:**
- Consistent error response format
- HTTP status code mapping
- Stack trace in development mode
- Logging support

**Usage:**
```javascript
app.use(errorHandler); // Must be last middleware
```

#### rateLimiter.js
**Purpose:** Rate limiting configuration for API protection

**Exports:**
- `generalLimiter` - 100 requests per 15 minutes
- `authLimiter` - 5 requests per 15 minutes (authentication)
- `apiLimiter` - 30 requests per minute (API calls)

**Features:**
- Configurable limits via environment variables
- IP-based rate limiting
- TTL-based reset
- Custom error messages

**Usage:**
```javascript
app.use(generalLimiter); // Apply globally
app.use('/api/auth', authLimiter, authRoutes); // Specific routes
```

#### validation.js
**Purpose:** Input validation schemas and middleware

**Features:**
- Field validation rules
- Custom validators
- Error message formatting
- express-validator integration

**Usage:**
```javascript
router.post('/', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
], controller);
```

---

### 3. Controllers Layer (`controllers/`)

**18 Controller Files:**

Each controller handles business logic for its domain:

#### authController.js
- User registration
- Login/logout
- Password reset
- Token refresh

#### userController.js
- Profile management
- Avatar upload
- Emergency contacts
- Account deletion

#### tripController.js
- Trip CRUD operations
- Participant management
- Itinerary management
- Trip sharing

#### budgetController.js
- Budget creation/tracking
- Spending analytics
- Budget alerts
- Category allocation

#### walletController.js
- Wallet operations
- Expense splitting
- Settlement calculations
- Transaction history

#### Travel Data Controllers
- `cityController.js` - Cities and safety info
- `touristPlaceController.js` - Tourist attractions
- `foodSpotController.js` - Restaurants and food
- `hotelController.js` - Hotel bookings
- `transportController.js` - Transportation options

#### Special Feature Controllers
- `reviewController.js` - Reviews and ratings
- `packingChecklistController.js` - Packing checklists
- `safetyController.js` - Safety information
- `notificationController.js` - Notifications & alerts (27 functions)
- `aiController.js` - AI recommendations
- `quickCommerceController.js` - Quick commerce (16 endpoints)
- `tripMemoryController.js` - Trip photos & memories (14 endpoints)
- `adminController.js` - Admin operations

---

### 4. Routes Layer (`routes/`)

**18 Route Files:**

Each route file defines REST endpoints for its domain:

**Pattern:**
```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/...');

// Public routes
router.post('/', controller.create);

// Protected routes
router.get('/', authMiddleware, controller.getAll);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);

module.exports = router;
```

**Route Mounting in app.js:**
```javascript
app.use('/api/trips', tripRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
// ... etc
```

---

### 5. Models Layer (`models/`)

**22 Database Models:**

Mongoose schemas defining data structure and validation:

#### Core Models
- `User.js` - User profiles and authentication
- `Trip.js` - Trip definitions and metadata
- `Expense.js` - Expense records
- `Wallet.js` - Multi-user wallets
- `Transaction.js` - Payment transactions

#### Travel Data Models
- `City.js` - City information
- `TouristPlace.js` - Tourist attractions
- `FoodSpot.js` - Restaurants
- `Hotel.js` - Hotels
- `Transport.js` - Transportation options

#### Feature Models
- `Review.js` - Reviews and ratings
- `PackingChecklist.js` - Packing items
- `Notification.js` - Notification records
- `UserDevice.js` - Device registrations (FCM)
- `NotificationPreference.js` - User notification settings
- `NotificationAlert.js` - Alert configurations
- `QuickCommerceProduct.js` - E-commerce products
- `QuickCommerceOrder.js` - E-commerce orders
- `TripMemory.js` - Trip photos
- `TripTimeline.js` - Event timeline
- `TripJournal.js` - Journal entries
- `TripSummary.js` - Auto-generated summaries

**Model Features:**
- Field validation
- Indexes for performance
- Default values
- Timestamps
- Middleware hooks
- Relationships (references)

---

### 6. Services Layer (`services/`)

**9 Business Logic Services:**

Each service handles complex business logic:

#### notificationService.js (398 lines)
- 9 methods for multi-channel notifications
- Firebase Cloud Messaging (FCM) integration
- Email notifications via Nodemailer
- Device management
- Preference enforcement
- Alert trigger logic

#### quickCommerceService.js
- Product catalog management
- Order creation and tracking
- Payment integration
- Partner API integration
- HMAC-SHA256 signature verification

#### tripMemoryService.js
- Photo upload and storage (Cloudinary)
- Timeline generation from trip events
- Auto-summary generation with AI
- Sentiment analysis
- Memory curation

#### budgetService.js
- Budget calculations
- Spending tracking
- Category allocation
- Over-budget alerts
- Analytics generation

#### splitService.js
- Expense splitting (equal & custom)
- Debt calculation
- Settlement tracking
- Distribution algorithms

#### aiService.js
- OpenAI API integration
- Travel recommendations
- Budget advice
- Packing suggestions
- Itinerary generation

#### safetyAnalysisService.js
- Safe/unsafe area mapping
- Safety ratings
- Emergency services lookup
- Risk assessment

#### weatherService.js
- Weather API integration
- Temperature tracking
- Weather alerts
- Climate-based suggestions

#### packingRulesEngine.js
- Season-based packing suggestions
- Duration-aware item recommendations
- Activity-specific items
- Weather-appropriate items

---

## 📊 Request/Response Flow

### Typical Request Flow:

```
1. Client sends HTTP Request
                ↓
2. Server receives at app.listen()
                ↓
3. Middleware Pipeline in app.js:
   - Helmet (security headers)
   - CORS (cross-origin check)
   - Body Parser (parse JSON)
   - Rate Limiter (check limits)
   - Auth Middleware (verify JWT)
   - Validation (validate inputs)
                ↓
4. Route Matcher:
   - Express finds matching route file
   - Route file maps to controller method
                ↓
5. Controller Execution:
   - Accept request parameters
   - Call service layer for business logic
   - Return response object
                ↓
6. Response Sent to Client:
   {
     "success": true/false,
     "data": {},
     "message": "..."
   }
                ↓
7. Error Handler (if error occurred):
   - Catch any thrown errors
   - Format consistent error response
   - Log error details
   - Send to client
```

---

## 🔐 Security Architecture

### Layer 1: Helmet Middleware
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (clickjacking prevention)
- XSS Protection

### Layer 2: CORS
- Whitelisted origins
- Credential support
- Allowed methods and headers

### Layer 3: Rate Limiting
- General API limits (100/15min)
- Auth endpoint limits (5/15min)
- Specific API limits (30/min)

### Layer 4: Authentication
- JWT token verification
- User middleware extraction
- User record validation

### Layer 5: Authorization
- Role-based access control
- User ownership verification
- Permission checking in controllers

---

## 🚀 Environment Setup

### Required Environment Variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/travel_app
MONGODB_TEST_URI=mongodb://localhost:27017/travel_app_test

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Authentication
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Firebase (for FCM)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# External APIs
OPENAI_API_KEY=sk-...
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
RAZORPAY_KEY_ID=your_key
RAZORPAY_SECRET=your_secret
```

---

## 📈 Performance Optimizations

1. **Database Indexing**
   - Indexed fields on frequently queried collections
   - Composite indexes for complex queries

2. **Caching**
   - Redis caching for travel data
   - TTL-based cache expiration
   - Cache invalidation on updates

3. **Query Optimization**
   - Lean queries with field projection
   - Pagination on all list endpoints
   - Population only when needed

4. **Connection Pooling**
   - MongoDB connection pooling
   - Redis persistent connection

5. **Middleware Optimization**
   - Skip logging in production
   - Conditional middleware application
   - Early return on validation errors

---

## 🧪 Testing & Debugging

### Health Checks:
```bash
GET http://localhost:5000/api/health
GET http://localhost:5000/api/version
```

### Debugging:
- Console logs in development
- Stack traces in error responses (dev only)
- Request logging middleware
- MongoDB connection logs

### Testing Tools:
- Postman for API testing
- Jest for unit tests
- Integration test patterns

---

## 🔄 Deployment Checklist

✅ Configuration layer (database, redis)
✅ Middleware layer (auth, error handler, rate limiter)
✅ Controllers layer (18 files)
✅ Routes layer (18 files)
✅ Models layer (22 schemas)
✅ Services layer (9 business logic files)
✅ Security (Helmet, CORS, JWT, rate limiting)
✅ Error handling (centralized)
✅ Logging (development-ready)
✅ Environment variables template (.env.example)
✅ Graceful shutdown handlers
✅ API documentation

---

## 📝 Summary

The backend infrastructure is a production-ready system with:

- **Clean separation of concerns** - Each layer has specific responsibility
- **Scalable architecture** - Easy to add controllers/routes/services
- **Security hardening** - Multi-layer security implementation
- **Error resilience** - Centralized error handling
- **Performance optimized** - Caching, indexing, connection pooling
- **Properly documented** - Inline comments and external docs

All 15+ feature systems (Auth, Users, Trips, Budget, Notifications, Notifications & Alerts, Quick Commerce, Trip Memory, etc.) are built on top of this infrastructure.

---

**Status:** ✅ COMPLETE & PRODUCTION READY

**Last Updated:** February 2026

