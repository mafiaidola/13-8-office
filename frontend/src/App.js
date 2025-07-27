import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Enhanced Language Context and Translations System
const LanguageContext = createContext();

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Comprehensive Translation Object
const translations = {
  ar: {
    // System Name
    systemName: 'EP Group System',
    
    // Login Page
    login: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    rememberMe: 'تذكرني',
    forgotPassword: 'نسيت كلمة المرور؟',
    loginButton: 'دخول',
    loginLoading: 'جاري تسجيل الدخول...',
    welcome: 'مرحباً بك في',
    enterCredentials: 'أدخل بياناتك لتسجيل الدخول',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    statistics: 'الإحصائيات',
    users: 'المستخدمين',
    userManagement: 'إدارة المستخدمين',
    warehouse: 'المخازن',
    warehouseManagement: 'إدارة المخازن',
    visits: 'الزيارات',
    visitsLog: 'سجل الزيارات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Dashboard
    totalUsers: 'إجمالي المستخدمين',
    totalClinics: 'إجمالي العيادات',
    totalDoctors: 'إجمالي الأطباء',
    totalVisits: 'إجمالي الزيارات',
    totalWarehouses: 'إجمالي المخازن',
    totalProducts: 'إجمالي المنتجات',
    totalOrders: 'إجمالي الطلبات',
    recentActivity: 'النشاط الأخير',
    viewAll: 'عرض الكل',
    
    // Users Page
    addUser: 'إضافة مستخدم',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    role: 'الدور',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    actions: 'الإجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    
    // Roles - Enhanced with new hierarchy
    gm: 'مدير عام',
    admin: 'مدير',
    lineManager: 'مدير خط',
    areaManager: 'مدير منطقة',
    districtManager: 'مدير مقاطعة', 
    keyAccount: 'حساب رئيسي',
    medicalRep: 'مندوب طبي',
    manager: 'مدير فرع', // Legacy
    salesRep: 'مندوب مبيعات', // Legacy
    warehouse: 'مخزن',
    accounting: 'محاسب',
    
    // Lines and Regions
    line1: 'الخط الأول',
    line2: 'الخط الثاني',
    regions: 'المناطق',
    districts: 'المقاطعات',
    regionManagement: 'إدارة المناطق',
    districtManagement: 'إدارة المقاطعات',
    lineManagement: 'إدارة الخطوط',
    areaManagement: 'إدارة المناطق',
    
    // Enhanced Admin Settings
    comprehensiveSettings: 'الإعدادات الشاملة',
    roleHierarchy: 'هيكل الأدوار',
    systemHealth: 'صحة النظام',
    lineStatistics: 'إحصائيات الخطوط',
    initializeSystem: 'تهيئة النظام',
    
    // Warehouse
    warehouseName: 'اسم المخزن',
    location: 'الموقع',
    capacity: 'السعة',
    currentStock: 'المخزون الحالي',
    products: 'المنتجات',
    orders: 'الطلبات',
    movement: 'الحركة',
    inventory: 'الجرد',
    
    // Orders
    orderNumber: 'رقم الطلب',
    orderDate: 'تاريخ الطلب',
    orderType: 'نوع الطلب',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    totalPrice: 'السعر الإجمالي',
    
    // Approvals
    approvals: 'الموافقات',
    myRequests: 'طلباتي',
    pendingApprovals: 'في انتظار موافقتي',
    approvalHistory: 'سجل الموافقات',
    requestType: 'نوع الطلب',
    requestStatus: 'حالة الطلب',
    requestDate: 'تاريخ الطلب',
    approvalProgress: 'تقدم الموافقة',
    awaitingApproval: 'في انتظار الموافقة',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',
    cancelled: 'ملغي',
    pending: 'معلق',
    viewDetails: 'عرض التفاصيل',
    approve: 'موافقة',
    reject: 'رفض',
    requestDetails: 'تفاصيل الطلب',
    approvedBy: 'وافق عليه',
    rejectedBy: 'رفضه',
    approvalDate: 'تاريخ الموافقة',
    notes: 'ملاحظات',
    approved: 'معتمد',
    pending: 'في الانتظار',
    rejected: 'مرفوض',
    
    // Visits
    visitDate: 'تاريخ الزيارة',
    doctor: 'الطبيب',
    clinic: 'العيادة',
    salesRep: 'المندوب',
    notes: 'ملاحظات',
    gpsLocation: 'موقع GPS',
    visitType: 'نوع الزيارة',
    
    // Search
    search: 'بحث',
    searchPlaceholder: 'ابحث عن المستخدمين، الأطباء، العيادات، الفواتير...',
    searchResults: 'نتائج البحث',
    noResults: 'لا توجد نتائج',
    
    // Settings
    systemSettings: 'إعدادات النظام',
    companyInfo: 'معلومات الشركة',
    companyName: 'اسم الشركة',
    logo: 'الشعار',
    primaryColor: 'اللون الأساسي',
    secondaryColor: 'اللون الثانوي',
    
    // Admin Settings
    adminSettings: 'إعدادات الإدارة',
    permissions: 'الصلاحيات',
    dashboardConfig: 'إعدادات لوحة التحكم',
    systemHealth: 'صحة النظام',
    security: 'الأمان',
    activityLogs: 'سجلات الأنشطة',
    
    // Common
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    info: 'معلومات',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    submit: 'إرسال',
    
    // Footer
    footerAbout: 'عن الشركة',
    footerServices: 'خدماتنا',
    footerContact: 'اتصل بنا',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'الشروط والأحكام',
    footerSupport: 'الدعم الفني',
    footerQuickLinks: 'روابط سريعة',
    footerLegal: 'قانوني',
    footerContactUs: 'تواصل معنا',
    footerCopyright: 'جميع الحقوق محفوظة',
    footerDescription: 'نظام إدارة شامل للمؤسسات والشركات مع أحدث التقنيات',
    footerLocation: 'القاهرة، مصر',
    
    // Themes
    themeLight: 'فاتح',
    themeDark: 'غامق',
    themeMinimal: 'بسيط',
    themeModern: 'حديث',
    themeFancy: 'فاخر',
    themeCyber: 'سايبر',
    themeSunset: 'غروب',
    themeOcean: 'محيط',
    themeForest: 'غابة'
  },
  
  en: {
    // System Name
    systemName: 'EP Group System',
    
    // Login Page
    login: 'Login',
    username: 'Username',
    password: 'Password',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Login',
    loginLoading: 'Logging in...',
    welcome: 'Welcome to',
    enterCredentials: 'Enter your credentials to login',
    
    // Navigation
    dashboard: 'Dashboard',
    statistics: 'Statistics',
    users: 'Users',
    userManagement: 'User Management',
    warehouse: 'Warehouse',
    warehouseManagement: 'Warehouse Management',
    visits: 'Visits',
    visitsLog: 'Visits Log',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    
    // Dashboard
    totalUsers: 'Total Users',
    totalClinics: 'Total Clinics',
    totalDoctors: 'Total Doctors',
    totalVisits: 'Total Visits',
    totalWarehouses: 'Total Warehouses',
    totalProducts: 'Total Products',
    totalOrders: 'Total Orders',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    
    // Users Page
    addUser: 'Add User',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    
    // Roles - Enhanced with new hierarchy
    gm: 'General Manager',
    admin: 'Admin',
    lineManager: 'Line Manager',
    areaManager: 'Area Manager',
    districtManager: 'District Manager',
    keyAccount: 'Key Account',
    medicalRep: 'Medical Rep',
    manager: 'Manager', // Legacy
    salesRep: 'Sales Rep', // Legacy
    warehouse: 'Warehouse',
    accounting: 'Accounting',
    
    // Lines and Regions
    line1: 'Line 1',
    line2: 'Line 2',
    regions: 'Regions',
    districts: 'Districts',
    regionManagement: 'Region Management',
    districtManagement: 'District Management',
    lineManagement: 'Line Management',
    areaManagement: 'Area Management',
    
    // Enhanced Admin Settings
    comprehensiveSettings: 'Comprehensive Settings',
    roleHierarchy: 'Role Hierarchy',
    systemHealth: 'System Health',
    lineStatistics: 'Line Statistics',
    initializeSystem: 'Initialize System',
    
    // Warehouse
    warehouseName: 'Warehouse Name',
    location: 'Location',
    capacity: 'Capacity',
    currentStock: 'Current Stock',
    products: 'Products',
    orders: 'Orders',
    movement: 'Movement',
    inventory: 'Inventory',
    
    // Orders
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderType: 'Order Type',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    totalPrice: 'Total Price',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    
    // Visits
    visitDate: 'Visit Date',
    doctor: 'Doctor',
    clinic: 'Clinic',
    salesRep: 'Sales Rep',
    notes: 'Notes',
    gpsLocation: 'GPS Location',
    visitType: 'Visit Type',
    
    // Search
    search: 'Search',
    searchPlaceholder: 'Search users, doctors, clinics, invoices...',
    searchResults: 'Search Results',
    noResults: 'No Results',
    
    // Settings
    systemSettings: 'System Settings',
    companyInfo: 'Company Information',
    companyName: 'Company Name',
    logo: 'Logo',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    
    // Admin Settings
    adminSettings: 'Admin Settings',
    permissions: 'Permissions',
    dashboardConfig: 'Dashboard Configuration',
    systemHealth: 'System Health',
    security: 'Security',
    activityLogs: 'Activity Logs',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    
    // Footer
    footerAbout: 'About Us',
    footerServices: 'Our Services',
    footerContact: 'Contact Us',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms & Conditions',
    footerSupport: 'Technical Support',
    footerQuickLinks: 'Quick Links',
    footerLegal: 'Legal',
    footerContactUs: 'Contact',
    footerCopyright: 'All rights reserved',
    footerDescription: 'Comprehensive enterprise management system with latest technologies',
    footerLocation: 'Cairo, Egypt',
    
    // Themes
    themeLight: 'Light',
    themeDark: 'Dark',
    themeMinimal: 'Minimal',
    themeModern: 'Modern',
    themeFancy: 'Fancy',
    themeCyber: 'Cyber',
    themeSunset: 'Sunset',
    themeOcean: 'Ocean',
    themeForest: 'Forest'
  }
};

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'; // Default to English
  });

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Update document direction
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
    
    // Update body class for styling
    document.body.className = document.body.className.replace(/\b(arabic|english)\b/g, '');
    document.body.classList.add(newLanguage === 'ar' ? 'arabic' : 'english');
  };

  useEffect(() => {
    // Set initial document attributes
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.classList.add(language === 'ar' ? 'arabic' : 'english');
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      changeLanguage,
      t,
      isRTL: language === 'ar'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Enhanced Language Toggle Component
const LanguageToggle = ({ className = "", position = "header" }) => {
  const { language, changeLanguage, t } = useLanguage();
  
  const toggleLanguage = () => {
    changeLanguage(language === 'ar' ? 'en' : 'ar');
  };

  if (position === "login") {
    return (
      <div className={`language-toggle ${className} ${language === 'ar' ? 'rtl' : ''}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className={`language-option ${language === 'ar' ? 'active' : ''}`}
          >
            العربية
          </button>
          <button
            onClick={toggleLanguage}
            className={`language-option ${language === 'en' ? 'active' : ''}`}
          >
            English
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="language-toggle">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className={`language-option ${language === 'ar' ? 'active' : ''}`}
        >
          ع
        </button>
        <button
          onClick={toggleLanguage}
          className={`language-option ${language === 'en' ? 'active' : ''}`}
        >
          EN
        </button>
      </div>
    </div>
  );
};
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  // Enhanced themes with modern, youthful designs
  const availableThemes = [
    'light', 'dark', 'minimal', 'modern', 'fancy',
    'cyber', 'sunset', 'ocean', 'forest'
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    // Apply theme to document element and body
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    // Force theme variables update
    updateThemeVariables(savedTheme);
  }, []);

  const updateThemeVariables = (currentTheme) => {
    const root = document.documentElement;
    
    // Enhanced theme configurations with better contrast and modern designs
    const themeConfigs = {
      light: {
        '--primary-bg': '#ffffff',
        '--secondary-bg': '#f8fafc',
        '--accent-bg': '#e2e8f0',
        '--card-bg': 'rgba(255, 255, 255, 0.95)',
        '--glass-bg': 'rgba(248, 250, 252, 0.8)',
        '--text-primary': '#1e293b',
        '--text-secondary': '#475569',
        '--text-muted': '#64748b',
        '--gradient-dark': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
        '--border-color': '#e2e8f0',
        '--hover-bg': 'rgba(0, 0, 0, 0.05)',
        '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        '--primary-color': '#3b82f6',
        '--success-color': '#10b981',
        '--warning-color': '#f59e0b',
        '--error-color': '#ef4444',
        '--glow-primary': 'none',
        '--glow-secondary': 'none'
      },
      dark: {
        '--primary-bg': '#0f172a',
        '--secondary-bg': '#1e293b',
        '--accent-bg': '#334155',
        '--card-bg': 'rgba(30, 41, 59, 0.95)',
        '--glass-bg': 'rgba(15, 23, 42, 0.8)',
        '--text-primary': '#f8fafc',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#94a3b8',
        '--gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        '--border-color': '#334155',
        '--hover-bg': 'rgba(255, 255, 255, 0.05)',
        '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        '--primary-color': '#60a5fa',
        '--success-color': '#34d399',
        '--warning-color': '#fbbf24',
        '--error-color': '#f87171',
        '--glow-primary': 'none',
        '--glow-secondary': 'none'
      },
      minimal: {
        '--primary-bg': '#fefefe',
        '--secondary-bg': '#f9f9f9',
        '--accent-bg': '#f0f0f0',
        '--card-bg': 'rgba(255, 255, 255, 0.98)',
        '--glass-bg': 'rgba(249, 249, 249, 0.95)',
        '--text-primary': '#2d3748',
        '--text-secondary': '#4a5568',
        '--text-muted': '#718096',
        '--gradient-dark': 'linear-gradient(135deg, #fefefe 0%, #f9f9f9 100%)',
        '--border-color': '#e2e8f0',
        '--hover-bg': 'rgba(0, 0, 0, 0.03)',
        '--shadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
        '--primary-color': '#4a5568',
        '--success-color': '#48bb78',
        '--warning-color': '#ed8936',
        '--error-color': '#e53e3e',
        '--glow-primary': 'none',
        '--glow-secondary': 'none'
      },
      modern: {
        '--primary-bg': '#0a0a0a',
        '--secondary-bg': '#1a1a1a',
        '--accent-bg': '#2d2d2d',
        '--card-bg': 'rgba(26, 26, 26, 0.95)',
        '--glass-bg': 'rgba(10, 10, 10, 0.8)',
        '--text-primary': '#ffffff',
        '--text-secondary': '#d1d5db',
        '--text-muted': '#9ca3af',
        '--gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
        '--border-color': '#404040',
        '--hover-bg': 'rgba(255, 255, 255, 0.08)',
        '--shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
        '--primary-color': '#00d4ff',
        '--success-color': '#00ff88',
        '--warning-color': '#ffaa00',
        '--error-color': '#ff4757',
        '--glow-primary': '0 0 20px rgba(0, 212, 255, 0.3)',
        '--glow-secondary': '0 0 10px rgba(0, 255, 136, 0.2)'
      },
      fancy: {
        '--primary-bg': '#1a1a2e',
        '--secondary-bg': '#16213e',
        '--accent-bg': '#0f3460',
        '--card-bg': 'rgba(22, 33, 62, 0.95)',
        '--glass-bg': 'rgba(26, 26, 46, 0.8)',
        '--text-primary': '#eee6ff',
        '--text-secondary': '#b8b5ff',
        '--text-muted': '#8a87ff',
        '--gradient-dark': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        '--border-color': '#533483',
        '--hover-bg': 'rgba(238, 230, 255, 0.1)',
        '--shadow': '0 8px 32px rgba(83, 52, 131, 0.3)',
        '--primary-color': '#bb86fc',
        '--success-color': '#4ade80',
        '--warning-color': '#fbbf24',
        '--error-color': '#f87171',
        '--glow-primary': '0 0 20px rgba(187, 134, 252, 0.5)',
        '--glow-secondary': '0 0 10px rgba(184, 181, 255, 0.3)'
      },
      cyber: {
        '--primary-bg': '#0d1117',
        '--secondary-bg': '#161b22',
        '--accent-bg': '#21262d',
        '--card-bg': 'rgba(22, 27, 34, 0.95)',
        '--glass-bg': 'rgba(13, 17, 23, 0.8)',
        '--text-primary': '#00ff41',
        '--text-secondary': '#58a6ff',
        '--text-muted': '#7d8590',
        '--gradient-dark': 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
        '--border-color': '#30363d',
        '--hover-bg': 'rgba(0, 255, 65, 0.1)',
        '--shadow': '0 8px 32px rgba(0, 255, 65, 0.2)',
        '--primary-color': '#00ff41',
        '--success-color': '#00ff41',
        '--warning-color': '#ffab00',
        '--error-color': '#ff4757',
        '--glow-primary': '0 0 20px rgba(0, 255, 65, 0.4)',
        '--glow-secondary': '0 0 10px rgba(88, 166, 255, 0.3)'
      },
      sunset: {
        '--primary-bg': '#2d1b3d',
        '--secondary-bg': '#3d2858',
        '--accent-bg': '#4a3566',
        '--card-bg': 'rgba(61, 40, 88, 0.95)',
        '--glass-bg': 'rgba(45, 27, 61, 0.8)',
        '--text-primary': '#fff4e6',
        '--text-secondary': '#ffd6a5',
        '--text-muted': '#ffab76',
        '--gradient-dark': 'linear-gradient(135deg, #2d1b3d 0%, #3d2858 50%, #ff6b6b 100%)',
        '--border-color': '#ff8a80',
        '--hover-bg': 'rgba(255, 116, 116, 0.1)',
        '--shadow': '0 8px 32px rgba(255, 107, 107, 0.3)',
        '--primary-color': '#ff6b6b',
        '--success-color': '#51cf66',
        '--warning-color': '#ffd43b',
        '--error-color': '#ff6b6b',
        '--glow-primary': '0 0 20px rgba(255, 107, 107, 0.4)',
        '--glow-secondary': '0 0 10px rgba(255, 214, 165, 0.3)'
      },
      ocean: {
        '--primary-bg': '#0f2027',
        '--secondary-bg': '#203a43',
        '--accent-bg': '#2c5364',
        '--card-bg': 'rgba(32, 58, 67, 0.95)',
        '--glass-bg': 'rgba(15, 32, 39, 0.8)',
        '--text-primary': '#e6fffa',
        '--text-secondary': '#9decf9',
        '--text-muted': '#4dd0e1',
        '--gradient-dark': 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        '--border-color': '#26a69a',
        '--hover-bg': 'rgba(38, 166, 154, 0.1)',
        '--shadow': '0 8px 32px rgba(0, 188, 212, 0.3)',
        '--primary-color': '#00bcd4',
        '--success-color': '#26a69a',
        '--warning-color': '#ffa726',
        '--error-color': '#ef5350',
        '--glow-primary': '0 0 20px rgba(0, 188, 212, 0.4)',
        '--glow-secondary': '0 0 10px rgba(157, 236, 249, 0.3)'
      },
      forest: {
        '--primary-bg': '#1b2f1e',
        '--secondary-bg': '#2d4a32',
        '--accent-bg': '#3e5c42',
        '--card-bg': 'rgba(45, 74, 50, 0.95)',
        '--glass-bg': 'rgba(27, 47, 30, 0.8)',
        '--text-primary': '#f1f8e9',
        '--text-secondary': '#c8e6c9',
        '--text-muted': '#a5d6a7',
        '--gradient-dark': 'linear-gradient(135deg, #1b2f1e 0%, #2d4a32 50%, #3e5c42 100%)',
        '--border-color': '#4caf50',
        '--hover-bg': 'rgba(76, 175, 80, 0.1)',
        '--shadow': '0 8px 32px rgba(76, 175, 80, 0.3)',
        '--primary-color': '#4caf50',
        '--success-color': '#66bb6a',
        '--warning-color': '#ffb74d',
        '--error-color': '#ef5350',
        '--glow-primary': '0 0 20px rgba(76, 175, 80, 0.4)',
        '--glow-secondary': '0 0 10px rgba(200, 230, 201, 0.3)'
      }
    };

    const config = themeConfigs[currentTheme] || themeConfigs.dark;
    
    // Apply theme variables
    Object.entries(config).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  };

  const cycleTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const newTheme = availableThemes[nextIndex];
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    updateThemeVariables(newTheme);
  };

  const setSpecificTheme = (newTheme) => {
    if (availableThemes.includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.setAttribute('data-theme', newTheme);
      updateThemeVariables(newTheme);
    }
  };

  // Legacy support for toggleTheme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setSpecificTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      cycleTheme,
      setSpecificTheme,
      availableThemes
    }}>
      <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Advanced SVG Icon System with Dynamic Theming
const IconLibrary = {
  // Navigation & General
  dashboard: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
  </svg>`,
  
  users: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" fill="currentColor"/>
  </svg>`,
  
  settings: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" fill="currentColor"/>
  </svg>`,
  
  // Business & Management
  organization: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  regions: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  analytics: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3v18h18M9 9l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M19 9v6M15 13v6M11 17v6M7 21v6" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  // Google Services
  maps: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 2a5.5 5.5 0 105.5 5.5c0-1.61-.59-3.09-1.56-4.24L14.5 2z" fill="currentColor"/>
    <path d="M14.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="white"/>
    <path d="M5 12h14l-1 9H6l-1-9z" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  gps: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8a3 3 0 100 6 3 3 0 000-6z" fill="currentColor"/>
    <path d="M12 1v6M12 17v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M1 12h6M17 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  // System Features
  security: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  theme: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3a6.364 6.364 0 004.5 1.5c1.454 0 2.765-.46 3.75-1.238A9.001 9.001 0 0112 21c-4.97 0-9-4.03-9-9s4.03-9 9-9z" fill="currentColor"/>
  </svg>`,
  
  language: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  // Communication & Collaboration
  phone: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  notifications: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  // Business Operations
  accounting: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" stroke-width="2" fill="none"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  reports: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="2" fill="none"/>
    <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  // Modern Icons
  gamification: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
  </svg>`,
  
  scanner: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="currentColor" stroke-width="2" fill="none"/>
    <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  visits: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" fill="currentColor"/>
  </svg>`,
  
  // Additional Business Icons
  products: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  warehouse: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21h18M5 21V7l8-4v18M19 21V7l-6-4" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M9 9v4M15 9v4" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  // Control & Management
  features: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  performance: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h14a2 2 0 002-2" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M12 8v4l2 2" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  // Status & Indicators
  success: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/>
    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  
  warning: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  
  error: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
  </svg>`
};

// Dynamic SVG Icon Component
const SVGIcon = ({ name, size = 24, className = '', color = 'currentColor', style = {} }) => {
  const iconSVG = IconLibrary[name];
  
  if (!iconSVG) {
    console.warn(`Icon "${name}" not found in IconLibrary`);
    return <span className={`inline-block ${className}`} style={{ width: size, height: size, ...style }}>❓</span>;
  }
  
  // Create SVG element with proper theming
  return (
    <span 
      className={`inline-flex items-center justify-center icon-svg ${className}`}
      style={{ 
        width: size, 
        height: size, 
        color: color,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
        transition: 'all 0.3s ease',
        ...style 
      }}
      dangerouslySetInnerHTML={{ 
        __html: iconSVG.replace(/currentColor/g, color || 'var(--icon-color, currentColor)')
      }}
    />
  );
};

// Enhanced Global Search Component with Invoice Search
const GlobalSearch = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const searchTypes = [
    { value: 'all', label: 'البحث الشامل', icon: 'search' },
    { value: 'representative', label: 'المناديب', icon: 'user' },
    { value: 'doctor', label: 'الأطباء', icon: 'user' },
    { value: 'clinic', label: 'العيادات', icon: 'warehouse' },
    { value: 'invoice', label: 'الفواتير', icon: 'reports' },
    { value: 'product', label: 'المنتجات', icon: 'warehouse' }
  ];

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Check if search query is a number (potential invoice number)
      const isInvoiceNumber = /^\d+$/.test(searchQuery.trim());
      
      const response = await axios.get(`${API}/search/comprehensive`, {
        params: {
          q: searchQuery,
          search_type: isInvoiceNumber ? 'invoice' : searchType
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSearchResults(response.data.results);
      
      // If searching by invoice number and found results, automatically open first invoice
      if (isInvoiceNumber && response.data.results.invoices && response.data.results.invoices.length > 0) {
        const firstInvoice = response.data.results.invoices[0];
        setSelectedInvoice(firstInvoice);
        setShowInvoiceModal(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>جاري البحث...</p>
        </div>
      );
    }

    if (!searchResults || Object.keys(searchResults).length === 0) {
      return (
        <div className="text-center py-12">
          <SVGIcon name="search" size={64} className="mx-auto mb-4 text-gray-400" />
          <p style={{ color: 'var(--text-secondary)' }}>ابدأ البحث للحصول على النتائج</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            يمكنك البحث باستخدام الأسماء أو أرقام الفواتير
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Representatives Results */}
        {searchResults.representatives && searchResults.representatives.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="user" size={24} />
              <span>المناديب ({searchResults.representatives.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.representatives.map((rep) => (
                <div key={rep.id} className="glass-effect p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {rep.photo ? (
                        <img src={rep.photo} alt={rep.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        rep.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{rep.name}</h4>
                        <span className="text-sm px-3 py-1 bg-blue-100 bg-opacity-20 rounded-full">مندوب</span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {rep.username} • {rep.email}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>الزيارات: {rep.statistics?.visits?.total || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>الطلبات: {rep.statistics?.orders?.total || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          <span>التارجيت: {rep.statistics?.target || 0} ج.م</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>المديونية: {rep.statistics?.pending_debt || 0} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctors Results */}
        {searchResults.doctors && searchResults.doctors.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="user" size={24} />
              <span>الأطباء ({searchResults.doctors.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.doctors.map((doctor) => (
                <div key={doctor.id} className="glass-effect p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                      د.{doctor.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">د. {doctor.name}</h4>
                        <span className="text-sm px-3 py-1 bg-green-100 bg-opacity-20 rounded-full">طبيب</span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {doctor.specialty} • {doctor.phone}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>العيادة: {doctor.clinic?.name || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>الطلبات: {doctor.total_orders || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>المديونية: {doctor.pending_debt || 0} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinics Results */}
        {searchResults.clinics && searchResults.clinics.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="warehouse" size={24} />
              <span>العيادات ({searchResults.clinics.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.clinics.map((clinic) => (
                <div key={clinic.id} className="glass-effect p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {clinic.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{clinic.name}</h4>
                        <span className="text-sm px-3 py-1 bg-purple-100 bg-opacity-20 rounded-full">عيادة</span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {clinic.address} • {clinic.phone}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          <span>المدير: {clinic.manager_name || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>الأطباء: {clinic.doctors?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>الطلبات: {clinic.total_orders || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>المديونية: {clinic.pending_debt || 0} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices Results */}
        {searchResults.invoices && searchResults.invoices.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="reports" size={24} />
              <span>الفواتير ({searchResults.invoices.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="glass-effect p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => openInvoiceModal(invoice)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      #
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">فاتورة #{invoice.id.slice(-8)}</h4>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          invoice.status === 'APPROVED' ? 'bg-green-100 bg-opacity-20 text-green-300' :
                          invoice.status === 'PENDING' ? 'bg-yellow-100 bg-opacity-20 text-yellow-300' :
                          'bg-gray-100 bg-opacity-20 text-gray-300'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {invoice.sales_rep_name} • {invoice.doctor_name} • {invoice.clinic_name}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>التاريخ: {new Date(invoice.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>القيمة: {invoice.total_amount} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Results */}
        {searchResults.products && searchResults.products.length > 0 && (
          <div className="search-section">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
              <SVGIcon name="warehouse" size={24} />
              <span>المنتجات ({searchResults.products.length})</span>
            </h3>
            <div className="grid gap-4">
              {searchResults.products.map((product) => (
                <div key={product.id} className="glass-effect p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{product.name}</h4>
                        <span className="text-sm px-3 py-1 bg-indigo-100 bg-opacity-20 rounded-full">منتج</span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {product.description} • {product.category}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>السعر: {product.price} ج.م</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>الوحدة: {product.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>تم طلبه: {product.total_ordered || 0} مرة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searchQuery && Object.keys(searchResults).length === 0 && (
          <div className="text-center py-12">
            <SVGIcon name="search" size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
              لا توجد نتائج لـ "{searchQuery}"
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              جرب استخدام كلمات أخرى أو أرقام الفواتير
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-10">
      <div className="glass-effect w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gradient">البحث الشامل</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 hover:bg-opacity-10 rounded-full transition-colors"
            >
              <SVGIcon name="close" size={24} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="ابحث عن مندوب، طبيب، عيادة، رقم فاتورة، أو منتج..."
                className="w-full p-4 pr-12 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 glass-effect"
                style={{ 
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <div className="absolute right-4 top-4">
                <SVGIcon name="search" size={20} />
              </div>
            </div>
            <button
              onClick={performSearch}
              className="btn-modern px-8 py-4 flex items-center gap-2"
              disabled={loading}
            >
              <SVGIcon name="search" size={18} />
              بحث
            </button>
          </div>

          {/* Search Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {searchTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSearchType(type.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  searchType === type.value 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'glass-effect hover:bg-gray-100 hover:bg-opacity-10'
                }`}
              >
                <SVGIcon name={type.icon} size={16} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderSearchResults()}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <EnhancedInvoiceModal 
          invoice={selectedInvoice} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}
    </div>
  );
};

// Enhanced Invoice Modal Component
const EnhancedInvoiceModal = ({ invoice, onClose }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('enhanced-invoice-content');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleDownload = () => {
    // Create a downloadable PDF (simplified version)
    const element = document.getElementById('enhanced-invoice-content');
    const opt = {
      margin: 1,
      filename: `فاتورة-${invoice.id.slice(-8)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Note: This would require html2pdf library
    // html2pdf().set(opt).from(element).save();
    alert('سيتم تنزيل الفاتورة قريباً');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div className="glass-effect w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-white border-opacity-20 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gradient">فاتورة رقم #{invoice.id.slice(-8)}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="btn-modern px-4 py-2 flex items-center gap-2"
            >
              <SVGIcon name="download" size={16} />
              تنزيل PDF
            </button>
            <button
              onClick={handlePrint}
              className="btn-modern px-4 py-2 flex items-center gap-2"
            >
              <SVGIcon name="print" size={16} />
              طباعة
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 hover:bg-opacity-10 rounded-full transition-colors"
            >
              <SVGIcon name="close" size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[80vh]" id="enhanced-invoice-content">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">نظام إدارة المبيعات</h1>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Sales Management System
                  </p>
                </div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8">
              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="reports" size={20} />
                  تفاصيل الفاتورة
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">رقم الفاتورة:</span>
                    <span className="font-mono">#{invoice.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">تاريخ الإنشاء:</span>
                    <span>{new Date(invoice.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">الوقت:</span>
                    <span>{new Date(invoice.created_at).toLocaleTimeString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">الحالة:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invoice.status === 'APPROVED' ? 'bg-green-100 bg-opacity-20 text-green-300' :
                      invoice.status === 'PENDING' ? 'bg-yellow-100 bg-opacity-20 text-yellow-300' :
                      'bg-gray-100 bg-opacity-20 text-gray-300'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="font-bold text-lg">المبلغ الإجمالي:</span>
                    <span className="font-bold text-lg text-green-500">{invoice.total_amount} ج.م</span>
                  </div>
                </div>
              </div>

              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="user" size={20} />
                  تفاصيل العميل
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">المندوب:</span>
                    <span>{invoice.sales_rep_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">الطبيب:</span>
                    <span>د. {invoice.doctor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">العيادة:</span>
                    <span>{invoice.clinic_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">المخزن:</span>
                    <span>{invoice.warehouse_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="warehouse" size={20} />
                  تفاصيل المنتجات ({invoice.items.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <th className="text-right py-3 px-4 font-bold">#</th>
                        <th className="text-right py-3 px-4 font-bold">اسم المنتج</th>
                        <th className="text-right py-3 px-4 font-bold">الكمية</th>
                        <th className="text-right py-3 px-4 font-bold">السعر الوحدة</th>
                        <th className="text-right py-3 px-4 font-bold">الخصم</th>
                        <th className="text-right py-3 px-4 font-bold">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-opacity-20" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="py-3 px-4 text-center">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{item.product_name}</div>
                            {item.product_description && (
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.product_description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-center">{item.unit_price} ج.م</td>
                          <td className="py-3 px-4 text-center">
                            {item.discount_amount ? `${item.discount_amount} ج.م` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {(item.quantity * item.unit_price - (item.discount_amount || 0)).toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-blue-500">
                        <td colSpan="5" className="py-3 px-4 text-right font-bold text-lg">
                          المجموع الكلي:
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-lg text-green-500">
                          {invoice.total_amount} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notes */}
              {invoice.notes && (
                <div className="glass-effect p-6 rounded-xl">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <SVGIcon name="chat" size={20} />
                    ملاحظات
                  </h4>
                  <p className="text-sm leading-relaxed">{invoice.notes}</p>
                </div>
              )}

              {/* Payment Information */}
              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="reports" size={20} />
                  معلومات الدفع
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>طريقة الدفع:</span>
                    <span>{invoice.payment_method || 'آجل'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تاريخ الاستحقاق:</span>
                    <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المدفوع:</span>
                    <span className="text-green-500">{invoice.paid_amount || 0} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المتبقي:</span>
                    <span className="text-red-500">{(invoice.total_amount - (invoice.paid_amount || 0)).toFixed(2)} ج.م</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-white border-opacity-20">
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                شكراً لك على ثقتك في نظام إدارة المبيعات
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                تم إنشاء هذه الفاتورة إلكترونياً في {new Date().toLocaleString('ar-EG')}
              </p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                <span className="text-xs font-bold">Sales Management System</span>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Modal Component
const UserManagementModal = ({ mode = 'add', user = null, regions, managers, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'medical_rep',
    region_id: user?.region_id || '',
    direct_manager_id: user?.direct_manager_id || '',
    address: user?.address || '',
    national_id: user?.national_id || '',
    hire_date: user?.hire_date || new Date().toISOString().split('T')[0],
    is_active: user?.is_active !== undefined ? user.is_active : true,
    profile_photo: user?.profile_photo || null,
    password: ''
  });
  const [photoPreview, setPhotoPreview] = useState(user?.profile_photo || null);

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setPhotoPreview(base64);
        setFormData({ ...formData, profile_photo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const availableManagers = managers.filter(manager => 
    !formData.region_id || manager.region_id === formData.region_id || !manager.region_id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-gradient">
          {mode === 'add' ? 'إضافة مستخدم جديد' : `تعديل: ${user?.full_name}`}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">المعلومات الشخصية</h4>
            
            {/* Profile Photo */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    formData.full_name.charAt(0).toUpperCase() || '👤'
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="btn-secondary text-xs px-3 py-1 cursor-pointer">
                  تغيير الصورة
                </label>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  الصورة الشخصية إجبارية
                </p>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الاسم الكامل *:</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="form-modern w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">اسم المستخدم *:</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="form-modern w-full"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">البريد الإلكتروني *:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">رقم الهاتف *:</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">الرقم القومي:</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                  className="form-modern w-full"
                  maxLength="14"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">تاريخ التوظيف:</label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  className="form-modern w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">العنوان:</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="form-modern w-full h-20"
                placeholder="العنوان بالتفصيل..."
              />
            </div>
          </div>

          {/* Work Information */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">معلومات العمل</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">الدور *:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="form-modern w-full"
                  required
                >
                  <option value="">اختر الدور</option>
                  <option value="admin">مدير النظام</option>
                  <option value="gm">المدير العام</option>
                  <option value="line_manager">مدير الخط</option>
                  <option value="area_manager">مدير المنطقة</option>
                  <option value="district_manager">مدير المنطقة المحلية</option>
                  <option value="key_account">حسابات رئيسية</option>
                  <option value="medical_rep">مندوب طبي</option>
                  <option value="warehouse_keeper">أمين المخزن</option>
                  <option value="accounting">محاسب</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">المنطقة *:</label>
                <select
                  value={formData.region_id}
                  onChange={(e) => setFormData({...formData, region_id: e.target.value})}
                  className="form-modern w-full"
                  required
                >
                  <option value="">اختر المنطقة</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">المدير المباشر *:</label>
                <select
                  value={formData.direct_manager_id}
                  onChange={(e) => setFormData({...formData, direct_manager_id: e.target.value})}
                  className="form-modern w-full"
                  required
                >
                  <option value="">اختر المدير المباشر</option>
                  {availableManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">إعدادات الأمان</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode === 'add' && (
                <div>
                  <label className="block text-sm font-bold mb-2">كلمة المرور *:</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="form-modern w-full"
                    required={mode === 'add'}
                    minLength="6"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-bold">
                  حساب نشط
                </label>
              </div>
            </div>
          </div>

          {/* Requirements Notice */}
          <div className="glass-effect p-4 rounded-xl bg-blue-500 bg-opacity-10 border border-blue-500">
            <h4 className="text-lg font-bold mb-2 text-blue-400">متطلبات إنشاء المستخدم:</h4>
            <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>✅ تحديد المنطقة الخاصة بالمستخدم</li>
              <li>✅ تحديد المدير المباشر</li>
              <li>✅ إضافة صورة شخصية</li>
              <li>✅ بيانات كاملة وصحيحة</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {mode === 'add' ? 'إضافة المستخدم' : 'حفظ التغييرات'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Theme Toggle Component
const ThemeToggle = ({ showLabel = false, isDropdown = false }) => {
  const { theme, cycleTheme, availableThemes, setSpecificTheme } = useTheme();
  
  const getThemeIcon = (themeName) => {
    const icons = {
      light: 'sun',
      dark: 'moon',
      minimal: 'theme',
      modern: 'theme',
      fancy: 'theme'
    };
    return icons[themeName] || 'theme';
  };

  const getThemeLabel = (themeName) => {
    const labels = {
      light: 'فاتح',
      dark: 'داكن',
      minimal: 'بسيط',
      modern: 'عصري',
      fancy: 'فاخر',
      cyber: 'سايبر',
      sunset: 'غروب',
      ocean: 'محيط',
      forest: 'غابة'
    };
    return labels[themeName] || themeName;
  };

  if (isDropdown) {
    return (
      <div className="relative group">
        <button
          className="theme-toggle flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-10 transition-all duration-200"
          title={`الثيم الحالي: ${getThemeLabel(theme)}`}
        >
          <SVGIcon name={getThemeIcon(theme)} size={20} />
          {showLabel && <span>{getThemeLabel(theme)}</span>}
        </button>
        
        <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {availableThemes.map((themeName) => (
            <button
              key={themeName}
              onClick={() => setSpecificTheme(themeName)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-right hover:bg-gray-100 hover:bg-opacity-20 transition-colors ${
                theme === themeName ? 'bg-blue-500 bg-opacity-20' : ''
              }`}
            >
              <SVGIcon name={getThemeIcon(themeName)} size={16} />
              <span>{getThemeLabel(themeName)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="theme-toggle flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-10 transition-all duration-200"
      title={`الثيم الحالي: ${getThemeLabel(theme)} - اضغط للتبديل`}
    >
      <SVGIcon name={getThemeIcon(theme)} size={20} />
      {showLabel && <span>{getThemeLabel(theme)}</span>}
    </button>
  );
};

// Theme Toggle Component (Legacy)
const ThemeToggleOld = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      {theme === 'dark' ? 'داكن' : 'فاتح'}
    </button>
  );
};

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'حدث خطأ في تسجيل الدخول'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
// Enhanced Login Page with Logo Support
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { login } = useAuth();
  const { language, changeLanguage, t, isRTL } = useLanguage();
  const { theme, changeTheme } = useTheme();

  const themes = [
    { id: 'light', name: t('themeLight'), icon: '☀️' },
    { id: 'dark', name: t('themeDark'), icon: '🌙' },
    { id: 'minimal', name: t('themeMinimal'), icon: '⚪' },
    { id: 'modern', name: t('themeModern'), icon: '🔮' },
    { id: 'fancy', name: t('themeFancy'), icon: '✨' },
    { id: 'cyber', name: t('themeCyber'), icon: '💚' },
    { id: 'sunset', name: t('themeSunset'), icon: '🌅' },
    { id: 'ocean', name: t('themeOcean'), icon: '🌊' },
    { id: 'forest', name: t('themeForest'), icon: '🌲' }
  ];

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`} 
         style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      
      {/* Language & Theme Toggle for Login */}
      <div className={`login-language-toggle ${isRTL ? 'rtl' : ''}`}>
        <div className="flex items-center gap-4">
          <LanguageToggle position="login" />
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="glass-effect p-3 rounded-full hover:scale-105 transition-transform"
              title={language === 'ar' ? 'تغيير الثيم' : 'Change Theme'}
            >
              <SVGIcon name="theme" size={20} className="svg-icon-animated" />
            </button>

            {showThemeMenu && (
              <div className="absolute top-full right-0 mt-2 glass-effect rounded-xl p-2 min-w-48 border border-white border-opacity-20 z-50">
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => {
                        changeTheme(themeOption.id);
                        setShowThemeMenu(false);
                      }}
                      className={`theme-option ${themeOption.id} ${theme === themeOption.id ? 'active' : ''}`}
                      title={themeOption.name}
                    >
                      <span className="text-lg">{themeOption.icon}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white border-opacity-20">
                  <div className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                    {language === 'ar' ? 'الثيم الحالي:' : 'Current:'} <strong>{themes.find(t => t.id === theme)?.name}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="floating">
          <div className="card-modern w-full max-w-md p-8 fade-in-up glass-effect">
            <div className="text-center mb-8">
              {/* Logo Section */}
              <div className="mb-6">
                {systemSettings?.logo_image ? (
                  <img 
                    src={systemSettings.logo_image} 
                    alt={t('logo')}
                    className="w-24 h-24 mx-auto rounded-full object-cover glow-pulse"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto card-gradient-orange rounded-full flex items-center justify-center glow-pulse">
                    <span className="text-4xl">🏥</span>
                  </div>
                )}
              </div>
              
              {/* Company Name */}
              <h1 className={`text-4xl font-bold text-gradient mb-3 system-brand ${isRTL ? 'arabic' : 'english'}`}>
                {t('systemName')}
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('footerDescription')}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                {t('enterCredentials')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 form-modern">
              <div>
                <label>
                  <span className="text-shadow-glow">
                    🧑‍💼 {t('username')}
                  </span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full focus-visible"
                  placeholder={t('username')}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  required
                />
              </div>

              <div>
                <label>
                  <span className="text-shadow-glow">
                    🔒 {t('password')}
                  </span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full focus-visible"
                  placeholder={t('password')}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  required
                />
              </div>

              {error && (
                <div className="alert-modern alert-error scale-in">
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>{t('loginLoading')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    <span>{t('loginButton')}</span>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="card-gradient-blue p-6 rounded-2xl text-center">
                <h3 className="font-bold mb-3 flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>
                    {language === 'ar' ? 'بيانات التجربة' : 'Demo Credentials'}
                  </span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">
                      {language === 'ar' ? 'أدمن:' : 'Admin:'}
                    </span>
                    <span>admin / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">
                      {language === 'ar' ? 'مندوب:' : 'Sales Rep:'}
                    </span>
                    <span>
                      {language === 'ar' ? 'أنشئ من لوحة الأدمن' : 'Create from Admin Panel'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                © {new Date().getFullYear()} {t('systemName')} - {t('footerCopyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comprehensive Admin Settings Page with permissions and controls
const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('permissions');
  const [permissions, setPermissions] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const tabs = [
    { id: 'permissions', label: 'الصلاحيات', icon: 'user' },
    { id: 'dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
    { id: 'system', label: 'النظام', icon: 'settings' },
    { id: 'security', label: 'الأمان', icon: 'settings' },
    { id: 'logs', label: 'السجلات', icon: 'reports' }
  ];

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load permissions
      const permissionsResponse = await axios.get(`${API}/admin/permissions`, { headers });
      setPermissions(permissionsResponse.data);

      // Load dashboard config
      const dashboardResponse = await axios.get(`${API}/admin/dashboard-config`, { headers });
      setDashboardConfig(dashboardResponse.data);

      // Load system health
      const healthResponse = await axios.get(`${API}/admin/system-health`, { headers });
      setSystemHealth(healthResponse.data);

      // Load activity logs
      const logsResponse = await axios.get(`${API}/admin/activity-logs`, { headers });
      setActivityLogs(logsResponse.data);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePermissions = async (updatedPermissions) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/permissions`, updatedPermissions, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(updatedPermissions);
      alert('تم تحديث الصلاحيات بنجاح');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('حدث خطأ في تحديث الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const updateDashboardConfig = async (updatedConfig) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/dashboard-config`, updatedConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardConfig(updatedConfig);
      alert('تم تحديث إعدادات لوحة التحكم بنجاح');
    } catch (error) {
      console.error('Error updating dashboard config:', error);
      alert('حدث خطأ في تحديث إعدادات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !permissions) {
    return (
      <div className="glass-effect p-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل إعدادات الإدارة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect p-6">
        <h2 className="text-3xl font-bold mb-4 text-gradient">إعدادات الإدارة الشاملة</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          التحكم الكامل في النظام، الصلاحيات، وإعدادات لوحة التحكم
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="glass-effect p-2">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <SVGIcon name={tab.icon} size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-effect p-8">
        {activeTab === 'permissions' && (
          <PermissionsTab 
            permissions={permissions} 
            onUpdate={updatePermissions} 
            loading={loading}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <DashboardConfigTab 
            config={dashboardConfig} 
            onUpdate={updateDashboardConfig} 
            loading={loading}
          />
        )}
        
        {activeTab === 'system' && (
          <SystemHealthTab 
            health={systemHealth} 
            onRefresh={loadAdminData} 
            loading={loading}
          />
        )}
        
        {activeTab === 'security' && (
          <SecurityTab 
            config={dashboardConfig} 
            onUpdate={updateDashboardConfig} 
            loading={loading}
          />
        )}
        
        {activeTab === 'logs' && (
          <ActivityLogsTab 
            logs={activityLogs} 
            onRefresh={loadAdminData} 
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Permissions Management Tab
const PermissionsTab = ({ permissions, onUpdate, loading }) => {
  const [localPermissions, setLocalPermissions] = useState(permissions);

  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  const updateRolePermission = (role, permission, value) => {
    const updated = {
      ...localPermissions,
      roles_config: {
        ...localPermissions.roles_config,
        [role]: {
          ...localPermissions.roles_config[role],
          [permission]: value
        }
      }
    };
    setLocalPermissions(updated);
  };

  const updateUIControl = (control, value) => {
    const updated = {
      ...localPermissions,
      ui_controls: {
        ...localPermissions.ui_controls,
        [control]: value
      }
    };
    setLocalPermissions(updated);
  };

  const updateFeatureToggle = (feature, value) => {
    const updated = {
      ...localPermissions,
      feature_toggles: {
        ...localPermissions.feature_toggles,
        [feature]: value
      }
    };
    setLocalPermissions(updated);
  };

  if (!localPermissions) return null;

  const roles = Object.keys(localPermissions.roles_config);
  const permissionLabels = {
    dashboard_access: 'الوصول للوحة التحكم',
    user_management: 'إدارة المستخدمين',
    warehouse_management: 'إدارة المخازن',
    visits_management: 'إدارة الزيارات',
    reports_access: 'الوصول للتقارير',
    settings_access: 'الوصول للإعدادات',
    financial_reports: 'التقارير المالية',
    system_logs: 'سجلات النظام'
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gradient">إدارة الصلاحيات</h3>

      {/* Role-based Permissions */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">صلاحيات الأدوار</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white border-opacity-20">
                <th className="text-right p-4">الصلاحية</th>
                {roles.map(role => (
                  <th key={role} className="text-center p-4 min-w-20">
                    {role === 'admin' ? 'مدير' : 
                     role === 'manager' ? 'مدير فرع' :
                     role === 'sales_rep' ? 'مندوب' :
                     role === 'warehouse_manager' ? 'مدير مخزن' :
                     role === 'warehouse_keeper' ? 'أمين المخزن' :
                     role === 'warehouse' ? 'مخزن' : 'محاسب'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionLabels).map(([permission, label]) => (
                <tr key={permission} className="border-b border-white border-opacity-10">
                  <td className="p-4 font-medium">{label}</td>
                  {roles.map(role => (
                    <td key={role} className="p-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPermissions.roles_config[role]?.[permission] || false}
                          onChange={(e) => updateRolePermission(role, permission, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-6 h-6 rounded border-2 transition-colors ${
                          localPermissions.roles_config[role]?.[permission] 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-400'
                        }`}>
                          {localPermissions.roles_config[role]?.[permission] && (
                            <div className="absolute inset-1 bg-white rounded-sm"></div>
                          )}
                        </div>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UI Controls */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">التحكم في الواجهة</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(localPermissions.ui_controls || {}).map(([control, value]) => (
            <div key={control} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
              <span className="text-sm">
                {control === 'show_statistics_cards' ? 'عرض بطاقات الإحصائيات' :
                 control === 'show_charts' ? 'عرض المخططات' :
                 control === 'show_recent_activities' ? 'عرض الأنشطة الأخيرة' :
                 control === 'show_user_photos' ? 'عرض صور المستخدمين' :
                 control === 'show_themes_selector' ? 'عرض اختيار الثيم' :
                 control === 'show_language_selector' ? 'عرض اختيار اللغة' :
                 control === 'enable_dark_mode' ? 'تمكين الوضع الليلي' :
                 control === 'enable_notifications' ? 'تمكين الإشعارات' :
                 control === 'enable_search' ? 'تمكين البحث' : control}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateUIControl(control, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">مفاتيح المميزات</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(localPermissions.feature_toggles || {}).map(([feature, value]) => (
            <div key={feature} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
              <span className="text-sm">
                {feature === 'gamification_enabled' ? 'التحفيز والألعاب' :
                 feature === 'gps_tracking_enabled' ? 'تتبع GPS' :
                 feature === 'voice_notes_enabled' ? 'الملاحظات الصوتية' :
                 feature === 'file_uploads_enabled' ? 'رفع الملفات' :
                 feature === 'print_reports_enabled' ? 'طباعة التقارير' :
                 feature === 'export_data_enabled' ? 'تصدير البيانات' :
                 feature === 'email_notifications_enabled' ? 'إشعارات البريد' :
                 feature === 'sms_notifications_enabled' ? 'إشعارات SMS' : feature}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateFeatureToggle(feature, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={() => onUpdate(localPermissions)}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50"
      >
        {loading ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
      </button>
    </div>
  );
};

// Dashboard Configuration Tab
const DashboardConfigTab = ({ config, onUpdate, loading }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const updateNavTabRole = (tabKey, role, enabled) => {
    const updated = {
      ...localConfig,
      dashboard_sections: {
        ...localConfig.dashboard_sections,
        navigation_tabs: {
          ...localConfig.dashboard_sections.navigation_tabs,
          [tabKey]: {
            ...localConfig.dashboard_sections.navigation_tabs[tabKey],
            roles: enabled 
              ? [...(localConfig.dashboard_sections.navigation_tabs[tabKey].roles || []), role]
              : (localConfig.dashboard_sections.navigation_tabs[tabKey].roles || []).filter(r => r !== role)
          }
        }
      }
    };
    setLocalConfig(updated);
  };

  if (!localConfig) return null;

  const roles = ['admin', 'manager', 'sales_rep', 'warehouse', 'accounting'];
  const tabLabels = {
    statistics_tab: 'الإحصائيات',
    users_tab: 'إدارة المستخدمين',
    warehouse_tab: 'إدارة المخازن',
    visits_tab: 'سجل الزيارات',
    reports_tab: 'التقارير',
    settings_tab: 'الإعدادات'
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gradient">إعدادات لوحة التحكم</h3>

      {/* Navigation Tabs Configuration */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">تبويبات التنقل</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white border-opacity-20">
                <th className="text-right p-4">التبويب</th>
                {roles.map(role => (
                  <th key={role} className="text-center p-4 min-w-20">
                    {role === 'admin' ? 'مدير' : 
                     role === 'manager' ? 'مدير فرع' :
                     role === 'sales_rep' ? 'مندوب' :
                     role === 'warehouse_manager' ? 'مدير مخزن' :
                     role === 'warehouse_keeper' ? 'أمين المخزن' :
                     role === 'warehouse' ? 'مخزن' : 'محاسب'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(tabLabels).map(([tabKey, label]) => (
                <tr key={tabKey} className="border-b border-white border-opacity-10">
                  <td className="p-4 font-medium">{label}</td>
                  {roles.map(role => (
                    <td key={role} className="p-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(localConfig.dashboard_sections?.navigation_tabs?.[tabKey]?.roles || []).includes(role)}
                          onChange={(e) => updateNavTabRole(tabKey, role, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-6 h-6 rounded border-2 transition-colors ${
                          (localConfig.dashboard_sections?.navigation_tabs?.[tabKey]?.roles || []).includes(role)
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-400'
                        }`}>
                          {(localConfig.dashboard_sections?.navigation_tabs?.[tabKey]?.roles || []).includes(role) && (
                            <div className="absolute inset-1 bg-white rounded-sm"></div>
                          )}
                        </div>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UI Customization */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">تخصيص الواجهة</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-3">اللون الأساسي</label>
            <input
              type="color"
              value={localConfig.ui_customization?.company_branding?.primary_color || '#3b82f6'}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                ui_customization: {
                  ...localConfig.ui_customization,
                  company_branding: {
                    ...localConfig.ui_customization?.company_branding,
                    primary_color: e.target.value
                  }
                }
              })}
              className="w-full h-12 glass-effect border border-white border-opacity-20 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">اللون الثانوي</label>
            <input
              type="color"
              value={localConfig.ui_customization?.company_branding?.secondary_color || '#1e293b'}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                ui_customization: {
                  ...localConfig.ui_customization,
                  company_branding: {
                    ...localConfig.ui_customization?.company_branding,
                    secondary_color: e.target.value
                  }
                }
              })}
              className="w-full h-12 glass-effect border border-white border-opacity-20 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={() => onUpdate(localConfig)}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50"
      >
        {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </div>
  );
};

// System Health Tab
const SystemHealthTab = ({ health, onRefresh, loading }) => {
  if (!health) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient">صحة النظام</h3>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50"
        >
          {loading ? 'تحديث...' : 'تحديث'}
        </button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-effect p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">{health.users?.total || 0}</div>
          <div className="text-sm text-gray-400">إجمالي المستخدمين</div>
        </div>
        <div className="glass-effect p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">{health.users?.active || 0}</div>
          <div className="text-sm text-gray-400">المستخدمين النشطين</div>
        </div>
        <div className="glass-effect p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">{health.system_metrics?.total_visits || 0}</div>
          <div className="text-sm text-gray-400">إجمالي الزيارات</div>
        </div>
        <div className="glass-effect p-6 text-center">
          <div className="text-3xl font-bold text-orange-400 mb-2">{health.system_metrics?.total_orders || 0}</div>
          <div className="text-sm text-gray-400">إجمالي الطلبات</div>
        </div>
      </div>

      {/* Collections Health */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">حالة قواعد البيانات</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health.collections_health || {}).map(([collection, status]) => (
            <div key={collection} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
              <span className="font-medium capitalize">{collection}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{status.count || 0}</span>
                <div className={`w-3 h-3 rounded-full ${
                  status.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Status */}
      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">حالة قاعدة البيانات</h4>
        
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${
            health.database_status === 'connected' ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span className="font-medium">
            {health.database_status === 'connected' ? 'متصل' : 'غير متصل'}
          </span>
          <span className="text-sm text-gray-400 mr-auto">
            آخر فحص: {new Date(health.checked_at).toLocaleString('ar-EG')}
          </span>
        </div>
      </div>
    </div>
  );
};

// Security Settings Tab
const SecurityTab = ({ config, onUpdate, loading }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!localConfig) return null;

  const updateSecuritySetting = (setting, value) => {
    const updated = {
      ...localConfig,
      security_settings: {
        ...localConfig.security_settings,
        [setting]: value
      }
    };
    setLocalConfig(updated);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gradient">إعدادات الأمان</h3>

      <div className="glass-effect p-6">
        <h4 className="text-xl font-bold mb-6">إعدادات كلمة المرور</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-3">فترة انتهاء صلاحية كلمة المرور (أيام)</label>
            <input
              type="number"
              value={localConfig.security_settings?.password_expiry_days || 90}
              onChange={(e) => updateSecuritySetting('password_expiry_days', parseInt(e.target.value))}
              className="w-full p-4 glass-effect border border-white border-opacity-20 rounded-lg text-white"
              min="1"
              max="365"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">عدد محاولات تسجيل الدخول المسموح</label>
            <input
              type="number"
              value={localConfig.security_settings?.max_login_attempts || 5}
              onChange={(e) => updateSecuritySetting('max_login_attempts', parseInt(e.target.value))}
              className="w-full p-4 glass-effect border border-white border-opacity-20 rounded-lg text-white"
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">مهلة انتهاء الجلسة (دقيقة)</label>
            <input
              type="number"
              value={localConfig.security_settings?.session_timeout_minutes || 480}
              onChange={(e) => updateSecuritySetting('session_timeout_minutes', parseInt(e.target.value))}
              className="w-full p-4 glass-effect border border-white border-opacity-20 rounded-lg text-white"
              min="30"
              max="1440"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
            <div>
              <div className="font-medium">إجبار تغيير كلمة المرور</div>
              <div className="text-sm text-gray-400">إجبار المستخدمين على تغيير كلمة المرور عند تسجيل الدخول التالي</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.security_settings?.force_password_change || false}
                onChange={(e) => updateSecuritySetting('force_password_change', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
            <div>
              <div className="font-medium">التحقق بخطوتين (2FA)</div>
              <div className="text-sm text-gray-400">تمكين التحقق بخطوتين لجميع المستخدمين</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.security_settings?.require_2fa || false}
                onChange={(e) => updateSecuritySetting('require_2fa', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={() => onUpdate(localConfig)}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50"
      >
        {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الأمان'}
      </button>
    </div>
  );
};

// Activity Logs Tab
const ActivityLogsTab = ({ logs, onRefresh, loading }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient">سجلات الأنشطة</h3>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50"
        >
          {loading ? 'تحديث...' : 'تحديث'}
        </button>
      </div>

      <div className="glass-effect p-6">
        <div className="space-y-4">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  log.category === 'user_management' ? 'bg-blue-400' :
                  log.category === 'visits' ? 'bg-green-400' :
                  log.category === 'orders' ? 'bg-orange-400' : 'bg-gray-400'
                }`}></div>
                <div className="flex-1">
                  <div className="font-medium">{log.description}</div>
                  <div className="text-sm text-gray-400">
                    {log.user_name} • {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 bg-white bg-opacity-10 rounded-full">
                  {log.category === 'user_management' ? 'إدارة المستخدمين' :
                   log.category === 'visits' ? 'زيارات' :
                   log.category === 'orders' ? 'طلبات' : log.category}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <SVGIcon name="reports" size={64} className="mx-auto mb-4 text-gray-400" />
              <p style={{ color: 'var(--text-secondary)' }}>لا توجد سجلات للأنشطة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// System Settings Component for Admin
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    logo_image: '',
    company_name: 'نظام إدارة المناديب',
    primary_color: '#ff6b35',
    secondary_color: '#0ea5e9'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      setError('خطأ في جلب الإعدادات');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({...settings, logo_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="card-modern p-8 page-transition">
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gradient">إعدادات النظام</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>تخصيص شكل ومظهر النظام</p>
            </div>
          </div>

          {error && (
            <div className="alert-modern alert-error mb-6 scale-in">
              <span className="ml-2">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert-modern alert-success mb-6 scale-in">
              <span className="ml-2">✅</span>
              {success}
            </div>
          )}

          <div className="space-y-8 form-modern">
            {/* Logo Section */}
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <span>شعار الشركة</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    رفع شعار جديد
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full p-4 border-2 border-dashed rounded-xl hover:border-orange-500 transition-colors"
                    style={{ 
                      background: 'var(--glass-bg)',
                      borderColor: 'var(--brand-orange)',
                      borderOpacity: 0.3
                    }}
                  />
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    يُفضل أن يكون الشعار مربع الشكل وبحجم أقصى 5 ميجابايت
                  </p>
                </div>

                <div className="text-center">
                  <label className="block text-sm font-bold mb-2">
                    معاينة الشعار الحالي
                  </label>
                  {settings.logo_image ? (
                    <img 
                      src={settings.logo_image} 
                      alt="شعار الشركة"
                      className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto card-gradient-orange rounded-full flex items-center justify-center">
                      <span className="text-4xl">🏥</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <span>معلومات الشركة</span>
              </h3>
              
              <div>
                <label className="block text-sm font-bold mb-2">
                  اسم الشركة
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                  className="w-full"
                  placeholder="اسم الشركة أو المؤسسة"
                />
              </div>
            </div>

            {/* Color Theme */}
            <div className="card-modern p-6">  
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <span>ألوان النظام</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    اللون الأساسي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                      style={{ borderColor: 'var(--accent-bg)' }}
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="flex-1"
                      placeholder="#ff6b35"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    اللون الثانوي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                      style={{ borderColor: 'var(--accent-bg)' }}
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="flex-1"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-primary text-xl py-4 px-8 neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>💾</span>
                    <span>حفظ الإعدادات</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Component
const NotificationsCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications(); // Refresh
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      case 'REMINDER': return '⏰';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-600';
      case 'WARNING': return 'text-orange-600';
      case 'ERROR': return 'text-red-600';
      case 'REMINDER': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 rounded-full hover:bg-opacity-10 hover:bg-white transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto card-modern border shadow-lg z-50">
          <div className="p-4 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              الإشعارات ({unreadCount} غير مقروءة)
            </h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-4xl block mb-2">📭</span>
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer hover:bg-opacity-5 hover:bg-white transition-colors ${
                    !notification.is_read ? 'bg-blue-50 bg-opacity-10' : ''
                  }`}
                  style={{ borderColor: 'var(--accent-bg)' }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 text-center border-t" style={{ borderColor: 'var(--accent-bg)' }}>
              <button 
                onClick={() => {
                  // Mark all as read
                  notifications.filter(n => !n.is_read).forEach(n => markAsRead(n.id));
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Medical Rep Dashboard with Stock Display
const MedicalRepDashboard = ({ stats, user }) => {
  const [stockData, setStockData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [stockError, setStockError] = useState('');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/stock/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStockData(response.data.stock_items || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setStockError('فشل في تحميل بيانات المخزون');
    } finally {
      setLoadingStock(false);
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'text-green-600';
      case 'low_stock': return 'text-yellow-600';
      case 'out_of_stock': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return '✅';
      case 'low_stock': return '⚠️';
      case 'out_of_stock': return '❌';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.total_visits || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي الزيارات</div>
            </div>
            <div className="text-3xl">🏥</div>
          </div>
        </div>
        
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.total_orders || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي الطلبات</div>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>
        
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.total_doctors || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>الأطباء المسجلين</div>
            </div>
            <div className="text-3xl">👨‍⚕️</div>
          </div>
        </div>
        
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stockData.length || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>المنتجات المتاحة</div>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Stock Display */}
      <div className="glass-effect p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📦</span>
          حالة المخزون
        </h3>
        
        {loadingStock ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">جاري تحميل بيانات المخزون...</p>
          </div>
        ) : stockError ? (
          <div className="text-center py-8 text-red-500">
            <p>{stockError}</p>
            <button 
              onClick={fetchStockData}
              className="btn-primary mt-4"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : stockData.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            <p>لا توجد بيانات مخزون متاحة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stock Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-lg font-bold text-green-800">
                  {stockData.filter(item => item.status === 'in_stock').length}
                </div>
                <div className="text-sm text-green-600">متوفر</div>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <div className="text-lg font-bold text-yellow-800">
                  {stockData.filter(item => item.current_stock > 0 && item.current_stock < 10).length}
                </div>
                <div className="text-sm text-yellow-600">مخزون منخفض</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <div className="text-lg font-bold text-red-800">
                  {stockData.filter(item => item.status === 'out_of_stock').length}
                </div>
                <div className="text-sm text-red-600">غير متوفر</div>
              </div>
            </div>

            {/* Stock Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockData.map((item, index) => (
                <div key={index} className="bg-white bg-opacity-5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{item.product_name}</h4>
                    <span className={`text-lg ${getStockStatusColor(item.status)}`}>
                      {getStockStatusIcon(item.status)}
                    </span>
                  </div>
                  
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div>المخزن: {item.warehouse_name}</div>
                    <div>الكمية: {item.current_stock} {item.product_unit}</div>
                    <div>السعر: {item.product_price} جنيه</div>
                  </div>
                  
                  <div className="mt-2">
                    <div className={`inline-block px-2 py-1 rounded text-xs ${
                      item.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'in_stock' ? 'متوفر' :
                       item.status === 'low_stock' ? 'مخزون منخفض' : 'غير متوفر'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Refresh Button */}
            <div className="text-center mt-6">
              <button 
                onClick={fetchStockData}
                className="btn-secondary"
              >
                <span className="text-lg mr-2">🔄</span>
                تحديث بيانات المخزون
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Advanced Analytics Dashboard Component
const AdvancedAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('performance'); // performance, kpis
  const [timeRange, setTimeRange] = useState('week');
  const [userFilter, setUserFilter] = useState('');
  const [kpiType, setKpiType] = useState('sales_performance');
  
  // Data states
  const [performanceData, setPerformanceData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  
  const { language } = useLanguage();

  useEffect(() => {
    if (activeView === 'performance') {
      fetchPerformanceDashboard();
    } else {
      fetchKPIMetrics();
    }
  }, [activeView, timeRange, userFilter, kpiType]);

  const fetchPerformanceDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        time_range: timeRange,
        ...(userFilter && { user_filter: userFilter })
      });

      const response = await axios.get(`${API}/analytics/performance-dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPerformanceData(response.data);
    } catch (error) {
      setError('خطأ في تحميل بيانات الأداء');
      console.error('Performance dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        kpi_type: kpiType,
        period: timeRange
      });

      const response = await axios.get(`${API}/analytics/kpi-metrics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setKpiData(response.data);
    } catch (error) {
      setError('خطأ في تحميل مؤشرات الأداء');
      console.error('KPI metrics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-400';
    if (growth < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '📊';
  };

  const getKPIStatusColor = (status) => {
    const colors = {
      'excellent': 'bg-green-500 bg-opacity-20 text-green-400 border-green-500',
      'good': 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500',
      'average': 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500',
      'needs_improvement': 'bg-red-500 bg-opacity-20 text-red-400 border-red-500',
      'no_data': 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500'
    };
    return colors[status] || colors.no_data;
  };

  const getKPIStatusText = (status) => {
    const texts = {
      'excellent': 'ممتاز',
      'good': 'جيد',
      'average': 'متوسط',
      'needs_improvement': 'يحتاج تحسين',
      'no_data': 'لا توجد بيانات'
    };
    return texts[status] || texts.no_data;
  };

  const MetricCard = ({ title, value, unit, growth, icon, description }) => (
    <div className="glass-effect p-6 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <div className={`text-sm font-medium ${getGrowthColor(growth)}`}>
          {getGrowthIcon(growth)} {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
        </div>
      </div>
      <div className="mb-2">
        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {value.toLocaleString()}{unit}
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </div>
      </div>
      {description && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </div>
      )}
    </div>
  );

  const KPICard = ({ title, data }) => (
    <div className={`p-6 rounded-xl border-2 ${getKPIStatusColor(data.status)}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getKPIStatusColor(data.status)}`}>
          {getKPIStatusText(data.status)}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {data.value}{data.unit}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            الهدف: {data.target}{data.unit}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              data.status === 'excellent' ? 'bg-green-500' :
              data.status === 'good' ? 'bg-blue-500' :
              data.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, data.achievement)}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>التحقيق: {data.achievement}%</span>
          <span className={`font-medium ${
            data.trend === 'up' ? 'text-green-400' :
            data.trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {data.trend === 'up' ? '↗️' : data.trend === 'down' ? '↘️' : '➡️'} {data.trend}
          </span>
        </div>
        
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {data.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gradient">📊 لوحة التحليلات المتقدمة</h2>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 glass-effect border border-white border-opacity-20 rounded-lg text-white"
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذا العام</option>
          </select>
          
          {activeView === 'performance' && (
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-2 glass-effect border border-white border-opacity-20 rounded-lg text-white"
            >
              <option value="">جميع المستخدمين</option>
              <option value="sales_rep">مناديب المبيعات</option>
              <option value="manager">المدراء</option>
              <option value="warehouse_manager">مدراء المخازن</option>
            </select>
          )}
          
          {activeView === 'kpis' && (
            <select
              value={kpiType}
              onChange={(e) => setKpiType(e.target.value)}
              className="px-4 py-2 glass-effect border border-white border-opacity-20 rounded-lg text-white"
            >
              <option value="sales_performance">أداء المبيعات</option>
              <option value="team_efficiency">كفاءة الفريق</option>
              <option value="customer_satisfaction">رضا العملاء</option>
            </select>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="glass-effect p-2 rounded-xl inline-flex">
        <button
          onClick={() => setActiveView('performance')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'performance'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          📈 لوحة الأداء
        </button>
        <button
          onClick={() => setActiveView('kpis')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'kpis'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          🎯 مؤشرات الأداء
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-effect p-6 rounded-xl animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 bg-gray-600 rounded"></div>
                  <div className="w-16 h-4 bg-gray-600 rounded"></div>
                </div>
                <div className="w-24 h-8 bg-gray-600 rounded"></div>
                <div className="w-32 h-4 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Performance Dashboard View */}
          {activeView === 'performance' && performanceData && (
            <div className="space-y-8">
              {/* Core Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="إجمالي الزيارات"
                  value={performanceData.core_metrics.visits.current}
                  unit=""
                  growth={performanceData.core_metrics.visits.growth}
                  icon="🚗"
                  description="مقارنة بالفترة السابقة"
                />
                <MetricCard
                  title="الزيارات الفعالة"
                  value={performanceData.core_metrics.effective_visits.current}
                  unit=""
                  growth={performanceData.core_metrics.effective_visits.growth}
                  icon="✅"
                  description="زيارات حققت نتائج إيجابية"
                />
                <MetricCard
                  title="إجمالي الطلبات"
                  value={performanceData.core_metrics.orders.current}
                  unit=""
                  growth={performanceData.core_metrics.orders.growth}
                  icon="📦"
                  description="طلبات تم إنشاؤها"
                />
                <MetricCard
                  title="معدل التحويل"
                  value={performanceData.core_metrics.conversion_rate.current}
                  unit="%"
                  growth={performanceData.core_metrics.conversion_rate.growth}
                  icon="🎯"
                  description="معدل نجاح الزيارات"
                />
              </div>

              {/* Top Performers */}
              {performanceData.top_performers.length > 0 && (
                <div className="glass-effect p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>🏆</span>
                    <span>أفضل المؤدين</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {performanceData.top_performers.map((performer, index) => (
                      <div key={index} className="p-4 bg-white bg-opacity-5 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {performer.user_info.full_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              @{performer.user_info.username}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>إجمالي الزيارات:</span>
                            <span className="font-medium text-blue-400">{performer.total_visits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>الزيارات الفعالة:</span>
                            <span className="font-medium text-green-400">{performer.effective_visits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>معدل الفعالية:</span>
                            <span className="font-medium text-purple-400">{performer.effectiveness_rate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Trends Chart */}
              {performanceData.daily_trends.length > 0 && (
                <div className="glass-effect p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>📈</span>
                    <span>اتجاهات الأداء اليومية</span>
                  </h3>
                  <div className="space-y-4">
                    {performanceData.daily_trends.slice(-7).map((day, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-white bg-opacity-5 rounded-lg">
                        <div className="w-24 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-400">🚗 {day.visits}</span>
                            <span className="text-green-400">✅ {day.effective_visits}</span>
                            <span className="text-purple-400">📦 {day.orders}</span>
                            <span className="text-yellow-400">🎯 {day.effectiveness_rate.toFixed(1)}%</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, day.effectiveness_rate)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Summary */}
              {performanceData.team_summary.length > 0 && (
                <div className="glass-effect p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>👥</span>
                    <span>ملخص الفرق</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {performanceData.team_summary.map((team, index) => (
                      <div key={index} className="p-4 bg-white bg-opacity-5 rounded-lg">
                        <div className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                          {team.manager_name}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>حجم الفريق:</span>
                            <span className="font-medium">{team.team_size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>إجمالي الزيارات:</span>
                            <span className="font-medium text-blue-400">{team.total_visits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>الزيارات الفعالة:</span>
                            <span className="font-medium text-green-400">{team.effective_visits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>معدل الفعالية:</span>
                            <span className="font-medium text-purple-400">{team.effectiveness_rate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {performanceData.insights && (
                <div className="glass-effect p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>💡</span>
                    <span>رؤى ذكية</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
                      <div className="text-2xl mb-2">🌟</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>أفضل يوم أداء</div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {performanceData.insights.best_performing_day ? 
                          new Date(performanceData.insights.best_performing_day).toLocaleDateString('ar-EG') : 
                          'غير متاح'
                        }
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg">
                      <div className="text-2xl mb-2">👥</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>عدد المؤدين الفريدين</div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {performanceData.insights.total_unique_performers}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-500 bg-opacity-20 rounded-lg">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>متوسط الفعالية</div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {performanceData.insights.average_effectiveness}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPIs Dashboard View */}
          {activeView === 'kpis' && kpiData && (
            <div className="space-y-8">
              {/* KPI Summary */}
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">ملخص مؤشرات الأداء</h3>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      kpiData.summary.overall_performance === 'excellent' 
                        ? 'bg-green-500 bg-opacity-20 text-green-400'
                        : 'bg-blue-500 bg-opacity-20 text-blue-400'
                    }`}>
                      الأداء العام: {kpiData.summary.overall_performance === 'excellent' ? 'ممتاز' : 'جيد'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white bg-opacity-5 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{kpiData.summary.total_kpis}</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي المؤشرات</div>
                  </div>
                  <div className="text-center p-4 bg-white bg-opacity-5 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{kpiData.summary.excellent_kpis}</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مؤشرات ممتازة</div>
                  </div>
                  <div className="text-center p-4 bg-white bg-opacity-5 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{kpiData.summary.needs_improvement}</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>تحتاج تحسين</div>
                  </div>
                  <div className="text-center p-4 bg-white bg-opacity-5 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {new Date(kpiData.generated_at).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>آخر تحديث</div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(kpiData.metrics).map(([key, data]) => (
                  <KPICard
                    key={key}
                    title={data.description}
                    data={data}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Enhanced Admin Statistics Dashboard
const AdminStatsDashboard = () => {
  const [stats, setStats] = useState({});
  const [weeklyComparison, setWeeklyComparison] = useState({});
  const [monthlyComparison, setMonthlyComparison] = useState({});
  const [activeManagers, setActiveManagers] = useState([]);
  const [activeSalesReps, setActiveSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancedStats();
  }, []);

  const fetchEnhancedStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all stats in parallel
      const [statsRes, usersRes, visitsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/visits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats(statsRes.data);
      
      // Calculate manager and sales rep statistics
      const users = usersRes.data;
      const visits = visitsRes.data;
      const orders = ordersRes.data || [];
      
      const managers = users.filter(u => u.role === 'manager');
      const salesReps = users.filter(u => u.role === 'sales_rep');
      
      // Enhanced manager stats
      const managerStats = managers.map(manager => {
        const managedReps = salesReps.filter(rep => rep.manager_id === manager.id);
        const managerOrders = orders.filter(order => 
          order.approved_by === manager.id || 
          managedReps.some(rep => rep.id === order.sales_rep_id)
        );
        const approvedOrders = managerOrders.filter(order => order.status === 'APPROVED');
        const teamVisits = visits.filter(visit => 
          managedReps.some(rep => rep.id === visit.sales_rep_id)
        );

        return {
          ...manager,
          team_size: managedReps.length,
          total_orders_managed: managerOrders.length,
          approved_orders: approvedOrders.length,
          approval_rate: managerOrders.length > 0 ? (approvedOrders.length / managerOrders.length * 100).toFixed(1) : 0,
          team_visits: teamVisits.length,
          is_active: teamVisits.some(visit => {
            const visitDate = new Date(visit.created_at);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return visitDate > oneWeekAgo;
          })
        };
      });

      // Enhanced sales rep stats
      const salesRepStats = salesReps.map(rep => {
        const repVisits = visits.filter(visit => visit.sales_rep_id === rep.id);
        const repOrders = orders.filter(order => order.sales_rep_id === rep.id);
        const thisWeekVisits = repVisits.filter(visit => {
          const visitDate = new Date(visit.created_at);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return visitDate > oneWeekAgo;
        });

        return {
          ...rep,
          total_visits: repVisits.length,
          total_orders: repOrders.length,
          this_week_visits: thisWeekVisits.length,
          is_active: thisWeekVisits.length > 0,
          last_visit: repVisits.length > 0 ? repVisits[repVisits.length - 1].created_at : null
        };
      });

      setActiveManagers(managerStats);
      setActiveSalesReps(salesRepStats);
      
    } catch (error) {
      console.error('Error fetching enhanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 loading-shimmer rounded-full ml-4"></div>
          <div>
            <div className="w-48 h-8 loading-shimmer rounded mb-2"></div>
            <div className="w-64 h-4 loading-shimmer rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="loading-shimmer h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-gradient">إحصائيات النظام الشاملة</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            نظرة شاملة على أداء النظام والفرق
          </p>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(stats).map(([key, value]) => {
          const statConfig = {
            total_users: { title: 'إجمالي المستخدمين', icon: '👥', color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
            total_clinics: { title: 'إجمالي العيادات', icon: '🏥', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-500 to-green-600' },
            total_doctors: { title: 'إجمالي الأطباء', icon: '⚕️', color: 'text-purple-600', bg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
            total_visits: { title: 'إجمالي الزيارات', icon: '📋', color: 'text-indigo-600', bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
            total_products: { title: 'إجمالي المنتجات', icon: '📦', color: 'text-yellow-600', bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
            total_warehouses: { title: 'إجمالي المخازن', icon: '🏭', color: 'text-pink-600', bg: 'bg-gradient-to-r from-pink-500 to-pink-600' },
            today_visits: { title: 'زيارات اليوم', icon: '📅', color: 'text-emerald-600', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
            pending_reviews: { title: 'مراجعات معلقة', icon: '⏳', color: 'text-orange-600', bg: 'bg-gradient-to-r from-orange-500 to-orange-600' }
          };
          
          const config = statConfig[key] || { title: key, icon: '📊', color: 'text-gray-600', bg: 'bg-gradient-to-r from-gray-500 to-gray-600' };
          
          return (
            <div key={key} className="card-modern p-6 interactive-element hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className={`w-14 h-14 ${config.bg} rounded-full flex items-center justify-center ml-4 shadow-lg`}>
                  <span className="text-2xl text-white">{config.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                  </h3>
                  <p className={`text-3xl font-bold ${config.color}`}>{value}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${config.bg} h-2 rounded-full`} style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Managers Performance Section */}
      <div className="card-modern p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">👔</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>أداء المديرين</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>إحصائيات مفصلة عن أداء فريق الإدارة</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeManagers.map((manager) => (
            <div key={manager.id} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${manager.is_active ? 'bg-green-500' : 'bg-gray-400'}`}>
                    <span className="text-white font-bold">{manager.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{manager.full_name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {manager.is_active ? '🟢 نشط' : '🔴 غير نشط'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{manager.approval_rate}%</span>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>معدل الموافقة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{manager.team_size}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>حجم الفريق</div>
                </div>
                <div className="text-center p-3 bg-green-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{manager.approved_orders}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>طلبات موافق عليها</div>
                </div>
                <div className="text-center p-3 bg-purple-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{manager.total_orders_managed}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>إجمالي الطلبات</div>
                </div>
                <div className="text-center p-3 bg-orange-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{manager.team_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>زيارات الفريق</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Reps Performance Section */}
      <div className="card-modern p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>أداء المناديب</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>المناديب النشطة والخاملة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
            <div className="text-4xl font-bold mb-2">
              {activeSalesReps.filter(rep => rep.is_active).length}
            </div>
            <div className="text-lg">مناديب نشطة</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white">
            <div className="text-4xl font-bold mb-2">
              {activeSalesReps.filter(rep => !rep.is_active).length}
            </div>
            <div className="text-lg">مناديب خاملة</div>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activeSalesReps.map((rep) => (
            <div key={rep.id} className="flex items-center justify-between p-4 glass-effect rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${rep.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                  {rep.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{rep.full_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {rep.last_visit ? `آخر زيارة: ${new Date(rep.last_visit).toLocaleDateString('ar-EG')}` : 'لا توجد زيارات'}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{rep.total_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>زيارات</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{rep.total_orders}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>طلبات</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{rep.this_week_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>هذا الأسبوع</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <span style={{ color: 'var(--text-primary)' }}>إجراءات سريعة</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn-primary p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">تقرير شامل</div>
          </button>
          <button className="btn-success p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm">إضافة مستخدم</div>
          </button>
          <button className="btn-info p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">📢</div>
            <div className="text-sm">إرسال إشعار</div>
          </button>
          <button className="btn-warning p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm">إعدادات النظام</div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Comprehensive Approvals Dashboard Component
const ApprovalsDashboard = ({ user }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('my_requests');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApprovalData();
  }, []);

  const fetchApprovalData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch my requests
      const myRequestsResponse = await axios.get(`${API}/approvals/my-requests`, { headers });
      setMyRequests(myRequestsResponse.data || []);

      // Fetch pending approvals (if user can approve)
      if (['district_manager', 'area_manager', 'line_manager', 'key_account', 'accounting', 'warehouse_keeper', 'admin', 'gm'].includes(user.role)) {
        const pendingResponse = await axios.get(`${API}/approvals/pending`, { headers });
        setPendingApprovals(pendingResponse.data || []);
      }

      // Fetch approval history (managers can see their team's history)
      if (['admin', 'gm', 'line_manager', 'area_manager', 'district_manager', 'key_account'].includes(user.role)) {
        const historyResponse = await axios.get(`${API}/approvals/history`, { headers });
        setApprovalHistory(historyResponse.data || []);
      }

    } catch (error) {
      console.error('Error fetching approval data:', error);
      setError('فشل في تحميل بيانات الموافقات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (requestId, action, notes = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/approvals/${requestId}/action`, 
        { action, notes }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchApprovalData();
      setShowRequestDetails(false);
      
    } catch (error) {
      console.error('Error processing approval:', error);
      setError('فشل في معالجة الموافقة');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في انتظار الموافقة';
      case 'approved': return 'تمت الموافقة';
      case 'rejected': return 'مرفوض';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
    }
  };

  const getRequestTypeText = (type) => {
    switch (type) {
      case 'order': return 'طلب شراء';
      case 'clinic': return 'تسجيل عيادة';
      case 'doctor': return 'تسجيل طبيب';
      case 'visit': return 'زيارة';
      case 'expense': return 'مصروف';
      default: return type;
    }
  };

  const getCurrentApprover = (request) => {
    if (request.status !== 'pending') return null;
    
    const roleNames = {
      'district_manager': 'مدير المنطقة المحلية',
      'area_manager': 'مدير المنطقة',
      'accounting': 'المحاسبة',
      'warehouse_keeper': 'أمين المخزن',
      'admin': 'الإدارة',
      'gm': 'المدير العام'
    };
    
    return roleNames[request.current_approver_role] || 'غير محدد';
  };

  const getApprovalProgress = (request) => {
    if (!request.required_levels || request.required_levels.length === 0) return 0;
    
    const completedLevels = request.approvals ? request.approvals.filter(a => a.action === 'approve').length : 0;
    return Math.round((completedLevels / request.required_levels.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">الموافقات</h1>
          <p className="text-gray-600">إدارة شاملة للموافقات والطلبات</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{myRequests.length}</div>
            <div className="text-sm text-gray-500">طلباتي</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
            <div className="text-sm text-gray-500">في انتظار موافقتي</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my_requests')}
          className={`pb-2 px-4 ${activeTab === 'my_requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          طلباتي ({myRequests.length})
        </button>
        
        {['district_manager', 'area_manager', 'line_manager', 'key_account', 'accounting', 'warehouse_keeper', 'admin', 'gm'].includes(user.role) && (
          <button
            onClick={() => setActiveTab('pending_approvals')}
            className={`pb-2 px-4 ${activeTab === 'pending_approvals' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            في انتظار موافقتي ({pendingApprovals.length})
          </button>
        )}
        
        {/* Approval History - Now available for all managers to see their team's history */}
        {['admin', 'gm', 'line_manager', 'area_manager', 'district_manager', 'key_account'].includes(user.role) && (
          <button
            onClick={() => setActiveTab('approval_history')}
            className={`pb-2 px-4 ${activeTab === 'approval_history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            سجل الموافقات ({approvalHistory.length})
          </button>
        )}
      </div>

      {/* My Requests Tab */}
      {activeTab === 'my_requests' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((request) => (
                <div key={request.id} className="glass-effect p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {request.type === 'order' ? '🛒' : 
                         request.type === 'clinic' ? '🏥' : 
                         request.type === 'doctor' ? '👨‍⚕️' : '📋'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{getRequestTypeText(request.type)}</h3>
                        <p className="text-sm text-gray-600">
                          تاريخ الطلب: {new Date(request.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">تقدم الموافقة</span>
                      <span className="text-sm font-medium">{getApprovalProgress(request)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getApprovalProgress(request)}%` }}
                      ></div>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">منتظر موافقة:</span> {getCurrentApprover(request)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      ID: {request.id.slice(0, 8)}...
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRequestDetails(true);
                      }}
                      className="btn-secondary text-sm"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'pending_approvals' && (
        <div className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">✅</div>
              <p>لا توجد موافقات في انتظارك</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingApprovals.map((request) => (
                <div key={request.id} className="glass-effect p-6 rounded-xl border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {request.type === 'order' ? '🛒' : 
                         request.type === 'clinic' ? '🏥' : 
                         request.type === 'doctor' ? '👨‍⚕️' : '📋'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{getRequestTypeText(request.type)}</h3>
                        <p className="text-sm text-gray-600">
                          بواسطة: {request.requester_name || 'غير محدد'}
                        </p>
                        <p className="text-sm text-gray-600">
                          تاريخ الطلب: {new Date(request.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        في انتظار موافقتك
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      ID: {request.id.slice(0, 8)}...
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprovalAction(request.id, 'approve')}
                        disabled={actionLoading}
                        className="btn-primary text-sm"
                      >
                        {actionLoading ? 'جاري المعالجة...' : 'موافق'}
                      </button>
                      <button 
                        onClick={() => handleApprovalAction(request.id, 'reject')}
                        disabled={actionLoading}
                        className="btn-danger text-sm"
                      >
                        رفض
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestDetails(true);
                        }}
                        className="btn-secondary text-sm"
                      >
                        التفاصيل
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval History Tab */}
      {activeTab === 'approval_history' && ['admin', 'gm'].includes(user.role) && (
        <div className="space-y-4">
          {approvalHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📜</div>
              <p>لا يوجد سجل موافقات</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {approvalHistory.map((request) => (
                <div key={request.id} className="glass-effect p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {request.type === 'order' ? '🛒' : 
                         request.type === 'clinic' ? '🏥' : 
                         request.type === 'doctor' ? '👨‍⚕️' : '📋'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{getRequestTypeText(request.type)}</h3>
                        <p className="text-sm text-gray-600">بواسطة: {request.requester_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>

                  {request.approvals && request.approvals.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">سجل الموافقات:</h4>
                      {request.approvals.map((approval, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{approval.approver_name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            approval.action === 'approve' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {approval.action === 'approve' ? 'وافق' : 'رفض'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(approval.timestamp).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">تفاصيل الطلب</h3>
                <button 
                  onClick={() => setShowRequestDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع الطلب</label>
                  <p className="text-sm text-gray-900">{getRequestTypeText(selectedRequest.type)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">الحالة</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusText(selectedRequest.status)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ الطلب</label>
                  <p className="text-sm text-gray-900">{new Date(selectedRequest.created_at).toLocaleString('ar-EG')}</p>
                </div>
                
                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                    <p className="text-sm text-gray-900">{selectedRequest.notes}</p>
                  </div>
                )}
                
                {selectedRequest.entity_data && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">بيانات الطلب</label>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                      {JSON.stringify(selectedRequest.entity_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Visits Log Component
const EnhancedVisitsLog = () => {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    effectiveness: 'all',
    date_from: '',
    date_to: '',
    sales_rep: 'all',
    clinic: 'all'
  });
  const [stats, setStats] = useState({});
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📋 Comprehensive Visits Log",
      subtitle: "Complete log of all visits by sales reps and managers",
      search: "Search visits...",
      filterByStatus: "Filter by Status",
      filterByEffectiveness: "Filter by Effectiveness", 
      filterBySalesRep: "Filter by Sales Rep",
      filterByClinic: "Filter by Clinic",
      fromDate: "From Date",
      toDate: "To Date",
      allStatuses: "All Statuses",
      allEffectiveness: "All Effectiveness",
      allSalesReps: "All Sales Reps", 
      allClinics: "All Clinics",
      completed: "Completed",
      pending: "Pending Review",
      missed: "Missed",
      effective: "Effective",
      ineffective: "Ineffective",
      notEvaluated: "Not Evaluated",
      visitTime: "Visit Time",
      visitGoals: "Visit Goals",
      clinic: "Clinic",
      location: "Location",
      status: "Status",
      details: "Details",
      totalVisits: "Total Visits",
      effectiveVisits: "Effective Visits",
      withVoiceNotes: "With Voice Notes",
      withOrders: "With Orders"
    },
    ar: {
      title: "📋 سجل الزيارات الشامل",
      subtitle: "سجل كامل لجميع الزيارات التي تمت عن طريق المناديب والمديرين",
      search: "بحث في الزيارات...",
      filterByStatus: "فلترة بالحالة",
      filterByEffectiveness: "فلترة بالفعالية",
      filterBySalesRep: "فلترة بالمندوب", 
      filterByClinic: "فلترة بالعيادة",
      fromDate: "من تاريخ",
      toDate: "إلى تاريخ",
      allStatuses: "جميع الحالات",
      allEffectiveness: "جميع مستويات الفعالية",
      allSalesReps: "جميع المناديب",
      allClinics: "جميع العيادات",
      completed: "تمت",
      pending: "في انتظار المراجعة",
      missed: "تخلف عن الزيارة",
      effective: "فعالة",
      ineffective: "غير فعالة", 
      notEvaluated: "لم يتم التقييم",
      visitTime: "وقت الزيارة",
      visitGoals: "أهداف الزيارة",
      clinic: "العيادة",
      location: "المكان",
      status: "الحالة",
      details: "التفاصيل",
      totalVisits: "إجمالي الزيارات",
      effectiveVisits: "زيارات فعالة",
      withVoiceNotes: "بملاحظات صوتية",
      withOrders: "بطلبات"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchVisits();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [visits, filters]);

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits/comprehensive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data.visits || []);
      setStats(response.data.stats || {});
    } catch (error) {
      // Mock comprehensive data
      const mockVisits = [
        {
          id: 1,
          visit_date: '2024-01-24T10:30:00Z',
          clinic_name: language === 'ar' ? 'عيادة النور' : 'Al Nour Clinic',
          doctor_name: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
          sales_rep_name: language === 'ar' ? 'محمود علي' : 'Mahmoud Ali',
          visit_goals: language === 'ar' ? 'تقديم منتجات جديدة، متابعة العملاء' : 'Present new products, follow up clients',
          location: language === 'ar' ? 'شارع الجمهورية، المنصورة' : 'Gomhoria Street, Mansoura',
          status: 'completed',
          effectiveness: true,
          has_voice_notes: true,
          has_orders: true,
          notes: language === 'ar' ? 'زيارة ناجحة مع طلب منتجات جديدة' : 'Successful visit with new product orders',
          duration_minutes: 45,
          created_at: '2024-01-24T10:30:00Z'
        },
        {
          id: 2,
          visit_date: '2024-01-24T14:15:00Z',
          clinic_name: language === 'ar' ? 'عيادة الشفاء' : 'Al Shifa Clinic',
          doctor_name: language === 'ar' ? 'د. فاطمة علي' : 'Dr. Fatema Ali',
          sales_rep_name: language === 'ar' ? 'أحمد حسن' : 'Ahmed Hassan',
          visit_goals: language === 'ar' ? 'متابعة طلبية سابقة، تقديم عروض' : 'Follow up previous order, present offers',
          location: language === 'ar' ? 'شارع المحطة، المنصورة' : 'Station Street, Mansoura',
          status: 'pending',
          effectiveness: null,
          has_voice_notes: false,
          has_orders: false,
          notes: language === 'ar' ? 'تحتاج متابعة إضافية' : 'Needs additional follow-up',
          duration_minutes: 30,
          created_at: '2024-01-24T14:15:00Z'
        },
        {
          id: 3,
          visit_date: '2024-01-23T09:00:00Z',
          clinic_name: language === 'ar' ? 'عيادة الأمل' : 'Al Amal Clinic',
          doctor_name: language === 'ar' ? 'د. محمد إبراهيم' : 'Dr. Mohamed Ibrahim',
          sales_rep_name: language === 'ar' ? 'فاطمة محمد' : 'Fatema Mohamed',
          visit_goals: language === 'ar' ? 'زيارة تعريفية أولى' : 'Initial introduction visit',
          location: language === 'ar' ? 'شارع سعد زغلول، المنصورة' : 'Saad Zaghloul Street, Mansoura',
          status: 'missed',
          effectiveness: false,
          has_voice_notes: true,
          has_orders: false,
          notes: language === 'ar' ? 'لم يتواجد الطبيب في العيادة' : 'Doctor was not available at clinic',
          duration_minutes: 0,
          created_at: '2024-01-23T09:00:00Z'
        }
      ];

      setVisits(mockVisits);
      setStats({
        total_visits: mockVisits.length,
        effective_visits: mockVisits.filter(v => v.effectiveness === true).length,
        with_voice_notes: mockVisits.filter(v => v.has_voice_notes).length,
        with_orders: mockVisits.filter(v => v.has_orders).length
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = visits.filter(visit => {
      const matchesSearch = 
        visit.clinic_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        visit.doctor_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        visit.sales_rep_name.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || visit.status === filters.status;
      
      const matchesEffectiveness = 
        filters.effectiveness === 'all' ||
        (filters.effectiveness === 'effective' && visit.effectiveness === true) ||
        (filters.effectiveness === 'ineffective' && visit.effectiveness === false) ||
        (filters.effectiveness === 'not_evaluated' && visit.effectiveness === null);
      
      const matchesSalesRep = filters.sales_rep === 'all' || visit.sales_rep_name === filters.sales_rep;
      const matchesClinic = filters.clinic === 'all' || visit.clinic_name === filters.clinic;
      
      const matchesDateFrom = !filters.date_from || new Date(visit.visit_date) >= new Date(filters.date_from);
      const matchesDateTo = !filters.date_to || new Date(visit.visit_date) <= new Date(filters.date_to);

      return matchesSearch && matchesStatus && matchesEffectiveness && 
             matchesSalesRep && matchesClinic && matchesDateFrom && matchesDateTo;
    });
    
    setFilteredVisits(filtered);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { text: t.completed, color: 'text-green-600', bg: 'bg-green-100' };
      case 'pending':
        return { text: t.pending, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'missed':
        return { text: t.missed, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getEffectivenessInfo = (effectiveness) => {
    if (effectiveness === true) return { text: t.effective, color: 'text-green-600', bg: 'bg-green-100' };
    if (effectiveness === false) return { text: t.ineffective, color: 'text-red-600', bg: 'bg-red-100' };
    return { text: t.notEvaluated, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const openVisitDetails = (visit) => {
    setSelectedVisit(visit);
    setShowVisitDetails(true);
  };

  // Get unique values for filters
  const uniqueSalesReps = [...new Set(visits.map(v => v.sales_rep_name))];
  const uniqueClinics = [...new Set(visits.map(v => v.clinic_name))];

  return (
    <>
      <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-16 h-16 card-gradient-green rounded-full flex items-center justify-center ml-4 glow-pulse">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gradient">{t.title}</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_visits || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.totalVisits}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.effective_visits || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.effectiveVisits}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.with_voice_notes || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.withVoiceNotes}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.with_orders || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.withOrders}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card-modern p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">{t.search}:</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder={t.search}
                  className="form-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.filterByStatus}:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="form-modern w-full"
                >
                  <option value="all">{t.allStatuses}</option>
                  <option value="completed">{t.completed}</option>
                  <option value="pending">{t.pending}</option>
                  <option value="missed">{t.missed}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.filterByEffectiveness}:</label>
                <select
                  value={filters.effectiveness}
                  onChange={(e) => setFilters({...filters, effectiveness: e.target.value})}
                  className="form-modern w-full"
                >
                  <option value="all">{t.allEffectiveness}</option>
                  <option value="effective">{t.effective}</option>
                  <option value="ineffective">{t.ineffective}</option>
                  <option value="not_evaluated">{t.notEvaluated}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.filterBySalesRep}:</label>
                <select
                  value={filters.sales_rep}
                  onChange={(e) => setFilters({...filters, sales_rep: e.target.value})}
                  className="form-modern w-full"
                >
                  <option value="all">{t.allSalesReps}</option>
                  {uniqueSalesReps.map((rep) => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.fromDate}:</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                  className="form-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.toDate}:</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                  className="form-modern w-full"
                />
              </div>
            </div>
          </div>

          {/* Visits Table */}
          <div className="card-modern overflow-hidden">
            <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
              <h3 className="text-xl font-bold flex items-center gap-3">
                <span>📊</span>
                <span>{t.title} ({filteredVisits.length})</span>
              </h3>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </p>
              </div>
            ) : (
              <div className="table-modern">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.visitTime}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.clinic}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{language === 'ar' ? 'الطبيب' : 'Doctor'}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{language === 'ar' ? 'المندوب' : 'Sales Rep'}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.visitGoals}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.location}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.status}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{language === 'ar' ? 'الفعالية' : 'Effectiveness'}</th>
                      <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.details}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisits.map((visit) => {
                      const status = getStatusInfo(visit.status);
                      const effectiveness = getEffectivenessInfo(visit.effectiveness);
                      
                      return (
                        <tr key={visit.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">
                                {new Date(visit.visit_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                              </div>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(visit.visit_date).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {visit.duration_minutes > 0 && (
                                <div className="text-xs text-blue-600">
                                  {visit.duration_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{visit.clinic_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{visit.doctor_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{visit.sales_rep_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm max-w-xs truncate" title={visit.visit_goals}>
                              {visit.visit_goals}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm max-w-xs truncate" title={visit.location}>
                              📍 {visit.location}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${effectiveness.bg} ${effectiveness.color}`}>
                              {effectiveness.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openVisitDetails(visit)}
                                className="btn-info text-xs px-3 py-1"
                                title={t.details}
                              >
                                👁️ {t.details}
                              </button>
                              {visit.has_voice_notes && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                  🎤
                                </span>
                              )}
                              {visit.has_orders && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                  📦
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visit Details Modal */}
      {showVisitDetails && selectedVisit && (
        <VisitDetailsModal
          visit={selectedVisit}
          language={language}
          onClose={() => setShowVisitDetails(false)}
        />
      )}
    </>
  );
};

// Visit Details Modal Component
const VisitDetailsModal = ({ visit, language, onClose }) => {
  const t = language === 'ar' ? {
    visitDetails: 'تفاصيل الزيارة',
    basicInfo: 'المعلومات الأساسية',
    visitTime: 'وقت الزيارة',
    duration: 'مدة الزيارة',
    clinic: 'العيادة',
    doctor: 'الطبيب',
    salesRep: 'المندوب',
    location: 'الموقع',
    goals: 'أهداف الزيارة',
    status: 'حالة الزيارة',
    effectiveness: 'فعالية الزيارة',
    notes: 'الملاحظات',
    voiceNotes: 'ملاحظات صوتية',
    orders: 'الطلبات',
    close: 'إغلاق',
    minutes: 'دقيقة',
    available: 'متاح',
    notAvailable: 'غير متاح'
  } : {
    visitDetails: 'Visit Details',
    basicInfo: 'Basic Information',
    visitTime: 'Visit Time',
    duration: 'Duration',
    clinic: 'Clinic',
    doctor: 'Doctor',
    salesRep: 'Sales Rep',
    location: 'Location',
    goals: 'Visit Goals',
    status: 'Visit Status',
    effectiveness: 'Effectiveness',
    notes: 'Notes',
    voiceNotes: 'Voice Notes',
    orders: 'Orders',
    close: 'Close',
    minutes: 'minutes',
    available: 'Available',
    notAvailable: 'Not Available'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">{t.visitDetails}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>ℹ️</span>
              <span>{t.basicInfo}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-500">{t.visitTime}</label>
                <p className="text-lg font-medium">
                  {new Date(visit.visit_date).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.duration}</label>
                <p className="text-lg font-medium">
                  {visit.duration_minutes} {t.minutes}
                </p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.clinic}</label>
                <p className="text-lg font-medium">{visit.clinic_name}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.doctor}</label>
                <p className="text-lg font-medium">{visit.doctor_name}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.salesRep}</label>
                <p className="text-lg font-medium">{visit.sales_rep_name}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">{t.location}</label>
                <p className="text-lg font-medium">📍 {visit.location}</p>
              </div>
            </div>
          </div>

          {/* Visit Goals and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🎯</span>
                <span>{t.goals}</span>
              </h4>
              <p className="text-gray-700">{visit.visit_goals}</p>
            </div>
            
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>{t.status} & {t.effectiveness}</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-gray-500">{t.status}</label>
                  <p className={`text-lg font-medium ${
                    visit.status === 'completed' ? 'text-green-600' :
                    visit.status === 'pending' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {visit.status === 'completed' ? (language === 'ar' ? 'تمت' : 'Completed') :
                     visit.status === 'pending' ? (language === 'ar' ? 'في انتظار المراجعة' : 'Pending Review') :
                     (language === 'ar' ? 'تخلف عن الزيارة' : 'Missed')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">{t.effectiveness}</label>
                  <p className={`text-lg font-medium ${
                    visit.effectiveness === true ? 'text-green-600' :
                    visit.effectiveness === false ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {visit.effectiveness === true ? (language === 'ar' ? '✅ فعالة' : '✅ Effective') :
                     visit.effectiveness === false ? (language === 'ar' ? '❌ غير فعالة' : '❌ Ineffective') :
                     (language === 'ar' ? '⏳ لم يتم التقييم' : '⏳ Not Evaluated')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Media */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📝</span>
              <span>{t.notes}</span>
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {visit.notes || (language === 'ar' ? 'لا توجد ملاحظات' : 'No notes available')}
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span>🎤</span>
                  <span className="text-sm font-medium">{t.voiceNotes}:</span>
                  <span className={`text-sm ${visit.has_voice_notes ? 'text-green-600' : 'text-gray-500'}`}>
                    {visit.has_voice_notes ? t.available : t.notAvailable}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span className="text-sm font-medium">{t.orders}:</span>
                  <span className={`text-sm ${visit.has_orders ? 'text-green-600' : 'text-gray-500'}`}>
                    {visit.has_orders ? t.available : t.notAvailable}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-3"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Statistics Dashboard Component
const EnhancedStatisticsDashboard = ({ stats, user }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [comparison, setComparison] = useState({});
  const [quickActions, setQuickActions] = useState([]);
  const [filteredStats, setFilteredStats] = useState(stats);
  const [loading, setLoading] = useState(false);
  const { analytics, loading: analyticsLoading } = useRealTimeAnalytics();
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📊 Comprehensive Statistics Dashboard",
      subtitle: "Complete overview of system and team performance",
      today: "Today",
      week: "Week", 
      month: "Month",
      quarter: "Quarter",
      live: "Live",
      quickActions: "⚡ Quick Actions",
      liveStats: "🔴 Live Statistics",
      updatesEvery30: "(Updates every 30 seconds)",
      visitsToday: "Visits Today",
      activeSalesReps: "Active Sales Reps",
      pendingOrders: "Pending Orders",
      totalUsers: "Total Users",
      totalClinics: "Total Clinics",
      totalVisits: "Total Visits",
      totalWarehouses: "Total Warehouses",
      lowStockItems: "Low Stock Items",
      todayVisits: "Today's Visits",
      lastUpdated: "Last updated:"
    },
    ar: {
      title: "📊 لوحة الإحصائيات الشاملة",
      subtitle: "نظرة شاملة على أداء النظام والفريق",
      today: "اليوم",
      week: "الأسبوع",
      month: "الشهر", 
      quarter: "الربع",
      live: "مباشر",
      quickActions: "⚡ إجراءات سريعة",
      liveStats: "🔴 الإحصائيات المباشرة",
      updatesEvery30: "(يتم التحديث كل 30 ثانية)",
      visitsToday: "زيارات اليوم",
      activeSalesReps: "مناديب نشطين الآن",
      pendingOrders: "طلبيات معلقة",
      totalUsers: "إجمالي المستخدمين",
      totalClinics: "إجمالي العيادات", 
      totalVisits: "إجمالي الزيارات",
      totalWarehouses: "إجمالي المخازن",
      lowStockItems: "منتجات نقص مخزون",
      todayVisits: "زيارات اليوم",
      lastUpdated: "آخر تحديث:"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchComparisonData();
    fetchQuickActions();
    applyTimeFilter();
  }, [timeRange]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      // Simulate filtered data based on timeRange
      let filtered = { ...stats };
      
      switch (timeRange) {
        case 'today':
          // Fetch today's data
          const token = localStorage.getItem('token');
          const todayResponse = await axios.get(`${API}/dashboard/stats?period=today`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = todayResponse.data;
          break;
        case 'week':
          // This week's data - default
          break;
        case 'month':
          // This month's data
          const monthResponse = await axios.get(`${API}/dashboard/stats?period=month`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = monthResponse.data;
          break;
        case 'quarter':
          // This quarter's data
          const quarterResponse = await axios.get(`${API}/dashboard/stats?period=quarter`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = quarterResponse.data;
          break;
      }
      
      setFilteredStats(filtered);
      setComparison({
        users_growth: '+12%',
        visits_growth: '+8%',
        clinics_growth: '+15%',
        revenue_growth: '+22%'
      });
    } catch (error) {
      console.error('Error fetching time-filtered data:', error);
      setFilteredStats(stats);
    } finally {
      setLoading(false);
    }
  };

  const applyTimeFilter = async () => {
    await fetchComparisonData();
  };

  const fetchQuickActions = async () => {
    const actions = [];
    if (filteredStats.pending_reviews > 0) {
      actions.push({ type: 'reviews', count: filteredStats.pending_reviews, text: language === 'ar' ? 'مراجعات تحتاج موافقة' : 'Reviews Need Approval' });
    }
    if (filteredStats.low_stock_items > 0) {
      actions.push({ type: 'stock', count: filteredStats.low_stock_items, text: language === 'ar' ? 'منتجات نقص مخزون' : 'Low Stock Items' });
    }
    if (filteredStats.pending_clinics > 0) {
      actions.push({ type: 'clinics', count: filteredStats.pending_clinics, text: language === 'ar' ? 'عيادات تحتاج موافقة' : 'Clinics Need Approval' });
    }
    setQuickActions(actions);
  };

  // Updated stats config - removed doctors and products as requested
  const statsConfig = [
    { key: 'total_users', title: t.totalUsers, icon: '👥', color: 'bg-blue-500', growth: comparison.users_growth },
    { key: 'total_clinics', title: t.totalClinics, icon: '🏥', color: 'bg-green-500', growth: comparison.clinics_growth },
    { key: 'total_visits', title: t.totalVisits, icon: '📋', color: 'bg-indigo-500', growth: comparison.visits_growth },
    { key: 'total_warehouses', title: t.totalWarehouses, icon: '🏪', color: 'bg-pink-500', growth: '+0%' },
    { key: 'today_visits', title: t.todayVisits, icon: '📅', color: 'bg-teal-500', growth: '+18%' },
    { key: 'low_stock_items', title: t.lowStockItems, icon: '⚠️', color: 'bg-red-500', isAlert: true }
  ];

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="space-y-8">
        {/* Header with Time Range Selector and Real-time Indicator */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gradient">{t.title}</h2>
              {analytics && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{t.live}</span>
                </div>
              )}
            </div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {t.subtitle} - {t.lastUpdated} {analytics?.timestamp ? new Date(analytics.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US') : language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {['today', 'week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                }}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range ? 'btn-primary' : 'btn-secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && timeRange === range ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t[range]
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Live Stats */}
        {analytics && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔴</span>
              <span>{t.liveStats}</span>
              <span className="text-sm text-green-600 animate-pulse">{t.updatesEvery30}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-effect p-4 rounded-lg border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{analytics.live_stats.visits_today}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.visitsToday}</div>
              </div>
              <div className="glass-effect p-4 rounded-lg border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{analytics.live_stats.active_sales_reps}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.activeSalesReps}</div>
              </div>
              <div className="glass-effect p-4 rounded-lg border-l-4 border-orange-500">
                <div className="text-3xl font-bold text-orange-600">{analytics.live_stats.pending_orders}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.pendingOrders}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>{t.quickActions}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className="glass-effect p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action.text}</p>
                      <p className="text-2xl font-bold text-orange-500">{action.count}</p>
                    </div>
                    <button className="btn-warning text-sm">
                      {language === 'ar' ? 'عرض' : 'View'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((config) => {
            const value = stats[config.key] || 0;
            return (
              <div key={config.key} className="card-modern p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-10 -mt-10" 
                     style={{ background: config.color.replace('bg-', '') }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {config.icon}
                    </div>
                    {config.growth && (
                      <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
                        config.isAlert ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {config.growth}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                  </h3>
                  <p className={`text-3xl font-bold ${config.isAlert ? 'text-red-500' : ''}`} 
                     style={{ color: config.isAlert ? undefined : 'var(--text-primary)' }}>
                    {value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Performance Chart */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>{language === 'ar' ? 'أداء الزيارات' : 'Visits Performance'}</span>
            </h3>
            {analytics?.chart_data ? (
              <div className="h-64">
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-600 mb-2">{language === 'ar' ? 'رسم بياني تفاعلي للأداء' : 'Interactive Performance Chart'}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {analytics.chart_data.slice(-4).map((point, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow">
                          <div className="text-sm text-gray-500">{new Date(point.date).toLocaleDateString()}</div>
                          <div className="text-lg font-bold text-blue-600">{point.visits} {language === 'ar' ? 'زيارة' : 'visits'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center glass-effect rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p style={{ color: 'var(--text-secondary)' }}>{language === 'ar' ? 'رسم بياني لأداء الزيارات' : 'Visits Performance Chart'}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    {language === 'ar' ? 'يتم تحميل البيانات...' : 'Loading data...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Recent Activity */}
          <EnhancedRecentActivity />
        </div>

        {user.role === 'admin' && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>👑</span>
              <span>{language === 'ar' ? 'إجراءات المدير' : 'Admin Actions'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdminActionButton 
                icon="📊" 
                text={language === 'ar' ? 'تصدير التقارير' : 'Export Reports'} 
                onClick={() => handleExportReports()} 
              />
              <AdminActionButton 
                icon="👥" 
                text={language === 'ar' ? 'إدارة المستخدمين' : 'User Management'} 
                onClick={() => handleUserManagement()} 
              />
              <AdminActionButton 
                icon="⚙️" 
                text={language === 'ar' ? 'إعدادات النظام' : 'System Settings'} 
                onClick={() => handleSystemSettings()} 
              />
            </div>
          </div>
        )}

        {/* Enhanced Recent Activity - Always Show */}
        <div className="mt-8">
          <EnhancedRecentActivity />
        </div>
      </div>
    </div>
  );
};

// Enhanced Recent Activity Component
const EnhancedRecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to get real activities from API first
      try {
        const response = await axios.get(`${API}/activities/recent`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.activities) {
          // Backend returns {activities: [...], total_count: N} structure
          const apiActivities = response.data.activities.map((activity, index) => ({
            id: index + 1,
            type: activity.type || 'general',
            message: language === 'ar' ? activity.title : activity.description || activity.title,
            details: activity.details || {},
            timestamp: activity.timestamp || new Date().toISOString(),
            color: activity.color || getColorForActivityType(activity.type)
          }));
          
          if (apiActivities.length > 0) {
            console.log(`✅ Loaded ${apiActivities.length} real activities from API`);
            setActivities(apiActivities);
            return;
          }
        }
      } catch (apiError) {
        console.error('Failed to load real activities from API:', apiError);
        // Fall through to mock data
      }
      
      // Fallback to mock data if API fails or returns no data
      console.log('Using mock activities data');
      setActivities([
        {
          id: 1,
          type: 'visit',
          message: language === 'ar' ? 'زيارة جديدة للدكتور أحمد من المندوب محمود' : 'New visit to Dr. Ahmed by sales rep Mahmoud',
          details: {
            doctor: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
            sales_rep: language === 'ar' ? 'محمود علي' : 'Mahmoud Ali',
            clinic: language === 'ar' ? 'عيادة النور' : 'Al Nour Clinic',
            visit_time: '10:30 AM',
            effectiveness: true
          },
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          color: 'text-green-500'
        },
        {
          id: 2,
          type: 'clinic',
          message: language === 'ar' ? 'تم إضافة عيادة جديدة من المندوب إبراهيم' : 'New clinic added by sales rep Ibrahim',
          details: {
            clinic_name: language === 'ar' ? 'عيادة الشفاء' : 'Al Shifa Clinic',
            sales_rep: language === 'ar' ? 'إبراهيم حسن' : 'Ibrahim Hassan',
            address: language === 'ar' ? 'شارع الجمهورية، المنصورة' : 'Gomhoria Street, Mansoura',
            status: 'pending_approval'
          },
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          color: 'text-blue-500'
        },
        {
          id: 3,
          type: 'order',
          message: language === 'ar' ? 'طلبية جديدة من المندوب إبراهيم تحتاج للموافقة' : 'New order from sales rep Ibrahim needs approval',
          details: {
            order_id: 'ORD-2024-001',
            sales_rep: language === 'ar' ? 'إبراهيم حسن' : 'Ibrahim Hassan',
            clinic: language === 'ar' ? 'عيادة الأمل' : 'Al Amal Clinic',
            total_amount: 2500,
            currency: 'EGP',
            items_count: 5,
            status: 'pending_manager_approval'
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          color: 'text-orange-500'
        },
        {
          id: 4,
          type: 'user',
          message: language === 'ar' ? 'تم إضافة مستخدم جديد من المدير علي' : 'New user added by manager Ali',
          details: {
            user_name: language === 'ar' ? 'خالد محمد' : 'Khaled Mohamed',
            role: 'sales_rep',
            manager: language === 'ar' ? 'علي أحمد' : 'Ali Ahmed',
            department: language === 'ar' ? 'المبيعات - المنطقة الشرقية' : 'Sales - Eastern Region',
            employee_id: 'EMP-2024-012'
          },
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          color: 'text-purple-500'
        }
      ]);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get color for activity type
  const getColorForActivityType = (type) => {
    const colorMap = {
      'visit': 'text-green-500',
      'clinic': 'text-blue-500', 
      'order': 'text-orange-500',
      'user': 'text-purple-500',
      'approval': 'text-yellow-500',
      'warehouse': 'text-indigo-500'
    };
    return colorMap[type] || 'text-gray-500';
  };

  const handleActivityClick = (activity) => {
    // Show detailed modal for activity
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const getActivityIcon = (type) => {
    const icons = {
      visit: '👨‍⚕️',
      clinic: '🏥',
      order: '📦',
      user: '👤',
      approval: '✅',
      warehouse: '🏪'
    };
    return icons[type] || '📋';
  };

  return (
    <>
      <div className="glass-effect p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🕐</span>
          <span>{language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activities'}</span>
        </h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 glass-effect rounded-lg cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all duration-300 hover:scale-102"
                onClick={() => handleActivityClick(activity)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  activity.type === 'visit' ? 'bg-green-500' :
                  activity.type === 'clinic' ? 'bg-blue-500' :
                  activity.type === 'order' ? 'bg-orange-500' : 'bg-purple-500'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {activity.message}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(activity.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <div className="text-gray-400 hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'لا توجد أنشطة حديثة' : 'No recent activities'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {showActivityModal && selectedActivity && (
        <ActivityDetailsModal 
          activity={selectedActivity}
          language={language}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </>
  );
};

// Activity Details Modal Component
const ActivityDetailsModal = ({ activity, language, onClose }) => {
  const translations = {
    en: {
      activityDetails: 'Activity Details',
      visitDetails: 'Visit Details',
      clinicDetails: 'Clinic Details', 
      orderDetails: 'Order Details',
      userDetails: 'User Details',
      close: 'Close'
    },
    ar: {
      activityDetails: 'تفاصيل النشاط',
      visitDetails: 'تفاصيل الزيارة',
      clinicDetails: 'تفاصيل العيادة',
      orderDetails: 'تفاصيل الطلبية',
      userDetails: 'تفاصيل المستخدم',
      close: 'إغلاق'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">{t.activityDetails}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Activity Header */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${
              activity.type === 'visit' ? 'bg-green-500' :
              activity.type === 'clinic' ? 'bg-blue-500' :
              activity.type === 'order' ? 'bg-orange-500' : 'bg-purple-500'
            }`}>
              {activity.type === 'visit' ? '👨‍⚕️' :
               activity.type === 'clinic' ? '🏥' :
               activity.type === 'order' ? '📦' : '👤'}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">{activity.message}</h4>
              <p className="text-sm text-gray-600">
                {new Date(activity.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(activity.details || {}).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-bold text-gray-600 capitalize mb-1">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-lg text-gray-800">
                  {typeof value === 'boolean' ? (value ? '✅' : '❌') : 
                   typeof value === 'number' ? value.toLocaleString() : 
                   value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-3"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Action Button Component
const AdminActionButton = ({ icon, text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="btn-primary flex items-center justify-center gap-2 py-3 hover:scale-105 transition-transform"
    >
      <span className="text-xl">{icon}</span>
      <span>{text}</span>
    </button>
  );
};

// Selfie Capture Component for Sales Reps
const SelfieCapture = ({ onCapture, onSkip }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📷 Daily Check-in Selfie",
      subtitle: "Please take a selfie to verify your attendance",
      startCamera: "🎥 Start Camera",
      takeSelfie: "📸 Take Selfie",
      retake: "🔄 Retake",
      confirm: "✅ Confirm",
      skip: "⏭️ Skip for Now",
      cameraError: "Cannot access camera. Please allow camera permissions."
    },
    ar: {
      title: "📷 سيلفي تسجيل الحضور اليومي",
      subtitle: "يرجى أخذ سيلفي للتأكد من حضورك",
      startCamera: "🎥 تشغيل الكاميرا",
      takeSelfie: "📸 التقاط سيلفي",
      retake: "🔄 إعادة التقاط",
      confirm: "✅ تأكيد",
      skip: "⏭️ تخطي الآن",
      cameraError: "لا يمكن الوصول للكاميرا. يرجى السماح بصلاحيات الكاميرا."
    }
  };

  const t = translations[language] || translations.en;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(t.cameraError);
    }
  };

  const takeSelfie = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturing(true);
      
      // Save selfie to backend
      saveSelfie(imageData);
    }
  };

  const saveSelfie = async (imageData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/selfie`, {
        selfie_image: imageData,
        timestamp: new Date().toISOString(),
        location: await getCurrentLocation()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (onCapture) onCapture(imageData);
    } catch (error) {
      console.error('Error saving selfie:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => resolve({ latitude: null, longitude: null })
        );
      } else {
        resolve({ latitude: null, longitude: null });
      }
    });
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="modal-modern p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gradient mb-2">{t.title}</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg"></div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <button
                    onClick={startCamera}
                    className="btn-primary"
                  >
                    {t.startCamera}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {stream && (
            <div className="flex gap-3">
              <button
                onClick={takeSelfie}
                className="btn-success flex-1 flex items-center justify-center gap-2"
              >
                <span>📸</span>
                <span>{t.takeSelfie}</span>
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                stopCamera();
                if (onSkip) onSkip();
              }}
              className="btn-secondary flex-1"
            >
              {t.skip}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Daily Plan Component for Sales Reps
const DailyPlan = ({ user, onClose }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📋 Today's Plan",
      subtitle: "Your daily tasks and schedule",
      visits: "Visits Scheduled",
      orders: "Orders to Process", 
      clinics: "Clinics to Visit",
      startDay: "🚀 Start Your Day",
      viewMap: "🗺️ View on Map",
      noTasks: "No tasks scheduled for today",
      loading: "Loading your daily plan..."
    },
    ar: {
      title: "📋 خطة اليوم",
      subtitle: "مهامك وجدولك اليومي",
      visits: "زيارات مجدولة",
      orders: "طلبات للمعالجة",
      clinics: "عيادات للزيارة", 
      startDay: "🚀 ابدأ يومك",
      viewMap: "🗺️ عرض على الخريطة",
      noTasks: "لا توجد مهام مجدولة لليوم",
      loading: "جاري تحميل خطة اليوم..."
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchDailyPlan();
  }, []);

  const fetchDailyPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user.id}/daily-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlan(response.data);
    } catch (error) {
      // Mock data for demonstration
      setPlan({
        visits: [
          {
            id: 1,
            clinic_name: language === 'ar' ? 'عيادة النور' : 'Al Nour Clinic',
            doctor_name: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
            time: '10:00 AM',
            address: language === 'ar' ? 'شارع الجمهورية، المنصورة' : 'Gomhoria Street, Mansoura',
            status: 'pending'
          },
          {
            id: 2,
            clinic_name: language === 'ar' ? 'عيادة الشفاء' : 'Al Shifa Clinic',
            doctor_name: language === 'ar' ? 'د. فاطمة علي' : 'Dr. Fatema Ali',
            time: '2:00 PM',
            address: language === 'ar' ? 'شارع المحطة، المنصورة' : 'Station Street, Mansoura',
            status: 'pending'
          }
        ],
        orders: [
          {
            id: 1,
            clinic_name: language === 'ar' ? 'عيادة الأمل' : 'Al Amal Clinic',
            items_count: 5,
            total_amount: 2500,
            status: 'pending_delivery'
          }
        ],
        route_optimized: true,
        estimated_duration: '6 hours',
        total_distance: '45 km'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="modal-modern p-8 w-full max-w-2xl">
          <div className="text-center">
            <div className="w-16 h-16 loading-shimmer rounded-full mx-auto mb-4"></div>
            <p>{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gradient">{t.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-modern p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{plan?.visits?.length || 0}</div>
              <div className="text-sm text-gray-600">{t.visits}</div>
            </div>
            <div className="card-modern p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{plan?.orders?.length || 0}</div>
              <div className="text-sm text-gray-600">{t.orders}</div>
            </div>
            <div className="card-modern p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{plan?.estimated_duration || 'N/A'}</div>
              <div className="text-sm text-gray-600">{language === 'ar' ? 'مدة متوقعة' : 'Estimated Duration'}</div>
            </div>
          </div>

          {/* Visits Schedule */}
          {plan?.visits && plan.visits.length > 0 && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>👨‍⚕️</span>
                <span>{t.visits}</span>
              </h4>
              <div className="space-y-3">
                {plan.visits.map((visit, index) => (
                  <div key={visit.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{visit.clinic_name}</div>
                      <div className="text-sm text-gray-600">{visit.doctor_name}</div>
                      <div className="text-xs text-gray-500">{visit.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{visit.time}</div>
                      <div className="text-xs text-gray-500">{language === 'ar' ? 'معلق' : 'Pending'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders to Process */}
          {plan?.orders && plan.orders.length > 0 && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📦</span>
                <span>{t.orders}</span>
              </h4>
              <div className="space-y-3">
                {plan.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{order.clinic_name}</div>
                      <div className="text-sm text-gray-600">
                        {order.items_count} {language === 'ar' ? 'عناصر' : 'items'} • {order.total_amount.toLocaleString()} EGP
                      </div>
                    </div>
                    <div className="text-sm text-orange-600 font-medium">
                      {language === 'ar' ? 'في انتظار التسليم' : 'Pending Delivery'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan?.visits?.length === 0 && plan?.orders?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg text-gray-600">{t.noTasks}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>{t.startDay}</span>
            </button>
            <button
              className="btn-info flex items-center justify-center gap-2 px-6"
            >
              <span>🗺️</span>
              <span>{t.viewMap}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const handleExportReports = () => {
  // Export functionality
  const reportData = {
    generated_at: new Date().toISOString(),
    type: 'comprehensive',
    format: 'pdf'
  };
  
  // Create downloadable link
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `report_${Date.now()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const handleUserManagement = () => {
  // Navigate to user management (will be handled by proper navigation)
  const event = new CustomEvent('navigateToTab', { detail: 'users' });
  window.dispatchEvent(event);
};

const handleSystemSettings = () => {
  // Navigate to system settings
  const event = new CustomEvent('navigateToTab', { detail: 'settings' });
  window.dispatchEvent(event);
};

// Enhanced User Management Component
// Enhanced User Management Component with Photos, Last Seen, and KPIs
const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Enhanced states for new features
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({
    username: '', email: '', password: '', full_name: '', role: '', 
    phone: '', manager_id: '', department: '', employee_id: ''
  });
  
  // Additional states for legacy compatibility
  const [userStats, setUserStats] = useState({});
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('full_name');
  const [usersPerPage] = useState(10);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  
  const { language } = useLanguage();

  useEffect(() => {
    fetchEnhancedUsers();
    // Update last seen every 30 seconds
    const interval = setInterval(updateLastSeen, 30000);
    return () => clearInterval(interval);
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const updateLastSeen = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/update-last-seen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.log('Failed to update last seen:', error);
    }
  };

  const fetchEnhancedUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role_filter: roleFilter }),
        ...(statusFilter && { status_filter: statusFilter })
      });
      
      const response = await axios.get(`${API}/users/enhanced-list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      setError('خطأ في تحميل المستخدمين');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Legacy function for compatibility
  const fetchUsers = fetchEnhancedUsers;

  const handlePhotoUpload = async (userId, photoFile) => {
    try {
      const token = localStorage.getItem('token');
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        
        await axios.post(`${API}/users/upload-photo`, {
          user_id: userId,
          photo: base64
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess('تم تحديث الصورة بنجاح');
        fetchEnhancedUsers();
      };
      reader.readAsDataURL(photoFile);
      
    } catch (error) {
      setError('خطأ في رفع الصورة');
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      'admin': 'مدير',
      'manager': 'مدير فرع',
      'sales_rep': 'مندوب مبيعات',
      'warehouse_manager': 'مدير مخزن',
      'warehouse_keeper': 'أمين المخزن',
      'accounting': 'محاسب'
    };
    return roleMap[role] || role;
  };

  const getStatusColor = (user) => {
    if (!user.is_active) return 'bg-red-500';
    if (user.is_online) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'غير متاح';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / 60000);
    
    if (diffInMinutes < 5) return 'متصل الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // Legacy function for bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    const confirmed = window.confirm(`هل أنت متأكد من تطبيق "${bulkAction}" على ${selectedUsers.size} مستخدم؟`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedUsers).map(userId => {
        if (bulkAction === 'activate') {
          return axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (bulkAction === 'deactivate') {
          return axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      });

      await Promise.all(promises);
      setSuccess(`تم تطبيق الإجراء على ${selectedUsers.size} مستخدم`);
      setSelectedUsers(new Set());
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      setError('خطأ في تطبيق الإجراء الجماعي');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'تعطيل' : 'تنشيط';
    const confirmed = window.confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`تم ${action} المستخدم بنجاح`);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      setError(`خطأ في ${action} المستخدم`);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟ هذا الإجراء لا يمكن التراجع عنه.`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`تم حذف المستخدم "${userName}" بنجاح`);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      setError('خطأ في حذف المستخدم');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`تم إنشاء المستخدم "${newUser.full_name}" بنجاح`);
      setShowCreateUser(false);
      setNewUser({
        username: '', email: '', password: '', full_name: '', role: '', 
        phone: '', manager_id: '', department: '', employee_id: ''
      });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      setError('خطأ في إنشاء المستخدم');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/${selectedUser.id}`, selectedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`تم تحديث المستخدم "${selectedUser.full_name}" بنجاح`);
      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      setError('خطأ في تحديث المستخدم');
    }
  };

  const UserCard = ({ user }) => (
    <div className="glass-effect p-6 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* User Photo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {user.photo ? (
              <img 
                src={`data:image/jpeg;base64,${user.photo}`}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-bold">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Online Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusColor(user)}`}></div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {user.full_name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.is_active ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
            }`}>
              {user.is_active ? 'نشط' : 'غير نشط'}
            </span>
          </div>
          
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            @{user.username} • {getRoleText(user.role)}
          </p>
          
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            آخر ظهور: {formatLastSeen(user.last_seen_formatted)}
          </p>

          {/* KPIs */}
          {user.kpis && Object.keys(user.kpis).length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {user.role === 'sales_rep' && (
                <>
                  <div className="text-center p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{user.kpis.visits_today || 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>زيارات اليوم</div>
                  </div>
                  <div className="text-center p-2 bg-green-500 bg-opacity-20 rounded-lg">
                    <div className="text-lg font-bold text-green-400">{user.kpis.total_orders || 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>إجمالي الطلبات</div>
                  </div>
                </>
              )}
              {user.role === 'manager' && (
                <>
                  <div className="text-center p-2 bg-purple-500 bg-opacity-20 rounded-lg">
                    <div className="text-lg font-bold text-purple-400">{user.kpis.team_members || 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>أعضاء الفريق</div>
                  </div>
                  <div className="text-center p-2 bg-orange-500 bg-opacity-20 rounded-lg">
                    <div className="text-lg font-bold text-orange-400">{user.kpis.pending_approvals || 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>موافقات معلقة</div>
                  </div>
                </>
              )}
              {user.role === 'warehouse_manager' && (
                <>
                  <div className="text-center p-2 bg-indigo-500 bg-opacity-20 rounded-lg">
                    <div className="text-lg font-bold text-indigo-400">{user.kpis.managed_warehouses || 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>المخازن المدارة</div>
                  </div>
                  <div className="text-center p-2 bg-red-500 bg-opacity-20 rounded-lg">
                    <div className="text-lg font-bold text-red-400">{user.kpis.low_stock_items || 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>نقص مخزون</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Gamification Info for Sales Reps - Integrated with Real Data */}
          {user.role === 'sales_rep' && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20 p-3 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    نظام التحفيز
                  </span>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openGamification', { detail: user.id }))}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  عرض التفاصيل →
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-yellow-400">
                    {((user.kpis?.total_visits || 0) * 10) + ((user.kpis?.visits_today || 0) * 20)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>نقاط</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-purple-400">
                    المستوى {Math.floor(((user.kpis?.total_visits || 0) * 10 + (user.kpis?.visits_today || 0) * 20) / 1000) + 1}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>مستوى</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-green-400">
                    {user.kpis?.total_orders || 0 > 5 ? '🏆' : user.kpis?.visits_today > 3 ? '⚡' : '🎯'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>إنجاز</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowUserDetails(true);
              }}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              عرض التفاصيل
            </button>
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowPhotoUpload(true);
              }}
              className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              📷
            </button>
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowEditUser(true);
              }}
              className="py-2 px-3 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
            >
              ✏️
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">👥</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">إدارة المستخدمين الشاملة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة كاملة للمستخدمين مع جميع الصلاحيات والإحصائيات
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateUser(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 neon-glow"
          >
            <span>➕</span>
            <span>مستخدم جديد</span>
          </button>
        </div>

        {/* User Statistics */}
        {userStats.total_users && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{userStats.total_users}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي المستخدمين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{userStats.active_distribution?.active || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مستخدمين نشطين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-red-600">{userStats.active_distribution?.inactive || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مستخدمين معطلين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(userStats.role_distribution || {}).length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>أنواع الأدوار</div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Filters and Bulk Actions */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2">البحث:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم أو البريد..."
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">فلترة بالدور:</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                <option value="manager">مدير</option>
                <option value="sales_rep">مندوب مبيعات</option>
                <option value="warehouse_manager">مدير مخزن</option>
                <option value="warehouse_keeper">أمين المخزن</option>
                <option value="accounting">محاسب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">فلترة بالحالة:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">إجراء جماعي:</label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="form-modern w-full"
              >
                <option value="">اختر إجراء</option>
                <option value="activate">تنشيط المحدد</option>
                <option value="deactivate">تعطيل المحدد</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchUsers}
                className="btn-info flex-1 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>تحديث</span>
              </button>
              {selectedUsers.size > 0 && bulkAction && (
                <button
                  onClick={handleBulkAction}
                  className="btn-warning flex-1 flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>تطبيق</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card-modern overflow-hidden">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>📋</span>
              <span>قائمة المستخدمين ({filteredUsers.length})</span>
              {selectedUsers.size > 0 && (
                <span className="badge-modern badge-info">
                  {selectedUsers.size} محدد
                </span>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المستخدم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">آخر دخول</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.profile_image ? (
                              <img 
                                src={user.profile_image} 
                                alt={user.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                user.is_active ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-500'
                              }`}>
                                {user.full_name.charAt(0)}
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              user.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {user.full_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {user.username} • {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                📱 {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          user.role === 'gm' ? 'badge-danger' :
                          user.role === 'admin' ? 'badge-danger' :
                          user.role === 'line_manager' ? 'badge-warning' :
                          user.role === 'area_manager' ? 'badge-warning' :
                          user.role === 'district_manager' ? 'badge-info' :
                          user.role === 'key_account' ? 'badge-info' :
                          user.role === 'medical_rep' ? 'badge-success' :
                          user.role === 'manager' ? 'badge-warning' :
                          user.role === 'sales_rep' ? 'badge-info' :
                          user.role === 'warehouse_manager' ? 'badge-success' : 'badge-secondary'
                        }`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          user.is_active ? 'badge-success' : 'badge-danger'
                        }`}>
                          {user.is_active ? '✅ نشط' : '❌ معطل'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {user.last_login ? 
                            new Date(user.last_login).toLocaleDateString('ar-EG') : 
                            'لم يسجل دخول'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                            className="btn-info text-xs px-3 py-1"
                            title="التفاصيل"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditUser(true);
                            }}
                            className="btn-primary text-xs px-3 py-1"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`text-xs px-3 py-1 rounded ${
                              user.is_active ? 'btn-warning' : 'btn-success'
                            }`}
                            title={user.is_active ? 'تعطيل' : 'تنشيط'}
                          >
                            {user.is_active ? '⏸️' : '▶️'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="btn-danger text-xs px-3 py-1"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">➕ إضافة مستخدم جديد</h3>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">كلمة المرور *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الدور *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="form-modern w-full"
                      required
                    >
                      <option value="">اختر الدور</option>
                      <option value="admin">مدير النظام</option>
                      <option value="manager">مدير</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="warehouse_manager">مدير مخزن</option>
                      <option value="warehouse_keeper">أمين المخزن</option>
                      <option value="accounting">محاسب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">القسم</label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الموظف</label>
                    <input
                      type="text"
                      value={newUser.employee_id}
                      onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'جاري الإنشاء...' : '✅ إنشاء المستخدم'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">✏️ تعديل المستخدم</h3>
                <button
                  onClick={() => setShowEditUser(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      value={selectedUser.username}
                      onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم الكامل</label>
                    <input
                      type="text"
                      value={selectedUser.full_name}
                      onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الدور</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                      className="form-modern w-full"
                    >
                      <option value="admin">مدير النظام</option>
                      <option value="manager">مدير</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="warehouse_manager">مدير مخزن</option>
                      <option value="warehouse_keeper">أمين المخزن</option>
                      <option value="accounting">محاسب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">القسم</label>
                    <input
                      type="text"
                      value={selectedUser.department || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'جاري التحديث...' : '✅ حفظ التغييرات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditUser(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">👁️ تفاصيل المستخدم</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="card-modern p-6">
                  <h4 className="text-lg font-bold mb-4">المعلومات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500">الاسم الكامل</label>
                      <p className="text-lg font-medium">{selectedUser.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">اسم المستخدم</label>
                      <p className="text-lg font-medium">{selectedUser.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">البريد الإلكتروني</label>
                      <p className="text-lg font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">رقم الهاتف</label>
                      <p className="text-lg font-medium">{selectedUser.phone || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">الدور</label>
                      <p className="text-lg font-medium">
                        <span className={`badge-modern ${
                          selectedUser.role === 'admin' ? 'badge-danger' :
                          selectedUser.role === 'manager' ? 'badge-warning' :
                          selectedUser.role === 'sales_rep' ? 'badge-info' : 'badge-success'
                        }`}>
                          {getRoleText(selectedUser.role)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">الحالة</label>
                      <p className="text-lg font-medium">
                        <span className={`badge-modern ${
                          selectedUser.is_active ? 'badge-success' : 'badge-danger'
                        }`}>
                          {selectedUser.is_active ? '✅ نشط' : '❌ معطل'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {selectedUser.statistics && (
                  <div className="card-modern p-6">
                    <h4 className="text-lg font-bold mb-4">الإحصائيات</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.statistics.total_visits !== undefined && (
                        <div>
                          <label className="text-sm font-bold text-gray-500">إجمالي الزيارات</label>
                          <p className="text-2xl font-bold text-blue-600">{selectedUser.statistics.total_visits}</p>
                        </div>
                      )}
                      {selectedUser.statistics.total_orders !== undefined && (
                        <div>
                          <label className="text-sm font-bold text-gray-500">إجمالي الطلبات</label>
                          <p className="text-2xl font-bold text-green-600">{selectedUser.statistics.total_orders}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Log */}
                <div className="card-modern p-6">
                  <h4 className="text-lg font-bold mb-4">معلومات النشاط</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-bold text-gray-500">تاريخ الإنشاء</label>
                      <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">آخر دخول</label>
                      <p className="text-lg">
                        {selectedUser.last_login ? 
                          new Date(selectedUser.last_login).toLocaleString('ar-EG') : 
                          'لم يسجل دخول بعد'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="btn-primary px-6 py-3"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components and Sub-systems

// Helper utility functions

// Real-time Analytics Hook
const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/analytics/realtime`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching real-time analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { analytics, loading };
};

// Enhanced Header Component with comprehensive language support
const EnhancedHeader = ({ user, onLogout, onSearchOpen }) => {
  const { theme, changeTheme } = useTheme();
  const { language, changeLanguage, t, isRTL } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const themes = [
    { id: 'light', name: t('themeLight'), icon: '☀️' },
    { id: 'dark', name: t('themeDark'), icon: '🌙' },
    { id: 'minimal', name: t('themeMinimal'), icon: '⚪' },
    { id: 'modern', name: t('themeModern'), icon: '🔮' },
    { id: 'fancy', name: t('themeFancy'), icon: '✨' },
    { id: 'cyber', name: t('themeCyber'), icon: '💚' },
    { id: 'sunset', name: t('themeSunset'), icon: '🌅' },
    { id: 'ocean', name: t('themeOcean'), icon: '🌊' },
    { id: 'forest', name: t('themeForest'), icon: '🌲' }
  ];

  return (
    <header className="header-enhanced sticky top-0 z-50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and System Name */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass-effect rounded-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
          </div>
          <h1 className={`header-brand system-brand ${isRTL ? 'arabic' : 'english'}`}>
            {t('systemName')}
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          
          {/* Search Button */}
          <button
            onClick={onSearchOpen}
            className="glass-effect p-3 rounded-full hover:scale-105 transition-transform"
            title={t('search')}
          >
            <SVGIcon name="search" size={20} className="svg-icon-animated" />
          </button>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Unified Theme Toggle - Single Button */}
          <button
            onClick={() => {
              const currentIndex = themes.findIndex(t => t.id === theme);
              const nextIndex = (currentIndex + 1) % themes.length;
              changeTheme(themes[nextIndex].id);
            }}
            className="theme-toggle-button glass-effect p-3 rounded-full hover:scale-105 transition-all duration-300 flex items-center gap-2"
            title={language === 'ar' ? `الثيم الحالي: ${themes.find(t => t.id === theme)?.name} - اضغط للتبديل` : `Current: ${themes.find(t => t.id === theme)?.name} - Click to switch`}
          >
            <span className="text-lg transition-transform duration-300 hover:rotate-12">
              {themes.find(t => t.id === theme)?.icon}
            </span>
            <SVGIcon name="theme" size={16} className="svg-icon-animated" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 glass-effect px-4 py-2 rounded-full hover:scale-105 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
              </div>
              <span className="font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>
                {user.full_name || user.username}
              </span>
              <SVGIcon name="user" size={16} />
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 glass-effect rounded-xl p-2 min-w-48 border border-white border-opacity-20">
                <div className="p-3 border-b border-white border-opacity-20">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {user.full_name || user.username}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t(user.role || 'user')} • {user.email}
                  </div>
                </div>
                
                <div className="py-2 space-y-1">
                  <button 
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors flex items-center gap-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <SVGIcon name="user" size={16} />
                    <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                  </button>
                  
                  <button 
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors flex items-center gap-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <SVGIcon name="settings" size={16} />
                    <span>{t('settings')}</span>
                  </button>
                  
                  <div className="border-t border-white border-opacity-20 my-2"></div>
                  
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-20 transition-colors flex items-center gap-3 text-red-400"
                  >
                    <SVGIcon name="close" size={16} />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Enhanced Footer with Dynamic Copyright Section and Social Links
const EnhancedFooter = () => {
  const { theme, language } = useTheme();
  
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    ar: {
      about: 'عن الشركة',
      services: 'خدماتنا', 
      contact: 'اتصل بنا',
      privacy: 'سياسة الخصوصية',
      terms: 'الشروط والأحكام',
      support: 'الدعم الفني'
    },
    en: {
      about: 'About Us',
      services: 'Our Services',
      contact: 'Contact Us', 
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      support: 'Technical Support'
    }
  };

  const links = footerLinks[language] || footerLinks.ar;

  return (
    <footer 
      className="glass-effect border-t border-white border-opacity-20 py-8 px-6"
      style={{ background: 'var(--secondary-bg)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gradient">EP Group System</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {language === 'ar' 
                ? 'نظام إدارة شامل للمؤسسات مع نظام محاسبة متكامل، إدارة المناديب، المخازن، والتقارير المالية'
                : 'Comprehensive enterprise management system with integrated accounting, sales rep management, warehouses, and financial reporting'
              }
            </p>
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {language === 'ar' ? 'النظام متاح 24/7' : 'System Available 24/7'}
              </span>
            </div>
          </div>

          {/* System Features */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {language === 'ar' ? 'مميزات النظام' : 'System Features'}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#accounting" className="text-sm hover:text-blue-500 transition-colors" 
                   style={{ color: 'var(--text-secondary)' }}>
                  💰 {language === 'ar' ? 'نظام المحاسبة' : 'Accounting System'}
                </a>
              </li>
              <li>
                <a href="#sales" className="text-sm hover:text-blue-500 transition-colors"
                   style={{ color: 'var(--text-secondary)' }}>
                  👥 {language === 'ar' ? 'إدارة المناديب' : 'Sales Management'}
                </a>
              </li>
              <li>
                <a href="#warehouse" className="text-sm hover:text-blue-500 transition-colors"
                   style={{ color: 'var(--text-secondary)' }}>
                  🏪 {language === 'ar' ? 'إدارة المخازن' : 'Warehouse Management'}
                </a>
              </li>
              <li>
                <a href="#reports" className="text-sm hover:text-blue-500 transition-colors"
                   style={{ color: 'var(--text-secondary)' }}>
                  📊 {language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Help */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {language === 'ar' ? 'الدعم والمساعدة' : 'Support & Help'}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#help" className="text-sm hover:text-blue-500 transition-colors"
                   style={{ color: 'var(--text-secondary)' }}>
                  📖 {language === 'ar' ? 'دليل المستخدم' : 'User Guide'}
                </a>
              </li>
              <li>
                <a href="#support" className="text-sm hover:text-blue-500 transition-colors"
                   style={{ color: 'var(--text-secondary)' }}>
                  🛠️ {language === 'ar' ? 'الدعم الفني' : 'Technical Support'}
                </a>
              </li>
              <li>
                <a href="#updates" className="text-sm hover:text-blue-500 transition-colors"
                   style={{ color: 'var(--text-secondary)' }}>
                  🔄 {language === 'ar' ? 'التحديثات' : 'System Updates'}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {language === 'ar' ? 'معلومات التواصل' : 'Contact Info'}
            </h4>
            <div className="space-y-2">
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                support@epgroup.com
              </p>
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                +20 100 123 4567
              </p>
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                {language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {language === 'ar' ? 'ساعات العمل:' : 'Working Hours:'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Animated Copyright Section */}
        <div className="mt-8 pt-8 border-t border-white border-opacity-20 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            © {currentYear} EP Group System. 
            {language === 'ar' ? ' جميع الحقوق محفوظة.' : ' All rights reserved.'}
          </div>
          
          {/* Animated Intellectual Property Section */}
          <div className="mt-6 md:mt-0 text-center md:text-right">
            <div 
              className="animated-copyright-section p-6 rounded-xl"
              style={{
                background: 'linear-gradient(45deg, rgba(255,107,53,0.1), rgba(247,147,30,0.1), rgba(255,210,63,0.1), rgba(6,214,160,0.1), rgba(17,138,178,0.1), rgba(7,59,76,0.1))',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 4s ease infinite',
                border: '2px solid transparent',
                borderImage: 'linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f, #06d6a0, #118ab2, #073b4c) 1',
                borderImageSlice: 1
              }}
            >
              <div 
                className="text-sm mb-3 font-semibold"
                style={{ 
                  color: 'var(--text-primary)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                جميع حقوق الملكيه الفكريه محفوظه
              </div>
              <div 
                className="text-xl font-bold mb-4"
                style={{
                  fontFamily: '"Roboto", "Tajawal", sans-serif',
                  letterSpacing: '2px',
                  background: 'linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f, #06d6a0, #118ab2, #073b4c)',
                  backgroundSize: '300% 300%',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradientShift 3s ease infinite, bounce 3s infinite',
                  textShadow: 'none'
                }}
              >
                Mahmoud Elmnakhli
              </div>
              <a 
                href="https://facebook.com/mafiaidola" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-sm px-4 py-2 rounded-full transition-all duration-500 hover:scale-110 hover:rotate-3"
                style={{
                  background: 'linear-gradient(135deg, #1877f2, #42a5f5, #64b5f6)',
                  color: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(24, 119, 242, 0.4)',
                  animation: 'socialPulse 4s ease-in-out infinite',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span style={{ fontWeight: '600' }}>Facebook Profile</span>
                <div 
                  className="w-2 h-2 rounded-full bg-white opacity-70"
                  style={{ animation: 'pulse 2s infinite' }}
                ></div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Enhanced Sales Rep Dashboard with Selfie and Daily Plan
const AdvancedReports = () => {
  const [reportType, setReportType] = useState('visits_performance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        report_type: reportType,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      
      const response = await axios.get(`${API}/reports/advanced?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const ChartRenderer = ({ data, type, title }) => {
    if (!data || !data.data) return <div>لا توجد بيانات للعرض</div>;

    return (
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">رسم بياني تفاعلي</p>
            <p className="text-sm text-gray-500 mt-2">
              {data.data.length} نقطة بيانات
            </p>
            <div className="mt-4 text-xs text-gray-400">
              {data.data.slice(0, 3).map((point, index) => (
                <div key={index}>
                  {point._id}: {point.total_visits || point.total_orders || 'N/A'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-green rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">📈</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">التقارير التفاعلية المتقدمة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                تحليلات وتقارير شاملة مع رسوم بيانية تفاعلية
              </p>
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">نوع التقرير:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-modern w-full"
              >
                <option value="visits_performance">أداء الزيارات</option>
                <option value="sales_by_rep">المبيعات بواسطة المناديب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">من تاريخ:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">إلى تاريخ:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className="form-modern w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="loading-shimmer w-4 h-4 rounded-full"></div>
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>تحديث التقرير</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <ChartRenderer 
            data={reportData} 
            type={reportData.type} 
            title={reportData.title}
          />
        )}
      </div>
    </div>
  );
};

// QR Code Scanner Component
const QRCodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('لا يمكن الوصول للكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Simulate QR code scanning (in real app, use a QR code library)
      const imageData = canvas.toDataURL();
      onScan({ 
        type: 'clinic', 
        id: 'sample-clinic-id',
        name: 'عيادة تجريبية',
        address: 'عنوان تجريبي' 
      });
    }
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gradient">📱 مسح QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg animate-pulse"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <button
                    onClick={captureAndScan}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    <span>📷</span>
                    <span>مسح الكود</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-lg mb-4">اضغط لبدء المسح</p>
                  <button
                    onClick={startScanning}
                    className="btn-primary"
                  >
                    🎥 تشغيل الكاميرا
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              📋 وجه الكاميرا نحو QR Code للعيادة أو المنتج
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Language Selector with English as Primary
const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' }
  ];

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  return (
    <div className="relative">
      <select 
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
        style={{ direction: 'ltr' }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

// Offline Status Component
const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '{"visits": [], "orders": []}');
    
    if (offlineData.visits.length === 0 && offlineData.orders.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/offline/sync`, offlineData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear offline data after successful sync
      localStorage.removeItem('offline_data');
      setPendingSync([]);
      
      console.log('Offline data synced successfully:', response.data);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const addOfflineData = (type, data) => {
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '{"visits": [], "orders": []}');
    offlineData[type].push({
      ...data,
      local_id: Date.now().toString(),
      offline_created_at: new Date().toISOString()
    });
    localStorage.setItem('offline_data', JSON.stringify(offlineData));
    setPendingSync([...pendingSync, { type, data }]);
  };

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-3">
        <span className="text-xl">📡</span>
        <div className="flex-1">
          <div className="font-medium">وضع عدم الاتصال</div>
          <div className="text-sm">سيتم مزامنة البيانات عند عودة الاتصال</div>
          {pendingSync.length > 0 && (
            <div className="text-xs mt-1">
              {pendingSync.length} عناصر في انتظار المزامنة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Accounting Role Component
const AccountingDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending orders (manager approved, waiting for accounting)
      const pendingRes = await axios.get(`${API}/orders?status=MANAGER_APPROVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(pendingRes.data);

      // Fetch accounting approved orders
      const approvedRes = await axios.get(`${API}/orders?status=ACCOUNTING_APPROVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedOrders(approvedRes.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/orders/${orderId}/approve`, {
        notes: approvalNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('خطأ في الموافقة على الطلبية');
    }
  };

  const getOrderTotal = (order) => {
    return order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-yellow rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">لوحة تحكم المحاسبة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                مراجعة وموافقة الطلبيات المالية
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{pendingOrders.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبيات تحتاج موافقة</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{approvedOrders.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبيات تمت الموافقة عليها</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {pendingOrders.reduce((total, order) => total + getOrderTotal(order), 0).toLocaleString()} ريال
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي القيمة المعلقة</div>
          </div>
        </div>

        {/* Pending Orders for Approval */}
        <div className="card-modern mb-8">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>⏳</span>
              <span>طلبيات تحتاج موافقة المحاسبة ({pendingOrders.length})</span>
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم الطلبية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">العيادة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">القيمة الإجمالية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">تاريخ الإنشاء</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          #{order.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          {order.sales_rep_name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          {order.clinic_name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-green-600">
                          {getOrderTotal(order).toLocaleString()} ريال
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowApprovalModal(true);
                            }}
                            className="btn-success text-xs px-3 py-1"
                            title="موافقة"
                          >
                            ✅ موافقة
                          </button>
                          <button
                            className="btn-info text-xs px-3 py-1"
                            title="تفاصيل"
                          >
                            👁️ تفاصيل
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approved Orders */}
        <div className="card-modern">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>✅</span>
              <span>طلبيات تمت الموافقة عليها ({approvedOrders.length})</span>
            </h3>
          </div>
          
          <div className="table-modern">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم الطلبية</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">العيادة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">القيمة الإجمالية</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">تاريخ الموافقة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {approvedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        #{order.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {order.sales_rep_name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {order.clinic_name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {getOrderTotal(order).toLocaleString()} ريال
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {order.approved_at_accounting ? 
                          new Date(order.approved_at_accounting).toLocaleDateString('ar-EG') : 
                          'غير محدد'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-modern badge-success">
                        في انتظار المخزن
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">💰 موافقة الطلبية</h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Details */}
                <div className="card-modern p-4">
                  <h4 className="font-bold mb-3">تفاصيل الطلبية:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">رقم الطلبية:</span>
                      <span className="mr-2">#{selectedOrder.id.substring(0, 8)}</span>
                    </div>
                    <div>
                      <span className="font-medium">المندوب:</span>
                      <span className="mr-2">{selectedOrder.sales_rep_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">العيادة:</span>
                      <span className="mr-2">{selectedOrder.clinic_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">إجمالي القيمة:</span>
                      <span className="mr-2 text-green-600 font-bold">
                        {getOrderTotal(selectedOrder).toLocaleString()} ريال
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Notes */}
                <div>
                  <label className="block text-sm font-bold mb-2">ملاحظات الموافقة:</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={4}
                    className="form-modern w-full"
                    placeholder="أضف أي ملاحظات خاصة بالموافقة المالية..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => approveOrder(selectedOrder.id)}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    <span>الموافقة على الطلبية</span>
                  </button>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Warehouse Management Component
const WarehouseManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [warehouseStats, setWarehouseStats] = useState({});
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { language } = useContext(ThemeContext);

  // Egyptian warehouses configuration
  const egyptianWarehouses = [
    { id: 'WH_CAIRO', name: 'مخزن القاهرة', city: 'Cairo', region: 'Greater Cairo' },
    { id: 'WH_ALEX', name: 'مخزن الإسكندرية', city: 'Alexandria', region: 'Alexandria' },
    { id: 'WH_GIZA', name: 'مخزن الجيزة', city: 'Giza', region: 'Greater Cairo' },
    { id: 'WH_MANSOURA', name: 'مخزن المنصورة', city: 'Mansoura', region: 'Dakahlia' },
    { id: 'WH_ASWAN', name: 'مخزن أسوان', city: 'Aswan', region: 'Upper Egypt' }
  ];

  const translations = {
    en: {
      title: "🏪 Comprehensive Warehouse Management",
      subtitle: "Complete management of warehouses, inventory and orders",
      dashboard: "Dashboard",
      inventory: "Inventory Management", 
      orders: "Orders",
      movements: "Movement Log",
      warehouseOverview: "Warehouse Overview",
      urgentActions: "🚨 Urgent Actions Required",
      lowStock: "Low Stock Alert",
      pendingApproval: "Pending Approval",
      criticalIssues: "Critical Issues"
    },
    ar: {
      title: "🏪 إدارة المخازن الشاملة",
      subtitle: "إدارة كاملة للمخازن والمخزون والطلبات",
      dashboard: "لوحة التحكم",
      inventory: "إدارة المخزن",
      orders: "الطلبات", 
      movements: "سجل الحركات",
      warehouseOverview: "نظرة عامة على المخازن",
      urgentActions: "🚨 إجراءات عاجلة مطلوبة",
      lowStock: "تنبيه نقص مخزون",
      pendingApproval: "في انتظار الموافقة",
      criticalIssues: "مشاكل حرجة"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all warehouse data
      const [warehousesRes, statsRes, inventoryRes, ordersRes, movementsRes] = await Promise.all([
        axios.get(`${API}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/dashboard/warehouse-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/warehouses/movements`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setWarehouses(warehousesRes.data);
      setWarehouseStats(statsRes.data);
      setInventory(inventoryRes.data);
      setPendingOrders(ordersRes.data);
      setMovements(movementsRes.data);

    } catch (error) {
      // Mock data for demonstration
      setWarehouses(egyptianWarehouses);
      setWarehouseStats({
        total_value: 485000,
        low_stock_count: 12,
        pending_orders_count: 8,
        movement_today: 45
      });
      setInventory([
        { id: 1, name: 'أكسزوم 500مج', warehouse: 'مخزن القاهرة', quantity: 120, min_stock: 50, unit_price: 25.50, category: 'أدوية' },
        { id: 2, name: 'فيتامين د3', warehouse: 'مخزن الإسكندرية', quantity: 8, min_stock: 30, unit_price: 45.00, category: 'فيتامينات' },
        { id: 3, name: 'باراسيتامول', warehouse: 'مخزن الجيزة', quantity: 200, min_stock: 100, unit_price: 12.75, category: 'مسكنات' },
        { id: 4, name: 'أوميجا 3', warehouse: 'مخزن المنصورة', quantity: 15, min_stock: 25, unit_price: 65.00, category: 'مكملات' },
        { id: 5, name: 'كالسيوم مغنيسيوم', warehouse: 'مخزن أسوان', quantity: 75, min_stock: 40, unit_price: 38.25, category: 'مكملات' }
      ]);
      setPendingOrders([
        { id: 'ORD-001', clinic: 'عيادة النور', items: 5, total: 1250, status: 'pending_manager', sales_rep: 'محمود علي', warehouse: 'مخزن القاهرة' },
        { id: 'ORD-002', clinic: 'عيادة الشفاء', items: 3, total: 850, status: 'pending_accounting', sales_rep: 'أحمد حسن', warehouse: 'مخزن الإسكندرية' },
        { id: 'ORD-003', clinic: 'عيادة الأمل', items: 7, total: 2100, status: 'pending_warehouse', sales_rep: 'فاطمة محمد', warehouse: 'مخزن المنصورة' }
      ]);
      setMovements([
        { id: 1, date: '2024-01-24', product: 'أكسزوم 500مج', requester: 'عيادة النور', region: 'القاهرة', movement_type: 'صرف', order_type: 'طلبية', quantity: 10, sales_rep: 'محمود علي', doctor: 'د. أحمد محمد', reason: 'طلبية عادية', comments: 'تم الصرف بنجاح', status: 'completed' },
        { id: 2, date: '2024-01-24', product: 'فيتامين د3', requester: 'عيادة الشفاء', region: 'الإسكندرية', movement_type: 'صرف', order_type: 'ديمو', quantity: 5, sales_rep: 'أحمد حسن', doctor: 'د. فاطمة علي', reason: 'عينة مجانية', comments: 'للتجربة', status: 'pending_approval' },
        { id: 3, date: '2024-01-23', product: 'باراسيتامول', requester: 'عيادة الأمل', region: 'الجيزة', movement_type: 'إدخال', order_type: 'تزويد', quantity: 100, sales_rep: 'إبراهيم خالد', doctor: '', reason: 'تزويد مخزون', comments: 'شحنة جديدة', status: 'completed' }
      ]);
      console.error('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-xl md:text-3xl">🏪</span>
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">{t.title}</h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-2 overflow-x-auto bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg scrollbar-hide" style={{ direction: 'ltr' }}>
            {[
              { key: 'dashboard', label: t.dashboard, icon: '📊' },
              { key: 'inventory', label: t.inventory, icon: '📦' },
              { key: 'orders', label: t.orders, icon: '🛒' },
              { key: 'movements', label: t.movements, icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`nav-tab ${activeTab === tab.key ? 'active' : ''} flex items-center whitespace-nowrap px-4 py-2 text-sm md:text-base`}
              >
                <span className="ml-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <WarehouseDashboard 
            stats={warehouseStats} 
            warehouses={warehouses}
            inventory={inventory}
            loading={loading}
            language={language}
          />
        )}
        
        {activeTab === 'inventory' && (
          <InventoryManagement 
            inventory={inventory}
            warehouses={warehouses}
            onRefresh={fetchWarehouseData}
            language={language}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManagement 
            orders={pendingOrders}
            onRefresh={fetchWarehouseData}
            language={language}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsLog 
            movements={movements}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

// Warehouse Dashboard Component
const WarehouseDashboard = ({ stats, warehouses, inventory, loading, language }) => {
  const t = language === 'ar' ? {
    warehouseOverview: 'نظرة عامة على المخازن',
    urgentActions: '🚨 إجراءات عاجلة مطلوبة',
    totalValue: 'إجمالي القيمة',
    lowStock: 'نقص مخزون',
    pendingOrders: 'طلبات معلقة',
    todayMovements: 'حركات اليوم',
    warehouseDetails: 'تفاصيل المخازن',
    criticalAlerts: 'تنبيهات حرجة',
    needsAttention: 'يحتاج 3 عبوات اكسزوم',
    needsApproval: 'يحتاج موافقة أمين المخزن على الطلبية',
    stockShortage: 'يوجد نقص في منتج'
  } : {
    warehouseOverview: 'Warehouse Overview',
    urgentActions: '🚨 Urgent Actions Required',
    totalValue: 'Total Value',
    lowStock: 'Low Stock',
    pendingOrders: 'Pending Orders',
    todayMovements: 'Today Movements',
    warehouseDetails: 'Warehouse Details',
    criticalAlerts: 'Critical Alerts',
    needsAttention: 'Needs 3 units of Axozom',
    needsApproval: 'Needs warehouse manager approval',
    stockShortage: 'Stock shortage in product'
  };

  const criticalAlerts = [
    { warehouse: 'مخزن أبيس', message: t.needsAttention, type: 'stock', priority: 'high' },
    { warehouse: 'مخزن العصافرة', message: t.needsApproval, type: 'approval', priority: 'medium' },
    { warehouse: 'مخزن جليم', message: `${t.stockShortage} فيتامين د3`, type: 'shortage', priority: 'high' }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.total_value?.toLocaleString() || '485,000'} جنيه</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.totalValue}</div>
        </div>
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.low_stock_count || 12}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.lowStock}</div>
        </div>
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.pending_orders_count || 8}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.pendingOrders}</div>
        </div>
        <div className="card-modern p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.movement_today || 45}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.todayMovements}</div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🚨</span>
          <span>{t.urgentActions}</span>
        </h3>
        <div className="space-y-3">
          {criticalAlerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              alert.priority === 'high' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">{alert.warehouse}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                </div>
                <button className={`btn-sm ${alert.priority === 'high' ? 'btn-danger' : 'btn-warning'}`}>
                  {language === 'ar' ? 'عرض' : 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🏪</span>
          <span>{t.warehouseDetails}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => {
            const warehouseInventory = inventory.filter(item => item.warehouse === warehouse.name);
            const lowStockItems = warehouseInventory.filter(item => item.quantity <= item.min_stock);
            
            return (
              <div key={warehouse.id} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{warehouse.name}</h4>
                    <p className="text-sm text-gray-600">{warehouse.city} • {warehouse.region}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${lowStockItems.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}:</span>
                    <span className="font-bold">{warehouseInventory.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'نقص مخزون' : 'Low Stock'}:</span>
                    <span className={`font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {lowStockItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'القيمة التقديرية' : 'Estimated Value'}:</span>
                    <span className="font-bold text-blue-600">
                      {warehouseInventory.reduce((total, item) => total + (item.quantity * item.unit_price), 0).toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                    </span>
                  </div>
                </div>
                
                <button className="btn-primary w-full mt-4 text-sm">
                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Reports Component

// Reports Component
const ReportsSection = () => {
  const [inventoryReport, setInventoryReport] = useState([]);
  const [usersReport, setUsersReport] = useState(null);
  const [activeReport, setActiveReport] = useState('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeReport === 'inventory') {
      fetchInventoryReport();
    } else if (activeReport === 'users') {
      fetchUsersReport();
    }
  }, [activeReport]);

  const fetchInventoryReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المخزون');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalInventoryValue = () => {
    return inventoryReport.reduce((total, item) => total + item.total_value, 0).toFixed(2);
  };

  const getLowStockCount = () => {
    return inventoryReport.filter(item => item.low_stock).length;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveReport('inventory')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المخزون
          </button>
          <button
            onClick={() => setActiveReport('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المستخدمين
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل التقرير...</p>
          </div>
        )}

        {/* Inventory Report */}
        {activeReport === 'inventory' && !isLoading && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المخزون الشامل</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي قيمة المخزون</h3>
                <p className="text-2xl font-bold text-blue-600">{getTotalInventoryValue()} ريال</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">منتجات نقص مخزون</h3>
                <p className="text-2xl font-bold text-red-600">{getLowStockCount()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">إجمالي المنتجات</h3>
                <p className="text-2xl font-bold text-green-600">{inventoryReport.length}</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المخزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكمية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      القيمة الإجمالية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryReport.map((item, index) => (
                    <tr key={index} className={item.low_stock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.minimum_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_value.toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.low_stock
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.low_stock ? 'نقص مخزون' : 'متوفر'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Report */}
        {activeReport === 'users' && !isLoading && usersReport && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المستخدمين</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي المستخدمين</h3>
                <p className="text-2xl font-bold text-blue-600">{usersReport.total_users}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">مستخدمين نشطين</h3>
                <p className="text-2xl font-bold text-green-600">{usersReport.active_distribution.active}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">مستخدمين معطلين</h3>
                <p className="text-2xl font-bold text-red-600">{usersReport.active_distribution.inactive}</p>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الأدوار</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(usersReport.role_distribution).map(([role, count]) => {
                  const roleNames = {
                    admin: 'أدمن',
                    warehouse_manager: 'مدير مخزن',
                    warehouse_keeper: 'أمين المخزن',
                    manager: 'مدير',
                    sales_rep: 'مندوب',
                    accounting: 'محاسب'
                  };
                  return (
                    <div key={role} className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">{roleNames[role] || role}</p>
                      <p className="text-xl font-bold text-gray-800">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersReport.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.full_name}
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.role === 'admin' && 'أدمن'}
                        {user.role === 'warehouse_manager' && 'مدير مخزن'}
                        {user.role === 'warehouse_keeper' && 'أمين المخزن'}
                        {user.role === 'manager' && 'مدير'}
                        {user.role === 'sales_rep' && 'مندوب'}
                        {user.role === 'accounting' && 'محاسب'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Sales Rep Dashboard with Selfie and Daily Plan
const SalesRepDashboard = ({ stats, user }) => {
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [selfieToday, setSelfieToday] = useState(null);
  const { language } = useContext(ThemeContext);

  useEffect(() => {
    checkDailySelfie();
  }, []);

  const checkDailySelfie = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/users/selfie/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.selfie) {
        setSelfieToday(response.data.selfie);
      } else {
        // Show selfie capture if no selfie taken today
        setShowSelfieCapture(true);
      }
    } catch (error) {
      // If API doesn't exist, show selfie capture for demo
      setShowSelfieCapture(true);
    }
  };

  const handleSelfieCapture = (imageData) => {
    setSelfieToday(imageData);
    setShowSelfieCapture(false);
    setShowDailyPlan(true); // Show daily plan after selfie
  };

  const handleSelfieSkip = () => {
    setShowSelfieCapture(false);
    setShowDailyPlan(true); // Show daily plan anyway
  };

  const translations = {
    en: {
      welcome: "👋 Welcome back",
      todayStats: "Today's Performance",
      visitsToday: "Visits Today",
      ordersToday: "Orders Today",
      clinicsAdded: "Clinics Added",
      efficiency: "Efficiency Rate",
      quickActions: "⚡ Quick Actions",
      newVisit: "👨‍⚕️ New Visit",
      newOrder: "📦 New Order",
      addClinic: "🏥 Add Clinic",
      viewPlan: "📋 View Daily Plan",
      todaySelfie: "📷 Today's Check-in",
      retakeSelfie: "🔄 Retake Selfie"
    },
    ar: {
      welcome: "👋 مرحباً بعودتك",
      todayStats: "أداء اليوم",
      visitsToday: "زيارات اليوم",
      ordersToday: "طلبات اليوم", 
      clinicsAdded: "عيادات مضافة",
      efficiency: "معدل الكفاءة",
      quickActions: "⚡ إجراءات سريعة",
      newVisit: "👨‍⚕️ زيارة جديدة",
      newOrder: "📦 طلبة جديدة", 
      addClinic: "🏥 إضافة عيادة",
      viewPlan: "📋 عرض خطة اليوم",
      todaySelfie: "📷 تسجيل حضور اليوم",
      retakeSelfie: "🔄 إعادة التقاط سيلفي"
    }
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="card-modern p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gradient mb-2">
                  {t.welcome}, {user.full_name}! 🌟
                </h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {selfieToday && (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">{t.todaySelfie}</div>
                    <img 
                      src={selfieToday} 
                      alt="Today's selfie"
                      className="w-16 h-16 rounded-full object-cover border-4 border-green-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowSelfieCapture(true)}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    {t.retakeSelfie}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Today's Performance Stats */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>{t.todayStats}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.today_visits || 0}</div>
                <div className="text-sm text-gray-600">{t.visitsToday}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.today_orders || 0}</div>
                <div className="text-sm text-gray-600">{t.ordersToday}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.clinics_added || 0}</div>
                <div className="text-sm text-gray-600">{t.clinicsAdded}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{stats.efficiency_rate || '85'}%</div>
                <div className="text-sm text-gray-600">{t.efficiency}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>{t.quickActions}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="btn-primary flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">👨‍⚕️</span>
                <span>{t.newVisit}</span>
              </button>
              <button className="btn-success flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">📦</span>
                <span>{t.newOrder}</span>
              </button>
              <button className="btn-info flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">🏥</span>
                <span>{t.addClinic}</span>
              </button>
              <button 
                onClick={() => setShowDailyPlan(true)}
                className="btn-warning flex flex-col items-center gap-2 py-6"
              >
                <span className="text-3xl">📋</span>
                <span>{t.viewPlan}</span>
              </button>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📈</span>
                <span>{language === 'ar' ? 'أداء الأسبوع' : 'Weekly Performance'}</span>
              </h3>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">
                    {language === 'ar' ? 'رسم بياني لأدائك الأسبوعي' : 'Your Weekly Performance Chart'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🏆</span>
                <span>{language === 'ar' ? 'إنجازات الشهر' : 'Monthly Achievements'}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥇</span>
                    <span className="font-medium">
                      {language === 'ar' ? 'أفضل مندوب للشهر' : 'Top Rep of the Month'}
                    </span>
                  </div>
                  <span className="text-yellow-600 font-bold">
                    {language === 'ar' ? 'مكتمل' : 'Achieved'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <span className="font-medium">
                      {language === 'ar' ? 'تحقيق هدف الزيارات' : 'Visits Target Met'}
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold">95%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <span className="font-medium">
                      {language === 'ar' ? 'تحقيق هدف المبيعات' : 'Sales Target Met'}
                    </span>
                  </div>
                  <span className="text-green-600 font-bold">110%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selfie Capture Modal */}
      {showSelfieCapture && (
        <SelfieCapture 
          onCapture={handleSelfieCapture}
          onSkip={handleSelfieSkip}
        />
      )}

      {/* Daily Plan Modal */}
      {showDailyPlan && (
        <DailyPlan 
          user={user}
          onClose={() => setShowDailyPlan(false)}
        />
      )}
    </>
  );
};

// Clinic Registration Component
const ClinicRegistration = () => {
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    doctor_name: '',
    clinic_class: '',
    doctor_address: '',
    clinic_manager_name: '',
    address: '',
    notes: '',
    clinic_image: ''
  });
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Convert coordinates to address (placeholder - will be enhanced with Google Maps)
          try {
            setLocationAddress(`الموقع: ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          } catch (error) {
            setLocationAddress(`${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          }
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({...formData, clinic_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل العيادة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        ...formData,
        doctor_specialty: formData.clinic_class, // Map clinic_class to doctor_specialty for backend
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post(`${API}/clinic-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال طلب تسجيل العيادة بنجاح. في انتظار موافقة المدير');
      setFormData({
        clinic_name: '',
        clinic_phone: '',
        doctor_name: '',
        clinic_class: '',
        doctor_address: '',
        clinic_manager_name: '',
        address: '',
        notes: '',
        clinic_image: ''
      });
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThemeToggle />
      <div className="card-modern p-8 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">🏥</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gradient">تسجيل عيادة جديدة</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>أضف عيادة طبية جديدة إلى النظام</p>
          </div>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 form-modern">
          {/* Location Banner */}
          <div className="card-gradient-success p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span>الموقع الجغرافي الحالي</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location ? (
                <>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📍</span>
                      <span className="font-bold">الإحداثيات:</span>
                    </div>
                    <p className="text-sm font-mono">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🏠</span>
                      <span className="font-bold">العنوان:</span>
                    </div>
                    <p className="text-sm">{locationAddress}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center">
                  <div className="gps-indicator">
                    <span>جاري تحديد الموقع...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Placeholder for Google Maps */}
            <div className="mt-6 h-48 glass-effect rounded-xl flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-2 block">🗺️</span>
                <p className="font-bold">خريطة Google Maps</p>
                <p className="text-sm opacity-75">سيتم عرض الموقع هنا بعد إضافة مفتاح الخرائط</p>
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">🏥 اسم العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                className="w-full"
                placeholder="مثال: عيادة النور الطبية"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📞 رقم العيادة</span>
              </label>
              <input
                type="tel"
                value={formData.clinic_phone}
                onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                className="w-full"
                placeholder="0501234567"
              />
            </div>
          </div>

          {/* Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👨‍⚕️ اسم الطبيب</span>
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                className="w-full"
                placeholder="د. أحمد محمد"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">🏆 تصنيف العيادة</span>
              </label>
              <select
                value={formData.clinic_class}
                onChange={(e) => setFormData({...formData, clinic_class: e.target.value})}
                className="w-full"
                required
              >
                <option value="">اختر تصنيف العيادة</option>
                <option value="A Class">A Class - عيادة درجة أولى</option>
                <option value="B Class">B Class - عيادة درجة ثانية</option>
                <option value="C Class">C Class - عيادة درجة ثالثة</option>
              </select>
            </div>
          </div>

          <div>
            <label>
              <span className="text-shadow-glow">🏠 عنوان الطبيب</span>
            </label>
            <input
              type="text"
              value={formData.doctor_address}
              onChange={(e) => setFormData({...formData, doctor_address: e.target.value})}
              className="w-full"
              placeholder="حي الملز، شارع الملك فهد"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👔 المسؤول عن إدارة العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_manager_name}
                onChange={(e) => setFormData({...formData, clinic_manager_name: e.target.value})}
                className="w-full"
                placeholder="اسم مدير العيادة"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📍 عنوان العيادة</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full"
                placeholder="العنوان الكامل للعيادة"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label>
              <span className="text-shadow-glow">📸 صورة العيادة من الخارج (اختياري)</span>
            </label>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-4 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-500 transition-colors"
                style={{ 
                  background: 'var(--glass-bg)',
                  borderColor: 'var(--brand-orange)',
                  borderOpacity: 0.3
                }}
              />
              {formData.clinic_image && (
                <div className="mt-4">
                  <img
                    src={formData.clinic_image}
                    alt="صورة العيادة"
                    className="h-48 w-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label>
              <span className="text-shadow-glow">📝 ملاحظات العيادة</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={5}
              className="w-full"
              placeholder="أضف أي ملاحظات مهمة عن العيادة، ساعات العمل، أو معلومات خاصة..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !location}
            className="w-full btn-primary text-xl py-4 neon-glow"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                <span>جاري الإرسال...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span>🚀</span>
                <span>إرسال طلب تسجيل العيادة</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

// Order Creation Component
const OrderCreation = () => {
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orderData, setOrderData] = useState({
    doctor_id: '',
    order_type: 'DEMO',
    warehouse_id: '',
    notes: '',
    items: []
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show approved doctors
      setDoctors(response.data.filter(doctor => doctor.approved_by));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const addProductToOrder = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && !selectedProducts.find(p => p.id === productId)) {
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const updateProductQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? {...p, quantity: parseInt(quantity)} : p
    ));
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const doctor = doctors.find(d => d.id === orderData.doctor_id);
      
      const requestData = {
        ...orderData,
        clinic_id: doctor.clinic_id,
        items: selectedProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity
        }))
      };

      await axios.post(`${API}/orders`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال الطلبية بنجاح. في انتظار موافقة المدير');
      setOrderData({
        doctor_id: '',
        order_type: 'DEMO',
        warehouse_id: '',
        notes: '',
        items: []
      });
      setSelectedProducts([]);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلبية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">عمل طلبية</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اختيار الطبيب</label>
          <select
            value={orderData.doctor_id}
            onChange={(e) => setOrderData({...orderData, doctor_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Order Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلبية</label>
            <select
              value={orderData.order_type}
              onChange={(e) => setOrderData({...orderData, order_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEMO">ديمو (مجاني)</option>
              <option value="SALE">أوردر مدفوع</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار المخزن</label>
            <select
              value={orderData.warehouse_id}
              onChange={(e) => setOrderData({...orderData, warehouse_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- اختر المخزن --</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتجات</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addProductToOrder(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر منتج لإضافته --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.price} ريال ({product.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المنتجات المختارة</h3>
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.price} ريال / {product.unit}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {(product.price * product.quantity).toFixed(2)} ريال
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">إجمالي الطلبية:</span>
                  <span className="text-xl font-bold text-blue-600">{getTotalAmount().toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الأوردر</label>
          <textarea
            value={orderData.notes}
            onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف أي ملاحظات خاصة بالطلبية..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || selectedProducts.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الإرسال...' : 'إرسال الطلبية'}
        </button>
      </form>
    </div>
  );
};

const VisitRegistration = () => {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [currentVisitId, setCurrentVisitId] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          if (currentVisitId) {
            await addVoiceNote(currentVisitId, base64Audio, blob.size / 1000); // duration in seconds estimate
          } else {
            // Store temporarily until visit is created
            setVoiceNotes([...voiceNotes, { audio: base64Audio, duration: blob.size / 1000 }]);
          }
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('خطأ في بدء تسجيل الصوت');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const addVoiceNote = async (visitId, audioData, duration) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/visits/${visitId}/voice-notes`, {
        audio_data: audioData,
        duration: Math.round(duration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم إضافة الملاحظة الصوتية بنجاح');
    } catch (error) {
      console.error('Error adding voice note:', error);
      setError('خطأ في إضافة الملاحظة الصوتية');
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل الزيارة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/visits`, {
        doctor_id: selectedDoctor,
        clinic_id: selectedClinic,
        latitude: location.latitude,
        longitude: location.longitude,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentVisitId(response.data.visit_id);
      
      // Add any pending voice notes
      for (const voiceNote of voiceNotes) {
        await addVoiceNote(response.data.visit_id, voiceNote.audio, voiceNote.duration);
      }
      setVoiceNotes([]);

      setSuccess('تم تسجيل الزيارة بنجاح');
      setSelectedDoctor('');
      setSelectedClinic('');
      setNotes('');
      setCurrentVisitId(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في تسجيل الزيارة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">تسجيل زيارة جديدة</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر الطبيب
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر العيادة
          </label>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر العيادة --</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name} - {clinic.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات الزيارة
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف تفاصيل الزيارة..."
            required
          />
        </div>

        {/* Voice Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات صوتية (اختيارية)
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="ml-2">🛑</span>
                    إيقاف التسجيل
                  </>
                ) : (
                  <>
                    <span className="ml-2">🎤</span>
                    بدء تسجيل صوتي
                  </>
                )}
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">جاري التسجيل...</span>
                </div>
              )}
            </div>

            {voiceNotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">الملاحظات الصوتية المسجلة:</h4>
                {voiceNotes.map((note, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">🎵</span>
                    <audio controls className="flex-1 h-8">
                      <source src={note.audio} type="audio/wav" />
                    </audio>
                    <span className="text-xs text-gray-500">
                      {Math.round(note.duration)}ث
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              💡 يمكنك تسجيل عدة ملاحظات صوتية لحفظ تفاصيل مهمة أثناء الزيارة
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600 ml-2">📍</div>
            <div>
              <p className="text-sm font-medium text-blue-800">الموقع الحالي</p>
              {location ? (
                <p className="text-xs text-blue-600">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-blue-600">جاري تحديد الموقع...</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !location}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التسجيل...' : 'تسجيل الزيارة'}
        </button>
      </form>
    </div>
  );
};

// Inventory Edit Modal Component
const InventoryEditModal = ({ item, warehouses, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    quantity: item?.quantity || 0,
    minimum_stock: item?.minimum_stock || 0,
    warehouse_id: item?.warehouse_id || '',
    product_id: item?.product_id || ''
  });

  const t = language === 'ar' ? {
    editInventory: 'تعديل المخزون',
    product: 'المنتج',
    warehouse: 'المخزن',
    currentQuantity: 'الكمية الحالية',
    newQuantity: 'الكمية الجديدة',
    minimumStock: 'الحد الأدنى للمخزون',
    save: 'حفظ',
    cancel: 'إلغاء'
  } : {
    editInventory: 'Edit Inventory',
    product: 'Product',
    warehouse: 'Warehouse',
    currentQuantity: 'Current Quantity',
    newQuantity: 'New Quantity',
    minimumStock: 'Minimum Stock',
    save: 'Save',
    cancel: 'Cancel'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{t.editInventory}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">{t.product}:</label>
            <input
              type="text"
              value={item?.product_name || ''}
              disabled
              className="form-modern w-full bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t.warehouse}:</label>
            <select
              value={formData.warehouse_id}
              onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})}
              className="form-modern w-full"
            >
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t.currentQuantity}:</label>
            <input
              type="text"
              value={item?.quantity || 0}
              disabled
              className="form-modern w-full bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t.newQuantity}:</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="form-modern w-full"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t.minimumStock}:</label>
            <input
              type="number"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({...formData, minimum_stock: parseInt(e.target.value)})}
              className="form-modern w-full"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inventory Details Modal Component
const InventoryDetailsModal = ({ item, onClose, language }) => {
  const t = language === 'ar' ? {
    inventoryDetails: 'تفاصيل المخزون',
    product: 'المنتج',
    warehouse: 'المخزن',
    category: 'الفئة',
    quantity: 'الكمية',
    minimumStock: 'الحد الأدنى',
    unitPrice: 'سعر الوحدة',
    totalValue: 'القيمة الإجمالية',
    lastUpdated: 'آخر تحديث',
    status: 'الحالة',
    inStock: 'متوفر',
    lowStock: 'مخزون منخفض',
    outOfStock: 'نفد المخزون',
    close: 'إغلاق'
  } : {
    inventoryDetails: 'Inventory Details',
    product: 'Product',
    warehouse: 'Warehouse',
    category: 'Category',
    quantity: 'Quantity',
    minimumStock: 'Minimum Stock',
    unitPrice: 'Unit Price',
    totalValue: 'Total Value',
    lastUpdated: 'Last Updated',
    status: 'Status',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    close: 'Close'
  };

  const getStockStatus = () => {
    if (item.quantity === 0) return { text: t.outOfStock, color: 'text-red-500' };
    if (item.quantity <= item.minimum_stock) return { text: t.lowStock, color: 'text-yellow-500' };
    return { text: t.inStock, color: 'text-green-500' };
  };

  const status = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">{t.inventoryDetails}</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">{t.product}:</label>
              <p className="text-sm">{item.product_name}</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">{t.warehouse}:</label>
              <p className="text-sm">{item.warehouse_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">{t.category}:</label>
              <p className="text-sm">{item.category || 'غير محدد'}</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">{t.status}:</label>
              <p className={`text-sm font-bold ${status.color}`}>{status.text}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">{t.quantity}:</label>
              <p className="text-lg font-bold">{item.quantity}</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">{t.minimumStock}:</label>
              <p className="text-lg font-bold">{item.minimum_stock}</p>
            </div>
          </div>

          {item.unit_price && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">{t.unitPrice}:</label>
                <p className="text-sm">{item.unit_price} ج.م</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{t.totalValue}:</label>
                <p className="text-sm font-bold">{(item.quantity * item.unit_price).toFixed(2)} ج.م</p>
              </div>
            </div>
          )}

          {item.last_updated && (
            <div>
              <label className="block text-sm font-bold mb-1">{t.lastUpdated}:</label>
              <p className="text-sm">{new Date(item.last_updated).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
          <button
            onClick={onClose}
            className="btn-primary px-6"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Inventory Management Component
const InventoryManagement = ({ inventory, warehouses, onRefresh, language }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const t = language === 'ar' ? {
    inventoryTitle: 'إدارة المخزون الشامل',
    warehouse: 'المخزن',
    allWarehouses: 'جميع المخازن',
    search: 'بحث في المنتجات...',
    category: 'الفئة',
    allCategories: 'جميع الفئات',
    productName: 'اسم المنتج',
    quantity: 'الكمية',
    minStock: 'أقل مخزون',
    unitPrice: 'سعر الوحدة',
    totalValue: 'القيمة الإجمالية',
    status: 'الحالة',
    actions: 'الإجراءات',
    inStock: 'متوفر',
    lowStock: 'نقص مخزون',
    outOfStock: 'نفد المخزون',
    edit: 'تعديل',
    view: 'عرض'
  } : {
    inventoryTitle: 'Comprehensive Inventory Management',
    warehouse: 'Warehouse',
    allWarehouses: 'All Warehouses',
    search: 'Search products...',
    category: 'Category',
    allCategories: 'All Categories',
    productName: 'Product Name',
    quantity: 'Quantity',
    minStock: 'Min Stock',
    unitPrice: 'Unit Price',
    totalValue: 'Total Value',
    status: 'Status',
    actions: 'Actions',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    edit: 'Edit',
    view: 'View'
  };

  const filteredInventory = inventory.filter(item => {
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse === selectedWarehouse;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesWarehouse && matchesSearch && matchesCategory;
  });

  const getStatusInfo = (item) => {
    if (item.quantity === 0) return { text: t.outOfStock, color: 'text-red-600', bg: 'bg-red-100' };
    if (item.quantity <= item.min_stock) return { text: t.lowStock, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: t.inStock, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const categories = [...new Set(inventory.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📦</span>
          <span>{t.inventoryTitle}</span>
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">{t.warehouse}:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allWarehouses}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.search}:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="form-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.category}:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="table-modern overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.productName}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.warehouse}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.quantity}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.minStock}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.unitPrice}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.totalValue}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.status}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getStatusInfo(item);
                const totalValue = item.quantity * item.unit_price;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-lg">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.warehouse}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{item.min_stock}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.unit_price.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {totalValue.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          className="btn-info text-xs px-3 py-1" 
                          title={t.view}
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetailsModal(true);
                          }}
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-primary text-xs px-3 py-1" 
                          title={t.edit}
                          onClick={() => {
                            setSelectedItem(item);
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Edit Modal */}
      {showEditModal && selectedItem && (
        <InventoryEditModal
          item={selectedItem}
          warehouses={warehouses}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSave={async (updatedItem) => {
            // Handle inventory update
            try {
              const token = localStorage.getItem('token');
              await axios.patch(`${API}/inventory/${updatedItem.warehouse_id}/${updatedItem.product_id}`, {
                quantity: updatedItem.quantity,
                minimum_stock: updatedItem.minimum_stock
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              onRefresh();
              setShowEditModal(false);
              setSelectedItem(null);
            } catch (error) {
              console.error('Error updating inventory:', error);
            }
          }}
          language={language}
        />
      )}

      {/* Inventory Details Modal */}
      {showDetailsModal && selectedItem && (
        <InventoryDetailsModal
          item={selectedItem}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedItem(null);
          }}
          language={language}
        />
      )}
    </div>
  );
};

// Orders Management Component
const OrdersManagement = ({ orders, onRefresh, language }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleApproveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/orders/${orderId}/review`, 
        { approved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch (error) {
      console.error('Error approving order:', error);
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/orders/${orderId}/review`, 
        { approved: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };
  const t = language === 'ar' ? {
    ordersTitle: 'إدارة الطلبات المنتظرة',
    orderId: 'رقم الطلبية',
    clinic: 'العيادة',
    salesRep: 'المندوب',
    warehouse: 'المخزن',
    items: 'عدد العناصر',
    total: 'الإجمالي',
    status: 'الحالة',
    actions: 'الإجراءات',
    pendingManager: 'في انتظار المدير',
    pendingAccounting: 'في انتظار المحاسبة',
    pendingWarehouse: 'في انتظار المخزن',
    approve: 'موافقة',
    reject: 'رفض',
    view: 'عرض'
  } : {
    ordersTitle: 'Pending Orders Management',
    orderId: 'Order ID',
    clinic: 'Clinic',
    salesRep: 'Sales Rep',
    warehouse: 'Warehouse',
    items: 'Items',
    total: 'Total',
    status: 'Status',
    actions: 'Actions',
    pendingManager: 'Pending Manager',
    pendingAccounting: 'Pending Accounting',
    pendingWarehouse: 'Pending Warehouse',
    approve: 'Approve',
    reject: 'Reject',
    view: 'View'
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending_manager':
        return { text: t.pendingManager, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'pending_accounting':
        return { text: t.pendingAccounting, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'pending_warehouse':
        return { text: t.pendingWarehouse, color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🛒</span>
          <span>{t.ordersTitle}</span>
        </h3>

        <div className="table-modern overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.orderId}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.clinic}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.salesRep}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.warehouse}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.items}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.total}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.status}</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = getStatusInfo(order.status);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.clinic}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.sales_rep}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.warehouse}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center font-bold">{order.items}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {order.total.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          className="btn-info text-xs px-3 py-1" 
                          title={t.view}
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-success text-xs px-3 py-1" 
                          title={t.approve}
                          onClick={() => handleApproveOrder(order.id)}
                        >
                          ✅
                        </button>
                        <button 
                          className="btn-danger text-xs px-3 py-1" 
                          title={t.reject}
                          onClick={() => handleRejectOrder(order.id)}
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Movements Log Component  
const MovementsLog = ({ movements, language }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const t = language === 'ar' ? {
    movementsTitle: 'سجل حركات المخزن',
    filterByDate: 'فلترة بالتاريخ',
    filterByType: 'فلترة بنوع الحركة',
    filterByStatus: 'فلترة بالحالة',
    allTypes: 'جميع الأنواع',
    allStatuses: 'جميع الحالات',
    date: 'التاريخ',
    product: 'المنتج',
    requester: 'الطالب',
    region: 'المنطقة',
    movementType: 'نوع الحركة',
    orderType: 'نوع الطلب',
    quantity: 'الكمية',
    salesRep: 'المندوب',
    doctor: 'الدكتور المستلم',
    reason: 'السبب',
    comments: 'تعليقات',
    status: 'الحالة',
    actions: 'الإجراءات',
    completed: 'تمت',
    pendingApproval: 'في انتظار الموافقة',
    review: 'مراجعة',
    cancel: 'إلغاء'
  } : {
    movementsTitle: 'Warehouse Movement Log',
    filterByDate: 'Filter by Date',
    filterByType: 'Filter by Type',
    filterByStatus: 'Filter by Status',
    allTypes: 'All Types',
    allStatuses: 'All Statuses',
    date: 'Date',
    product: 'Product',
    requester: 'Requester',
    region: 'Region',
    movementType: 'Movement Type',
    orderType: 'Order Type',
    quantity: 'Quantity',
    salesRep: 'Sales Rep',
    doctor: 'Receiving Doctor',
    reason: 'Reason',
    comments: 'Comments',
    status: 'Status',
    actions: 'Actions',
    completed: 'Completed',
    pendingApproval: 'Pending Approval',
    review: 'Review',
    cancel: 'Cancel'
  };

  const filteredMovements = movements.filter(movement => {
    const matchesDate = !filterDate || movement.date.includes(filterDate);
    const matchesType = filterType === 'all' || movement.movement_type === filterType;
    const matchesStatus = filterStatus === 'all' || movement.status === filterStatus;
    return matchesDate && matchesType && matchesStatus;
  });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { text: t.completed, color: 'text-green-600', bg: 'bg-green-100' };
      case 'pending_approval':
        return { text: t.pendingApproval, color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>{t.movementsTitle}</span>
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">{t.filterByDate}:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.filterByType}:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allTypes}</option>
              <option value="صرف">{language === 'ar' ? 'صرف' : 'Dispatch'}</option>
              <option value="إدخال">{language === 'ar' ? 'إدخال' : 'Receive'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.filterByStatus}:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-modern w-full"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="completed">{t.completed}</option>
              <option value="pending_approval">{t.pendingApproval}</option>
            </select>
          </div>
        </div>

        {/* Movements Table */}
        <div className="table-modern overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.date}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.product}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.requester}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.region}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.movementType}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.orderType}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.quantity}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.salesRep}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.doctor}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.reason}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.comments}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.status}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => {
                const status = getStatusInfo(movement.status);
                
                return (
                  <tr key={movement.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{movement.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{movement.product}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.requester}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.region}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        movement.movement_type === 'صرف' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.order_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center font-bold">{movement.quantity}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.sales_rep}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.doctor || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.reason}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{movement.comments}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="btn-info text-xs px-2 py-1" title={t.review}>
                          👁️
                        </button>
                        <button className="btn-danger text-xs px-2 py-1" title={t.cancel}>
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const { language, t, isRTL } = useLanguage();
  const [stats, setStats] = useState({});
  const [visits, setVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchVisits();
    
    // Add event listener for navigation from admin actions
    const handleNavigation = (event) => {
      setActiveTab(event.detail);
    };
    
    window.addEventListener('navigateToTab', handleNavigation);
    
    return () => {
      window.removeEventListener('navigateToTab', handleNavigation);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const getRoleText = (role) => {
    return t(role) || role;
  };

  const canAccessTab = (tabName) => {
    const permissions = {
      users: ['admin', 'gm', 'warehouse_manager', 'manager', 'line_manager', 'area_manager'],
      warehouse: ['admin', 'gm', 'warehouse_manager'],
      visit: ['sales_rep', 'medical_rep'],
      reports: ['admin', 'gm', 'warehouse_manager', 'manager', 'line_manager', 'area_manager', 'accounting'],
      accounting: ['admin', 'gm', 'accounting', 'manager', 'line_manager'],
      regions: ['admin', 'gm', 'line_manager', 'area_manager'],
      comprehensive: ['admin', 'gm']
    };
    
    return permissions[tabName]?.includes(user.role) || false;
  };

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  
  return (
    <>
      <ThemeToggle />
      <div className="min-h-screen page-transition flex flex-col">
        {/* Enhanced Header */}
        <EnhancedHeader 
          user={user}
          onLogout={logout}
          onSearchOpen={() => setShowGlobalSearch(true)}
        />
        
        {/* Global Search Modal */}
        <GlobalSearch 
          isOpen={showGlobalSearch}
          onClose={() => setShowGlobalSearch(false)}
        />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Navigation Tabs with comprehensive translation */}
        <div className="mb-8">
          <nav className={`flex space-x-4 overflow-x-auto nav-menu rounded-2xl p-2 shadow-lg ${isRTL ? 'space-x-reverse' : ''}`} aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📊</span>
              {user.role === 'admin' ? t('statistics') : t('dashboard')}
            </button>
            
            {canAccessTab('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`nav-item ${activeTab === 'users' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>👥</span>
                {t('userManagement')}
              </button>
            )}
            
            {canAccessTab('warehouse') && (
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`nav-item ${activeTab === 'warehouse' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🏭</span>
                {t('warehouseManagement')}
              </button>
            )}
            
            {user.role === 'warehouse_keeper' && (
              <button
                onClick={() => setActiveTab('warehouse-keeper')}
                className={`nav-item ${activeTab === 'warehouse-keeper' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📦</span>
                لوحة أمين المخزن
              </button>
            )}
            
            {canAccessTab('warehouse') && (
              <button
                onClick={() => setActiveTab('invoices')}
                className={`nav-item ${activeTab === 'invoices' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🧾</span>
                {t('invoiceManagement') || 'إدارة الفواتير'}
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('clinic-registration')}
                className={`nav-item ${activeTab === 'clinic-registration' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🏥</span>
                {language === 'ar' ? 'تسجيل عيادة' : 'Clinic Registration'}
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('order-creation')}
                className={`nav-item ${activeTab === 'order-creation' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📦</span>
                {language === 'ar' ? 'عمل طلبية' : 'Create Order'}
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('visit')}
                className={`nav-item ${activeTab === 'visit' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📝</span>
                {language === 'ar' ? 'تسجيل زيارة' : 'Register Visit'}
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('visits')}
              className={`nav-item ${activeTab === 'visits' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📋</span>
              {t('visitsLog')}
            </button>

            {canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`nav-item ${activeTab === 'reports' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📈</span>
                {t('reports')}
              </button>
            )}
            
            {/* Approvals Tab - Available for all users */}
            <button
              onClick={() => setActiveTab('approvals')}
              className={`nav-item ${activeTab === 'approvals' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>⚖️</span>
              {language === 'ar' ? 'الموافقات' : 'Approvals'}
            </button>
            
            {/* Advanced Analytics tab for admin and manager roles */}
            {canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📊</span>
                {language === 'ar' ? 'التحليلات المتقدمة' : 'Advanced Analytics'}
              </button>
            )}
            
            {/* Gamification tab for sales_rep and managers */}
            {user.role === 'sales_rep' || canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('gamification')}
                className={`nav-item ${activeTab === 'gamification' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🎮</span>
                {language === 'ar' ? 'نظام التحفيز' : 'Gamification'}
              </button>
            )}
            
            {/* GPS Tracking tab for managers and admin */}
            {canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('gps')}
                className={`nav-item ${activeTab === 'gps' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🗺️</span>
                {language === 'ar' ? 'تتبع GPS' : 'GPS Tracking'}
              </button>
            )}
            
            {/* Monthly Planning for managers */}
            {(['admin', 'gm', 'area_manager', 'district_manager'].includes(user.role)) && (
              <button
                onClick={() => setActiveTab('monthly-planning')}
                className={`nav-item ${activeTab === 'monthly-planning' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>📅</span>
                التخطيط الشهري
              </button>
            )}
            
            {/* Approvals System for accounting and warehouse_keeper */}
            {(user.role === 'accounting' || user.role === 'warehouse_keeper' || user.role === 'admin') && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`nav-item ${activeTab === 'approvals' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>✅</span>
                نظام الموافقات
              </button>
            )}
            
            {/* Accounting tab for admin, accounting, and manager roles */}
            {canAccessTab('accounting') && (
              <button
                onClick={() => setActiveTab('accounting')}
                className={`nav-item ${activeTab === 'accounting' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>💰</span>
                {language === 'ar' ? 'المحاسبة' : 'Accounting'}
              </button>
            )}
            
            {/* System Settings only for Admin and GM */}
            {(user.role === 'admin' || user.role === 'gm') && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>⚙️</span>
                {t('settings')}
              </button>
            )}

            {/* Region Management for GM, Admin, Line Managers */}
            {(user.role === 'admin' || user.role === 'gm' || user.role === 'line_manager') && (
              <button
                onClick={() => setActiveTab('regions')}
                className={`nav-item ${activeTab === 'regions' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🗺️</span>
                {t('regionManagement')}
              </button>
            )}

            {/* Comprehensive Admin Settings for GM and Admin only */}
            {(user.role === 'admin' || user.role === 'gm') && (
              <button
                onClick={() => setActiveTab('comprehensive')}
                className={`nav-item ${activeTab === 'comprehensive' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>🎛️</span>
                {t('comprehensiveSettings')}
              </button>
            )}

          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && user.role === 'medical_rep' && (
          <MedicalRepDashboard stats={stats} user={user} />
        )}

        {activeTab === 'dashboard' && user.role === 'sales_rep' && (
          <SalesRepDashboard stats={stats} user={user} />
        )}

        {activeTab === 'dashboard' && !['medical_rep', 'sales_rep'].includes(user.role) && (
          <EnhancedStatisticsDashboard stats={stats} user={user} />
        )}

        {activeTab === 'clinic-registration' && user.role === 'sales_rep' && (
          <ClinicRegistration />
        )}

        {activeTab === 'order-creation' && user.role === 'sales_rep' && (
          <OrderCreation />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsDashboard user={user} />
        )}

        {activeTab === 'users' && canAccessTab('users') && (
          <EnhancedUserManagementV2 />
        )}

        {activeTab === 'warehouse' && canAccessTab('warehouse') && (
          <WarehouseManagement />
        )}

        {activeTab === 'warehouse-keeper' && user.role === 'warehouse_keeper' && (
          <WarehouseKeeperDashboard />
        )}

        {activeTab === 'approvals' && (user.role === 'accounting' || user.role === 'warehouse_keeper' || user.role === 'admin') && (
          <AdvancedApprovalSystem />
        )}

        {activeTab === 'invoices' && canAccessTab('warehouse') && (
          <InvoiceManagement />
        )}

        {activeTab === 'visit' && user.role === 'sales_rep' && (
          <VisitRegistration />
        )}

        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">سجل الزيارات</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطبيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العيادة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المندوب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(visit.visit_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.doctor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.clinic_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.sales_rep_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          visit.is_effective === null
                            ? 'bg-yellow-100 text-yellow-800'
                            : visit.is_effective
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {visit.is_effective === null
                            ? 'في انتظار المراجعة'
                            : visit.is_effective
                            ? 'مجدية'
                            : 'غير مجدية'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && canAccessTab('reports') && (
          <AdvancedReports />
        )}
        
        {activeTab === 'accounting' && canAccessTab('accounting') && (
          <AccountingPage />
        )}
        
        {activeTab === 'analytics' && canAccessTab('reports') && (
          <AdvancedAnalyticsDashboard />
        )}
        
        {activeTab === 'gamification' && (user.role === 'sales_rep' || canAccessTab('reports')) && (
          <GamificationDashboard />
        )}
        
        {activeTab === 'gps' && canAccessTab('reports') && (
          <GPSTrackingDashboard />
        )}
        
        {activeTab === 'settings' && (user.role === 'admin' || user.role === 'gm') && (
          <AdminSettingsPage />
        )}

        {activeTab === 'regions' && (user.role === 'admin' || user.role === 'gm' || user.role === 'line_manager') && (
          <RegionManagement />
        )}

        {activeTab === 'comprehensive' && (user.role === 'admin' || user.role === 'gm') && (
          <ComprehensiveAdminSettings />
        )}

        {activeTab === 'monthly-planning' && (['admin', 'gm', 'area_manager', 'district_manager'].includes(user.role)) && (
          <MonthlyPlanningSystem />
        )}

        </div>
        
        {/* Enhanced Footer */}
        <EnhancedFooter />
      </div>
    </>
  );
};

// Comprehensive Accounting System Page
const AccountingPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accountingData, setAccountingData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profitLossReport, setProfitLossReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const { language, t, isRTL } = useLanguage();

  const tabs = [
    { id: 'dashboard', label: language === 'ar' ? 'لوحة المحاسبة' : 'Accounting Dashboard', icon: '📊' },
    { id: 'invoices', label: language === 'ar' ? 'الفواتير' : 'Invoices', icon: '📋' },
    { id: 'expenses', label: language === 'ar' ? 'المصروفات' : 'Expenses', icon: '💸' },
    { id: 'customers', label: language === 'ar' ? 'العملاء' : 'Customers', icon: '👥' },
    { id: 'reports', label: language === 'ar' ? 'التقارير المالية' : 'Financial Reports', icon: '📈' }
  ];

  useEffect(() => {
    loadAccountingData();
  }, [activeTab]);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load different data based on active tab
      if (activeTab === 'dashboard') {
        const [overviewResponse, statsResponse] = await Promise.all([
          axios.get(`${API}/accounting/overview`, { headers }),
          axios.get(`${API}/accounting/dashboard-stats`, { headers })
        ]);
        setAccountingData({
          overview: overviewResponse.data,
          stats: statsResponse.data
        });
      } else if (activeTab === 'invoices') {
        const response = await axios.get(`${API}/accounting/invoices`, { headers });
        setInvoices(response.data);
      } else if (activeTab === 'expenses') {
        const response = await axios.get(`${API}/accounting/expenses`, { headers });
        setExpenses(response.data);
      } else if (activeTab === 'customers') {
        const response = await axios.get(`${API}/accounting/customers`, { headers });
        setCustomers(response.data);
      } else if (activeTab === 'reports') {
        const response = await axios.get(`${API}/accounting/reports/profit-loss`, { headers });
        setProfitLossReport(response.data);
      }
    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/accounting/expenses`, expenseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(language === 'ar' ? 'تم إضافة المصروف بنجاح' : 'Expense added successfully');
      loadAccountingData(); // Reload data
    } catch (error) {
      console.error('Error creating expense:', error);
      alert(language === 'ar' ? 'حدث خطأ في إضافة المصروف' : 'Error adding expense');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading && !accountingData && !invoices.length && !expenses.length && !customers.length) {
    return (
      <div className="glass-effect p-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {language === 'ar' ? 'جاري تحميل بيانات المحاسبة...' : 'Loading accounting data...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect p-6">
        <h2 className="text-3xl font-bold mb-4 text-gradient">
          {language === 'ar' ? 'نظام المحاسبة الشامل' : 'Comprehensive Accounting System'}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {language === 'ar' 
            ? 'إدارة شاملة للشؤون المالية، الفواتير، المصروفات، والتقارير'
            : 'Complete financial management, invoices, expenses, and reports'
          }
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="glass-effect p-2">
        <div className={`flex gap-2 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-effect p-8">
        {activeTab === 'dashboard' && (
          <AccountingDashboard data={accountingData} formatCurrency={formatCurrency} />
        )}
        
        {activeTab === 'invoices' && (
          <InvoicesTab invoices={invoices} formatCurrency={formatCurrency} />
        )}
        
        {activeTab === 'expenses' && (
          <ExpensesTab 
            expenses={expenses} 
            onCreateExpense={createExpense}
            formatCurrency={formatCurrency}
          />
        )}
        
        {activeTab === 'customers' && (
          <CustomersTab customers={customers} formatCurrency={formatCurrency} />
        )}
        
        {activeTab === 'reports' && (
          <FinancialReportsTab report={profitLossReport} formatCurrency={formatCurrency} />
        )}
      </div>
    </div>
  );
};

// Photo Upload Modal Component
const PhotoUploadModal = ({ user, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert('يرجى اختيار ملف صورة صالح');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      await onUpload(user.id, selectedFile);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">📷 تحديث صورة المستخدم</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Photo */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {user.photo ? (
                <img 
                  src={`data:image/jpeg;base64,${user.photo}`}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.full_name}</h4>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              اختر صورة جديدة
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full p-3 glass-effect border border-white border-opacity-20 rounded-lg text-white"
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>معاينة الصورة الجديدة:</p>
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden">
                <img 
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 glass-effect border border-white border-opacity-20 rounded-lg hover:bg-white hover:bg-opacity-10"
            >
              إلغاء
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'جاري الرفع...' : 'رفع الصورة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose }) => {
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivitySummary();
  }, [user.id]);

  const fetchActivitySummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user.id}/activity-summary?days=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivitySummary(response.data);
    } catch (error) {
      console.error('Failed to fetch activity summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">👤 تفاصيل المستخدم</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="glass-effect p-6 rounded-xl">
              {/* Photo */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                  {user.photo ? (
                    <img 
                      src={`data:image/jpeg;base64,${user.photo}`}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-4xl font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white ${
                    user.is_online ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <h4 className="text-xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  @{user.username}
                </p>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>الدور</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {getRoleText(user.role)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.email || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>رقم الهاتف</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.phone || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>آخر ظهور</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatLastSeen(user.last_seen_formatted)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>الحالة</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs and Activity */}
          <div className="lg:col-span-2">
            {/* Current KPIs */}
            {user.kpis && Object.keys(user.kpis).length > 0 && (
              <div className="glass-effect p-6 rounded-xl mb-6">
                <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  📊 مؤشرات الأداء الحالية
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(user.kpis).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{value}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Summary */}
            <div className="glass-effect p-6 rounded-xl">
              <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                📈 ملخص النشاط (آخر 7 أيام)
              </h4>
              
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                      <div className="w-16 h-4 bg-gray-600 rounded"></div>
                      <div className="flex-1 flex gap-4">
                        <div className="w-12 h-4 bg-gray-600 rounded"></div>
                        <div className="w-12 h-4 bg-gray-600 rounded"></div>
                        <div className="w-12 h-4 bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitySummary ? (
                <div className="space-y-4">
                  {/* Totals */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-20 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{activitySummary.totals.visits}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>إجمالي الزيارات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{activitySummary.totals.orders}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>إجمالي الطلبات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{activitySummary.totals.clinic_requests}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>طلبات العيادات</div>
                    </div>
                  </div>

                  {/* Daily Breakdown */}
                  <div className="space-y-2">
                    <h5 className="font-medium" style={{ color: 'var(--text-secondary)' }}>تفصيل يومي:</h5>
                    {activitySummary.daily_activities.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
                        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(day.date)}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-blue-400">🚗 {day.visits}</span>
                          <span className="text-green-400">📦 {day.orders}</span>
                          <span className="text-purple-400">🏥 {day.clinic_requests}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>لا توجد بيانات نشاط متاحة</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function getRoleText(role) {
    const roleMap = {
      'admin': 'مدير',
      'manager': 'مدير فرع',
      'sales_rep': 'مندوب مبيعات',
      'warehouse_manager': 'مدير مخزن',
      'warehouse_keeper': 'أمين المخزن',
      'accounting': 'محاسب'
    };
    return roleMap[role] || role;
  }

  function formatLastSeen(lastSeen) {
    if (!lastSeen) return 'غير متاح';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / 60000);
    
    if (diffInMinutes < 5) return 'متصل الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  }
};

// Integrated Gamification Dashboard Component
const GamificationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('profile'); // profile, leaderboard, achievements
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  
  // Data states - all integrated with real performance
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [achievements, setAchievements] = useState(null);
  
  const { language, t } = useLanguage();

  useEffect(() => {
    loadGamificationData();
  }, [activeView, selectedPeriod]);

  const loadGamificationData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = { Authorization: `Bearer ${token}` };

      if (activeView === 'profile') {
        const response = await axios.get(`${API}/gamification/user-profile/${user.id}`, { headers });
        setUserProfile(response.data);
      } else if (activeView === 'leaderboard') {
        const response = await axios.get(`${API}/gamification/leaderboard?period=${selectedPeriod}&limit=20`, { headers });
        setLeaderboard(response.data);
      } else if (activeView === 'achievements') {
        const response = await axios.get(`${API}/gamification/achievements`, { headers });
        setAchievements(response.data);
      }
    } catch (error) {
      setError('خطأ في تحميل بيانات التحفيز');
      console.error('Gamification data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = [
      'text-gray-400',    // Level 1
      'text-green-400',   // Level 2-3  
      'text-blue-400',    // Level 4-5
      'text-purple-400',  // Level 6-7
      'text-yellow-400',  // Level 8-9
      'text-red-400'      // Level 10
    ];
    return colors[Math.min(Math.floor((level - 1) / 2), colors.length - 1)];
  };

  const getLevelIcon = (level) => {
    const icons = ['🥉', '🥈', '🥇', '💎', '👑'];
    return icons[Math.min(Math.floor((level - 1) / 2), icons.length - 1)];
  };

  const getPositionIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  // User Profile View Component
  const UserProfileView = () => {
    if (!userProfile) return null;

    return (
      <div className="space-y-6">
        {/* User Header with Level */}
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {userProfile.user_info.photo ? (
                  <img 
                    src={`data:image/jpeg;base64,${userProfile.user_info.photo}`}
                    alt={userProfile.user_info.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {userProfile.user_info.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white font-bold text-sm ${getLevelColor(userProfile.gamification_stats.level)}`}>
                {userProfile.gamification_stats.level}
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {userProfile.user_info.full_name}
              </h2>
              <div className="flex items-center gap-4 mb-3">
                <span className={`text-xl ${getLevelColor(userProfile.gamification_stats.level)}`}>
                  {getLevelIcon(userProfile.gamification_stats.level)} المستوى {userProfile.gamification_stats.level}
                </span>
                <span className="text-yellow-400 text-xl font-bold">
                  ⭐ {userProfile.gamification_stats.total_points.toLocaleString()} نقطة
                </span>
              </div>
              
              {/* Level Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    التقدم للمستوى التالي
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {userProfile.gamification_stats.points_to_next_level > 0 ? 
                      `${userProfile.gamification_stats.points_to_next_level} نقطة متبقية` : 
                      'المستوى الأقصى!'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${userProfile.gamification_stats.level_progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Leaderboard Position */}
            <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-purple-500 bg-opacity-20 rounded-xl">
              <div className="text-2xl mb-1">
                {getPositionIcon(userProfile.leaderboard.position)}
              </div>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                المركز الـ {userProfile.leaderboard.position}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                من أصل {userProfile.leaderboard.total_participants}
              </div>
              <div className="text-xs mt-1 font-medium text-blue-400">
                أفضل من {userProfile.leaderboard.percentile}%
              </div>
            </div>
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="glass-effect p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>💰</span>
            <span>تفصيل النقاط (من الأداء الحقيقي)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {userProfile.points_breakdown.visit_points}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                نقاط الزيارات
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.total_visits} × 10
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {userProfile.points_breakdown.effectiveness_bonus}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                مكافأة الفعالية
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.effective_visits} × 20
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {userProfile.points_breakdown.order_points}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                نقاط الطلبات
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.total_orders} × 50
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {userProfile.points_breakdown.approval_bonus}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                مكافأة الموافقة
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.approved_orders} × 100
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {userProfile.points_breakdown.clinic_points}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                نقاط العيادات
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.clinics_added} × 200
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="glass-effect p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>إحصائيات الأداء</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {userProfile.performance_stats.total_visits}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي الزيارات</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.effectiveness_rate}% فعالية
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {userProfile.performance_stats.total_orders}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي الطلبات</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {userProfile.performance_stats.approval_rate}% معدل الموافقة
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {userProfile.performance_stats.clinics_added}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>عيادات مضافة</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {userProfile.performance_stats.visit_streak}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>سلسلة أيام</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                أيام متتالية مع زيارات
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {userProfile.achievements.length > 0 && (
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🏆</span>
              <span>الإنجازات المحققة</span>
              <span className="bg-blue-500 bg-opacity-20 text-blue-400 px-2 py-1 rounded-full text-sm">
                {userProfile.achievements.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProfile.achievements.map((achievement, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 bg-opacity-20 rounded-lg border border-yellow-500 border-opacity-30">
                  <div className="text-3xl mb-2 text-center">{achievement.icon}</div>
                  <div className="font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
                    {achievement.title}
                  </div>
                  <div className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    {achievement.description}
                  </div>
                  <div className="text-xs text-center mt-2 text-yellow-400">
                    ✨ مفتوح
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Challenges */}
        {userProfile.active_challenges.length > 0 && (
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>التحديات النشطة</span>
            </h3>
            <div className="space-y-4">
              {userProfile.active_challenges.map((challenge, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-20 rounded-lg border border-blue-500 border-opacity-30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{challenge.icon}</span>
                      <div>
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {challenge.title}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {challenge.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-400">
                        +{challenge.reward_points}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        نقطة
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        التقدم: {challenge.current} / {challenge.target}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {challenge.progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, challenge.progress)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      الموعد النهائي: {new Date(challenge.deadline).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Leaderboard View Component
  const LeaderboardView = () => {
    if (!leaderboard) return null;

    return (
      <div className="space-y-6">
        {/* Leaderboard Header */}
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>🏅</span>
              <span>لوحة المتصدرين - {leaderboard.statistics.period_label}</span>
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 glass-effect border border-white border-opacity-20 rounded-lg text-white"
            >
              <option value="all_time">كل الأوقات</option>
              <option value="monthly">هذا الشهر</option>
              <option value="weekly">هذا الأسبوع</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {leaderboard.statistics.total_participants}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                إجمالي المشاركين
              </div>
            </div>
            <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {leaderboard.statistics.highest_score.toLocaleString()}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                أعلى نقاط
              </div>
            </div>
            <div className="text-center p-4 bg-purple-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {leaderboard.statistics.average_points.toLocaleString()}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                متوسط النقاط
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.leaderboard.length >= 3 && (
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-end justify-center gap-4">
              {/* Second Place */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center relative">
                  {leaderboard.leaderboard[1].photo ? (
                    <img 
                      src={`data:image/jpeg;base64,${leaderboard.leaderboard[1].photo}`}
                      alt={leaderboard.leaderboard[1].full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-lg font-bold">
                      {leaderboard.leaderboard[1].full_name.charAt(0)}
                    </span>
                  )}
                  <div className="absolute -top-2 -right-2 text-2xl">🥈</div>
                </div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {leaderboard.leaderboard[1].full_name}
                </div>
                <div className="text-2xl font-bold text-gray-400">
                  {leaderboard.leaderboard[1].total_points.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>نقطة</div>
              </div>

              {/* First Place */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center relative">
                  {leaderboard.leaderboard[0].photo ? (
                    <img 
                      src={`data:image/jpeg;base64,${leaderboard.leaderboard[0].photo}`}
                      alt={leaderboard.leaderboard[0].full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {leaderboard.leaderboard[0].full_name.charAt(0)}
                    </span>
                  )}
                  <div className="absolute -top-3 -right-3 text-3xl">🥇</div>
                </div>
                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {leaderboard.leaderboard[0].full_name}
                </div>
                <div className="text-3xl font-bold text-yellow-400">
                  {leaderboard.leaderboard[0].total_points.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>نقطة</div>
              </div>

              {/* Third Place */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center relative">
                  {leaderboard.leaderboard[2].photo ? (
                    <img 
                      src={`data:image/jpeg;base64,${leaderboard.leaderboard[2].photo}`}
                      alt={leaderboard.leaderboard[2].full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-lg font-bold">
                      {leaderboard.leaderboard[2].full_name.charAt(0)}
                    </span>
                  )}
                  <div className="absolute -top-2 -right-2 text-2xl">🥉</div>
                </div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {leaderboard.leaderboard[2].full_name}
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {leaderboard.leaderboard[2].total_points.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>نقطة</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="glass-effect rounded-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h3 className="text-xl font-bold text-white">
              الترتيب الكامل
            </h3>
          </div>
          <div className="divide-y divide-white divide-opacity-10">
            {leaderboard.leaderboard.map((entry, index) => (
              <div key={entry.user_id} className="p-4 hover:bg-white hover:bg-opacity-5 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Position */}
                  <div className="text-center min-w-[3rem]">
                    <div className="text-2xl font-bold">
                      {getPositionIcon(entry.position)}
                    </div>
                  </div>

                  {/* User Photo */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {entry.photo ? (
                      <img 
                        src={`data:image/jpeg;base64,${entry.photo}`}
                        alt={entry.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {entry.full_name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {entry.full_name}
                      </div>
                      <div className={`text-sm ${getLevelColor(entry.level)}`}>
                        {getLevelIcon(entry.level)} المستوى {entry.level}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-400">
                        🚗 {entry.performance.visits} زيارة
                      </span>
                      <span className="text-green-400">
                        ✅ {entry.performance.effectiveness_rate}% فعالية
                      </span>
                      <span className="text-purple-400">
                        📦 {entry.performance.orders} طلب
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {entry.total_points.toLocaleString()}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      نقطة
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1">
                    {entry.badges.map((badge, badgeIndex) => (
                      <div key={badgeIndex} className="text-lg" title={badge.title}>
                        {badge.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Achievements Catalog View
  const AchievementsView = () => {
    if (!achievements) return null;

    return (
      <div className="space-y-6">
        {/* Achievements Header */}
        <div className="glass-effect p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span>كتالوج الإنجازات</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {achievements.total_achievements}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                إجمالي الإنجازات
              </div>
            </div>
            <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {achievements.categories.length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                الفئات
              </div>
            </div>
            <div className="text-center p-4 bg-purple-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {achievements.total_possible_points.toLocaleString()}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                إجمالي النقاط الممكنة
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                100%
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                من الأداء الحقيقي
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.achievements.map((achievement, index) => (
            <div key={achievement.id} className="glass-effect p-6 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all duration-300 border border-white border-opacity-10">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  {achievement.title}
                </div>
                <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {achievement.description}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    شرط الفتح:
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {achievement.unlock_condition}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    مكافأة النقاط:
                  </span>
                  <span className="text-lg font-bold text-yellow-400">
                    +{achievement.points_reward}
                  </span>
                </div>

                <div className="text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    achievement.category === 'visits' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                    achievement.category === 'effectiveness' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                    achievement.category === 'orders' ? 'bg-purple-500 bg-opacity-20 text-purple-400' :
                    achievement.category === 'clinics' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                    'bg-orange-500 bg-opacity-20 text-orange-400'
                  }`}>
                    {achievement.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gradient">🎮 نظام التحفيز المتكامل</h2>
        <div className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-20 px-4 py-2 rounded-lg">
          <span style={{ color: 'var(--text-secondary)' }}>
            مرتبط بالأداء الحقيقي 💯
          </span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="glass-effect p-2 rounded-xl inline-flex">
        <button
          onClick={() => setActiveView('profile')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'profile'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          👤 ملفي الشخصي
        </button>
        <button
          onClick={() => setActiveView('leaderboard')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'leaderboard'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          🏅 لوحة المتصدرين
        </button>
        <button
          onClick={() => setActiveView('achievements')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'achievements'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          🏆 الإنجازات
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass-effect p-6 rounded-xl animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-600 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(j => (
                    <div key={j} className="h-16 bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeView === 'profile' && <UserProfileView />}
          {activeView === 'leaderboard' && <LeaderboardView />}
          {activeView === 'achievements' && <AchievementsView />}
        </>
      )}
    </div>
  );
}

// Advanced GPS Tracking & Route Management Dashboard
const GPSTrackingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('team'); // team, history, geofence, routes
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeRange, setTimeRange] = useState(24);
  
  // Data states
  const [teamLocations, setTeamLocations] = useState(null);
  const [locationHistory, setLocationHistory] = useState(null);
  const [routeOptimization, setRouteOptimization] = useState(null);
  const [geofenceAlerts, setGeofenceAlerts] = useState([]);
  
  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 30.0444, lng: 31.2357 }); // Cairo default
  const [mapZoom, setMapZoom] = useState(10);
  
  const { language, t } = useLanguage();

  useEffect(() => {
    loadGPSData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadGPSData, 30000);
    return () => clearInterval(interval);
  }, [activeView, selectedUser, timeRange]);

  const loadGPSData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeView === 'team') {
        const response = await axios.get(`${API}/gps/team-locations?include_history_hours=2`, { headers });
        setTeamLocations(response.data);
        
        // Update map center to team average location
        if (response.data.locations.length > 0) {
          const validLocations = response.data.locations.filter(loc => loc.current_location);
          if (validLocations.length > 0) {
            const avgLat = validLocations.reduce((sum, loc) => sum + loc.current_location.latitude, 0) / validLocations.length;
            const avgLng = validLocations.reduce((sum, loc) => sum + loc.current_location.longitude, 0) / validLocations.length;
            setMapCenter({ lat: avgLat, lng: avgLng });
          }
        }
      } else if (activeView === 'history' && selectedUser) {
        const response = await axios.get(`${API}/gps/location-history/${selectedUser}?hours=${timeRange}&include_route=true`, { headers });
        setLocationHistory(response.data);
        
        // Update map to show route
        if (response.data.locations.length > 0) {
          const firstLocation = response.data.locations[0];
          setMapCenter({ lat: firstLocation.latitude, lng: firstLocation.longitude });
        }
      } else if (activeView === 'routes') {
        // Load route optimization data (mock for now)
        setRouteOptimization({
          suggestions: [],
          loading: false
        });
      }
    } catch (error) {
      setError('خطأ في تحميل بيانات GPS');
      console.error('GPS data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'online': 'bg-green-500 text-green-400',
      'inactive': 'bg-yellow-500 text-yellow-400', 
      'offline': 'bg-red-500 text-red-400',
      'no_data': 'bg-gray-500 text-gray-400'
    };
    return colors[status] || colors.no_data;
  };

  const getStatusText = (status) => {
    const texts = {
      'online': 'متصل',
      'inactive': 'غير نشط',
      'offline': 'غير متصل',
      'no_data': 'لا توجد بيانات'
    };
    return texts[status] || texts.no_data;
  };

  // Team Locations View
  const TeamLocationsView = () => {
    if (!teamLocations) return null;

    return (
      <div className="space-y-6">
        {/* Team Summary */}
        <div className="glass-effect p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>👥</span>
            <span>مواقع الفريق المباشرة</span>
            <span className="bg-blue-500 bg-opacity-20 text-blue-400 px-2 py-1 rounded-full text-sm">
              {teamLocations.team_size} عضو
            </span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {teamLocations.online_members}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                متصل حالياً
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {teamLocations.offline_members}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                غير متصل
              </div>
            </div>
            <div className="text-center p-4 bg-red-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {teamLocations.no_data_members}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                لا توجد بيانات
              </div>
            </div>
            <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {teamLocations.locations.reduce((sum, loc) => sum + loc.recent_activity.visits_completed, 0)}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                زيارات اليوم
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamLocations.locations.map((member, index) => (
            <div key={member.user_id} className="glass-effect p-6 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                {/* User Photo */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {member.photo ? (
                      <img 
                        src={`data:image/jpeg;base64,${member.photo}`}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {member.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Status Indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    member.status === 'online' ? 'bg-green-500' :
                    member.status === 'inactive' ? 'bg-yellow-500' :
                    member.status === 'offline' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {member.full_name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    @{member.username}
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)} bg-opacity-20`}>
                    {getStatusText(member.status)}
                  </div>
                </div>
              </div>

              {/* Location Info */}
              {member.current_location ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400">📍</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        الموقع الحالي:
                      </span>
                    </div>
                    <div className="bg-white bg-opacity-5 p-3 rounded-lg text-xs">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {member.current_location.address}
                      </div>
                      <div className="mt-1" style={{ color: 'var(--text-muted)' }}>
                        {member.current_location.latitude.toFixed(4)}, {member.current_location.longitude.toFixed(4)}
                      </div>
                      <div className="mt-1" style={{ color: 'var(--text-muted)' }}>
                        آخر تحديث: منذ {member.minutes_since_update} دقيقة
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-blue-500 bg-opacity-20 p-2 rounded-lg">
                      <div className="text-lg font-bold text-blue-400">
                        {member.recent_activity.location_points}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        نقاط تتبع
                      </div>
                    </div>
                    <div className="bg-green-500 bg-opacity-20 p-2 rounded-lg">
                      <div className="text-lg font-bold text-green-400">
                        {member.recent_activity.visits_completed}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        زيارات اليوم
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(member.user_id);
                        setActiveView('history');
                      }}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      📍 عرض المسار
                    </button>
                    <button
                      onClick={() => {
                        // Open map centered on user location
                        setMapCenter({ 
                          lat: member.current_location.latitude, 
                          lng: member.current_location.longitude 
                        });
                        setMapZoom(15);
                      }}
                      className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      🗺️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">📍</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    لا توجد بيانات موقع
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    يجب تفعيل GPS على الهاتف
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Location History View
  const LocationHistoryView = () => {
    if (!locationHistory) return null;

    return (
      <div className="space-y-6">
        {/* History Header */}
        <div className="glass-effect p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>📍</span>
              <span>مسار {locationHistory.user_info.full_name}</span>
            </h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-4 py-2 glass-effect border border-white border-opacity-20 rounded-lg text-white"
            >
              <option value={2}>آخر ساعتين</option>
              <option value={6}>آخر 6 ساعات</option>
              <option value={12}>آخر 12 ساعة</option>
              <option value={24}>آخر 24 ساعة</option>
              <option value={48}>آخر يومين</option>
            </select>
          </div>

          {/* Route Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {locationHistory.route_statistics.total_points}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                نقاط التتبع
              </div>
            </div>
            <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {locationHistory.route_statistics.total_distance} km
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                المسافة المقطوعة
              </div>
            </div>
            <div className="text-center p-4 bg-purple-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {locationHistory.route_statistics.average_speed} km/h
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                متوسط السرعة
              </div>
            </div>
            <div className="text-center p-4 bg-orange-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {locationHistory.route_statistics.max_speed} km/h
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                أقصى سرعة
              </div>
            </div>
            <div className="text-center p-4 bg-red-500 bg-opacity-20 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {locationHistory.route_statistics.stops.length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                نقاط التوقف
              </div>
            </div>
          </div>
        </div>

        {/* Stops Analysis */}
        {locationHistory.route_statistics.stops.length > 0 && (
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⏱️</span>
              <span>تحليل نقاط التوقف</span>
            </h3>
            <div className="space-y-4">
              {locationHistory.route_statistics.stops.map((stop, index) => (
                <div key={index} className="bg-white bg-opacity-5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {stop.location.address}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-orange-400">
                      {stop.duration_minutes} دقيقة
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>وقت الوصول: </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(stop.start_time).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>وقت المغادرة: </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(stop.end_time).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    📍 {stop.location.latitude.toFixed(4)}, {stop.location.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Timeline */}
        {locationHistory.locations.length > 0 && (
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🕐</span>
              <span>خط زمني للمواقع</span>
            </h3>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {locationHistory.locations.slice(-20).reverse().map((location, index) => (
                <div key={location.id} className="flex items-center gap-4 p-3 bg-white bg-opacity-5 rounded-lg">
                  <div className="text-2xl">
                    {location.activity_type === 'visit' ? '🏥' : 
                     location.calculated_speed > 20 ? '🚗' : 
                     location.calculated_speed > 5 ? '🚶' : '⏸️'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {location.address}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(location.timestamp).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                      {location.calculated_speed > 0 && (
                        <span>🏃 {location.calculated_speed} km/h</span>
                      )}
                      {location.distance_from_last > 0 && (
                        <span>📏 {(location.distance_from_last * 1000).toFixed(0)} متر</span>
                      )}
                      <span>🎯 {location.accuracy}m دقة</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gradient">🗺️ نظام تتبع GPS المتقدم</h2>
        <div className="text-sm bg-gradient-to-r from-green-500 to-blue-500 bg-opacity-20 px-4 py-2 rounded-lg">
          <span style={{ color: 'var(--text-secondary)' }}>
            تحديث مباشر كل 30 ثانية ⚡
          </span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="glass-effect p-2 rounded-xl inline-flex">
        <button
          onClick={() => setActiveView('team')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'team'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          👥 مواقع الفريق
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'history'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          📍 تاريخ المواقع
        </button>
        <button
          onClick={() => setActiveView('geofence')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'geofence'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          🚧 الحدود الجغرافية
        </button>
        <button
          onClick={() => setActiveView('routes')}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'routes'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          🛣️ تحسين المسارات
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass-effect p-6 rounded-xl animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[1,2,3,4].map(j => (
                    <div key={j} className="h-16 bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeView === 'team' && <TeamLocationsView />}
          {activeView === 'history' && (
            selectedUser ? (
              <LocationHistoryView />
            ) : (
              <div className="glass-effect p-12 rounded-xl text-center">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  اختر مستخدماً لعرض مساره
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ارجع لتبويب "مواقع الفريق" واضغط "عرض المسار" لأي عضو
                </p>
                <button
                  onClick={() => setActiveView('team')}
                  className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  العودة لمواقع الفريق
                </button>
              </div>
            )
          )}
          {activeView === 'geofence' && (
            <div className="glass-effect p-12 rounded-xl text-center">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                إدارة الحدود الجغرافية
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                قريباً - إنشاء مناطق مسموحة ومحظورة مع تنبيهات تلقائية
              </p>
            </div>
          )}
          {activeView === 'routes' && (
            <div className="glass-effect p-12 rounded-xl text-center">
              <div className="text-4xl mb-4">🛣️</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                تحسين المسارات الذكي
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                قريباً - اقتراح أفضل المسارات للزيارات بناء على الموقع والوقت
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Main App Component
const App = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, language }) => {
  const t = language === 'ar' ? {
    orderDetails: 'تفاصيل الطلب',
    orderNumber: 'رقم الطلب',
    orderDate: 'تاريخ الطلب',
    orderStatus: 'حالة الطلب',
    salesRep: 'المندوب',
    doctor: 'الطبيب',
    clinic: 'العيادة',
    warehouse: 'المخزن',
    totalAmount: 'المبلغ الإجمالي',
    items: 'المنتجات',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    total: 'الإجمالي',
    notes: 'ملاحظات',
    close: 'إغلاق',
    approved: 'معتمد',
    pending: 'في الانتظار',
    rejected: 'مرفوض'
  } : {
    orderDetails: 'Order Details',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderStatus: 'Order Status',
    salesRep: 'Sales Rep',
    doctor: 'Doctor',
    clinic: 'Clinic',
    warehouse: 'Warehouse',
    totalAmount: 'Total Amount',
    items: 'Items',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    total: 'Total',
    notes: 'Notes',
    close: 'Close',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 bg-opacity-20 text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 bg-opacity-20 text-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 bg-opacity-20 text-red-300';
      default:
        return 'bg-gray-100 bg-opacity-20 text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div className="glass-effect w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-white border-opacity-20 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gradient">
            {t.orderDetails} #{order.id?.slice(-8) || order.order_number}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 hover:bg-opacity-10 rounded-full transition-colors"
          >
            <SVGIcon name="error" size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="space-y-6">
            {/* Order Information */}
            <div className="grid grid-cols-2 gap-8">
              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="reports" size={20} />
                  {t.orderDetails}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.orderNumber}:</span>
                    <span className="font-mono">#{order.id?.slice(-8) || order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.orderDate}:</span>
                    <span>{new Date(order.created_at || order.order_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.orderStatus}:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {t[order.status?.toLowerCase()] || order.status}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="font-bold text-lg">{t.totalAmount}:</span>
                    <span className="font-bold text-lg text-green-500">{order.total_amount} ج.م</span>
                  </div>
                </div>
              </div>

              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="users" size={20} />
                  معلومات الطلب
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.salesRep}:</span>
                    <span>{order.sales_rep_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.doctor}:</span>
                    <span>د. {order.doctor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.clinic}:</span>
                    <span>{order.clinic_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">{t.warehouse}:</span>
                    <span>{order.warehouse_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {order.items && order.items.length > 0 && (
              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="warehouse" size={20} />
                  {t.items} ({order.items.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <th className="text-right py-3 px-4 font-bold">#</th>
                        <th className="text-right py-3 px-4 font-bold">اسم المنتج</th>
                        <th className="text-right py-3 px-4 font-bold">{t.quantity}</th>
                        <th className="text-right py-3 px-4 font-bold">{t.unitPrice}</th>
                        <th className="text-right py-3 px-4 font-bold">{t.total}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index} className="border-b border-opacity-20" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="py-3 px-4 text-center">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{item.product_name}</div>
                            {item.product_description && (
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.product_description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-center">{item.unit_price} ج.م</td>
                          <td className="py-3 px-4 text-center font-bold">
                            {(item.quantity * item.unit_price).toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-blue-500">
                        <td colSpan="4" className="py-3 px-4 text-right font-bold text-lg">
                          {t.totalAmount}:
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-lg text-green-500">
                          {order.total_amount} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="glass-effect p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SVGIcon name="chat" size={20} />
                  {t.notes}
                </h4>
                <p className="text-sm leading-relaxed">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white border-opacity-20 flex justify-end">
          <button
            onClick={onClose}
            className="btn-modern px-6 py-3"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { language } = useLanguage();

  const handleQRScan = async (qrData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/qr/scan`, {
        content: qrData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.action === 'prefill_visit_form') {
        // Navigate to visit registration and prefill
        alert(`تم مسح عيادة: ${response.data.data.name}`);
      } else if (response.data.action === 'add_to_order') {
        // Navigate to order creation and add product
        alert(`تم مسح منتج: ${response.data.data.name}`);
      }
      
      setShowQRScanner(false);
    } catch (error) {
      console.error('QR scan error:', error);
      alert('خطأ في معالجة QR Code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 loading-shimmer rounded-full mx-auto mb-6"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {user ? <Dashboard /> : <LoginPage />}
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner 
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
      
      {/* Offline Status */}
      <OfflineStatus />
      
      {/* Floating QR Scanner Button */}
      {user && (
        <button
          onClick={() => setShowQRScanner(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center justify-center"
          title="مسح QR Code"
        >
          <span className="text-xl">📱</span>
        </button>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          language={language}
        />
      )}
    </div>
  );
};

// Region Management Component

// Region Management Component
const RegionManagement = () => {
  const { t } = useLanguage();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [selectedLine, setSelectedLine] = useState('all');

  useEffect(() => {
    fetchRegions();
  }, [selectedLine]);

  const fetchRegions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = selectedLine !== 'all' ? `?line=${selectedLine}` : '';
      const response = await axios.get(`${API}/admin/regions${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async (regionData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/regions`, regionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRegions();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating region:', error);
      alert('حدث خطأ في إنشاء المنطقة');
    }
  };

  const handleEditRegion = async (regionId, regionData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/regions/${regionId}`, regionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRegions();
      setEditingRegion(null);
    } catch (error) {
      console.error('Error updating region:', error);
      alert('حدث خطأ في تحديث المنطقة');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gradient flex items-center gap-3">
          <span>🗺️</span>
          <span>{t('regionManagement')}</span>
        </h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="glass-effect px-4 py-2 rounded-lg border"
          >
            <option value="all">جميع الخطوط</option>
            <option value="line_1">{t('line1')}</option>
            <option value="line_2">{t('line2')}</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg"
          >
            + إضافة منطقة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="loading-spinner-enhanced mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل المناطق...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <div key={region.id} className="card-glass p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {region.name}
                </h3>
                <span className={`badge-modern ${region.line === 'line_1' ? 'badge-info' : 'badge-warning'}`}>
                  {region.line === 'line_1' ? t('line1') : t('line2')}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span>🏷️</span>
                  <span style={{ color: 'var(--text-secondary)' }}>الكود: {region.code}</span>
                </div>
                
                {region.manager_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>👤</span>
                    <span style={{ color: 'var(--text-secondary)' }}>المدير: {region.manager_name}</span>
                  </div>
                )}

                {region.description && (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {region.description}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>
                    المقاطعات: {region.districts?.length || 0}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    تم الإنشاء: {new Date(region.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingRegion(region)}
                  className="flex-1 px-4 py-2 bg-blue-500 bg-opacity-20 text-blue-400 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  تعديل
                </button>
                <button className="flex-1 px-4 py-2 bg-green-500 bg-opacity-20 text-green-400 rounded-lg hover:bg-opacity-30 transition-colors">
                  إدارة المقاطعات
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Region Modal */}
      {(showCreateModal || editingRegion) && (
        <RegionModal
          region={editingRegion}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRegion(null);
          }}
          onSave={(data) => {
            if (editingRegion) {
              handleEditRegion(editingRegion.id, data);
            } else {
              handleCreateRegion(data);
            }
          }}
        />
      )}
    </div>
  );
};

// Region Modal Component
const RegionModal = ({ region, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: region?.name || '',
    code: region?.code || '',
    description: region?.description || '',
    line: region?.line || 'line_1',
    manager_id: region?.manager_id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-2xl">
        <h3 className="text-2xl font-bold mb-6 text-gradient">
          {region ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">
                اسم المنطقة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-lg glass-effect border"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                كود المنطقة *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-3 rounded-lg glass-effect border"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              الخط
            </label>
            <select
              value={formData.line}
              onChange={(e) => setFormData({...formData, line: e.target.value})}
              className="w-full px-4 py-3 rounded-lg glass-effect border"
            >
              <option value="line_1">الخط الأول</option>
              <option value="line_2">الخط الثاني</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-lg glass-effect border h-24"
              placeholder="وصف اختياري للمنطقة..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg"
            >
              {region ? 'تحديث' : 'إنشاء'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:bg-opacity-10 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Comprehensive Admin Settings Component
const ComprehensiveAdminSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/settings/comprehensive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSystem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/admin/initialize-system`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('تم تهيئة النظام بنجاح!\n' + JSON.stringify(response.data.gm_credentials, null, 2));
      fetchSettings();
    } catch (error) {
      console.error('Error initializing system:', error);
      alert('حدث خطأ في تهيئة النظام');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="loading-spinner-enhanced mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل الإعدادات الشاملة...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: 'analytics' },
    { id: 'users', label: 'إدارة المستخدمين', icon: 'users' },
    { id: 'roles', label: 'الأدوار والصلاحيات', icon: 'security' },
    { id: 'regions', label: 'المناطق والخطوط', icon: 'regions' },
    { id: 'products', label: 'إدارة المنتجات', icon: 'products' },
    { id: 'gps', label: 'نظام GPS', icon: 'gps' },
    { id: 'maps', label: 'خرائط جوجل', icon: 'maps' },
    { id: 'gamification', label: 'نظام الألعاب', icon: 'gamification' },
    { id: 'accounting', label: 'نظام المحاسبة', icon: 'accounting' },
    { id: 'notifications', label: 'نظام الإشعارات', icon: 'notifications' },
    { id: 'visits', label: 'نظام الزيارات', icon: 'visits' },
    { id: 'reports', label: 'التقارير', icon: 'reports' },
    { id: 'themes', label: 'الألوان والثيمات', icon: 'theme' },
    { id: 'languages', label: 'إعدادات اللغة', icon: 'language' },
    { id: 'website', label: 'إعدادات الموقع', icon: 'settings' },
    { id: 'performance', label: 'مراقبة الأداء', icon: 'performance' },
    { id: 'system', label: 'صحة النظام', icon: 'settings' },
    { id: 'security', label: 'إعدادات الأمان', icon: 'security' },
    { id: 'features', label: 'تحكم المميزات', icon: 'features' },
    { id: 'initialize', label: 'تهيئة النظام', icon: 'settings' }
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gradient flex items-center gap-3">
          <span>⚙️</span>
          <span>{t('comprehensiveSettings')}</span>
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'glass-effect hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <SVGIcon name={tab.icon} size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="card-glass p-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-gradient mb-1">
                {settings?.total_users || 0}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                إجمالي المستخدمين
              </div>
            </div>

            <div className="card-glass p-6 text-center">
              <div className="text-3xl mb-2">🗺️</div>
              <div className="text-2xl font-bold text-gradient mb-1">
                {(settings?.line_statistics?.line_1?.regions || 0) + (settings?.line_statistics?.line_2?.regions || 0)}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                إجمالي المناطق
              </div>
            </div>

            <div className="card-glass p-6 text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-gradient mb-1">
                {(settings?.line_statistics?.line_1?.products || 0) + (settings?.line_statistics?.line_2?.products || 0)}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                إجمالي المنتجات
              </div>
            </div>

            <div className="card-glass p-6 text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-gradient mb-1">
                {Object.keys(settings?.available_roles || {}).length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                الأدوار المتاحة
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <AdminUserManagement />
        )}

        {activeTab === 'roles' && (
          <AdminRoleManagement />
        )}

        {activeTab === 'regions' && (
          <AdminRegionManagement />
        )}

        {activeTab === 'products' && (
          <AdminProductManagement />
        )}

        {activeTab === 'gps' && (
          <AdminGPSSettings />
        )}

        {activeTab === 'maps' && (
          <AdminGoogleMapsSettings />
        )}

        {activeTab === 'website' && (
          <AdminWebsiteSettings />
        )}

        {activeTab === 'performance' && (
          <AdminPerformanceMonitor />
        )}

        {activeTab === 'gamification' && (
          <AdminGamificationSettings />
        )}

        {activeTab === 'accounting' && (
          <AdminAccountingSettings />
        )}

        {activeTab === 'notifications' && (
          <AdminNotificationSettings />
        )}

        {activeTab === 'visits' && (
          <AdminVisitSettings />
        )}

        {activeTab === 'reports' && (
          <AdminReportSettings />
        )}

        {activeTab === 'themes' && (
          <AdminThemeSettings />
        )}

        {activeTab === 'languages' && (
          <AdminLanguageSettings />
        )}

        {activeTab === 'security' && (
          <AdminSecuritySettings />
        )}

        {activeTab === 'features' && (
          <AdminFeatureToggle />
        )}

        {activeTab === 'initialize' && (
          <div className="card-glass p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gradient mb-4">تهيئة النظام</h3>
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              هذا الإجراء سيقوم بإنشاء مستخدم المدير العام الافتراضي وبيانات تجريبية للنظام
            </p>
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ تأكد من أن هذا هو أول استخدام للنظام. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <button
              onClick={initializeSystem}
              className="btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 text-lg rounded-lg"
            >
              🚀 تهيئة النظام الآن
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Admin User Management Component
const AdminUserManagement = () => {
  const [settings, setSettings] = useState({
    enableUserRegistration: true,
    requireEmailVerification: false,
    defaultUserRole: 'medical_rep',
    maxUsersPerRole: {
      gm: 1,
      line_manager: 10,
      area_manager: 50,
      district_manager: 100,
      key_account: 200,
      medical_rep: 1000
    },
    userSessionTimeout: 24, // hours
    allowMultipleLogins: false,
    passwordExpiry: 90, // days
    enableTwoFactor: false
  });

  const updateSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/settings/user-management`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(newSettings);
      alert('تم تحديث إعدادات إدارة المستخدمين');
    } catch (error) {
      console.error('Error updating user settings:', error);
      alert('حدث خطأ في تحديث الإعدادات');
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gradient">إعدادات إدارة المستخدمين</h3>
      
      {/* General User Settings */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">الإعدادات العامة</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">السماح بالتسجيل</div>
              <div className="text-sm text-gray-400">السماح للمستخدمين الجدد بالتسجيل</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableUserRegistration}
                onChange={(e) => setSettings({...settings, enableUserRegistration: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">التحقق من البريد الإلكتروني</div>
              <div className="text-sm text-gray-400">طلب تأكيد البريد الإلكتروني</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">تسجيل دخول متعدد</div>
              <div className="text-sm text-gray-400">السماح بتسجيل الدخول من أجهزة متعددة</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.allowMultipleLogins}
                onChange={(e) => setSettings({...settings, allowMultipleLogins: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">المصادقة الثنائية</div>
              <div className="text-sm text-gray-400">تفعيل المصادقة الثنائية للأمان</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableTwoFactor}
                onChange={(e) => setSettings({...settings, enableTwoFactor: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Role Limits */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">حدود الأدوار</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(settings.maxUsersPerRole).map(([role, limit]) => (
            <div key={role} className="p-4 border rounded-lg">
              <label className="font-bold block mb-2">{role.replace('_', ' ')}</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setSettings({
                  ...settings,
                  maxUsersPerRole: {
                    ...settings.maxUsersPerRole,
                    [role]: parseInt(e.target.value)
                  }
                })}
                className="w-full p-2 border rounded-lg glass-effect"
                min="1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Session Settings */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">إعدادات الجلسة</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="font-bold block mb-2">مهلة الجلسة (ساعات)</label>
            <input
              type="number"
              value={settings.userSessionTimeout}
              onChange={(e) => setSettings({...settings, userSessionTimeout: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg glass-effect"
              min="1"
              max="168"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">انتهاء كلمة المرور (أيام)</label>
            <input
              type="number"
              value={settings.passwordExpiry}
              onChange={(e) => setSettings({...settings, passwordExpiry: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg glass-effect"
              min="30"
              max="365"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">الدور الافتراضي</label>
            <select
              value={settings.defaultUserRole}
              onChange={(e) => setSettings({...settings, defaultUserRole: e.target.value})}
              className="w-full p-2 border rounded-lg glass-effect"
            >
              <option value="medical_rep">مندوب طبي</option>
              <option value="key_account">حساب رئيسي</option>
              <option value="district_manager">مدير مقاطعة</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={() => updateSettings(settings)}
        className="w-full btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg"
      >
        💾 حفظ إعدادات المستخدمين
      </button>
    </div>
  );
};

// Admin GPS Settings Component
const AdminGPSSettings = () => {
  const [settings, setSettings] = useState({
    enableGPSTracking: true,
    trackingInterval: 30, // seconds
    geofenceRadius: 100, // meters
    enableGeofencing: true,
    enableRouteOptimization: true,
    maxLocationHistory: 30, // days
    enableOfflineMode: true,
    accuracyThreshold: 10, // meters
    batteryOptimization: true,
    enableLocationSharing: true
  });

  const updateSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/settings/gps`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(newSettings);
      alert('تم تحديث إعدادات GPS');
    } catch (error) {
      console.error('Error updating GPS settings:', error);
      alert('حدث خطأ في تحديث إعدادات GPS');
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gradient">إعدادات نظام GPS</h3>
      
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">الإعدادات الأساسية</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">تفعيل تتبع GPS</div>
              <div className="text-sm text-gray-400">السماح بتتبع مواقع المستخدمين</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableGPSTracking}
                onChange={(e) => setSettings({...settings, enableGPSTracking: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">تفعيل السياج الجغرافي</div>
              <div className="text-sm text-gray-400">إرسال تنبيهات عند دخول/خروج المناطق</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableGeofencing}
                onChange={(e) => setSettings({...settings, enableGeofencing: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">تحسين المسارات</div>
              <div className="text-sm text-gray-400">تحسين المسارات تلقائياً</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableRouteOptimization}
                onChange={(e) => setSettings({...settings, enableRouteOptimization: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-bold">الوضع غير المتصل</div>
              <div className="text-sm text-gray-400">حفظ البيانات محلياً عند انقطاع الإنترنت</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enableOfflineMode}
                onChange={(e) => setSettings({...settings, enableOfflineMode: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">الإعدادات المتقدمة</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="font-bold block mb-2">فترة التتبع (ثانية)</label>
            <input
              type="number"
              value={settings.trackingInterval}
              onChange={(e) => setSettings({...settings, trackingInterval: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg glass-effect"
              min="10"
              max="300"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">نطاق السياج (متر)</label>
            <input
              type="number"
              value={settings.geofenceRadius}
              onChange={(e) => setSettings({...settings, geofenceRadius: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg glass-effect"
              min="50"
              max="1000"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">حفظ المواقع (أيام)</label>
            <input
              type="number"
              value={settings.maxLocationHistory}
              onChange={(e) => setSettings({...settings, maxLocationHistory: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg glass-effect"
              min="7"
              max="365"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">دقة الموقع (متر)</label>
            <input
              type="number"
              value={settings.accuracyThreshold}
              onChange={(e) => setSettings({...settings, accuracyThreshold: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg glass-effect"
              min="5"
              max="100"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => updateSettings(settings)}
        className="w-full btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg"
      >
        🗺️ حفظ إعدادات GPS
      </button>
    </div>
  );
};

// Admin Theme Settings Component
const AdminThemeSettings = () => {
  const [settings, setSettings] = useState({
    availableThemes: ['dark', 'light', 'modern', 'fancy', 'cyber', 'sunset', 'ocean', 'forest', 'minimal'],
    defaultTheme: 'dark',
    allowUserThemeChange: true,
    customPrimaryColor: '#3b82f6',
    customSecondaryColor: '#8b5cf6',
    enableCustomColors: false,
    companyLogo: '',
    companyName: 'EP Group System',
    enableAnimations: true,
    enableGlassEffects: true
  });

  const updateSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/settings/theme`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(newSettings);
      alert('تم تحديث إعدادات الثيمات');
    } catch (error) {
      console.error('Error updating theme settings:', error);
      alert('حدث خطأ في تحديث إعدادات الثيمات');
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gradient">إعدادات الثيمات والألوان</h3>
      
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">الثيمات المتاحة</h4>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {settings.availableThemes.map((theme) => (
            <div key={theme} className="p-4 border rounded-lg text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-2 theme-preview theme-${theme}`}></div>
              <div className="font-bold">{theme}</div>
              <label className="flex items-center justify-center mt-2">
                <input
                  type="radio"
                  name="defaultTheme"
                  checked={settings.defaultTheme === theme}
                  onChange={() => setSettings({...settings, defaultTheme: theme})}
                  className="mr-2"
                />
                افتراضي
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">إعدادات الشركة</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="font-bold block mb-2">اسم الشركة</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              className="w-full p-2 border rounded-lg glass-effect"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">شعار الشركة</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => setSettings({...settings, companyLogo: e.target.result});
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full p-2 border rounded-lg glass-effect"
            />
          </div>
        </div>
      </div>

      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">الألوان المخصصة</h4>
        <div className="flex items-center justify-between mb-4">
          <span>تفعيل الألوان المخصصة</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enableCustomColors}
              onChange={(e) => setSettings({...settings, enableCustomColors: e.target.checked})}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        {settings.enableCustomColors && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="font-bold block mb-2">اللون الأساسي</label>
              <input
                type="color"
                value={settings.customPrimaryColor}
                onChange={(e) => setSettings({...settings, customPrimaryColor: e.target.value})}
                className="w-full h-12 border rounded-lg"
              />
            </div>

            <div>
              <label className="font-bold block mb-2">اللون الثانوي</label>
              <input
                type="color"
                value={settings.customSecondaryColor}
                onChange={(e) => setSettings({...settings, customSecondaryColor: e.target.value})}
                className="w-full h-12 border rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => updateSettings(settings)}
        className="w-full btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg"
      >
        🎨 حفظ إعدادات الثيمات
      </button>
    </div>
  );
};

// Additional Admin Components for Comprehensive Control
const AdminRoleManagement = () => {
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const updateRolePermissions = async (role, permissions) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/roles/${role}/permissions`, {
        permissions: permissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`تم تحديث صلاحيات ${role}`);
    } catch (error) {
      console.error('Error updating role permissions:', error);
      alert('حدث خطأ في تحديث الصلاحيات');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gradient">إدارة الأدوار والصلاحيات</h3>
      
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">صلاحيات الأدوار</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-4">الدور</th>
                <th className="text-center p-4">إدارة المستخدمين</th>
                <th className="text-center p-4">إدارة المناطق</th>
                <th className="text-center p-4">إدارة المنتجات</th>
                <th className="text-center p-4">نظام GPS</th>
                <th className="text-center p-4">التقارير</th>
                <th className="text-center p-4">المحاسبة</th>
              </tr>
            </thead>
            <tbody>
              {['gm', 'admin', 'line_manager', 'area_manager', 'district_manager', 'key_account', 'medical_rep'].map((role) => (
                <tr key={role} className="border-b">
                  <td className="p-4 font-bold">{role}</td>
                  <td className="text-center p-4">
                    <input type="checkbox" defaultChecked={['gm', 'admin', 'line_manager'].includes(role)} />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" defaultChecked={['gm', 'admin', 'line_manager', 'area_manager'].includes(role)} />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" defaultChecked={['gm', 'admin'].includes(role)} />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" defaultChecked={true} />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" defaultChecked={!['medical_rep'].includes(role)} />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" defaultChecked={['gm', 'admin', 'accounting'].includes(role)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminNotificationSettings = () => {
  const [settings, setSettings] = useState({
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enablePushNotifications: true,
    notificationTypes: {
      visit_approved: true,
      visit_rejected: true,
      new_order: true,
      user_registered: true,
      gps_alert: true,
      system_maintenance: true
    },
    retentionDays: 30,
    maxNotificationsPerDay: 50
  });

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gradient">إعدادات نظام الإشعارات</h3>
      
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">الإعدادات العامة</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries({
            enableNotifications: 'تفعيل الإشعارات',
            enableEmailNotifications: 'إشعارات البريد الإلكتروني',
            enableSMSNotifications: 'إشعارات الرسائل النصية',
            enablePushNotifications: 'الإشعارات المنبثقة'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
              <span>{label}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">أنواع الإشعارات</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(settings.notificationTypes).map(([type, enabled]) => (
            <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
              <span>{type.replace('_', ' ')}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificationTypes: {
                      ...settings.notificationTypes,
                      [type]: e.target.checked
                    }
                  })}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminLanguageSettings = () => {
  const [settings, setSettings] = useState({
    defaultLanguage: 'ar',
    enableLanguageSwitching: true,
    availableLanguages: ['ar', 'en'],
    rtlSupport: true,
    autoDetectLanguage: false,
    translateUserContent: false
  });

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gradient">إعدادات اللغة</h3>
      
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">إعدادات اللغة الأساسية</h4>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block font-bold mb-2">اللغة الافتراضية</label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => setSettings({...settings, defaultLanguage: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-4">
            {[
              ['enableLanguageSwitching', 'السماح بتبديل اللغة'],
              ['rtlSupport', 'دعم اللغات من اليمين لليسار'],
              ['autoDetectLanguage', 'اكتشاف اللغة تلقائياً'],
              ['translateUserContent', 'ترجمة محتوى المستخدمين']
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{label}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminSecuritySettings = () => {
  const [settings, setSettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    enableIPWhitelist: false,
    allowedIPs: [],
    enableAuditLog: true,
    logRetentionDays: 90
  });

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gradient">إعدادات الأمان</h3>
      
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">سياسة كلمات المرور</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block font-bold mb-2">الحد الأدنى لطول كلمة المرور</label>
            <input
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg glass-effect"
              min="6"
              max="32"
            />
          </div>

          <div className="space-y-3">
            {[
              ['requireSpecialChars', 'رموز خاصة مطلوبة'],
              ['requireNumbers', 'أرقام مطلوبة'],
              ['requireUppercase', 'أحرف كبيرة مطلوبة']
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{label}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">إعدادات الجلسة والدخول</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block font-bold mb-2">مهلة الجلسة (ساعات)</label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg glass-effect"
              min="1"
              max="168"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">محاولات الدخول القصوى</label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg glass-effect"
              min="3"
              max="10"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">حفظ السجلات (أيام)</label>
            <input
              type="number"
              value={settings.logRetentionDays}
              onChange={(e) => setSettings({...settings, logRetentionDays: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg glass-effect"
              min="30"
              max="365"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Toggle Component
const AdminFeatureToggle = () => {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/features/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatures(response.data);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName, enabled) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/features/toggle`, {
        feature_name: featureName,
        enabled: enabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFeatures({...features, [featureName]: enabled});
      alert(`تم ${enabled ? 'تفعيل' : 'إلغاء'} ميزة ${featureName}`);
    } catch (error) {
      console.error('Error toggling feature:', error);
      alert('حدث خطأ في تغيير حالة الميزة');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner-enhanced mx-auto mb-4"></div>
        <p>جاري تحميل المميزات...</p>
      </div>
    );
  }

  const featureLabels = {
    gps_tracking: 'نظام تتبع GPS',
    gamification: 'نظام الألعاب',
    visit_management: 'إدارة الزيارات',
    accounting_system: 'نظام المحاسبة',
    notifications: 'نظام الإشعارات',
    analytics: 'التحليلات المتقدمة',
    user_registration: 'تسجيل المستخدمين',
    theme_switching: 'تبديل الثيمات',
    language_switching: 'تبديل اللغات'
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gradient">تحكم في مميزات النظام</h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(features).map(([featureName, enabled]) => (
          <div key={featureName} className="card-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">{featureLabels[featureName] || featureName}</h4>
              <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {enabled ? 'مفعل' : 'معطل'}
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggleFeature(featureName, e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Google Maps Management Component
const AdminGoogleMapsSettings = () => {
  const [settings, setSettings] = useState({
    google_maps_api_key: '',
    enable_geocoding: true,
    enable_directions: true,
    enable_places: true,
    default_map_center: { lat: 30.0444, lng: 31.2357 }, // Cairo
    default_zoom_level: 10,
    map_style: 'roadmap',
    enable_traffic_layer: false,
    enable_satellite_view: true,
    enable_street_view: true,
    marker_clustering: true,
    enable_drawing_tools: false,
    enable_heatmaps: false,
    restrict_to_country: 'EG',
    language: 'ar',
    region: 'EG',
    libraries: ['places', 'geometry', 'drawing'],
    google_analytics_id: '',
    enable_google_drive_backup: false,
    google_drive_credentials: ''
  });

  const [apiKeyTest, setApiKeyTest] = useState({ status: '', message: '' });
  const [servicesStatus, setServicesStatus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchServicesStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/settings/google-maps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings({ ...settings, ...response.data });
    } catch (error) {
      console.error('Error fetching Google Maps settings:', error);
    }
  };

  const fetchServicesStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/google-services-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServicesStatus(response.data);
    } catch (error) {
      console.error('Error fetching services status:', error);
    }
  };

  const testApiKey = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/admin/test-google-maps-api`, {
        api_key: settings.google_maps_api_key
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeyTest(response.data);
    } catch (error) {
      setApiKeyTest({ status: 'error', message: 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/settings/google-maps`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('تم تحديث إعدادات خرائط جوجل بنجاح');
      fetchServicesStatus();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('حدث خطأ في تحديث الإعدادات');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient flex items-center gap-3">
          <SVGIcon name="maps" size={32} />
          إعدادات خرائط جوجل والخدمات
        </h3>
        <div className="flex gap-2">
          <button
            onClick={testApiKey}
            disabled={loading || !settings.google_maps_api_key}
            className="btn-modern bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? '⏳ جاري الاختبار...' : '🧪 اختبار المفتاح'}
          </button>
          <button
            onClick={updateSettings}
            className="btn-modern bg-green-500 text-white px-6 py-2 rounded-lg"
          >
            💾 حفظ الإعدادات
          </button>
        </div>
      </div>

      {/* API Key Status Display */}
      {apiKeyTest.message && (
        <div className={`p-4 rounded-lg border ${apiKeyTest.status === 'success' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
          <div className="flex items-center gap-2">
            <SVGIcon name={apiKeyTest.status === 'success' ? 'success' : 'error'} size={20} />
            <span>{apiKeyTest.message}</span>
          </div>
        </div>
      )}

      {/* Services Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(servicesStatus).map(([service, status]) => (
          <div key={service} className="card-glass p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold capitalize">{service.replace('_', ' ')}</h4>
              <div className={`w-3 h-3 rounded-full ${status.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-sm space-y-1">
              {Object.entries(status).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key.replace('_', ' ')}</span>
                  <span className={value ? 'text-green-400' : 'text-red-400'}>
                    {value ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Google Maps API Configuration */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="maps" size={24} />
          إعدادات Google Maps API
        </h4>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block font-bold mb-2">Google Maps API Key *</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={settings.google_maps_api_key}
                onChange={(e) => setSettings({...settings, google_maps_api_key: e.target.value})}
                className="flex-1 p-3 border rounded-lg glass-effect"
                placeholder="AIzaSy... أدخل مفتاح API"
              />
              <button
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                title="فتح Google Cloud Console"
              >
                🔗
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              احصل على مفتاح API من Google Cloud Console وفعّل APIs: Maps JavaScript, Geocoding, Directions, Places
            </p>
          </div>

          <div>
            <label className="block font-bold mb-2">المركز الافتراضي للخريطة</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.000001"
                value={settings.default_map_center.lat}
                onChange={(e) => setSettings({
                  ...settings, 
                  default_map_center: { ...settings.default_map_center, lat: parseFloat(e.target.value) }
                })}
                className="p-3 border rounded-lg glass-effect"
                placeholder="خط العرض"
              />
              <input
                type="number"
                step="0.000001"
                value={settings.default_map_center.lng}
                onChange={(e) => setSettings({
                  ...settings, 
                  default_map_center: { ...settings.default_map_center, lng: parseFloat(e.target.value) }
                })}
                className="p-3 border rounded-lg glass-effect"
                placeholder="خط الطول"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2">مستوى التكبير الافتراضي</label>
            <input
              type="range"
              min="1"
              max="20"
              value={settings.default_zoom_level}
              onChange={(e) => setSettings({...settings, default_zoom_level: parseInt(e.target.value)})}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-400">المستوى: {settings.default_zoom_level}</div>
          </div>

          <div>
            <label className="block font-bold mb-2">نوع الخريطة</label>
            <select
              value={settings.map_style}
              onChange={(e) => setSettings({...settings, map_style: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            >
              <option value="roadmap">خريطة عادية</option>
              <option value="satellite">صور جوية</option>
              <option value="hybrid">مختلطة</option>
              <option value="terrain">تضاريس</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">تقييد البلد</label>
            <select
              value={settings.restrict_to_country}
              onChange={(e) => setSettings({...settings, restrict_to_country: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            >
              <option value="">بدون تقييد</option>
              <option value="EG">مصر</option>
              <option value="SA">السعودية</option>
              <option value="AE">الإمارات</option>
              <option value="KW">الكويت</option>
              <option value="QA">قطر</option>
              <option value="BH">البحرين</option>
              <option value="OM">عمان</option>
            </select>
          </div>
        </div>

        {/* Google Maps Features */}
        <div className="mt-6">
          <h5 className="font-bold mb-4">المميزات المتاحة</h5>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['enable_geocoding', 'تحويل العناوين لإحداثيات'],
              ['enable_directions', 'الاتجاهات والمسارات'],
              ['enable_places', 'البحث عن الأماكن'],
              ['enable_traffic_layer', 'طبقة حركة المرور'],
              ['enable_satellite_view', 'العرض الجوي'],
              ['enable_street_view', 'عرض الشارع'],
              ['marker_clustering', 'تجميع العلامات'],
              ['enable_drawing_tools', 'أدوات الرسم'],
              ['enable_heatmaps', 'خرائط الحرارة']
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{label}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Google Analytics Integration */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="analytics" size={24} />
          تكامل Google Analytics
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block font-bold mb-2">معرف Google Analytics</label>
            <input
              type="text"
              value={settings.google_analytics_id}
              onChange={(e) => setSettings({...settings, google_analytics_id: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
              placeholder="G-XXXXXXXXXX أو UA-XXXXXXXXX"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => window.open('https://analytics.google.com/', '_blank')}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              📊 فتح Google Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Google Drive Backup */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="scanner" size={24} />
          نسخ احتياطي Google Drive
        </h4>
        
        <div className="flex items-center justify-between mb-4">
          <span>تفعيل النسخ الاحتياطي التلقائي</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enable_google_drive_backup}
              onChange={(e) => setSettings({...settings, enable_google_drive_backup: e.target.checked})}
            />
            <span className="slider"></span>
          </label>
        </div>

        {settings.enable_google_drive_backup && (
          <div>
            <label className="block font-bold mb-2">Google Drive Service Account Credentials (JSON)</label>
            <textarea
              value={settings.google_drive_credentials}
              onChange={(e) => setSettings({...settings, google_drive_credentials: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect h-32"
              placeholder="ألصق محتوى ملف service account JSON هنا..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Website Configuration Management Component
const AdminWebsiteSettings = () => {
  const [config, setConfig] = useState({
    site_name: 'EP Group System',
    site_description: 'نظام إدارة شامل للمؤسسات',
    site_keywords: 'إدارة, مؤسسات, نظام, EP Group',
    favicon_url: '',
    logo_url: '',
    contact_email: 'info@epgroup.com',
    contact_phone: '+20123456789',
    address: 'القاهرة، مصر',
    social_links: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: ''
    },
    seo_settings: {
      enable_seo: true,
      meta_robots: 'index,follow',
      canonical_url: '',
      og_image: '',
      twitter_card: 'summary_large_image'
    },
    performance_settings: {
      enable_caching: true,
      cache_duration: 3600,
      enable_compression: true,
      lazy_loading: true,
      minify_assets: true
    },
    security_settings: {
      enable_https_redirect: true,
      enable_csp: true,
      enable_hsts: true,
      session_timeout: 1440
    }
  });

  const updateConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/settings/website-config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('تم تحديث إعدادات الموقع بنجاح');
    } catch (error) {
      console.error('Error updating website config:', error);
      alert('حدث خطأ في تحديث إعدادات الموقع');
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/admin/settings/website-config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConfig({ ...config, ...response.data });
      } catch (error) {
        console.error('Error fetching website config:', error);
      }
    };
    fetchConfig();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient flex items-center gap-3">
          <SVGIcon name="settings" size={32} />
          إعدادات الموقع الشاملة
        </h3>
        <button
          onClick={updateConfig}
          className="btn-modern bg-green-500 text-white px-6 py-2 rounded-lg"
        >
          💾 حفظ التكوين
        </button>
      </div>

      {/* Basic Site Information */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="language" size={24} />
          المعلومات الأساسية للموقع
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block font-bold mb-2">اسم الموقع</label>
            <input
              type="text"
              value={config.site_name}
              onChange={(e) => setConfig({...config, site_name: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">البريد الإلكتروني للتواصل</label>
            <input
              type="email"
              value={config.contact_email}
              onChange={(e) => setConfig({...config, contact_email: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold mb-2">وصف الموقع</label>
            <textarea
              value={config.site_description}
              onChange={(e) => setConfig({...config, site_description: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect h-24"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">رقم الهاتف</label>
            <input
              type="tel"
              value={config.contact_phone}
              onChange={(e) => setConfig({...config, contact_phone: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">العنوان</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({...config, address: e.target.value})}
              className="w-full p-3 border rounded-lg glass-effect"
            />
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="analytics" size={24} />
          إعدادات تحسين محركات البحث (SEO)
        </h4>
        
        <div className="flex items-center justify-between mb-4">
          <span>تفعيل تحسين محركات البحث</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.seo_settings.enable_seo}
              onChange={(e) => setConfig({
                ...config,
                seo_settings: { ...config.seo_settings, enable_seo: e.target.checked }
              })}
            />
            <span className="slider"></span>
          </label>
        </div>

        {config.seo_settings.enable_seo && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block font-bold mb-2">الكلمات المفتاحية</label>
              <input
                type="text"
                value={config.site_keywords}
                onChange={(e) => setConfig({...config, site_keywords: e.target.value})}
                className="w-full p-3 border rounded-lg glass-effect"
                placeholder="كلمة1, كلمة2, كلمة3"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">إعدادات الروبوتات</label>
              <select
                value={config.seo_settings.meta_robots}
                onChange={(e) => setConfig({
                  ...config,
                  seo_settings: { ...config.seo_settings, meta_robots: e.target.value }
                })}
                className="w-full p-3 border rounded-lg glass-effect"
              >
                <option value="index,follow">فهرسة وتتبع</option>
                <option value="index,nofollow">فهرسة بدون تتبع</option>
                <option value="noindex,follow">بدون فهرسة مع تتبع</option>
                <option value="noindex,nofollow">بدون فهرسة أو تتبع</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-2">رابط canonical</label>
              <input
                type="url"
                value={config.seo_settings.canonical_url}
                onChange={(e) => setConfig({
                  ...config,
                  seo_settings: { ...config.seo_settings, canonical_url: e.target.value }
                })}
                className="w-full p-3 border rounded-lg glass-effect"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">صورة Open Graph</label>
              <input
                type="url"
                value={config.seo_settings.og_image}
                onChange={(e) => setConfig({
                  ...config,
                  seo_settings: { ...config.seo_settings, og_image: e.target.value }
                })}
                className="w-full p-3 border rounded-lg glass-effect"
                placeholder="رابط الصورة"
              />
            </div>
          </div>
        )}
      </div>

      {/* Social Media Links */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="chat" size={24} />
          روابط وسائل التواصل الاجتماعي
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(config.social_links).map(([platform, url]) => (
            <div key={platform}>
              <label className="block font-bold mb-2 capitalize">{platform}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setConfig({
                  ...config,
                  social_links: { ...config.social_links, [platform]: e.target.value }
                })}
                className="w-full p-3 border rounded-lg glass-effect"
                placeholder={`رابط ${platform}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Performance Settings */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <SVGIcon name="performance" size={24} />
          إعدادات الأداء
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['enable_caching', 'تفعيل التخزين المؤقت'],
            ['enable_compression', 'ضغط الملفات'],
            ['lazy_loading', 'التحميل المتأخر'],
            ['minify_assets', 'تصغير الملفات']
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
              <span>{label}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={config.performance_settings[key]}
                  onChange={(e) => setConfig({
                    ...config,
                    performance_settings: {
                      ...config.performance_settings,
                      [key]: e.target.checked
                    }
                  })}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block font-bold mb-2">مدة التخزين المؤقت (ثانية)</label>
          <input
            type="number"
            value={config.performance_settings.cache_duration}
            onChange={(e) => setConfig({
              ...config,
              performance_settings: {
                ...config.performance_settings,
                cache_duration: parseInt(e.target.value)
              }
            })}
            className="w-full p-3 border rounded-lg glass-effect"
            min="300"
            max="86400"
          />
        </div>
      </div>
    </div>
  );
};

// System Performance Monitoring Component
const AdminPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/settings/performance-metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner-enhanced mx-auto mb-4"></div>
        <p>جاري تحميل مقاييس الأداء...</p>
      </div>
    );
  }

  if (!metrics || metrics.error) {
    return (
      <div className="text-center py-8">
        <SVGIcon name="error" size={48} className="mx-auto mb-4 text-red-500" />
        <p>خطأ في تحميل مقاييس الأداء</p>
        <button onClick={fetchMetrics} className="btn-modern mt-4">إعادة المحاولة</button>
      </div>
    );
  }

  const getPerformanceColor = (percentage) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient flex items-center gap-3">
          <SVGIcon name="performance" size={32} />
          مراقبة أداء النظام
        </h3>
        <button
          onClick={fetchMetrics}
          className="btn-modern bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          🔄 تحديث
        </button>
      </div>

      {/* System Performance */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">أداء النظام</h4>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(metrics.system_performance.cpu_usage_percent)}`}>
              {metrics.system_performance.cpu_usage_percent}%
            </div>
            <div className="text-sm text-gray-400">استخدام المعالج</div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(metrics.system_performance.memory_usage_percent)}`}>
              {metrics.system_performance.memory_usage_percent}%
            </div>
            <div className="text-sm text-gray-400">استخدام الذاكرة</div>
            <div className="text-xs text-gray-500">
              {metrics.system_performance.memory_used_gb}GB / {metrics.system_performance.memory_total_gb}GB
            </div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(metrics.system_performance.disk_usage_percent)}`}>
              {metrics.system_performance.disk_usage_percent}%
            </div>
            <div className="text-sm text-gray-400">استخدام القرص</div>
            <div className="text-xs text-gray-500">
              متاح: {metrics.system_performance.disk_free_gb}GB
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {Math.round(metrics.application_metrics.uptime_hours)}h
            </div>
            <div className="text-sm text-gray-400">وقت التشغيل</div>
          </div>
        </div>
      </div>

      {/* Database Performance */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">أداء قاعدة البيانات</h4>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {metrics.database_performance.collections_count}
            </div>
            <div className="text-sm text-gray-400">المجموعات</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {metrics.database_performance.data_size_mb}MB
            </div>
            <div className="text-sm text-gray-400">حجم البيانات</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {metrics.database_performance.index_size_mb}MB
            </div>
            <div className="text-sm text-gray-400">حجم الفهارس</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {metrics.database_performance.storage_size_mb}MB
            </div>
            <div className="text-sm text-gray-400">التخزين الكلي</div>
          </div>
        </div>
      </div>

      {/* Application Metrics */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-bold mb-4">مقاييس التطبيق</h4>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {metrics.application_metrics.active_users}
            </div>
            <div className="text-sm text-gray-400">المستخدمون النشطون</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {metrics.application_metrics.visits_today}
            </div>
            <div className="text-sm text-gray-400">زيارات اليوم</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              99.9%
            </div>
            <div className="text-sm text-gray-400">معدل التوفر</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Warehouse Management Component
const EnhancedWarehouseManagement = () => {
  const { t } = useLanguage();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchUsers();
    fetchAnalytics();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.filter(user => user.role === 'warehouse_manager'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/warehouses/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleCreateWarehouse = async (warehouseData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/warehouses`, warehouseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWarehouses();
      await fetchAnalytics();
      setShowCreateModal(false);
      alert('تم إنشاء المخزن بنجاح');
    } catch (error) {
      console.error('Error creating warehouse:', error);
      alert('حدث خطأ في إنشاء المخزن');
    }
  };

  const handleEditWarehouse = async (warehouseId, warehouseData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/warehouses/${warehouseId}`, warehouseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWarehouses();
      setEditingWarehouse(null);
      alert('تم تحديث المخزن بنجاح');
    } catch (error) {
      console.error('Error updating warehouse:', error);
      alert('حدث خطأ في تحديث المخزن');
    }
  };

  const handleDeleteWarehouse = async (warehouseId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المخزن؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/warehouses/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWarehouses();
      await fetchAnalytics();
      alert('تم حذف المخزن بنجاح');
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert(error.response?.data?.detail || 'حدث خطأ في حذف المخزن');
    }
  };

  const fetchWarehouseStock = async (warehouseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/warehouses/${warehouseId}/stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouseStock(response.data);
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
    }
  };

  const handleAddStock = async (warehouseId, stockData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/warehouses/${warehouseId}/stock`, stockData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWarehouseStock(warehouseId);
      await fetchWarehouses();
      setShowStockModal(false);
      alert('تم إضافة المخزون بنجاح');
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('حدث خطأ في إضافة المخزون');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner-enhanced mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل المخازن...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gradient flex items-center gap-3">
          <SVGIcon name="warehouse" size={32} />
          إدارة المخازن الشاملة
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-modern bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg"
        >
          + إضافة مخزن جديد
        </button>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="card-glass p-6 text-center">
            <SVGIcon name="warehouse" size={32} className="mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-gradient mb-1">
              {analytics.summary.total_warehouses}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              إجمالي المخازن
            </div>
          </div>

          <div className="card-glass p-6 text-center">
            <SVGIcon name="accounting" size={32} className="mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-gradient mb-1">
              {analytics.summary.total_stock_value?.toFixed(2)} ج.م
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              قيمة المخزون الإجمالية
            </div>
          </div>

          <div className="card-glass p-6 text-center">
            <SVGIcon name="products" size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-gradient mb-1">
              {analytics.summary.total_products_stocked}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              أصناف المنتجات
            </div>
          </div>

          <div className="card-glass p-6 text-center">
            <SVGIcon name="warning" size={32} className="mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold text-gradient mb-1">
              {analytics.summary.low_stock_alerts}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              تحذيرات نفاد المخزون
            </div>
          </div>
        </div>
      )}

      {/* Warehouses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="card-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {warehouse.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`badge-modern ${warehouse.warehouse_type === 'main' ? 'badge-success' : 'badge-info'}`}>
                  {warehouse.warehouse_type === 'main' ? 'رئيسي' : 'فرعي'}
                </span>
                <div className={`w-3 h-3 rounded-full ${warehouse.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <SVGIcon name="regions" size={16} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {warehouse.code} • {warehouse.city}, {warehouse.region}
                </span>
              </div>

              {warehouse.manager_name && (
                <div className="flex items-center gap-2 text-sm">
                  <SVGIcon name="users" size={16} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    المدير: {warehouse.manager_name}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gradient">
                    {warehouse.total_products || 0}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    المنتجات
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gradient">
                    {warehouse.total_stock_value?.toFixed(0) || 0} ج.م
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    قيمة المخزون
                  </div>
                </div>
              </div>

              {warehouse.temperature_controlled && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <SVGIcon name="warning" size={16} />
                  <span>مخزن مبرد</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedWarehouse(warehouse);
                  fetchWarehouseStock(warehouse.id);
                }}
                className="px-4 py-2 bg-blue-500 bg-opacity-20 text-blue-400 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                عرض المخزون
              </button>
              <button
                onClick={() => setEditingWarehouse(warehouse)}
                className="px-4 py-2 bg-green-500 bg-opacity-20 text-green-400 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                تعديل
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => {
                  setSelectedWarehouse(warehouse);
                  setShowStockModal(true);
                }}
                className="px-4 py-2 bg-purple-500 bg-opacity-20 text-purple-400 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                إضافة مخزون
              </button>
              <button
                onClick={() => handleDeleteWarehouse(warehouse.id)}
                className="px-4 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Warehouse Modal */}
      {(showCreateModal || editingWarehouse) && (
        <WarehouseModal
          warehouse={editingWarehouse}
          users={users}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWarehouse(null);
          }}
          onSave={(data) => {
            if (editingWarehouse) {
              handleEditWarehouse(editingWarehouse.id, data);
            } else {
              handleCreateWarehouse(data);
            }
          }}
        />
      )}

      {/* Stock Management Modal */}
      {selectedWarehouse && !showStockModal && (
        <StockViewModal
          warehouse={selectedWarehouse}
          stock={warehouseStock}
          onClose={() => setSelectedWarehouse(null)}
          onAddStock={() => setShowStockModal(true)}
        />
      )}

      {/* Add Stock Modal */}
      {showStockModal && selectedWarehouse && (
        <AddStockModal
          warehouse={selectedWarehouse}
          products={products}
          onClose={() => {
            setShowStockModal(false);
            setSelectedWarehouse(null);
          }}
          onSave={(data) => handleAddStock(selectedWarehouse.id, data)}
        />
      )}
    </div>
  );
};

// Invoice Preview Modal Component
const InvoicePreviewModal = ({ invoice, onClose }) => {
  const { t } = useLanguage();

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-content');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleDownload = () => {
    // Simulate PDF download
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">
            معاينة الفاتورة {invoice.invoice_number}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2 px-4 py-2"
            >
              <SVGIcon name="scanner" size={20} />
              <span>طباعة</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn-info flex items-center gap-2 px-4 py-2"
            >
              <SVGIcon name="reports" size={20} />
              <span>تحميل</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Invoice Content for Print */}
        <div id="invoice-print-content" className="glass-effect p-8 rounded-xl">
          {/* Company Header */}
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-gradient mb-2">EP Group System</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              نظام إدارة شامل للمؤسسات الطبية
            </p>
          </div>

          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-bold mb-4">فاتورة رقم: {invoice.invoice_number}</h2>
              <div className="space-y-2 text-sm">
                <div><strong>تاريخ الإصدار:</strong> {new Date(invoice.created_at).toLocaleDateString('ar-EG')}</div>
                <div><strong>الحالة:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status === 'paid' ? 'مدفوعة' :
                     invoice.status === 'pending' ? 'معلقة' : 'ملغاة'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold mb-4">بيانات العميل</h3>
              <div className="space-y-2 text-sm">
                <div><strong>الاسم:</strong> {invoice.customer_name}</div>
                <div><strong>التخصص:</strong> {invoice.customer_specialty}</div>
                <div><strong>العيادة:</strong> {invoice.clinic_name}</div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">تفاصيل الفاتورة</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-right">المنتج</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">الكمية</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">سعر الوحدة</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.product_name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.unit_price} ج.م</td>
                    <td className="border border-gray-300 px-4 py-2 font-bold">{item.total_price} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between">
                <span>المجموع الجزئي:</span>
                <span>{invoice.subtotal} ج.م</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>الخصم:</span>
                  <span>-{invoice.discount_amount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>الضريبة (15%):</span>
                <span>{invoice.tax_amount} ج.م</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>الإجمالي:</span>
                <span className="text-green-600">{invoice.total_amount} ج.م</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t text-sm" style={{ color: 'var(--text-muted)' }}>
            <p>شكراً لتعاملكم معنا</p>
            <p>EP Group System - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Invoice Create Modal Component
const InvoiceCreateModal = ({ onClose, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_specialty: '',
    clinic_name: '',
    discount_amount: 0,
    items: [{ product_name: '', quantity: 1, unit_price: 0 }]
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const discountAmount = formData.discount_amount || 0;
    const taxAmount = (subtotal - discountAmount) * 0.15;
    const total = subtotal - discountAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totals = calculateTotals();
    
    const newInvoice = {
      ...formData,
      id: `INV-${Date.now()}`,
      invoice_number: `INV-${Date.now()}`,
      created_at: new Date().toISOString(),
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.total,
      status: 'pending'
    };

    // Add total_price to each item
    newInvoice.items = newInvoice.items.map(item => ({
      ...item,
      total_price: item.quantity * item.unit_price
    }));

    onSave(newInvoice);
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-gradient">إنشاء فاتورة جديدة</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">بيانات العميل</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">اسم العميل:</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">التخصص:</label>
                <input
                  type="text"
                  value={formData.customer_specialty}
                  onChange={(e) => setFormData({...formData, customer_specialty: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">اسم العيادة:</label>
                <input
                  type="text"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">عناصر الفاتورة</h4>
              <button
                type="button"
                onClick={addItem}
                className="btn-primary flex items-center gap-2"
              >
                <SVGIcon name="add" size={16} />
                <span>إضافة عنصر</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="block text-sm font-bold mb-2">المنتج:</label>
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الكمية:</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="form-modern w-full"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">سعر الوحدة:</label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                      className="form-modern w-full"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="btn-danger w-full"
                      disabled={formData.items.length === 1}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">الخصم</h4>
            <div className="w-1/3">
              <label className="block text-sm font-bold mb-2">مبلغ الخصم:</label>
              <input
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({...formData, discount_amount: parseFloat(e.target.value) || 0})}
                className="form-modern w-full"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">ملخص الفاتورة</h4>
            <div className="w-1/2 space-y-2">
              <div className="flex justify-between">
                <span>المجموع الجزئي:</span>
                <span>{totals.subtotal.toFixed(2)} ج.م</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>الخصم:</span>
                  <span>-{totals.discountAmount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>الضريبة (15%):</span>
                <span>{totals.taxAmount.toFixed(2)} ج.م</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>الإجمالي:</span>
                <span className="text-green-600">{totals.total.toFixed(2)} ج.م</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              إنشاء الفاتورة
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invoice Edit Modal Component (similar to create but with existing data)
const InvoiceEditModal = ({ invoice, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    customer_name: invoice.customer_name,
    customer_specialty: invoice.customer_specialty,
    clinic_name: invoice.clinic_name,
    discount_amount: invoice.discount_amount || 0,
    items: invoice.items || [{ product_name: '', quantity: 1, unit_price: 0 }]
  });

  // Same logic as create modal but with update functionality
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const discountAmount = formData.discount_amount || 0;
    const taxAmount = (subtotal - discountAmount) * 0.15;
    const total = subtotal - discountAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totals = calculateTotals();
    
    const updatedInvoice = {
      ...invoice,
      ...formData,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.total,
      items: formData.items.map(item => ({
        ...item,
        total_price: item.quantity * item.unit_price
      }))
    };

    onSave(updatedInvoice);
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-gradient">
          تعديل الفاتورة {invoice.invoice_number}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Same form structure as create modal */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">بيانات العميل</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">اسم العميل:</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">التخصص:</label>
                <input
                  type="text"
                  value={formData.customer_specialty}
                  onChange={(e) => setFormData({...formData, customer_specialty: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">اسم العيادة:</label>
                <input
                  type="text"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                  className="form-modern w-full"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              حفظ التغييرات
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invoice Management Component
const InvoiceManagement = () => {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounting/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Mock data for development
      setInvoices([
        {
          id: 'INV-001',
          invoice_number: 'INV-001',
          customer_name: 'د. أحمد محمد',
          customer_specialty: 'باطنة',
          clinic_name: 'عيادة النور',
          created_at: '2024-01-24',
          subtotal: 1500,
          tax_amount: 225,
          discount_amount: 50,
          total_amount: 1675,
          status: 'paid',
          items: [
            { product_name: 'أكسزوم 500مج', quantity: 10, unit_price: 25.50, total_price: 255 },
            { product_name: 'فيتامين د3', quantity: 5, unit_price: 45.00, total_price: 225 }
          ]
        },
        {
          id: 'INV-002',
          invoice_number: 'INV-002',
          customer_name: 'د. فاطمة علي',
          customer_specialty: 'أطفال',
          clinic_name: 'عيادة الشفاء',
          created_at: '2024-01-23',
          subtotal: 850,
          tax_amount: 127.5,
          discount_amount: 0,
          total_amount: 977.5,
          status: 'pending',
          items: [
            { product_name: 'باراسيتامول', quantity: 20, unit_price: 12.75, total_price: 255 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setShowCreateModal(true);
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  const handlePreviewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <SVGIcon name="reports" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">
                {t('invoiceManagement') || 'إدارة الفواتير'}
              </h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('invoiceManagementSubtitle') || 'إنشاء وإدارة الفواتير المهنية'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateInvoice}
            className="btn-primary flex items-center gap-2"
          >
            <SVGIcon name="add" size={20} />
            <span>{t('createInvoice') || 'إنشاء فاتورة جديدة'}</span>
          </button>
        </div>

        {/* Invoices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="card-modern p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{invoice.invoice_number}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {invoice.status === 'paid' ? 'مدفوعة' :
                   invoice.status === 'pending' ? 'معلقة' : 'ملغاة'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm">العميل:</span>
                  <span className="text-sm font-bold">{invoice.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">العيادة:</span>
                  <span className="text-sm">{invoice.clinic_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">التخصص:</span>
                  <span className="text-sm">{invoice.customer_specialty}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">الإجمالي:</span>
                  <span className="text-lg font-bold text-green-600">
                    {invoice.total_amount} ج.م
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePreviewInvoice(invoice)}
                  className="btn-info flex-1 text-xs flex items-center justify-center gap-1"
                >
                  <SVGIcon name="visits" size={16} />
                  <span>معاينة</span>
                </button>
                <button
                  onClick={() => handleEditInvoice(invoice)}
                  className="btn-primary flex-1 text-xs flex items-center justify-center gap-1"
                >
                  <SVGIcon name="settings" size={16} />
                  <span>تعديل</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <InvoiceCreateModal
            onClose={() => setShowCreateModal(false)}
            onSave={() => {
              setShowCreateModal(false);
              fetchInvoices();
            }}
          />
        )}

        {showEditModal && selectedInvoice && (
          <InvoiceEditModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowEditModal(false);
              setSelectedInvoice(null);
            }}
            onSave={() => {
              setShowEditModal(false);
              setSelectedInvoice(null);
              fetchInvoices();
            }}
          />
        )}

        {showPreviewModal && selectedInvoice && (
          <InvoicePreviewModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Advanced Warehouse Keeper Management System
const WarehouseKeeperDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('inventory');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load warehouses assigned to this keeper
      const warehouseResponse = await axios.get(`${API}/warehouses/assigned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(warehouseResponse.data);
      
      if (warehouseResponse.data.length > 0) {
        setSelectedWarehouse(warehouseResponse.data[0]);
        await loadWarehouseInventory(warehouseResponse.data[0].id);
      }
      
      // Load pending requests
      const requestsResponse = await axios.get(`${API}/warehouse-requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(requestsResponse.data);
      
    } catch (error) {
      console.error('Error loading warehouse data:', error);
      // Mock data for development
      setWarehouses([
        {
          id: 'wh-001',
          name: 'مخزن الرئيسي',
          region: 'القاهرة',
          address: 'شارع النهضة، مدينة نصر',
          capacity: 1000,
          current_stock: 750
        }
      ]);
      setSelectedWarehouse({
        id: 'wh-001',
        name: 'مخزن الرئيسي',
        region: 'القاهرة'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseInventory = async (warehouseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses/${warehouseId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      // Mock data
      setInventory([
        {
          id: 'inv-001',
          product_name: 'أكسزوم 500مج',
          current_stock: 150,
          minimum_stock: 50,
          maximum_stock: 500,
          unit_price: 25.50,
          last_updated: '2024-01-24T10:30:00',
          status: 'in_stock'
        },
        {
          id: 'inv-002',
          product_name: 'فيتامين د3',
          current_stock: 25,
          minimum_stock: 50,
          maximum_stock: 200,
          unit_price: 45.00,
          last_updated: '2024-01-23T15:20:00',
          status: 'low_stock'
        }
      ]);
    }
  };

  const handleStockAdjustment = async (productId, adjustment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/inventory/adjust`, {
        warehouse_id: selectedWarehouse.id,
        product_id: productId,
        adjustment_type: adjustment.type,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
        notes: adjustment.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload inventory
      await loadWarehouseInventory(selectedWarehouse.id);
      setShowStockAdjustmentModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/inventory/add-product`, {
        warehouse_id: selectedWarehouse.id,
        ...productData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadWarehouseInventory(selectedWarehouse.id);
      setShowAddProductModal(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return { text: 'نفد المخزون', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (item.current_stock <= item.minimum_stock) {
      return { text: 'مخزون منخفض', color: 'text-orange-600', bg: 'bg-orange-100' };
    } else if (item.current_stock >= item.maximum_stock * 0.9) {
      return { text: 'مخزون مرتفع', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    return { text: 'مخزون طبيعي', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
              <SVGIcon name="warehouse" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">
                لوحة أمين المخزن
              </h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة شاملة للمخزون والعمليات اليومية
              </p>
            </div>
          </div>
          
          {selectedWarehouse && (
            <div className="glass-effect p-4 rounded-xl">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>المخزن الحالي:</div>
              <div className="text-lg font-bold">{selectedWarehouse.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selectedWarehouse.region}</div>
            </div>
          )}
        </div>

        {/* Warehouse Selection */}
        {warehouses.length > 1 && (
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h3 className="text-lg font-bold mb-4">اختيار المخزن:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  onClick={() => {
                    setSelectedWarehouse(warehouse);
                    loadWarehouseInventory(warehouse.id);
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedWarehouse?.id === warehouse.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <h4 className="font-bold">{warehouse.name}</h4>
                  <p className="text-sm opacity-75">{warehouse.region}</p>
                  <div className="mt-2 text-xs">
                    الاستخدام: {Math.round((warehouse.current_stock / warehouse.capacity) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'inventory', label: 'إدارة المخزون', icon: '📦' },
            { id: 'movements', label: 'حركات المخزن', icon: '🔄' },
            { id: 'requests', label: 'الطلبات المعلقة', icon: '⏳' },
            { id: 'reports', label: 'التقارير', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'glass-effect hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold">إجراءات سريعة:</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <SVGIcon name="add" size={20} />
                    <span>إضافة منتج</span>
                  </button>
                  <button
                    onClick={() => {
                      // Export inventory
                      const data = inventory.map(item => ({
                        'اسم المنتج': item.product_name,
                        'المخزون الحالي': item.current_stock,
                        'الحد الأدنى': item.minimum_stock,
                        'الحالة': getStockStatus(item).text
                      }));
                      const csv = Object.keys(data[0]).join(',') + '\n' + 
                                 data.map(row => Object.values(row).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `inventory-${selectedWarehouse.name}-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }}
                    className="btn-info flex items-center gap-2"
                  >
                    <SVGIcon name="reports" size={20} />
                    <span>تصدير</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {inventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <div key={item.id} className="glass-effect p-6 rounded-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{item.product_name}</h4>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${status.bg} ${status.color} mt-1`}>
                          {status.text}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowStockAdjustmentModal(true);
                        }}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        تعديل
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>المخزون الحالي:</span>
                        <span className="font-bold text-lg">{item.current_stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الحد الأدنى:</span>
                        <span className="text-sm">{item.minimum_stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الحد الأقصى:</span>
                        <span className="text-sm">{item.maximum_stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>سعر الوحدة:</span>
                        <span className="text-sm font-bold">{item.unit_price} ج.م</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>مستوى المخزون</span>
                          <span>{Math.round((item.current_stock / item.maximum_stock) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.current_stock <= item.minimum_stock ? 'bg-red-500' :
                              item.current_stock >= item.maximum_stock * 0.9 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.current_stock / item.maximum_stock) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProductModal && (
          <WarehouseKeeperAddProductModal
            onClose={() => setShowAddProductModal(false)}
            onSave={handleAddProduct}
            warehouseId={selectedWarehouse?.id}
          />
        )}

        {/* Stock Adjustment Modal */}
        {showStockAdjustmentModal && selectedProduct && (
          <WarehouseKeeperStockAdjustmentModal
            product={selectedProduct}
            onClose={() => {
              setShowStockAdjustmentModal(false);
              setSelectedProduct(null);
            }}
            onSave={handleStockAdjustment}
          />
        )}
      </div>
    </div>
  );
};

// Warehouse Keeper Add Product Modal Component
const WarehouseKeeperAddProductModal = ({ onClose, onSave, warehouseId }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    description: '',
    unit_price: 0,
    minimum_stock: 10,
    maximum_stock: 100,
    initial_stock: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-2xl">
        <h3 className="text-2xl font-bold mb-6 text-gradient">إضافة منتج جديد</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">اسم المنتج:</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                className="form-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الفئة:</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="form-modern w-full"
                required
              >
                <option value="">اختر الفئة</option>
                <option value="antibiotics">مضادات حيوية</option>
                <option value="vitamins">فيتامينات</option>
                <option value="painkillers">مسكنات</option>
                <option value="cardiovascular">أدوية القلب</option>
                <option value="diabetes">أدوية السكري</option>
                <option value="respiratory">أدوية الجهاز التنفسي</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الوصف:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-modern w-full h-20"
              placeholder="وصف مختصر للمنتج..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">سعر الوحدة (ج.م):</label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                className="form-modern w-full"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الحد الأدنى:</label>
              <input
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({...formData, minimum_stock: parseInt(e.target.value)})}
                className="form-modern w-full"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الحد الأقصى:</label>
              <input
                type="number"
                value={formData.maximum_stock}
                onChange={(e) => setFormData({...formData, maximum_stock: parseInt(e.target.value)})}
                className="form-modern w-full"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الكمية الأولية:</label>
            <input
              type="number"
              value={formData.initial_stock}
              onChange={(e) => setFormData({...formData, initial_stock: parseInt(e.target.value)})}
              className="form-modern w-full"
              min="0"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              إضافة المنتج
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Warehouse Keeper Stock Adjustment Modal Component
const WarehouseKeeperStockAdjustmentModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'add',
    quantity: 0,
    reason: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product.id, formData);
  };

  const adjustmentTypes = [
    { value: 'add', label: 'إضافة مخزون', icon: '➕' },
    { value: 'remove', label: 'سحب مخزون', icon: '➖' },
    { value: 'adjust', label: 'تعديل مخزون', icon: '🔄' },
    { value: 'damaged', label: 'تالف', icon: '❌' },
    { value: 'expired', label: 'منتهي الصلاحية', icon: '⚠️' }
  ];

  const reasons = [
    'استلام شحنة جديدة',
    'تسليم للمناديب', 
    'عينات مجانية',
    'أدوية تالفة',
    'انتهاء صلاحية',
    'جرد دوري',
    'تصحيح خطأ إدخال',
    'إعادة من المناديب',
    'أخرى'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-2xl">
        <h3 className="text-2xl font-bold mb-6 text-gradient">
          تعديل مخزون: {product.product_name}
        </h3>
        
        <div className="glass-effect p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>المخزون الحالي:</span>
            <span className="text-2xl font-bold">{product.current_stock}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">نوع التعديل:</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {adjustmentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({...formData, type: type.value})}
                  className={`p-3 rounded-lg text-sm transition-all ${
                    formData.type === type.value
                      ? 'bg-blue-600 text-white'
                      : 'glass-effect hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <div>{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">الكمية:</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                className="form-modern w-full"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">السبب:</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="form-modern w-full"
                required
              >
                <option value="">اختر السبب</option>
                {reasons.map((reason, index) => (
                  <option key={index} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">ملاحظات إضافية:</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-modern w-full h-20"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          {/* Preview */}
          <div className="glass-effect p-4 rounded-xl">
            <h4 className="font-bold mb-2">معاينة التغيير:</h4>
            <div className="flex justify-between items-center">
              <span>المخزون الحالي:</span>
              <span className="font-bold">{product.current_stock}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>التغيير:</span>
              <span className={`font-bold ${
                formData.type === 'add' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.type === 'add' ? '+' : '-'}{formData.quantity || 0}
              </span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between items-center">
              <span className="font-bold">المخزون الجديد:</span>
              <span className="text-xl font-bold">
                {formData.type === 'add' 
                  ? product.current_stock + (formData.quantity || 0)
                  : Math.max(0, product.current_stock - (formData.quantity || 0))
                }
              </span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              تأكيد التعديل
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const AddProductModal = ({ onClose, onSave, warehouseId }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    category: '',
    unit_price: 0,
    minimum_stock: 0,
    maximum_stock: 0,
    initial_stock: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="glass-effect w-full max-w-2xl rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">إضافة منتج جديد</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 hover:bg-opacity-10 rounded-full">
            <SVGIcon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">اسم المنتج:</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                className="form-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الفئة:</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="form-modern w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الوصف:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-modern w-full h-20"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">سعر الوحدة:</label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                className="form-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الحد الأدنى:</label>
              <input
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({...formData, minimum_stock: parseInt(e.target.value)})}
                className="form-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الحد الأقصى:</label>
              <input
                type="number"
                value={formData.maximum_stock}
                onChange={(e) => setFormData({...formData, maximum_stock: parseInt(e.target.value)})}
                className="form-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">المخزون الأولي:</label>
              <input
                type="number"
                value={formData.initial_stock}
                onChange={(e) => setFormData({...formData, initial_stock: parseInt(e.target.value)})}
                className="form-modern w-full"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              إضافة المنتج
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Adjustment Modal Component
const StockAdjustmentModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'add',
    quantity: 0,
    reason: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="glass-effect w-full max-w-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">تعديل المخزون - {product.product_name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 hover:bg-opacity-10 rounded-full">
            <SVGIcon name="close" size={20} />
          </button>
        </div>

        <div className="mb-4 p-4 glass-effect rounded-lg">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>المخزون الحالي:</div>
          <div className="text-2xl font-bold">{product.current_stock}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">نوع التعديل:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="form-modern w-full"
              required
            >
              <option value="add">إضافة مخزون</option>
              <option value="remove">خصم مخزون</option>
              <option value="adjust">تعديل المخزون</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الكمية:</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="form-modern w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">السبب:</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="form-modern w-full"
              required
            >
              <option value="">اختر السبب</option>
              <option value="purchase">شراء جديد</option>
              <option value="sale">بيع</option>
              <option value="damage">تلف</option>
              <option value="expired">انتهاء صلاحية</option>
              <option value="transfer">نقل</option>
              <option value="correction">تصحيح</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">ملاحظات:</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-modern w-full h-20"
              rows="3"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              تطبيق التعديل
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Advanced Approval System - Hierarchical Order Management
const AdvancedApprovalSystem = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadApprovalData();
  }, []);

  const loadApprovalData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load pending approvals based on user role
      const pendingResponse = await axios.get(`${API}/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingApprovals(pendingResponse.data);
      
      // Load approval history
      const historyResponse = await axios.get(`${API}/approvals/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovalHistory(historyResponse.data);
      
    } catch (error) {
      console.error('Error loading approval data:', error);
      // Mock data for development
      setPendingApprovals([
        {
          id: 'ord-001',
          order_number: 'ORD-2024-001',
          sales_rep: 'أحمد محمد',
          sales_rep_id: 'user-001',
          doctor_name: 'د. سعد علي',
          clinic_name: 'عيادة النور',
          total_amount: 2500,
          items: [
            { product_name: 'أكسزوم 500مج', quantity: 10, unit_price: 25.50 },
            { product_name: 'فيتامين د3', quantity: 5, unit_price: 45.00 }
          ],
          current_stage: user.role === 'accounting' ? 'accounting_review' : 'warehouse_review',
          submitted_at: '2024-01-24T10:30:00',
          urgency: 'high',
          notes: 'طلبية عاجلة للدكتور سعد',
          workflow_status: {
            rep_submitted: { status: 'completed', date: '2024-01-24T10:30:00', user: 'أحمد محمد' },
            accounting_review: { status: 'pending', date: null, user: null },
            warehouse_approval: { status: 'waiting', date: null, user: null }
          }
        },
        {
          id: 'ord-002',
          order_number: 'ORD-2024-002',
          sales_rep: 'فاطمة أحمد',
          sales_rep_id: 'user-002',
          doctor_name: 'د. منى حسن',
          clinic_name: 'مستشفى الرحمة',
          total_amount: 1800,
          items: [
            { product_name: 'باراسيتامول', quantity: 20, unit_price: 12.75 }
          ],
          current_stage: 'accounting_review',
          submitted_at: '2024-01-23T15:20:00',
          urgency: 'medium',
          notes: 'طلبية دورية',
          workflow_status: {
            rep_submitted: { status: 'completed', date: '2024-01-23T15:20:00', user: 'فاطمة أحمد' },
            accounting_review: { status: 'pending', date: null, user: null },
            warehouse_approval: { status: 'waiting', date: null, user: null }
          }
        }
      ]);
      
      setApprovalHistory([
        {
          id: 'hist-001',
          order_number: 'ORD-2024-003',
          action: 'approved',
          stage: 'accounting_review',
          approver: 'محمد السيد',
          approver_role: 'accounting',
          approved_at: '2024-01-20T14:30:00',
          notes: 'موافقة مع تأكيد الأسعار',
          total_amount: 3200
        },
        {
          id: 'hist-002',
          order_number: 'ORD-2024-004',
          action: 'rejected',
          stage: 'warehouse_approval',
          approver: 'أمينة المخزن',
          approver_role: 'warehouse_keeper',
          approved_at: '2024-01-19T11:15:00',
          notes: 'نفاد المخزون - منتج غير متوفر',
          total_amount: 1500
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (orderId, action, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/approvals/process`, {
        order_id: orderId,
        action: action, // 'approve' or 'reject'
        stage: getCurrentUserStage(),
        notes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload data
      await loadApprovalData();
      setShowOrderModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const getCurrentUserStage = () => {
    if (user.role === 'accounting') return 'accounting_review';
    if (user.role === 'warehouse_keeper') return 'warehouse_approval';
    return 'unknown';
  };

  const getStageIcon = (stage) => {
    const icons = {
      rep_submitted: '📝',
      accounting_review: '💰', 
      warehouse_approval: '📦',
      completed: '✅',
      rejected: '❌'
    };
    return icons[stage] || '⏳';
  };

  const getStageText = (stage) => {
    const stages = {
      rep_submitted: 'تم تقديم الطلب',
      accounting_review: 'مراجعة المحاسبة',
      warehouse_approval: 'موافقة المخزن',
      completed: 'مكتمل',
      rejected: 'مرفوض'
    };
    return stages[stage] || stage;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyText = (urgency) => {
    const urgencies = {
      high: 'عاجل',
      medium: 'متوسط',
      low: 'عادي'
    };
    return urgencies[urgency] || urgency;
  };

  const canApproveOrder = (order) => {
    if (user.role === 'admin') return true;
    if (user.role === 'accounting' && order.current_stage === 'accounting_review') return true;
    if (user.role === 'warehouse_keeper' && order.current_stage === 'warehouse_review') return true;
    return false;
  };

  const filteredHistory = approvalHistory.filter(item => {
    if (filterStatus !== 'all' && item.action !== filterStatus) return false;
    if (filterDateRange.start && new Date(item.approved_at) < new Date(filterDateRange.start)) return false;
    if (filterDateRange.end && new Date(item.approved_at) > new Date(filterDateRange.end)) return false;
    return true;
  });

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-green rounded-full flex items-center justify-center ml-4 glow-pulse">
              <SVGIcon name="analytics" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">
                نظام الموافقات المتقدم
              </h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة التسلسل الهرمي للموافقات والمراجعات
              </p>
            </div>
          </div>
          
          <div className="glass-effect p-4 rounded-xl">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>دورك الحالي:</div>
            <div className="text-lg font-bold">{getStageText(getCurrentUserStage())}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {pendingApprovals.length} طلب في الانتظار
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'pending', label: 'المعلقة', icon: '⏳', count: pendingApprovals.length },
            { id: 'history', label: 'السجل', icon: '📋', count: approvalHistory.length },
            { id: 'workflow', label: 'مسار العمل', icon: '🔄', count: null },
            { id: 'analytics', label: 'التحليلات', icon: '📊', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'glass-effect hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className="mr-2 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{pendingApprovals.length}</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات معلقة</div>
                  </div>
                  <div className="text-3xl">⏳</div>
                </div>
              </div>
              
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {pendingApprovals.filter(o => o.urgency === 'high').length}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>عاجل</div>
                  </div>
                  <div className="text-3xl">🚨</div>
                </div>
              </div>
              
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {pendingApprovals.reduce((sum, order) => sum + order.total_amount, 0)} ج.م
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>القيمة الإجمالية</div>
                  </div>
                  <div className="text-3xl">💰</div>
                </div>
              </div>
              
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {new Set(pendingApprovals.map(o => o.sales_rep_id)).size}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مناديب</div>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingApprovals.map((order) => (
                <div key={order.id} className="glass-effect p-6 rounded-xl hover:scale-105 transition-transform">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{order.order_number}</h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {order.sales_rep} • {new Date(order.submitted_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getUrgencyColor(order.urgency)}`}>
                        {getUrgencyText(order.urgency)}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {getStageText(order.current_stage)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الطبيب:</span>
                      <span className="text-sm font-bold">{order.doctor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>العيادة:</span>
                      <span className="text-sm">{order.clinic_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>عدد الأصناف:</span>
                      <span className="text-sm">{order.items.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">الإجمالي:</span>
                      <span className="text-lg font-bold text-green-600">
                        {order.total_amount} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      {Object.entries(order.workflow_status).map(([stage, status], index) => (
                        <div key={stage} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            status.status === 'completed' ? 'bg-green-500 text-white' :
                            status.status === 'pending' ? 'bg-blue-500 text-white' :
                            'bg-gray-400 text-white'
                          }`}>
                            {getStageIcon(stage)}
                          </div>
                          <div className="text-xs mt-1 text-center">
                            {getStageText(stage)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="btn-info flex-1 text-xs py-2"
                    >
                      عرض التفاصيل
                    </button>
                    {canApproveOrder(order) && (
                      <>
                        <button
                          onClick={() => handleApproval(order.id, 'approve')}
                          className="btn-success flex-1 text-xs py-2"
                        >
                          موافقة
                        </button>
                        <button
                          onClick={() => handleApproval(order.id, 'reject')}
                          className="btn-danger flex-1 text-xs py-2"
                        >
                          رفض
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pendingApprovals.length === 0 && (
              <div className="glass-effect p-12 rounded-xl text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">لا توجد طلبات معلقة</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  جميع الطلبات تم مراجعتها
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* History Filters */}
            <div className="glass-effect p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4">فلاتر السجل:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الحالة:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-modern w-full"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="approved">موافقة</option>
                    <option value="rejected">رفض</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">من تاريخ:</label>
                  <input
                    type="date"
                    value={filterDateRange.start}
                    onChange={(e) => setFilterDateRange({...filterDateRange, start: e.target.value})}
                    className="form-modern w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={filterDateRange.end}
                    onChange={(e) => setFilterDateRange({...filterDateRange, end: e.target.value})}
                    className="form-modern w-full"
                  />
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="glass-effect rounded-xl overflow-hidden">
              <div className="table-modern overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-right">رقم الطلب</th>
                      <th className="px-6 py-3 text-center">الإجراء</th>
                      <th className="px-6 py-3 text-right">المرحلة</th>
                      <th className="px-6 py-3 text-right">الموافق</th>
                      <th className="px-6 py-3 text-center">التاريخ</th>
                      <th className="px-6 py-3 text-right">القيمة</th>
                      <th className="px-6 py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="px-6 py-4 font-bold">{item.order_number}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            item.action === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.action === 'approved' ? 'موافقة' : 'رفض'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStageText(item.stage)}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold">{item.approver}</div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {item.approver_role}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {new Date(item.approved_at).toLocaleDateString('ar-EG')}
                          <br />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(item.approved_at).toLocaleTimeString('ar-EG')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">{item.total_amount} ج.م</td>
                        <td className="px-6 py-4 text-center">
                          <button className="btn-info text-xs px-3 py-1">
                            تفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <OrderApprovalModal
            order={selectedOrder}
            onClose={() => {
              setShowOrderModal(false);
              setSelectedOrder(null);
            }}
            onApprove={(notes) => handleApproval(selectedOrder.id, 'approve', notes)}
            onReject={(notes) => handleApproval(selectedOrder.id, 'reject', notes)}
            canApprove={canApproveOrder(selectedOrder)}
            userRole={user.role}
          />
        )}
      </div>
    </div>
  );
};

// Order Approval Modal Component
const OrderApprovalModal = ({ order, onClose, onApprove, onReject, canApprove, userRole }) => {
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAction = (actionType) => {
    setAction(actionType);
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    if (action === 'approve') {
      onApprove(notes);
    } else if (action === 'reject') {
      onReject(notes);
    }
    setShowConfirmation(false);
    setNotes('');
    setAction('');
  };

  const getStageIcon = (stage) => {
    const icons = {
      rep_submitted: '📝',
      accounting_review: '💰', 
      warehouse_approval: '📦',
      completed: '✅',
      rejected: '❌'
    };
    return icons[stage] || '⏳';
  };

  const getStageText = (stage) => {
    const stages = {
      rep_submitted: 'تم تقديم الطلب',
      accounting_review: 'مراجعة المحاسبة',
      warehouse_approval: 'موافقة المخزن',
      completed: 'مكتمل',
      rejected: 'مرفوض'
    };
    return stages[stage] || stage;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">
            تفاصيل الطلب: {order.order_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">معلومات الطلب</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>رقم الطلب:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>المندوب:</span>
                <span className="font-bold">{order.sales_rep}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>تاريخ الإرسال:</span>
                <span className="text-sm">{new Date(order.submitted_at).toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الأولوية:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  order.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  order.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.urgency === 'high' ? 'عاجل' : 
                   order.urgency === 'medium' ? 'متوسط' : 'عادي'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">معلومات العميل</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الطبيب:</span>
                <span className="font-bold">{order.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>العيادة:</span>
                <span className="text-sm">{order.clinic_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>عدد الأصناف:</span>
                <span className="text-sm">{order.items.length}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">الإجمالي:</span>
                <span className="text-lg font-bold text-green-600">{order.total_amount} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="glass-effect p-6 rounded-xl mb-6">
          <h4 className="text-lg font-bold mb-4">حالة سير العمل</h4>
          <div className="flex justify-between items-center">
            {Object.entries(order.workflow_status).map(([stage, status], index) => (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  status.status === 'completed' ? 'bg-green-500 text-white' :
                  status.status === 'pending' ? 'bg-blue-500 text-white' :
                  'bg-gray-400 text-white'
                }`}>
                  {getStageIcon(stage)}
                </div>
                <div className="text-sm mt-2 text-center font-bold">
                  {getStageText(stage)}
                </div>
                {status.status === 'completed' && (
                  <div className="text-xs mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>
                    {status.user}<br />
                    {new Date(status.date).toLocaleDateString('ar-EG')}
                  </div>
                )}
                {index < Object.entries(order.workflow_status).length - 1 && (
                  <div className={`absolute top-6 w-8 h-0.5 transform translate-x-12 ${
                    status.status === 'completed' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div className="glass-effect p-6 rounded-xl mb-6">
          <h4 className="text-lg font-bold mb-4">عناصر الطلب</h4>
          <div className="table-modern overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-right">المنتج</th>
                  <th className="px-4 py-2 text-center">الكمية</th>
                  <th className="px-4 py-2 text-right">سعر الوحدة</th>
                  <th className="px-4 py-2 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 font-bold">{item.product_name}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2">{item.unit_price} ج.م</td>
                    <td className="px-4 py-2 font-bold">{(item.quantity * item.unit_price).toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h4 className="text-lg font-bold mb-4">ملاحظات الطلب</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.notes}</p>
          </div>
        )}

        {/* Approval Section */}
        {canApprove && !showConfirmation && (
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h4 className="text-lg font-bold mb-4">إجراء الموافقة</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">ملاحظات (اختيارية):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-modern w-full h-20"
                  placeholder="أضف أي ملاحظات أو تعليقات..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('approve')}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <span>✅</span>
                  <span>موافقة</span>
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  <span>❌</span>
                  <span>رفض</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="glass-effect p-6 rounded-xl mb-6 border-2 border-yellow-500">
            <h4 className="text-lg font-bold mb-4 text-yellow-600">تأكيد الإجراء</h4>
            <p className="mb-4">
              هل أنت متأكد من {action === 'approve' ? 'الموافقة على' : 'رفض'} هذا الطلب؟
            </p>
            {notes && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <strong>الملاحظات:</strong> {notes}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={confirmAction}
                className={`flex-1 ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
              >
                تأكيد {action === 'approve' ? 'الموافقة' : 'الرفض'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn-secondary flex-1"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced User Management with Region and Manager Assignment
const EnhancedUserManagementV2 = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load users with enhanced data
      const usersResponse = await axios.get(`${API}/users/enhanced`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersResponse.data);
      
      // Load regions
      const regionsResponse = await axios.get(`${API}/regions/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegions(regionsResponse.data);
      
      // Load managers (users who can be managers)
      const managersResponse = await axios.get(`${API}/users/managers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(managersResponse.data);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      // Mock data for development
      setUsers([
        {
          id: 'user-001',
          username: 'ahmed.mohamed',
          full_name: 'أحمد محمد علي',
          email: 'ahmed@company.com',
          phone: '01234567890',
          role: 'medical_rep',
          region_id: 'region-001',
          region_name: 'القاهرة',
          direct_manager_id: 'manager-001',
          direct_manager_name: 'محمد السيد',
          profile_photo: null,
          address: 'مدينة نصر، القاهرة',
          national_id: '12345678901234',
          hire_date: '2023-01-15',
          is_active: true,
          performance_score: 85,
          total_visits: 156,
          total_orders: 89
        },
        {
          id: 'user-002',
          username: 'fatma.ahmed',
          full_name: 'فاطمة أحمد حسن',
          email: 'fatma@company.com',
          phone: '01098765432',
          role: 'warehouse_keeper',
          region_id: 'region-002',
          region_name: 'الجيزة',
          direct_manager_id: 'manager-002',
          direct_manager_name: 'أمينة المخزن',
          profile_photo: null,
          address: 'المهندسين، الجيزة',
          national_id: '98765432109876',
          hire_date: '2023-03-20',
          is_active: true,
          performance_score: 92,
          total_visits: 0,
          total_orders: 0
        }
      ]);
      
      setRegions([
        { id: 'region-001', name: 'القاهرة', manager_id: 'manager-001' },
        { id: 'region-002', name: 'الجيزة', manager_id: 'manager-002' },
        { id: 'region-003', name: 'الإسكندرية', manager_id: 'manager-003' }
      ]);
      
      setManagers([
        { id: 'manager-001', name: 'محمد السيد', role: 'area_manager' },
        { id: 'manager-002', name: 'أمينة المخزن', role: 'warehouse_manager' },
        { id: 'manager-003', name: 'سعد أحمد', role: 'district_manager' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/create`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadUserData();
      setShowAddUserModal(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEditUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/users/${selectedUser.id}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadUserData();
      setShowEditUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/users/${userId}/status`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadUserData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRegion = filterRegion === 'all' || user.region_id === filterRegion;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch = searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesRole && matchesSearch;
  });

  const getRoleText = (role) => {
    const roles = {
      admin: 'مدير النظام',
      gm: 'المدير العام',
      line_manager: 'مدير الخط',
      area_manager: 'مدير المنطقة',
      district_manager: 'مدير المنطقة المحلية',
      key_account: 'حسابات رئيسية',
      medical_rep: 'مندوب طبي',
      warehouse_keeper: 'أمين المخزن',
      sales_rep: 'مندوب مبيعات',
      accounting: 'محاسب'
    };
    return roles[role] || role;
  };

  const getRegionUsers = (regionId) => {
    return users.filter(user => user.region_id === regionId);
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <SVGIcon name="users" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">
                إدارة المستخدمين المتقدمة
              </h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة شاملة للمستخدمين مع ربط المناطق والمديرين
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <SVGIcon name="add" size={20} />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي المستخدمين</div>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.is_active).length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>نشط</div>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{regions.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>المناطق</div>
              </div>
              <div className="text-3xl">🗺️</div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(users.reduce((sum, u) => sum + (u.performance_score || 0), 0) / users.length) || 0}%
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>متوسط الأداء</div>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <h3 className="text-lg font-bold mb-4">فلاتر البحث:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="البحث بالإسم أو الإيميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-modern w-full"
              />
            </div>
            <div>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع المناطق</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                <option value="area_manager">مدير المنطقة</option>
                <option value="medical_rep">مندوب طبي</option>
                <option value="warehouse_keeper">أمين المخزن</option>
                <option value="accounting">محاسب</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRegion('all');
                  setFilterRole('all');
                }}
                className="btn-secondary w-full"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="glass-effect p-6 rounded-xl hover:scale-105 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.profile_photo ? (
                      <img src={user.profile_photo} alt={user.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      user.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{user.full_name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      @{user.username}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الدور:</span>
                  <span className="text-sm font-bold">{getRoleText(user.role)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>المنطقة:</span>
                  <span className="text-sm">{user.region_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>المدير المباشر:</span>
                  <span className="text-sm">{user.direct_manager_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الإيميل:</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الهاتف:</span>
                  <span className="text-sm">{user.phone}</span>
                </div>
                {user.performance_score && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>نقاط الأداء:</span>
                    <span className={`text-sm font-bold ${
                      user.performance_score >= 80 ? 'text-green-600' :
                      user.performance_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {user.performance_score}%
                    </span>
                  </div>
                )}
              </div>

              {/* Performance Bar */}
              {user.performance_score && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>الأداء</span>
                    <span>{user.performance_score}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        user.performance_score >= 80 ? 'bg-green-500' :
                        user.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${user.performance_score}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowEditUserModal(true);
                  }}
                  className="btn-primary flex-1 text-xs py-2"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                  className={`flex-1 text-xs py-2 ${
                    user.is_active ? 'btn-danger' : 'btn-success'
                  }`}
                >
                  {user.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="glass-effect p-12 rounded-xl text-center">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-bold mb-2">لا توجد مستخدمين</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm || filterRegion !== 'all' || filterRole !== 'all' 
                ? 'لا توجد مستخدمين تطابق معايير البحث'
                : 'ابدأ بإضافة مستخدم جديد'}
            </p>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <UserManagementModal
            mode="add"
            regions={regions}
            managers={managers}
            onClose={() => setShowAddUserModal(false)}
            onSave={handleAddUser}
          />
        )}

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <UserManagementModal
            mode="edit"
            user={selectedUser}
            regions={regions}
            managers={managers}
            onClose={() => {
              setShowEditUserModal(false);
              setSelectedUser(null);
            }}
            onSave={handleEditUser}
          />
        )}
      </div>
    </div>
  );
};

// Monthly Planning System for Managers
const MonthlyPlanningSystem = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('plans');
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showPlanViewModal, setShowPlanViewModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlanningData();
  }, [selectedMonth]);

  const loadPlanningData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load monthly plans
      const plansResponse = await axios.get(`${API}/planning/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: selectedMonth }
      });
      setMonthlyPlans(plansResponse.data);
      
      // Load sales reps under this manager
      const repsResponse = await axios.get(`${API}/users/sales-reps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesReps(repsResponse.data);
      
      // Load clinics
      const clinicsResponse = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(clinicsResponse.data);
      
    } catch (error) {
      console.error('Error loading planning data:', error);
      // Mock data for development
      setMonthlyPlans([
        {
          id: 'plan-001',
          rep_id: 'rep-001',
          rep_name: 'أحمد محمد',
          month: selectedMonth,
          total_visits_planned: 25,
          total_visits_completed: 18,
          completion_rate: 72,
          status: 'active',
          created_by: user.id,
          created_at: '2024-01-01',
          visits: [
            {
              id: 'visit-001',
              clinic_id: 'clinic-001',
              clinic_name: 'عيادة النور',
              doctor_name: 'د. سعد علي',
              planned_date: '2024-01-15',
              status: 'completed',
              actual_date: '2024-01-15',
              notes: 'زيارة ناجحة، تم تقديم العينات',
              rep_notes: ''
            },
            {
              id: 'visit-002',
              clinic_id: 'clinic-002',
              clinic_name: 'مستشفى الرحمة',
              doctor_name: 'د. منى حسن',
              planned_date: '2024-01-16',
              status: 'pending',
              actual_date: null,
              notes: '',
              rep_notes: 'الطبيب في إجازة، سيتم إعادة الجدولة'
            }
          ]
        },
        {
          id: 'plan-002',
          rep_id: 'rep-002',
          rep_name: 'فاطمة أحمد',
          month: selectedMonth,
          total_visits_planned: 20,
          total_visits_completed: 20,
          completion_rate: 100,
          status: 'completed',
          created_by: user.id,
          created_at: '2024-01-01',
          visits: []
        }
      ]);
      
      setSalesReps([
        { id: 'rep-001', name: 'أحمد محمد', region: 'القاهرة' },
        { id: 'rep-002', name: 'فاطمة أحمد', region: 'الجيزة' },
        { id: 'rep-003', name: 'محمد سعد', region: 'الإسكندرية' }
      ]);
      
      setClinics([
        { id: 'clinic-001', name: 'عيادة النور', doctor_name: 'د. سعد علي', area: 'مدينة نصر' },
        { id: 'clinic-002', name: 'مستشفى الرحمة', doctor_name: 'د. منى حسن', area: 'المعادي' },
        { id: 'clinic-003', name: 'عيادة الشفاء', doctor_name: 'د. أحمد علي', area: 'الزمالك' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/planning/create`, planData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadPlanningData();
      setShowCreatePlanModal(false);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleUpdatePlanStatus = async (planId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/planning/${planId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadPlanningData();
    } catch (error) {
      console.error('Error updating plan status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statuses = {
      active: 'نشط',
      completed: 'مكتمل',
      paused: 'متوقف',
      cancelled: 'ملغي'
    };
    return statuses[status] || status;
  };

  const getCompletionColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canManagePlans = () => {
    return ['admin', 'gm', 'area_manager', 'district_manager'].includes(user.role);
  };

  const canViewPlans = () => {
    return ['admin', 'gm', 'area_manager', 'district_manager'].includes(user.role);
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
              <SVGIcon name="calendar" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gradient">
                نظام التخطيط الشهري
              </h2>
              <p className="text-sm md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة الخطط الشهرية وتتبع الزيارات المجدولة
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">الشهر:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-modern"
              />
            </div>
            {canManagePlans() && (
              <button
                onClick={() => setShowCreatePlanModal(true)}
                className="btn-primary flex items-center gap-2 self-end"
              >
                <SVGIcon name="add" size={20} />
                <span>خطة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{monthlyPlans.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي الخطط</div>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {monthlyPlans.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>خطط نشطة</div>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {monthlyPlans.reduce((sum, p) => sum + p.total_visits_planned, 0)}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات مخططة</div>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(monthlyPlans.reduce((sum, p) => sum + p.completion_rate, 0) / monthlyPlans.length) || 0}%
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>معدل الإنجاز</div>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'plans', label: 'الخطط الشهرية', icon: '📋' },
            { id: 'calendar', label: 'التقويم', icon: '📅' },
            { id: 'reports', label: 'التقارير', icon: '📊' },
            { id: 'notes', label: 'الملاحظات', icon: '📝' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'glass-effect hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {monthlyPlans.map((plan) => (
                <div key={plan.id} className="glass-effect p-6 rounded-xl hover:scale-105 transition-transform">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{plan.rep_name}</h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(plan.month).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(plan.status)}`}>
                        {getStatusText(plan.status)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الزيارات المخططة:</span>
                      <span className="font-bold">{plan.total_visits_planned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>الزيارات المكتملة:</span>
                      <span className="font-bold">{plan.total_visits_completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>معدل الإنجاز:</span>
                      <span className={`font-bold ${getCompletionColor(plan.completion_rate)}`}>
                        {plan.completion_rate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>التقدم</span>
                      <span>{plan.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          plan.completion_rate >= 90 ? 'bg-green-500' :
                          plan.completion_rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${plan.completion_rate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowPlanViewModal(true);
                      }}
                      className="btn-info flex-1 text-xs py-2"
                    >
                      عرض التفاصيل
                    </button>
                    {canManagePlans() && plan.status === 'active' && (
                      <button
                        onClick={() => handleUpdatePlanStatus(plan.id, 'paused')}
                        className="btn-warning flex-1 text-xs py-2"
                      >
                        إيقاف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {monthlyPlans.length === 0 && (
              <div className="glass-effect p-12 rounded-xl text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-bold mb-2">لا توجد خطط شهرية</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ابدأ بإنشاء خطة شهرية جديدة للمناديب
                </p>
                {canManagePlans() && (
                  <button
                    onClick={() => setShowCreatePlanModal(true)}
                    className="btn-primary mt-4"
                  >
                    إنشاء خطة جديدة
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreatePlanModal && (
          <CreatePlanModal
            salesReps={salesReps}
            clinics={clinics}
            selectedMonth={selectedMonth}
            onClose={() => setShowCreatePlanModal(false)}
            onSave={handleCreatePlan}
          />
        )}

        {/* Plan View Modal */}
        {showPlanViewModal && selectedPlan && (
          <PlanViewModal
            plan={selectedPlan}
            canEdit={canManagePlans()}
            onClose={() => {
              setShowPlanViewModal(false);
              setSelectedPlan(null);
            }}
            onUpdate={() => {
              loadPlanningData();
              setShowPlanViewModal(false);
              setSelectedPlan(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Create Plan Modal Component
const CreatePlanModal = ({ salesReps, clinics, selectedMonth, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    rep_id: '',
    month: selectedMonth,
    planned_visits: []
  });
  const [selectedRep, setSelectedRep] = useState(null);
  const [tempVisit, setTempVisit] = useState({
    clinic_id: '',
    planned_date: '',
    notes: ''
  });

  const handleAddVisit = () => {
    if (!tempVisit.clinic_id || !tempVisit.planned_date) return;
    
    const clinic = clinics.find(c => c.id === tempVisit.clinic_id);
    const newVisit = {
      ...tempVisit,
      id: Date.now().toString(),
      clinic_name: clinic.name,
      doctor_name: clinic.doctor_name,
      status: 'planned'
    };
    
    setFormData({
      ...formData,
      planned_visits: [...formData.planned_visits, newVisit]
    });
    
    setTempVisit({ clinic_id: '', planned_date: '', notes: '' });
  };

  const handleRemoveVisit = (visitId) => {
    setFormData({
      ...formData,
      planned_visits: formData.planned_visits.filter(v => v.id !== visitId)
    });
  };

  const handleRepChange = (repId) => {
    const rep = salesReps.find(r => r.id === repId);
    setSelectedRep(rep);
    setFormData({ ...formData, rep_id: repId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.rep_id || formData.planned_visits.length === 0) return;
    
    const planData = {
      ...formData,
      total_visits_planned: formData.planned_visits.length
    };
    
    onSave(planData);
  };

  const getDaysInMonth = (month) => {
    const date = new Date(month + '-01');
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    return new Date(year, monthNum + 1, 0).getDate();
  };

  const generateDateOptions = () => {
    const days = getDaysInMonth(selectedMonth);
    const options = [];
    
    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
      const dayName = new Date(dateStr).toLocaleDateString('ar-EG', { weekday: 'long' });
      options.push(
        <option key={dateStr} value={dateStr}>
          {day} - {dayName}
        </option>
      );
    }
    
    return options;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-gradient">
          إنشاء خطة شهرية - {new Date(selectedMonth).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rep Selection */}
          <div className="glass-effect p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-4">اختيار المندوب</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesReps.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => handleRepChange(rep.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    formData.rep_id === rep.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-white hover:bg-opacity-10 border border-gray-600'
                  }`}
                >
                  <h5 className="font-bold">{rep.name}</h5>
                  <p className="text-sm opacity-75">{rep.region}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visit Planning */}
          {selectedRep && (
            <div className="glass-effect p-6 rounded-xl">
              <h4 className="text-lg font-bold mb-4">تخطيط الزيارات</h4>
              
              {/* Add Visit Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border border-gray-600 rounded-lg">
                <div>
                  <label className="block text-sm font-bold mb-2">العيادة:</label>
                  <select
                    value={tempVisit.clinic_id}
                    onChange={(e) => setTempVisit({...tempVisit, clinic_id: e.target.value})}
                    className="form-modern w-full"
                  >
                    <option value="">اختر العيادة</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name} - {clinic.doctor_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">تاريخ الزيارة:</label>
                  <select
                    value={tempVisit.planned_date}
                    onChange={(e) => setTempVisit({...tempVisit, planned_date: e.target.value})}
                    className="form-modern w-full"
                  >
                    <option value="">اختر التاريخ</option>
                    {generateDateOptions()}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">ملاحظات:</label>
                  <input
                    type="text"
                    value={tempVisit.notes}
                    onChange={(e) => setTempVisit({...tempVisit, notes: e.target.value})}
                    className="form-modern w-full"
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddVisit}
                    className="btn-primary w-full"
                    disabled={!tempVisit.clinic_id || !tempVisit.planned_date}
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Planned Visits List */}
              <div className="space-y-3">
                <h5 className="font-bold">الزيارات المخططة ({formData.planned_visits.length}):</h5>
                {formData.planned_visits.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>لم يتم إضافة زيارات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.planned_visits.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
                        <div className="flex-1">
                          <div className="font-bold">{visit.clinic_name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {visit.doctor_name} • {new Date(visit.planned_date).toLocaleDateString('ar-EG')}
                          </div>
                          {visit.notes && (
                            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {visit.notes}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVisit(visit.id)}
                          className="btn-danger text-xs px-3 py-1"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {formData.planned_visits.length > 0 && (
            <div className="glass-effect p-6 rounded-xl">
              <h4 className="text-lg font-bold mb-4">ملخص الخطة</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formData.planned_visits.length}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات مخططة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {new Set(formData.planned_visits.map(v => v.clinic_id)).size}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>عيادات مختلفة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(formData.planned_visits.length / getDaysInMonth(selectedMonth) * 100)}%
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>تغطية الشهر</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={!formData.rep_id || formData.planned_visits.length === 0}
              className="btn-primary flex-1"
            >
              إنشاء الخطة
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Plan View Modal Component
const PlanViewModal = ({ plan, canEdit, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('visits');
  const [visits, setVisits] = useState(plan.visits || []);
  const [newNote, setNewNote] = useState('');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const handleAddNote = async (visitId, note) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/planning/visits/${visitId}/notes`, { note }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setVisits(visits.map(v => 
        v.id === visitId 
          ? { ...v, notes: v.notes ? `${v.notes}\n${note}` : note }
          : v
      ));
      setShowAddNoteModal(false);
      setSelectedVisit(null);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateVisitStatus = async (visitId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/planning/visits/${visitId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(visits.map(v => 
        v.id === visitId ? { ...v, status } : v
      ));
    } catch (error) {
      console.error('Error updating visit status:', error);
    }
  };

  const getVisitStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      postponed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getVisitStatusText = (status) => {
    const statuses = {
      planned: 'مخطط',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      postponed: 'مؤجل'
    };
    return statuses[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">
            خطة {plan.rep_name} - {new Date(plan.month).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Plan Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect p-4 rounded-xl text-center">
            <div className="text-2xl font-bold">{plan.total_visits_planned}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات مخططة</div>
          </div>
          <div className="glass-effect p-4 rounded-xl text-center">
            <div className="text-2xl font-bold">{plan.total_visits_completed}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات مكتملة</div>
          </div>
          <div className="glass-effect p-4 rounded-xl text-center">
            <div className={`text-2xl font-bold ${
              plan.completion_rate >= 90 ? 'text-green-600' :
              plan.completion_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {plan.completion_rate}%
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>معدل الإنجاز</div>
          </div>
          <div className="glass-effect p-4 rounded-xl text-center">
            <div className={`text-lg font-bold px-3 py-1 rounded ${
              plan.status === 'active' ? 'bg-blue-100 text-blue-800' :
              plan.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {plan.status === 'active' ? 'نشط' : 
               plan.status === 'completed' ? 'مكتمل' : plan.status}
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>حالة الخطة</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'visits', label: 'الزيارات', icon: '📅' },
            { id: 'notes', label: 'الملاحظات', icon: '📝' },
            { id: 'analytics', label: 'التحليلات', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'glass-effect hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="glass-effect p-6 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{visit.clinic_name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {visit.doctor_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getVisitStatusColor(visit.status)}`}>
                      {getVisitStatusText(visit.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-bold">التاريخ المخطط:</span>
                    <div>{new Date(visit.planned_date).toLocaleDateString('ar-EG')}</div>
                  </div>
                  {visit.actual_date && (
                    <div>
                      <span className="text-sm font-bold">التاريخ الفعلي:</span>
                      <div>{new Date(visit.actual_date).toLocaleDateString('ar-EG')}</div>
                    </div>
                  )}
                </div>

                {visit.notes && (
                  <div className="mb-4 p-3 bg-white bg-opacity-5 rounded-lg">
                    <span className="text-sm font-bold">ملاحظات:</span>
                    <div className="text-sm mt-1">{visit.notes}</div>
                  </div>
                )}

                {visit.rep_notes && (
                  <div className="mb-4 p-3 bg-yellow-500 bg-opacity-10 rounded-lg">
                    <span className="text-sm font-bold text-yellow-600">ملاحظات المندوب:</span>
                    <div className="text-sm mt-1">{visit.rep_notes}</div>
                  </div>
                )}

                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedVisit(visit);
                        setShowAddNoteModal(true);
                      }}
                      className="btn-info text-xs px-3 py-1"
                    >
                      إضافة ملاحظة
                    </button>
                    {visit.status === 'planned' && (
                      <>
                        <button
                          onClick={() => handleUpdateVisitStatus(visit.id, 'completed')}
                          className="btn-success text-xs px-3 py-1"
                        >
                          تمت الزيارة
                        </button>
                        <button
                          onClick={() => handleUpdateVisitStatus(visit.id, 'postponed')}
                          className="btn-warning text-xs px-3 py-1"
                        >
                          تأجيل
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNoteModal && selectedVisit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="modal-modern p-6 w-full max-w-2xl">
              <h4 className="text-lg font-bold mb-4">إضافة ملاحظة</h4>
              <div className="mb-4">
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {selectedVisit.clinic_name} - {selectedVisit.doctor_name}
                </p>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="form-modern w-full h-20"
                  placeholder="أضف ملاحظتك هنا..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddNote(selectedVisit.id, newNote)}
                  disabled={!newNote.trim()}
                  className="btn-primary flex-1"
                >
                  إضافة الملاحظة
                </button>
                <button
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setSelectedVisit(null);
                    setNewNote('');
                  }}
                  className="btn-secondary flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;