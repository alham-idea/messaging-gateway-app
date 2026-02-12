import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const menuItems = [
    { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
    { path: '/users', label: 'المستخدمون', icon: Users },
    { path: '/subscriptions', label: 'الاشتراكات', icon: CreditCard },
    { path: '/analytics', label: 'الإحصائيات', icon: BarChart3 },
    { path: '/invoices', label: 'الفواتير', icon: FileText },
    { path: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-900 text-white shadow-lg">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Gateway Admin</h1>
        <p className="text-gray-400 text-sm mt-1">لوحة التحكم</p>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 ml-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-800 rounded transition-colors"
        >
          <LogOut className="w-5 h-5 ml-3" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
