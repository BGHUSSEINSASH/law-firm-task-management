import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { FiDownload, FiEye, FiFilter } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const PDFReportsPage = () => {
  const { t } = useI18n();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'tasks',
    status: 'all',
    dateRange: 'week',
  });

  const reportTypes = [
    { id: 'tasks', label: t('reports.taskReport'), icon: '📋' },
    { id: 'performance', label: t('reports.performanceReport'), icon: '📊' },
    { id: 'sla', label: t('reports.slaReport'), icon: '⚡' },
    { id: 'revenue', label: t('reports.revenueReport'), icon: '💰' },
  ];

  const generateReport = async (type) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', type);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('dateRange', filters.dateRange);

      const response = await API.get(`/api/reports/generate?${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPdfUrl(url);
      setSelectedReport(type);
      toast.success(t('reports.previewReport'));
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `report_${selectedReport}_${Date.now()}.pdf`;
      a.click();
      toast.success('تم تحميل التقرير');
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{t('reports.title')}</h1>
        <p className="text-slate-400">{t('reports.generateReport')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator - Left Side */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filters */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FiFilter className="w-5 h-5" />
              الفلاتر
            </h3>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                {t('tasks.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">الكل</option>
                <option value="completed">مكتملة</option>
                <option value="pending">قيد الانتظار</option>
                <option value="overdue">متأخرة</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                نطاق التاريخ
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="quarter">هذا الربع</option>
                <option value="year">هذا السنة</option>
                <option value="all">الكل</option>
              </select>
            </div>
          </div>

          {/* Report Types */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl space-y-3">
            <h3 className="font-semibold text-white mb-4">نوع التقرير</h3>
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => generateReport(report.id)}
                disabled={loading}
                className={`w-full text-right px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                  selectedReport === report.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-xl">{report.icon}</span>
                <span>{report.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PDF Preview - Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
            {pdfUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-lg">
                    {t('reports.previewReport')}
                  </h3>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                  >
                    <FiDownload className="w-4 h-4" />
                    {t('buttons.download')} PDF
                  </button>
                </div>

                {/* PDF Viewer */}
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-96 rounded-lg bg-white"
                    title="PDF Preview"
                  />
                </div>

                {/* Report Info */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">📅 التاريخ</p>
                    <p className="text-white font-semibold text-lg">
                      {new Date().toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">📊 النوع</p>
                    <p className="text-white font-semibold text-lg">
                      {reportTypes.find((r) => r.id === selectedReport)?.label}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">🎯 النطاق</p>
                    <p className="text-white font-semibold text-lg capitalize">
                      {filters.dateRange}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiEye className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <p className="text-slate-400 mb-2">اختر نوع التقرير لمعاينته</p>
                <p className="text-sm text-slate-500">يمكنك تطبيق الفلاتر وتحميل التقرير كـ PDF</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report History */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h3 className="font-semibold text-white mb-4">📚 التقارير الأخيرة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-indigo-500/50 transition cursor-pointer text-center"
            >
              <span className="text-3xl">{report.icon}</span>
              <p className="text-white font-semibold text-sm mt-2">{report.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFReportsPage;
