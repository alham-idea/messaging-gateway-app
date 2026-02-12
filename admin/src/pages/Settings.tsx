import React, { useState } from 'react';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    appName: 'Messaging Gateway',
    appEmail: 'support@example.com',
    appPhone: '+1234567890',
    currency: 'USD',
    timezone: 'UTC',
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Save settings to API
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">الإعدادات</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* General Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">الإعدادات العامة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم التطبيق</label>
                <input
                  type="text"
                  name="appName"
                  value={settings.appName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="appEmail"
                  value={settings.appEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  name="appPhone"
                  value={settings.appPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
                  <select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>SAR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
                  <select
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>UTC</option>
                    <option>GMT+3</option>
                    <option>EST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الإشعارات</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">تفعيل إشعارات البريد الإلكتروني</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">تفعيل إشعارات الرسائل النصية</span>
              </label>
            </div>
          </div>

          {/* System Settings */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">إعدادات النظام</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">تفعيل وضع الصيانة</span>
            </label>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
