import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, departmentsAPI, lawyersAPI, clientsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiCircle, FiArrowRight, FiFile, FiEye } from 'react-icons/fi';
import TaskFilesManager from '../components/TaskFilesManager';

export const TasksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApproval, setFilterApproval] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    department_id: '',
    main_lawyer_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
  });

  const taskStages = [
    { id: 1, name: 'قيد الانتظار', value: 'pending', color: 'from-yellow-600 to-yellow-700', icon: 'pending' },
    { id: 2, name: 'جاري التنفيذ', value: 'in_progress', color: 'from-blue-600 to-blue-700', icon: 'progress' },
    { id: 3, name: 'مكتملة', value: 'completed', color: 'from-green-600 to-green-700', icon: 'completed' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, depRes, lawyersRes, clientsRes] = await Promise.all([
        tasksAPI.getAll({}),
        departmentsAPI.getAll(),
        lawyersAPI.getAll(),
        clientsAPI.getAll(),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setDepartments(depRes.data.departments || []);
      setLawyers(lawyersRes.data.lawyers || []);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await tasksAPI.update(editingId, formData);
        toast.success('تم تحديث المهمة بنجاح');
      } else {
        await tasksAPI.create(formData);
        toast.success('تم إنشاء المهمة بنجاح');
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل حفظ المهمة');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل تريد حذف هذه المهمة؟')) {
      try {
        await tasksAPI.delete(id);
        toast.success('تم حذف المهمة بنجاح');
        fetchData();
      } catch (error) {
        toast.error('فشل حذف المهمة');
      }
    }
  };

  const handleApproveAdmin = async (id) => {
    try {
      await tasksAPI.approveByAdmin(id);
      toast.success('تمت موافقة الإدارة');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل موافقة الإدارة');
    }
  };

  const handleApproveMainLawyer = async (id) => {
    try {
      await tasksAPI.approveByMainLawyer(id);
      toast.success('تمت موافقة المحامي الرئيسي');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل موافقة المحامي الرئيسي');
    }
  };

  const handleApproveAssignedLawyer = async (id) => {
    try {
      await tasksAPI.approveByAssignedLawyer(id);
      toast.success('تمت موافقة المحامي المكلف');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل موافقة المحامي المكلف');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      client_id: '',
      department_id: '',
      main_lawyer_id: '',
      assigned_to: '',
      priority: 'medium',
      due_date: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المهام</h1>
          <p className="text-slate-600 mt-1">نظام تتبع المهام والموافقات القانونية</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiPlus /> مهمة جديدة
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي المهام</p>
              <p className="text-3xl font-bold mt-1">{tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              📋
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">قيد الانتظار</p>
              <p className="text-3xl font-bold mt-1">{tasks.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              ⏳
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">جاري التنفيذ</p>
              <p className="text-3xl font-bold mt-1">{tasks.filter(t => t.status === 'in_progress').length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              🔄
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">مكتملة</p>
              <p className="text-3xl font-bold mt-1">{tasks.filter(t => t.status === 'completed').length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">بانتظار موافقة الإدارة</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {tasks.filter(t => t.approval_status === 'pending_admin').length}
              </p>
            </div>
            <div className="text-3xl">🔐</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">بانتظار المحامي الرئيسي</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {tasks.filter(t => t.approval_status === 'pending_main_lawyer').length}
              </p>
            </div>
            <div className="text-3xl">👔</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">معتمدة بالكامل</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {tasks.filter(t => t.approval_status === 'approved').length}
              </p>
            </div>
            <div className="text-3xl">✓</div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">عنوان المهمة</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">الشركة / العميل *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">اختر العميل</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.type === 'corporate' ? '🏢' : '👤'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">القسم *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">اختر قسماً</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">المحامي الرئيسي *</label>
                <select
                  value={formData.main_lawyer_id}
                  onChange={(e) => setFormData({ ...formData, main_lawyer_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">اختر المحامي الرئيسي</option>
                  {lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.user_id}>
                      {lawyer.full_name || lawyer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">المحامي المكلف *</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">اختر محامياً</option>
                  {lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.user_id}>
                      {lawyer.full_name || lawyer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">الأولوية</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">عادية</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">موعد الاستحقاق</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 البحث والفلترة</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">بحث</label>
            <input
              type="text"
              placeholder="ابحث عن مهمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الموافقة</label>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              <option value="pending_admin">بانتظار موافقة الإدارة</option>
              <option value="pending_main_lawyer">بانتظار المحامي الرئيسي</option>
              <option value="pending_assigned_lawyer">بانتظار المحامي المكلف</option>
              <option value="approved">معتمدة</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterApproval('all');
                setFilterPriority('all');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Grid with Stage Progress */}
      <div className="space-y-8">
        {/* Overall Progress */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl shadow-2xl p-8 border border-slate-600">
          <h2 className="text-2xl font-bold text-cyan-400 mb-8">مسار تطور المهام</h2>
          <div className="flex items-center justify-between relative">
            {/* Background progress line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 via-cyan-500 to-slate-600 -translate-y-1/2 z-0"></div>

            {/* Stage circles */}
            <div className="relative z-10 flex justify-between w-full">
              {taskStages.map((stage, index) => {
                const tasksInStage = tasks.filter(t => t.status === stage.value).length;
                const stageIndex = taskStages.findIndex(s => s.value === stage.value);
                const avgStage = tasks.length > 0 
                  ? Math.round(tasks.reduce((sum, t) => sum + taskStages.findIndex(s => s.value === t.status), 0) / tasks.length)
                  : 0;

                return (
                  <div key={stage.id} className="flex flex-col items-center">
                    <div
                      className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition transform shadow-lg ${
                        stageIndex <= avgStage
                          ? `bg-gradient-to-br ${stage.color} scale-110 shadow-lg`
                          : 'bg-slate-700 scale-100'
                      }`}
                    >
                      <FiCheckCircle className="w-6 h-6 text-white mb-1" />
                      <span className="text-white font-bold text-lg">{tasksInStage}</span>
                    </div>
                    <p className="mt-3 text-center font-semibold text-slate-300 text-sm w-20">
                      {stage.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks by Stage */}
        {taskStages.map((stage) => {
          let stageTasks = tasks.filter(t => t.status === stage.value);
          
          // Apply filters
          if (searchTerm) {
            stageTasks = stageTasks.filter(t => 
              t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.task_code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          if (filterApproval !== 'all') {
            stageTasks = stageTasks.filter(t => t.approval_status === filterApproval);
          }
          
          if (filterPriority !== 'all') {
            stageTasks = stageTasks.filter(t => t.priority === filterPriority);
          }
          
          return stageTasks.length > 0 ? (
            <div key={stage.id}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${stage.color}`}></div>
                <h3 className={`text-2xl font-bold bg-gradient-to-r ${stage.color} bg-clip-text text-transparent`}>
                  {stage.name} ({stageTasks.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stageTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    stage={stage}
                    clients={clients}
                    departments={departments}
                    user={user}
                    navigate={navigate}
                    setEditingId={setEditingId}
                    setFormData={setFormData}
                    setShowForm={setShowForm}
                    handleDelete={handleDelete}
                    handleApproveAdmin={handleApproveAdmin}
                    handleApproveMainLawyer={handleApproveMainLawyer}
                    handleApproveAssignedLawyer={handleApproveAssignedLawyer}
                    setSelectedTask={setSelectedTask}
                    setShowTaskDetails={setShowTaskDetails}
                  />
                ))}
              </div>
            </div>
          ) : null;
        })}

        {tasks.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-slate-600">
            <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">لا توجد مهام - رائع! ✓</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                  <p className="text-blue-100 mt-2">{selectedTask.description}</p>
                </div>
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="text-white hover:text-blue-100 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Task Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 font-semibold">الحالة</label>
                  <p className="text-gray-800 mt-1">{getStatusLabel(selectedTask.status)}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">الأولوية</label>
                  <p className="text-gray-800 mt-1">{getPriorityLabel(selectedTask.priority)}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">القسم</label>
                  <p className="text-gray-800 mt-1">{selectedTask.department_id || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">الموعد</label>
                  <p className="text-gray-800 mt-1">
                    {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </p>
                </div>
              </div>

              {/* Files Manager */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiFile /> الملفات والمستندات
                </h3>
                <TaskFilesManager taskId={selectedTask.id} />
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 flex gap-4">
                <button
                  onClick={() => {
                    setEditingId(selectedTask.id);
                    setFormData(selectedTask);
                    setShowForm(true);
                    setShowTaskDetails(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <FiEdit2 /> تعديل
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedTask.id);
                    setShowTaskDetails(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <FiTrash2 /> حذف
                </button>
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskCard = ({
  task,
  stage,
  user,
  navigate,
  setEditingId,
  setFormData,
  setShowForm,
  handleDelete,
  handleApproveAdmin,
  handleApproveMainLawyer,
  handleApproveAssignedLawyer,
  setSelectedTask,
  setShowTaskDetails,
  clients = [],
  departments = [],
}) => {
  const [creator, setCreator] = React.useState(null);
  const [mainLawyer, setMainLawyer] = React.useState(null);
  const [assignedLawyer, setAssignedLawyer] = React.useState(null);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const creatorsRes = await lawyersAPI.getAll();
        const allUsers = creatorsRes;
        if (task.created_by) {
          setCreator(allUsers.find(u => u.id === task.created_by));
        }
        if (task.main_lawyer_id) {
          setMainLawyer(allUsers.find(u => u.id === task.main_lawyer_id));
        }
        if (task.assigned_to) {
          setAssignedLawyer(allUsers.find(u => u.id === task.assigned_to));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [task.created_by, task.main_lawyer_id, task.assigned_to]);
  const taskStages = [
    { value: 'pending', name: 'قيد الانتظار' },
    { value: 'in_progress', name: 'جاري التنفيذ' },
    { value: 'completed', name: 'مكتملة' },
  ];

  const currentStageIndex = taskStages.findIndex(s => s.value === task.status);
  const client = clients.find(c => c.id === task.client_id);
  const department = departments.find(d => d.id === task.department_id);

  return (
    <div className={`rounded-xl shadow-2xl p-6 transition transform hover:scale-105 border-2 ${
      task.status === 'completed' 
        ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-green-500 shadow-green-500/30' 
        : task.status === 'in_progress'
        ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500 shadow-blue-500/30'
        : 'bg-gradient-to-br from-slate-800 to-slate-700 border-yellow-600 shadow-yellow-600/20'
    }`}>
      {/* Task Code Badge */}
      {task.task_code && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-mono font-bold border border-cyan-500/40">
            #{task.task_code}
          </span>
        </div>
      )}

      {/* Title */}
      <div className="mb-4 cursor-pointer group" onClick={() => {
        setSelectedTask(task);
        setShowTaskDetails(true);
      }}>
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-bold text-lg group-hover:text-cyan-300 transition ${task.status === 'completed' ? 'text-green-300 line-through' : 'text-white'}`}>
            {task.title}
          </h3>
          {task.files && task.files.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-semibold border border-orange-500/40">
              <FiFile className="w-3 h-3" />
              {task.files.length}
            </span>
          )}
        </div>

        {/* Client Info */}
        {client && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-slate-400 text-sm">
              {client.type === 'corporate' ? '🏢' : '👤'} {client.name}
            </span>
          </div>
        )}

        {/* Department Info */}
        {department && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-slate-400 text-xs">
              🏛️ {department.name}
            </span>
          </div>
        )}

        {/* Creator Info */}
        {creator && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 text-xs font-medium">
              ✏️ منشئ المهمة: {creator.name}
            </span>
          </div>
        )}

        {/* Team Info */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {mainLawyer && (
            <div className="flex items-center gap-1 bg-blue-500/10 rounded px-2 py-1">
              <span className="text-blue-400 text-xs">
                👔 محامي رئيسي:
              </span>
              <span className="text-blue-300 text-xs font-medium">
                {mainLawyer.name}
              </span>
            </div>
          )}
          {assignedLawyer && (
            <div className="flex items-center gap-1 bg-green-500/10 rounded px-2 py-1">
              <span className="text-green-400 text-xs">
                ⚖️ محامي مكلف:
              </span>
              <span className="text-green-300 text-xs font-medium">
                {assignedLawyer.name}
              </span>
            </div>
          )}
        </div>

        {task.description && (
          <p className={`text-sm mb-3 line-clamp-2 ${task.status === 'completed' ? 'text-green-200/70' : 'text-slate-300'}`}>
            {task.description}
          </p>
        )}
      </div>

      {/* Stage Progress Visual */}
      <div className="mb-6 bg-slate-900/50 rounded-lg p-4">
        <p className="text-xs text-slate-400 mb-3 font-semibold">تقدم المهمة:</p>
        <div className="flex items-center gap-2">
          {taskStages.map((s, index) => (
            <React.Fragment key={s.value}>
              <div
                className={`flex-1 h-2 rounded-full transition ${
                  index <= currentStageIndex
                    ? index === currentStageIndex
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-green-500'
                    : 'bg-slate-700'
                }`}
              ></div>
              {index < taskStages.length - 1 && (
                <FiArrowRight className={`w-3 h-3 ${index <= currentStageIndex ? 'text-cyan-400' : 'text-slate-600'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs">
          {taskStages.map((s, index) => (
            <div key={s.value} className={`text-center ${index <= currentStageIndex ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Status with Details */}
      {task.approval_status && (
        <div className="mb-4 bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-semibold">حالة الموافقات:</span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getApprovalColor(task.approval_status)}`}>
              {getApprovalLabel(task.approval_status)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                task.approved_by_admin ? 'bg-green-500' : task.approval_status === 'pending_admin' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-700'
              }`}>
                {task.approved_by_admin ? '✓' : '1'}
              </div>
              <span className="text-xs text-slate-400">إدارة</span>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                task.approved_by_main_lawyer ? 'bg-green-500' : task.approval_status === 'pending_main_lawyer' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-700'
              }`}>
                {task.approved_by_main_lawyer ? '✓' : '2'}
              </div>
              <span className="text-xs text-slate-400">محامي رئيسي</span>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                task.approved_by_assigned_lawyer ? 'bg-green-500' : task.approval_status === 'pending_assigned_lawyer' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-700'
              }`}>
                {task.approved_by_assigned_lawyer ? '✓' : '3'}
              </div>
              <span className="text-xs text-slate-400">محامي مكلف</span>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="space-y-2 mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
        {task.priority && (
          <span className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        )}
      </div>

      <div className={`text-xs mb-4 space-y-2 ${task.status === 'completed' ? 'text-green-300/70' : 'text-slate-300'}`}>
        {task.due_date && (
          <div className="flex items-center gap-2 bg-slate-900/50 rounded px-3 py-2">
            <span className="text-slate-400">📅 تاريخ الاستحقاق:</span>
            <span className="font-semibold text-cyan-400">
              {new Date(task.due_date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}
        {task.created_at && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">🕐 تاريخ الإنشاء:</span>
            <span className="text-slate-400">
              {new Date(task.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-slate-900/50 rounded">
        {task.status === 'completed' ? (
          <>
            <FiCheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm font-semibold">تمت الإتمام بنجاح</span>
          </>
        ) : task.status === 'in_progress' ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
            <span className="text-blue-400 text-sm font-semibold">جاري العمل عليها</span>
          </>
        ) : (
          <>
            <FiCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-semibold">في انتظار البدء</span>
          </>
        )}
      </div>

      {/* Approval Buttons */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          onClick={() => navigate(`/tasks/${task.id}`)}
          className="flex-1 py-2 px-3 rounded-lg transition text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <FiEye className="inline mr-1" /> التفاصيل
        </button>

        {task.approval_status === 'pending_admin' && user?.role === 'admin' && (
          <button
            onClick={() => handleApproveAdmin(task.id)}
            className="flex-1 py-2 rounded-lg transition text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
          >
            موافقة الإدارة
          </button>
        )}
        {task.approval_status === 'pending_main_lawyer' && user?.id === task.main_lawyer_id && (
          <button
            onClick={() => handleApproveMainLawyer(task.id)}
            className="flex-1 py-2 rounded-lg transition text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            موافقة المحامي الرئيسي
          </button>
        )}
        {task.approval_status === 'pending_assigned_lawyer' && user?.id === task.assigned_to && (
          <button
            onClick={() => handleApproveAssignedLawyer(task.id)}
            className="flex-1 py-2 rounded-lg transition text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
          >
            موافقة المحامي المكلف
          </button>
        )}

        <button
          onClick={() => {
            setEditingId(task.id);
            setFormData(task);
            setShowForm(true);
          }}
          className={`flex-1 py-2 px-3 rounded-lg transition text-sm font-medium ${
            task.status === 'completed'
              ? 'bg-green-600 text-green-100 hover:bg-green-700'
              : 'bg-slate-700 hover:bg-blue-600 text-white'
          }`}
        >
          <FiEdit2 className="inline mr-1" /> تعديل
        </button>
        <button
          onClick={() => handleDelete(task.id)}
          className={`flex-1 py-2 px-3 rounded-lg transition text-sm font-medium ${
            task.status === 'completed'
              ? 'bg-red-600 text-red-100 hover:bg-red-700'
              : 'bg-slate-700 hover:bg-red-600 text-white'
          }`}
        >
          <FiTrash2 className="inline mr-1" /> حذف
        </button>
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'قيد الانتظار',
    in_progress: 'جاري التنفيذ',
    completed: 'مكتملة ✓',
    overdue: 'متأخرة',
  };
  return labels[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-600 text-yellow-100',
    in_progress: 'bg-blue-600 text-blue-100',
    completed: 'bg-green-600 text-green-100',
    overdue: 'bg-red-600 text-red-100',
  };
  return colors[status] || 'bg-slate-600 text-slate-100';
};

const getApprovalLabel = (status) => {
  const labels = {
    pending_admin: 'بانتظار موافقة الإدارة',
    pending_main_lawyer: 'بانتظار موافقة المحامي الرئيسي',
    pending_assigned_lawyer: 'بانتظار موافقة المحامي المكلف',
    approved: 'تمت الموافقة',
    rejected: 'مرفوضة',
  };
  return labels[status] || status;
};

const getApprovalColor = (status) => {
  const colors = {
    pending_admin: 'bg-purple-600 text-purple-100',
    pending_main_lawyer: 'bg-indigo-600 text-indigo-100',
    pending_assigned_lawyer: 'bg-cyan-600 text-cyan-100',
    approved: 'bg-green-600 text-green-100',
    rejected: 'bg-red-600 text-red-100',
  };
  return colors[status] || 'bg-slate-600 text-slate-100';
};

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'منخفضة',
    normal: 'عادية',
    high: 'عالية',
    urgent: 'عاجلة',
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-green-700 text-green-100',
    normal: 'bg-blue-700 text-blue-100',
    high: 'bg-orange-700 text-orange-100',
    urgent: 'bg-red-700 text-red-100',
  };
  return colors[priority] || 'bg-slate-600 text-slate-100';
};
