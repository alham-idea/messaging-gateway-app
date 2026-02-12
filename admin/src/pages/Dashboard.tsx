import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/api';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  failedPayments: number;
  chartData: any[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    failedPayments: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard statistics
      const response = await apiClient.get('/api/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">لوحة التحكم</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="إجمالي المستخدمين"
          value={stats.totalUsers}
          color="bg-blue-500"
        />
        <StatCard
          icon={CreditCard}
          label="الاشتراكات النشطة"
          value={stats.activeSubscriptions}
          color="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="الإيرادات الشهرية"
          value={`$${stats.monthlyRevenue}`}
          color="bg-purple-500"
        />
        <StatCard
          icon={AlertCircle}
          label="الدفعات الفاشلة"
          value={stats.failedPayments}
          color="bg-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات الشهرية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriptions Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">توزيع الاشتراكات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="subscriptions" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">الأنشطة الأخيرة</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">اشتراك جديد</p>
              <p className="text-sm text-gray-500">مستخدم جديد اشترك في الخطة المتقدمة</p>
            </div>
            <span className="text-sm text-gray-500">قبل 5 دقائق</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">فشل الدفع</p>
              <p className="text-sm text-gray-500">فشل دفع الفاتورة رقم #1234</p>
            </div>
            <span className="text-sm text-gray-500">قبل 15 دقيقة</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">تحديث الملف الشخصي</p>
              <p className="text-sm text-gray-500">قام المستخدم بتحديث بيانات ملفه الشخصي</p>
            </div>
            <span className="text-sm text-gray-500">قبل ساعة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
