import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiGrid, FiList, FiDownload } from 'react-icons/fi';

const TasksKanbanPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // kanban or list
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    department: '',
    assignedTo: ''
  });
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [tasksRes, depsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tasks', { headers }),
        axios.get('http://localhost:5000/api/departments', { headers }),
        axios.get('http://localhost:5000/api/users', { headers })
      ]);

      setTasks(tasksRes.data.tasks || []);
      setDepartments(depsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = tasks;

    if (filters.search) {
      filtered = filtered.filter(t =>
        t.title.includes(filters.search) ||
        t.task_code.includes(filters.search) ||
        t.description?.includes(filters.search)
      );
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.department) {
      filtered = filtered.filter(t => t.department_id === parseInt(filters.department));
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(t => t.assigned_to === parseInt(filters.assignedTo));
    }

    setFilteredTasks(filtered);
  }, [filters, tasks]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    const csv = [
      ['الرمز', 'العنوان', 'الحالة', 'الأولوية', 'القسم', 'المحامي', 'تاريخ الإنشاء'],
      ...filteredTasks.map(t => [
        t.task_code,
        t.title,
        getStatusLabel(t.status),
        getPriorityLabel(t.priority),
        departments.find(d => d.id === t.department_id)?.name || '',
        users.find(u => u.id === t.assigned_to)?.full_name || '',
        new Date(t.created_at).toLocaleDateString('ar-SA')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tasks_${new Date().getTime()}.csv`;
    link.click();
  };

  const TaskCard = ({ task }) => {
    const dept = departments.find(d => d.id === task.department_id);
    const user = users.find(u => u.id === task.assigned_to);

    return (
      <div className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition border-r-4" style={{ borderRightColor: getPriorityColor(task.priority) }}>
        <div className="mb-2">
          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {task.task_code}
          </span>
        </div>
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{task.title}</h3>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>

        <div className="space-y-2 text-xs">
          {dept && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">القسم:</span>
              <span className="text-gray-600">{dept.name}</span>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">المحامي:</span>
              <span className="text-gray-600">{user.full_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="font-semibold">الأولوية:</span>
            <span className={`px-2 py-1 rounded text-white text-xs ${getPriorityBg(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
          </div>
        </div>

        {task.approval_status !== 'approved' && (
          <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-700 border border-orange-200">
            ⚠️ في انتظار الموافقة: {getApprovalLabel(task.approval_status)}
          </div>
        )}
      </div>
    );
  };

  const KanbanView = () => {
    const statuses = ['pending', 'in_progress', 'completed'];
    const statusLabels = { pending: 'معلقة', in_progress: 'قيد التنفيذ', completed: 'مكتملة' };
    const statusColors = { pending: 'bg-yellow-50', in_progress: 'bg-blue-50', completed: 'bg-green-50' };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
        {statuses.map(status => {
          const statusTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div key={status} className={`${statusColors[status]} rounded-xl p-4`}>
              <div className="mb-4">
                <h3 className="font-bold text-gray-800">{statusLabels[status]}</h3>
                <p className="text-sm text-gray-600">{statusTasks.length} مهمة</p>
              </div>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>لا توجد مهام</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ListView = () => {
    return (
      <div className="space-y-3 pb-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition border-l-4" style={{ borderLeftColor: getPriorityColor(task.priority) }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {task.task_code}
                  </span>
                  <h3 className="font-semibold text-gray-800">{task.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  {departments.find(d => d.id === task.department_id) && (
                    <span>القسم: {departments.find(d => d.id === task.department_id)?.name}</span>
                  )}
                  {users.find(u => u.id === task.assigned_to) && (
                    <span>المحامي: {users.find(u => u.id === task.assigned_to)?.full_name}</span>
                  )}
                  <span>الأولوية: {getPriorityLabel(task.priority)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBg(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
                {task.approval_status !== 'approved' && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    موافقة معلقة
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">المهام</h1>
          <p className="text-gray-600">إدارة وتتبع المهام والعمليات</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <div className="relative">
                <FiSearch className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن مهمة..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">الكل</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">الكل</option>
                <option value="pending">معلقة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <option value="">الكل</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Assigned To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المحامي</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              >
                <option value="">الكل</option>
                {users.filter(u => u.role === 'lawyer').map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  viewMode === 'kanban'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiGrid /> Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiList /> List
              </button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <FiDownload /> تصدير CSV
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          عدد النتائج: <span className="font-bold">{filteredTasks.length}</span>
        </div>

        {/* Tasks View */}
        {viewMode === 'kanban' ? <KanbanView /> : <ListView />}
      </div>
    </div>
  );
};

// Helper functions
const getStatusLabel = (status) => {
  const labels = { pending: 'معلقة', in_progress: 'قيد التنفيذ', completed: 'مكتملة' };
  return labels[status] || status;
};

const getStatusBg = (status) => {
  const colors = { pending: 'bg-yellow-500', in_progress: 'bg-blue-500', completed: 'bg-green-500' };
  return colors[status] || 'bg-gray-500';
};

const getPriorityLabel = (priority) => {
  const labels = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
  return labels[priority] || priority;
};

const getPriorityColor = (priority) => {
  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  return colors[priority] || '#6b7280';
};

const getPriorityBg = (priority) => {
  const colors = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500' };
  return colors[priority] || 'bg-gray-500';
};

const getApprovalLabel = (status) => {
  const labels = {
    pending_admin: 'الإدارة',
    pending_main_lawyer: 'المحامي الرئيسي',
    pending_assigned_lawyer: 'المحامي المكلف'
  };
  return labels[status] || 'غير محدد';
};

export default TasksKanbanPage;
