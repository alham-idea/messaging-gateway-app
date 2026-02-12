import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics: React.FC = () => {
  const data = [
    { month: 'يناير', revenue: 4000, users: 2400 },
    { month: 'فبراير', revenue: 3000, users: 1398 },
    { month: 'مارس', revenue: 2000, users: 9800 },
    { month: 'أبريل', revenue: 2780, users: 3908 },
    { month: 'مايو', revenue: 1890, users: 4800 },
    { month: 'يونيو', revenue: 2390, users: 3800 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">الإحصائيات والتقارير</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات الشهرية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">نمو المستخدمين</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">متوسط الإيرادات الشهرية</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$2,843</p>
          <p className="text-green-600 text-sm mt-2">↑ 12% من الشهر السابق</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">معدل الاحتفاظ</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">85%</p>
          <p className="text-green-600 text-sm mt-2">↑ 5% من الشهر السابق</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">معدل الفشل</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">2.3%</p>
          <p className="text-red-600 text-sm mt-2">↑ 0.5% من الشهر السابق</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
