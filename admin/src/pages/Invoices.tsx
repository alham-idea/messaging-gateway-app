import React, { useEffect, useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { apiClient } from '../services/api';

interface Invoice {
  id: number;
  userId: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
  dueDate: string;
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">الفواتير</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">رقم الفاتورة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">معرف المستخدم</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">المبلغ</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الحالة</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">تاريخ الإنشاء</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">#{invoice.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{invoice.userId}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${invoice.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'قيد الانتظار' : 'فاشلة'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Download className="w-5 h-5" />
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

export default Invoices;
