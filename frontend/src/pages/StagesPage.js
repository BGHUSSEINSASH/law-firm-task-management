import React, { useState, useEffect } from 'react';
import { stagesAPI, tasksAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiLoader, FiCheck, FiX, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export const StagesPage = () => {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [stagesTasks, setStagesTasks] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    order: '',
    color: '#E0E7FF',
    description: '',
    requirements: '',
    approval_type: 'single'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stagesRes, tasksRes] = await Promise.all([
        stagesAPI.getAll(),
        tasksAPI.getAll()
      ]);
      
      const allStages = stagesRes.data ? stagesRes.data : stagesRes;
      setStages(allStages);

      const stagesTasksMap = {};
      const allTasks = tasksRes.tasks || tasksRes.data || [];
      
      allStages.forEach(stage => {
        const stageTasks = allTasks.filter(t => t.stage_id === stage.id).sort((a, b) => b.id - a.id);
        stagesTasksMap[stage.id] = stageTasks;
      });
      
      setStagesTasks(stagesTasksMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stages data:', error);
      toast.error('فشل في تحميل البيانات');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddStage = async () => {
    if (!formData.name) {
      toast.error('اسم المرحلة مطلوب');
      return;
    }

    try {
      if (editingId) {
        await stagesAPI.update(editingId, formData);
        toast.success('تم تحديث المرحلة بنجاح');
      } else {
        await stagesAPI.create(formData);
        toast.success('تم إضافة المرحلة بنجاح');
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (stage) => {
    setEditingId(stage.id);
    setFormData({
      name: stage.name,
      order: stage.order,
      color: stage.color,
      description: stage.description,
      requirements: stage.requirements || '',
      approval_type: stage.approval_type || 'single'
    });
    setShowForm(true);
  };

  const handleDelete = async (stageId) => {
    if (!window.confirm('هل تريد حذف هذه المرحلة؟')) return;

    try {
      await stagesAPI.delete(stageId);
      toast.success('تم حذف المرحلة بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل الحذف');
    }
  };

  const handleMoveTask = async (taskId, targetStageId) => {
    try {
      await stagesAPI.updateTaskStage(taskId, targetStageId);
      toast.success('تم نقل المهمة بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل النقل');
    }
  };

  const handleApproveTask = async (stageId, taskId) => {
    try {
      await stagesAPI.approveTask(stageId, taskId);
      toast.success('تمت الموافقة على المهمة بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في الموافقة');
    }
  };

  const canUserApprove = (task, stage) => {
    const approvalType = stage?.approval_type || 'multiple';
    if (approvalType === 'admin_only') {
      return user?.role === 'admin' && !task.approved_by_admin;
    }

    if (user?.role === 'admin' && !task.approved_by_admin) return true;
    if (user?.role === 'lawyer') {
      if (task.assigned_to === user.id && !task.approved_by_assigned_lawyer) return true;
      if (!task.approved_by_main_lawyer) return true;
    }
    return false;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      order: '',
      color: '#E0E7FF',
      description: '',
      requirements: '',
      approval_type: 'single'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleStageExpand = (stageId) => {
    setExpandedStages({
      ...expandedStages,
      [stageId]: !expandedStages[stageId]
    });
  };

  const getApprovalStatusBadge = (task) => {
    const approvalStatus = task.approval_status || 'pending';
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'pending': 'قيد الموافقة',
      'approved': 'موافق عليها',
      'rejected': 'مرفوضة'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[approvalStatus] || 'bg-gray-100'}`}>
        {labels[approvalStatus] || approvalStatus}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 إدارة المراحل والموافقات</h1>
        <p className="text-gray-600">تتبع تقدم المهام من خلال مراحل مختلفة مع إدارة الموافقات</p>
      </div>

      {/* قسم الموافقات المعلقة */}
      {(user?.role === 'admin' || user?.role === 'lawyer') && (
        <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-orange-800 mb-4 flex items-center gap-2">
            <FiLoader className="animate-spin" />
            الموافقات المعلقة بانتظارك
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(stagesTasks).flat()
              .filter(task => {
                const taskStage = stages.find(s => s.id === task.stage_id);
                return canUserApprove(task, taskStage);
              })
              .slice(0, 6)
              .map(task => {
                const taskStage = stages.find(s => s.id === task.stage_id);
                return (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-all border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">#{task.task_code}</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: taskStage?.color, color: 'white' }}>
                        {taskStage?.name}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{task.title}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 text-xs">
                        {task.approved_by_admin ? <FiCheck className="text-green-500" /> : <FiX className="text-gray-300" />}
                        <span className="text-gray-600">إدارة</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {task.approved_by_main_lawyer ? <FiCheck className="text-green-500" /> : <FiX className="text-gray-300" />}
                        <span className="text-gray-600">محامي رئيسي</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {task.approved_by_assigned_lawyer ? <FiCheck className="text-green-500" /> : <FiX className="text-gray-300" />}
                        <span className="text-gray-600">محامي مكلف</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveTask(task.stage_id, task.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <FiCheck size={16} />
                      موافقة الآن
                    </button>
                  </div>
                );
              })}
          </div>
          {Object.values(stagesTasks).flat().filter(task => {
            const taskStage = stages.find(s => s.id === task.stage_id);
            return canUserApprove(task, taskStage);
          }).length === 0 && (
            <p className="text-center text-orange-600 py-4">✅ لا توجد موافقات معلقة</p>
          )}
        </div>
      )}

      {user?.role === 'admin' && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="mb-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
        >
          <FiPlus /> إضافة مرحلة جديدة
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingId ? '✏️ تعديل المرحلة' : '➕ إضافة مرحلة جديدة'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">اسم المرحلة *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    placeholder="مثال: المراجعة الأولية"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">الترتيب</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">اللون</label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">نوع الموافقة</label>
                  <select
                    name="approval_type"
                    value={formData.approval_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  >
                    <option value="single">موافقة واحدة</option>
                    <option value="multiple">موافقات متعددة</option>
                    <option value="admin_only">موافقة الإدارة فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">الوصف</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="اكتب وصفاً للمرحلة"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">متطلبات التنفيذ</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="اكتب متطلبات المهام في هذه المرحلة"
                  rows="2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddStage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
              >
                {editingId ? 'تحديث' : 'إضافة'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div
              className="p-6 text-white font-bold flex items-center justify-between cursor-pointer hover:opacity-90 transition"
              style={{ background: stage.color }}
              onClick={() => toggleStageExpand(stage.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center font-bold">
                  {stage.order}
                </div>
                <div>
                  <h3 className="text-xl">{stage.name}</h3>
                  <p className="text-sm opacity-90">{stage.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-white bg-opacity-30 px-4 py-2 rounded-full font-semibold">
                  {stagesTasks[stage.id]?.length || 0} مهمة
                </span>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(stage); }} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                      <FiEdit2 size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(stage.id); }} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                )}
                {expandedStages[stage.id] ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
              </div>
            </div>

            {stage.requirements && expandedStages[stage.id] && (
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FiInfo size={18} /> متطلبات التنفيذ
                </h4>
                <p className="text-blue-800 whitespace-pre-wrap">{stage.requirements}</p>
              </div>
            )}

            {expandedStages[stage.id] && (
              <div className="p-6">
                {stagesTasks[stage.id]?.length > 0 ? (
                  <div className="space-y-4">
                    {stagesTasks[stage.id].map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4 hover:bg-gray-100 transition-all cursor-pointer"
                        style={{ borderColor: stage.color }}
                        onClick={() => setShowTaskDetails(task.id === showTaskDetails ? null : task.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-gray-200 px-2 py-1 rounded text-xs font-semibold text-gray-700">
                                #{task.task_code}
                              </span>
                              <h4 className="font-bold text-gray-800 text-lg">{task.title}</h4>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              {getApprovalStatusBadge(task)}
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {task.priority === 'high' ? '🔴 عالية' :
                                 task.priority === 'medium' ? '🟡 متوسطة' :
                                 '🟢 منخفضة'}
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  background: stage.color,
                                  width: `${task.progress || 0}%`
                                }}
                              />
                            </div>

                            <p className="text-xs text-gray-500">التقدم: {task.progress || 0}%</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            {stage.order < stages.length && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextStage = stages.find(s => s.order === stage.order + 1);
                                  if (nextStage) handleMoveTask(task.id, nextStage.id);
                                }}
                                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-all text-sm font-semibold"
                                title="نقل للمرحلة التالية"
                              >
                                <FiArrowRight size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        {showTaskDetails === task.id && (
                          <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-white p-4 rounded">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-gray-800">📋 تفاصيل الموافقات</h5>
                              {canUserApprove(task, stage) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveTask(stage.id, task.id);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-semibold"
                                >
                                  <FiCheck size={16} />
                                  موافقة على المهمة
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-3 bg-purple-50 rounded">
                                <p className="text-xs text-purple-600 font-semibold mb-2">موافقة الإدارة</p>
                                <div className="flex items-center gap-2">
                                  {task.approved_by_admin ? (
                                    <>
                                      <FiCheck className="text-green-600" size={20} />
                                      <span className="text-sm text-green-700 font-semibold">موافق ✓</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiLoader className="text-yellow-400 animate-spin" size={20} />
                                      <span className="text-sm text-yellow-600 font-semibold">قيد المراجعة</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="p-3 bg-indigo-50 rounded">
                                <p className="text-xs text-indigo-600 font-semibold mb-2">موافقة المحامي الرئيسي</p>
                                <div className="flex items-center gap-2">
                                  {task.approved_by_main_lawyer ? (
                                    <>
                                      <FiCheck className="text-green-600" size={20} />
                                      <span className="text-sm text-green-700 font-semibold">موافق ✓</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiLoader className="text-yellow-400 animate-spin" size={20} />
                                      <span className="text-sm text-yellow-600 font-semibold">قيد المراجعة</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="p-3 bg-cyan-50 rounded">
                                <p className="text-xs text-cyan-600 font-semibold mb-2">موافقة المحامي المكلف</p>
                                <div className="flex items-center gap-2">
                                  {task.approved_by_assigned_lawyer ? (
                                    <>
                                      <FiCheck className="text-green-600" size={20} />
                                      <span className="text-sm text-green-700 font-semibold">موافق ✓</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiLoader className="text-yellow-400 animate-spin" size={20} />
                                      <span className="text-sm text-yellow-600 font-semibold">قيد المراجعة</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">📭 لا توجد مهام في هذه المرحلة</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600 text-sm mb-2">إجمالي المراحل</p>
          <p className="text-3xl font-bold text-blue-600">{stages.length}</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600 text-sm mb-2">إجمالي المهام</p>
          <p className="text-3xl font-bold text-green-600">
            {Object.values(stagesTasks).reduce((sum, tasks) => sum + tasks.length, 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600 text-sm mb-2">مهام قيد الموافقة</p>
          <p className="text-3xl font-bold text-yellow-600">
            {Object.values(stagesTasks).flat().filter(t => t.approval_status !== 'approved').length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600 text-sm mb-2">مهام موافقة عليها</p>
          <p className="text-3xl font-bold text-indigo-600">
            {Object.values(stagesTasks).flat().filter(t => t.approval_status === 'approved').length}
          </p>
        </div>
      </div>
    </div>
  );
};
