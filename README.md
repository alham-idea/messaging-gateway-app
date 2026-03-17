# Messaging Gateway App

## Overview
The Messaging Gateway App is an Android application designed to act as a bridge between external client systems and messaging networks (WhatsApp & SMS). It operates on a **"Bring Your Own Device" (BYOD)** model, where the application is installed on a physical Android device, turning it into a gateway.

## Key Features
-   **WhatsApp Gateway**: Uses an embedded WebView to run WhatsApp Web and automate message sending via DOM manipulation.
-   **SMS Gateway**: Uses the device's native SMS capability.
-   **Dual Connectivity**:
    -   Connects to **Idea's Backend** for subscription management and authentication.
    -   Connects to **Client's Own Server** via Socket.io to receive message sending commands.

## Technology Stack

### Android Application (Gateway)
-   **Runtime**: React Native (Expo SDK 54).
-   **Language**: TypeScript.
-   **Routing**: Expo Router.
-   **UI Framework**: React Native Elements + NativeWind (Tailwind CSS).
-   **Real-time Communication**: `socket.io-client` (for connecting to client servers).
-   **WhatsApp Automation**: `react-native-webview` with JavaScript Injection.
-   **Local Storage**: `AsyncStorage` & `expo-secure-store`.
-   **API Client**: tRPC (for communication with Idea's backend).

### Idea's Backend Server
-   **Runtime**: Node.js.
-   **Framework**: Express.js.
-   **API**: tRPC.
-   **Database**: MySQL (accessed via Drizzle ORM).
-   **Authentication**: JWT.

### Admin Dashboard
-   **Framework**: React (Vite).
-   **State Management**: Zustand.
-   **Styling**: Tailwind CSS.

## Setup & Installation
1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
3.  **Run Android App**:
    ```bash
    pnpm android
    ```

## Usage Concept
1.  User installs the app and logs in (Authentication with Idea's Backend).
2.  User enters their **Socket.io Server URL** in the "Connection Manager" screen.
3.  The app connects to the client's server and listens for `send_message` events.
4.  User logs into WhatsApp Web inside the app's WebView.
5.  When a command is received, the app executes the sending logic via WebView (WhatsApp) or Native API (SMS).
