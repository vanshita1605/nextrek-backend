# Notifications & Alerts System - Complete API Reference

## Overview

The Notifications & Alerts system provides a comprehensive multi-channel notification delivery platform with Firebase Cloud Messaging (FCM) integration, device management, user preferences, and trigger-based alerts.

**Base URL:** `http://localhost:5000/api/notifications`

**Authentication:** All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## System Architecture

### 1. Core Models

#### Notification Model
Stores all notification records with multi-channel tracking.

**Fields:**
- `notificationId`: Unique identifier
- `userId`: Reference to user
- `type`: 30+ notification types
- `title` & `body`: Notification content
- `priority`: low/normal/high/max
- `action`: Deep link action (open_app, open_trip, etc.)
- `actionData`: Action metadata
- `deepLink`: Full deep link URL
- `channels`: Multi-channel delivery tracking
  - `push`: FCM push notification tracking
  - `email`: Email delivery tracking
  - `sms`: SMS delivery tracking
  - `inApp`: In-app notification flag
- `isRead`: Read status with timestamp
- `isDeleted`: Soft delete flag
- `expiresAt`: Expiration date (30 days default)
- `metadata`: Additional data
- `createdAt`, `updatedAt`: Timestamps

#### UserDevice Model
Manages device registration for push notifications.

**Fields:**
- `userId`: Reference to user
- `deviceId`: Unique device identifier
- `fcmToken`: Firebase Cloud Messaging token (indexed)
- `deviceType`: ios/android/web
- `brand`: Device brand
- `model`: Device model
- `osVersion`: Operating system version
- `appVersion`: App version
- `isActive`: Device status
- `notificationsEnabled`: Per-device notification toggle
- `lastActive`: Last activity timestamp

#### NotificationPreference Model
User-granular notification control and settings.

**Fields:**
- `userId`: Reference to user
- `globalNotifications`: Enable/disable all notifications
- `notificationTypes`: 11+ notification type preferences
  - Each type includes:
    - `enabled`: Boolean toggle
    - `channels`: Push/Email/SMS toggles
- `quietHours`:
  - `enabled`: Quiet hours active
  - `startTime`: Start time (HH:MM)
  - `endTime`: End time (HH:MM)
  - `timezone`: Timezone string
  - `allowHighPriority`: Bypass quiet hours for max priority
- `frequency`: Batching frequency
- `doNotDisturb`: DND scheduling

#### NotificationAlert Model
Trigger-based alerts with condition matching.

**Fields:**
- `alertId`: Unique identifier
- `userId`: Reference to user
- `tripId`: Related trip (if applicable)
- `alertType`: 16 alert types
- `severity`: low/medium/high/critical
- `condition`:
  - `metric`: Budget, temperature, safety_rating, etc.
  - `operator`: equals/gt/lt/gte/lte
  - `threshold`: Threshold value
  - `currentValue`: Current metric value
- `title` & `message`: Alert content
- `isActive`: Active status
- `isResolved`: Resolution status
- `resolvedBy`: User who resolved
- `resolvedAt`: Resolution timestamp
- `recurrence`:
  - `enabled`: Recurrence active
  - `frequency`: once/hourly/daily/weekly
  - `nextOccurrence`: Next trigger time
  - `occurrenceCount`: Total occurrences
- `acknowledgments`: User acknowledgment tracking array
- `actions`: Action items array

---

## API Endpoints (22 Total)

### Section 1: Notification Management (10 endpoints)

#### GET /
**Get all notifications with pagination**

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type
- `isRead` (optional): Filter by read status

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
        "body": "You've exceeded your budget",
        "priority": "high",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    },
    "unreadCount": 5
  }
}
```

---

#### GET /:notificationId
**Get notification detail**

**URL Parameters:**
- `notificationId`: MongoDB notification ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "_id": "notification_id",
      "type": "budget_alert",
      "title": "Budget Exceeded",
      "body": "Trip budget exceeded",
      "priority": "high",
      "deepLink": "/trips/trip_id",
      "action": "open_trip",
      "isRead": false,
      "channels": {
        "push": { "sent": true, "status": "delivered" },
        "email": { "sent": true, "status": "delivered" }
      },
      "metadata": { "tripId": "trip_id" }
    }
  }
}
```

---

#### GET /type/:type
**Get notifications by type**

**URL Parameters:**
- `type`: Notification type

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [],
    "pagination": { "page": 1, "limit": 20, "total": 10, "pages": 1 }
  }
}
```

---

#### GET /unread/count
**Get unread notification count**

**Response (200):**
```json
{
  "success": true,
  "data": { "unreadCount": 5 }
}
```

---

#### GET /stats/summary
**Get notification statistics**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 100,
      "unread": 5,
      "byType": {
        "budget_alert": 25,
        "trip_created": 15,
        "order_delivered": 10
      },
      "byChannel": {
        "push": 50,
        "email": 30,
        "inApp": 40
      }
    }
  }
}
```

---

#### POST /
**Create notification (internal/manual)**

**Request Body:**
```json
{
  "type": "payment_pending",
  "title": "Payment Pending",
  "body": "Your trip settlement is pending",
  "priority": "high",
  "relatedId": "trip_id",
  "action": "open_trip"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Notification created",
  "data": { "notification": { ... } }
}
```

---

#### PUT /:notificationId/read
**Mark notification as read**

**URL Parameters:**
- `notificationId`: MongoDB notification ID

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { "notification": { ... } }
}
```

---

#### PUT /read/all
**Mark all notifications as read**

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": { "updatedCount": 5 }
}
```

---

#### DELETE /:notificationId
**Delete single notification**

**URL Parameters:**
- `notificationId`: MongoDB notification ID

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

#### DELETE /clear/all
**Delete all notifications**

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications deleted",
  "data": { "deletedCount": 100 }
}
```

---

#### POST /test
**Send test notification**

**Request Body:**
```json
{
  "type": "payment_pending",
  "priority": "high"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Test notification sent",
  "data": { "notification": { ... } }
}
```

---

### Section 2: Device Management (4 endpoints)

#### POST /devices/register
**Register device for push notifications**

**Request Body:**
```json
{
  "deviceId": "device_uuid_123",
  "fcmToken": "fcm_token_from_firebase",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21",
  "osVersion": "11.0",
  "appVersion": "1.0.0",
  "brand": "Samsung",
  "model": "Galaxy S21"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "device": {
      "_id": "device_id",
      "deviceId": "device_uuid_123",
      "fcmToken": "fcm_token",
      "deviceType": "android",
      "isActive": true,
      "notificationsEnabled": true
    }
  }
}
```

---

#### GET /devices
**Get user's registered devices**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "_id": "device_id",
        "deviceId": "device_123",
        "deviceType": "android",
        "brand": "Samsung",
        "model": "Galaxy S21",
        "isActive": true,
        "notificationsEnabled": true,
        "lastActive": "2024-01-15T10:30:00Z"
      },
      {
        "_id": "device_id_2",
        "deviceId": "device_456",
        "deviceType": "ios",
        "brand": "Apple",
        "model": "iPhone 13",
        "isActive": true,
        "notificationsEnabled": true,
        "lastActive": "2024-01-14T15:20:00Z"
      }
    ],
    "total": 2
  }
}
```

---

#### POST /devices/:deviceId/unregister
**Unregister device**

**URL Parameters:**
- `deviceId`: Device UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Device unregistered",
  "data": { "device": { ... } }
}
```

---

#### PUT /devices/:deviceId/toggle
**Toggle notifications for device**

**URL Parameters:**
- `deviceId`: Device UUID

**Request Body:**
```json
{
  "enabled": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notifications disabled",
  "data": { "device": { ... } }
}
```

---

### Section 3: Preferences (4 endpoints)

#### GET /preferences
**Get notification preferences**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "userId": "user_id",
      "globalNotifications": true,
      "notificationTypes": {
        "tripInvitations": {
          "enabled": true,
          "channels": {
            "push": true,
            "email": true,
            "sms": false
          }
        },
        "budgetAlerts": {
          "enabled": true,
          "channels": {
            "push": true,
            "email": true,
            "sms": true
          }
        },
        "weatherAlerts": {
          "enabled": false,
          "channels": {
            "push": false,
            "email": false,
            "sms": false
          }
        }
      },
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "UTC",
        "allowHighPriority": true
      },
      "frequency": "instant"
    }
  }
}
```

---

#### PUT /preferences
**Update notification preferences**

**Request Body:**
```json
{
  "globalNotifications": true,
  "frequency": "daily",
  "notificationTypes": {
    "budgetAlerts": {
      "enabled": true,
      "channels": {
        "push": true,
        "email": false
      }
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferences updated",
  "data": { "preferences": { ... } }
}
```

---

#### PUT /preferences/toggle/:type
**Toggle specific notification type**

**URL Parameters:**
- `type`: Notification type (budgetAlerts, tripInvitations, etc.)

**Request Body:**
```json
{
  "enabled": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "budgetAlerts notifications disabled",
  "data": { "preferences": { ... } }
}
```

---

#### PUT /preferences/quiet-hours
**Set quiet hours**

**Request Body:**
```json
{
  "enabled": true,
  "startTime": "22:00",
  "endTime": "08:00",
  "timezone": "Asia/Kolkata",
  "allowHighPriority": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Quiet hours updated",
  "data": { "preferences": { ... } }
}
```

---

### Section 4: Alerts (3 endpoints)

#### GET /alerts
**Get alerts**

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `isActive` (optional): Filter active alerts
- `severity` (optional): Filter by severity (low/medium/high/critical)
- `tripId` (optional): Filter by trip

**Response (200):**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "alertId": "alert_123",
        "alertType": "budget_exceeded",
        "severity": "high",
        "title": "Budget Exceeded",
        "message": "Your trip budget has been exceeded",
        "condition": {
          "metric": "budget",
          "operator": "gte",
          "threshold": 100,
          "currentValue": 105
        },
        "isActive": true,
        "isResolved": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

#### POST /alerts/:alertId/resolve
**Resolve alert**

**URL Parameters:**
- `alertId`: Alert ID

**Response (200):**
```json
{
  "success": true,
  "message": "Alert resolved",
  "data": {
    "alert": {
      "alertId": "alert_123",
      "isResolved": true,
      "resolvedAt": "2024-01-15T11:00:00Z",
      "acknowledgments": [
        {
          "userId": "user_id",
          "acknowledgedAt": "2024-01-15T11:00:00Z"
        }
      ]
    }
  }
}
```

---

#### POST /alerts/:alertId/acknowledge
**Acknowledge alert**

**URL Parameters:**
- `alertId`: Alert ID

**Response (200):**
```json
{
  "success": true,
  "message": "Alert acknowledged",
  "data": {
    "alert": {
      "alertId": "alert_123",
      "acknowledgments": [
        {
          "userId": "user_id",
          "acknowledgedAt": "2024-01-15T11:00:00Z"
        }
      ]
    }
  }
}
```

---

## Notification Types

### 30+ Supported Notification Types

```
Trip Events:
- trip_created
- trip_updated
- trip_completed
- trip_cancelled
- participant_joined
- participant_left

Budget & Expenses:
- budget_alert (warning)
- budget_exceeded
- expense_added
- expense_updated
- expense_modified
- settlement_due

Payments & Transactions:
- payment_pending
- payment_confirmed
- payment_failed
- refund_processed
- transaction_completed

Orders & Deliveries:
- order_created
- order_confirmed
- order_processing
- order_shipped
- order_delivered
- order_cancelled

Alerts & Safety:
- weather_alert
- dangerous_area_warning
- safety_alert
- document_expiry_warning

Promotions & System:
- promo_code_available
- deal_available
- price_drop
- system_notification
- account_update
```

---

## Alert Types

### 16 Trigger-Based Alert Types

```
Budget-Related:
- budget_exceeded - User exceeded trip budget
- budget_warning - User at 80-90% of budget

Payment-Related:
- payment_due - Payment settlement due soon
- payment_reminding - Payment reminder

Activity-Related:
- activity_starting_soon - Activity/flight/event starting
- activity_cancelled - Activity cancelled

Weather & Safety:
- weather_change - Significant weather change
- dangerous_area - User entered dangerous area
- document_expiry_warning - Travel document expiring

Booking & Confirmation:
- flight_delay - Flight delay detected
- hotel_confirmation - Hotel confirmation received
- price_drop - Price dropped for booked item

System:
- destination_alert - Alert for destination
- booking_confirmation - Booking confirmed
```

---

## Error Handling

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "param": "deviceId",
      "msg": "deviceId is required"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to process request",
  "error": "Technical error details"
}
```

---

## Integration Examples

### Example 1: Trigger Budget Alert
```javascript
// When expense added check budget
const percentageUsed = (currentSpend / budget) * 100;

if (percentageUsed >= 90) {
  await NotificationService.createAlert(userId, tripId, {
    alertType: 'budget_warning',
    severity: 'medium',
    title: 'Budget Warning',
    message: `You've spent ${percentageUsed.toFixed(1)}% of your budget`,
    condition: {
      metric: 'budget',
      operator: 'gte',
      threshold: 90,
      currentValue: percentageUsed
    },
    actions: [
      { action: 'view_trip', label: 'View Trip' },
      { action: 'reduce_budget', label: 'Increase Budget' }
    ]
  });
}
```

### Example 2: Multi-Channel Notification
```javascript
// Create notification that respects user preferences
await NotificationService.createNotification(userId, {
  type: 'order_delivered',
  title: 'Order Delivered',
  body: 'Your order has been delivered',
  priority: 'high',
  deepLink: '/orders/order_id',
  action: 'open_order'
  // Service automatically checks preferences and sends via enabled channels
});
```

### Example 3: Device Registration (Mobile App)
```javascript
// After getting FCM token from Firebase
const response = await fetch('http://localhost:5000/api/notifications/devices/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deviceId: 'device_uuid',
    fcmToken: 'fcm_token_from_firebase',
    deviceType: 'android',
    osVersion: '11.0',
    appVersion: '1.0.0'
  })
});
```

---

## Best Practices

1. **Register Devices on App Startup**
   - Register device immediately after user login
   - Refresh FCM token every 30 days
   - Handle token refresh from Firebase

2. **Respect User Preferences**
   - Always check quiet hours before sending
   - Respect per-type preferences
   - Allow users to easily opt-out

3. **Handle Failed Tokens**
   - System automatically removes invalid tokens
   - Retry logic for transient failures
   - Log failures for debugging

4. **Use Deep Links**
   - Always provide actionable deep links
   - Ensure links open relevant app screens
   - Test links before sending notifications

5. **Monitor Alert Triggers**
   - Don't flood users with duplicate alerts
   - Implement reasonable cooldown periods
   - Track alert acknowledgments

6. **Batch Notifications**
   - Use frequency settings for batching
   - Send important notifications immediately
   - Batch low-priority notifications

---

## Performance Considerations

- Notifications are processed asynchronously
- FCM integration uses connection pooling
- Database queries use indexes for fast retrieval
- Invalid tokens are automatically cleaned up
- Notifications expire after 30 days by default

---

## Debugging Tips

1. **Check Device Registration**
   - GET /notifications/devices to verify devices
   - Ensure FCM token is valid and active

2. **Verify Preferences**
   - GET /notifications/preferences
   - Check quiet hours timezone

3. **Monitor Alert Triggers**
   - GET /alerts to see active alerts
   - Review condition values

4. **Test Notifications**
   - POST /notifications/test to send test notification
   - Check notification delivery across channels

---

**Last Updated:** January 2024
**API Version:** 1.0.0
**Status:** Production Ready ✅
