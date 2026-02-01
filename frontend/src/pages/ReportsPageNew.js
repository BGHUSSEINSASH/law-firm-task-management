import React, { useState, useEffect } from 'react';
import { FiDownload, FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const ReportsPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [tasksRes, usersRes, depsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tasks', { headers }),
        axios.get('http://localhost:5000/api/users', { headers }),
        axios.get('http://localhost:5000/api/departments', { headers })
      ]);

      setTasks(tasksRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setDepartments(depsRes.data.data || []);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const generateReportHTML = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التقرير الشامل</title>
        <style>
          body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { text-align: center; color: #1f2937; border-bottom: 4px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
          h2 { color: #3b82f6; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-label { font-size: 12px; opacity: 0.9; }
          .stat-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #3b82f6; color: white; padding: 12px; text-align: right; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          tr:hover { background: #f9fafb; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
          .date { color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 التقرير الشامل لنظام إدارة المهام</h1>
          <p class="date">تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-EG')}</p>
          
          <h2>الإحصائيات الرئيسية</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">إجمالي المهام</div>
              <div class="stat-value">${totalTasks}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">المكتملة</div>
              <div class="stat-value">${completedTasks}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">قيد التنفيذ</div>
              <div class="stat-value">${inProgressTasks}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">المعلقة</div>
              <div class="stat-value">${pendingTasks}</div>
            </div>
          </div>

          <h2>إحصائيات الأقسام</h2>
          <table>
            <thead>
              <tr>
                <th>القسم</th>
                <th>إجمالي المهام</th>
                <th>المكتملة</th>
                <th>قيد التنفيذ</th>
                <th>المعلقة</th>
              </tr>
            </thead>
            <tbody>
              ${departments.map(dept => {
                const deptTasks = tasks.filter(t => t.department_id === dept.id);
                return `
                  <tr>
                    <td>${dept.name}</td>
                    <td>${deptTasks.length}</td>
                    <td>${deptTasks.filter(t => t.status === 'completed').length}</td>
                    <td>${deptTasks.filter(t => t.status === 'in_progress').length}</td>
                    <td>${deptTasks.filter(t => t.status === 'pending').length}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h2>إحصائيات المستخدمين</h2>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الدور</th>
                <th>إجمالي المهام</th>
                <th>المكتملة</th>
                <th>قيد التنفيذ</th>
              </tr>
            </thead>
            <tbody>
              ${users.filter(u => u.role !== 'admin').map(user => {
                const userTasks = tasks.filter(t => t.assigned_to === user.id);
                return `
                  <tr>
                    <td>${user.full_name}</td>
                    <td>${user.role}</td>
                    <td>${userTasks.length}</td>
                    <td>${userTasks.filter(t => t.status === 'completed').length}</td>
                    <td>${userTasks.filter(t => t.status === 'in_progress').length}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المهام المتقدم</p>
            <p>© جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const downloadPDF = () => {
    const html = generateReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل التقرير بنجاح');
  };

  const StatBox = ({ label, value, color = 'blue' }) => {
    const colors = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      green: 'bg-gradient-to-br from-green-500 to-green-600',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
      yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
    };
    return (
      <div className={`${colors[color]} rounded-lg p-6 text-white shadow-lg`}>
        <p className="text-sm opacity-90">{label}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
      </div>
    );
  };

  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl">⏳</div>
          <p className="text-gray-600 mt-4">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              📊 التقارير والتحليلات
            </h1>
            <p className="text-gray-600 mt-2">تحليل شامل لأداء النظام والعمليات</p>
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg transition transform hover:scale-105"
          >
            <FiDownload /> تحميل التقرير
          </button>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatBox label="إجمالي المهام" value={tasks.length} color="blue" />
          <StatBox label="المهام المكتملة" value={tasks.filter(t => t.status === 'completed').length} color="green" />
          <StatBox label="قيد التنفيذ" value={tasks.filter(t => t.status === 'in_progress').length} color="purple" />
          <StatBox label="المعلقة" value={tasks.filter(t => t.status === 'pending').length} color="yellow" />
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">معدل الإنجاز</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">إجمالي الإنجاز</span>
                <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiBarChart2 /> إحصائيات الأقسام
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <th className="px-6 py-3 text-right font-bold">اسم القسم</th>
                  <th className="px-6 py-3 text-center font-bold">إجمالي المهام</th>
                  <th className="px-6 py-3 text-center font-bold">المكتملة</th>
                  <th className="px-6 py-3 text-center font-bold">قيد التنفيذ</th>
                  <th className="px-6 py-3 text-center font-bold">المعلقة</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => {
                  const deptTasks = tasks.filter(t => t.department_id === dept.id);
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-800 font-semibold">{dept.name}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">{deptTasks.length}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">
                        {deptTasks.filter(t => t.status === 'completed').length}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-600 font-bold">
                        {deptTasks.filter(t => t.status === 'in_progress').length}
                      </td>
                      <td className="px-6 py-4 text-center text-yellow-600 font-bold">
                        {deptTasks.filter(t => t.status === 'pending').length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Statistics */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiTrendingUp /> إحصائيات المستخدمين
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <th className="px-6 py-3 text-right font-bold">الاسم</th>
                  <th className="px-6 py-3 text-right font-bold">الدور</th>
                  <th className="px-6 py-3 text-center font-bold">إجمالي المهام</th>
                  <th className="px-6 py-3 text-center font-bold">المكتملة</th>
                  <th className="px-6 py-3 text-center font-bold">قيد التنفيذ</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role !== 'admin').map((user, idx) => {
                  const userTasks = tasks.filter(t => t.assigned_to === user.id);
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-800 font-semibold">{user.full_name}</td>
                      <td className="px-6 py-4 text-gray-700 capitalize">{user.role}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">{userTasks.length}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">
                        {userTasks.filter(t => t.status === 'completed').length}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-600 font-bold">
                        {userTasks.filter(t => t.status === 'in_progress').length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
