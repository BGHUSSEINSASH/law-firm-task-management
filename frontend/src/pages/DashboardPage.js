import React, { useState, useEffect } from 'react';
import { tasksAPI, departmentsAPI, lawyersAPI, clientsAPI } from '../api';
import { FiUsers, FiFileText, FiBriefcase, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiActivity, FiBarChart2 } from 'react-icons/fi';

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    totalDepartments: 0,
    totalLawyers: 0,
    totalClients: 0,
    pendingApprovals: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, depsRes, lawyersRes, clientsRes] = await Promise.all([
        tasksAPI.getAll(),
        departmentsAPI.getAll(),
        lawyersAPI.getAll(),
        clientsAPI.getAll()
      ]);

      const tasks = tasksRes.tasks || tasksRes.data || [];
      const clientsList = clientsRes.data || clientsRes || [];
      setClients(clientsList);

      const pendingApprovals = tasks.filter(t => 
        t.approval_status === 'pending' || t.approval_status?.admin === 'pending'
      ).length;

      setStats({
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalDepartments: (depsRes.data || depsRes || []).length,
        totalLawyers: (lawyersRes.data || lawyersRes || []).length,
        totalClients: clientsList.length,
        pendingApprovals: pendingApprovals
      });

      setRecentTasks(tasks.slice(0, 8));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'غير محدد';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
      in_progress: { label: 'قيد التنفيذ', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
      completed: { label: 'مكتملة', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    
    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
        {statusInfo.label}
      </span>
    );
  };

  const StatCard = ({ icon: Icon, title, value, color, gradient }) => (
    <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${gradient} border border-slate-700/50 shadow-xl hover:shadow-2xl`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-30`}>
            <Icon className={`text-2xl ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <h3 className="text-slate-300 text-sm font-medium mb-1">{title}</h3>
        <p className="text-white text-4xl font-bold">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-2 bg-slate-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0 
    ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">لوحة التحكم</h1>
        <p className="text-slate-400 text-lg">نظرة عامة على إحصائيات نظام إدارة المهام القانونية</p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiFileText}
          title="إجمالي المهام"
          value={stats.totalTasks}
          color="bg-cyan-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
        <StatCard
          icon={FiClock}
          title="المهام المعلقة"
          value={stats.pendingTasks}
          color="bg-yellow-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
        <StatCard
          icon={FiTrendingUp}
          title="قيد التنفيذ"
          value={stats.inProgressTasks}
          color="bg-indigo-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
        <StatCard
          icon={FiCheckCircle}
          title="المهام المكتملة"
          value={stats.completedTasks}
          color="bg-green-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">الأقسام</p>
              <p className="text-4xl font-bold text-white">{stats.totalDepartments}</p>
            </div>
            <div className="p-4 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <FiBriefcase className="text-3xl text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">المحامون</p>
              <p className="text-4xl font-bold text-white">{stats.totalLawyers}</p>
            </div>
            <div className="p-4 bg-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <FiUsers className="text-3xl text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">العملاء</p>
              <p className="text-4xl font-bold text-white">{stats.totalClients}</p>
            </div>
            <div className="p-4 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <FiBriefcase className="text-3xl text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress and Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <FiBarChart2 className="text-2xl text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">معدل الإنجاز</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <span className="text-slate-300 font-medium">نسبة إتمام المهام</span>
                <span className="font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-lg">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-500/50 transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
              <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-xs font-semibold mb-2">معلقة</p>
                <p className="text-2xl font-bold text-yellow-300">{stats.pendingTasks}</p>
              </div>
              <div className="text-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-indigo-400 text-xs font-semibold mb-2">جارية</p>
                <p className="text-2xl font-bold text-indigo-300">{stats.inProgressTasks}</p>
              </div>
              <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-xs font-semibold mb-2">مكتملة</p>
                <p className="text-2xl font-bold text-green-300">{stats.completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <FiActivity className="text-2xl text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">الموافقات المعلقة</h3>
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                {stats.pendingApprovals}
              </div>
              <p className="text-slate-400">موافقة بانتظار المراجعة</p>
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-purple-300 text-sm">
                  هناك {stats.pendingApprovals} مهام بحاجة إلى موافقات من الإداريين والمحامين الرئيسيين
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <FiFileText className="text-2xl text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">المهام الأخيرة</h3>
        </div>
        
        <div className="space-y-3">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all border border-slate-600/30 hover:border-slate-500/50 group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-slate-600/50 text-cyan-300 rounded-lg text-xs font-mono font-semibold border border-cyan-500/30">
                      {task.task_code}
                    </span>
                    <h4 className="font-semibold text-white truncate group-hover:text-cyan-300 transition">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    {task.client_id && (
                      <span className="flex items-center gap-1 truncate">
                        <FiBriefcase size={16} className="text-cyan-400 flex-shrink-0" />
                        {getClientName(task.client_id)}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <FiClock size={16} className="text-yellow-400 flex-shrink-0" />
                        {new Date(task.due_date).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {getStatusBadge(task.status)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FiFileText className="text-5xl text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">لا توجد مهام حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'غير محدد';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
      in_progress: { label: 'قيد التنفيذ', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
      completed: { label: 'مكتملة', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    
    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
        {statusInfo.label}
      </span>
    );
  };

  const StatCard = ({ icon: Icon, title, value, color, gradient }) => (
    <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${gradient} border border-slate-700/50 shadow-xl hover:shadow-2xl`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-30`}>
            <Icon className={`text-2xl ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <h3 className="text-slate-300 text-sm font-medium mb-1">{title}</h3>
        <p className="text-white text-4xl font-bold">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-2 bg-slate-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0 
    ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">لوحة التحكم</h1>
        <p className="text-slate-400 text-lg">نظرة عامة على إحصائيات نظام إدارة المهام القانونية</p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiFileText}
          title="إجمالي المهام"
          value={stats.totalTasks}
          color="bg-cyan-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
        <StatCard
          icon={FiClock}
          title="المهام المعلقة"
          value={stats.pendingTasks}
          color="bg-yellow-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
        <StatCard
          icon={FiTrendingUp}
          title="قيد التنفيذ"
          value={stats.inProgressTasks}
          color="bg-indigo-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
        <StatCard
          icon={FiCheckCircle}
          title="المهام المكتملة"
          value={stats.completedTasks}
          color="bg-green-400"
          gradient="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">الأقسام</p>
              <p className="text-4xl font-bold text-white">{stats.totalDepartments}</p>
            </div>
            <div className="p-4 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <FiBriefcase className="text-3xl text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">المحامون</p>
              <p className="text-4xl font-bold text-white">{stats.totalLawyers}</p>
            </div>
            <div className="p-4 bg-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <FiUsers className="text-3xl text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">العملاء</p>
              <p className="text-4xl font-bold text-white">{stats.totalClients}</p>
            </div>
            <div className="p-4 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <FiBriefcase className="text-3xl text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress and Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <FiBarChart2 className="text-2xl text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">معدل الإنجاز</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <span className="text-slate-300 font-medium">نسبة إتمام المهام</span>
                <span className="font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-lg">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-500/50 transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
              <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-xs font-semibold mb-2">معلقة</p>
                <p className="text-2xl font-bold text-yellow-300">{stats.pendingTasks}</p>
              </div>
              <div className="text-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-indigo-400 text-xs font-semibold mb-2">جارية</p>
                <p className="text-2xl font-bold text-indigo-300">{stats.inProgressTasks}</p>
              </div>
              <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-xs font-semibold mb-2">مكتملة</p>
                <p className="text-2xl font-bold text-green-300">{stats.completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <FiActivity className="text-2xl text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">الموافقات المعلقة</h3>
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                {stats.pendingApprovals}
              </div>
              <p className="text-slate-400">موافقة بانتظار المراجعة</p>
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-purple-300 text-sm">
                  هناك {stats.pendingApprovals} مهام بحاجة إلى موافقات من الإداريين والمحامين الرئيسيين
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <FiFileText className="text-2xl text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">المهام الأخيرة</h3>
        </div>
        
        <div className="space-y-3">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all border border-slate-600/30 hover:border-slate-500/50 group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-slate-600/50 text-cyan-300 rounded-lg text-xs font-mono font-semibold border border-cyan-500/30">
                      {task.task_code}
                    </span>
                    <h4 className="font-semibold text-white truncate group-hover:text-cyan-300 transition">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    {task.client_id && (
                      <span className="flex items-center gap-1 truncate">
                        <FiBriefcase size={16} className="text-cyan-400 flex-shrink-0" />
                        {getClientName(task.client_id)}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <FiClock size={16} className="text-yellow-400 flex-shrink-0" />
                        {new Date(task.due_date).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {getStatusBadge(task.status)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FiFileText className="text-5xl text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">لا توجد مهام حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
