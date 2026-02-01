import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiAlertCircle, FiUser, FiClock, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [creator, setCreator] = useState(null);
  const [mainLawyer, setMainLawyer] = useState(null);
  const [assignedLawyer, setAssignedLawyer] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    fetchTaskDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // جلب تفاصيل المهمة
      const taskResponse = await axios.get(
        `http://localhost:5000/api/tasks/${id}`,
        { headers }
      );
      const taskData = taskResponse.data.task;
      setTask(taskData);

      // جلب معلومات المستخدمين والعملاء
      if (taskData.created_by) {
        try {
          const creatorRes = await axios.get(
            `http://localhost:5000/api/users/${taskData.created_by}`,
            { headers }
          );
          setCreator(creatorRes.data);
        } catch (err) {
          console.log('لم يتم جلب بيانات المنشئ');
        }
      }

      if (taskData.main_lawyer_id) {
        try {
          const lawyerRes = await axios.get(
            `http://localhost:5000/api/users/${taskData.main_lawyer_id}`,
            { headers }
          );
          setMainLawyer(lawyerRes.data);
        } catch (err) {
          console.log('لم يتم جلب بيانات المحامي الرئيسي');
        }
      }

      if (taskData.assigned_to) {
        try {
          const assignedRes = await axios.get(
            `http://localhost:5000/api/users/${taskData.assigned_to}`,
            { headers }
          );
          setAssignedLawyer(assignedRes.data);
        } catch (err) {
          console.log('لم يتم جلب بيانات المحامي المكلف');
        }
      }

      if (taskData.client_id) {
        try {
          const clientRes = await axios.get(
            `http://localhost:5000/api/clients/${taskData.client_id}`,
            { headers }
          );
          setClient(clientRes.data);
        } catch (err) {
          console.log('لم يتم جلب بيانات العميل');
        }
      }
    } catch (error) {
      toast.error('فشل تحميل تفاصيل المهمة');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdmin = async () => {
    try {
      setApproving(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `http://localhost:5000/api/tasks/${id}/approve/admin`,
        {},
        { headers }
      );
      
      toast.success('تمت موافقتك على المهمة');
      await fetchTaskDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشلت الموافقة');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveMainLawyer = async () => {
    try {
      setApproving(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `http://localhost:5000/api/tasks/${id}/approve/main-lawyer`,
        {},
        { headers }
      );
      
      toast.success('تمت موافقتك على المهمة');
      await fetchTaskDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشلت الموافقة');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveAssignedLawyer = async () => {
    try {
      setApproving(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `http://localhost:5000/api/tasks/${id}/approve/assigned-lawyer`,
        {},
        { headers }
      );
      
      toast.success('تمت موافقتك على المهمة');
      await fetchTaskDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشلت الموافقة');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل المهمة...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">المهمة غير موجودة</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getApprovalStatusColor = (status) => {
    if (task.approved_by_admin && task.approved_by_main_lawyer && task.approved_by_assigned_lawyer) {
      return 'bg-green-100 text-green-800';
    }
    if (!task.approved_by_admin) {
      return 'bg-red-100 text-red-800';
    }
    if (!task.approved_by_main_lawyer) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft /> العودة للمهام
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FiFileText /> معلومات المهمة
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">رمز المهمة</p>
                  <p className="text-lg font-semibold text-gray-800">{task.task_code}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">الأولوية</p>
                  <p className={`text-lg font-semibold ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {task.status === 'pending' ? 'معلقة' : task.status === 'in_progress' ? 'جارية' : 'مكتملة'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">موافقة الإدارة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getApprovalStatusColor(task.approval_status)}`}>
                    {task.approved_by_admin ? '✓ موافق' : '⏳ معلق'}
                  </span>
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <p className="text-gray-600 text-sm mb-2">الوصف</p>
                <p className="text-gray-800 leading-relaxed">{task.description}</p>
              </div>

              {task.due_date && (
                <>
                  <hr className="my-4" />
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-600" />
                    <div>
                      <p className="text-gray-600 text-sm">تاريخ الاستحقاق</p>
                      <p className="text-gray-800">
                        {new Date(task.due_date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Description & Details */}
            {client && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">معلومات العميل</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm">اسم العميل</p>
                    <p className="text-lg font-semibold text-gray-800">{client.name}</p>
                  </div>
                  {client.contact_person && (
                    <div>
                      <p className="text-gray-600 text-sm">جهة الاتصال</p>
                      <p className="text-gray-800">{client.contact_person}</p>
                    </div>
                  )}
                  {client.email && (
                    <div>
                      <p className="text-gray-600 text-sm">البريد الإلكتروني</p>
                      <p className="text-gray-800">{client.email}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <p className="text-gray-600 text-sm">الهاتف</p>
                      <p className="text-gray-800">{client.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiUser /> الفريق
              </h2>
              
              {creator && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">من أنشأ المهمة</p>
                  <p className="font-semibold text-gray-800">{creator.full_name || creator.username}</p>
                  <p className="text-xs text-gray-500">{creator.email}</p>
                </div>
              )}

              {mainLawyer && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">المحامي الرئيسي</p>
                  <p className="font-semibold text-gray-800">{mainLawyer.full_name || mainLawyer.username}</p>
                  <p className="text-xs text-gray-500">{mainLawyer.email}</p>
                </div>
              )}

              {assignedLawyer && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">المحامي المكلف</p>
                  <p className="font-semibold text-gray-800">{assignedLawyer.full_name || assignedLawyer.username}</p>
                  <p className="text-xs text-gray-500">{assignedLawyer.email}</p>
                </div>
              )}
            </div>

            {/* Approval Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiCheck /> حالة الموافقات
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">موافقة الإدارة</span>
                  {task.approved_by_admin ? (
                    <span className="text-green-600 text-sm font-bold">✓ موافق</span>
                  ) : (
                    <span className="text-red-600 text-sm font-bold">✗ معلق</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">موافقة المحامي الرئيسي</span>
                  {task.approved_by_main_lawyer ? (
                    <span className="text-green-600 text-sm font-bold">✓ موافق</span>
                  ) : (
                    <span className="text-red-600 text-sm font-bold">✗ معلق</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">موافقة المحامي المكلف</span>
                  {task.approved_by_assigned_lawyer ? (
                    <span className="text-green-600 text-sm font-bold">✓ موافق</span>
                  ) : (
                    <span className="text-red-600 text-sm font-bold">✗ معلق</span>
                  )}
                </div>
              </div>

              {/* Approval Buttons */}
              <hr className="my-4" />
              <div className="space-y-2">
                {!task.approved_by_admin && (
                  <button
                    onClick={handleApproveAdmin}
                    disabled={approving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {approving ? 'جاري الموافقة...' : 'موافقة الإدارة'}
                  </button>
                )}

                {task.approved_by_admin && !task.approved_by_main_lawyer && (
                  <button
                    onClick={handleApproveMainLawyer}
                    disabled={approving}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {approving ? 'جاري الموافقة...' : 'موافقة المحامي الرئيسي'}
                  </button>
                )}

                {task.approved_by_admin && task.approved_by_main_lawyer && !task.approved_by_assigned_lawyer && (
                  <button
                    onClick={handleApproveAssignedLawyer}
                    disabled={approving}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {approving ? 'جاري الموافقة...' : 'موافقة المحامي المكلف'}
                  </button>
                )}

                {task.approved_by_admin && task.approved_by_main_lawyer && task.approved_by_assigned_lawyer && (
                  <div className="w-full bg-green-100 text-green-800 font-bold py-2 px-4 rounded-lg text-center">
                    ✓ تمت جميع الموافقات
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
