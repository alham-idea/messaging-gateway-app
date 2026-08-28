# Client Features Guide

## Overview
Messaging Gateway is a comprehensive mobile application enabling businesses to send **SMS** and **WhatsApp** messages to their customers directly from their smartphones. It acts as a secure bridge between your business system and your customers.

---

## 🎯 Key Features

### 1. WhatsApp Messaging
Send messages via WhatsApp through your customer's phone using WhatsApp Web automation.
*   **Use Cases**: Order confirmations, Customer support, OTPs.

### 2. SMS Messaging
Send native SMS messages directly from the device's SIM card.
*   **Use Cases**: Critical alerts, Offline notifications.

### 3. Decentralized Architecture (BYOD)
You host the Socket.io server. Your data flows directly from your backend to your device. No third-party data interception.

### 4. Local Message Queue
The app maintains a local queue for pending messages, ensuring delivery even if the internet connection fluctuates.

### 5. Device Health Monitoring
Real-time monitoring of battery level, network status, and charging state to ensure gateway reliability.

### 6. Subscription Plans
Flexible plans managed via the Idea Backend (Basic, Professional, Enterprise) to suit different business needs.

---

## 🚀 Best Practices

1.  **Phone Number Format**: Always use international format (e.g., +966...).
2.  **Device Maintenance**: Keep the gateway device plugged into power and connected to Wi-Fi.
3.  **Screen Lock**: Disable screen lock or use a long timeout to prevent the OS from killing the background process (though the app uses WakeLocks).


## Standalone Admin Dashboard Connectivity

The standalone Admin Dashboard uses the central backend for authentication, operational metrics, subscriptions, invoices, and gateway status. For browser requests to succeed, configure `CORS_ALLOWED_ORIGINS` on the backend with the exact dashboard origin `https://msgatewayadm-4pkhhml8.manus.space`, without a trailing slash, then restart and redeploy the backend. The dashboard does not connect directly to the database and does not contain gateway credentials.


### 7. Real-time Admin Updates
The standalone Admin Dashboard can receive operational updates over the central backend's authenticated Socket.io channel. After an admin signs in, the dashboard subscribes to the admin room and receives connection status plus notification and gateway updates without a manual refresh. The realtime channel is authenticated with the current admin JWT; SMS and WhatsApp statuses remain logically separated, and a disconnected socket does not change the persisted message status.
