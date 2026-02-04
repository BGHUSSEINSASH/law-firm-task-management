import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { FiSend, FiTrash2, FiHeart } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const TaskCommentsWidget = ({ taskId }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentions, setMentions] = useState([]);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await API.get(`/api/comments/${taskId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error('أدخل تعليق');
      return;
    }

    try {
      setLoading(true);
      const response = await API.post(`/api/comments/${taskId}`, {
        content: newComment,
        mentions,
      });

      setComments([...comments, response.data]);
      setNewComment('');
      setMentions([]);
      toast.success('تم إضافة التعليق');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('هل تريد حذف التعليق؟')) return;

    try {
      await API.delete(`/api/comments/${commentId}`);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('تم حذف التعليق');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(t('messages.error'));
    }
  };

  const handleLike = async (commentId) => {
    try {
      const response = await API.post(`/api/comments/${commentId}/like`);
      // Update like count
      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, likes: Array(response.data.likes) } : c
        )
      );
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl border border-slate-700/50">
      {/* Comments Header */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">
          💬 التعليقات ({comments.length})
        </h3>
      </div>

      {/* New Comment Input */}
      <div className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="أضف تعليقاً... استخدم @ لذكر شخص"
          rows="3"
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition resize-none"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setNewComment('');
              setMentions([]);
            }}
            className="px-4 py-2 text-slate-400 hover:text-white transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            <FiSend className="w-4 h-4" />
            إرسال
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-slate-400 py-8">لا توجد تعليقات حتى الآن</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:border-indigo-500/50 transition"
            >
              {/* Author */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {comment.author?.full_name?.charAt(0) || '👤'}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {comment.author?.full_name || 'مستخدم'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                {comment.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded transition"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-slate-300 mb-3">{comment.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-400 transition"
                >
                  <FiHeart className="w-4 h-4" />
                  {comment.likes?.length || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskCommentsWidget;
