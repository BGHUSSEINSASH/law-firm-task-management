import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiMenu, FiX, FiHome, FiCheckSquare, FiBell, FiBarChart3, FiFileText, FiBriefcase, FiMapPin, FiBuilding2, FiUser, FiUsers, FiActivity, FiGrid, FiCreditCard, FiShield, FiLock } from 'react-icons/fi';
import NotificationsCenter from './NotificationsCenter';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: FiHome, label: 'لوحة التحكم', href: '/dashboard' },
    { icon: FiCheckSquare, label: 'المهام', href: '/tasks' },
    { icon: FiGrid, label: 'Kanban', href: '/tasks-kanban' },
    { icon: FiBell, label: 'الإشعارات', href: '/notifications' },
    { icon: FiBarChart3, label: 'التقارير', href: '/reports' },
    { icon: FiCreditCard, label: 'الفواتير', href: '/invoices' },
    { icon: FiActivity, label: 'سجل النشاطات', href: '/activity-log' },
    { icon: FiBriefcase, label: 'العملاء', href: '/clients' },
    { icon: FiMapPin, label: 'المراحل', href: '/stages' },
    { icon: FiBuilding2, label: 'الأقسام', href: '/departments' },
    { icon: FiUser, label: 'المحامون', href: '/lawyers' },
    { icon: FiShield, label: 'الإداريين', href: '/admins' },
    ...(user?.role === 'admin' ? [
      { icon: FiUsers, label: 'المستخدمون', href: '/users' },
      { icon: FiLock, label: 'إدارة النظام', href: '/admin-management' }
    ] : []),
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-gradient-to-b from-slate-900 to-slate-800 border-l border-slate-700/50 transition-all duration-300 flex flex-col shadow-2xl`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between group">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Law Pro</h1>
                <p className="text-xs text-slate-500">نظام إدارة المهام</p>
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
        <div className="p-4 border-t border-slate-700/50">
          {sidebarOpen ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 p-4 rounded-lg border border-slate-600/50">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 mt-1">{getRoleLabel(user?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 justify-center transition duration-300 font-semibold shadow-lg shadow-red-500/30"
              >
                <FiLogOut size={18} />
                خروج
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-2 rounded-lg flex items-center justify-center transition duration-300 shadow-lg shadow-red-500/30"
            >
              <FiLogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border-b border-slate-700/50 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">نظام إدارة المهام القانونية</h2>
          <div className="flex items-center gap-6">
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
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const currentPath = window.location.pathname;
    setIsActive(currentPath === href);
  }, [href]);

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
