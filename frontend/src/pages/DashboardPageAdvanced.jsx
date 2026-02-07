import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const DashboardPage = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    slaCompliance: 0,
    tasksLastWeek: [],
    departmentStats: [],
    upcomingDeadlines: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const tasksRes = await API.get('/api/tasks');
      const tasks = tasksRes.data || [];

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const pendingTasks = tasks.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
      const overdueTasks = tasks.filter(
        (t) => new Date(t.due_date) < new Date() && t.status !== 'completed'
      ).length;

      const slaCompliance = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

      // Upcoming deadlines (next 7 days)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingDeadlines = tasks
        .filter(
          (t) =>
            new Date(t.due_date) >= today &&
            new Date(t.due_date) <= nextWeek &&
            t.status !== 'completed'
        )
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

      // Tasks last 7 days
      const lastWeek = Array(7)
        .fill(0)
        .map((_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          const count = tasks.filter(
            (t) => t.created_at && t.created_at.split('T')[0] === dateStr
          ).length;
          return {
            date: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
            count,
          };
        });

      // Department statistics
      const departmentStats = [
        ...new Set(tasks.map((t) => t.department_id)),
      ].map((deptId) => ({
        id: deptId,
        tasks: tasks.filter((t) => t.department_id === deptId).length,
        completed: tasks.filter((t) => t.department_id === deptId && t.status === 'completed')
          .length,
      }));

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        slaCompliance,
        tasksLastWeek: lastWeek,
        departmentStats,
        upcomingDeadlines,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-auto">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">
          {t('dashboard.welcome')}, {user?.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={FiBarChart2}
          title={t('dashboard.totalTasks')}
          value={stats.totalTasks}
          color="from-blue-600 to-blue-700"
          trend={`+${Math.floor(Math.random() * 10)}`}
        />
        <MetricCard
          icon={FiCheckCircle}
          title={t('dashboard.completedTasks')}
          value={stats.completedTasks}
          color="from-green-600 to-green-700"
          trend={`${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`}
        />
        <MetricCard
          icon={FiClock}
          title={t('dashboard.pendingTasks')}
          value={stats.pendingTasks}
          color="from-yellow-600 to-yellow-700"
          trend={stats.pendingTasks}
        />
        <MetricCard
          icon={FiAlertCircle}
          title={t('dashboard.overdueTasks')}
          value={stats.overdueTasks}
          color="from-red-600 to-red-700"
          trend={stats.overdueTasks}
        />
      </div>

      {/* SLA Compliance & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Compliance */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-indigo-400" />
            {t('dashboard.slaCompliance')}
          </h2>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(stats.slaCompliance / 100) * 565.48} 565.48`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">{stats.slaCompliance}%</span>
                  <p className="text-sm text-slate-400">{t('dashboard.slaCompliance')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <p>✅ {t('messages.success')}: {stats.completedTasks} مهام</p>
            <p>⚠️ متأخر: {stats.overdueTasks} مهام</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.performanceMetrics')}</h2>
          <div className="space-y-4">
            {stats.tasksLastWeek.map((day, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-16">{day.date}</span>
                <div className="flex-1 bg-slate-700/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all"
                    style={{ width: `${(day.count / Math.max(...stats.tasksLastWeek.map((d) => d.count), 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-white w-8">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.upcomingDeadlines')}</h2>
        {stats.upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {stats.upcomingDeadlines.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-indigo-500/50 transition"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{task.task_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-indigo-400">
                    {new Date(task.due_date).toLocaleDateString('ar-SA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24))} أيام
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">{t('messages.noData')}</p>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.recentActivities')}</h2>
        <div className="text-center text-slate-400 py-8">
          💡 {t('messages.noData')}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, title, value, color, trend }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all group">
      <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${color} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-slate-400 text-sm mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-sm font-semibold text-green-400 bg-green-400/20 px-2 py-1 rounded-lg">
          {trend}
        </span>
      </div>
    </div>
  );
};

export default DashboardPage;
