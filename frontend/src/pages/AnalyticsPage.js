import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiBarChart2, FiPieChart, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const AnalyticsPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

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

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority analysis
  const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
  const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium').length;
  const lowPriorityTasks = tasks.filter(t => t.priority === 'low').length;

  // Department performance
  const departmentMetrics = departments.map(dept => {
    const deptTasks = tasks.filter(t => t.department_id === dept.id);
    const completed = deptTasks.filter(t => t.status === 'completed').length;
    return {
      name: dept.name,
      total: deptTasks.length,
      completed,
      inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
      pending: deptTasks.filter(t => t.status === 'pending').length,
      performance: deptTasks.length > 0 ? Math.round((completed / deptTasks.length) * 100) : 0
    };
  });

  // User productivity
  const userMetrics = users
    .filter(u => u.role !== 'admin')
    .map(user => {
      const userTasks = tasks.filter(t => t.assigned_to === user.id);
      const completed = userTasks.filter(t => t.status === 'completed').length;
      return {
        name: user.full_name,
        role: user.role,
        total: userTasks.length,
        completed,
        inProgress: userTasks.filter(t => t.status === 'in_progress').length,
        pending: userTasks.filter(t => t.status === 'pending').length,
        productivity: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0
      };
    })
    .sort((a, b) => b.productivity - a.productivity);

  const StatCard = ({ icon, label, value, color = 'blue' }) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600'
    };
    return (
      <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 font-medium">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className="text-5xl opacity-30">{icon}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              📈 التحليلات المتقدمة
            </h1>
            <p className="text-gray-600">رؤى عميقة حول أداء النظام والفريق</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> تحديث
          </button>
        </div>

        {/* Time Range Filter */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700">نطاق الفترة:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="quarter">هذا الربع</option>
              <option value="year">السنة بأكملها</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin text-6xl">⏳</div>
            <p className="text-gray-600 mt-4">جاري تحميل التحليلات...</p>
          </div>
        ) : (
          <>
            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon="📊" label="إجمالي المهام" value={totalTasks} color="blue" />
              <StatCard icon="✅" label="المكتملة" value={completedTasks} color="green" />
              <StatCard icon="⏳" label="قيد التنفيذ" value={inProgressTasks} color="purple" />
              <StatCard icon="⏱️" label="المعلقة" value={pendingTasks} color="orange" />
              <StatCard icon="🎯" label="معدل الإنجاز" value={`${completionRate}%`} color="red" />
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Priority Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiPieChart /> توزيع الأولويات
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-semibold">عالية الأولوية</span>
                      <span className="text-2xl font-bold text-red-600">{highPriorityTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full"
                        style={{ width: `${(highPriorityTasks / (totalTasks || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-semibold">متوسطة الأولوية</span>
                      <span className="text-2xl font-bold text-yellow-600">{mediumPriorityTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full"
                        style={{ width: `${(mediumPriorityTasks / (totalTasks || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-semibold">منخفضة الأولوية</span>
                      <span className="text-2xl font-bold text-green-600">{lowPriorityTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${(lowPriorityTasks / (totalTasks || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiTrendingUp /> معدل الإنجاز
                </h2>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-40 h-40">
                    <svg className="transform -rotate-90 w-40 h-40">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray={`${(completionRate / 100) * 440} 440`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-blue-600">{completionRate}%</p>
                        <p className="text-gray-600 text-sm">مُنجز</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiBarChart2 /> أداء الأقسام
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="px-6 py-3 text-right font-bold">القسم</th>
                      <th className="px-6 py-3 text-center font-bold">إجمالي</th>
                      <th className="px-6 py-3 text-center font-bold">مكتملة</th>
                      <th className="px-6 py-3 text-center font-bold">قيد التنفيذ</th>
                      <th className="px-6 py-3 text-center font-bold">معلقة</th>
                      <th className="px-6 py-3 text-center font-bold">الأداء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentMetrics.map((dept, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{dept.name}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{dept.total}</td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold">{dept.completed}</td>
                        <td className="px-6 py-4 text-center text-blue-600 font-bold">{dept.inProgress}</td>
                        <td className="px-6 py-4 text-center text-orange-600 font-bold">{dept.pending}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold text-lg ${
                              dept.performance >= 70 ? 'text-green-600' :
                              dept.performance >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {dept.performance}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Productivity */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">إنتاجية المستخدمين</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                      <th className="px-6 py-3 text-right font-bold">الاسم</th>
                      <th className="px-6 py-3 text-right font-bold">الدور</th>
                      <th className="px-6 py-3 text-center font-bold">إجمالي</th>
                      <th className="px-6 py-3 text-center font-bold">مكتملة</th>
                      <th className="px-6 py-3 text-center font-bold">قيد التنفيذ</th>
                      <th className="px-6 py-3 text-center font-bold">الإنتاجية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userMetrics.map((user, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-gray-700 capitalize">{user.role}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{user.total}</td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold">{user.completed}</td>
                        <td className="px-6 py-4 text-center text-blue-600 font-bold">{user.inProgress}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  user.productivity >= 70 ? 'bg-green-500' :
                                  user.productivity >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${user.productivity}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-lg">{user.productivity}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
