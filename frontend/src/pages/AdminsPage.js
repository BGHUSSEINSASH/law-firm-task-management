import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI, lawyersAPI, departmentsAPI } from '../api';
import toast from 'react-hot-toast';
import { FiUsers, FiCheckCircle, FiClock, FiAward, FiActivity, FiPlus, FiX } from 'react-icons/fi';

export const AdminsPage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    department_id: '',
    phone: '',
    specialization: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lawyersRes, tasksRes, depsRes] = await Promise.all([
        lawyersAPI.getAll(),
        tasksAPI.getAll({}),
        departmentsAPI.getAll(),
      ]);

      // Filter only admins and department heads
      const adminUsers = lawyersRes.filter(l => l.role === 'admin' || l.role === 'department_head');
      setAdmins(adminUsers);
      
      if (tasksRes.tasks) {
        setTasks(tasksRes.tasks);
      } else if (Array.isArray(tasksRes)) {
        setTasks(tasksRes);
      }

      setDepartments(depsRes);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    try {
      await lawyersAPI.create({
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null
      });
      
      toast.success('تم إضافة الإداري بنجاح');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        department_id: '',
        phone: '',
        specialization: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error(error.response?.data?.message || 'فشل إضافة الإداري');
    }
  };

  const getAdminStats = (adminId) => {
    const createdTasks = tasks.filter(t => t.created_by === adminId);
    const approvedTasks = tasks.filter(t => t.approved_by_admin === adminId);
    const pendingApproval = tasks.filter(t => 
      t.approval_status === 'pending_admin' && 
      (t.created_by === adminId || user?.role === 'admin')
    );
    const completedTasks = createdTasks.filter(t => t.status === 'completed');
    const inProgressTasks = createdTasks.filter(t => t.status === 'in_progress');
    const pendingTasks = createdTasks.filter(t => t.status === 'pending');

    return {
      totalCreated: createdTasks.length,
      totalApproved: approvedTasks.length,
      pendingApproval: pendingApproval.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      pending: pendingTasks.length,
      completionRate: createdTasks.length > 0 
        ? Math.round((completedTasks.length / createdTasks.length) * 100) 
        : 0,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">قسم الإداريين</h1>
              <p className="text-gray-600">إدارة ومتابعة أنشطة الإداريين ورؤساء الأقسام</p>
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-5 h-5" />
              <span className="font-semibold">إضافة إداري جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-medium">إجمالي الإداريين</p>
              <p className="text-4xl font-bold mt-2">{admins.length}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FiUsers className="w-8 h-8" />
            </div>
          </div>
          <div className="text-purple-100 text-sm">
            {admins.filter(a => a.role === 'admin').length} مديرين • {admins.filter(a => a.role === 'department_head').length} رؤساء أقسام
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">المهام المُنشأة</p>
              <p className="text-4xl font-bold mt-2">{tasks.length}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FiActivity className="w-8 h-8" />
            </div>
          </div>
          <div className="text-blue-100 text-sm">
            إجمالي المهام في النظام
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">الموافقات المُنجزة</p>
              <p className="text-4xl font-bold mt-2">
                {tasks.filter(t => t.approved_by_admin).length}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-8 h-8" />
            </div>
          </div>
          <div className="text-green-100 text-sm">
            موافقات إدارية مكتملة
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium">بانتظار الموافقة</p>
              <p className="text-4xl font-bold mt-2">
                {tasks.filter(t => t.approval_status === 'pending_admin').length}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FiClock className="w-8 h-8" />
            </div>
          </div>
          <div className="text-orange-100 text-sm">
            مهام تحتاج موافقة إدارية
          </div>
        </div>
      </div>

      {/* Admins List */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FiAward className="text-purple-600" />
          قائمة الإداريين وإحصائياتهم
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin) => {
            const stats = getAdminStats(admin.id);
            
            return (
              <div
                key={admin.id}
                className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200 hover:border-purple-400 transition cursor-pointer shadow-md hover:shadow-xl"
                onClick={() => setSelectedAdmin(selectedAdmin?.id === admin.id ? null : admin)}
              >
                {/* Admin Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      admin.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                    }`}>
                      {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{admin.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        admin.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.role === 'admin' ? 'مدير' : 'رئيس قسم'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4 space-y-1 text-sm text-gray-600">
                  <p>📧 {admin.email}</p>
                  {admin.phone && <p>📱 {admin.phone}</p>}
                  {admin.department && <p>🏛️ {admin.department}</p>}
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalCreated}</p>
                    <p className="text-xs text-gray-600">مهام مُنشأة</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.totalApproved}</p>
                    <p className="text-xs text-gray-600">موافقات</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                    <p className="text-xs text-gray-600">مكتملة</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</p>
                    <p className="text-xs text-gray-600">قيد الموافقة</p>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">جاري التنفيذ</span>
                    <span className="font-semibold text-cyan-600">{stats.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">قيد الانتظار</span>
                    <span className="font-semibold text-yellow-600">{stats.pending}</span>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="mt-4 pt-4 border-t border-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">معدل الإنجاز</span>
                    <span className="text-sm font-bold text-green-600">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expand Indicator */}
                {selectedAdmin?.id === admin.id && (
                  <div className="mt-4 text-center">
                    <span className="text-xs text-purple-600 font-medium">▼ عرض التفاصيل أدناه</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Admin Details */}
      {selectedAdmin && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-purple-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedAdmin.name?.charAt(0)?.toUpperCase()}
              </div>
              المهام المُنشأة بواسطة: {selectedAdmin.name}
            </h2>
            <button
              onClick={() => setSelectedAdmin(null)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tasks
              .filter(t => t.created_by === selectedAdmin.id)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg p-4 shadow border-l-4 border-purple-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          #{task.task_code}
                        </span>
                        <h3 className="font-bold text-gray-800">{task.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-500">الحالة:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {task.status === 'completed' ? 'مكتملة' : task.status === 'in_progress' ? 'جاري التنفيذ' : 'قيد الانتظار'}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-gray-500">الأولوية:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-gray-500">الموافقة:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        task.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                        task.approval_status === 'pending_admin' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.approval_status === 'approved' ? 'معتمدة' :
                         task.approval_status === 'pending_admin' ? 'بانتظار الإدارة' :
                         task.approval_status === 'pending_main_lawyer' ? 'بانتظار المحامي الرئيسي' :
                         'بانتظار المحامي المكلف'}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-gray-500">📅 الاستحقاق:</span>
                      <span className="ml-2 text-gray-700 font-medium text-xs">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' }) : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t">
                    <span>🕐 أُنشئت: {new Date(task.created_at).toLocaleDateString('ar-IQ')}</span>
                    {task.approved_by_admin && (
                      <span className="text-green-600">✓ تمت الموافقة الإدارية</span>
                    )}
                  </div>
                </div>
              ))}

            {tasks.filter(t => t.created_by === selectedAdmin.id).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">لا توجد مهام مُنشأة من قبل هذا الإداري</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Admins State */}
      {admins.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">لا يوجد إداريين في النظام</p>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiPlus className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">إضافة إداري جديد</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    required
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    required
                    placeholder="example@lawfirm.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    placeholder="07XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الدور الوظيفي *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    required
                  >
                    <option value="admin">مدير عام</option>
                    <option value="department_head">رئيس قسم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    القسم
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                  >
                    <option value="">-- اختر القسم --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    التخصص
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    placeholder="مثال: إدارة عامة، إدارة مالية..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold shadow-lg hover:shadow-xl"
                >
                  إضافة الإداري
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsPage;
