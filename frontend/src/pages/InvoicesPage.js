import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDownload, FiFilter, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_name: '',
    client_email: '',
    amount: '',
    currency: 'IQD',
    description: '',
    due_date: '',
    items: [],
    status: 'pending'
  });

  // دالة لتنسيق العملة
  const formatCurrency = (amount, currency = 'IQD') => {
    const formatted = parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (currency === 'IQD') {
      return `${formatted} دينار عراقي`;
    } else if (currency === 'USD') {
      return `$${formatted}`;
    }
    return `${formatted} ${currency}`;
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(
        `http://localhost:5000/api/invoices?status=${filterStatus}`,
        { headers }
      );
      setInvoices(response.data.data || []);
    } catch (error) {
      toast.error('فشل تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/invoices/${editingId}`, formData, { headers });
        setInvoices(invoices.map(inv => inv.id === editingId ? { ...formData, id: editingId } : inv));
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        const response = await axios.post('http://localhost:5000/api/invoices', formData, { headers });
        setInvoices([response.data.data, ...invoices]);
        toast.success('تم إنشاء الفاتورة بنجاح');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        invoice_number: '',
        client_name: '',
        client_email: '',
        amount: '',
        currency: 'IQD',
        description: '',
        due_date: '',
        items: [],
        status: 'pending'
      });
    } catch (error) {
      toast.error('فشل حفظ الفاتورة');
    }
  };

  const handleEditInvoice = (invoice) => {
    setFormData(invoice);
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الفاتورة؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success('تم حذف الفاتورة بنجاح');
    } catch (error) {
      toast.error('فشل حذف الفاتورة');
    }
  };

  const handleDownloadInvoice = (invoice) => {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة رقم ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; background: white; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #3b82f6; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { color: #3b82f6; font-size: 24px; margin: 0; }
          .invoice-number { color: #666; font-size: 14px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .detail-section { }
          .detail-section p { margin: 5px 0; }
          .detail-label { font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #3b82f6; color: white; padding: 10px; text-align: right; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { text-align: left; font-size: 20px; font-weight: bold; color: #3b82f6; padding: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>فاتورة</h1>
            <p class="invoice-number">رقم الفاتورة: ${invoice.invoice_number}</p>
          </div>
          
          <div class="details">
            <div class="detail-section">
              <p><span class="detail-label">العميل:</span> ${invoice.client_name}</p>
              <p><span class="detail-label">البريد الإلكتروني:</span> ${invoice.client_email}</p>
            </div>
            <div class="detail-section">
              <p><span class="detail-label">تاريخ الإنشاء:</span> ${new Date(invoice.created_at).toLocaleDateString('ar-EG')}</p>
              <p><span class="detail-label">تاريخ الاستحقاق:</span> ${new Date(invoice.due_date).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          <p><strong>البيان:</strong> ${invoice.description}</p>

          <table>
            <thead>
              <tr>
                <th>البند</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>الخدمات المقدمة</td>
                <td>${invoice.currency === 'USD' ? '$' : ''}${parseFloat(invoice.amount).toFixed(2)}${invoice.currency === 'IQD' ? ' دينار عراقي' : ''}</td>
              </tr>
              <tr>
                <td colspan="2" class="total">الإجمالي: ${invoice.currency === 'USD' ? '$' : ''}${parseFloat(invoice.amount).toFixed(2)}${invoice.currency === 'IQD' ? ' دينار عراقي' : ''}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>شكراً لك على تعاملك معنا</p>
            <p>© شركة الخدمات القانونية</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoice_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              💰 الفواتير
            </h1>
            <p className="text-gray-600">إدارة الفواتير والدفعات</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                invoice_number: `INV-${Date.now()}`,
                client_name: '',
                client_email: '',
                amount: '',
                description: '',
                due_date: '',
                items: [],
                status: 'pending'
              });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition shadow-lg"
          >
            <FiPlus /> فاتورة جديدة
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">إجمالي الفواتير</p>
                <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <FiDollarSign className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">الإجمالي</p>
                <p className="text-3xl font-bold text-gray-900">{totalAmount.toFixed(2)}</p>
              </div>
              <FiDollarSign className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">المستحصل</p>
                <p className="text-3xl font-bold text-green-600">{paidAmount.toFixed(2)}</p>
              </div>
              <FiDollarSign className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الفواتير</option>
              <option value="pending">قيد الانتظار</option>
              <option value="sent">مُرسلة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-4xl">⏳</div>
              <p className="text-gray-600 mt-4">جاري تحميل الفواتير...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">لا توجد فواتير</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <th className="px-6 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-right">العميل</th>
                  <th className="px-6 py-3 text-right">المبلغ</th>
                  <th className="px-6 py-3 text-right">الحالة</th>
                  <th className="px-6 py-3 text-right">تاريخ الاستحقاق</th>
                  <th className="px-6 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-700">{invoice.client_name}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(invoice.amount, invoice.currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status === 'paid' ? '✓ مدفوعة' :
                         invoice.status === 'pending' ? '⏱️ قيد الانتظار' :
                         '❌ متأخرة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{new Date(invoice.due_date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="text-blue-500 hover:text-blue-700 transition"
                      >
                        <FiDownload className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="text-green-500 hover:text-green-700 transition"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white sticky top-0">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'تحديث الفاتورة' : 'فاتورة جديدة'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-6 left-6 text-2xl hover:opacity-80"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="رقم الفاتورة"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="اسم العميل"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="بريد العميل"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="المبلغ"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      step="0.01"
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="IQD">دينار عراقي (IQD)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>
                  />
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="sent">مُرسلة</option>
                    <option value="paid">مدفوعة</option>
                    <option value="overdue">متأخرة</option>
                  </select>
                </div>

                <textarea
                  placeholder="البيان / الوصف"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  required
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition"
                  >
                    {editingId ? 'تحديث' : 'إنشاء'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
