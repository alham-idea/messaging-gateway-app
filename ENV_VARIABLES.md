# Environment Variables Configuration

This document lists all the environment variables required to run the Messaging Gateway system (Backend & Admin).

## 1. Backend Server (`.env`)

These variables should be placed in the root `.env` file.

### Database (Required)
Connection string for the MySQL database.
```env
DATABASE_URL=mysql://user:password@localhost:3306/messaging_gateway
```

### Application Environment (Required)
Controls the running mode of the application.
```env
NODE_ENV=development # or 'production'
PORT=3000           # The port the backend server listens on
```

### Authentication (Required)
Secret key for signing JSON Web Tokens (JWT).
```env
JWT_SECRET=your-super-secret-key-min-32-chars
```

### Email Service (SMTP) (Required for Notifications)
Settings for sending transactional emails (Invoices, Receipts, Alerts).
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false # true for 465, false for other ports
EMAIL_FROM=noreply@messaginggateway.com
```

### Stripe Payments (Required for Billing)
Keys for processing subscription payments.
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Admin Initialization (Optional)
Credentials for the initial admin account created on startup if not exists.
```env
ADMIN_EMAIL=admin@messaginggateway.com
ADMIN_PASSWORD=change-me-in-production
```

---

## 2. Admin Dashboard (`admin/.env`)

These variables should be placed in `admin/.env`.

### API Connection (Required)
URL of the Backend API (tRPC).
```env
VITE_API_URL=http://localhost:3000/api/trpc
```

---

## Security Notes

1.  **NEVER commit `.env` files to version control.**
2.  Use strong, random strings for `JWT_SECRET` and passwords in production.
3.  Ensure `DATABASE_URL` uses a non-root user with limited privileges in production.
