# API Specification (tRPC)

## Overview
This document details the tRPC API endpoints used for managing the Messaging Gateway. These endpoints are primarily consumed by the Android App and the Admin Dashboard.

> **Note**: This API is for **management** purposes (Auth, Subscriptions, Billing). The actual message sending happens via the separate Socket.io connection to the client's server.

## 1. Authentication (`authRouter`)
**Purpose**: User registration, login, and profile management.

| Procedure | Type | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register` | Mutation | `{ name, email, loginMethod?, planId }` | `{ success, user, token }` | Registers a new user and assigns a default subscription. |
| `login` | Mutation | `{ email, name?, openId?, loginMethod }` | `{ success, user, token }` | Logs in a user (OAuth based). Creates user if not exists. |
| `me` | Query | - | `User Profile Object` | Returns current user details and subscription status. |
| `updateProfile` | Mutation | `{ name?, email? }` | `User Object` | Updates user profile information. |

## 2. Subscriptions (`subscriptionsRouter`)
**Purpose**: Managing plans and user subscriptions.

| Procedure | Type | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `getPlans` | Query | - | `Array<Plan>` | Lists all available subscription plans. |
| `getPlan` | Query | `{ id }` | `Plan` | Gets details of a specific plan. |
| `getCurrentSubscription` | Query | - | `Subscription Object` | Gets the active subscription for the current user. |
| `changeSubscription` | Mutation | `{ newPlanId, billingCycle? }` | `{ success, message }` | Upgrades or downgrades the user's plan. |
| `cancel` | Mutation | - | `{ success, message }` | Cancels the current subscription. |
| `getUsageStats` | Query | - | `{ usage: { whatsappUsed, smsUsed, ... } }` | Returns current usage vs plan limits. |

## 3. Notifications (`notificationsRouter`)
**Purpose**: System alerts and user notifications.

| Procedure | Type | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `getNotifications` | Query | `{ limit, offset, unreadOnly }` | `Array<Notification>` | Fetches user notifications. |
| `getUnreadCount` | Query | - | `number` | Returns count of unread notifications. |
| `markAsRead` | Mutation | `{ notificationId }` | `boolean` | Marks a specific notification as read. |
| `markAllAsRead` | Mutation | - | `boolean` | Marks all notifications as read. |

## 4. Payments (`paymentsRouter`)
**Purpose**: Handling billing and transaction history.

| Procedure | Type | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `createPayment` | Mutation | `{ amount, paymentMethod }` | `{ success, paymentId }` | Creates a new payment intent. |
| `getPaymentHistory` | Query | `{ limit, offset }` | `{ payments, total }` | Lists past transactions. |

---

# Socket.io Interface (Client Integration)

## Overview
This section defines the contract between the **Android Gateway App** and the **Client's Socket.io Server**. The client is responsible for hosting this server.

## Connection
-   **URL**: User-defined (entered in the App).
-   **Transport**: WebSocket / Polling.

## Events

### 1. Server -> App (Commands)

#### `send_message`
Triggered by the client server when it wants to send a message via the gateway.

**Payload:**
```typescript
interface MessagePayload {
  id: string;              // Unique message ID
  type: 'whatsapp' | 'sms'; // Message channel
  phoneNumber: string;     // Recipient number (e.g. +96650xxxxxxx)
  message: string;         // Message content
  timestamp: number;       // Unix timestamp
}
```

### 2. App -> Server (Reports)

#### `connect`
Standard Socket.io event. Indicates the gateway is online.

#### `device_status`
Periodic health report sent by the App.

**Payload:**
```typescript
interface DeviceStatus {
  timestamp: number;
  platform: 'android' | 'ios';
  batteryLevel: number;    // 0.0 to 1.0
  batteryState: string;    // 'charging', 'unplugged'
  isCharging: boolean;
  networkType: string;     // 'wifi', 'cellular'
  isOnline: boolean;
}
```

#### `message_response`
Sent after a message processing attempt (success or failure).

**Payload:**
```typescript
interface MessageResponse {
  messageId: string;       // ID from the original request
  status: 'sent' | 'failed' | 'pending';
  error?: string;          // Error message if failed
  timestamp: number;
}
```
