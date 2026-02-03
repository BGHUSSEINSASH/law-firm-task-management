const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { inMemoryDB } = require('../inMemoryDB');
const { verifyHmac } = require('../middleware/hmac');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const taskFilesDir = path.join(uploadsDir, 'tasks');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(taskFilesDir)) {
  fs.mkdirSync(taskFilesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = req.params.taskId;
    const taskDir = path.join(taskFilesDir, taskId);
    
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }
    
    cb(null, taskDir);
  },
  filename: (req, file, cb) => {
    // Remove special characters from filename
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._\u0600-\u06FF]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}_${sanitized}`);
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  const blockedExtensions = ['.exe', '.dll', '.js', '.bat', '.cmd', '.ps1', '.sh', '.msi', '.apk'];
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (blockedExtensions.includes(extension)) {
    return cb(new Error('نوع الملف غير مسموح لأسباب أمنية'));
  }

  // Allowed file types
  const allowedMimes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'text/plain'],
    archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
  };

  const allowed = [
    ...allowedMimes.image,
    ...allowedMimes.document,
    ...allowedMimes.archive
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. الملفات المدعومة: صور (JPG, PNG, GIF)، مستندات (PDF, DOC, XLSX)، ملفات مضغوطة (ZIP, RAR)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 20 // Maximum 20 files per upload
  }
});

// Role-based file requirements
const roleFileRequirements = {
  admin: {
    maxFiles: 50,
    allowedTypes: ['image', 'document', 'archive'],
    canDeleteOthers: true,
    canViewAll: true
  },
  lawyer: {
    maxFiles: 30,
    allowedTypes: ['image', 'document', 'archive'],
    canDeleteOthers: false,
    canViewAll: false
  },
  department_head: {
    maxFiles: 40,
    allowedTypes: ['image', 'document', 'archive'],
    canDeleteOthers: true,
    canViewAll: true
  }
};

// Upload file for a task
router.post('/:taskId/upload', authMiddleware, verifyHmac, upload.array('files', 20), async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    // Check task access permissions
    const hasAccess = req.user.role === 'admin' || 
                     task.assigned_to === req.user.id || 
                     task.main_lawyer_id === req.user.id ||
                     task.created_by === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'غير مصرح بالوصول إلى هذه المهمة' });
    }

    // Check file requirements for role
    const requirements = roleFileRequirements[req.user.role] || roleFileRequirements.lawyer;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملفات' });
    }

    if (req.files.length > requirements.maxFiles) {
      return res.status(400).json({ 
        success: false, 
        message: `يمكنك رفع حد أقصى ${requirements.maxFiles} ملف` 
      });
    }

    // Initialize task files array if not exists
    if (!task.files) {
      task.files = [];
    }

    // Add uploaded files to task
    const uploadedFiles = req.files.map(file => {
      const checksum = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');

      if (process.env.ENABLE_AV_SCAN === 'true' && process.env.CLAMAV_PATH) {
        try {
          execFileSync(process.env.CLAMAV_PATH, ['--no-summary', file.path]);
        } catch (scanError) {
          fs.unlinkSync(file.path);
          throw new Error('فشل فحص الملف (قد يكون ضاراً)');
        }
      }

      const fileObj = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.originalname,
        savedName: file.filename,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size,
        checksum,
        uploadedBy: req.user.id,
        uploadedByName: req.user.full_name,
        uploadedAt: new Date(),
        category: getFileCategory(file.mimetype)
      };
      
      task.files.push(fileObj);
      
      // Log the activity
      const logId = Math.max(...inMemoryDB.activity_logs.keys(), 0) + 1;
      inMemoryDB.activity_logs.set(logId, {
        id: logId,
        task_id: taskId,
        action: 'file_uploaded',
        user_id: req.user.id,
        details: {
          filename: file.originalname,
          fileSize: file.size,
          category: getFileCategory(file.mimetype)
        },
        timestamp: new Date()
      });

      return {
        id: fileObj.id,
        filename: fileObj.filename,
        size: fileObj.size,
        category: fileObj.category,
        uploadedAt: fileObj.uploadedAt,
        uploadedBy: fileObj.uploadedByName
      };
    });

    res.json({
      success: true,
      message: `تم رفع ${uploadedFiles.length} ملف(ات) بنجاح`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'فشل رفع الملفات' });
  }
});

// Get task files
router.get('/:taskId/files', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    // Check access permissions
    const hasAccess = req.user.role === 'admin' || 
                     task.assigned_to === req.user.id || 
                     task.main_lawyer_id === req.user.id ||
                     task.created_by === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'غير مصرح بالوصول إلى هذه المهمة' });
    }

    const files = (task.files || []).map(file => ({
      id: file.id,
      filename: file.filename,
      category: file.category,
      size: formatFileSize(file.size),
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedByName,
      uploadedById: file.uploadedBy,
      canDelete: req.user.role === 'admin' || 
                req.user.id === file.uploadedBy ||
                req.user.role === 'department_head'
    }));

    res.json({ success: true, files, count: files.length });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الملفات' });
  }
});

// Download file
router.get('/:taskId/download/:fileId', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const fileId = req.params.fileId;
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    // Check access
    const hasAccess = req.user.role === 'admin' || 
                     task.assigned_to === req.user.id || 
                     task.main_lawyer_id === req.user.id ||
                     task.created_by === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'غير مصرح بالوصول' });
    }

    const file = (task.files || []).find(f => f.id === fileId);

    if (!file) {
      return res.status(404).json({ success: false, message: 'الملف غير موجود' });
    }

    const filePath = file.filepath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'الملف لم يعد متاحاً' });
    }

    res.download(filePath, file.filename);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل الملف' });
  }
});

// Delete file
router.delete('/:taskId/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const fileId = req.params.fileId;
    const task = inMemoryDB.tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    const fileIndex = (task.files || []).findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ success: false, message: 'الملف غير موجود' });
    }

    const file = task.files[fileIndex];

    // Check delete permissions
    const canDelete = req.user.role === 'admin' || 
                     req.user.id === file.uploadedBy ||
                     req.user.role === 'department_head';

    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'غير مصرح بحذف هذا الملف' });
    }

    // Delete physical file
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // Remove from task
    task.files.splice(fileIndex, 1);

    // Log activity
    const logId = Math.max(...inMemoryDB.activity_logs.keys(), 0) + 1;
    inMemoryDB.activity_logs.set(logId, {
      id: logId,
      task_id: taskId,
      action: 'file_deleted',
      user_id: req.user.id,
      details: { filename: file.filename },
      timestamp: new Date()
    });

    res.json({ success: true, message: 'تم حذف الملف بنجاح' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'فشل حذف الملف' });
  }
});

// Get file requirements for user role
router.get('/requirements/:role', authMiddleware, (req, res) => {
  const role = req.params.role;
  const requirements = roleFileRequirements[role] || roleFileRequirements.lawyer;

  res.json({
    success: true,
    requirements: {
      maxFiles: requirements.maxFiles,
      maxFileSize: '50 MB',
      allowedTypes: {
        images: ['.jpg', '.png', '.gif', '.webp'],
        documents: ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.txt'],
        archives: ['.zip', '.rar', '.7z']
      }
    }
  });
});

// Helper functions
function getFileCategory(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.includes('pdf') || mimetype.includes('word') || 
      mimetype.includes('document') || mimetype.includes('excel') ||
      mimetype.includes('spreadsheet') || mimetype === 'text/plain') {
    return 'document';
  }
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) {
    return 'archive';
  }
  return 'other';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = router;
