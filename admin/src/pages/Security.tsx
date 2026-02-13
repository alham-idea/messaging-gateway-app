import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface SecurityTest {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'pending';
  timestamp?: Date;
}

const Security: React.FC = () => {
  const [tests, setTests] = useState<SecurityTest[]>([
    {
      id: 'sql-injection',
      name: 'اختبار SQL Injection',
      description: 'التحقق من الحماية ضد حقن قواعد البيانات',
      status: 'passed',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: 'xss',
      name: 'اختبار XSS',
      description: 'التحقق من الحماية ضد هجمات البرامج النصية',
      status: 'passed',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: 'csrf',
      name: 'اختبار CSRF',
      description: 'التحقق من الحماية ضد طلبات التزييف',
      status: 'passed',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: 'permissions',
      name: 'اختبار الصلاحيات',
      description: 'التحقق من التحكم في الوصول والصلاحيات',
      status: 'passed',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: 'encryption',
      name: 'اختبار التشفير',
      description: 'التحقق من تشفير البيانات الحساسة',
      status: 'passed',
      timestamp: new Date(Date.now() - 86400000),
    },
  ]);

  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key-1',
      name: 'Production API Key',
      key: 'sk_live_••••••••••••••••••••••••',
      created: new Date(Date.now() - 2592000000),
      lastUsed: new Date(Date.now() - 3600000),
      active: true,
    },
    {
      id: 'key-2',
      name: 'Development API Key',
      key: 'sk_test_••••••••••••••••••••••••',
      created: new Date(Date.now() - 5184000000),
      lastUsed: new Date(Date.now() - 86400000),
      active: true,
    },
  ]);

  const [showKey, setShowKey] = useState<string | null>(null);

  const runTest = async (testId: string) => {
    setTests(prev =>
      prev.map(t =>
        t.id === testId
          ? { ...t, status: 'pending' }
          : t
      )
    );

    // Simulate test execution
    setTimeout(() => {
      setTests(prev =>
        prev.map(t =>
          t.id === testId
            ? { ...t, status: 'passed', timestamp: new Date() }
            : t
        )
      );
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">الأمان والاختبارات</h1>
      </div>

      {/* Security Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">اختبارات الأمان</h2>
        <div className="space-y-4">
          {tests.map(test => (
            <div
              key={test.id}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(test.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    {test.timestamp && (
                      <p className="text-xs text-gray-500 mt-2">
                        آخر اختبار: {test.timestamp.toLocaleString('ar-SA')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => runTest(test.id)}
                  disabled={test.status === 'pending'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
                >
                  {test.status === 'pending' ? 'جاري...' : 'تشغيل الاختبار'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">مفاتيح API</h2>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            إنشاء مفتاح جديد
          </button>
        </div>

        <div className="space-y-4">
          {apiKeys.map(apiKey => (
            <div key={apiKey.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                      {showKey === apiKey.id ? apiKey.key : apiKey.key}
                    </code>
                    <button
                      onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {showKey === apiKey.id ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <p>تم الإنشاء: {apiKey.created.toLocaleDateString('ar-SA')}</p>
                    <p>آخر استخدام: {apiKey.lastUsed.toLocaleString('ar-SA')}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {apiKey.active && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                      نشط
                    </span>
                  )}
                  <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">قائمة فحص الأمان</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">تشفير البيانات في الانتقال (HTTPS)</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">تشفير كلمات المرور (bcrypt)</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">حماية CSRF</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">التحقق من الصلاحيات</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">تسجيل الأنشطة الحساسة</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">حد أقصى لمحاولات تسجيل الدخول</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">التحقق من البريد الإلكتروني</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
