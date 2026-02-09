import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { FiLogOut, FiMenu, FiX, FiHome, FiCheckSquare, FiBell, FiBarChart2, FiFileText, FiBriefcase, FiMapPin, FiUser, FiUsers, FiActivity, FiGrid, FiCreditCard, FiShield, FiLock } from 'react-icons/fi';
import NotificationsCenter from './NotificationsCenter';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: FiHome, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: FiCheckSquare, label: t('nav.tasks'), href: '/tasks' },
    { icon: FiGrid, label: t('nav.tasksKanban'), href: '/tasks-kanban' },
    { icon: FiBell, label: t('nav.notifications'), href: '/notifications' },
    { icon: FiBarChart2, label: t('nav.reports'), href: '/reports' },
    { icon: FiCreditCard, label: t('nav.invoices'), href: '/invoices' },
    { icon: FiActivity, label: t('nav.activityLog'), href: '/activity-log' },
    { icon: FiBriefcase, label: t('nav.clients'), href: '/clients' },
    { icon: FiMapPin, label: t('nav.stages'), href: '/stages' },
    { icon: FiHome, label: t('nav.departments'), href: '/departments' },
    { icon: FiUser, label: t('nav.lawyers'), href: '/lawyers' },
    { icon: FiShield, label: t('nav.admins'), href: '/admins' },
    // New Feature Links
    { icon: FiBarChart2, label: 'البحث المتقدم', href: '/search' },
    { icon: FiFileText, label: 'القوالب', href: '/templates' },
    { icon: FiLock, label: 'الجلسات', href: '/sessions' },
    ...(user?.role === 'admin' ? [
      { icon: FiUsers, label: t('nav.users'), href: '/users' },
      { icon: FiLock, label: t('nav.settings'), href: '/admin-management' }
    ] : []),
  ];

  return (
    <div className="app-shell flex min-h-screen" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} glass-card border-l border-slate-700/40 transition-all duration-300 flex flex-col`}> 
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/40 flex items-center justify-between group">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">Law Pro</h1>
                <p className="text-xs text-slate-400">نظام إدارة المهام</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              sidebarOpen={sidebarOpen}
            />
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700/40">
          {sidebarOpen ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 p-4 rounded-xl border border-slate-600/40">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 mt-1">{getRoleLabel(user?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 justify-center transition duration-300 font-semibold shadow-lg shadow-rose-500/30"
              >
                <FiLogOut size={18} />
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white p-2 rounded-xl flex items-center justify-center transition duration-300 shadow-lg shadow-rose-500/30"
            >
              <FiLogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <div className="glass-card border-b border-slate-700/40 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">{t('dashboard.title')}</h2>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <NotificationsCenter />
            <div className="w-px h-6 bg-slate-600"></div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavLink = ({ icon: Icon, label, href, sidebarOpen }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(href)}
      className={`w-full px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 group relative overflow-hidden ${
        window.location.pathname === href
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      <Icon size={20} className="flex-shrink-0" />
      {sidebarOpen && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
    </button>
  );
};

const getRoleLabel = (role) => {
  const labels = {
    admin: 'مدير النظام',
    department_head: 'رئيس قسم',
    lawyer: 'محامي',
    assistant: 'مساعد قانوني',
  };
  return labels[role] || role;
};
