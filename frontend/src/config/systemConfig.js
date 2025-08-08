// Medical Management System Configuration - إعدادات نظام الإدارة الطبية
// Centralized configuration for system tabs, roles, and permissions

// User Roles - أدوار المستخدمين
export const USER_ROLES = {
  ADMIN: 'admin',
  GM: 'gm',
  LINE_MANAGER: 'line_manager',
  AREA_MANAGER: 'area_manager',
  MEDICAL_REP: 'medical_rep',
  FINANCE: 'finance',
  ACCOUNTING: 'accounting'
};

// Helper function to normalize role names
export const normalizeRole = (role) => {
  if (!role) return null;
  return role.toLowerCase().replace(/\s+/g, '_');
};

// System Tabs Configuration - إعدادات تبويبات النظام
export const SYSTEM_TABS = {
  dashboard: {
    id: 'dashboard',
    path: '/dashboard',
    icon: '🏠',
    name: { ar: 'لوحة التحكم', en: 'Dashboard' },
    component: 'Dashboard',
    description: { ar: 'نظرة عامة على النظام والإحصائيات', en: 'System overview and statistics' },
    permissions: ['*'], // Available to all users
    priority: 1
  },

  users: {
    id: 'users',
    path: '/users',
    icon: '👥',
    name: { ar: 'إدارة المستخدمين', en: 'User Management' },
    component: 'UserManagement',
    description: { ar: 'إدارة المستخدمين والأدوار والصلاحيات', en: 'Manage users, roles and permissions' },
    permissions: ['admin', 'gm'],
    priority: 2
  },

  clinic_registration: {
    id: 'clinic_registration',
    path: '/clinic-registration',
    icon: '🏥',
    name: { ar: 'تسجيل العيادات', en: 'Clinic Registration' },
    component: 'RepClinicRegistration',
    description: { ar: 'تسجيل عيادات جديدة مع GPS والتصنيفات', en: 'Register new clinics with GPS and classifications' },
    permissions: ['admin', 'gm', 'medical_rep'],
    priority: 3
  },

  products: {
    id: 'products',
    path: '/products',
    icon: '📦',
    name: { ar: 'إدارة المنتجات', en: 'Product Management' },
    component: 'ProductManagement',
    description: { ar: 'إدارة المنتجات والأسعار والمخزون', en: 'Manage products, prices and inventory' },
    permissions: ['admin', 'gm', 'line_manager'],
    priority: 4
  },

  orders: {
    id: 'orders',
    path: '/orders',
    icon: '📋',
    name: { ar: 'إدارة الطلبات', en: 'Orders Management' },
    component: 'OrdersManagement',
    description: { ar: 'إدارة الطلبات والموافقات والتسليم', en: 'Manage orders, approvals and delivery' },
    permissions: ['admin', 'gm', 'line_manager', 'medical_rep'],
    priority: 5
  },

  warehouses: {
    id: 'warehouses',
    path: '/warehouses',
    icon: '🏪',
    name: { ar: 'إدارة المخازن', en: 'Warehouse Management' },
    component: 'WarehouseManagement',
    description: { ar: 'إدارة المخازن والمخزون وحركة البضائع', en: 'Manage warehouses, inventory and goods movement' },
    permissions: ['admin', 'gm', 'warehouse_manager'],
    priority: 6
  },

  clinics_management: {
    id: 'clinics_management',
    path: '/clinics-management',
    icon: '🏥',
    name: { ar: 'إدارة العيادات', en: 'Clinics Management' },
    component: 'ClinicsManagement',
    description: { ar: 'إدارة شاملة للعيادات مع التصنيفات والحالة الائتمانية', en: 'Comprehensive clinic management with classifications and credit status' },
    permissions: ['admin', 'gm', 'line_manager'],
    priority: 7
  },

  lines_areas: {
    id: 'lines_areas',
    path: '/lines-areas',
    icon: '🗺️',
    name: { ar: 'إدارة الخطوط والمناطق', en: 'Lines & Areas Management' },
    component: 'LinesAreasManagement',
    description: { ar: 'إدارة الخطوط الجغرافية والمناطق التابعة', en: 'Manage geographical lines and associated areas' },
    permissions: ['admin', 'gm'],
    priority: 8
  },

  location_tracking: {
    id: 'location_tracking',
    path: '/location-tracking',
    icon: '📍',  
    name: { ar: 'تتبع المواقع', en: 'Location Tracking' },
    component: 'LocationTracking',
    description: { ar: 'تتبع مواقع المندوبين والزيارات', en: 'Track representative locations and visits' },
    permissions: ['admin', 'gm', 'line_manager'],
    priority: 9
  },

  system_management: {
    id: 'system_management',
    path: '/system-management',
    icon: '⚙️',
    name: { ar: 'إدارة النظام', en: 'System Management' },
    component: 'Settings',
    description: { ar: 'إعدادات النظام والأمان والنسخ الاحتياطي', en: 'System settings, security and backup configuration' },
    permissions: ['admin'],
    priority: 10
  },

  visit_management: {
    id: 'visit_management',
    path: '/visit-management',
    icon: '📋',
    name: { ar: 'إدارة الزيارات وسجل الدخول', en: 'Visit & Login Management' },
    component: 'VisitManagement',
    description: { ar: 'إدارة شاملة للزيارات وسجلات الدخول مع تحميل التقارير', en: 'Comprehensive visit and login management with report downloads' },
    permissions: ['admin'], // Admin only as requested
    priority: 11
  },

  activity_tracking: {
    id: 'activity_tracking',
    path: '/activity-tracking',
    icon: '📊',
    name: { ar: 'تتبع الأنشطة والحركات', en: 'Activity Tracking' },
    component: 'ActivityTracking',
    description: { ar: 'مراقبة شاملة لجميع الأنشطة مع تتبع الموقع والوقت', en: 'Comprehensive monitoring of all activities with location and time tracking' },
    permissions: ['admin', 'gm'],
    priority: 13
  },

  accounting: {
    id: 'accounting',
    path: '/accounting',
    icon: '💰',
    name: { ar: 'الحسابات والفواتير', en: 'Accounting & Invoices' },
    component: 'AccountingManagement',
    description: { ar: 'إدارة الفواتير والمدفوعات والتقارير المالية', en: 'Manage invoices, payments and financial reports' },
    permissions: ['admin', 'gm', 'accounting', 'finance'],
    priority: 14
  },

  analytics: {
    id: 'analytics',
    path: '/analytics',
    icon: '📊',
    name: { ar: 'التحليلات المتقدمة', en: 'Advanced Analytics' },
    component: 'AdvancedAnalytics',
    description: { ar: 'تحليلات متقدمة للبيانات والتقارير التفصيلية', en: 'Advanced data analytics and detailed reporting' },
    permissions: ['admin', 'gm', 'manager', 'medical_rep', 'key_account'],
    priority: 15
  },

  debt_collection: {
    id: 'debt_collection',
    path: '/debt-collection',
    icon: '💰',
    name: { ar: 'إدارة الديون والتحصيل', en: 'Debt Collection Management' },
    component: 'DebtCollectionManagement',
    description: { ar: 'إدارة شاملة للديون والمديونيات ومعالجة المدفوعات مع ربط الفواتير والمستخدمين', en: 'Comprehensive debt and collection management with invoice and user integration' },
    permissions: ['admin', 'gm', 'accounting', 'manager'],
    priority: 16
  },

  gamification: {
    id: 'gamification',
    path: '/gamification',
    name: { ar: 'نظام التحفيز', en: 'Gamification' },
    icon: '🎮',
    permissions: ['admin', 'gm', 'line_manager'],
    component: 'GamificationSystem',
    priority: 17
  }
};

// Permission Checking Function
export const hasPermission = (userRole, tabId) => {
  const normalizedRole = normalizeRole(userRole);
  const tab = Object.values(SYSTEM_TABS).find(t => t.id === tabId);
  
  if (!tab) return false;
  if (tab.permissions.includes('*')) return true;
  
  return tab.permissions.includes(normalizedRole);
};

// Get tabs for specific user role
export const getAvailableTabs = (userRole) => {
  const normalizedRole = normalizeRole(userRole);
  
  return Object.values(SYSTEM_TABS)
    .filter(tab => {
      if (tab.permissions.includes('*')) return true;
      return tab.permissions.includes(normalizedRole);
    })
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

export default SYSTEM_TABS;