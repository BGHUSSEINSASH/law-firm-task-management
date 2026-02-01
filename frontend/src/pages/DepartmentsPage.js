import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiActivity } from 'react-icons/fi';
import { departmentsAPI, tasksAPI } from '../api';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, tasksRes] = await Promise.all([
        departmentsAPI.getAll(),
        tasksAPI.getAll({})
      ]);
      
      setDepartments(deptRes);
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

  const getDepartmentStats = (deptId) => {
    const deptTasks = tasks.filter(t => t.department_id === deptId);
    return {
      total: deptTasks.length,
      pending: deptTasks.filter(t => t.status === 'pending').length,
      inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
      completed: deptTasks.filter(t => t.status === 'completed').length,
    };
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('الرجاء إدخال اسم القسم');
      return;
    }

    try {
      if (formData.id) {
        // تحديث القسم الموجود
        await departmentsAPI.update(formData.id, {
          name: formData.name,
          description: formData.description
        });
        toast.success('تم تحديث القسم بنجاح');
      } else {
        // إضافة قسم جديد
        await departmentsAPI.create({
          name: formData.name,
          description: formData.description
        });
        toast.success('تم إنشاء القسم بنجاح');
      }
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل حفظ القسم');
    }
  };

  const handleEditDepartment = (dept) => {
    setFormData({ id: dept.id, name: dept.name, description: dept.description });
    setShowForm(true);
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try {
      await departmentsAPI.delete(id);
      toast.success('تم حذف القسم بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل حذف القسم');
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-red-400 bg-clip-text text-transparent">إدارة الأقسام</h1>
              <p className="text-slate-400 text-lg">إدارة أقسام المكتب القانوني والمتطلبات</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-xl flex items-center gap-2 transition duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/50"
            >
              <FiPlus size={22} />
              إضافة قسم
            </button>
          </div>

          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative">
              <FiSearch className="absolute right-4 top-4 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن قسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-800 border-0 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {formData.id ? 'تعديل القسم' : 'إضافة قسم جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ name: '', description: '' });
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  <FiX size={28} />
                </button>
              </div>
              <form onSubmit={handleAddDepartment} className="space-y-5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">اسم القسم</label>
                  <input
                    type="text"
                    placeholder="مثال: قسم العقود"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">الوصف</label>
                  <textarea
                    placeholder="وصف القسم والمسؤوليات..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition resize-none"
                  />
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

        {/* Departments Overview with Phases */}
        {filteredDepartments.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl shadow-2xl p-8 mb-8 border border-slate-600">
            <h2 className="text-2xl font-bold text-orange-400 mb-8">مراحل الأقسام المتخصصة</h2>
            <div className="flex items-center justify-between relative">
              {/* Background progress line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 via-orange-500 to-red-500 -translate-y-1/2 z-0"></div>

              {/* Department stages */}
              <div className="relative z-10 flex justify-between w-full">
                {filteredDepartments.map((dept, index) => (
                  <div key={dept.id} className="flex flex-col items-center">
                    {/* Circle with department color gradient */}
                    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition transform shadow-xl bg-gradient-to-br from-orange-600 to-red-600 scale-110`}>
                      <FiBriefcase className="w-8 h-8 text-white mb-1" />
                      <span className="text-white text-xs font-bold">رقم {index + 1}</span>
                    </div>
                    {/* Label */}
                    <p className="mt-3 text-center font-bold text-white text-sm w-20 line-clamp-2">
                      {dept.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Departments Grid */}
        {filteredDepartments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredDepartments.map((dept) => {
              const stats = getDepartmentStats(dept.id);
              
              return (
                <div
                  key={dept.id}
                  className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-orange-500 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl shadow-lg"
                >
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-pink-500/0 to-red-600/0 group-hover:from-orange-600/20 group-hover:via-pink-500/50 group-hover:to-red-600/20 rounded-2xl transition duration-300 pointer-events-none"></div>

                  <div className="relative">
                    {/* Icon */}
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-xl inline-block mb-4 border-2 border-orange-400 shadow-lg shadow-orange-500/50">
                      <FiBriefcase className="text-white" size={28} />
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white text-2xl mb-3">{dept.name}</h3>

                    {/* Description */}
                    {dept.description && (
                      <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">{dept.description}</p>
                    )}

                    {/* Statistics */}
                    <div className="bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <FiActivity className="text-orange-400" />
                        <h4 className="text-sm font-semibold text-slate-300">إحصائيات المهام</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800 rounded-lg p-2 text-center">
                          <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
                          <p className="text-xs text-slate-400">إجمالي</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2 text-center">
                          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                          <p className="text-xs text-slate-400">مكتملة</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2 text-center">
                          <p className="text-2xl font-bold text-cyan-400">{stats.inProgress}</p>
                          <p className="text-xs text-slate-400">قيد التنفيذ</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2 text-center">
                          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                          <p className="text-xs text-slate-400">قيد الانتظار</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <button 
                        type="button"
                        onClick={() => handleEditDepartment(dept)}
                        className="flex-1 bg-slate-700 hover:bg-orange-600 text-slate-100 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-300 font-medium transform hover:scale-105"
                      >
                        <FiEdit2 size={16} />
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="flex-1 bg-slate-700 hover:bg-red-600 text-slate-100 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-300 font-medium transform hover:scale-105"
                      >
                        <FiTrash2 size={16} />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-16 text-center border border-slate-700 mb-12">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-2xl inline-block mb-6">
              <FiBriefcase className="text-slate-400 mx-auto" size={64} />
            </div>
            <p className="text-slate-400 text-xl font-medium">لا توجد أقسام</p>
            <p className="text-slate-500 text-sm mt-2">ابدأ بإضافة قسم جديد للمكتب</p>
          </div>
        )}

        {/* Stats */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">إجمالي الأقسام</p>
                <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text">{departments.length}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-xl">
                <FiBriefcase className="text-white" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
