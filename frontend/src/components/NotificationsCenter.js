import React, { useState, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export const NotificationsCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // محاكاة جلب الإشعارات
    const mockNotifications = [
      {
        id: 1,
        title: 'مهمة جديدة',
        message: 'تم تعيينك لمهمة جديدة',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'task'
      },
      {
        id: 2,
        title: 'طلب موافقة',
        message: 'طلب موافقة على مهمة',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'approval'
      },
      {
        id: 3,
        title: 'رسالة جديدة',
        message: 'لديك رسالة جديدة من عميل',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: 'message'
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
  }, []);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'الآن';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} س`;
    return `${Math.floor(hours / 24)} يوم`;
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Notifications Panel */}
          <div className="absolute left-0 mt-2 w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 max-h-[32rem] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">الإشعارات</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-lg transition"
              >
                <FiX className="text-slate-400" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-700 hover:bg-slate-750 cursor-pointer transition ${
                      !notification.is_read ? 'bg-slate-700/30' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-white' : 'text-slate-300'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2">
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={handleViewAll}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition"
              >
                عرض جميع الإشعارات
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsCenter;
