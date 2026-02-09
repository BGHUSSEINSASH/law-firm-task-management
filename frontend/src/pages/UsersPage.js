import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { tasksAPI } from '../api';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    role: 'lawyer'
  });

  const roleLabels = {
    admin: 'مدير النظام',
    department_head: 'رئيس قسم',
    lawyer: 'محام',
    assistant: 'مساعد'
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-red-600 to-pink-600',
      department_head: 'from-blue-600 to-cyan-600',
      lawyer: 'from-green-600 to-emerald-600',
      assistant: 'from-yellow-600 to-orange-600'
    };
    return colors[role] || 'from-gray-600 to-slate-600';
  };

  // In-memory storage for users
  const inMemoryUsers = React.useRef([
    { id: 1, full_name: 'أحمد محمد', email: 'admin@lawfirm.com', username: 'admin', role: 'admin' },
    { id: 2, full_name: 'محمود علي', email: 'lawyer1@lawfirm.com', username: 'mahmoud', role: 'lawyer' },
    { id: 3, full_name: 'فاطمة إبراهيم', email: 'lawyer2@lawfirm.com', username: 'fatima', role: 'lawyer' },
    { id: 4, full_name: 'عمار سارة', email: 'head.contracts@lawfirm.com', username: 'amar', role: 'department_head' },
    { id: 5, full_name: 'نور يحيى', email: 'assistant1@lawfirm.com', username: 'nour', role: 'assistant' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tasksRes = await tasksAPI.getAll({});
      setTasks(tasksRes.tasks || tasksRes);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setUsers([...inMemoryUsers.current]);
  };

  const getUserStats = (userId) => {
    const createdTasks = tasks.filter(t => t.created_by === userId);
    const assignedTasks = tasks.filter(t => t.assigned_to === userId || t.main_lawyer_id === userId);
    const pendingApprovals = tasks.filter(t => {
      const user = users.find(u => u.id === userId);
      if (!user) return false;
      if (user.role === 'admin' && t.approval_status?.admin === 'pending') return true;
      if (user.role === 'department_head' && t.approval_status?.main_lawyer === 'pending' && t.main_lawyer_id === userId) return true;
      return false;
    });

    return {
      created: createdTasks.length,
      assigned: assignedTasks.length,
      pendingApprovals: pendingApprovals.length,
      completed: assignedTasks.filter(t => t.status === 'completed').length
    };
  };

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedRole) {
      filtered = filtered.filter(u => u.role === selectedRole);
    }
    setFilteredUsers(filtered);
  }, [searchTerm, selectedRole, users]);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.username.trim()) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    if (editingId) {
      // تحديث المستخدم
      setUsers(users.map(u =>
        u.id === editingId
          ? {
              ...u,
              full_name: formData.full_name,
              email: formData.email,
              username: formData.username,
              role: formData.role
            }
          : u
      ));
      inMemoryUsers.current = inMemoryUsers.current.map(u =>
        u.id === editingId
          ? {
              ...u,
              full_name: formData.full_name,
              email: formData.email,
              username: formData.username,
              role: formData.role
            }
          : u
      );
      toast.success('تم تحديث المستخدم بنجاح');
    } else {
      // إضافة مستخدم جديد
      const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username,
        role: formData.role
      };

      setUsers([...users, newUser]);
      inMemoryUsers.current.push(newUser);
      toast.success('تم إضافة المستخدم بنجاح');
    }

    setFormData({ full_name: '', email: '', username: '', role: 'lawyer' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role
    });
    setShowForm(true);
  };

  const handleDeleteUser = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    setUsers(users.filter(u => u.id !== id));
    inMemoryUsers.current = inMemoryUsers.current.filter(u => u.id !== id);
    toast.success('تم حذف المستخدم بنجاح');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">إدارة المستخدمين</h1>
              <p className="text-slate-400 text-lg">إدارة جميع مستخدمي النظام والأدوار والصلاحيات</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl flex items-center gap-2 transition duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              <FiPlus size={22} />
              إضافة مستخدم
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative">
                <FiSearch className="absolute right-4 top-4 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="ابحث باسم أو بريد إلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-slate-800 border-0 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full relative px-4 py-3 bg-slate-800 border-0 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-medium"
              >
                <option value="">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                <option value="department_head">رئيس قسم</option>
                <option value="lawyer">محام</option>
                <option value="assistant">مساعد</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ full_name: '', email: '', username: '', role: 'lawyer' });
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  <FiX size={28} />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">الاسم الكامل</label>
                    <input
                      type="text"
                      placeholder="مثال: محمد أحمد"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      placeholder="مثال: mohammad"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="مثال: user@lawfirm.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">الدور</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    >
                      <option value="lawyer">محام</option>
                      <option value="department_head">رئيس قسم</option>
                      <option value="assistant">مساعد</option>
                      <option value="admin">مدير النظام</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg transition duration-300 transform hover:scale-105 font-semibold"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 px-6 py-3 rounded-lg transition font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-purple-500 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl shadow-lg"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-purple-500/0 to-pink-600/0 group-hover:from-indigo-600/20 group-hover:via-purple-500/50 group-hover:to-pink-600/20 rounded-2xl transition duration-300 pointer-events-none"></div>

                <div className="relative">
                  {/* Avatar */}
                  <div className={`bg-gradient-to-br ${getRoleColor(user.role)} p-4 rounded-xl inline-block mb-4 border-2 border-purple-400 shadow-lg shadow-purple-500/50`}>
                    <FiUser className="text-white" size={28} />
                  </div>

                  {/* Name and Role */}
                  <h3 className="font-bold text-white text-xl mb-1">{user.full_name}</h3>
                  <p className="text-slate-400 text-sm mb-4">@{user.username}</p>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getRoleColor(user.role)}`}>
                      {roleLabels[user.role]}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-5 pb-5 border-b border-slate-700">
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="bg-slate-700 p-2 rounded-lg">
                        <FiMail size={16} className="text-slate-300" />
                      </div>
                      <span className="text-sm truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="bg-slate-700 p-2 rounded-lg">
                        <FiBriefcase size={16} className="text-slate-300" />
                      </div>
                      <span className="text-sm">معرّف: {user.id}</span>
                    </div>
                  </div>

                  {/* Task Statistics */}
                  {(() => {
                    const stats = getUserStats(user.id);
                    return (
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-slate-400 mb-1">مهام منشأة</p>
                          <p className="text-lg font-bold text-cyan-400">{stats.created}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-slate-400 mb-1">مهام مكلف بها</p>
                          <p className="text-lg font-bold text-blue-400">{stats.assigned}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-slate-400 mb-1">بانتظار الموافقة</p>
                          <p className="text-lg font-bold text-yellow-400">{stats.pendingApprovals}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-slate-400 mb-1">مكتملة</p>
                          <p className="text-lg font-bold text-green-400">{stats.completed}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleEditUser(user)}
                      className="flex-1 bg-slate-700 hover:bg-purple-600 text-slate-100 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-300 font-medium transform hover:scale-105"
                    >
                      <FiEdit2 size={16} />
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex-1 bg-slate-700 hover:bg-red-600 text-slate-100 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-300 font-medium transform hover:scale-105"
                    >
                      <FiTrash2 size={16} />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-16 text-center border border-slate-700 mb-12">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-2xl inline-block mb-6">
              <FiUser className="text-slate-400 mx-auto" size={64} />
            </div>
            <p className="text-slate-400 text-xl font-medium">لا توجد مستخدمون</p>
            <p className="text-slate-500 text-sm mt-2">ابدأ بإضافة مستخدم جديد للنظام</p>
          </div>
        )}

        {/* Role Distribution Timeline */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl shadow-2xl p-8 mb-8 border border-slate-600">
          <h2 className="text-2xl font-bold text-cyan-400 mb-8">توزيع الأدوار والأقسام الإدارية</h2>
          <div className="flex items-center justify-between relative">
            {/* Background progress line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-yellow-500 -translate-y-1/2 z-0"></div>

            {/* Role stages */}
            <div className="relative z-10 flex justify-between w-full">
              {[
                { name: 'مديرو النظام', count: users.filter(u => u.role === 'admin').length, color: 'from-red-600 to-pink-700' },
                { name: 'رؤساء الأقسام', count: users.filter(u => u.role === 'department_head').length, color: 'from-blue-600 to-cyan-700' },
                { name: 'المحامون', count: users.filter(u => u.role === 'lawyer').length, color: 'from-green-600 to-emerald-700' },
                { name: 'المساعدون', count: users.filter(u => u.role === 'assistant').length, color: 'from-yellow-600 to-orange-700' },
              ].map((role, index) => {
                const percentage = users.length > 0 ? Math.round((role.count / users.length) * 100) : 0;

                return (
                  <div key={role.name} className="flex flex-col items-center">
                    {/* Circle */}
                    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition transform shadow-xl bg-gradient-to-br ${role.color} ${
                      role.count > 0 ? 'scale-110' : 'scale-90'
                    }`}>
                      <span className="text-white font-bold text-2xl">{role.count}</span>
                      <span className="text-white text-xs">مستخدم</span>
                    </div>
                    {/* Label */}
                    <p className="mt-3 text-center font-bold text-white text-sm w-24">
                      {role.name}
                    </p>
                    {/* Percentage */}
                    {role.count > 0 && (
                      <p className="mt-1 text-xs text-cyan-400 font-semibold">
                        {percentage}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">إجمالي المستخدمين</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text">{users.length}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-700 to-slate-600 p-4 rounded-xl">
                  <FiUser className="text-slate-300" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">مديرو النظام</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="bg-gradient-to-br from-red-600 to-pink-600 p-4 rounded-xl">
                  <FiUser className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Lawyers */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">المحامون</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">{users.filter(u => u.role === 'lawyer').length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-xl">
                  <FiUser className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Department Heads */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">رؤساء الأقسام</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">{users.filter(u => u.role === 'department_head').length}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-xl">
                  <FiUser className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
