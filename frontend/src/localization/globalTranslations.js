// Comprehensive Translation System - نظام الترجمة الشامل
// This file provides complete translation support for all components

export const useTranslation = (language = 'en') => {
  const translations = {
    ar: {
      // Common UI elements
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
      
      // Error messages
      componentNotFound: 'مكون غير موجود',
      componentError: 'حدث خطأ أثناء تحميل هذا المكون',
      tryAgain: 'إعادة المحاولة',
      systemError: 'خطأ في النظام',
      loadingError: 'فشل في التحميل',
      
      // Dashboard
      dashboard: 'لوحة التحكم',
      welcome: 'مرحباً',
      systemOverview: 'نظرة عامة على النظام',
      
      // User Management
      userManagement: 'إدارة المستخدمين',
      users: 'المستخدمين',
      addUser: 'إضافة مستخدم',
      editUser: 'تعديل مستخدم',
      
      // Clinic Management
      clinicRegistration: 'تسجيل العيادات',
      clinicsManagement: 'إدارة العيادات',
      clinic: 'عيادة',
      doctor: 'دكتور',
      
      // Products
      productManagement: 'إدارة المنتجات',
      products: 'المنتجات',
      product: 'منتج',
      
      // Financial
      accounting: 'الحسابات',
      invoices: 'الفواتير',
      financial: 'مالي',
      
      // Activities
      activityTracking: 'تتبع الأنشطة',
      activities: 'الأنشطة',
      
      // System
      systemManagement: 'إدارة النظام',
      settings: 'الإعدادات'
    },
    en: {
      // Common UI elements
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
      
      // Error messages
      componentNotFound: 'Component Not Found',
      componentError: 'An error occurred while loading this component',
      tryAgain: 'Try Again',
      systemError: 'System Error',
      loadingError: 'Loading Failed',
      
      // Dashboard
      dashboard: 'Dashboard',
      welcome: 'Welcome',
      systemOverview: 'System Overview',
      
      // User Management
      userManagement: 'User Management',
      users: 'Users',
      addUser: 'Add User',
      editUser: 'Edit User',
      
      // Clinic Management
      clinicRegistration: 'Clinic Registration',
      clinicsManagement: 'Clinics Management',
      clinic: 'Clinic',
      doctor: 'Doctor',
      
      // Products
      productManagement: 'Product Management',
      products: 'Products',
      product: 'Product',
      
      // Financial
      accounting: 'Accounting',
      invoices: 'Invoices',
      financial: 'Financial',
      
      // Activities
      activityTracking: 'Activity Tracking',
      activities: 'Activities',
      
      // System
      systemManagement: 'System Management',
      settings: 'Settings'
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

// Global error component with translation
export const GlobalError = ({ language = 'en', error, onRetry }) => {
  const { t } = useTranslation(language);
  
  const isDark = document.body.classList.contains('theme-dark');
  
  return (
    <div className={`
      flex flex-col items-center justify-center p-8 min-h-[400px] rounded-lg
      ${isDark 
        ? 'bg-gray-800 text-white border border-gray-700' 
        : 'bg-white text-gray-900 border border-gray-200'
      }
    `}>
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
        {t('componentError')}
      </h3>
      {error && (
        <p className={`text-sm mb-4 text-center max-w-md ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {error.message || error}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className={`
            px-4 py-2 rounded-lg transition-colors
            ${isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
};

export default useTranslation;