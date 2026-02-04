// Frontend i18n Translations (AR/EN)
export const translations = {
  ar: {
    // Navigation
    nav: {
      dashboard: 'لوحة التحكم',
      tasks: 'المهام',
      tasksKanban: 'لوحة المهام',
      clients: 'العملاء',
      lawyers: 'المحامون',
      departments: 'الأقسام',
      stages: 'المراحل',
      users: 'المستخدمون',
      notifications: 'الإشعارات',
      reports: 'التقارير',
      invoices: 'الفواتير',
      activityLog: 'سجل النشاط',
      admins: 'المسؤولون',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
    },

    // Common Buttons
    buttons: {
      add: 'إضافة',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      submit: 'إرسال',
      search: 'بحث',
      filter: 'تصفية',
      export: 'تصدير',
      import: 'استيراد',
      download: 'تحميل',
      upload: 'رفع',
      close: 'إغلاق',
      back: 'عودة',
      next: 'التالي',
      previous: 'السابق',
      refresh: 'تحديث',
      reset: 'إعادة تعيين',
      approve: 'موافقة',
      reject: 'رفض',
      archive: 'أرشفة',
      unarchive: 'الغاء الأرشفة',
      preview: 'معاينة',
    },

    // Form Labels
    form: {
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      title: 'العنوان',
      description: 'الوصف',
      status: 'الحالة',
      priority: 'الأولوية',
      dueDate: 'تاريخ الاستحقاق',
      assignedTo: 'المسند إلى',
      department: 'القسم',
      client: 'العميل',
      lawyer: 'المحامي',
      notes: 'ملاحظات',
      address: 'العنوان',
      city: 'المدينة',
      country: 'الدولة',
      zipCode: 'الرمز البريدي',
      username: 'اسم المستخدم',
      role: 'الدور',
      startDate: 'تاريخ البداية',
      endDate: 'تاريخ النهاية',
    },

    // Messages
    messages: {
      success: 'تم بنجاح',
      error: 'حدث خطأ',
      warning: 'تحذير',
      info: 'معلومة',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      confirm: 'هل أنت متأكد؟',
      deleteConfirm: 'هل تريد بالفعل حذف هذا العنصر؟',
      savedSuccessfully: 'تم الحفظ بنجاح',
      deletedSuccessfully: 'تم الحذف بنجاح',
      loginFailed: 'فشل تسجيل الدخول',
      unauthorized: 'غير مصرح',
      forbidden: 'ممنوع الوصول',
      notFound: 'لم يتم العثور عليه',
      serverError: 'خطأ في الخادم',
      requiredField: 'هذا الحقل مطلوب',
      invalidEmail: 'بريد إلكتروني غير صحيح',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      sessionExpired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى',
    },

    // 2FA
    twoFA: {
      title: 'المصادقة الثنائية',
      enable: 'تفعيل المصادقة الثنائية',
      disable: 'تعطيل المصادقة الثنائية',
      setupQR: 'مسح رمز الاستجابة السريعة',
      scanCode: 'امسح الرمز باستخدام تطبيق المصادقة',
      enterOTP: 'أدخل الرمز المكون من 6 أرقام',
      backupCodes: 'الرموز الاحتياطية',
      saveBackupCodes: 'احفظ هذه الرموز في مكان آمن',
      downloadBackupCodes: 'تحميل الرموز الاحتياطية',
      setupSuccess: 'تم تفعيل المصادقة الثنائية بنجاح',
    },

    // Comments
    comments: {
      title: 'التعليقات',
      addComment: 'أضف تعليقاً',
      noComments: 'لا توجد تعليقات',
      mentionUser: 'اذكر مستخدماً',
      deleteComment: 'حذف التعليق',
      like: 'إعجاب',
    },

    // Time Tracking
    timeTracking: {
      title: 'تتبع الوقت',
      start: 'ابدأ',
      stop: 'إيقاف',
      pause: 'إيقاف مؤقت',
      resume: 'استئناف',
      totalHours: 'إجمالي الساعات',
      today: 'اليوم',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      timeLogs: 'سجلات الوقت',
      generateReport: 'إنشاء تقرير',
    },

    // Dashboard
    dashboard: {
      title: 'لوحة التحكم',
      welcome: 'مرحبا',
      overdue: 'متأخر',
      pending: 'قيد الانتظار',
      completed: 'مكتمل',
      totalTasks: 'إجمالي المهام',
      completedTasks: 'المهام المكتملة',
      pendingTasks: 'المهام المعلقة',
      overdueTasks: 'المهام المتأخرة',
      slaCompliance: 'امتثال SLA',
      performanceMetrics: 'مقاييس الأداء',
      recentActivities: 'الأنشطة الأخيرة',
      upcomingDeadlines: 'المواعيد النهائية القادمة',
    },

    // Tasks
    tasks: {
      title: 'المهام',
      addTask: 'إضافة مهمة',
      editTask: 'تعديل المهمة',
      taskCode: 'رمز المهمة',
      taskDetails: 'تفاصيل المهمة',
      status: {
        open: 'مفتوحة',
        inProgress: 'قيد التقدم',
        review: 'قيد المراجعة',
        completed: 'مكتملة',
        archived: 'مؤرشفة',
      },
      priority: {
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        urgent: 'عاجلة',
      },
      noTasks: 'لا توجد مهام',
      searchTasks: 'ابحث عن المهام...',
    },

    // Clients
    clients: {
      title: 'العملاء',
      addClient: 'إضافة عميل',
      editClient: 'تعديل العميل',
      clientDetails: 'تفاصيل العميل',
      companyName: 'اسم الشركة',
      contactPerson: 'جهة الاتصال',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      noClients: 'لا يوجد عملاء',
    },

    // Users
    users: {
      title: 'المستخدمون',
      addUser: 'إضافة مستخدم',
      editUser: 'تعديل المستخدم',
      userDetails: 'تفاصيل المستخدم',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      status: 'الحالة',
      active: 'نشط',
      inactive: 'غير نشط',
      roles: {
        admin: 'مسؤول',
        departmentHead: 'رئيس القسم',
        lawyer: 'محامي',
        assistant: 'مساعد',
      },
    },

    // Reports
    reports: {
      title: 'التقارير',
      generateReport: 'إنشاء تقرير',
      taskReport: 'تقرير المهام',
      performanceReport: 'تقرير الأداء',
      slaReport: 'تقرير SLA',
      revenueReport: 'تقرير الإيرادات',
      previewReport: 'معاينة التقرير',
      downloadPDF: 'تحميل PDF',
      exportExcel: 'تصدير Excel',
    },

    // Notifications
    notifications: {
      title: 'الإشعارات',
      noNotifications: 'لا توجد إشعارات',
      markAsRead: 'وضع علامة كمقروء',
      markAllAsRead: 'وضع علامة على الكل كمقروء',
      deleteNotification: 'حذف الإشعار',
      clearAll: 'حذف الكل',
    },

    // Language
    language: {
      selectLanguage: 'اختر اللغة',
      arabic: 'العربية',
      english: 'English',
    },

    // Activity Log
    activityLog: {
      title: 'سجل النشاط',
      action: 'الإجراء',
      user: 'المستخدم',
      entity: 'الكيان',
      details: 'التفاصيل',
      timestamp: 'التاريخ والوقت',
      filter: 'تصفية حسب...',
    },

    // Admin
    admin: {
      title: 'إدارة النظام',
      addAdmin: 'إضافة مسؤول',
      editAdmin: 'تعديل المسؤول',
      adminsList: 'قائمة المسؤولين',
    },

    // Settings
    settings: {
      title: 'الإعدادات',
      changePassword: 'تغيير كلمة المرور',
      twoFactor: 'المصادقة الثنائية',
      sessions: 'الجلسات النشطة',
      preferences: 'التفضيلات',
      privacy: 'الخصوصية',
      notifications: 'الإشعارات',
    },

    // Invoices
    invoices: {
      title: 'الفواتير',
      invoiceNumber: 'رقم الفاتورة',
      invoiceDate: 'تاريخ الفاتورة',
      dueDate: 'تاريخ الاستحقاق',
      amount: 'المبلغ',
      status: 'الحالة',
      paid: 'مدفوع',
      pending: 'قيد الانتظار',
      overdue: 'متأخر',
    },
  },

  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      tasksKanban: 'Kanban Board',
      clients: 'Clients',
      lawyers: 'Lawyers',
      departments: 'Departments',
      stages: 'Stages',
      users: 'Users',
      notifications: 'Notifications',
      reports: 'Reports',
      invoices: 'Invoices',
      activityLog: 'Activity Log',
      admins: 'Admins',
      settings: 'Settings',
      logout: 'Logout',
    },

    // Common Buttons
    buttons: {
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      refresh: 'Refresh',
      reset: 'Reset',
      approve: 'Approve',
      reject: 'Reject',
      archive: 'Archive',
      unarchive: 'Unarchive',
      preview: 'Preview',
    },

    // Form Labels
    form: {
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      phone: 'Phone Number',
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      dueDate: 'Due Date',
      assignedTo: 'Assigned To',
      department: 'Department',
      client: 'Client',
      lawyer: 'Lawyer',
      notes: 'Notes',
      address: 'Address',
      city: 'City',
      country: 'Country',
      zipCode: 'Zip Code',
      username: 'Username',
      role: 'Role',
      startDate: 'Start Date',
      endDate: 'End Date',
    },

    // Messages
    messages: {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      loading: 'Loading...',
      noData: 'No data available',
      confirm: 'Are you sure?',
      deleteConfirm: 'Are you sure you want to delete this item?',
      savedSuccessfully: 'Saved successfully',
      deletedSuccessfully: 'Deleted successfully',
      loginFailed: 'Login failed',
      unauthorized: 'Unauthorized',
      forbidden: 'Access denied',
      notFound: 'Not found',
      serverError: 'Server error',
      requiredField: 'This field is required',
      invalidEmail: 'Invalid email address',
      passwordMismatch: 'Passwords do not match',
      sessionExpired: 'Your session has expired. Please login again',
    },

    // 2FA
    twoFA: {
      title: 'Two-Factor Authentication',
      enable: 'Enable 2FA',
      disable: 'Disable 2FA',
      setupQR: 'Scan QR Code',
      scanCode: 'Scan the code using an authenticator app',
      enterOTP: 'Enter 6-digit code',
      backupCodes: 'Backup Codes',
      saveBackupCodes: 'Save these codes in a secure place',
      downloadBackupCodes: 'Download Backup Codes',
      setupSuccess: '2FA enabled successfully',
    },

    // Comments
    comments: {
      title: 'Comments',
      addComment: 'Add a comment',
      noComments: 'No comments yet',
      mentionUser: 'Mention a user',
      deleteComment: 'Delete comment',
      like: 'Like',
    },

    // Time Tracking
    timeTracking: {
      title: 'Time Tracking',
      start: 'Start',
      stop: 'Stop',
      pause: 'Pause',
      resume: 'Resume',
      totalHours: 'Total Hours',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      timeLogs: 'Time Logs',
      generateReport: 'Generate Report',
    },

    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      overdue: 'Overdue',
      pending: 'Pending',
      completed: 'Completed',
      totalTasks: 'Total Tasks',
      completedTasks: 'Completed Tasks',
      pendingTasks: 'Pending Tasks',
      overdueTasks: 'Overdue Tasks',
      slaCompliance: 'SLA Compliance',
      performanceMetrics: 'Performance Metrics',
      recentActivities: 'Recent Activities',
      upcomingDeadlines: 'Upcoming Deadlines',
    },

    // Tasks
    tasks: {
      title: 'Tasks',
      addTask: 'Add Task',
      editTask: 'Edit Task',
      taskCode: 'Task Code',
      taskDetails: 'Task Details',
      status: {
        open: 'Open',
        inProgress: 'In Progress',
        review: 'Under Review',
        completed: 'Completed',
        archived: 'Archived',
      },
      priority: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent',
      },
      noTasks: 'No tasks found',
      searchTasks: 'Search tasks...',
    },

    // Clients
    clients: {
      title: 'Clients',
      addClient: 'Add Client',
      editClient: 'Edit Client',
      clientDetails: 'Client Details',
      companyName: 'Company Name',
      contactPerson: 'Contact Person',
      email: 'Email',
      phone: 'Phone Number',
      noClients: 'No clients found',
    },

    // Users
    users: {
      title: 'Users',
      addUser: 'Add User',
      editUser: 'Edit User',
      userDetails: 'User Details',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      roles: {
        admin: 'Admin',
        departmentHead: 'Department Head',
        lawyer: 'Lawyer',
        assistant: 'Assistant',
      },
    },

    // Reports
    reports: {
      title: 'Reports',
      generateReport: 'Generate Report',
      taskReport: 'Task Report',
      performanceReport: 'Performance Report',
      slaReport: 'SLA Report',
      revenueReport: 'Revenue Report',
      previewReport: 'Preview Report',
      downloadPDF: 'Download PDF',
      exportExcel: 'Export to Excel',
    },

    // Notifications
    notifications: {
      title: 'Notifications',
      noNotifications: 'No notifications',
      markAsRead: 'Mark as read',
      markAllAsRead: 'Mark all as read',
      deleteNotification: 'Delete notification',
      clearAll: 'Clear all',
    },

    // Language
    language: {
      selectLanguage: 'Select Language',
      arabic: 'العربية',
      english: 'English',
    },

    // Activity Log
    activityLog: {
      title: 'Activity Log',
      action: 'Action',
      user: 'User',
      entity: 'Entity',
      details: 'Details',
      timestamp: 'Timestamp',
      filter: 'Filter by...',
    },

    // Admin
    admin: {
      title: 'System Administration',
      addAdmin: 'Add Admin',
      editAdmin: 'Edit Admin',
      adminsList: 'Admins List',
    },

    // Settings
    settings: {
      title: 'Settings',
      changePassword: 'Change Password',
      twoFactor: 'Two-Factor Authentication',
      sessions: 'Active Sessions',
      preferences: 'Preferences',
      privacy: 'Privacy',
      notifications: 'Notifications',
    },

    // Invoices
    invoices: {
      title: 'Invoices',
      invoiceNumber: 'Invoice Number',
      invoiceDate: 'Invoice Date',
      dueDate: 'Due Date',
      amount: 'Amount',
      status: 'Status',
      paid: 'Paid',
      pending: 'Pending',
      overdue: 'Overdue',
    },
  },
};
