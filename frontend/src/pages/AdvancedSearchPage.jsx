import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { FiSearch, FiX } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const AdvancedSearchPage = () => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    entity: 'all',
    status: '',
    priority: '',
    assignedTo: '',
    department: '',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filters.entity !== 'all') params.append('entity', filters.entity);

      const response = await API.get(`/api/search?${params}`);
      const payload = response.data?.results || {};
      let filtered = [];

      if (Array.isArray(payload)) {
        filtered = payload;
      } else {
        if (Array.isArray(payload.tasks)) {
          filtered = filtered.concat(payload.tasks.map((item) => ({ ...item, type: 'task' })));
        }
        if (Array.isArray(payload.clients)) {
          filtered = filtered.concat(payload.clients.map((item) => ({ ...item, type: 'client' })));
        }
        if (Array.isArray(payload.users)) {
          filtered = filtered.concat(payload.users.map((item) => ({ ...item, type: 'user' })));
        }
      }

      // Apply additional filters
      if (filters.status) {
        filtered = filtered.filter((item) => item.status === filters.status);
      }
      if (filters.priority) {
        filtered = filtered.filter((item) => item.priority === filters.priority);
      }

      setResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, t]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, filters, performSearch]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      entity: 'all',
      status: '',
      priority: '',
      assignedTo: '',
      department: '',
    });
    setResults([]);
  };

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{t('tasks.searchTasks')}</h1>
        <p className="text-slate-400">{t('buttons.search')} عبر المهام والعملاء والمستخدمين</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('tasks.searchTasks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Entity Filter */}
          <select
            value={filters.entity}
            onChange={(e) =>
              setFilters({ ...filters, entity: e.target.value })
            }
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="all">{t('buttons.filter')} - الكل</option>
            <option value="tasks">المهام</option>
            <option value="clients">العملاء</option>
            <option value="users">المستخدمون</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">{t('tasks.status')}</option>
            <option value="open">مفتوحة</option>
            <option value="in_progress">قيد التقدم</option>
            <option value="review">قيد المراجعة</option>
            <option value="completed">مكتملة</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">{t('tasks.priority')}</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="urgent">عاجلة</option>
          </select>

          {/* Clear Button */}
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition text-sm font-medium"
          >
            <FiX className="w-4 h-4" />
            مسح
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-slate-400 text-sm">
              وجدنا <span className="font-bold text-indigo-400">{results.length}</span> نتيجة
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          </>
        ) : searchQuery.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FiSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('messages.noData')}</p>
            <p className="text-sm mt-2">ابدأ البحث للعثور على المهام والعملاء والمستخدمين</p>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>{t('messages.noData')}</p>
            <p className="text-sm mt-2">جرب كلمات بحث مختلفة</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchResultCard = ({ result }) => {
  const getTypeColor = (type) => {
    const colors = {
      task: 'from-blue-600 to-blue-700',
      client: 'from-green-600 to-green-700',
      user: 'from-purple-600 to-purple-700',
    };
    return colors[type] || 'from-slate-600 to-slate-700';
  };

  const getTypeLabel = (type) => {
    const labels = {
      task: '🎯 مهمة',
      client: '👤 عميل',
      user: '👨 مستخدم',
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-lg p-4 border border-slate-700/50 hover:border-indigo-500/50 transition cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${getTypeColor(result.type)} flex-shrink-0`}>
          <span className="text-white text-sm font-bold">
            {result.type === 'task' ? '🎯' : result.type === 'client' ? '👤' : '👨'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-indigo-400 transition">
            {result.title || result.name || result.full_name}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {getTypeLabel(result.type)}
            {result.status && ` • ${result.status}`}
            {result.priority && ` • ${result.priority}`}
          </p>
          {result.description && (
            <p className="text-sm text-slate-300 mt-2 line-clamp-2">{result.description}</p>
          )}
          {result.email && (
            <p className="text-xs text-slate-400 mt-1">{result.email}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchPage;
