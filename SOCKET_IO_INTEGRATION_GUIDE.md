# Client Server Implementation Guide (Socket.io)

**Version:** 2.0  
**Updated:** March 2026  
**Architecture:** Decentralized (BYOD)

---

## 📋 Overview

In the Messaging Gateway architecture, **YOU (The Client)** host the Socket.io server. The Android Gateway App connects to **your server** to receive message sending commands. This ensures that your message data flows directly from your system to your device, without passing through Idea's backend.

### How it works:
1.  You spin up a Socket.io server (Node.js, Python, etc.).
2.  You enter your server's URL into the Android App (Connection Manager).
3.  The App connects to your server.
4.  Your system emits `send_message` events to the App.
5.  The App processes the request and sends `message_response` back to your server.

---

## 🚀 Setting up the Server (Node.js Example)

### 1. Install Dependencies
```bash
npm install socket.io
```

### 2. Create Server Code (`server.js`)

```javascript
const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*", // Allow connections from the App
  }
});

// Middleware for Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const MY_SECRET_TOKEN = "your_secure_random_string"; // Change this!

  if (token === MY_SECRET_TOKEN) {
    next();
  } else {
    next(new Error("Authentication error: Invalid Token"));
  }
});

console.log("🚀 Client Socket Server running on port 3000");

io.on("connection", (socket) => {
  console.log(`📱 Gateway Connected: ${socket.id}`);

  // 1. Listen for Device Status Reports
  socket.on("device_status", (status) => {
    console.log("🔋 Device Status:", status);
    // Save to your database...
  });

  // 2. Listen for Message Delivery Reports
  socket.on("message_response", (response) => {
    console.log("📨 Message Report:", response);
    // Update your order status...
  });

  socket.on("disconnect", () => {
    console.log("⚠️ Gateway Disconnected");
  });
});

// Example: Function to send a message via the connected Gateway
function sendMessage(type, phoneNumber, text) {
  if (type !== 'whatsapp' && type !== 'sms') {
    throw new Error('type must be whatsapp or sms');
  }

  const messagePayload = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    phoneNumber,
    message: text,
    timestamp: Date.now()
  };

  // Emit to the selected gateway, not blindly to every device in production.
  io.emit("send_message", messagePayload);
  console.log(`📤 ${type} command sent to Gateway`);
}

// For SMS, use a unique id and wait for message_response.status === 'sent'.
// The Android background path requires DirectSms in the custom client.
setTimeout(() => {
  sendMessage("sms", "+966500000000", "Hello from my custom server!");
}, 10000);
```

---

## 📡 API Reference (Events)

### 1. Server -> App (Commands)

#### `send_message`
Emit this event to trigger a message send on the device.

**Payload:**
```json
{
  "id": "unique_id_123",
  "type": "whatsapp", 
  "phoneNumber": "+96650xxxxxxx",
  "message": "Your OTP is 1234",
  "timestamp": 1715421234567
}
```
*   `type`: Required and must be exactly `"whatsapp"` or `"sms"`; an omitted type is rejected and is never defaulted to WhatsApp.
*   For `"sms"`, the Android custom client must expose `DirectSms.sendSms`. The user-facing SMS composer is separate and is not background delivery confirmation.
*   A `sent` response means the native SMS send call succeeded. Missing native support, invalid input, quota rejection, and device/provider errors produce `failed`.

### 2. App -> Server (Reports)

#### `device_status`
Sent periodically by the App to report health.

**Payload:**
```json
{
  "timestamp": 1715421234567,
  "platform": "android",
  "batteryLevel": 0.85,
  "batteryState": "charging",
  "isCharging": true,
  "networkType": "wifi",
  "isOnline": true
}
```

#### `message_response`
Sent after the App attempts to process a message.

**Payload:**
```json
{
  "messageId": "unique_id_123",
  "status": "sent", 
  "error": null,
  "timestamp": 1715421239999
}
```
*   `status`: `"sent"`, `"failed"`, or `"pending"`.
*   `error`: Description of failure (if any).

---

## 🔒 Security Best Practices

1.  **Authentication**: Implement a handshake authentication mechanism (e.g., require the App to send a secret token in the query params) to prevent unauthorized devices from connecting to your server.
2.  **SSL/TLS**: Always use `wss://` (HTTPS) in production to encrypt the communication.


## Production Admin Dashboard CORS

The standalone Admin Dashboard is served from `https://msgatewayadm-4pkhhml8.manus.space`. The central backend must include this exact origin in `CORS_ALLOWED_ORIGINS` (without a trailing slash), then be restarted and redeployed before browser login or browser-based Socket.io status updates can work.

Example:

```env
CORS_ALLOWED_ORIGINS=https://msgatewayadm-4pkhhml8.manus.space
```

Native Android Socket.io clients are not subject to browser CORS, but the admin dashboard is. Keep authentication and database access on the central backend; do not place credentials in the dashboard bundle.


## WhatsApp channel isolation

WhatsApp commands are accepted only with `type: "whatsapp"` and are routed through `messageHandlerService` to the active `whatsAppService` WebView adapter. The UI hook must not subscribe a second `send_message` listener or call a WhatsApp adapter directly; `socketService` owns the single inbound command listener and exposes `off()` for lifecycle cleanup. Messages remain `pending` while the WebView is not ready and are not reported as sent until the WebView acknowledgement is received.

SMS commands continue through the independent `smsService` path. They must not be forwarded to WhatsApp, and WhatsApp readiness, queue length, events, and retry operations must not be reused as SMS state. WebView monitoring events must use `window.ReactNativeWebView.postMessage(JSON.stringify(...))` so the native `onMessage` handler receives them.


## Central backend Socket.io activation

The central backend now attaches Socket.io to the same HTTP server as the API. The endpoint uses `/socket.io`, supports WebSocket with polling fallback, and authenticates dashboard connections with the admin JWT in `handshake.auth.token`. Unauthenticated or inactive-admin connections are rejected during the handshake.

The standalone dashboard should use:

```env
VITE_SOCKET_URL=https://msg-gateway-7lqw9uuq.manus.space
VITE_SOCKET_PATH=/socket.io
```

After connection, the dashboard emits `admin:subscribe` and receives `connection_status`. Admin realtime events are emitted to the `admins` room using `notification`, `admin:notification`, `update`, or `admin:update`. SMS and WhatsApp events must remain channel-specific and must never be broadcast to the other channel.
