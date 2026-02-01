import React, { useState, useEffect } from 'react';
import { FiUpload, FiDownload, FiTrash2, FiFile, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const FileManagementPage = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`http://localhost:5000/api/files/${currentFolder || 'root'}/files`, { headers });
      setFiles(response.data.files || []);
      setFolders(response.data.folders || []);
    } catch (error) {
      toast.error('فشل تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    const formData = new FormData();
    uploadedFiles.forEach(file => {
      formData.append('files', file);
    });
    if (currentFolder) {
      formData.append('folder_id', currentFolder);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/files/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      setFiles([...files, ...response.data.files]);
      setUploadProgress(0);
      toast.success('تم رفع الملفات بنجاح');
    } catch (error) {
      toast.error('فشل رفع الملفات');
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('أدخل اسم المجلد الجديد:');
    if (!folderName) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/files/create-folder',
        { name: folderName, parent_id: currentFolder },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolders([...folders, response.data.folder]);
      toast.success('تم إنشاء المجلد بنجاح');
    } catch (error) {
      toast.error('فشل إنشاء المجلد');
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الملف؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(f => f.id !== id));
      toast.success('تم حذف الملف بنجاح');
    } catch (error) {
      toast.error('فشل حذف الملف');
    }
  };

  const handleDownloadFile = async (id, name) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/files/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('فشل تحميل الملف');
    }
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('csv')) return '📊';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            📁 إدارة الملفات
          </h1>
          <p className="text-gray-600">تنظيم وإدارة ملفاتك بكفاءة</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="البحث عن الملفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCreateFolder}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              + مجلد جديد
            </button>
            <label className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition">
              <FiUpload className="inline mr-2" /> رفع ملفات
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* Breadcrumb */}
        {currentFolder && (
          <div className="mb-4">
            <button
              onClick={() => setCurrentFolder(null)}
              className="text-blue-500 hover:text-blue-700 font-semibold"
            >
              ← الرجوع إلى الجذر
            </button>
          </div>
        )}

        {/* Folders Grid */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">المجلدات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition transform hover:scale-105"
                >
                  <FiFolder className="w-12 h-12 text-yellow-500 mb-2" />
                  <p className="font-semibold text-gray-900 line-clamp-2">{folder.name}</p>
                  <p className="text-sm text-gray-500 mt-2">{folder.file_count || 0} ملفات</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">الملفات</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl">⏳</div>
              <p className="text-gray-600 mt-4">جاري تحميل الملفات...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <FiFile className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">لا توجد ملفات</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <th className="px-6 py-3 text-right">الملف</th>
                    <th className="px-6 py-3 text-right">الحجم</th>
                    <th className="px-6 py-3 text-right">النوع</th>
                    <th className="px-6 py-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <span className="font-semibold text-gray-900 line-clamp-1">{file.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatFileSize(file.size)}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{file.type}</td>
                      <td className="px-6 py-4 flex justify-center gap-3">
                        <button
                          onClick={() => handleDownloadFile(file.id, file.name)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <FiDownload className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManagementPage;
