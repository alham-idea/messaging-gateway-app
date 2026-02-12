import React, { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '../services/api';

interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  amount: number;
}

const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">الاشتراكات</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">معرف الاشتراك</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">معرف المستخدم</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الحالة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">المبلغ</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">تاريخ الانتهاء</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">#{sub.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{sub.userId}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sub.status === 'active' ? 'نشط' : 'ملغى'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">${sub.amount}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sub.endDate).toLocaleDateString('ar-SA')}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
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
    </div>
  );
};

export default Subscriptions;
