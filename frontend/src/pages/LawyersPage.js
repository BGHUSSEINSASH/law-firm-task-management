import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiPlus, FiEdit2, FiTrash2, FiSearch, FiAward, FiX, FiActivity } from 'react-icons/fi';
import { lawyersAPI, tasksAPI } from '../api';

export const LawyersPage = () => {
  const [lawyers, setLawyers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    specialization: 'عقود',
    max_tasks: 10
  });

  // In-memory storage for lawyers
  const inMemoryLawyers = React.useRef([
    {
      id: 1,
      user: { id: 2, full_name: 'محمود علي', email: 'lawyer1@lawfirm.com', username: 'mahmoud' },
      specialization: 'عقود',
      current_tasks: 5,
      max_tasks: 10
    },
    {
      id: 2,
      user: { id: 3, full_name: 'فاطمة إبراهيم', email: 'lawyer2@lawfirm.com', username: 'fatima' },
      specialization: 'قضايا',
      current_tasks: 8,
      max_tasks: 10
    },
    {
      id: 3,
      user: { id: 4, full_name: 'علي حسن', email: 'lawyer3@lawfirm.com', username: 'ali' },
      specialization: 'استشارات',
      current_tasks: 3,
      max_tasks: 10
    },
    {
      id: 4,
      user: { id: 5, full_name: 'أماني سارة', email: 'lawyer4@lawfirm.com', username: 'amani' },
      specialization: 'جنائي',
      current_tasks: 7,
      max_tasks: 10
    },
    {
      id: 5,
      user: { id: 6, full_name: 'خالد محمود', email: 'lawyer5@lawfirm.com', username: 'khaled' },
      specialization: 'مدني',
      current_tasks: 2,
      max_tasks: 10
    }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lawyersRes, tasksRes] = await Promise.all([
        lawyersAPI.getAll(),
        tasksAPI.getAll({})
      ]);
      
      setLawyers(lawyersRes);
      if (tasksRes.tasks) {
        setTasks(tasksRes.tasks);
      } else if (Array.isArray(tasksRes)) {
        setTasks(tasksRes);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('فشل تحميل البيانات');
      setLoading(false);
    }
  };

  const getLawyerStats = (lawyerId) => {
    const assignedTasks = tasks.filter(t => t.assigned_to === lawyerId);
    const mainLawyerTasks = tasks.filter(t => t.main_lawyer_id === lawyerId);
    const allTasks = [...new Set([...assignedTasks, ...mainLawyerTasks])];
    
    return {
      assigned: assignedTasks.length,
      mainLawyer: mainLawyerTasks.length,
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      needsApproval: assignedTasks.filter(t => t.approval_status === 'pending_assigned_lawyer').length,
    };
  };

  const handleAddLawyer = (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    if (editingId) {
      // تحديث المحام
      setLawyers(lawyers.map(l => 
        l.id === editingId
          ? {
              ...l,
              user: { ...l.user, full_name: formData.full_name, email: formData.email },
              specialization: formData.specialization,
              max_tasks: parseInt(formData.max_tasks)
            }
          : l
      ));
      inMemoryLawyers.current = inMemoryLawyers.current.map(l =>
        l.id === editingId
          ? {
              ...l,
              user: { ...l.user, full_name: formData.full_name, email: formData.email },
              specialization: formData.specialization,
              max_tasks: parseInt(formData.max_tasks)
            }
          : l
      );
      toast.success('تم تحديث المحام بنجاح');
    } else {
      // إضافة محام جديد
      const newLawyer = {
        id: Math.max(...lawyers.map(l => l.id), 0) + 1,
        user: {
          id: Math.max(...lawyers.map(l => l.user.id), 0) + 1,
          full_name: formData.full_name,
          email: formData.email,
          username: formData.full_name.split(' ')[0].toLowerCase()
        },
        specialization: formData.specialization,
        current_tasks: 0,
        max_tasks: parseInt(formData.max_tasks)
      };

      setLawyers([...lawyers, newLawyer]);
      inMemoryLawyers.current.push(newLawyer);
      toast.success('تم إضافة المحام بنجاح');
    }
    
    setFormData({ full_name: '', email: '', specialization: 'عقود', max_tasks: 10 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditLawyer = (lawyer) => {
    setEditingId(lawyer.id);
    setFormData({
      full_name: lawyer.user.full_name,
      email: lawyer.user.email,
      specialization: lawyer.specialization,
      max_tasks: lawyer.max_tasks
    });
    setShowForm(true);
  };

  const handleDeleteLawyer = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المحام؟')) return;
    setLawyers(lawyers.filter(l => l.id !== id));
    inMemoryLawyers.current = inMemoryLawyers.current.filter(l => l.id !== id);
    toast.success('تم حذف المحام بنجاح');
  };

  const filteredLawyers = lawyers.filter(l =>
    (l.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSpecializationColor = (spec) => {
    const colors = {
      'عقود': 'from-purple-500 to-purple-600 border-purple-200',
      'قضايا': 'from-red-500 to-red-600 border-red-200',
      'استشارات': 'from-green-500 to-green-600 border-green-200',
      'جنائي': 'from-blue-500 to-blue-600 border-blue-200',
      'مدني': 'from-yellow-500 to-yellow-600 border-yellow-200',
    };
    return colors[spec] || 'from-gray-500 to-gray-600 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">إدارة المحامين</h1>
              <p className="text-slate-400 text-lg">إدارة الملفات الشخصية والتخصصات والمهام الموكلة</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl flex items-center gap-2 transition duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/50"
            >
              <FiPlus size={22} />
              إضافة محام
            </button>
          </div>

          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative">
              <FiSearch className="absolute right-4 top-4 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن محام أو تخصص..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-800 border-0 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'تعديل المحام' : 'إضافة محام جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ full_name: '', email: '', specialization: 'عقود', max_tasks: 10 });
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  <FiX size={28} />
                </button>
              </div>
              <form onSubmit={handleAddLawyer} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">الاسم الكامل</label>
                    <input
                      type="text"
                      placeholder="مثال: محمود علي"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="مثال: lawyer@lawfirm.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">التخصص</label>
                    <select
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    >
                      <option>عقود</option>
                      <option>قضايا</option>
                      <option>استشارات</option>
                      <option>جنائي</option>
                      <option>مدني</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2">الحد الأقصى للمهام</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.max_tasks}
                      onChange={(e) => setFormData({ ...formData, max_tasks: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
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

        {/* Lawyers Grid */}
        {filteredLawyers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-cyan-500 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl shadow-lg"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-500/0 to-teal-600/0 group-hover:from-blue-600/20 group-hover:via-cyan-500/50 group-hover:to-teal-600/20 rounded-2xl transition duration-300 pointer-events-none"></div>

                <div className="relative">
                  {/* Avatar */}
                  <div className={`bg-gradient-to-br ${getSpecializationColor(lawyer.specialization)} p-4 rounded-xl inline-block mb-4 border-2`}>
                    <FiUser className="text-white" size={28} />
                  </div>

                  {/* Name and Role */}
                  <h3 className="font-bold text-white text-xl mb-1">{lawyer.user?.full_name || 'N/A'}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getSpecializationColor(lawyer.specialization)}`}>
                      {lawyer.specialization}
                    </span>
                  </div>

                  {/* Email */}
                  <p className="text-slate-400 text-sm mb-5 truncate">{lawyer.user?.email}</p>

                  {/* Tasks Progress with Stages */}
                  <div className="mb-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm font-medium">المهام الموكلة</span>
                      <span className="text-cyan-400 font-bold">{lawyer.current_tasks}/{lawyer.max_tasks}</span>
                    </div>
                    
                    {/* Main progress bar */}
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 rounded-full shadow-lg shadow-cyan-500/50"
                        style={{ width: `${(lawyer.current_tasks / lawyer.max_tasks) * 100}%` }}
                      ></div>
                    </div>

                    {/* Stage indicators */}
                    <div className="flex items-center gap-1 justify-between text-xs">
                      {['0%', '33%', '66%', '100%'].map((stage, idx) => (
                        <div
                          key={stage}
                          className={`flex-1 h-1.5 rounded transition ${
                            (lawyer.current_tasks / lawyer.max_tasks) * 100 >= idx * 33
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                              : 'bg-slate-700'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Workload Status */}
                  <div className="mb-6 p-3 rounded-lg bg-slate-900/50 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">حالة الحمل:</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        (lawyer.current_tasks / lawyer.max_tasks) >= 0.9
                          ? 'bg-red-500/20 text-red-400'
                          : (lawyer.current_tasks / lawyer.max_tasks) >= 0.7
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {(lawyer.current_tasks / lawyer.max_tasks) >= 0.9
                          ? '⚠️ حمل ثقيل'
                          : (lawyer.current_tasks / lawyer.max_tasks) >= 0.7
                          ? '⚡ حمل متوسط'
                          : '✓ متاح'}
                      </span>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-cyan-400">
                        {Math.round((lawyer.current_tasks / lawyer.max_tasks) * 100)}%
                      </span>
                      <p className="text-slate-500 text-xs">معدل الإشغال</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-700">
                    <button 
                      type="button"
                      onClick={() => handleEditLawyer(lawyer)}
                      className="flex-1 bg-slate-700 hover:bg-blue-600 text-slate-100 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-300 font-medium transform hover:scale-105"
                    >
                      <FiEdit2 size={16} />
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLawyer(lawyer.id)}
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
              <FiAward className="text-slate-400 mx-auto" size={64} />
            </div>
            <p className="text-slate-400 text-xl font-medium">لا يوجد محامون</p>
            <p className="text-slate-500 text-sm mt-2">ابدأ بإضافة محام جديد للنظام</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Lawyers */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">إجمالي المحامين</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">{lawyers.length}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-xl">
                  <FiUser className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Average Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">متوسط المهام</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {lawyers.length > 0 ? (lawyers.reduce((sum, l) => sum + l.current_tasks, 0) / lawyers.length).toFixed(1) : 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-xl">
                  <FiAward className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Total Tasks Assigned */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">إجمالي المهام</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                    {lawyers.reduce((sum, l) => sum + l.current_tasks, 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-xl">
                  <FiAward className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyersPage;
