import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUser, FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiShield, FiCheck, FiAlertCircle, FiLock, FiUnlock } from 'react-icons/fi';

export const AdminManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('لا توجد صلاحيات كافية للوصول إلى هذه الصفحة');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('admins');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Admins Management
  const [admins, setAdmins] = useState([
    { id: 1, full_name: 'أحمد محمد', email: 'admin@lawfirm.com', username: 'admin', phone: '07700000001', department: 'الإدارة العامة', permissions: ['manage_admins', 'manage_users', 'manage_permissions', 'manage_tasks', 'view_reports'], status: 'active', createdAt: '2026-01-01' },
    { id: 6, full_name: 'سارة علي', email: 'admin2@lawfirm.com', username: 'admin2', phone: '07700000002', department: 'إدارة العمليات', permissions: ['manage_users', 'manage_tasks', 'view_reports'], status: 'active', createdAt: '2026-01-15' }
  ]);

  const [users, setUsers] = useState([
    { id: 2, full_name: 'محمود علي', email: 'lawyer1@lawfirm.com', username: 'mahmoud', role: 'lawyer', phone: '07700000003', permissions: ['create_tasks', 'edit_tasks', 'approve_tasks'], status: 'active', createdAt: '2026-01-05' },
    { id: 3, full_name: 'فاطمة إبراهيم', email: 'lawyer2@lawfirm.com', username: 'fatima', role: 'lawyer', phone: '07700000004', permissions: ['create_tasks', 'edit_tasks'], status: 'active', createdAt: '2026-01-10' },
    { id: 4, full_name: 'عمار سارة', email: 'head.contracts@lawfirm.com', username: 'amar', role: 'department_head', phone: '07700000005', permissions: ['manage_department', 'approve_tasks', 'view_reports'], status: 'active', createdAt: '2026-01-08' },
    { id: 5, full_name: 'نور يحيى', email: 'assistant1@lawfirm.com', username: 'nour', role: 'assistant', phone: '07700000006', permissions: ['create_documents', 'view_tasks'], status: 'active', createdAt: '2026-01-12' }
  ]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    department: '',
    role: 'lawyer',
    password: '',
    permissions: [],
    status: 'active'
  });

  // Available Permissions
  const availablePermissions = [
    { id: 'create_tasks', label: 'إنشاء مهام', category: 'المهام' },
    { id: 'edit_tasks', label: 'تعديل المهام', category: 'المهام' },
    { id: 'delete_tasks', label: 'حذف المهام', category: 'المهام' },
    { id: 'approve_tasks', label: 'الموافقة على المهام', category: 'المهام' },
    { id: 'manage_department', label: 'إدارة القسم', category: 'الأقسام' },
    { id: 'manage_users', label: 'إدارة المستخدمين', category: 'الإدارة' },
    { id: 'manage_admins', label: 'إدارة الإداريين', category: 'الإدارة' },
    { id: 'manage_permissions', label: 'إدارة الصلاحيات', category: 'الإدارة' },
    { id: 'view_reports', label: 'عرض التقارير', category: 'التقارير' },
    { id: 'export_data', label: 'تصدير البيانات', category: 'البيانات' },
  ];

  const roles = [
    { id: 'admin', label: 'مدير نظام' },
    { id: 'department_head', label: 'رئيس قسم' },
    { id: 'lawyer', label: 'محام' },
    { id: 'assistant', label: 'مساعد' }
  ];

  // Filter and search
  const getFilteredData = () => {
    const data = activeTab === 'admins' ? admins : users;
    return data.filter(item =>
      item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle Add/Edit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.username) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingId) {
      // Edit
      if (activeTab === 'admins') {
        setAdmins(admins.map(admin => 
          admin.id === editingId ? { ...admin, ...formData } : admin
        ));
      } else {
        setUsers(users.map(u => 
          u.id === editingId ? { ...u, ...formData } : u
        ));
      }
      toast.success('تم تحديث البيانات بنجاح');
    } else {
      // Add new
      const newId = Math.max(...(activeTab === 'admins' ? admins : users).map(u => u.id), 0) + 1;
      const newItem = {
        id: newId,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        password: undefined
      };

      if (activeTab === 'admins') {
        setAdmins([...admins, newItem]);
      } else {
        setUsers([...users, newItem]);
      }
      toast.success('تم إضافة المستخدم بنجاح');
    }

    resetForm();
  };

  const handleEdit = (item) => {
    setFormData({
      full_name: item.full_name,
      email: item.email,
      username: item.username,
      phone: item.phone || '',
      department: item.department || '',
      role: item.role || 'lawyer',
      permissions: item.permissions || [],
      status: item.status || 'active'
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم؟')) {
      if (activeTab === 'admins') {
        if (id === 1) {
          toast.error('لا يمكن حذف مدير النظام الرئيسي');
          return;
        }
        setAdmins(admins.filter(admin => admin.id !== id));
      } else {
        setUsers(users.filter(u => u.id !== id));
      }
      toast.success('تم حذف المستخدم بنجاح');
    }
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      username: '',
      phone: '',
      department: '',
      role: 'lawyer',
      password: '',
      permissions: [],
      status: 'active'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getPermissionLabel = (permId) => {
    return availablePermissions.find(p => p.id === permId)?.label || permId;
  };

  const filteredData = getFilteredData();

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8" dir="rtl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">إدارة النظام</h1>
        <p className="text-slate-400 text-lg">إدارة الإداريين والمستخدمين والصلاحيات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700/50">
        <button
          onClick={() => { setActiveTab('admins'); setShowForm(false); setSearchTerm(''); }}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'admins'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <FiShield className="inline-block mr-2" size={20} />
          الإداريين
        </button>
        <button
          onClick={() => { setActiveTab('users'); setShowForm(false); setSearchTerm(''); }}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <FiUsers className="inline-block mr-2" size={20} />
          المستخدمون
        </button>
      </div>

      {/* Search and Add Button */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ابحث باسم أو بريد إلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl flex items-center gap-2 transition duration-300 shadow-lg shadow-purple-500/30 font-semibold"
        >
          <FiPlus size={20} />
          {activeTab === 'admins' ? 'إضافة إداري' : 'إضافة مستخدم'}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-700/50 my-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FiLock className="text-indigo-400" size={28} />
                {editingId ? 'تعديل بيانات المستخدم' : (activeTab === 'admins' ? 'إضافة إداري جديد' : 'إضافة مستخدم جديد')}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-white transition">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-4">المعلومات الأساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Role and Department */}
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-4">الدور والقسم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">الدور</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">القسم / الإدارة</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="مثال: إدارة العقود"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">كلمة المرور *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    required
                  />
                </div>
              )}

              {/* Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-4">الصلاحيات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-700/20 rounded-lg border border-slate-700/50">
                  {availablePermissions.map(perm => (
                    <label key={perm.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-slate-500 accent-indigo-500"
                      />
                      <div>
                        <p className="text-white font-medium">{perm.label}</p>
                        <p className="text-xs text-slate-400">{perm.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">الحالة</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="suspended">موقوف</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-700/50">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition duration-300"
                >
                  <FiCheck className="inline-block mr-2" size={18} />
                  {editingId ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* User Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FiUser className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.full_name}</h3>
                      <p className="text-sm text-slate-400">@{item.username}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : item.status === 'inactive'
                          ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {item.status === 'active' ? 'نشط' : item.status === 'inactive' ? 'غير نشط' : 'موقوف'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-700/50">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">البريد الإلكتروني</p>
                      <p className="text-white font-medium">{item.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">رقم الهاتف</p>
                      <p className="text-white font-medium">{item.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">القسم</p>
                      <p className="text-white font-medium">{item.department || '-'}</p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="text-xs text-slate-400 mb-3 font-semibold">الصلاحيات:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.permissions?.length > 0 ? (
                        item.permissions.map(perm => (
                          <span
                            key={perm}
                            className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <FiCheck size={14} />
                            {getPermissionLabel(perm)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs italic">لم يتم تحديد صلاحيات</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition border border-cyan-500/30"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={item.id === 1}
                    className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Created At */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500">
                  تم الإنشاء: {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <FiAlertCircle className="text-5xl text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">لا توجد نتائج</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagementPage;
