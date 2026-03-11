// API_DOCUMENTATION.md

# Smart Travel Planning & Budget Management System - Complete API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. AUTHENTICATION ENDPOINTS

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phoneNumber": "+1234567890",
  "country": "USA",
  "profilePhoto": "url_or_base64"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "user_id",
    "email": "john@example.com",
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "user_id",
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token"
  }
}
```

---

### POST /auth/logout
Logout user (invalid refresh token).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password
Initiate password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### POST /auth/change-password
Change password (authenticated).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 2. USER MANAGEMENT ENDPOINTS

### GET /users/
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePhoto": "url",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /users/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "bio": "Travel enthusiast",
  "country": "USA"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user profile */ }
}
```

---

### PUT /users/avatar
Upload profile avatar.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (multipart/form-data)
```
file: <image_file>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "cloudinary_url"
  }
}
```

---

### GET /users/preferences
Get user preferences.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currency": "USD",
    "language": "en",
    "travelStyle": "budget",
    "interests": ["hiking", "food"],
    "dietaryRestrictions": ["vegetarian"]
  }
}
```

---

### PUT /users/preferences
Update preferences.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currency": "EUR",
  "language": "de",
  "travelStyle": "luxury",
  "interests": ["beach", "culture", "food"],
  "dietaryRestrictions": ["vegan"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferences updated"
}
```

---

### POST /users/emergency-contacts
Add emergency contact.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Emergency Contact",
  "relationship": "Family",
  "phoneNumber": "+1234567890",
  "email": "contact@example.com",
  "address": "123 Main St"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Emergency contact added"
}
```

---

### GET /users/emergency-contacts
Get emergency contacts.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "contact_id",
      "name": "Emergency Contact",
      "relationship": "Family",
      "phoneNumber": "+1234567890"
    }
  ]
}
```

---

### GET /users/trip-history
Get user's trip history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (planning, active, completed, cancelled)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "_id": "trip_id",
        "destinationCity": "Paris",
        "startDate": "2024-06-01",
        "endDate": "2024-06-07",
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### DELETE /users/account
Delete user account.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## 3. CITY & TRAVEL DATA ENDPOINTS

### GET /cities?search=Paris&country=France&page=1&limit=10
List all cities with search and filters.

**Query Parameters:**
- `search` - Search by city name
- `country` - Filter by country
- `sort` - Sort by name, safetyRating, population
- `page` - Page number
- `limit` - Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cities": [
      {
        "_id": "city_id",
        "name": "Paris",
        "country": "France",
        "population": 2161000,
        "safetyRating": 4.5,
        "currency": "EUR",
        "bestTimeToVisit": "April-May"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

---

### GET /cities/:id
Get city details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "city_id",
    "name": "Paris",
    "country": "France",
    "description": "City of Love",
    "safetyRating": 4.5,
    "safetyAreas": {
      "safe": ["Le Marais", "Latin Quarter"],
      "unsafe": ["Red Light District"]
    },
    "emergencyContacts": [
      {
        "type": "police",
        "name": "Police Prefecture",
        "phoneNumber": "17",
        "address": "34 Rue de la Paix"
      }
    ]
  }
}
```

---

### GET /cities/safe-cities?page=1&limit=10
Get safe cities by rating.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cities": [
      /* cities sorted by safety rating */
    ],
    "pagination": { /* pagination info */ }
  }
}
```

---

### GET /tourist-places?city=paris&category=monument&page=1
List tourist places with filters.

**Query Parameters:**
- `city` - Filter by city
- `category` - monument, museum, temple, park, etc.
- `minRating` - Minimum rating
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "places": [
      {
        "_id": "place_id",
        "name": "Eiffel Tower",
        "city": "Paris",
        "category": "monument",
        "rating": 4.8,
        "reviewCount": 5000,
        "entryFee": 25,
        "openingHours": "9:00 AM - 12:45 AM",
        "address": "Champ de Mars"
      }
    ]
  }
}
```

---

### GET /food-spots?city=paris&cuisine=french&page=1
List food spots with filters.

**Query Parameters:**
- `city` - Filter by city
- `cuisine` - Cuisine type
- `priceRange` - low, medium, high
- `deliveryAvailable` - true/false
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "foodSpots": [
      {
        "_id": "spot_id",
        "name": "Restaurant Name",
        "city": "Paris",
        "cuisine": "French",
        "rating": 4.5,
        "priceRange": "$$",
        "deliveryAvailable": true,
        "menu": [ /* menu items */ ]
      }
    ]
  }
}
```

---

### GET /hotels?city=paris&starRating=5&page=1
List hotels with filters.

**Query Parameters:**
- `city` - Filter by city
- `starRating` - 1-5
- `minPrice`, `maxPrice` - Price range
- `availableFrom` - Check-in date
- `availableTo` - Check-out date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "_id": "hotel_id",
        "name": "Luxury Hotel",
        "city": "Paris",
        "starRating": 5,
        "pricePerNight": 250,
        "amenities": ["pool", "spa", "restaurant"],
        "address": "123 Rue de Peace"
      }
    ]
  }
}
```

---

### GET /transport?city=paris&type=taxi&page=1
List transport options.

**Query Parameters:**
- `city` - Filter by city
- `type` - taxi, bike, car, bus, train, metro
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transport": [
      {
        "_id": "transport_id",
        "name": "Taxi Service",
        "type": "taxi",
        "pricePerKm": 2.5,
        "availableHours": "24/7",
        "rating": 4.6
      }
    ]
  }
}
```

---

## 4. TRIP MANAGEMENT ENDPOINTS

### POST /trips
Create a new trip.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Paris Vacation",
  "destination": "Paris",
  "country": "France",
  "startDate": "2024-06-01",
  "endDate": "2024-06-07",
  "budgetTotal": 3000,
  "tripType": "couple",
  "description": "Summer getaway",
  "participants": ["user_id_2", "user_id_3"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "_id": "trip_id",
    "name": "Paris Vacation",
    "destination": "Paris",
    "owner": "owner_user_id",
    "participants": [ /* participant details */ ],
    "Budget": {
      "total": 3000,
      "categories": {
        "accommodation": { "allocated": 1200, "spent": 0 },
        "food": { "allocated": 900, "spent": 0 },
        "activities": { "allocated": 600, "spent": 0 },
        "transport": { "allocated": 300, "spent": 0 }
      },
      "spent": 0,
      "remaining": 3000
    }
  }
}
```

---

### GET /trips
Get user's trips.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` - planning, active, completed, cancelled
- `page` - Page number
- `limit` - Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trips": [ /* list of trips */ ],
    "pagination": { /* pagination */ }
  }
}
```

---

### GET /trips/:tripId
Get trip details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "trip_id",
    "name": "Paris Vacation",
    /* all trip details */
  }
}
```

---

### PUT /trips/:tripId
Update trip.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Trip Name",
  "budgetTotal": 3500,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip updated successfully"
}
```

---

### DELETE /trips/:tripId
Delete trip.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

### POST /trips/:tripId/invite
Invite participant to trip.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "friend@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Invitation sent",
  "data": {
    "invitationId": "invitation_id"
  }
}
```

---

### POST /trips/:tripId/accept-invite
Accept trip invitation.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Invitation accepted"
}
```

---

### POST /trips/:tripId/itinerary
Add itinerary activity.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "day": 1,
  "activities": [
    {
      "time": "10:00 AM",
      "title": "Visit Eiffel Tower",
      "description": "Go to Eiffel Tower observation deck",
      "location": "Champ de Mars",
      "duration": "2 hours",
      "estimatedCost": 25
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Itinerary added"
}
```

---

### GET /trips/:tripId/expenses
Get trip expenses.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `category` - Filter by category
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "_id": "expense_id",
        "amount": 50,
        "category": "food",
        "paidBy": "user_id",
        "splitBetween": [
          { "userId": "user_id_2", "amount": 25 }
        ],
        "date": "2024-06-01"
      }
    ]
  }
}
```

---

### GET /trips/:tripId/summary
Get trip summary with statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tripName": "Paris Vacation",
    "duration": 7,
    "participantCount": 3,
    "budget": {
      "total": 3000,
      "spent": 1250,
      "remaining": 1750,
      "percentageUsed": 41.67
    },
    "expenses": {
      "byCategory": { /* breakdown */ },
      "byPerson": { /* per person */ }
    }
  }
}
```

---

## 5. BUDGET MANAGEMENT ENDPOINTS

### POST /budget/estimate
Estimate trip budget.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "city": "Paris",
  "duration": 7,
  "numberOfPeople": 2,
  "tripType": "couple",
  "preferences": {
    "accommodationType": "budget",
    "foodStyles": ["local", "restaurants"],
    "activities": "moderate"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "baseBudget": 2500,
    "contingency": 250,
    "recommended": 2750,
    "breakdown": {
      "accommodation": 1000,
      "food": 900,
      "activities": 500,
      "transport": 350
    }
  }
}
```

---

### GET /budget/:tripId/category-breakdown
Get category-wise budget breakdown.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "accommodation",
        "allocated": 1200,
        "spent": 850,
        "remaining": 350,
        "percentageUsed": 70.83
      },
      {
        "name": "food",
        "allocated": 900,
        "spent": 200,
        "remaining": 700,
        "percentageUsed": 22.22
      }
    ]
  }
}
```

---

### GET /budget/:tripId/status
Check budget status and alerts.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "warning",
    "totalBudget": 3000,
    "spent": 2400,
    "percentageUsed": 80,
    "alerts": [
      {
        "severity": "medium",
        "message": "You've spent 80% of your budget",
        "affectedCategory": "accommodation",
        "recommendation": "Reduce accommodation costs"
      }
    ]
  }
}
```

---

### GET /budget/:tripId/analytics
Get budget analytics with projections.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalBudget": 3000,
    "spentToDate": 1500,
    "daysElapsed": 3.5,
    "daysRemaining": 3.5,
    "dailySpendingRate": 428.57,
    "projectedTotal": 3000,
    "projectionStatus": "on_track",
    "savingsOpportunity": 0
  }
}
```

---

### GET /budget/:tripId/recommendations
Get budget recommendations.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "priority": "high",
        "type": "reduce",
        "message": "Consider reducing food expenses",
        "potential_savings": 200,
        "currentCategory": "food"
      }
    ]
  }
}
```

---

### POST /budget/:tripId/equal-split
Calculate equal expense split.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "totalAmount": 120,
  "numberOfPeople": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalAmount": 120,
    "numberOfPeople": 3,
    "amountPerPerson": 40,
    "split": [
      { "userId": "user_id_1", "amount": 40 },
      { "userId": "user_id_2", "amount": 40 },
      { "userId": "user_id_3", "amount": 40 }
    ]
  }
}
```

---

### POST /budget/:tripId/custom-split
Calculate custom weighted split.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "totalAmount": 120,
  "splits": [
    { "userId": "user_id_1", "percentage": 50 },
    { "userId": "user_id_2", "percentage": 30 },
    { "userId": "user_id_3", "percentage": 20 }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "split": [
      { "userId": "user_id_1", "amount": 60 },
      { "userId": "user_id_2", "amount": 36 },
      { "userId": "user_id_3", "amount": 24 }
    ]
  }
}
```

---

## 6. WALLET & PAYMENT ENDPOINTS

### GET /trips/:tripId/wallet/:tripId
Get wallet details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "wallet_id",
    "tripId": "trip_id",
    "totalBalance": 5000,
    "currency": "USD",
    "users": [
      {
        "userId": "user_id_1",
        "balance": 2500,
        "joinedAt": "2024-01-01"
      }
    ],
    "transactions": [ /* transaction array */ ]
  }
}
```

---

### POST /trips/:tripId/wallet/:tripId/add-money
Add money to wallet.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 500,
  "paymentMethod": "credit_card"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Money added to wallet",
  "data": {
    "userId": "user_id",
    "amount": 500,
    "newBalance": 3000,
    "walletTotal": 6200,
    "transaction": "transaction_id"
  }
}
```

---

### POST /trips/:tripId/wallet/:tripId/expenses
Add expense to wallet.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 75,
  "category": "food",
  "description": "Dinner at restaurant",
  "splitType": "equal",
  "splitBetween": [
    { "userId": "user_id_1", "amount": 25 },
    { "userId": "user_id_2", "amount": 25 },
    { "userId": "user_id_3", "amount": 25 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "data": {
    "expense": { /* expense details */ },
    "tripBudget": {
      "totalSpent": 1300,
      "remaining": 1700
    },
    "alerts": [ /* any budget alerts */ ]
  }
}
```

---

### GET /trips/:tripId/wallet/:tripId/user-share
Get user's share in trip wallet.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "walletBalance": 2500,
    "totalPaid": 800,
    "totalOwes": 300,
    "balance": 500,
    "balanceStatus": "will_receive"
  }
}
```

---

### GET /trips/:tripId/wallet/:tripId/settlements
Get settlement details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tripId": "trip_id",
    "balances": [
      {
        "userId": "user_id_1",
        "name": "John Doe",
        "paid": 800,
        "owes": 300,
        "balance": 500
      }
    ],
    "settlements": [
      {
        "from": "user_id_2",
        "fromName": "Jane Smith",
        "to": "user_id_1",
        "toName": "John Doe",
        "amount": 150
      }
    ],
    "totalExpenses": 3000
  }
}
```

---

### POST /trips/:tripId/wallet/:tripId/settle-payment
Record settlement payment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fromUserId": "user_id_2",
  "toUserId": "user_id_1",
  "amount": 150
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment settled successfully",
  "data": {
    "from": "user_id_2",
    "to": "user_id_1",
    "amount": 150,
    "transactionId": "transaction_id",
    "settledAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 7. REVIEW ENDPOINTS

### POST /reviews
Create a review.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "entityType": "TouristPlace",
  "entityId": "place_id",
  "rating": 4,
  "title": "Worth Visiting",
  "description": "Beautiful place with great views",
  "photos": ["url1", "url2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "review_id",
    "rating": 4,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /reviews/entity/:entityType/:entityId
Get reviews for entity.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `sortBy` - recent, rating, helpful

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "userId": { "firstName": "John", "lastName": "Doe" },
        "rating": 4,
        "title": "Great experience",
        "description": "Really enjoyed this place",
        "helpfulCount": 5,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "averageRating": 4.5,
    "totalReviews": 200,
    "pagination": { /* pagination */ }
  }
}
```

---

### GET /reviews/user/my-reviews
Get user's reviews.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [ /* user's reviews */ ],
    "pagination": { /* pagination */ }
  }
}
```

---

### POST /reviews/:reviewId/helpful
Mark review as helpful.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Review marked as helpful",
  "data": {
    "helpfulCount": 6
  }
}
```

---

### POST /reviews/:reviewId/report
Report a review.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "inappropriate",
  "description": "This review contains offensive language"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review reported successfully"
}
```

---

## 8. PACKING CHECKLIST ENDPOINTS

### POST /packing/:tripId/generate
Generate packing checklist.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "season": "summer",
  "weather": "hot",
  "tripType": "beach"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Packing checklist generated successfully",
  "data": {
    "_id": "checklist_id",
    "tripId": "trip_id",
    "items": [
      {
        "category": "clothing",
        "item": "T-shirts",
        "isChecked": false,
        "priority": "medium"
      }
    ]
  }
}
```

---

### GET /packing/:tripId
Get checklist for trip.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "checklist_id",
    "items": [ /* all items */ ]
  }
}
```

---

### PUT /packing/:checklistId/item/:itemIndex
Update item status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "isChecked": true,
  "notes": "Already packed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item updated successfully"
}
```

---

### POST /packing/:checklistId/item
Add custom item.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "item": "Hiking Boots",
  "category": "clothing",
  "priority": "high"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Custom item added"
}
```

---

### GET /packing/:tripId/progress
Get packing progress.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalItems": 50,
    "checkedItems": 35,
    "progressPercentage": 70,
    "itemsByCategory": {
      "clothing": { "total": 15, "checked": 12 },
      "toiletries": { "total": 10, "checked": 8 }
    },
    "uncheckedItems": [ /* list of unchecked */ ]
  }
}
```

---

## 9. SAFETY ENDPOINTS

### GET /safety/city/:cityId/safe-areas
Get safe areas in city.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": { "name": "Paris", "safetyRating": 4.5 },
    "safeAreas": [
      {
        "name": "Le Marais",
        "description": "Historic district with shops and galleries",
        "rating": 4.8
      }
    ],
    "pagination": { /* pagination */ }
  }
}
```

---

### GET /safety/city/:cityId/unsafe-areas
Get unsafe areas in city.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": { "name": "Paris" },
    "unsafeAreas": [ /* areas to avoid */ ]
  }
}
```

---

### GET /safety/city/:cityId/emergency-services
Get emergency services.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": { "name": "Paris", "country": "France" },
    "emergencyServices": [
      {
        "type": "police",
        "name": "Police Prefecture",
        "phoneNumber": "17",
        "address": "34 Rue de la Paix",
        "availability": "24/7"
      }
    ]
  }
}
```

---

### GET /safety/city/:cityId/police-stations
Get nearby police stations.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": "Paris",
    "policeStations": [
      {
        "name": "Central Police Station",
        "phoneNumber": "17",
        "address": "123 Main Street",
        "coordinates": { "lat": 48.8566, "lng": 2.3522 }
      }
    ],
    "totalStations": 5
  }
}
```

---

### GET /safety/city/:cityId/hospitals
Get nearby hospitals.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": "Paris",
    "hospitals": [
      {
        "name": "Central Hospital",
        "phoneNumber": "+33 1 42 34 82 82",
        "address": "1 Avenue Claude Vellefaux",
        "services": ["emergency", "surgery", "pediatrics"]
      }
    ]
  }
}
```

---

### GET /safety/city/:cityId/safety-rating
Get city safety rating.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": "Paris",
    "safetyRating": 4.5,
    "safetyRatingDescription": "Safe",
    "safeAreas": 15,
    "unsafeAreas": 3,
    "safetyTips": [ /* safety tips */ ],
    "recommendations": [
      "Avoid traveling alone at night",
      "Keep valuables secure"
    ]
  }
}
```

---

## 10. NOTIFICATION ENDPOINTS

### GET /notifications?page=1&limit=20&status=all
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` - all, read, unread
- `type` - notification type filter
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "type": "budget_alert",
        "title": "Budget Alert",
        "message": "You've spent 80% of your budget",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 3,
    "pagination": { /* pagination */ }
  }
}
```

---

### PUT /notifications/:notificationId/read
Mark as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### PUT /notifications/all/read
Mark all as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### DELETE /notifications/:notificationId
Delete notification.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### GET /notifications/preferences
Get notification preferences.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "email": true,
    "sms": true,
    "push": true,
    "inApp": true,
    "budgetAlerts": true,
    "tripUpdates": true,
    "recommendedPlaces": true
  }
}
```

---

### PUT /notifications/preferences
Update preferences.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": true,
  "sms": false,
  "push": true,
  "budgetAlerts": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences updated"
}
```

---

## 11. AI ASSISTANT ENDPOINTS

### POST /ai/recommendations
Get travel recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "city": "Paris",
  "budget": 3000,
  "days": 7,
  "tripType": "couple"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "city": "Paris",
    "tripType": "couple",
    "recommendations": "AI-generated recommendations text..."
  }
}
```

---

### GET /ai/budget-advice/:tripId
Get budget advice for trip.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tripId": "trip_id",
    "advice": "Based on your spending patterns... recommendations"
  }
}
```

---

### POST /ai/packing-suggestions
Get packing suggestions.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "city": "Paris",
  "season": "summer",
  "duration": 7
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": "- Lightweight clothing\n- Comfortable walking shoes\n..."
  }
}
```

---

### POST /ai/itinerary
Get itinerary suggestions.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "city": "Paris",
  "days": 7,
  "interests": ["art", "food", "history"],
  "budget": 3000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "itinerary": "Day 1: Visit Louvre Museum...\nDay 2: ..."
  }
}
```

---

### POST /ai/safety-tips
Get safety and local tips.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "city": "Paris",
  "country": "France"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tips": "Safety tips and local customs..."
  }
}
```

---

### POST /ai/ask
Ask general travel question.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "question": "What's the best time to visit Paris?",
  "tripId": "trip_id_optional"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "question": "What's the best time to visit Paris?",
    "answer": "The best time to visit Paris is... April to May or September to October..."
  }
}
```

---

### POST /ai/meal-plan
Get meal plan recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "city": "Paris",
  "days": 7,
  "dietaryPreferences": ["vegetarian"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "mealPlan": "Day 1:\n- Breakfast: Croissants at local café\n..."
  }
}
```

---

## Response Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Internal error |

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details (development only)"
}
```

---

## Rate Limits

- Auth Endpoints: 5 requests per 15 minutes
- General API: 100 requests per 15 minutes
- Search: 30 requests per minute

---

## Best Practices

1. **Always include JWT token** for authenticated endpoints
2. **Handle pagination** properly with page and limit parameters
3. **Use appropriate HTTP methods** (GET for fetching, POST for creating, PUT for updating, DELETE for deleting)
4. **Filter and search efficiently** using query parameters
5. **Handle errors gracefully** with proper error handling
6. **Cache responses** when appropriate
7. **Use rate limiting** to avoid overwhelming the API

---

End of API Documentation
