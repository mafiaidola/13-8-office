// Medical Management System - Central Component Registry
// سجل المكونات المركزي

import React, { Suspense, lazy } from 'react';

// Loading Component
const LoadingSpinner = ({ message = 'جاري التحميل...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error Boundary Component
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">خطأ في تحميل المكون</h3>
          <p className="text-gray-600 mb-4">حدث خطأ أثناء تحميل هذا القسم</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy Load Components with Error Boundaries
const createLazyComponent = (importFunc, fallbackMessage) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <ComponentErrorBoundary>
      <Suspense fallback={<LoadingSpinner message={fallbackMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    </ComponentErrorBoundary>
  );
};

// Component Registry - سجل المكونات
export const COMPONENT_REGISTRY = {
  // Core Components
  Dashboard: createLazyComponent(
    () => import('../Dashboard/Dashboard'),
    'جاري تحميل لوحة التحكم...'  
  ),
  EnhancedDashboard: createLazyComponent(
    () => import('../Dashboard/EnhancedDashboard'),
    'جاري تحميل لوحة التحكم المحسنة...'
  ),
  RoleBasedDashboard: createLazyComponent(
    () => import('../Dashboard/RoleBasedDashboard'),
    'جاري تحميل لوحة التحكم حسب الدور...'
  ),
  AdminDashboard: createLazyComponent(
    () => import('../Dashboard/AdminDashboard'),
    'جاري تحميل لوحة تحكم المدير...'
  ),
  GMDashboard: createLazyComponent(
    () => import('../Dashboard/GMDashboard'),
    'جاري تحميل لوحة تحكم المدير العام...'
  ),
  MedicalRepDashboard: createLazyComponent(
    () => import('../Dashboard/MedicalRepDashboard'),
    'جاري تحميل لوحة تحكم المندوب الطبي...'
  ),
  AccountingDashboard: createLazyComponent(
    () => import('../Dashboard/AccountingDashboard'),
    'جاري تحميل لوحة تحكم المحاسبة...'
  ),
  ManagerDashboard: createLazyComponent(
    () => import('../Dashboard/ManagerDashboard'),
    'جاري تحميل لوحة تحكم المدير...'
  ),
  SalesRepresentativeDashboard: createLazyComponent(
    () => import('../Dashboard/SalesRepresentativeDashboard'),
    'جاري تحميل لوحة تحكم المندوب التجاري...'
  ),
  MedicalRepresentativeDashboard: createLazyComponent(
    () => import('../Dashboard/MedicalRepresentativeDashboard'),
    'جاري تحميل لوحة تحكم المندوب الطبي...'
  ),

  // User Management
  UserManagement: createLazyComponent(
    () => import('../Users/UserManagement'),
    'جاري تحميل إدارة المستخدمين...'
  ),
  AddUserModal: createLazyComponent(
    () => import('../Users/AddUserModal'),
    'جاري تحميل نافذة إضافة مستخدم...'
  ),

  // Clinic Management
  RepClinicRegistration: createLazyComponent(
    () => import('../Clinics/RepClinicRegistration'),
    'جاري تحميل تسجيل العيادات...'
  ),
  
  ClinicsManagement: createLazyComponent(
    () => import('../Clinics/ClinicsManagement'),
    'جاري تحميل إدارة العيادات...'
  ),

  // Product Management
  ProductManagement: createLazyComponent(
    () => import('../Products/ProductManagement'),
    'جاري تحميل إدارة المنتجات...'
  ),

  // Warehouse Management
  WarehouseManagement: createLazyComponent(
    () => import('../Warehouses/WarehouseManagement'),
    'جاري تحميل إدارة المخازن...'
  ),

  // User Profile Components
  UserProfile: createLazyComponent(
    () => import('../Profile/UserProfile'),
    'جاري تحميل الملف الشخصي...'
  ),

  UserSettings: createLazyComponent(
    () => import('../Profile/UserSettings'),
    'جاري تحميل إعدادات المستخدم...'
  ),

  // Accounting Management
  AccountingManagement: createLazyComponent(
    () => import('../Accounting/AccountingManagement'),
    'جاري تحميل إدارة الحسابات والفواتير...'
  ),

  // Debt and Collection Management - Phase 2
  AdvancedAnalytics: createLazyComponent(
    () => import('../Analytics/AdvancedAnalytics'),
    'جاري تحميل التحليلات المتقدمة...'
  ),

  // Activity Tracking
  ActivityTracking: createLazyComponent(
    () => import('../ActivityTracking/ActivityTracking'),
    'جاري تحميل تتبع الأنشطة والحركات...'
  ),

  // Visits Management
  VisitsManagement: createLazyComponent(
    () => import('../Visits/VisitsManagement'),
    'جاري تحميل إدارة الزيارات المحسنة...'
  ),

  // Visit Management
  VisitRegistration: createLazyComponent(
    () => import('../Visits/VisitRegistration'),
    'جاري تحميل تسجيل الزيارات...'
  ),

  // Orders Management
  OrdersManagement: createLazyComponent(
    () => import('../Orders/OrdersManagement'),
    'جاري تحميل إدارة الطلبات...'
  ),

  // Geographic Management
  LinesAreasManagement: createLazyComponent(
    () => import('../Geographic/LinesAreasManagement'),
    'جاري تحميل إدارة الخطوط والمناطق...'
  ),

  // Planning
  SalesRepPlanManagement: createLazyComponent(
    () => import('../Planning/SalesRepPlanManagement'),
    'جاري تحميل التخطيط الشهري...'
  ),

  // Reports & Analytics
  ReportsManagement: createLazyComponent(
    () => import('../Reports/ReportsManagement'),
    'جاري تحميل التقارير والتحليلات...'
  ),

  // Administrative Functions
  GamificationSystem: createLazyComponent(
    () => import('../Gamification/GamificationSystem'),
    'جاري تحميل نظام التحفيز...'
  ),

  // Debt Collection Management
  DebtCollectionManagement: createLazyComponent(
    () => import('../DebtCollection/DebtCollectionManagement'),
    'جاري تحميل إدارة الديون والتحصيل...'
  ),

  // Integrated Financial System
  IntegratedFinancialDashboard: createLazyComponent(
    () => import('../Financial/IntegratedFinancialDashboard'),
    'جاري تحميل النظام المالي المتكامل...'
  ),
  
  // Enhanced Financial System  
  UnifiedFinancialDashboard: createLazyComponent(
    () => import('../Financial/UnifiedFinancialDashboard'),
    'جاري تحميل النظام المالي الموحد...'
  ),
  
  // Visits Management
  VisitsManagement: createLazyComponent(
    () => import('../Visits/VisitsManagement'),
    'جاري تحميل إدارة الزيارات...'
  ),
  
  // Enhanced Clinic Management System
  EnhancedClinicRegistration: createLazyComponent(
    () => import('../Clinics/EnhancedClinicRegistration'),
    'جاري تحميل تسجيل العيادات المحسن...'
  ),
  AdminRegistrationLogs: createLazyComponent(
    () => import('../Clinics/AdminRegistrationLogs'),
    'جاري تحميل سجلات التسجيل الإدارية...'
  ),
  AvailableClinics: createLazyComponent(
    () => import('../Clinics/AvailableClinics'),
    'جاري تحميل العيادات المتاحة...'
  ),

  GPSTracking: createLazyComponent(
    () => import('../GPS/GPSTracking'),
    'جاري تحميل تتبع المواقع...'
  ),
  LocationTracking: createLazyComponent(
    () => import('../Location/LocationTracking'),
    'جاري تحميل تتبع المواقع المتقدم...'
  ),

  // Settings
  Settings: createLazyComponent(
    () => import('../Settings/Settings'),
    'جاري تحميل الإعدادات...'
  ),

  // Dashboard Support Components
  CommonDashboardComponents: createLazyComponent(
    () => import('../Dashboard/CommonDashboardComponents'),
    'جاري تحميل مكونات لوحة التحكم المشتركة...'
  ),
  DashboardWrapper: createLazyComponent(
    () => import('../Dashboard/DashboardWrapper'),
    'جاري تحميل غلاف لوحة التحكم...'
  ),
  ActivityLog: createLazyComponent(
    () => import('../Dashboard/ActivityLog'),
    'جاري تحميل سجل الأنشطة...'
  ),
  SalesPerformance: createLazyComponent(
    () => import('../Dashboard/SalesPerformance'),
    'جاري تحميل أداء المبيعات...'
  ),
  LineCharts: createLazyComponent(
    () => import('../Dashboard/LineCharts'),
    'جاري تحميل الرسوم البيانية...'
  ),
  
  // Excel Management System
  ExcelManager: createLazyComponent(
    () => import('../Excel/ExcelManager'),
    'جاري تحميل نظام إدارة Excel...'
  ),
  ExcelDashboard: createLazyComponent(
    () => import('../Excel/ExcelDashboard'),
    'جاري تحميل لوحة تحكم Excel...'
  )
};

// Component Renderer - عارض المكونات
export const ComponentRenderer = ({ componentName, ...props }) => {
  const Component = COMPONENT_REGISTRY[componentName];
  
  if (!Component) {
    return (
      <div className="p-8 text-center">
        <div className="text-yellow-600 text-6xl mb-4">❓</div>
        <h3 className="text-xl font-bold text-yellow-600 mb-2">مكون غير موجود</h3>
        <p className="text-gray-600">المكون "{componentName}" غير مسجل في النظام</p>
        <div className="mt-4 text-sm text-gray-500">
          المكونات المتاحة: {Object.keys(COMPONENT_REGISTRY).join(', ')}
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm">تم استخدام مكون افتراضي لعرض المحتوى</p>
        </div>
      </div>
    );
  }

  return <Component {...props} />;
};

// Component Preloader - محمل المكونات المسبق
export const preloadComponent = (componentName) => {
  const Component = COMPONENT_REGISTRY[componentName];
  if (Component && Component.preload) {
    Component.preload();
  }
};

// Preload critical components
export const preloadCriticalComponents = () => {
  const criticalComponents = ['Dashboard', 'UserManagement', 'RepClinicRegistration'];
  criticalComponents.forEach(preloadComponent);
};

export default COMPONENT_REGISTRY;