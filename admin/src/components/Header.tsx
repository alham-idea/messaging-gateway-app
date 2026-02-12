import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Header: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex-1 flex items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
