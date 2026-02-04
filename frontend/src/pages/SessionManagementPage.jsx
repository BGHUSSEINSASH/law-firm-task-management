import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { FiTrash2, FiRefreshCw, FiSmartphone, FiGlobe } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const SessionManagementPage = () => {
  const { t } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/auth/sessions');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      setRevoking(sessionId);
      await API.post(`/api/auth/sessions/revoke`, { sessionId });
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('تم إنهاء الجلسة بنجاح');
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error(t('messages.error'));
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceInfo = (userAgent) => {
    if (userAgent.includes('Windows')) return { name: 'Windows PC', icon: '💻' };
    if (userAgent.includes('Mac')) return { name: 'Mac', icon: '🍎' };
    if (userAgent.includes('iPhone')) return { name: 'iPhone', icon: '📱' };
    if (userAgent.includes('Android')) return { name: 'Android', icon: '🤖' };
    return { name: 'Device', icon: '📲' };
  };

  const getLocationInfo = (ip) => {
    // Mock location - في الإنتاج ستحتاج إلى GeoIP API
    return 'موقع غير معروف';
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
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{t('settings.sessions')}</h1>
        <p className="text-slate-400">إدارة جلساتك النشطة والأجهزة المتصلة</p>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            const device = getDeviceInfo(session.user_agent || '');
            const isCurrent = session.is_current;

            return (
              <div
                key={session.id}
                className={`bg-gradient-to-br ${
                  isCurrent ? 'from-indigo-900 to-indigo-800' : 'from-slate-800 to-slate-700'
                }/50 rounded-xl p-6 border ${
                  isCurrent ? 'border-indigo-500/50' : 'border-slate-700/50'
                } shadow-xl`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Device Icon */}
                    <div className={`p-3 rounded-lg ${
                      isCurrent ? 'bg-indigo-600' : 'bg-slate-600'
                    } flex-shrink-0`}>
                      <span className="text-2xl">{device.icon}</span>
                    </div>

                    {/* Device Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-lg">{device.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-indigo-600 text-indigo-100 rounded text-xs font-semibold">
                            الجهاز الحالي
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-slate-300">
                        <p className="flex items-center gap-2">
                          <FiSmartphone className="w-4 h-4 text-slate-400" />
                          {device.name}
                        </p>
                        <p className="flex items-center gap-2">
                          <FiGlobe className="w-4 h-4 text-slate-400" />
                          {session.ip || 'IP غير معروف'}
                        </p>
                        <p className="text-slate-400">
                          آخر استخدام: {session.last_used_at
                            ? new Date(session.last_used_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'لم يتم الاستخدام'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCurrent && (
                    <button
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="p-3 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {revoking === session.id ? (
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiTrash2 className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl border border-slate-700/50">
            <FiSmartphone className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
            <p className="text-slate-400">{t('messages.noData')}</p>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-indigo-500/30">
        <h3 className="font-semibold text-indigo-300 mb-3">💡 نصائح الأمان</h3>
        <ul className="space-y-2 text-sm text-indigo-100">
          <li>✓ استعرض جميع الجلسات النشطة بانتظام</li>
          <li>✓ أنهِ الجلسات على الأجهزة التي لا تستخدمها</li>
          <li>✓ إذا رأيت جهازاً غير معروف، غيّر كلمة المرور فوراً</li>
          <li>✓ استخدم كلمات مرور قوية وفريدة</li>
        </ul>
      </div>

      {/* Revoke All Button */}
      <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
        إنهاء جميع الجلسات الأخرى
      </button>
    </div>
  );
};

export default SessionManagementPage;
