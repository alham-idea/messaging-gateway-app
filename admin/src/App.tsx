import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetails from './pages/SubscriptionDetails';
import Analytics from './pages/Analytics';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useAuthStore } from './stores/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:userId" element={<UserDetails />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/subscriptions/:subscriptionId" element={<SubscriptionDetails />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:invoiceId" element={<InvoiceDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
