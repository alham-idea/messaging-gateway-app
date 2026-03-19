import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Eye, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface Device {
  id: number;
  phoneNumber: string | null;
  deviceType: string | null;
  status: 'online' | 'offline';
  lastSeen: string | null;
}

interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
  devices?: Device[];
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(50, 0, searchTerm);
      setUsers(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredUsers = users; // already filtered by API

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.inactive;
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المستخدمون</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="البحث عن مستخدم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">البريد الإلكتروني</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الاسم</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الأجهزة المتصلة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الحالة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.devices && user.devices.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {user.devices.map(device => (
                        <div key={device.id} className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-xs">{device.deviceType || 'غير معروف'}</span>
                          <span className="text-xs text-gray-400">({device.phoneNumber || 'لا يوجد رقم'})</span>
                          {device.status === 'online' ? (
                            <Wifi className="w-4 h-4 text-green-500" title="متصل" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-500" title="غير متصل" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">لا توجد أجهزة</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(user.status)}`}>
                    {user.status === 'active' ? 'نشط' : user.status === 'inactive' ? 'غير نشط' : 'معلق'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-900">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-gray-500">عرض {filteredUsers.length} من {users.length} مستخدم</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">السابق</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">التالي</button>
        </div>
      </div>
    </div>
  );
};

export default Users;
