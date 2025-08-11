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
    name: { ar: 'تسجيل العيادات المحسن', en: 'Enhanced Clinic Registration' },
    component: 'EnhancedClinicRegistrationAdvanced',
    description: { ar: 'تسجيل العيادات مع خرائط تفاعلية وتصنيفات شاملة', en: 'Register clinics with interactive maps and comprehensive classifications' },
    permissions: ['admin', 'gm', 'medical_rep'],
    priority: 3
  },

  clinics_management: {
    id: 'clinics_management',
    path: '/clinics-management',
    icon: '🏢',
    name: { ar: 'إدارة العيادات', en: 'Clinics Management' },
    component: 'ClinicsManagement',
    description: { ar: 'إدارة شاملة للعيادات المسجلة والتحكم بها', en: 'Comprehensive management of registered clinics' },
    permissions: ['admin', 'gm', 'line_manager', 'area_manager'],
    priority: 4
  },

  visits_management: {
    id: 'visits_management',
    path: '/visits-management',
    icon: '🩺',
    name: { ar: 'إدارة الزيارات', en: 'Visits Management' },
    component: 'EnhancedVisitsManagement',
    description: { ar: 'نظام إدارة زيارات المناديب مع تتبع GPS والتقارير', en: 'Representative visits management system with GPS tracking and reports' },
    permissions: ['admin', 'gm', 'line_manager', 'area_manager', 'medical_rep'],
    priority: 5
  },

  products: {
    id: 'products',
    path: '/products',
    icon: '💊',
    name: { ar: 'إدارة المنتجات', en: 'Product Management' },
    component: 'ProductManagement',
    description: { ar: 'إدارة قاعدة بيانات المنتجات والأدوية', en: 'Manage products and medicines database' },
    permissions: ['admin', 'gm', 'line_manager'],
    priority: 6
  },

  integrated_financial: {
    id: 'integrated_financial',
    path: '/integrated-financial',
    icon: '💰',
    name: { ar: 'النظام المالي المتكامل', en: 'Integrated Financial System' },
    component: 'IntegratedFinancialDashboard',
    description: { ar: 'إدارة شاملة للأمور المالية والفواتير والديون', en: 'Comprehensive financial management including invoices and debts' },
    permissions: ['admin', 'gm', 'accounting', 'finance'],
    priority: 7
  },

  excel_management: {
    id: 'excel_management',
    path: '/excel-management',
    icon: '📊',
    name: { ar: 'إدارة ملفات Excel', en: 'Excel Management' },
    component: 'ExcelDashboard',
    description: { ar: 'استيراد وتصدير البيانات من وإلى ملفات Excel', en: 'Import and export data from/to Excel files' },
    permissions: ['admin', 'gm'],
    priority: 8
  },

  lines_areas: {
    id: 'lines_areas',
    path: '/lines-areas',
    icon: '🗺️',
    name: { ar: 'إدارة الخطوط والمناطق', en: 'Lines & Areas Management' },
    component: 'LinesAreasManagement',
    description: { ar: 'إدارة التقسيم الجغرافي للخطوط والمناطق', en: 'Manage geographical division of lines and areas' },
    permissions: ['admin', 'gm'],
    priority: 9
  },

  warehouses: {
    id: 'warehouses',
    path: '/warehouses',
    icon: '🏬',
    name: { ar: 'إدارة المخازن', en: 'Warehouse Management' },
    component: 'WarehouseManagement',
    description: { ar: 'إدارة المخازن والمخزون والحركات', en: 'Manage warehouses, inventory and movements' },
    permissions: ['admin', 'gm', 'warehouse_manager'],
    priority: 10
  },



  activity_tracking: {
    id: 'activity_tracking',
    path: '/activity-tracking',
    icon: '📊',
    name: { ar: 'تتبع الأنشطة والحركات المتقدم', en: 'Advanced Activity Tracking' },
    component: 'EnhancedActivityTracking',
    description: { ar: 'مراقبة احترافية شاملة لجميع الأنشطة مع تفاصيل تقنية وخرائط جوجل وتتبع الموقع', en: 'Professional comprehensive monitoring with technical details, Google Maps and location tracking' },
    permissions: ['admin', 'gm'],
    priority: 12
  },

  super_admin_monitoring: {
    id: 'super_admin_monitoring',
    path: '/super-admin-monitoring',
    icon: '🛡️',
    name: { ar: 'مركز المراقبة والتحكم الشامل', en: 'Super Admin Monitoring Center' },
    component: 'SuperAdminActivityDashboard',
    description: { ar: 'نظام مراقبة احترافي متطور لجميع الأنشطة والحركات مع التحليلات المتقدمة والخرائط الجغرافية والتنبيهات الأمنية', en: 'Advanced professional monitoring system for all activities with analytics, geographic maps and security alerts' },
    permissions: ['admin'],
    priority: 11
  },

  settings: {
    id: 'settings',
    path: '/settings',
    icon: '⚙️',
    name: { ar: 'الإعدادات العامة', en: 'General Settings' },
    component: 'Settings',
    description: { ar: 'إعدادات النظام العامة والتخصيصات', en: 'General system settings and customizations' },
    permissions: ['admin', 'gm'],
    priority: 13
  }
};

// Helper function to get available tabs for a user based on their role
export const getAvailableTabs = (userRole) => {
  if (!userRole) return [];
  
  const normalizedRole = normalizeRole(userRole);
  
  return Object.values(SYSTEM_TABS).filter(tab => {
    if (tab.permissions.includes('*')) return true;
    return tab.permissions.some(permission => 
      normalizeRole(permission) === normalizedRole
    );
  }).sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

// Helper function to check if user has permission for a specific tab
export const hasTabPermission = (userRole, tabId) => {
  if (!userRole || !tabId) return false;
  
  const tab = SYSTEM_TABS[tabId];
  if (!tab) return false;
  
  if (tab.permissions.includes('*')) return true;
  
  const normalizedRole = normalizeRole(userRole);
  return tab.permissions.some(permission => 
    normalizeRole(permission) === normalizedRole
  );
};

export default SYSTEM_TABS;