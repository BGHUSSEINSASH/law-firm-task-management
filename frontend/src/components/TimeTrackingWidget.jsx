import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { FiPlay, FiPause, FiTrash2, FiClock } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const TimeTrackingWidget = ({ taskId }) => {
  const { t } = useI18n();
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeData();
    const interval = setInterval(() => {
      if (activeTimer?.active) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [taskId, activeTimer?.active]);

  const fetchTimeData = async () => {
    try {
      const [activeRes, logsRes] = await Promise.all([
        API.get('/api/time-tracking/active'),
        API.get(`/api/time-tracking/task/${taskId}`),
      ]);

      if (activeRes.data.active && activeRes.data.taskId === parseInt(taskId)) {
        setActiveTimer(activeRes.data);
        setElapsedSeconds(activeRes.data.elapsedSeconds || 0);
      }

      setTimeLogs(logsRes.data.logs || []);
      setTotalHours(logsRes.data.totalHours || 0);
    } catch (error) {
      console.error('Failed to fetch time data:', error);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      const response = await API.post('/api/time-tracking/start', { taskId });
      setActiveTimer({
        active: true,
        taskId,
        startTime: new Date(),
      });
      setElapsedSeconds(0);
      toast.success('بدأ تتبع الوقت');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      const response = await API.post('/api/time-tracking/stop');
      setActiveTimer(null);
      setElapsedSeconds(0);
      toast.success('تم إيقاف تتبع الوقت');
      fetchTimeData();
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl border border-slate-700/50">
      {/* Header */}
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <FiClock className="w-5 h-5" />
        تتبع الوقت
      </h3>

      {/* Active Timer */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <p className="text-sm text-blue-100 mb-2">الوقت المنقضي</p>
        <p className="text-4xl font-mono font-bold mb-4">{formatTime(elapsedSeconds)}</p>

        <div className="flex gap-3">
          {activeTimer?.active ? (
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiPause className="w-4 h-4" />
              إيقاف
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiPlay className="w-4 h-4" />
              ابدأ
            </button>
          )}
        </div>
      </div>

      {/* Total Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">إجمالي الساعات</p>
          <p className="text-2xl font-bold text-white">{totalHours}</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">عدد السجلات</p>
          <p className="text-2xl font-bold text-white">{timeLogs.length}</p>
        </div>
      </div>

      {/* Time Logs */}
      {timeLogs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-300">سجلات الوقت</p>
          {timeLogs.slice(-5).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3 border border-slate-600/50"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {log.durationMinutes} دقيقة
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(log.date).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeTrackingWidget;
