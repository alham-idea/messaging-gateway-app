# Internal Architecture - Messaging Gateway

**Version:** 1.0  
**Last Updated:** March 2026  
**Owner:** Idea Solutions (آيديا للاستشارات والحلول التسويقية والتقنية)

---

## 📋 Overview

This document describes the internal architecture of the Messaging Gateway application. It covers the technology stack, project structure, data models, and system components.

---

## 🏗️ Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native 0.81.5
- **Build Tool:** Expo SDK 54
- **State Management:** React Context + useReducer
- **Styling:** NativeWind 4 (Tailwind CSS)
- **HTTP Client:** TRPC + TanStack Query
- **Real-time Communication:** Socket.io Client
- **Language:** TypeScript 5.9

### Backend (Server)
- **Runtime:** Node.js (Express.js)
- **Language:** TypeScript
- **API Framework:** TRPC (Type-safe RPC)
- **Database:** MySQL 8.0
- **ORM:** Drizzle ORM
- **Real-time Communication:** Socket.io Server
- **Authentication:** JWT + OAuth
- **Payment Processing:** Stripe API
- **Email Service:** Nodemailer

### Admin Dashboard
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios + React Query
- **Charts:** Recharts
- **Icons:** Lucide React

### Deployment
- **Mobile:** Expo EAS Build (iOS/Android)
- **Backend:** Node.js Server (Docker-ready)
- **Database:** MySQL (Cloud or On-premise)

---

## 📁 Project Structure

```
messaging-gateway-app/
├── app/                          # React Native Mobile App
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx             # Home screen
│   │   ├── messages.tsx          # Messages screen
│   │   ├── billing.tsx           # Billing screen
│   │   └── settings.tsx          # Settings screen
│   ├── login.tsx                 # Login screen
│   ├── signup.tsx                # Signup screen
│   ├── notifications/
│   │   └── index.tsx             # Notifications screen
│   └── _layout.tsx               # Root layout with providers
│
├── components/                   # Reusable React Native Components
│   ├── screen-container.tsx      # SafeArea wrapper
│   ├── themed-view.tsx           # Theme-aware view
│   └── ui/
│       └── icon-symbol.tsx       # Icon mapping
│
├── lib/                          # Utilities and Services
│   ├── services/
│   │   ├── socket-service.ts     # Socket.io client service
│   │   ├── api.ts                # API client setup
│   │   └── auth-service.ts       # Authentication service
│   ├── utils.ts                  # Utility functions
│   ├── theme-provider.tsx        # Theme context
│   └── trpc.ts                   # TRPC client setup
│
├── hooks/                        # Custom React Hooks
│   ├── use-colors.ts             # Theme colors hook
│   ├── use-auth.ts               # Authentication hook
│   └── use-color-scheme.ts       # Dark/light mode hook
│
├── constants/                    # Constants
│   └── theme.ts                  # Theme configuration
│
├── server/                       # Backend Server
│   ├── _core/
│   │   ├── index.ts              # Server entry point
│   │   └── middleware.ts         # Express middleware
│   ├── routers/
│   │   ├── auth.ts               # Authentication endpoints
│   │   ├── subscriptions.ts      # Subscription management
│   │   ├── payments.ts           # Payment processing
│   │   ├── notifications.ts      # Notification system
│   │   ├── admin.ts              # Admin endpoints
│   │   └── messages.ts           # Message handling
│   ├── services/
│   │   ├── emailService.ts       # Email sending
│   │   ├── stripeService.ts      # Stripe integration
│   │   ├── monitoringService.ts  # Performance monitoring
│   │   ├── backupService.ts      # Backup & restore
│   │   └── queueService.ts       # Message queue
│   ├── db.ts                     # Database functions
│   └── routers.ts                # TRPC router aggregation
│
├── drizzle/                      # Database Schema
│   ├── schema.ts                 # Table definitions
│   └── migrations/               # Database migrations
│
├── admin/                        # Admin Dashboard (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # Main dashboard
│   │   │   ├── Users.tsx         # User management
│   │   │   ├── Subscriptions.tsx # Subscription management
│   │   │   ├── Billing.tsx       # Billing management
│   │   │   ├── Reports.tsx       # Reports & analytics
│   │   │   └── Security.tsx      # Security settings
│   │   ├── components/
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── services/
│   │   │   ├── adminApi.ts       # Admin API client
│   │   │   └── notificationService.ts
│   │   └── hooks/
│   │       └── useNotifications.ts
│   └── public/
│
├── assets/                       # Static Assets
│   ├── images/
│   │   ├── icon.png              # App icon
│   │   ├── splash-icon.png       # Splash screen
│   │   └── favicon.png           # Web favicon
│   └── fonts/
│
├── .env.example                  # Environment variables template
├── .env.production               # Production environment
├── app.config.ts                 # Expo configuration
├── metro.config.js               # Metro bundler config
├── tailwind.config.js            # Tailwind CSS config
├── theme.config.js               # Theme tokens
├── babel.config.js               # Babel configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
│
└── docs/                         # Documentation
    ├── SOCKET_IO_INTEGRATION_GUIDE.md
    ├── CLIENT_FEATURES_GUIDE.md
    ├── INTERNAL_ARCHITECTURE.md
    └── INTERNAL_API_DOCS.md
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  company_name VARCHAR(255),
  subscription_id VARCHAR(36),
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'basic', 'professional', 'enterprise'
  monthly_messages INT NOT NULL,
  messages_used INT DEFAULT 0,
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  started_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'sms', 'whatsapp'
  phone_number VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  stripe_payment_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_method VARCHAR(50),
  invoice_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'subscription_expiring', 'payment_failed', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id_is_read (user_id, is_read)
);
```

---

## 🔌 Socket.io Events

### Client → Server Events

**send_message**
```typescript
{
  id: string;           // Unique message ID
  type: 'sms' | 'whatsapp';
  phoneNumber: string;  // International format: +966...
  message: string;      // Message content
  timestamp: number;    // Milliseconds since epoch
}
```

### Server → Client Events

**message_response**
```typescript
{
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;       // Error message if failed
  timestamp: number;
}
```

**device_status**
```typescript
{
  timestamp: number;
  platform: 'ios' | 'android';
  batteryLevel: number; // 0-100
  batteryState: 'charging' | 'discharging' | 'full';
  isCharging: boolean;
  networkType: 'wifi' | 'cellular' | 'none';
  isOnline: boolean;
}
```

---

## 🔐 Authentication Flow

```
User Registration/Login
    ↓
OAuth (Google/Apple)
    ↓
JWT Token Generated
    ↓
Token Stored Securely (AsyncStorage)
    ↓
API Requests Include Token
    ↓
Token Refresh on Expiry
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  UI Layer (Screens & Components)                     │  │
│  │  - Home, Messages, Billing, Settings, Notifications  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic (Hooks & Services)                   │  │
│  │  - useAuth, useColors, Socket Service               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (TRPC Client + Socket.io)               │  │
│  │  - API Calls, Real-time Events                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓↑
                    (HTTPS + WSS)
                          ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (TRPC Routers)                            │  │
│  │  - Auth, Subscriptions, Payments, Messages, Admin    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic (Services)                           │  │
│  │  - Email, Stripe, Monitoring, Backup, Queue         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (Drizzle ORM)                            │  │
│  │  - Database Operations                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    (MySQL Connection)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                           │
│  - Users, Subscriptions, Messages, Payments, Notifications │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Message Sending Flow

```
1. Client App (send_message event via Socket.io)
   ↓
2. Server receives message
   ├─ Validate API Key
   ├─ Validate message format
   ├─ Check subscription quota
   ↓
3. Store message in database (status: pending)
   ↓
4. Process message
   ├─ If SMS: Send via SMS gateway
   ├─ If WhatsApp: Send via WhatsApp Web
   ↓
5. Update message status
   ├─ If sent successfully: status = 'sent'
   ├─ If failed: status = 'failed' + error message
   ↓
6. Send response to client (message_response event)
   ↓
7. Client updates UI and local database
```

---

## 🔒 Security Measures

### API Key Management
- Unique API Key per user
- Stored as hashed values in database
- Validated on every Socket.io connection
- Can be regenerated from admin dashboard

### Data Encryption
- TLS 1.3 for all HTTPS connections
- WSS (WebSocket Secure) for Socket.io
- JWT tokens for authentication
- Passwords hashed with bcrypt

### Rate Limiting
- 100 requests per minute per IP
- 1000 messages per minute per API Key
- Exponential backoff for failed requests

### Input Validation
- Phone number format validation (international)
- Message length validation (max 1000 characters)
- API Key format validation
- SQL injection prevention (Drizzle ORM)

---

## 📈 Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization with Expo Image
- Local state management (Context API)
- Memoization with useMemo and useCallback

### Backend
- Database indexing on frequently queried fields
- Connection pooling for database
- Caching with Redis (optional)
- Async/await for non-blocking operations

### Network
- WebSocket for real-time communication
- Message batching for bulk operations
- Compression for API responses
- CDN for static assets

---

## 🚀 Deployment Architecture

### Development
```
Local Machine
├─ Metro Bundler (Port 8081)
├─ Node.js Server (Port 3000)
└─ MySQL (Local or Docker)
```

### Production
```
Cloud Infrastructure (AWS/GCP/Azure)
├─ Mobile App (iOS/Android via App Stores)
├─ Backend Server (Docker Container)
│  ├─ Express.js + TRPC
│  ├─ Socket.io Server
│  └─ Middleware (Auth, Rate Limit, CORS)
├─ MySQL Database (RDS or Cloud SQL)
├─ Redis Cache (Optional)
└─ CDN (CloudFront/CloudFlare)
```

---

## 📝 Configuration Files

### app.config.ts
Expo configuration for iOS/Android builds, including:
- App name and slug
- Bundle ID (iOS) and Package name (Android)
- Permissions (notifications, camera, contacts)
- Plugins (audio, video, splash screen)

### eas.json
EAS Build configuration for:
- Android build settings
- iOS build settings
- Build cache and optimization
- Credentials management

### .env.production
Production environment variables:
- API endpoint
- Socket.io server URL
- Stripe API keys
- Database connection string

---

## 🔄 Continuous Integration/Deployment

### Build Process
1. Code pushed to GitHub
2. GitHub Actions trigger
3. Run tests and linting
4. Build APK/IPA via EAS
5. Deploy to app stores

### Monitoring
- Sentry for error tracking
- DataDog for performance monitoring
- CloudWatch for server logs
- Custom dashboard for message metrics

---

## 📚 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react-native | 0.81.5 | Mobile framework |
| expo | ~54.0.29 | Development platform |
| expo-router | ~6.0.19 | Navigation |
| nativewind | ^4.2.1 | Styling |
| @trpc/client | 11.7.2 | Type-safe API |
| socket.io-client | Latest | Real-time communication |
| stripe | Latest | Payment processing |
| drizzle-orm | ^0.44.7 | Database ORM |
| express | ^4.22.1 | Backend framework |
| mysql2 | ^3.16.0 | MySQL driver |

---

## 🔧 Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start Metro bundler
pnpm dev:metro

# Start backend server (in another terminal)
pnpm dev:server

# Run on device/emulator
pnpm ios    # iOS
pnpm android # Android
```

### Testing
```bash
# Run unit tests
pnpm test

# Run type checking
pnpm check

# Run linting
pnpm lint

# Format code
pnpm format
```

### Building
```bash
# Build for production
eas build --platform ios
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

---

## 📞 Support

For technical questions or issues:
- **Documentation:** See SOCKET_IO_INTEGRATION_GUIDE.md
- **API Reference:** See INTERNAL_API_DOCS.md
- **Email:** dev@idea-solutions.com

---

**Note:** This document is updated with every major release. Check the version number for the latest information.
