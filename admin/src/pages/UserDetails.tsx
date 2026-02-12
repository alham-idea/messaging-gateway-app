import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface UserDetailsData {
  user: any;
  subscription: any;
  payments: any[];
  invoices: any[];
}

const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserDetails(parseInt(userId));
    }
  }, [userId]);

  const fetchUserDetails = async (id: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getUserDetails(id);
      setUserDetails(data);
      setIsActive(data.user?.isActive !== false);
    } catch (err) {
      setError('فشل في تحميل بيانات المستخدم');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!userId) return;
    try {
      await adminApi.updateUserStatus(parseInt(userId), !isActive);
      setIsActive(!isActive);
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          user: { ...userDetails.user, isActive: !isActive },
        });
      }
    } catch (err) {
      setError('فشل في تحديث حالة المستخدم');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          العودة
        </button>
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          العودة
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-600">{error || 'حدث خطأ'}</span>
          </div>
        </div>
      </div>
    );
  }

  const { user, subscription, payments, invoices } = userDetails;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/users')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        العودة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600 mt-1">{user?.email}</p>
              </div>
              <button
                onClick={handleStatusChange}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {isActive ? 'نشط' : 'معطل'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <span>{new Date(user?.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
          </div>

          {/* Subscription Information */}
          {subscription && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الاشتراك</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">الحالة</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">دورة الفواتير</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{subscription.billingCycle}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">تاريخ الانتهاء</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(subscription.endDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">التجديد التلقائي</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {subscription.autoRenew ? 'مفعل' : 'معطل'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">آخر المدفوعات</h2>
            {payments && payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2 px-4 text-gray-600 text-sm">المبلغ</th>
                      <th className="text-right py-2 px-4 text-gray-600 text-sm">الطريقة</th>
                      <th className="text-right py-2 px-4 text-gray-600 text-sm">الحالة</th>
                      <th className="text-right py-2 px-4 text-gray-600 text-sm">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 5).map((payment: any) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{payment.amount} SAR</td>
                        <td className="py-3 px-4">{payment.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              payment.paymentStatus === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : payment.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {payment.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(payment.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">لا توجد مدفوعات</p>
            )}
          </div>
        </div>

        {/* Sidebar Statistics */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الإحصائيات</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0).toFixed(2)} SAR
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">عدد الفواتير</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{invoices?.length || 0}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">عدد المدفوعات</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{payments?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر الفواتير</h3>
            {invoices && invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 3).map((invoice: any) => (
                  <div key={invoice.id} className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">{invoice.totalAmount} SAR</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">لا توجد فواتير</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
