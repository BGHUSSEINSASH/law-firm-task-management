const bcrypt = require('bcrypt');

// In-memory storage
const inMemoryDB = {
  users: new Map(),
  tasks: new Map(),
  departments: new Map(),
  lawyers: new Map(),
  clients: new Map(),
  stages: new Map(),  // المراحل
  activity_logs: new Map(),  // سجل النشاطات
  notifications: new Map(),  // الإشعارات
  invoices: new Map(),  // الفواتير
  files: new Map(),  // الملفات
  statistics: {}
};

// Initialize test data
const testPassword = 'password123';
let passwordHash = null;

async function initializeData() {
  passwordHash = await bcrypt.hash(testPassword, 10);
  
  // Users
  inMemoryDB.users.set(1, {
    id: 1,
    email: 'admin@lawfirm.com',
    password: passwordHash,
    username: 'admin',
    full_name: 'مدير النظام',
    role: 'admin',
    department_id: null,
    created_at: new Date()
  });
  
  inMemoryDB.users.set(2, {
    id: 2,
    email: 'lawyer1@lawfirm.com',
    password: passwordHash,
    username: 'lawyer1',
    full_name: 'محام رئيسي',
    role: 'lawyer',
    department_id: 1,
    created_at: new Date()
  });
  
  inMemoryDB.users.set(3, {
    id: 3,
    email: 'head.contracts@lawfirm.com',
    password: passwordHash,
    username: 'head_contracts',
    full_name: 'رئيس قسم العقود',
    role: 'department_head',
    department_id: 1,
    created_at: new Date()
  });
  
  inMemoryDB.users.set(4, {
    id: 4,
    email: 'lawyer2@lawfirm.com',
    password: passwordHash,
    username: 'lawyer2',
    full_name: 'محام ثاني',
    role: 'lawyer',
    department_id: 2,
    created_at: new Date()
  });
  
  inMemoryDB.users.set(5, {
    id: 5,
    email: 'assistant@lawfirm.com',
    password: passwordHash,
    username: 'assistant',
    full_name: 'مساعد إداري',
    role: 'assistant',
    department_id: 1,
    created_at: new Date()
  });

  // Departments
  inMemoryDB.departments.set(1, {
    id: 1,
    name: 'قسم العقود',
    description: 'قسم متخصص في العقود والاتفاقيات',
    created_at: new Date()
  });
  
  inMemoryDB.departments.set(2, {
    id: 2,
    name: 'قسم الأحوال الشخصية',
    description: 'قسم متخصص في قضايا الأحوال الشخصية',
    created_at: new Date()
  });
  
  inMemoryDB.departments.set(3, {
    id: 3,
    name: 'قسم الجنايات',
    description: 'قسم متخصص في قضايا الجنايات',
    created_at: new Date()
  });
  
  inMemoryDB.departments.set(4, {
    id: 4,
    name: 'قسم القانون الإداري',
    description: 'قسم متخصص في القانون الإداري',
    created_at: new Date()
  });

  // Clients/Companies
  inMemoryDB.clients.set(1, {
    id: 1,
    name: 'شركة النخبة للتجارة',
    contact_person: 'أحمد السعيد',
    email: 'contact@elite-trade.com',
    phone: '0501234567',
    address: 'الرياض، طريق الملك فهد',
    type: 'corporate',
    created_at: new Date()
  });

  inMemoryDB.clients.set(2, {
    id: 2,
    name: 'مؤسسة البناء الحديث',
    contact_person: 'محمد العتيبي',
    email: 'info@modern-build.com',
    phone: '0509876543',
    address: 'جدة، حي الزهراء',
    type: 'corporate',
    created_at: new Date()
  });

  inMemoryDB.clients.set(3, {
    id: 3,
    name: 'خالد بن محمد الفهد',
    contact_person: 'خالد الفهد',
    email: 'khalid.fahad@email.com',
    phone: '0551234567',
    address: 'الدمام، حي الشاطئ',
    type: 'individual',
    created_at: new Date()
  });

  inMemoryDB.clients.set(4, {
    id: 4,
    name: 'شركة التقنية المتطورة',
    contact_person: 'سارة القحطاني',
    email: 'sara@advanced-tech.com',
    phone: '0557654321',
    address: 'الرياض، حي العليا',
    type: 'corporate',
    created_at: new Date()
  });

  inMemoryDB.clients.set(5, {
    id: 5,
    name: 'مكتب الأفق للاستشارات',
    contact_person: 'ليلى الزهراني',
    email: 'info@horizon-consult.com',
    phone: '0553344556',
    address: 'الرياض، حي النرجس',
    type: 'corporate',
    created_at: new Date()
  });

  inMemoryDB.clients.set(6, {
    id: 6,
    name: 'فهد عبدالعزيز الشمري',
    contact_person: 'فهد الشمري',
    email: 'fahad.shammari@email.com',
    phone: '0547788990',
    address: 'الخبر، حي الخزامى',
    type: 'individual',
    created_at: new Date()
  });

  inMemoryDB.clients.set(7, {
    id: 7,
    name: 'شركة دجلة للتطوير العقاري',
    contact_person: 'حيدر عبدالجبار',
    email: 'info@tigris-dev.iq',
    phone: '07701234567',
    address: 'بغداد، المنصور، شارع 14 رمضان',
    type: 'corporate',
    created_at: new Date()
  });

  inMemoryDB.clients.set(8, {
    id: 8,
    name: 'مصنع الرافدين للأدوية',
    contact_person: 'زينب كريم',
    email: 'legal@rafidain-pharma.iq',
    phone: '07811223344',
    address: 'البصرة، حي الجزائر',
    type: 'corporate',
    created_at: new Date()
  });

  inMemoryDB.clients.set(9, {
    id: 9,
    name: 'سيف محمد علي',
    contact_person: 'سيف محمد علي',
    email: 'saif.mohammed@email.com',
    phone: '07505566778',
    address: 'النجف، حي الأمير',
    type: 'individual',
    created_at: new Date()
  });

  // Lawyers
  inMemoryDB.lawyers.set(1, {
    id: 1,
    user_id: 2,
    name: 'محام رئيسي',
    specialization: 'عقود تجارية',
    experience_years: 10,
    phone: '0501234567',
    workload_percentage: 45,
    assigned_tasks: 9,
    created_at: new Date()
  });
  
  inMemoryDB.lawyers.set(2, {
    id: 2,
    user_id: 4,
    name: 'محام ثاني',
    specialization: 'أحوال شخصية',
    experience_years: 7,
    phone: '0509876543',
    workload_percentage: 75,
    assigned_tasks: 15,
    created_at: new Date()
  });

  // Tasks
  const tasks = [
    { id: 1, task_code: 'TSK-2025-001', client_id: 1, title: 'مراجعة العقد الأول', status: 'pending', priority: 'high', description: 'مراجعة شاملة للعقد التجاري', assigned_to: 1, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 2, task_code: 'TSK-2025-002', client_id: 2, title: 'تحضير مذكرة قانونية', status: 'in_progress', priority: 'high', description: 'تحضير مذكرة دفاع شاملة', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 3, task_code: 'TSK-2025-003', client_id: 3, title: 'اتصال مع العميل', status: 'completed', priority: 'medium', description: 'متابعة مع العميل بخصوص القضية', assigned_to: 1, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
    { id: 4, task_code: 'TSK-2025-004', client_id: 1, title: 'تحضير الأوراق القانونية', status: 'pending', priority: 'medium', description: 'تحضير جميع الأوراق المطلوبة', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 2, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 5, task_code: 'TSK-2025-005', client_id: 4, title: 'مراجعة الجواب الكتابي', status: 'in_progress', priority: 'high', description: 'مراجعة وتحرير الجواب الكتابي', assigned_to: 1, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 6, task_code: 'TSK-2025-006', client_id: 2, title: 'جدولة الجلسة', status: 'completed', priority: 'low', description: 'تنسيق موعد الجلسة', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 2, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: 7, task_code: 'TSK-2025-007', client_id: 3, title: 'البحث عن السوابق', status: 'pending', priority: 'medium', description: 'البحث عن الأحكام والسوابق ذات الصلة', assigned_to: 1, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 8, task_code: 'TSK-2025-008', client_id: 4, title: 'تحليل الحجج القانونية', status: 'in_progress', priority: 'high', description: 'تحليل شامل للحجج المقدمة', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 2, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 9, task_code: 'TSK-2025-009', client_id: 1, title: 'تصويب المستندات', status: 'completed', priority: 'low', description: 'تصويب وتنسيق المستندات', assigned_to: 1, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 10, task_code: 'TSK-2025-010', client_id: 2, title: 'إعداد الملف الختامي', status: 'pending', priority: 'medium', description: 'إعداد الملف النهائي للقضية', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 2, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), completed_at: null },
    { id: 11, task_code: 'TSK-2025-011', client_id: 5, title: 'مراجعة عقد توريد', status: 'pending', priority: 'high', description: 'مراجعة بنود عقد توريد لمدة سنة', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), completed_at: null, approval_status: 'pending', approved_by_admin: false, approved_by_main_lawyer: false, approved_by_assigned_lawyer: false },
    { id: 12, task_code: 'TSK-2025-012', client_id: 6, title: 'إعداد مذكرة دفاع', status: 'in_progress', priority: 'medium', description: 'إعداد مذكرة دفاع أولية للقضية', assigned_to: 4, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 2, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), completed_at: null, approval_status: 'pending', approved_by_admin: false, approved_by_main_lawyer: false, approved_by_assigned_lawyer: false },
    { id: 13, task_code: 'TSK-2025-013', client_id: 7, title: 'مراجعة عقد استثمار', status: 'pending', priority: 'high', description: 'مراجعة عقد استثمار مشروع سكني في بغداد', assigned_to: 2, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), completed_at: null, approval_status: 'pending', approved_by_admin: false, approved_by_main_lawyer: false, approved_by_assigned_lawyer: false },
    { id: 14, task_code: 'TSK-2025-014', client_id: 8, title: 'صياغة اتفاقية توزيع', status: 'in_progress', priority: 'medium', description: 'صياغة اتفاقية توزيع منتجات دوائية داخل العراق', assigned_to: 1, created_by: 1, main_lawyer_id: 2, main_lawyer_assigned_by: 1, department_id: 1, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), completed_at: null, approval_status: 'pending', approved_by_admin: false, approved_by_main_lawyer: false, approved_by_assigned_lawyer: false },
    { id: 15, task_code: 'TSK-2025-015', client_id: 9, title: 'متابعة جلسة أحوال شخصية', status: 'pending', priority: 'low', description: 'متابعة جلسة أحوال شخصية في محكمة النجف', assigned_to: 4, department_id: 2, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), completed_at: null, approval_status: 'pending', approved_by_admin: false, approved_by_main_lawyer: false, approved_by_assigned_lawyer: false, main_lawyer_id: 2 }
  ];
  
  tasks.forEach(task => {
    // إضافة المراحل والتقدم للمهام
    const stageMapping = {
      'pending': 1,
      'in_progress': 4,
      'completed': 7
    };
    task.stage_id = stageMapping[task.status] || 1;
    task.progress = task.status === 'completed' ? 100 : (task.status === 'in_progress' ? 50 : 0);

    // بيانات الموافقات الافتراضية للمهام الحالية (مع احترام القيم المحددة مسبقاً)
    task.main_lawyer_id = task.main_lawyer_id || 2;
    task.approval_status = task.approval_status || 'approved';

    if (task.approval_status === 'approved') {
      task.approved_by_admin = task.approved_by_admin ?? 1;
      task.approved_at_admin = task.approved_at_admin || new Date();
      task.approved_by_main_lawyer = task.approved_by_main_lawyer ?? task.main_lawyer_id;
      task.approved_at_main_lawyer = task.approved_at_main_lawyer || new Date();
      task.approved_by_assigned_lawyer = task.approved_by_assigned_lawyer ?? task.assigned_to;
      task.approved_at_assigned_lawyer = task.approved_at_assigned_lawyer || new Date();
    } else {
      task.approved_by_admin = task.approved_by_admin ?? false;
      task.approved_at_admin = task.approved_at_admin || null;
      task.approved_by_main_lawyer = task.approved_by_main_lawyer ?? false;
      task.approved_at_main_lawyer = task.approved_at_main_lawyer || null;
      task.approved_by_assigned_lawyer = task.approved_by_assigned_lawyer ?? false;
      task.approved_at_assigned_lawyer = task.approved_at_assigned_lawyer || null;
    }

    inMemoryDB.tasks.set(task.id, task);
  });

  // Stages (المراحل الافتراضية) - محسّنة مع الموافقات والمتطلبات
  inMemoryDB.stages.set(1, {
    id: 1,
    name: 'المراجعة الأولية',
    order: 1,
    color: '#FEF3C7',
    description: 'مرحلة المراجعة الأولية للمستندات والملفات',
    requirements: '✓ تجميع جميع المستندات الأساسية\n✓ التحقق من اكتمال الملفات\n✓ تقييم أولي لصحة الوثائق\n✓ توثيق أي نقص في المستندات',
    approval_type: 'admin_only',
    is_active: true,
    created_at: new Date()
  });
  
  inMemoryDB.stages.set(2, {
    id: 2,
    name: 'البحث القانوني',
    order: 2,
    color: '#DBEAFE',
    description: 'مرحلة البحث والدراسة القانونية المتعمقة',
    requirements: '✓ البحث عن السوابق القضائية ذات الصلة\n✓ دراسة القوانين والتشريعات المطبقة\n✓ تحليل الآراء القانونية المتنوعة\n✓ توثيق المراجع والمصادر',
    approval_type: 'multiple',
    is_active: true,
    created_at: new Date()
  });
  
  inMemoryDB.stages.set(3, {
    id: 3,
    name: 'تحضير الحجج',
    order: 3,
    color: '#C7D2FE',
    description: 'مرحلة تحضير وتنظيم الحجج القانونية',
    requirements: '✓ صياغة الحجج القانونية الرئيسية\n✓ تنظيم الحجج بترتيب منطقي\n✓ إعداد ردود احتمالية\n✓ توثيق الحجج بالمراجع',
    approval_type: 'multiple',
    is_active: true,
    created_at: new Date()
  });
  
  inMemoryDB.stages.set(4, {
    id: 4,
    name: 'التحرير والمراجعة',
    order: 4,
    color: '#D1FAE5',
    description: 'مرحلة تحرير وتنقيح المستندات والمذكرات',
    requirements: '✓ تحرير المستندات بصيغة نهائية\n✓ مراجعة لغوية وإملائية شاملة\n✓ التأكد من اتساق الوثائق\n✓ تنسيق المستندات وفق المعايير',
    approval_type: 'multiple',
    is_active: true,
    created_at: new Date()
  });
  
  inMemoryDB.stages.set(5, {
    id: 5,
    name: 'التقديم والإجراءات',
    order: 5,
    color: '#FBCFE8',
    description: 'مرحلة تقديم الملفات والإجراءات القانونية',
    requirements: '✓ تجهيز الملفات للتقديم\n✓ دفع الرسوم والتكاليف المطلوبة\n✓ تقديم الملفات للجهات المختصة\n✓ الحصول على إيصالات وتأكيدات التقديم',
    approval_type: 'admin_only',
    is_active: true,
    created_at: new Date()
  });
  
  inMemoryDB.stages.set(6, {
    id: 6,
    name: 'المتابعة',
    order: 6,
    color: '#FED7AA',
    description: 'مرحلة المتابعة الدورية والتنسيق',
    requirements: '✓ المتابعة المنتظمة مع الجهات المختصة\n✓ تحديث العميل بأحدث التطورات\n✓ الرد على الاستفسارات والطلبات\n✓ توثيق التطورات والتحديثات',
    approval_type: 'single',
    is_active: true,
    created_at: new Date()
  });
  
  inMemoryDB.stages.set(7, {
    id: 7,
    name: 'مكتملة',
    order: 7,
    color: '#A7F3D0',
    description: 'المهمة مكتملة والقضية منتهية',
    requirements: '✓ إعداد التقرير النهائي\n✓ توثيق النتيجة والحكم النهائي\n✓ إرسال المستندات النهائية للعميل\n✓ إغلاق ملف القضية بشكل رسمي',
    approval_type: 'admin_only',
    is_active: true,
    created_at: new Date()
  });

  // Notifications - إضافة إشعارات تجريبية
  inMemoryDB.notifications.set(1, {
    id: 1,
    user_id: 1,
    type: 'task',
    title: 'مهمة جديدة تم تعيينها لك',
    message: 'تم تعيينك لمهمة "مراجعة العقد التجاري" - القضية #TSK-2025-001',
    priority: 'high',
    link: '/tasks/1',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  });

  inMemoryDB.notifications.set(2, {
    id: 2,
    user_id: 1,
    type: 'approval',
    title: 'طلب موافقة',
    message: 'المحامي محمود علي يطلب موافقتك على المهمة "إعداد صحيفة الدعوى"',
    priority: 'high',
    link: '/tasks/5',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  });

  inMemoryDB.notifications.set(3, {
    id: 3,
    user_id: 1,
    type: 'message',
    title: 'رسالة جديدة من عميل',
    message: 'شركة ABC أرسلت رسالة جديدة بخصوص القضية #123',
    priority: 'medium',
    link: '/clients/1',
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  });

  inMemoryDB.notifications.set(4, {
    id: 4,
    user_id: 2,
    type: 'task',
    title: 'اقتراب موعد التسليم',
    message: 'المهمة "البحث القانوني للقضية #456" موعد تسليمها غداً',
    priority: 'medium',
    link: '/tasks/3',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  });

  inMemoryDB.notifications.set(5, {
    id: 5,
    user_id: 1,
    type: 'system',
    title: 'تحديث النظام',
    message: 'تم تحديث النظام بنجاح - الإصدار 2.5.0',
    priority: 'low',
    link: null,
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  });

  // Sample Invoices
  inMemoryDB.invoices.set(1, {
    id: 1,
    invoice_number: 'INV-2024-001',
    client_name: 'شركة الاتصالات السعودية',
    client_email: 'contact@stc.com.sa',
    amount: 5000.00,
    currency: 'USD',
    description: 'استشارة قانونية في العقود التجارية',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    status: 'paid',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  });

  inMemoryDB.invoices.set(2, {
    id: 2,
    invoice_number: 'INV-2024-002',
    client_name: 'بنك الراجحي',
    client_email: 'legal@alrajhi.com',
    amount: 7500.00,
    currency: 'IQD',
    description: 'خدمات المراجعة القانونية الشاملة',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    status: 'pending',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString()
  });

  inMemoryDB.invoices.set(3, {
    id: 3,
    invoice_number: 'INV-2024-003',
    client_name: 'أرامكو السعودية',
    client_email: 'procurement@aramco.com',
    amount: 10000.00,
    currency: 'USD',
    description: 'تمثيل قانوني في قضايا تجارية معقدة',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
    status: 'sent',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString()
  });

  inMemoryDB.invoices.set(4, {
    id: 4,
    invoice_number: 'INV-2024-004',
    client_name: 'شركة دجلة للتطوير العقاري',
    client_email: 'finance@tigris-dev.iq',
    amount: 12500000.00,
    currency: 'IQD',
    description: 'أتعاب مراجعة عقد استثمار لمشروع سكني في بغداد',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
    status: 'pending',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updated_at: new Date().toISOString()
  });

  inMemoryDB.invoices.set(5, {
    id: 5,
    invoice_number: 'INV-2024-005',
    client_name: 'مصنع الرافدين للأدوية',
    client_email: 'finance@rafidain-pharma.iq',
    amount: 7800000.00,
    currency: 'IQD',
    description: 'أتعاب صياغة اتفاقية توزيع داخل العراق',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
    status: 'sent',
    created_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updated_at: new Date().toISOString()
  });

  // Sample Files
  inMemoryDB.files.set(1, {
    id: 1,
    name: 'عقد الشراكة.pdf',
    size: 2048576,
    type: 'application/pdf',
    folder_id: null,
    uploaded_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  });

  inMemoryDB.files.set(2, {
    id: 2,
    name: 'العقود القانونية.docx',
    size: 1024000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folder_id: null,
    uploaded_by: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  });

  inMemoryDB.files.set(3, {
    id: 3,
    name: 'الملفات المالية.xlsx',
    size: 512000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    folder_id: null,
    uploaded_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString()
  });

  inMemoryDB.files.set(4, {
    id: 4,
    name: 'عقد استثمار بغداد.pdf',
    size: 2457600,
    type: 'application/pdf',
    folder_id: null,
    uploaded_by: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  });

  inMemoryDB.files.set(5, {
    id: 5,
    name: 'اتفاقية توزيع الأدوية.docx',
    size: 1331200,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folder_id: null,
    uploaded_by: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString()
  });
}

// Get user by email
function getUserByEmail(email) {
  for (let [id, user] of inMemoryDB.users) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

// Get user by ID
function getUserById(id) {
  return inMemoryDB.users.get(id);
}

module.exports = {
  inMemoryDB,
  initializeData,
  getUserByEmail,
  getUserById
};
