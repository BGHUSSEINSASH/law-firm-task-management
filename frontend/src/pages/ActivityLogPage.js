import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiClock, FiUser, FiBriefcase, FiFileText, FiFilter } from 'react-icons/fi';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTaskId, setFilterTaskId] = useState('');
  const [tasks, setTasks] = useState([]);

  const fetchLogs = async (taskId = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = taskId ? { task_id: taskId } : {};
      const response = await axios.get('http://localhost:5000/api/tasks/logs/activity', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('فشل جلب السجلات');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTasks();
  }, []);

  const handleFilter = () => {
    fetchLogs(filterTaskId);
  };

  const handleClearFilter = () => {
    setFilterTaskId('');
    fetchLogs();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'bg-blue-600',
      updated: 'bg-yellow-600',
      approved_admin: 'bg-green-600',
      approved_main_lawyer: 'bg-green-700',
      approved_assigned_lawyer: 'bg-green-800',
      status_changed: 'bg-purple-600',
      stage_changed: 'bg-indigo-600',
      deleted: 'bg-red-600'
    };
    return colors[action] || 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📋 سجل النشاطات
          </h1>
          <p className="text-slate-400">تتبع جميع العمليات والموافقات على المهام</p>
        </div>

        {/* Filter Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <FiFilter className="text-blue-400 text-xl" />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">تصفية حسب المهمة</label>
              <select
                value={filterTaskId}
                onChange={(e) => setFilterTaskId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع المهام</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.task_code} - {task.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleFilter}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              تصفية
            </button>
            {filterTaskId && (
              <button
                onClick={handleClearFilter}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
              >
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">جاري التحميل...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
            <FiFileText className="mx-auto text-6xl text-slate-600 mb-4" />
            <p className="text-slate-400">لا توجد سجلات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`${getActionColor(log.action)} text-white px-4 py-2 rounded-lg text-sm font-semibold`}>
                      {log.action_ar}
                    </span>
                    <span className="text-slate-400 text-sm flex items-center gap-2">
                      <FiClock />
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Task Info */}
                <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="text-blue-400" />
                    <span className="font-semibold">المهمة:</span>
                    <span className="text-slate-300">{log.task_code}</span>
                    <span className="text-slate-400">-</span>
                    <span className="text-slate-300">{log.task_title}</span>
                  </div>
                </div>

                {/* User and Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* User Info */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser className="text-green-400" />
                      <span className="text-sm font-semibold">المستخدم</span>
                    </div>
                    <p className="text-sm text-slate-300">{log.user.name}</p>
                    <p className="text-xs text-slate-400">{log.user.role_ar}</p>
                  </div>

                  {/* Client Info */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FiBriefcase className="text-yellow-400" />
                      <span className="text-sm font-semibold">الشركة</span>
                    </div>
                    <p className="text-sm text-slate-300">{log.client.name}</p>
                  </div>

                  {/* Department Info */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FiBriefcase className="text-purple-400" />
                      <span className="text-sm font-semibold">القسم</span>
                    </div>
                    <p className="text-sm text-slate-300">{log.department.name}</p>
                  </div>

                  {/* Lawyer Info */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser className="text-blue-400" />
                      <span className="text-sm font-semibold">المحامي المكلف</span>
                    </div>
                    <p className="text-sm text-slate-300">{log.assigned_lawyer.name}</p>
                  </div>
                </div>

                {/* Main Lawyer Info */}
                {log.main_lawyer.id && (
                  <div className="mt-4 bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser className="text-indigo-400" />
                      <span className="text-sm font-semibold">المحامي الرئيسي</span>
                    </div>
                    <p className="text-sm text-slate-300">{log.main_lawyer.name}</p>
                  </div>
                )}

                {/* Additional Details */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-4 bg-slate-700/30 rounded-lg p-3">
                    <span className="text-sm font-semibold mb-2 block">تفاصيل إضافية:</span>
                    <pre className="text-xs text-slate-300 overflow-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {logs.length > 0 && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">إحصائيات السجل</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{logs.length}</p>
                <p className="text-sm text-slate-400">إجمالي العمليات</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">
                  {logs.filter(l => l.action.includes('approved')).length}
                </p>
                <p className="text-sm text-slate-400">الموافقات</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">
                  {logs.filter(l => l.action === 'updated').length}
                </p>
                <p className="text-sm text-slate-400">التحديثات</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">
                  {logs.filter(l => l.action === 'created').length}
                </p>
                <p className="text-sm text-slate-400">مهام جديدة</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPage;
