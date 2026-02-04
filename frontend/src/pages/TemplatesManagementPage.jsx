import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const TemplatesManagementPage = () => {
  const { t } = useI18n();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
  });
  const [templateVars, setTemplateVars] = useState({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.content) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (editingTemplate) {
        await API.put(`/api/templates/${editingTemplate.id}`, formData);
        toast.success('تم تحديث القالب بنجاح');
      } else {
        await API.post('/api/templates', formData);
        toast.success('تم إنشاء القالب بنجاح');
      }
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', description: '', content: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error(t('messages.error'));
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    try {
      await API.delete(`/api/templates/${id}`);
      toast.success('تم حذف القالب بنجاح');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error(t('messages.error'));
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
    });
    setShowModal(true);
  };

  const handleRenderTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await API.post('/api/templates/render', {
        templateId: selectedTemplate.id,
        variables: templateVars,
      });
      setPreviewMode(true);
      toast.success(t('reports.previewReport'));
    } catch (error) {
      console.error('Failed to render template:', error);
      toast.error(t('messages.error'));
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
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">إدارة القوالب</h1>
          <p className="text-slate-400">إنشائ وتحرير واستخدام قوالب العقود</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({ name: '', description: '', content: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
        >
          <FiPlus className="w-5 h-5" />
          {t('buttons.add')} قالب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-white">القوالب المتاحة</h2>
          {templates.length > 0 ? (
            templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 rounded-lg border transition cursor-pointer ${
                  selectedTemplate?.id === template.id
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50'
                }`}
              >
                <h3 className="font-semibold text-white">{template.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTemplate(template);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm transition"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>لا توجد قوالب</p>
            </div>
          )}
        </div>

        {/* Template Editor/Viewer */}
        <div className="lg:col-span-2">
          {selectedTemplate && !previewMode ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  متغيرات القالب
                </label>
                <div className="space-y-2 mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-2">تعبئة المتغيرات التالية:</p>
                  {/* Extract variables from template */}
                  {extractTemplateVariables(selectedTemplate.content).map((variable) => (
                    <input
                      key={variable}
                      type="text"
                      placeholder={variable}
                      value={templateVars[variable] || ''}
                      onChange={(e) =>
                        setTemplateVars({ ...templateVars, [variable]: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  محتوى القالب
                </label>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-slate-300 text-sm max-h-96 overflow-auto whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              </div>

              <button
                onClick={handleRenderTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                <FiEye className="w-5 h-5" />
                معاينة القالب
              </button>
            </div>
          ) : previewMode && selectedTemplate ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-lg">معاينة النتيجة</h3>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-sm transition"
                >
                  عودة
                </button>
              </div>

              <div className="p-4 bg-white rounded-lg text-slate-800 max-h-96 overflow-auto text-sm">
                {/* Rendered content */}
                <p className="whitespace-pre-wrap">محتوى القالب المعاد</p>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                <FiDownload className="w-5 h-5" />
                تحميل كـ PDF
              </button>
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl border border-slate-700/50">
              <FiEye className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
              <p className="text-slate-400">اختر قالباً لمعاينته</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showModal && (
        <TemplateModal
          template={editingTemplate}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveTemplate}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const TemplateModal = ({ template, formData, setFormData, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700/50 max-w-2xl w-full space-y-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-white">
          {template ? 'تعديل القالب' : 'إنشاء قالب جديد'}
        </h2>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            اسم القالب
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            placeholder="اسم القالب"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            الوصف
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            placeholder="وصف القالب"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            المحتوى (استخدم {{'{variable}'}} للمتغيرات)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 h-48 font-mono text-sm"
            placeholder="محتوى القالب..."
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg font-medium transition"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

const extractTemplateVariables = (content) => {
  const regex = /{{\s*(\w+)\s*}}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(content))) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};

export default TemplatesManagementPage;
