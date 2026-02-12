import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Calendar } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface SubscriptionDetailsData {
  subscription: any;
  plan: any;
  user: any;
}

const SubscriptionDetails: React.FC = () => {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<SubscriptionDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscriptionDetails(parseInt(subscriptionId));
    }
  }, [subscriptionId]);

  const fetchSubscriptionDetails = async (id: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getSubscriptionDetails(id);
      setDetails(data);
      setNewStatus(data.subscription?.status || '');
    } catch (err) {
      setError('فشل في تحميل بيانات الاشتراك');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!subscriptionId || !newStatus) return;
    try {
      await adminApi.updateSubscriptionStatus(parseInt(subscriptionId), newStatus);
      if (details) {
        setDetails({
          ...details,
          subscription: { ...details.subscription, status: newStatus },
        });
      }
    } catch (err) {
      setError('فشل في تحديث حالة الاشتراك');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/subscriptions')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          العودة
        </button>
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/subscriptions')}
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

  const { subscription, plan, user } = details;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/subscriptions')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        العودة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">تفاصيل الاشتراك</h1>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 text-sm">رقم الاشتراك</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{subscription?.id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">المستخدم</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{user?.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">البريد الإلكتروني</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{user?.email}</p>
              </div>
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
            </div>
          </div>

          {/* Plan Information */}
          {plan && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الخطة</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm">اسم الخطة</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{plan?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">السعر الشهري</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{plan?.monthlyPrice} SAR</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">حد رسائل WhatsApp</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {plan?.whatsappMessagesLimit?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">حد رسائل SMS</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {plan?.smsMessagesLimit?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">الجدول الزمني</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">تاريخ البداية</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(subscription?.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">تاريخ الانتهاء</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(subscription?.endDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">تاريخ الفاتورة التالية</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(subscription?.nextBillingDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Status Update */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">تحديث الحالة</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">الحالة الجديدة</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">نشط</option>
                <option value="cancelled">ملغى</option>
                <option value="expired">منتهي الصلاحية</option>
                <option value="suspended">معلق</option>
              </select>
            </div>

            <button
              onClick={handleStatusUpdate}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              تحديث الحالة
            </button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">معلومات إضافية</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">دورة الفواتير</p>
                  <p className="text-gray-900 font-medium">{subscription?.billingCycle}</p>
                </div>
                <div>
                  <p className="text-gray-600">التجديد التلقائي</p>
                  <p className="text-gray-900 font-medium">
                    {subscription?.autoRenew ? 'مفعل' : 'معطل'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;
