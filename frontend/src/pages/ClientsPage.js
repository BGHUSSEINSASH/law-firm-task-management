import React, { useState, useEffect } from 'react';
import { clientsAPI, tasksAPI } from '../api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiBriefcase, FiUser, FiMail, FiPhone, FiMapPin, FiActivity } from 'react-icons/fi';

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, tasksRes] = await Promise.all([
        clientsAPI.getAll(),
        tasksAPI.getAll({})
      ]);
      
      setClients(clientsRes);
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

  const getClientStats = (clientId) => {
    const clientTasks = tasks.filter(t => t.client_id === clientId);
    
    return {
      total: clientTasks.length,
      pending: clientTasks.filter(t => t.status === 'pending').length,
      inProgress: clientTasks.filter(t => t.status === 'in_progress').length,
      completed: clientTasks.filter(t => t.status === 'completed').length,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await clientsAPI.update(editingId, formData);
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await clientsAPI.create(formData);
        toast.success('تم إضافة العميل بنجاح');
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('فشلت العملية');
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      contact_person: client.contact_person,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      type: client.type
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await clientsAPI.delete(id);
        toast.success('تم حذف العميل');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'فشل الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      type: 'individual'
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const corporateClients = clients.filter(c => c.type === 'corporate');
  const individualClients = clients.filter(c => c.type === 'individual');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FiBriefcase className="text-cyan-400" />
                إدارة الشركات والعملاء
              </h1>
              <p className="text-slate-400">إدارة قاعدة العملاء والشركات المشتركة</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:scale-105"
            >
              <FiPlus /> إضافة عميل جديد
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">إجمالي العملاء</p>
                <p className="text-3xl font-bold text-white">{clients.length}</p>
              </div>
              <div className="p-4 bg-cyan-500/20 rounded-xl">
                <FiBriefcase className="text-3xl text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">شركات</p>
                <p className="text-3xl font-bold text-white">{corporateClients.length}</p>
              </div>
              <div className="p-4 bg-blue-500/20 rounded-xl">
                <FiBriefcase className="text-3xl text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">أفراد</p>
                <p className="text-3xl font-bold text-white">{individualClients.length}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-xl">
                <FiUser className="text-3xl text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">إجمالي المهام</p>
                <p className="text-3xl font-bold text-white">{tasks.length}</p>
              </div>
              <div className="p-4 bg-purple-500/20 rounded-xl">
                <FiActivity className="text-3xl text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-cyan-500/30">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">اسم العميل / الشركة *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">الشخص المسؤول *</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">نوع العميل</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                      <option value="individual">فرد</option>
                      <option value="corporate">شركة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">العنوان</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition shadow-lg"
                  >
                    {editingId ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clients List */}
        <div className="space-y-8">
          {/* Corporate Clients */}
          {corporateClients.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FiBriefcase className="text-blue-400" />
                الشركات ({corporateClients.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {corporateClients.map((client) => {
                  const stats = getClientStats(client.id);
                  return (
                    <div key={client.id} className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 shadow-2xl hover:border-blue-400/50 transition group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition">{client.name}</h3>
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <FiUser className="text-blue-400" /> {client.contact_person}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <FiBriefcase className="text-2xl text-blue-400" />
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {client.email && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <FiMail className="text-cyan-400" /> {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <FiPhone className="text-green-400" /> {client.phone}
                          </p>
                        )}
                        {client.address && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <FiMapPin className="text-orange-400" /> {client.address}
                          </p>
                        )}
                      </div>

                      {/* Tasks Statistics */}
                      <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900/50 rounded-xl mb-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">إجمالي</p>
                          <p className="text-lg font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">قيد الانتظار</p>
                          <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">قيد التنفيذ</p>
                          <p className="text-lg font-bold text-cyan-400">{stats.in_progress}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">مكتملة</p>
                          <p className="text-lg font-bold text-green-400">{stats.completed}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition"
                        >
                          <FiEdit2 /> تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
                        >
                          <FiTrash2 /> حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Clients */}
          {individualClients.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FiUser className="text-green-400" />
                العملاء الأفراد ({individualClients.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {individualClients.map((client) => {
                  const stats = getClientStats(client.id);
                  return (
                    <div key={client.id} className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-6 rounded-2xl border border-green-500/30 shadow-2xl hover:border-green-400/50 transition group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition">{client.name}</h3>
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <FiUser className="text-green-400" /> {client.contact_person}
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-xl">
                          <FiUser className="text-2xl text-green-400" />
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {client.email && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <FiMail className="text-cyan-400" /> {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <FiPhone className="text-green-400" /> {client.phone}
                          </p>
                        )}
                        {client.address && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <FiMapPin className="text-orange-400" /> {client.address}
                          </p>
                        )}
                      </div>

                      {/* Tasks Statistics */}
                      <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900/50 rounded-xl mb-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">إجمالي</p>
                          <p className="text-lg font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">قيد الانتظار</p>
                          <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">قيد التنفيذ</p>
                          <p className="text-lg font-bold text-cyan-400">{stats.in_progress}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">مكتملة</p>
                          <p className="text-lg font-bold text-green-400">{stats.completed}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition"
                        >
                          <FiEdit2 /> تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
                        >
                          <FiTrash2 /> حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {clients.length === 0 && (
            <div className="text-center py-12">
              <FiBriefcase className="text-6xl text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">لا توجد شركات مضافة بعد</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition"
              >
                إضافة أول عميل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
