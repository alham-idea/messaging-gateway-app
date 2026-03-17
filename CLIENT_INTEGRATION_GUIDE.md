# Client Integration Guide

## Introduction
This guide explains how external systems can connect to the Messaging Gateway to send WhatsApp and SMS messages.

## Connection Methods

### 1. Socket.io (Recommended)
**Status**: 🚧 Under Construction

The primary method for real-time messaging is via Socket.io.

#### Connection URL
`ws://your-gateway-domain.com`

#### Authentication
(TBD - Likely API Key or JWT in handshake auth)

#### Events

**Sending a Message:**
Emit `send_message` with the following payload:
```json
{
  "type": "whatsapp", // or "sms"
  "phoneNumber": "+96650xxxxxxx",
  "message": "Your OTP is 1234"
}
```

**Receiving Status Updates:**
Listen for `message_status`:
```json
{
  "messageId": "msg_123",
  "status": "sent" // or "failed", "delivered"
}
```

### 2. REST API
**Status**: ❌ Not Implemented

Future plans include a RESTful API for non-real-time use cases.
