import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Download, Calendar, DollarSign } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface InvoiceDetailsData {
  invoice: any;
  user: any;
  relatedPayments: any[];
}

const InvoiceDetails: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<InvoiceDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails(parseInt(invoiceId));
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async (id: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getInvoiceDetails(id);
      setDetails(data);
      setNewStatus(data.invoice?.invoiceStatus || '');
    } catch (err) {
      setError('فشل في تحميل بيانات الفاتورة');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!invoiceId || !newStatus) return;
    try {
      await adminApi.updateInvoiceStatus(parseInt(invoiceId), newStatus);
      if (details) {
        setDetails({
          ...details,
          invoice: { ...details.invoice, invoiceStatus: newStatus },
        });
      }
    } catch (err) {
      setError('فشل في تحديث حالة الفاتورة');
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    alert('سيتم تنفيذ تحميل PDF قريباً');
  };

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/invoices')}
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
          onClick={() => navigate('/invoices')}
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

  const { invoice, user, relatedPayments } = details;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/invoices')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        العودة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2">
          {/* Invoice Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{invoice?.invoiceNumber}</h1>
                <p className="text-gray-600 mt-1">فاتورة من {invoice?.notes}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  invoice?.invoiceStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : invoice?.invoiceStatus === 'issued'
                    ? 'bg-blue-100 text-blue-700'
                    : invoice?.invoiceStatus === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {invoice?.invoiceStatus}
              </span>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
              <div>
                <p className="text-gray-600 text-sm mb-1">المستخدم</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">معلومات الفاتورة</p>
                <p className="text-gray-900">
                  <span className="font-medium">رقم الفاتورة:</span> {invoice?.invoiceNumber}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">التاريخ:</span>{' '}
                  {new Date(invoice?.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الفاتورة</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-4 text-gray-600 text-sm">البند</th>
                    <th className="text-right py-2 px-4 text-gray-600 text-sm">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">الرسوم الأساسية</td>
                    <td className="py-3 px-4">{invoice?.amount} SAR</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">الضريبة (15%)</td>
                    <td className="py-3 px-4">{invoice?.taxAmount} SAR</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 font-semibold">الإجمالي</td>
                    <td className="py-3 px-4 font-semibold text-lg">{invoice?.totalAmount} SAR</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-600 text-sm">تاريخ البداية</p>
                <p className="text-gray-900 font-medium">
                  {new Date(invoice?.billingPeriodStart).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">تاريخ النهاية</p>
                <p className="text-gray-900 font-medium">
                  {new Date(invoice?.billingPeriodEnd).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">تاريخ الاستحقاق</p>
                <p className="text-gray-900 font-medium">
                  {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                </p>
              </div>
            </div>
          </div>

          {/* Related Payments */}
          {relatedPayments && relatedPayments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">المدفوعات المرتبطة</h2>
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
                    {relatedPayments.map((payment: any) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{payment.amount} SAR</td>
                        <td className="py-3 px-4">{payment.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              payment.paymentStatus === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
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
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الإجراءات</h3>
            
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium mb-3"
            >
              <Download className="w-4 h-4 mr-2" />
              تحميل PDF
            </button>

            <div className="border-t pt-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">تحديث الحالة</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              >
                <option value="issued">صادرة</option>
                <option value="paid">مدفوعة</option>
                <option value="overdue">متأخرة</option>
                <option value="cancelled">ملغاة</option>
              </select>

              <button
                onClick={handleStatusUpdate}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                تحديث الحالة
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الملخص</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">الرسوم الأساسية</span>
                <span className="text-gray-900 font-medium">{invoice?.amount} SAR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الضريبة</span>
                <span className="text-gray-900 font-medium">{invoice?.taxAmount} SAR</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-900 font-semibold">الإجمالي</span>
                <span className="text-lg font-bold text-gray-900">{invoice?.totalAmount} SAR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
