# تكامل لوحة التحكم مع التطبيق

## معلومات الاتصال

### لوحة التحكم (Admin Dashboard)
- **URL المحلي:** http://localhost:3000/admin
- **URL الإنتاج:** https://msg-gateway-7lqw9uuq.manus.space/admin
- **المنفذ:** 3000
- **المسار:** /admin

### خادم الخلفية (Backend Server)
- **URL المحلي:** http://localhost:3000
- **URL الإنتاج:** https://msg-gateway-7lqw9uuq.manus.space
- **API Base:** /api
- **Socket.io:** wss://msg-gateway-7lqw9uuq.manus.space/socket.io

### التطبيق الموبايل (Mobile App)
- **Scheme:** manus20260208172338
- **Deep Link:** manus20260208172338://admin
- **Bundle ID (iOS):** space.manus.messaging.gateway.app.t20260208172338
- **Package (Android):** space.manus.messaging.gateway.app.t20260208172338

## الربط بين التطبيق ولوحة التحكم

### 1. فتح لوحة التحكم من التطبيق
```typescript
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

const openAdminDashboard = async () => {
  // فتح لوحة التحكم في المتصفح
  await WebBrowser.openBrowserAsync('https://msg-gateway-7lqw9uuq.manus.space/admin');
};
```

### 2. المصادقة (Authentication)
- استخدم نفس API Key للتطبيق ولوحة التحكم
- API Key: `f1ca113b1014263bd6ad15ab0af3e2ff2ad7252776c140149401ba369f7e1333`

### 3. Socket.io Connection
```typescript
const socket = io('wss://msg-gateway-7lqw9uuq.manus.space', {
  query: {
    apiKey: 'f1ca113b1014263bd6ad15ab0af3e2ff2ad7252776c140149401ba369f7e1333'
  }
});
```

## الميزات المتاحة

### في التطبيق الموبايل
- ✅ إرسال الرسائل (WhatsApp, SMS)
- ✅ عرض الإحصائيات
- ✅ إدارة الاتصال
- ✅ تسجيل الدخول

### في لوحة التحكم
- ✅ إدارة المستخدمين
- ✅ عرض الإحصائيات المتقدمة
- ✅ إدارة الاشتراكات
- ✅ تتبع الرسائل

## التوثيق الإضافي

- [SOCKET_IO_INTEGRATION_GUIDE_AR.md](./SOCKET_IO_INTEGRATION_GUIDE_AR.md)
- [CLIENT_INTEGRATION_GUIDE.md](./CLIENT_INTEGRATION_GUIDE.md)
- [API_SPEC_AR.md](./API_SPEC_AR.md)
