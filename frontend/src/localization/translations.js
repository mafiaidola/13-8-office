// Medical Management System - Central Translation System
// نظام الترجمة المركزي

export const TRANSLATIONS = {
  // Common Terms
  common: {
    ar: {
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      add: 'إضافة',
      view: 'عرض',
      search: 'بحث',
      filter: 'تصفية',
      refresh: 'تحديث',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      warning: 'تحذير',
      info: 'معلومة',
      yes: 'نعم',
      no: 'لا',
      ok: 'موافق',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      open: 'فتح',
      submit: 'إرسال',
      reset: 'إعادة تعيين',
      clear: 'مسح',
      select: 'اختيار',
      upload: 'رفع',
      download: 'تحميل',
      print: 'طباعة',
      export: 'تصدير',
      import: 'استيراد'
    },
    en: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      refresh: 'Refresh',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      submit: 'Submit',
      reset: 'Reset',
      clear: 'Clear',
      select: 'Select',
      upload: 'Upload',
      download: 'Download',
      print: 'Print',
      export: 'Export',
      import: 'Import'
    }
  },

  // Authentication
  auth: {
    ar: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      fullName: 'الاسم الكامل',
      role: 'الدور',
      rememberMe: 'تذكرني',
      forgotPassword: 'نسيت كلمة المرور؟',
      welcomeBack: 'أهلاً بعودتك',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginError: 'خطأ في تسجيل الدخول',
      invalidCredentials: 'بيانات غير صحيحة',
      sessionExpired: 'انتهت جلسة العمل'
    },
    en: {
      login: 'Login',
      logout: 'Logout', 
      username: 'Username',
      password: 'Password',
      email: 'Email',
      phone: 'Phone',
      fullName: 'Full Name',
      role: 'Role',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password?',
      demoCredentials: 'Demo Credentials',
      welcomeBack: 'Welcome Back',
      loginSuccess: 'Login Successful',
      loginError: 'Login Error',
      invalidCredentials: 'Invalid Credentials',
      sessionExpired: 'Session Expired'
    }
  },

  // Dashboard
  dashboard: {
    ar: {
      title: 'لوحة التحكم',
      welcome: 'مرحباً',
      overview: 'نظرة عامة',
      statistics: 'الإحصائيات',
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      notifications: 'الإشعارات',
      alerts: 'التنبيهات',
      performance: 'الأداء',
      analytics: 'التحليلات',
      summary: 'الملخص'
    },
    en: {
      title: 'Dashboard',
      welcome: 'Welcome',
      overview: 'Overview',
      statistics: 'Statistics',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      notifications: 'Notifications',
      alerts: 'Alerts',
      performance: 'Performance',
      analytics: 'Analytics',
      summary: 'Summary'
    }
  },

  // Users
  users: {
    ar: {
      title: 'إدارة المستخدمين',
      addUser: 'إضافة مستخدم',
      editUser: 'تعديل مستخدم',
      deleteUser: 'حذف مستخدم',
      userList: 'قائمة المستخدمين',
      userProfile: 'الملف الشخصي',
      userInfo: 'معلومات المستخدم',
      permissions: 'الصلاحيات',
      status: 'الحالة',
      active: 'نشط',
      inactive: 'غير نشط',
      lastLogin: 'آخر تسجيل دخول',
      createdAt: 'تاريخ الإنشاء',
      totalUsers: 'إجمالي المستخدمين'
    },
    en: {
      title: 'User Management',
      addUser: 'Add User',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      userList: 'User List',
      userProfile: 'User Profile',
      userInfo: 'User Information',
      permissions: 'Permissions',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      lastLogin: 'Last Login',
      createdAt: 'Created At',
      totalUsers: 'Total Users'
    }
  },

  // Clinics
  clinics: {
    ar: {
      title: 'إدارة العيادات',
      registerClinic: 'تسجيل عيادة',
      clinicName: 'اسم العيادة',
      doctorName: 'اسم الطبيب',
      clinicPhone: 'هاتف العيادة',
      clinicAddress: 'عنوان العيادة',
      specialization: 'التخصص',
      location: 'الموقع',
      classification: 'التصنيف',
      creditStatus: 'الحالة الائتمانية',
      registrationDate: 'تاريخ التسجيل',
      totalClinics: 'إجمالي العيادات',
      clinicsList: 'قائمة العيادات',
      clinicDetails: 'تفاصيل العيادة'
    },
    en: {
      title: 'Clinics Management',
      registerClinic: 'Register Clinic',
      clinicName: 'Clinic Name',
      doctorName: 'Doctor Name',
      clinicPhone: 'Clinic Phone',
      clinicAddress: 'Clinic Address',
      specialization: 'Specialization',
      location: 'Location',
      classification: 'Classification',
      creditStatus: 'Credit Status',
      registrationDate: 'Registration Date',
      totalClinics: 'Total Clinics',
      clinicsList: 'Clinics List',
      clinicDetails: 'Clinic Details'
    }
  },

  // Products
  products: {
    ar: {
      title: 'إدارة المنتجات',
      addProduct: 'إضافة منتج',
      productName: 'اسم المنتج',
      productCode: 'كود المنتج',
      category: 'الفئة',
      unit: 'الوحدة',
      price: 'السعر',
      stock: 'المخزون',
      description: 'الوصف',
      line: 'الخط',
      area: 'المنطقة',
      totalProducts: 'إجمالي المنتجات',
      productsList: 'قائمة المنتجات',
      lowStock: 'مخزون منخفض'
    },
    en: {
      title: 'Product Management',
      addProduct: 'Add Product',
      productName: 'Product Name',
      productCode: 'Product Code',
      category: 'Category',
      unit: 'Unit',
      price: 'Price',
      stock: 'Stock',
      description: 'Description',
      line: 'Line',
      area: 'Area',
      totalProducts: 'Total Products',
      productsList: 'Products List',
      lowStock: 'Low Stock'
    }
  },

  // Orders
  orders: {
    ar: {
      title: 'إدارة الطلبات',
      createOrder: 'إنشاء طلبية',
      orderNumber: 'رقم الطلبية',
      orderDate: 'تاريخ الطلبية',
      orderStatus: 'حالة الطلبية',
      orderTotal: 'إجمالي الطلبية',
      orderItems: 'عناصر الطلبية',
      pending: 'معلق',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      totalOrders: 'إجمالي الطلبات',
      ordersList: 'قائمة الطلبات'
    },
    en: {
      title: 'Orders Management',
      createOrder: 'Create Order',
      orderNumber: 'Order Number',
      orderDate: 'Order Date',
      orderStatus: 'Order Status',
      orderTotal: 'Order Total',
      orderItems: 'Order Items',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled',
      totalOrders: 'Total Orders',
      ordersList: 'Orders List'
    }
  },

  // Warehouse
  warehouse: {
    ar: {
      title: 'إدارة المخازن',
      warehouseName: 'اسم المخزن',
      warehouseLocation: 'موقع المخزن',
      inventory: 'المخزون',
      movements: 'الحركات',
      inbound: 'وارد',
      outbound: 'صادر',
      transfer: 'نقل',
      adjustment: 'تسوية',
      totalWarehouses: 'إجمالي المخازن',
      warehousesList: 'قائمة المخازن'
    },
    en: {
      title: 'Warehouse Management',
      warehouseName: 'Warehouse Name',
      warehouseLocation: 'Warehouse Location',
      inventory: 'Inventory',
      movements: 'Movements',
      inbound: 'Inbound',
      outbound: 'Outbound',
      transfer: 'Transfer',
      adjustment: 'Adjustment',
      totalWarehouses: 'Total Warehouses',
      warehousesList: 'Warehouses List'
    }
  },

  // Visits
  visits: {
    ar: {
      title: 'إدارة الزيارات',
      registerVisit: 'تسجيل زيارة',
      visitDate: 'تاريخ الزيارة',
      visitTime: 'وقت الزيارة',
      visitNotes: 'ملاحظات الزيارة',
      nextVisit: 'الزيارة القادمة',
      visitHistory: 'تاريخ الزيارات',
      totalVisits: 'إجمالي الزيارات',
      visitsList: 'قائمة الزيارات'
    },
    en: {
      title: 'Visits Management',
      registerVisit: 'Register Visit',
      visitDate: 'Visit Date',
      visitTime: 'Visit Time',
      visitNotes: 'Visit Notes',
      nextVisit: 'Next Visit',
      visitHistory: 'Visit History',
      totalVisits: 'Total Visits',
      visitsList: 'Visits List'
    }
  },

  // Geographic
  geographic: {
    ar: {
      title: 'إدارة الخطوط والمناطق',
      lines: 'الخطوط',
      areas: 'المناطق',
      addLine: 'إضافة خط',
      addArea: 'إضافة منطقة',
      lineName: 'اسم الخط',
      areaName: 'اسم المنطقة',
      lineCode: 'كود الخط',
      areaCode: 'كود المنطقة',
      manager: 'المدير',
      totalLines: 'إجمالي الخطوط',
      totalAreas: 'إجمالي المناطق'
    },
    en: {
      title: 'Lines & Areas Management',
      lines: 'Lines',
      areas: 'Areas',
      addLine: 'Add Line',
      addArea: 'Add Area',
      lineName: 'Line Name',
      areaName: 'Area Name',
      lineCode: 'Line Code',
      areaCode: 'Area Code',
      manager: 'Manager',
      totalLines: 'Total Lines',
      totalAreas: 'Total Areas'
    }
  },

  // Settings
  settings: {
    ar: {
      title: 'الإعدادات',
      generalSettings: 'الإعدادات العامة',
      userSettings: 'إعدادات المستخدم',
      systemSettings: 'إعدادات النظام',
      language: 'اللغة',
      theme: 'السمة',
      notifications: 'الإشعارات',
      privacy: 'الخصوصية',
      security: 'الأمان',
      backup: 'النسخ الاحتياطي',
      restore: 'الاستعادة'
    },
    en: {
      title: 'Settings',
      generalSettings: 'General Settings',
      userSettings: 'User Settings',
      systemSettings: 'System Settings',
      language: 'Language',
      theme: 'Theme',
      notifications: 'Notifications',
      privacy: 'Privacy',
      security: 'Security',
      backup: 'Backup',
      restore: 'Restore'
    }
  }
};

// Translation Hook
export const useTranslation = (language = 'ar') => {
  const t = (category, key, fallback = key) => {
    try {
      const translation = TRANSLATIONS[category]?.[language]?.[key];
      return translation || fallback;
    } catch (error) {
      console.warn(`Translation not found: ${category}.${key}`);
      return fallback;
    }
  };

  const tc = (key, fallback = key) => t('common', key, fallback);

  return { t, tc };
};

// Get all translations for a category
export const getCategoryTranslations = (category, language = 'ar') => {
  return TRANSLATIONS[category]?.[language] || {};
};

// Check if translation exists
export const hasTranslation = (category, key, language = 'ar') => {
  return !!(TRANSLATIONS[category]?.[language]?.[key]);
};

export default TRANSLATIONS;