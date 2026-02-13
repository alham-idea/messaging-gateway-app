import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../services/adminApi';

interface ReportData {
  revenueData: any[];
  userGrowthData: any[];
  paymentSuccessData: any[];
  subscriptionDistribution: any[];
  topMetrics: {
    totalRevenue: number;
    totalUsers: number;
    successRate: number;
    avgSubscriptionValue: number;
  };
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [reportType, setReportType] = useState<'revenue' | 'users' | 'payments' | 'subscriptions'>('revenue');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockData: ReportData = {
        revenueData: [
          { month: 'يناير', revenue: 45000, target: 50000 },
          { month: 'فبراير', revenue: 52000, target: 50000 },
          { month: 'مارس', revenue: 48000, target: 50000 },
          { month: 'أبريل', revenue: 61000, target: 50000 },
          { month: 'مايو', revenue: 55000, target: 50000 },
          { month: 'يونيو', revenue: 67000, target: 50000 },
        ],
        userGrowthData: [
          { month: 'يناير', users: 150, activeUsers: 120 },
          { month: 'فبراير', users: 200, activeUsers: 160 },
          { month: 'مارس', users: 280, activeUsers: 220 },
          { month: 'أبريل', users: 350, activeUsers: 280 },
          { month: 'مايو', users: 420, activeUsers: 340 },
          { month: 'يونيو', users: 520, activeUsers: 420 },
        ],
        paymentSuccessData: [
          { month: 'يناير', success: 95, failed: 5 },
          { month: 'فبراير', success: 97, failed: 3 },
          { month: 'مارس', success: 96, failed: 4 },
          { month: 'أبريل', success: 98, failed: 2 },
          { month: 'مايو', success: 97, failed: 3 },
          { month: 'يونيو', success: 99, failed: 1 },
        ],
        subscriptionDistribution: [
          { name: 'Basic', value: 150, color: '#0a7ea4' },
          { name: 'Professional', value: 280, color: '#22C55E' },
          { name: 'Enterprise', value: 90, color: '#F59E0B' },
        ],
        topMetrics: {
          totalRevenue: 328000,
          totalUsers: 520,
          successRate: 97,
          avgSubscriptionValue: 299,
        },
      };
      setReportData(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (format: 'pdf' | 'csv' | 'excel') => {
    // TODO: Implement report download
    alert(`تحميل التقرير بصيغة ${format.toUpperCase()}`);
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!reportData) {
    return <div className="p-6">فشل في تحميل بيانات التقرير</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownloadReport('pdf')}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleDownloadReport('excel')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">نطاق التاريخ</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">أسبوع</option>
            <option value="month">شهر</option>
            <option value="year">سنة</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">نوع التقرير</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="revenue">الإيرادات</option>
            <option value="users">المستخدمين</option>
            <option value="payments">المدفوعات</option>
            <option value="subscriptions">الاشتراكات</option>
          </select>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.topMetrics.totalRevenue.toLocaleString()} ريال
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.topMetrics.totalUsers}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">معدل النجاح</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.topMetrics.successRate}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">متوسط قيمة الاشتراك</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.topMetrics.avgSubscriptionValue} ريال
              </p>
            </div>
            <Calendar className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات الشهرية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0a7ea4" name="الإيرادات الفعلية" />
              <Line type="monotone" dataKey="target" stroke="#E5E7EB" name="الهدف" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">نمو المستخدمين</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#0a7ea4" name="إجمالي المستخدمين" />
              <Bar dataKey="activeUsers" fill="#22C55E" name="المستخدمين النشطين" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Success Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">معدل نجاح المدفوعات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.paymentSuccessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="success" fill="#22C55E" name="الناجحة" />
              <Bar dataKey="failed" fill="#EF4444" name="الفاشلة" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">توزيع الاشتراكات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.subscriptionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">التفاصيل الشهرية</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4 text-gray-600 font-medium">الشهر</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">الإيرادات</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">المستخدمين الجدد</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">المدفوعات</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">معدل النجاح</th>
              </tr>
            </thead>
            <tbody>
              {reportData.revenueData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{row.month}</td>
                  <td className="py-3 px-4">{row.revenue.toLocaleString()} ريال</td>
                  <td className="py-3 px-4">{reportData.userGrowthData[index]?.users || 0}</td>
                  <td className="py-3 px-4">{Math.floor(row.revenue / 100)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      {reportData.paymentSuccessData[index]?.success || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
