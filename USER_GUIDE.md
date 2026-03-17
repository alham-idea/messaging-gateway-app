# User Guide - Messaging Gateway App

## Introduction
The Messaging Gateway App turns your Android device into a powerful SMS and WhatsApp gateway. It connects to your own system via Socket.io to receive and execute message sending commands.

---

## Quick Start

### 1. Installation
1.  Install the app on your Android device.
2.  Open the app.
3.  Log in using your Idea account credentials.

### 2. Connect to Your Server
1.  Go to **Settings** -> **Connection Manager**.
2.  Enter your **Socket.io Server URL** (e.g., `https://myserver.com`).
3.  Tap **Connect**.
4.  Wait for the status to turn **Green (Connected)**.

### 3. Setup WhatsApp
1.  Go to the **WhatsApp** tab.
2.  The app will load WhatsApp Web.
3.  Scan the QR code using your personal phone (Linked Devices).
4.  Keep the app open or in the background to maintain the connection.

---

## Features & Screens

### Home Screen
-   **Connection Status**: Shows if you are connected to your Socket.io server.
-   **Device Health**: Battery level and Network status.
-   **Pending Messages**: Number of messages waiting to be sent.

### Connection Manager
-   **Socket URL**: The address of your custom server.
-   **Status**: Real-time connection state.
-   **Uptime**: How long the connection has been active.

### Settings
-   **App Settings**: Configure general preferences.
-   **Logs**: View the history of sent and failed messages.

---

## Troubleshooting

### App Disconnects in Background
-   Ensure "Background Service" is enabled in Settings.
-   Disable battery optimization for this app in Android settings.
-   Keep the phone plugged in if possible.

### WhatsApp Not Sending
-   Ensure the screen is on (or WakeLock is active).
-   Check if the phone has an active internet connection.
-   Verify that the WhatsApp Web session hasn't expired.
