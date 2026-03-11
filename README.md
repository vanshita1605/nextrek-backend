# Smart Travel Planning & Budget Management System - Backend API

A comprehensive Node.js/Express backend for a travel planning and budget management platform with AI-powered recommendations, multi-user trip coordination, and real-time expense tracking.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Caching:** Redis
- **Authentication:** JWT with Refresh Tokens
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Rate Limiting:** express-rate-limit
- **File Upload:** Multer
- **Image Storage:** Cloudinary/AWS S3
- **Payment:** Razorpay/Stripe (Mocked)
- **AI:** OpenAI API
- **Notifications:** Firebase Cloud Messaging, Nodemailer
- **Email:** Nodemailer

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js       # MongoDB connection
│   │   └── redis.js          # Redis client
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── cityController.js
│   │   ├── touristPlaceController.js
│   │   ├── foodSpotController.js
│   │   ├── hotelController.js
│   │   ├── transportController.js
│   │   ├── adminController.js
│   │   ├── tripController.js
│   │   ├── budgetController.js
│   │   ├── walletController.js
│   │   ├── reviewController.js
│   │   ├── packingChecklistController.js
│   │   ├── safetyController.js
│   │   ├── notificationController.js
│   │   └── aiController.js
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Error handling
│   │   ├── validation.js     # Input validation schemas
│   │   └── rateLimiter.js    # Rate limiting
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Trip.js
│   │   ├── City.js
│   │   ├── TouristPlace.js
│   │   ├── FoodSpot.js
│   │   ├── Hotel.js
│   │   ├── Transport.js
│   │   ├── Wallet.js
│   │   ├── Expense.js
│   │   ├── Review.js
│   │   ├── Transaction.js
│   │   ├── PackingChecklist.js
│   │   ├── Memory.js
│   │   └── Notification.js
│   ├── routes/               # API endpoints
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── cityRoutes.js
│   │   ├── touristPlaceRoutes.js
│   │   ├── foodSpotRoutes.js
│   │   ├── hotelRoutes.js
│   │   ├── transportRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── tripRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── walletRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── packingChecklistRoutes.js
│   │   ├── safetyRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── aiRoutes.js
│   ├── services/             # Business logic
│   │   ├── budgetService.js
│   │   └── aiService.js
│   ├── utils/                # Utility functions
│   │   ├── jwt.js            # JWT token management
│   │   └── email.js          # Email sending
│   └── server.js             # Express app entry point
├── package.json
├── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js v14+
- MongoDB
- Redis
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
Edit `.env` with your configuration:
```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/travel-app

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_app_password

# File Upload
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AI
OPENAI_API_KEY=your_openai_api_key

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

5. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Core Features

### 1. Authentication (`/auth`)
- **POST /register** - User registration
- **POST /login** - User login
- **POST /refresh** - Refresh JWT token
- **POST /logout** - User logout
- **POST /forgot-password** - Initiate password reset
- **POST /reset-password** - Reset password with token
- **POST /change-password** - Change password (authenticated)

### 2. User Management (`/users`)
- **GET /**- Get current user profile
- **PUT /profile** - Update user profile
- **PUT /avatar** - Upload profile avatar
- **GET /preferences** - Get user preferences
- **PUT /preferences** - Update preferences
- **POST /emergency-contacts** - Add emergency contact
- **GET /emergency-contacts** - Get emergency contacts
- **PUT /emergency-contacts/:id** - Update emergency contact
- **DELETE /emergency-contacts/:id** - Delete emergency contact
- **GET /trip-history** - Get user's trip history
- **DELETE /account** - Delete user account

### 3. Travel Data

#### Cities (`/cities`)
- **GET /** - List all cities with search/filter
- **GET /:id** - Get city details
- **GET /by-country/:country** - Get cities by country
- **GET /safe-cities** - Get safe cities (by rating)
- **GET /:cityId/emergency-services** - Get emergency services

#### Tourist Places (`/tourist-places`)
- **GET /** - List places with filters
- **GET /:id** - Get place details
- **GET /category/:category** - Get places by category
- **GET /safe** - Get safe places
- **GET /nearby/:placeId** - Get nearby recommendations

#### Food Spots (`/food-spots`)
- **GET /** - List food spots with filters
- **GET /:id** - Get food spot details
- **GET /cuisine/:cuisine** - Get by cuisine type
- **GET /menu/:id** - Get menu for a restaurant
- **GET /menu/search** - Search menu items

#### Hotels (`/hotels`)
- **GET /** - List hotels with filters
- **GET /:id** - Get hotel details
- **GET /luxury** - Get 5-star hotels
- **GET /budget** - Get budget hotels
- **POST /:id/check-availability** - Check room availability

#### Transport (`/transport`)
- **GET /** - List transport options
- **GET /type/:type** - Get by transport type
- **GET /:id/cost-calculation** - Calculate trip cost

### 4. Trip Management (`/trips`)
- **POST /** - Create new trip
- **GET /** - Get user's trips
- **GET /:id** - Get trip details
- **PUT /:id** - Update trip
- **DELETE /:id** - Delete trip
- **POST /:id/invite** - Invite participant
- **POST /:id/accept-invite** - Accept trip invitation
- **POST /:id/decline-invite** - Decline invitation
- **DELETE /:id/participant/:userId** - Remove participant
- **POST /:id/itinerary** - Add itinerary activity
- **PUT /:id/itinerary/:dayIndex/:activityIndex** - Update activity
- **DELETE /:id/itinerary/:dayIndex/:activityIndex** - Delete activity
- **GET /:id/expenses** - Get trip expenses
- **GET /:id/summary** - Get trip summary

### 5. Budget Management (`/budget`)
- **POST /estimate** - Estimate trip budget
- **GET /:tripId/category-breakdown** - Category-wise budget
- **GET /:tripId/status** - Check budget status
- **GET /:tripId/analytics** - Budget analytics
- **GET /:tripId/recommendations** - Get recommendations
- **GET /:tripId/report** - Generate report
- **POST /:tripId/equal-split** - Calculate equal split
- **POST /:tripId/custom-split** - Calculate custom split
- **PUT /:tripId/expenses** - Update from expenses
- **GET /:tripId/breakdown** - Expense breakdown

### 6. Wallet & Payments (`/trips/:tripId/wallet`)
- **GET /:tripId** - Get trip wallet
- **POST /:tripId/add-money** - Add money to wallet
- **POST /:tripId/expenses** - Add expense
- **GET /:tripId/user-share** - Get user's share
- **GET /:tripId/settlements** - Get settlement details
- **POST /:tripId/settle-payment** - Record payment settlement
- **GET /:tripId/transactions** - Get wallet transactions
- **PUT /:tripId/close** - Close wallet

### 7. Reviews & Ratings (`/reviews`)
- **POST /** - Create review
- **GET /entity/:entityType/:entityId** - Get reviews for entity
- **GET /user/my-reviews** - Get user's reviews
- **PUT /:reviewId** - Update review
- **DELETE /:reviewId** - Delete review
- **POST /:reviewId/helpful** - Mark as helpful
- **POST /:reviewId/report** - Report review
- **PUT /:reviewId/approve** - Approve review (admin)
- **PUT /:reviewId/reject** - Reject review (admin)

### 8. Packing Checklist (`/packing`)
- **POST /:tripId/generate** - Generate checklist
- **GET /:tripId** - Get checklist
- **PUT /:checklistId/item/:itemIndex** - Update item status
- **POST /:checklistId/item** - Add custom item
- **DELETE /:checklistId/item/:itemIndex** - Delete item
- **GET /:tripId/progress** - Get progress

### 9. Safety (`/safety`)
- **GET /city/:cityId/safe-areas** - Get safe areas
- **GET /city/:cityId/unsafe-areas** - Get unsafe areas
- **GET /city/:cityId/emergency-services** - Get emergency services
- **GET /city/:cityId/police-stations** - Get police stations
- **GET /city/:cityId/hospitals** - Get hospitals
- **GET /city/:cityId/safety-rating** - Get safety rating
- **GET /city/:cityId/safe-places** - Get safe places
- **POST /place/:placeId/add-to-safe-list** - Save safe place
- **POST /place/:placeId/report-unsafe** - Report unsafe place

### 10. Notifications (`/notifications`)
- **GET /** - Get user notifications
- **GET /unread-count** - Get unread count
- **GET /summary** - Get notification summary
- **GET /by-type/:type** - Get by type
- **PUT /:notificationId/read** - Mark as read
- **PUT /all/read** - Mark all as read
- **DELETE /:notificationId** - Delete notification
- **DELETE /all** - Delete all
- **GET /preferences** - Get preferences
- **PUT /preferences** - Update preferences

### 11. AI Assistant (`/ai`)
- **POST /recommendations** - Get travel recommendations
- **GET /budget-advice/:tripId** - Get budget advice
- **POST /packing-suggestions** - Get packing suggestions
- **POST /itinerary** - Get itinerary suggestions
- **POST /safety-tips** - Get safety & local tips
- **POST /ask** - Ask general question
- **POST /meal-plan** - Get meal plan recommendations

### 12. Admin (`/admin`)
- **GET /dashboard/stats** - Dashboard statistics
- **GET /users** - List users with filters
- **PUT /users/:userId/role** - Update user role
- **PUT /users/:userId/deactivate** - Deactivate user
- **POST /cities** - Create city
- **PUT /cities/:id** - Update city
- **DELETE /cities/:id** - Delete city
- **POST /places** - Create tourist place
- Similar CRUD for FoodSpots, Hotels, Transport

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details (development only)"
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

## Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes
- **General API:** 100 requests per 15 minutes
- **Search endpoints:** 30 requests per minute

## Security Features

✅ JWT authentication with refresh tokens
✅ Password hashing with bcryptjs
✅ CORS protection
✅ Helmet security headers
✅ Rate limiting
✅ Input validation and sanitization
✅ Role-based access control (RBAC)
✅ SQL injection prevention
✅ XSS protection

## Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start src/server.js --name "travel-api"
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
docker build -t travel-api .
docker run -p 5000:5000 travel-api
```

## Testing

Run tests:
```bash
npm test
```

## Environment Files

### .env.example
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/travel-app

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email Service
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_password

# File Upload
CLOUDINARY_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

# Payment Gateway
RAZORPAY_KEY_ID=id
RAZORPAY_KEY_SECRET=secret

# OpenAI
OPENAI_API_KEY=key

# Firebase
FIREBASE_PROJECT_ID=id
FIREBASE_PRIVATE_KEY=key
FIREBASE_CLIENT_EMAIL=email
```

## Database Models

### User
- Authentication fields (email, password, role)
- Profile information
- Preferences and settings
- Emergency contacts
- Trip history
- Notification preferences
- Wallet references

### Trip
- Trip details (name, destination, dates)
- Budget management
- Participants with roles
- Itinerary (day-wise activities)
- Expenses tracking
- Status (planning, active, completed, cancelled)

### City
- City master data
- Safety ratings
- Safe/unsafe areas
- Emergency contacts
- Tourism information
- Weather data

### TouristPlace, FoodSpot, Hotel, Transport
- Entity-specific details
- Ratings and reviews
- Pricing information
- Availability/scheduling
- Safety flags
- Photo galleries

### Wallet & Expense
- Trip-based wallet management
- Multi-user balance tracking
- Expense records
- Split allocation (equal/custom)
- Transaction history

### Review
- Ratings (1-5 stars)
- Written reviews
- Photo evidence
- Moderation status
- Helpful votes
- Report tracking

### Notification
- Multi-channel delivery (email, SMS, push, in-app)
- User preferences
- Read/unread status
- Type categorization

## Future Enhancements

- [ ] Real-time updates with Socket.io
- [ ] Advanced analytics and reporting
- [ ] Mobile app integration
- [ ] Machine learning-based recommendations
- [ ] Group expense management with settlements
- [ ] Video/media sharing
- [ ] Guide/tour booking integration
- [ ] Travel insurance integration
- [ ] Currency conversion and real-time rates
- [ ] Multi-language support

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and support:
- Email: support@travelbudgetapp.com
- GitHub Issues: [repository]/issues
- Documentation: [API docs link]

## Authors

Development Team - Travel Budget Management System

---

**Version:** 1.0.0
**Last Updated:** 2024
