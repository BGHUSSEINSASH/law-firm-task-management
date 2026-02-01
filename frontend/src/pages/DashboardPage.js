import React, { useState, useEffect } from 'react';
import { tasksAPI, departmentsAPI, lawyersAPI, clientsAPI } from '../api';
import { FiUsers, FiFileText, FiBriefcase, FiTrendingUp } from 'react-icons/fi';

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

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    totalDepartments: 0,
    totalLawyers: 0,
    totalClients: 0
  });
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

      const tasks = tasksRes.data || [];

      setStats({
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalDepartments: depsRes.data?.length || 0,
        totalLawyers: lawyersRes.data?.length || 0,
        totalClients: clientsRes.data?.length || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

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

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen" dir="rtl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          لوحة التحكم
        </h1>
        <p className="text-slate-400 text-lg">نظرة عامة على إحصائيات نظام إدارة المهام القانونية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={FiFileText} 
          title="إجمالي المهام" 
          value={stats.totalTasks} 
          color="bg-indigo-500" 
          gradient="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20"
        />
        <StatCard 
          icon={FiTrendingUp} 
          title="قيد الانتظار" 
          value={stats.pendingTasks} 
          color="bg-yellow-500" 
          gradient="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20"
        />
        <StatCard 
          icon={FiTrendingUp} 
          title="قيد التنفيذ" 
          value={stats.inProgressTasks} 
          color="bg-cyan-500" 
          gradient="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20"
        />
        <StatCard 
          icon={FiTrendingUp} 
          title="مكتملة" 
          value={stats.completedTasks} 
          color="bg-green-500" 
          gradient="bg-gradient-to-br from-green-500/20 to-green-600/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={FiBriefcase} 
          title="الأقسام" 
          value={stats.totalDepartments} 
          color="bg-purple-500" 
          gradient="bg-gradient-to-br from-purple-500/20 to-purple-600/20"
        />
        <StatCard 
          icon={FiUsers} 
          title="المحامون" 
          value={stats.totalLawyers} 
          color="bg-pink-500" 
          gradient="bg-gradient-to-br from-pink-500/20 to-pink-600/20"
        />
        <StatCard 
          icon={FiUsers} 
          title="العملاء" 
          value={stats.totalClients} 
          color="bg-blue-500" 
          gradient="bg-gradient-to-br from-blue-500/20 to-blue-600/20"
        />
      </div>
    </div>
  );
};

export default DashboardPage;
