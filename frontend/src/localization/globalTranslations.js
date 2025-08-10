// Comprehensive Translation System - نظام الترجمة الشامل المحسن
// Complete translation support for all components with enhanced coverage

export const useTranslation = (language = 'en') => {
  const translations = {
    ar: {
      // Common UI Elements - العناصر الأساسية
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      warning: 'تحذير',
      info: 'معلومة',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      save: 'حفظ',
      edit: 'تعديل',
      delete: 'حذف',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      refresh: 'تحديث',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      reset: 'إعادة تعيين',
      clear: 'مسح',
      select: 'اختيار',
      
      // Enhanced Clinic Registration - تسجيل العيادات المحسن
      clinicRegistrationTitle: 'تسجيل عيادة جديدة - نظام محسن',
      clinicRegistrationDesc: 'يرجى ملء جميع البيانات المطلوبة وتحديد موقع العيادة على الخريطة بدقة. النظام متكامل مع إدارة الخطوط والمناطق لضمان التوافق الكامل.',
      formCompletionProgress: 'مدى اكتمال النموذج',
      basicInfo: 'معلومات أساسية',
      locationMapping: 'موقع وخريطة',
      classifications: 'تصنيفات',
      completed: 'مكتمل',
      mapLocationTitle: 'تحديد الموقع على الخريطة',
      mapLocationDesc: 'حالة التطابق 3/3 - متطابق، جاري المعالجة لـ 2 مسلك، كافة البيانات جاهزة للإرسال',
      getCurrentLocation: 'تحديد موقعي الحالي بدقة عالية',
      setLocationManually: 'وضع البدل في المنصف',
      setupClinic: 'إعداد العيل',
      clinicName: 'اسم العيادة',
      clinicPhone: 'هاتف العيادة',
      clinicEmail: 'بريد العيادة الإلكتروني',
      doctorName: 'اسم الدكتور',
      doctorPhone: 'هاتف الدكتور',
      clinicAddress: 'عنوان العيادة',
      selectLine: 'اختيار الخط',
      selectArea: 'اختيار المنطقة',
      selectDistrict: 'اختيار الحي',
      
      // Product Management - إدارة المنتجات
      productManagementTitle: 'إدارة المنتجات',
      productManagementDesc: 'إدارة شاملة للمنتجات مع التحكم في الأسعار والمخزون',
      addNewProduct: 'إضافة منتج جديد',
      exportProducts: 'تصدير المنتجات التجرية',
      totalProducts: 'إجمالي المنتجات',
      activeProducts: 'منتجات نشطة',
      outOfStock: 'مخزون حرج',
      totalCategories: 'الطلبات الجارية',
      searchProducts: 'البحث عن المنتجات',
      commercialCategories: 'جميع الفئات التجارية',
      allLines: 'جميع الخطوط',
      productName: 'اسم المنتج',
      commercialCategory: 'الفئة التجارية',
      line: 'الخط',
      unit: 'الوحدة',
      price: 'السعر',
      stock: 'المخزون',
      status: 'الحالة',
      actions: 'الإجراءات',
      
      // User Management - إدارة المستخدمين
      userManagementTitle: 'إدارة المستخدمين',
      userManagementDesc: 'إدارة المستخدمين والأدوار والصلاحيات',
      addNewUser: 'إضافة مستخدم جديد',
      totalUsers: 'إجمالي المستخدمين',
      activeUsers: 'مستخدمون نشطون',
      adminUsers: 'مستخدمون إداريون',
      
      // Dashboard - لوحة التحكم
      dashboardTitle: 'لوحة تحكم الأدمن المتقدمة',
      welcomeAdmin: 'مرحباً {name} 👨‍💻 - إدارة شاملة للنظام',
      systemRunning: 'النظام يعمل بكفاءة',
      indicatorsAvailable: '{count} مؤشر متاح',
      systemHealthIndicators: 'مؤشرات صحة النظام',
      updating: 'جاري التحديث...',
      updateStatus: 'تحديث الحالة',
      quickActions: 'الإجراءات السريعة',
      systemReports: 'تقارير النظام',
      backup: 'النسخ الاحتياطي',
      systemMonitoring: 'مراقبة النظام',
      advancedSettings: 'إعدادات متقدمة',
      
      // Navigation - التنقل
      coreOperations: 'العمليات الأساسية',
      clinicalOperations: 'العمليات الطبية',
      financialManagement: 'الإدارة المالية',
      inventoryProducts: 'المخزون والمنتجات',
      analyticsReports: 'التحليلات والتقارير',
      systemManagement: 'إدارة النظام',
      
      // Time and Date - الوقت والتاريخ
      today: 'اليوم',
      yesterday: 'أمس',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      
      // Status - الحالة
      active: 'نشط',
      inactive: 'غير نشط',
      pending: 'في الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
    },
    en: {
      // Common UI Elements
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      refresh: 'Refresh',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      clear: 'Clear',
      select: 'Select',
      
      // Enhanced Clinic Registration
      clinicRegistrationTitle: 'Enhanced Clinic Registration System',
      clinicRegistrationDesc: 'Please fill in all required information and accurately locate the clinic on the map. The system is integrated with line and area management for complete compatibility.',
      formCompletionProgress: 'Form Completion Progress',
      basicInfo: 'Basic Information',
      locationMapping: 'Location & Mapping',
      classifications: 'Classifications',
      completed: 'Completed',
      mapLocationTitle: 'Locate on Map',
      mapLocationDesc: 'Match status 3/3 - Matched, processing for 2 lines, all data ready for submission',
      getCurrentLocation: 'Get My Current Location with High Accuracy',
      setLocationManually: 'Set Location Manually',
      setupClinic: 'Setup Clinic',
      clinicName: 'Clinic Name',
      clinicPhone: 'Clinic Phone',
      clinicEmail: 'Clinic Email',
      doctorName: 'Doctor Name',
      doctorPhone: 'Doctor Phone',
      clinicAddress: 'Clinic Address',
      selectLine: 'Select Line',
      selectArea: 'Select Area',
      selectDistrict: 'Select District',
      
      // Product Management
      productManagementTitle: 'Product Management',
      productManagementDesc: 'Comprehensive product management with price and inventory control',
      addNewProduct: 'Add New Product',
      exportProducts: 'Export Commercial Products',
      totalProducts: 'Total Products',
      activeProducts: 'Active Products',
      outOfStock: 'Critical Stock',
      totalCategories: 'Ongoing Orders',
      searchProducts: 'Search Products',
      commercialCategories: 'All Commercial Categories',
      allLines: 'All Lines',
      productName: 'Product Name',
      commercialCategory: 'Commercial Category',
      line: 'Line',
      unit: 'Unit',
      price: 'Price',
      stock: 'Stock',
      status: 'Status',
      actions: 'Actions',
      
      // User Management
      userManagementTitle: 'User Management',
      userManagementDesc: 'Manage users, roles and permissions',
      addNewUser: 'Add New User',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      adminUsers: 'Admin Users',
      
      // Dashboard
      dashboardTitle: 'Advanced Admin Dashboard',
      welcomeAdmin: 'Welcome {name} 👨‍💻 - Comprehensive System Management',
      systemRunning: 'System Running Efficiently',
      indicatorsAvailable: '{count} indicators available',
      systemHealthIndicators: 'System Health Indicators',
      updating: 'Updating...',
      updateStatus: 'Update Status',
      quickActions: 'Quick Actions',
      systemReports: 'System Reports',
      backup: 'Backup',
      systemMonitoring: 'System Monitoring',
      advancedSettings: 'Advanced Settings',
      
      // Navigation
      coreOperations: 'Core Operations',
      clinicalOperations: 'Clinical Operations',
      financialManagement: 'Financial Management',
      inventoryProducts: 'Inventory & Products',
      analyticsReports: 'Analytics & Reports',
      systemManagement: 'System Management',
      
      // Time and Date
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      
      // Status
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    }
  };

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace parameters in text
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };

  return { t, translations: translations[language] || translations['en'] };
};

// Enhanced Layout System - نظام التخطيط المحسن
export const useLayoutSystem = (theme = 'dark') => {
  const isDark = theme === 'dark';
  
  const layouts = {
    // Page Container Layout
    pageContainer: `
      min-h-screen transition-all duration-300
      ${isDark 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
      }
    `,
    
    // Card Layout
    card: `
      rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl
      ${isDark 
        ? 'bg-slate-800/90 border-slate-700 backdrop-blur-sm' 
        : 'bg-white border-gray-200'
      }
    `,
    
    // Form Layout
    formContainer: `
      max-w-6xl mx-auto p-6 space-y-8
      ${isDark 
        ? 'bg-slate-800/95 border-slate-700' 
        : 'bg-white border-gray-200'
      }
      rounded-xl shadow-lg backdrop-blur-sm
    `,
    
    // Grid Layout
    statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8',
    contentGrid: 'grid grid-cols-1 xl:grid-cols-3 gap-6',
    
    // Input Layout
    input: `
      w-full px-4 py-3 rounded-lg border transition-all duration-200
      ${isDark 
        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-600' 
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
      }
      focus:ring-2 focus:ring-blue-500/20 focus:outline-none
    `,
    
    // Button Layout
    buttonPrimary: `
      px-6 py-3 rounded-lg font-medium transition-all duration-200
      ${isDark 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : 'bg-blue-600 hover:bg-blue-700 text-white'
      }
      transform hover:scale-105 focus:scale-95 shadow-lg hover:shadow-xl
    `,
    
    buttonSecondary: `
      px-6 py-3 rounded-lg font-medium transition-all duration-200 border
      ${isDark 
        ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white' 
        : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
      }
      transform hover:scale-105 focus:scale-95 shadow-md hover:shadow-lg
    `,
    
    // Table Layout
    table: `
      w-full rounded-lg overflow-hidden shadow-lg
      ${isDark 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-gray-200'
      }
    `,
    
    tableHeader: `
      ${isDark 
        ? 'bg-slate-700 text-slate-200' 
        : 'bg-gray-50 text-gray-700'
      }
    `,
    
    tableRow: `
      transition-colors duration-150
      ${isDark 
        ? 'hover:bg-slate-700/50 border-slate-700' 
        : 'hover:bg-gray-50 border-gray-200'
      }
    `,
    
    // Header Layout
    pageHeader: `
      mb-8 text-center space-y-4
    `,
    
    pageTitle: `
      text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
      bg-clip-text text-transparent
    `,
    
    pageDescription: `
      text-lg max-w-3xl mx-auto
      ${isDark ? 'text-slate-300' : 'text-gray-600'}
    `,
    
    // Status Badges
    statusBadge: `
      inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
    `,
    
    statusActive: `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`,
    statusInactive: `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`,
    statusPending: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`
  };
  
  return layouts;
};

export default useTranslation;