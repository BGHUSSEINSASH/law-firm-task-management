# بطاقة مرجعية سريعة - Quick Reference Card

## الملفات المهمة - Important Files

### Backend
```
backend/routes/files.js
  └─ API endpoints للملفات
  └─ Multer configuration
  └─ Role-based validation
  └─ File storage logic
```

### Frontend
```
frontend/src/components/TaskFilesManager.js
  └─ File upload UI component
  └─ Drag & drop support
  └─ File management UI

frontend/src/pages/TasksPage.js
  └─ Task details modal
  └─ File count badge
  └─ Task selection handler
```

### Configuration
```
backend/server.js
  └─ Route registration: app.use('/api/files', ...)

.gitignore
  └─ backend/uploads/ excluded
```

---

## نقاط النهاية - API Endpoints

```
POST   /api/files/:taskId/upload              - رفع الملفات
GET    /api/files/:taskId/files               - الحصول على الملفات
GET    /api/files/:taskId/download/:fileId    - تنزيل الملف
DELETE /api/files/:taskId/files/:fileId       - حذف الملف
GET    /api/files/requirements/:role          - متطلبات الدور
```

---

## حدود الملفات - File Limits

| الدور | الحد الأقصى | الحجم/الملف | الحذف |
|------|-----------|----------|------|
| Admin | 50 | 50MB | الكل |
| Lawyer | 30 | 50MB | خاص |
| Dept Head | 40 | 50MB | الكل |

---

## أنواع الملفات المدعومة - Supported Types

```
صور:      JPG, PNG, GIF, WebP
مستندات: PDF, DOC, DOCX, XLS, XLSX, TXT
أرشيفات: ZIP, RAR, 7Z
```

---

## الميزات الرئيسية - Key Features

✅ السحب والإفلات - Drag & Drop
✅ رفع متعدد - Multi-file Upload
✅ تنزيل - Download
✅ حذف - Delete
✅ قيود قائمة على الأدوار - Role-based Restrictions
✅ تسجيل النشاط - Activity Logging

---

## التشغيل - Running

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start

# Then visit: http://localhost:3000
```

---

## التوثيق الكاملة - Full Documentation

1. **FILE_MANAGEMENT_SYSTEM.md** - التوثيق الشامل
2. **TESTING_GUIDE.md** - دليل الاختبار
3. **INTEGRATION_SUMMARY.md** - ملخص التكامل

---

## الأيقونات المستخدمة - Icons Used

```
FiFile       - File icon
FiImage      - Image icon
FiZip        - Archive icon
FiDownload   - Download button
FiTrash2     - Delete button
FiUpload     - Upload button
FiAlertCircle- Warning/Error
```

---

## الحالات - States

```javascript
// TasksPage.js
const [selectedTask, setSelectedTask] = useState(null);
const [showTaskDetails, setShowTaskDetails] = useState(false);

// TaskFilesManager.js
const [files, setFiles] = useState([]);
const [uploading, setUploading] = useState(false);
const [dragActive, setDragActive] = useState(false);
const [requirements, setRequirements] = useState(null);
```

---

## الأخطاء الشائعة - Common Errors

```
❌ "Unauthorized"
   → تحقق من التوكن أو صلاحيات المستخدم

❌ "File type not supported"
   → استخدم نوع ملف مدعوم

❌ "File exceeds size limit"
   → الملف أكبر من 50MB

❌ "Maximum files exceeded"
   → تم تجاوز الحد الأقصى للملفات
```

---

## المسارات - Routes

```
Frontend Routes:
  /tasks          - صفحة المهام الرئيسية

Backend Routes:
  /api/files/*    - جميع عمليات الملفات
  /api/tasks/*    - المهام والملفات المرتبطة
```

---

## التخزين - Storage

```
uploads/
└── tasks/
    ├── 1/
    │   ├── 1706520000000_contract.pdf
    │   └── 1706520000100_image.jpg
    └── 2/
        └── 1706520000200_document.docx
```

---

## إعادة التعيين - Reset

```bash
# لحذف جميع الملفات المرفوعة
rm -rf backend/uploads/

# ستتم إعادة إنشاء المجلدات تلقائياً عند الرفع الأول
```

---

## الحد الأدنى للتطلبات - Minimum Requirements

- Node.js 14+
- npm 6+
- Browser with ES6 support
- 100MB free disk space

---

## الإصدار - Version

```
Version: 1.0.0
Release Date: 2024-01-20
Status: ✅ Production Ready
```

---

**للمزيد من المعلومات، راجع التوثيق الكاملة**
**For more details, refer to full documentation files**
