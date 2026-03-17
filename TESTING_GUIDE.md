# Testing Guide

## Overview
This guide outlines the procedures for testing the Messaging Gateway App to ensure reliability and performance.

---

## 1. Connectivity Testing

### 1.1 Socket.io Connection
1.  Open the App.
2.  Go to **Connection Manager**.
3.  Enter your valid Socket.io server URL.
4.  Tap **Connect**.
5.  **Expected Result**: Status indicator turns **Green**.
6.  Turn off Wi-Fi/Data.
7.  **Expected Result**: Status turns **Red**.
8.  Turn on Wi-Fi/Data.
9.  **Expected Result**: Status automatically turns **Green** (Auto-reconnect).

### 1.2 Background Persistence
1.  Connect to the server.
2.  Minimize the app (Go to Home Screen).
3.  Lock the screen.
4.  Wait 5 minutes.
5.  Trigger a `send_message` event from your server.
6.  **Expected Result**: The message is received and processed by the app.

---

## 2. WhatsApp Automation Testing

### 2.1 Setup
1.  Go to the **WhatsApp** tab.
2.  Ensure WhatsApp Web is loaded and logged in.

### 2.2 Sending a Message
1.  Trigger a `send_message` event (Type: `whatsapp`) from your server.
2.  Watch the screen (if app is open).
3.  **Expected Result**:
    *   The app navigates to the chat (or creates a new one).
    *   The message is typed into the input field.
    *   The send button is clicked.
    *   Server receives `message_response` with status `sent`.

### 2.3 Failure Handling
1.  Trigger a message to an invalid number.
2.  **Expected Result**:
    *   The app detects the failure (e.g., "Phone number shared via url is invalid").
    *   Server receives `message_response` with status `failed`.

---

## 3. SMS Testing

### 3.1 Sending
1.  Trigger a `send_message` event (Type: `sms`) from your server.
2.  **Expected Result**:
    *   Native SMS permission dialog appears (first time only).
    *   SMS is sent via the default SIM.
    *   Server receives `message_response` with status `sent`.

---

## 4. Performance & Battery

### 4.1 Long-running Test
1.  Keep the app running for 1 hour in the background.
2.  Send a message every 5 minutes.
3.  **Expected Result**: All messages are delivered with low latency (< 5s processing time).

### 4.2 Battery Usage
1.  Check Android Battery settings after the test.
2.  **Expected Result**: App usage should be reasonable (typically < 5-10% for heavy usage). Ensure "Battery Optimization" is disabled for best results.
