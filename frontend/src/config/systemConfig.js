// EP Group System - Central Configuration
// إعدادات النظام المركزية

export const SYSTEM_CONFIG = {
  // Application Information
  appName: 'EP Group System',
  version: '2.0.0',
  description: 'نظام إدارة شامل للمؤسسات الطبية',
  
  // API Configuration
  apiEndpoints: {
    auth: '/auth',
    users: '/users',
    clinics: '/clinics', 
    products: '/products',
    orders: '/orders',
    warehouses: '/warehouses',
    inventory: '/inventory',
    visits: '/visits',
    dashboard: '/dashboard',
    reports: '/reports'
  }
};

// User Roles Configuration
export const USER_ROLES = {
  ADMIN: 'admin',
  GM: 'gm', 
  FINANCE: 'finance',
  LINE_MANAGER: 'line_manager',
  AREA_MANAGER: 'area_manager',
  DISTRICT_MANAGER: 'district_manager',
  KEY_ACCOUNT: 'key_account',
  MEDICAL_REP: 'medical_rep',
  SALES_REP: 'sales_rep',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  WAREHOUSE_KEEPER: 'warehouse_keeper',
  ACCOUNTING: 'accounting'
};

// Role Normalization - تطبيع الأدوار
export const normalizeRole = (role) => {
  if (role === USER_ROLES.SALES_REP) return USER_ROLES.MEDICAL_REP;
  return role;
};

// Role Display Names - أسماء الأدوار للعرض
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: { ar: 'مدير النظام', en: 'System Admin' },
  [USER_ROLES.GM]: { ar: 'المدير العام', en: 'General Manager' },
  [USER_ROLES.FINANCE]: { ar: 'المالية', en: 'Finance' },
  [USER_ROLES.LINE_MANAGER]: { ar: 'مدير خط', en: 'Line Manager' },
  [USER_ROLES.AREA_MANAGER]: { ar: 'مدير منطقة', en: 'Area Manager' },
  [USER_ROLES.DISTRICT_MANAGER]: { ar: 'مدير مقاطعة', en: 'District Manager' },
  [USER_ROLES.KEY_ACCOUNT]: { ar: 'حساب رئيسي', en: 'Key Account' },
  [USER_ROLES.MEDICAL_REP]: { ar: 'مندوب طبي', en: 'Medical Rep' },
  [USER_ROLES.SALES_REP]: { ar: 'مندوب مبيعات', en: 'Sales Rep' },
  [USER_ROLES.WAREHOUSE_MANAGER]: { ar: 'مدير مخزن', en: 'Warehouse Manager' },
  [USER_ROLES.WAREHOUSE_KEEPER]: { ar: 'أمين مخزن', en: 'Warehouse Keeper' },
  [USER_ROLES.ACCOUNTING]: { ar: 'محاسبة', en: 'Accounting' }
};

// System Tabs Configuration - إعدادات تبويبات النظام
export const SYSTEM_TABS = {
  // Core Management Tabs
  DASHBOARD: {
    id: 'dashboard',
    name: { ar: 'لوحة التحكم', en: 'Dashboard' },
    icon: '📊',
    permissions: ['*'], // All roles
    component: 'Dashboard'
  },
  
  // User Management
  USER_MANAGEMENT: {
    id: 'users', 
    name: { ar: 'إدارة المستخدمين', en: 'User Management' },
    icon: '👥',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.LINE_MANAGER, USER_ROLES.AREA_MANAGER],
    component: 'UserManagement'
  },

  // Clinic Management
  CLINIC_REGISTRATION: {
    id: 'register-clinic',
    name: { ar: 'تسجيل عيادة', en: 'Register Clinic' },
    icon: '🏥➕',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.KEY_ACCOUNT, USER_ROLES.MEDICAL_REP],
    component: 'RepClinicRegistration'
  },
  
  CLINIC_MANAGEMENT: {
    id: 'clinics',
    name: { ar: 'إدارة العيادات', en: 'Clinics Management' },
    icon: '🏥',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.AREA_MANAGER, USER_ROLES.LINE_MANAGER],
    component: 'ClinicsManagement'
  },

  // Product Management  
  PRODUCT_MANAGEMENT: {
    id: 'products',
    name: { ar: 'إدارة المنتجات', en: 'Product Management' },
    icon: '📦',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.LINE_MANAGER],
    component: 'ProductManagement'
  },

  // Warehouse Management
  WAREHOUSE_MANAGEMENT: {
    id: 'warehouse',
    name: { ar: 'إدارة المخازن', en: 'Warehouse Management' },
    icon: '🏭',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.WAREHOUSE_MANAGER],
    component: 'WarehouseManagement'
  },

  // Visit Management
  VISIT_REGISTRATION: {
    id: 'visit',
    name: { ar: 'تسجيل زيارة', en: 'Visit Registration' },
    icon: '🚶‍♂️➕',
    permissions: [USER_ROLES.MEDICAL_REP, USER_ROLES.KEY_ACCOUNT],
    component: 'VisitRegistration'
  },

  // Orders Management
  ORDERS_MANAGEMENT: {
    id: 'orders',
    name: { ar: 'إدارة الطلبات', en: 'Orders Management' },
    icon: '🛒',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.WAREHOUSE_MANAGER, USER_ROLES.ACCOUNTING],
    component: 'OrdersManagement'
  },

  // Geographic Management
  LINES_AREAS: {
    id: 'lines-areas',
    name: { ar: 'إدارة الخطوط والمناطق', en: 'Lines & Areas Management' },
    icon: '🗺️',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.LINE_MANAGER, USER_ROLES.AREA_MANAGER],
    component: 'LinesAreasManagement'
  },

  // Planning
  MONTHLY_PLANNING: {
    id: 'my-plan',
    name: { ar: 'التخطيط الشهري', en: 'Monthly Planning' },
    icon: '📅',
    permissions: [USER_ROLES.MEDICAL_REP, USER_ROLES.KEY_ACCOUNT, USER_ROLES.AREA_MANAGER, USER_ROLES.LINE_MANAGER],
    component: 'SalesRepPlanManagement'
  },

  // Reports & Analytics
  REPORTS: {
    id: 'reports',
    name: { ar: 'التقارير والتحليلات', en: 'Reports & Analytics' },
    icon: '📈',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.FINANCE, USER_ROLES.ACCOUNTING],
    component: 'ReportsManagement'
  },

  // Administrative Functions
  GAMIFICATION: {
    id: 'gamification',
    name: { ar: 'نظام التحفيز', en: 'Gamification' },
    icon: '🎮',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.LINE_MANAGER],
    component: 'GamificationSystem'
  },

  GPS_TRACKING: {
    id: 'gps-tracking',
    name: { ar: 'تتبع المواقع', en: 'GPS Tracking' },
    icon: '🗺️',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.AREA_MANAGER],
    component: 'GPSTracking'
  },

  ADVANCED_ANALYTICS: {
    id: 'advanced-analytics',
    name: { ar: 'التحليلات المتقدمة', en: 'Advanced Analytics' },
    icon: '📊',
    permissions: [USER_ROLES.ADMIN, USER_ROLES.GM, USER_ROLES.FINANCE],
    component: 'AdvancedAnalytics'
  },

  // Settings
  SETTINGS: {
    id: 'settings',
    name: { ar: 'الإعدادات', en: 'Settings' },
    icon: '⚙️',
    permissions: [USER_ROLES.ADMIN],
    component: 'Settings'
  }
};

// Tab Groups - مجموعات التبويبات
export const TAB_GROUPS = {
  CORE: {
    name: { ar: 'الأساسيات', en: 'Core' },
    tabs: [
      SYSTEM_TABS.DASHBOARD,
      SYSTEM_TABS.USER_MANAGEMENT
    ]
  },
  
  CLINICAL: {
    name: { ar: 'الإدارة الطبية', en: 'Clinical Management' },
    tabs: [
      SYSTEM_TABS.CLINIC_REGISTRATION,
      SYSTEM_TABS.CLINIC_MANAGEMENT,
      SYSTEM_TABS.VISIT_REGISTRATION  
    ]
  },

  BUSINESS: {
    name: { ar: 'إدارة الأعمال', en: 'Business Management' },
    tabs: [
      SYSTEM_TABS.PRODUCT_MANAGEMENT,
      SYSTEM_TABS.WAREHOUSE_MANAGEMENT,
      SYSTEM_TABS.ORDERS_MANAGEMENT
    ]
  },

  GEOGRAPHIC: {
    name: { ar: 'الإدارة الجغرافية', en: 'Geographic Management' },
    tabs: [
      SYSTEM_TABS.LINES_AREAS,
      SYSTEM_TABS.GPS_TRACKING
    ]
  },

  PLANNING: {
    name: { ar: 'التخطيط والتحليل', en: 'Planning & Analytics' },
    tabs: [
      SYSTEM_TABS.MONTHLY_PLANNING,
      SYSTEM_TABS.REPORTS,
      SYSTEM_TABS.ADVANCED_ANALYTICS
    ]
  },

  SYSTEM: {
    name: { ar: 'إدارة النظام', en: 'System Management' },
    tabs: [
      SYSTEM_TABS.GAMIFICATION,
      SYSTEM_TABS.SETTINGS
    ]
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
  
  return Object.values(SYSTEM_TABS).filter(tab => {
    if (tab.permissions.includes('*')) return true;
    return tab.permissions.includes(normalizedRole);
  });
};

// Get tab groups for specific user role
export const getAvailableTabGroups = (userRole) => {
  const availableTabs = getAvailableTabs(userRole);
  const availableTabIds = availableTabs.map(tab => tab.id);
  
  const filteredGroups = {};
  
  Object.entries(TAB_GROUPS).forEach(([groupKey, group]) => {
    const visibleTabs = group.tabs.filter(tab => availableTabIds.includes(tab.id));
    if (visibleTabs.length > 0) {
      filteredGroups[groupKey] = {
        ...group,
        tabs: visibleTabs
      };
    }
  });
  
  return filteredGroups;
};

export default SYSTEM_CONFIG;