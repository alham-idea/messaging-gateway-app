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
function sendWhatsApp(phoneNumber, text) {
  const messagePayload = {
    id: `msg_${Date.now()}`,
    type: 'whatsapp',
    phoneNumber: phoneNumber, // e.g., "+96650xxxxxxx"
    message: text,
    timestamp: Date.now()
  };

  // Emit to all connected gateways (or filter by specific socket ID)
  io.emit("send_message", messagePayload);
  console.log("📤 Command sent to Gateway");
}

// Test sending a message after 10 seconds
setTimeout(() => {
  sendWhatsApp("+966500000000", "Hello from my custom server!");
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
*   `type`: Can be `"whatsapp"` or `"sms"`.

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
