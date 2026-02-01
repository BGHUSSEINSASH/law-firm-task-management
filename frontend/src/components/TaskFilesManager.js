import React, { useState, useEffect } from 'react';
import { FiUpload, FiX, FiDownload, FiFile, FiImage, FiArchive, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const TaskFilesManager = ({ taskId }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [requirements, setRequirements] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(null);

  useEffect(() => {
    fetchFiles();
    fetchRequirements();
  }, [taskId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/files/${taskId}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast.error('فشل تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/files/requirements/${user?.role || 'lawyer'}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequirements(response.data.requirements);
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    setSelectedFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files;
    setSelectedFiles(selected);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('الرجاء اختيار ملف واحد على الأقل');
      return;
    }

    // Check file count
    if (files.length + selectedFiles.length > (requirements?.maxFiles || 30)) {
      toast.error(`تم تجاوز الحد الأقصى من الملفات (${requirements?.maxFiles || 30})`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/files/${taskId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedFiles(null);
        fetchFiles();

        // Reset input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'فشل رفع الملفات');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      window.open(
        `http://localhost:5000/api/files/${taskId}/download/${file.id}?token=${token}`,
        '_blank'
      );
    } catch (error) {
      console.error('Download error:', error);
      toast.error('فشل تحميل الملف');
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`هل تريد حذف الملف "${file.filename}"؟`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/files/${taskId}/files/${file.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('تم حذف الملف بنجاح');
        fetchFiles();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'فشل حذف الملف');
    }
  };

  const getFileIcon = (category) => {
    switch (category) {
      case 'image':
        return <FiImage className="text-blue-500 text-2xl" />;
      case 'document':
        return <FiFile className="text-red-500 text-2xl" />;
      case 'archive':
        return <FiArchive className="text-yellow-500 text-2xl" />;
      default:
        return <FiFile className="text-gray-500 text-2xl" />;
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      image: 'صورة',
      document: 'مستند',
      archive: 'ملف مضغوط',
      other: 'ملف آخر'
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiUpload className="text-blue-500" />
          رفع الملفات والمستندات
        </h3>

        {/* Requirements Info */}
        {requirements && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-2 font-semibold">متطلبات الملفات:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• الحد الأقصى: {requirements.maxFiles} ملف</li>
              <li>• حجم الملف الأقصى: {requirements.maxFileSize}</li>
              <li>• الصور المدعومة: {requirements.allowedTypes.images.join(', ')}</li>
              <li>• المستندات المدعومة: {requirements.allowedTypes.documents.join(', ')}</li>
              <li>• الملفات المضغوطة: {requirements.allowedTypes.archives.join(', ')}</li>
            </ul>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
          <p className="text-gray-600 mb-2">اسحب الملفات هنا أو</p>
          <label className="cursor-pointer">
            <span className="text-blue-500 font-semibold hover:underline">
              اختر الملفات
            </span>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xlsx,.xls,.txt,.zip,.rar,.7z"
            />
          </label>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles && selectedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              الملفات المختارة: {selectedFiles.length}
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.from(selectedFiles).map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFiles || selectedFiles.length === 0}
          className="mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
        >
          {uploading ? 'جاري الرفع...' : 'رفع الملفات'}
        </button>

        {selectedFiles && selectedFiles.length > 0 && (
          <button
            onClick={() => {
              setSelectedFiles(null);
              const fileInput = document.getElementById('file-input');
              if (fileInput) fileInput.value = '';
            }}
            className="mt-2 w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            إلغاء
          </button>
        )}
      </div>

      {/* Files List */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiFile className="text-gray-500" />
          الملفات المرفقة
          {files.length > 0 && (
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {files.length}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiFile className="mx-auto text-4xl mb-2 opacity-50" />
            <p>لم يتم رفع أي ملفات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getFileIcon(file.category)}
                  <div>
                    <p className="font-semibold text-gray-800">{file.filename}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="bg-gray-200 px-2 py-1 rounded">
                        {getCategoryLabel(file.category)}
                      </span>
                      <span>{file.size}</span>
                      <span>بواسطة: {file.uploadedBy}</span>
                      <span>
                        {new Date(file.uploadedAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    title="تحميل الملف"
                  >
                    <FiDownload className="text-xl" />
                  </button>

                  {file.canDelete && (
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="حذف الملف"
                    >
                      <FiX className="text-xl" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warnings */}
      {files.length >= (requirements?.maxFiles || 30) * 0.8 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="text-orange-500 text-xl flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold text-orange-800">تنبيه</p>
            <p className="text-sm text-orange-700">
              تم الوصول إلى 80% من الحد الأقصى للملفات ({files.length}/{requirements?.maxFiles || 30})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilesManager;
