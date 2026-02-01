import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FiBell, FiCheck, FiTrash2, FiFilter, FiClock, 
  FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle,
  FiRefreshCw, FiMail, FiMessageSquare
} from 'react-icons/fi';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, task, approval, message, system

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // محاكاة جلب البيانات - سيتم استبدالها بـ API حقيقي
      const mockNotifications = [
        {
          id: 1,
          type: 'task',
          title: 'مهمة جديدة تم تعيينها لك',
          message: 'تم تعيينك لمهمة "مراجعة العقد التجاري" - القضية #TSK-2025-001',
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 دقيقة مضت
          priority: 'high',
          link: '/tasks/1',
          icon: 'task'
        },
        {
          id: 2,
          type: 'approval',
          title: 'طلب موافقة',
          message: 'المحامي محمود علي يطلب موافقتك على المهمة "إعداد صحيفة الدعوى"',
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // ساعتين مضت
          priority: 'high',
          link: '/tasks/5',
          icon: 'approval'
        },
        {
          id: 3,
          type: 'message',
          title: 'رسالة جديدة من عميل',
          message: 'شركة ABC أرسلت رسالة جديدة بخصوص القضية #123',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 ساعات مضت
          priority: 'medium',
          link: '/clients/1',
          icon: 'message'
        },
        {
          id: 4,
          type: 'task',
          title: 'اقتراب موعد التسليم',
          message: 'المهمة "البحث القانوني للقضية #456" موعد تسليمها غداً',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // يوم مضى
          priority: 'medium',
          link: '/tasks/3',
          icon: 'deadline'
        },
        {
          id: 5,
          type: 'system',
          title: 'تحديث النظام',
          message: 'تم تحديث النظام بنجاح - الإصدار 2.5.0',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // يومين مضيا
          priority: 'low',
          link: null,
          icon: 'info'
        },
        {
          id: 6,
          type: 'approval',
          title: 'تمت الموافقة',
          message: 'تمت الموافقة على طلبك "طلب إجازة سنوية"',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 أيام مضت
          priority: 'low',
          link: null,
          icon: 'success'
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('فشل في تحميل الإشعارات');
      setLoading(false);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
    toast.success('تم وضع علامة مقروءة');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    toast.success('تم وضع علامة مقروءة على جميع الإشعارات');
  };

  const handleDelete = (notificationId) => {
    if (!window.confirm('هل تريد حذف هذا الإشعار؟')) return;
    setNotifications(notifications.filter(n => n.id !== notificationId));
    toast.success('تم حذف الإشعار');
  };

  const handleDeleteAll = () => {
    if (!window.confirm('هل تريد حذف جميع الإشعارات المقروءة؟')) return;
    setNotifications(notifications.filter(n => !n.is_read));
    toast.success('تم حذف جميع الإشعارات المقروءة');
  };

  const getNotificationIcon = (notification) => {
    const iconClass = "w-6 h-6";
    
    switch (notification.icon) {
      case 'task':
        return <FiClock className={iconClass} />;
      case 'approval':
        return <FiAlertCircle className={iconClass} />;
      case 'message':
        return <FiMessageSquare className={iconClass} />;
      case 'success':
        return <FiCheckCircle className={iconClass} />;
      case 'deadline':
        return <FiAlertTriangle className={iconClass} />;
      case 'info':
        return <FiInfo className={iconClass} />;
      default:
        return <FiBell className={iconClass} />;
    }
  };

  const getNotificationColor = (notification) => {
    if (!notification.is_read) {
      switch (notification.priority) {
        case 'high':
          return 'from-red-600/20 to-pink-600/20 border-red-500/50';
        case 'medium':
          return 'from-yellow-600/20 to-orange-600/20 border-yellow-500/50';
        default:
          return 'from-blue-600/20 to-cyan-600/20 border-blue-500/50';
      }
    }
    return 'from-slate-700/30 to-slate-800/30 border-slate-600/30';
  };

  const getIconBgColor = (notification) => {
    switch (notification.priority) {
      case 'high':
        return 'from-red-600 to-pink-600';
      case 'medium':
        return 'from-yellow-600 to-orange-600';
      default:
        return 'from-blue-600 to-cyan-600';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'الآن';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} يوم`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `منذ ${weeks} أسبوع`;
    return date.toLocaleDateString('ar-SA');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'read' && !n.is_read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                <FiBell className="text-cyan-400" />
                مركز الإشعارات
              </h1>
              <p className="text-slate-400 text-lg">
                {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
              </p>
            </div>
            <button
              onClick={fetchNotifications}
              className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">إجمالي الإشعارات</p>
                  <p className="text-2xl font-bold text-white">{notifications.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg">
                  <FiBell className="text-white w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">غير مقروءة</p>
                  <p className="text-2xl font-bold text-white">{unreadCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg">
                  <FiMail className="text-white w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">عالية الأولوية</p>
                  <p className="text-2xl font-bold text-white">
                    {notifications.filter(n => n.priority === 'high' && !n.is_read).length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg">
                  <FiAlertTriangle className="text-white w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">مقروءة</p>
                  <p className="text-2xl font-bold text-white">
                    {notifications.filter(n => n.is_read).length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                  <FiCheckCircle className="text-white w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <FiFilter className="text-slate-400" />
              <span className="text-slate-300 font-medium">فلترة:</span>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">جميع الإشعارات</option>
              <option value="unread">غير مقروءة</option>
              <option value="read">مقروءة</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">جميع الأنواع</option>
              <option value="task">مهام</option>
              <option value="approval">موافقات</option>
              <option value="message">رسائل</option>
              <option value="system">النظام</option>
            </select>

            <div className="flex-1"></div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <FiCheck /> وضع علامة مقروءة على الكل
              </button>
            )}

            {notifications.filter(n => n.is_read).length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <FiTrash2 /> حذف المقروءة
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-slate-800/50 rounded-2xl p-16 text-center border border-slate-700">
              <div className="bg-slate-700 p-6 rounded-2xl inline-block mb-4">
                <FiBell className="text-slate-400 mx-auto w-16 h-16" />
              </div>
              <p className="text-slate-400 text-xl font-medium">لا توجد إشعارات</p>
              <p className="text-slate-500 text-sm mt-2">ستظهر الإشعارات الجديدة هنا</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-gradient-to-r ${getNotificationColor(notification)} border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 bg-gradient-to-br ${getIconBgColor(notification)} rounded-lg flex-shrink-0`}>
                    {getNotificationIcon(notification)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`font-bold text-lg ${!notification.is_read ? 'text-white' : 'text-slate-300'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-slate-400 text-sm whitespace-nowrap">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="px-4 py-2 bg-slate-700 hover:bg-cyan-600 text-white text-sm rounded-lg transition flex items-center gap-2"
                        >
                          عرض التفاصيل
                        </a>
                      )}
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-4 py-2 bg-slate-700 hover:bg-green-600 text-white text-sm rounded-lg transition flex items-center gap-2"
                        >
                          <FiCheck /> وضع علامة مقروءة
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="px-4 py-2 bg-slate-700 hover:bg-red-600 text-white text-sm rounded-lg transition flex items-center gap-2"
                      >
                        <FiTrash2 /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
