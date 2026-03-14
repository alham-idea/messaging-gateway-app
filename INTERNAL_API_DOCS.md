# Internal API Documentation

**Version:** 1.0  
**Last Updated:** March 2026  
**Owner:** Idea Solutions (آيديا للاستشارات والحلول التسويقية والتقنية)

---

## 📋 Overview

This document describes the internal API endpoints between the mobile app, admin dashboard, and backend server. All APIs use TRPC (Type-safe RPC) protocol over HTTPS.

---

## 🔐 Authentication

All API requests require a valid JWT token obtained from the login endpoint.

### Token Format
```
Authorization: Bearer <JWT_TOKEN>
```

### Token Structure
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "iat": 1678900000,
  "exp": 1678986400
}
```

### Token Refresh
Tokens expire after 24 hours. Use the refresh endpoint to get a new token.

---

## 📚 API Endpoints

### Authentication Router (`/trpc/auth`)

#### Register
**Endpoint:** `auth.register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "Company Name",
  "phone": "+966501234567",
  "companyName": "Acme Corp"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "Company Name",
    "phone": "+966501234567",
    "companyName": "Acme Corp"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (Error):**
```json
{
  "error": "Email already registered"
}
```

---

#### Login
**Endpoint:** `auth.login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "Company Name"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### Logout
**Endpoint:** `auth.logout`

**Request:** (No body, requires valid token)

**Response:**
```json
{
  "success": true
}
```

---

#### Refresh Token
**Endpoint:** `auth.refreshToken`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Subscriptions Router (`/trpc/subscriptions`)

#### Get Available Plans
**Endpoint:** `subscriptions.getPlans`

**Request:** (No parameters)

**Response:**
```json
{
  "plans": [
    {
      "id": "plan-basic",
      "name": "Basic",
      "monthlyMessages": 1000,
      "priceMonthly": 99,
      "currency": "SAR",
      "features": ["SMS", "WhatsApp", "Basic Reports"]
    },
    {
      "id": "plan-professional",
      "name": "Professional",
      "monthlyMessages": 10000,
      "priceMonthly": 299,
      "currency": "SAR",
      "features": ["SMS", "WhatsApp", "Advanced Reports", "Phone Support"]
    },
    {
      "id": "plan-enterprise",
      "name": "Enterprise",
      "monthlyMessages": -1,
      "priceMonthly": 0,
      "currency": "SAR",
      "features": ["SMS", "WhatsApp", "Unlimited", "Dedicated Support"],
      "customPrice": true
    }
  ]
}
```

---

#### Get Current Subscription
**Endpoint:** `subscriptions.getCurrentSubscription`

**Request:** (No parameters, requires valid token)

**Response:**
```json
{
  "subscription": {
    "id": "sub-123",
    "userId": "user-123",
    "plan": "professional",
    "monthlyMessages": 10000,
    "messagesUsed": 2345,
    "messagesRemaining": 7655,
    "stripeSubscriptionId": "sub_stripe_123",
    "status": "active",
    "startedAt": "2026-01-15T10:00:00Z",
    "endsAt": "2026-02-15T10:00:00Z",
    "renewalDate": "2026-02-15T10:00:00Z"
  }
}
```

---

#### Upgrade/Downgrade Subscription
**Endpoint:** `subscriptions.updateSubscription`

**Request:**
```json
{
  "planId": "plan-enterprise"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub-123",
    "plan": "enterprise",
    "monthlyMessages": -1,
    "status": "active"
  },
  "paymentRequired": true,
  "paymentUrl": "https://stripe.com/pay/..."
}
```

---

### Payments Router (`/trpc/payments`)

#### Create Payment Intent
**Endpoint:** `payments.createPaymentIntent`

**Request:**
```json
{
  "amount": 299,
  "currency": "SAR",
  "description": "Professional Plan - Monthly"
}
```

**Response:**
```json
{
  "clientSecret": "pi_1234567890_secret_abcdef",
  "publishableKey": "pk_live_1234567890",
  "amount": 29900,
  "currency": "sar"
}
```

---

#### Get Payment History
**Endpoint:** `payments.getPaymentHistory`

**Request:**
```json
{
  "limit": 10,
  "offset": 0
}
```

**Response:**
```json
{
  "payments": [
    {
      "id": "pay-123",
      "amount": 299,
      "currency": "SAR",
      "status": "completed",
      "paymentMethod": "card",
      "invoiceUrl": "https://stripe.com/invoice/...",
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

---

#### Get Invoice
**Endpoint:** `payments.getInvoice`

**Request:**
```json
{
  "invoiceId": "inv-123"
}
```

**Response:**
```json
{
  "invoice": {
    "id": "inv-123",
    "number": "INV-2026-001",
    "amount": 299,
    "currency": "SAR",
    "status": "paid",
    "issueDate": "2026-03-01T10:00:00Z",
    "dueDate": "2026-03-15T10:00:00Z",
    "pdfUrl": "https://stripe.com/invoice/pdf/..."
  }
}
```

---

### Messages Router (`/trpc/messages`)

#### Get Message History
**Endpoint:** `messages.getHistory`

**Request:**
```json
{
  "limit": 20,
  "offset": 0,
  "status": "all",
  "type": "all",
  "dateFrom": "2026-02-01",
  "dateTo": "2026-03-01"
}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "type": "whatsapp",
      "phoneNumber": "+966501234567",
      "message": "Order confirmed",
      "status": "sent",
      "sentAt": "2026-03-01T10:00:00Z",
      "deliveredAt": "2026-03-01T10:00:05Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

#### Get Failed Messages
**Endpoint:** `messages.getFailedMessages`

**Request:**
```json
{
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-456",
      "type": "sms",
      "phoneNumber": "+966501234567",
      "message": "Verification code: 123456",
      "status": "failed",
      "error": "Invalid phone number",
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

---

#### Get Message Statistics
**Endpoint:** `messages.getStatistics`

**Request:**
```json
{
  "period": "month",
  "dateFrom": "2026-02-01",
  "dateTo": "2026-03-01"
}
```

**Response:**
```json
{
  "statistics": {
    "totalMessages": 5000,
    "sentMessages": 4850,
    "failedMessages": 150,
    "successRate": 97,
    "smsSent": 2500,
    "whatsappSent": 2350,
    "averageDeliveryTime": 2.5,
    "topPhoneNumbers": ["+966501234567", "+966502345678"],
    "dailyBreakdown": [
      {
        "date": "2026-02-01",
        "sent": 100,
        "failed": 5
      }
    ]
  }
}
```

---

### Notifications Router (`/trpc/notifications`)

#### Get Notifications
**Endpoint:** `notifications.getNotifications`

**Request:**
```json
{
  "limit": 20,
  "offset": 0,
  "unreadOnly": false
}
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "type": "subscription_expiring",
      "title": "Subscription Expiring Soon",
      "message": "Your subscription will expire in 7 days",
      "isRead": false,
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 15,
  "unreadCount": 3
}
```

---

#### Mark as Read
**Endpoint:** `notifications.markAsRead`

**Request:**
```json
{
  "notificationId": "notif-123"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Admin Router (`/trpc/admin`)

#### Get All Users
**Endpoint:** `admin.getAllUsers`

**Request:**
```json
{
  "limit": 20,
  "offset": 0,
  "search": "",
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

**Response:**
```json
{
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "name": "Company Name",
      "phone": "+966501234567",
      "companyName": "Acme Corp",
      "subscription": {
        "plan": "professional",
        "status": "active"
      },
      "messagesThisMonth": 2345,
      "createdAt": "2026-01-15T10:00:00Z",
      "isActive": true
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

#### Get User Details
**Endpoint:** `admin.getUserDetails`

**Request:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "Company Name",
    "phone": "+966501234567",
    "companyName": "Acme Corp",
    "apiKey": "sk_live_abc123...",
    "subscription": {
      "id": "sub-123",
      "plan": "professional",
      "monthlyMessages": 10000,
      "messagesUsed": 2345,
      "status": "active",
      "renewalDate": "2026-04-15T10:00:00Z"
    },
    "payments": [
      {
        "id": "pay-123",
        "amount": 299,
        "status": "completed",
        "date": "2026-03-01T10:00:00Z"
      }
    ],
    "messageStatistics": {
      "totalSent": 10000,
      "totalFailed": 500,
      "successRate": 95
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "lastActive": "2026-03-13T10:00:00Z"
  }
}
```

---

#### Update User Status
**Endpoint:** `admin.updateUserStatus`

**Request:**
```json
{
  "userId": "user-123",
  "isActive": false,
  "reason": "Payment failed"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "isActive": false
  }
}
```

---

#### Get Dashboard Statistics
**Endpoint:** `admin.getDashboardStats`

**Request:** (No parameters)

**Response:**
```json
{
  "statistics": {
    "totalUsers": 150,
    "activeUsers": 120,
    "totalSubscriptions": 150,
    "totalRevenue": 45000,
    "totalMessages": 500000,
    "successRate": 96.5,
    "topPlan": "professional",
    "userGrowth": [
      {
        "date": "2026-02-01",
        "count": 100
      },
      {
        "date": "2026-03-01",
        "count": 150
      }
    ],
    "revenueGrowth": [
      {
        "date": "2026-02-01",
        "amount": 20000
      },
      {
        "date": "2026-03-01",
        "amount": 25000
      }
    ]
  }
}
```

---

## 🔄 Error Handling

All API errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "reason": "Must be a valid email address"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate email) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🔒 Security Considerations

### API Key Rotation
Admin users should rotate API keys regularly. Old keys are immediately invalidated.

### Rate Limiting
- **Per User:** 100 requests per minute
- **Per IP:** 1000 requests per minute
- **Per API Key:** 1000 messages per minute

### Data Validation
All inputs are validated server-side:
- Email format validation
- Phone number format validation (international)
- Message length validation (max 1000 characters)
- Subscription quota validation

### Audit Logging
All admin actions are logged:
- User creation/deletion
- Subscription changes
- Payment processing
- API key generation

---

## 📝 TRPC Client Usage

### Setup
```typescript
import { createTRPCClient } from '@trpc/client';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import type { AppRouter } from '@/server/routers';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://api.example.com/trpc',
      headers: {
        authorization: `Bearer ${token}`,
      },
    }),
  ],
});
```

### Making Requests
```typescript
// Query
const user = await trpc.auth.getCurrentUser.query();

// Mutation
const result = await trpc.messages.sendMessage.mutate({
  phoneNumber: '+966501234567',
  message: 'Hello',
  type: 'whatsapp',
});

// Subscription
trpc.notifications.getNotifications.subscribe(
  { limit: 10 },
  {
    onData: (data) => console.log('New notification:', data),
    onError: (error) => console.error('Error:', error),
  }
);
```

---

## 🧪 Testing

### Using cURL
```bash
# Login
curl -X POST https://api.example.com/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get current subscription
curl -X GET https://api.example.com/trpc/subscriptions.getCurrentSubscription \
  -H "Authorization: Bearer <TOKEN>"
```

### Using Postman
1. Import the TRPC API collection
2. Set the `Authorization` header with your JWT token
3. Send requests to the TRPC endpoints

---

## 📞 Support

For API-related questions:
- **Email:** api@idea-solutions.com
- **Documentation:** See INTERNAL_ARCHITECTURE.md
- **Status Page:** https://status.idea-solutions.com

---

**Note:** This document is updated with every API change. Check the version number for the latest information.
