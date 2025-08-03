// EP Group System - Central Component Registry
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

  // User Management
  UserManagement: createLazyComponent(
    () => import('../Users/UserManagement'),
    'جاري تحميل إدارة المستخدمين...'
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
  CRMManagement: createLazyComponent(
    () => import('../CRM/CRMManagement'),
    'جاري تحميل إدارة علاقات العملاء...'
  ),

  // Visit Management
  VisitManagement: createLazyComponent(
    () => import('../Visits/VisitManagement'),
    'جاري تحميل إدارة الزيارات وسجل الدخول...'
  ),

  // Activity Tracking
  ActivityTracking: createLazyComponent(
    () => import('../Tracking/ActivityTracking'),
    'جاري تحميل تتبع الأنشطة والحركات...'
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

  GPSTracking: createLazyComponent(
    () => import('../GPS/GPSTracking'),
    'جاري تحميل تتبع المواقع...'
  ),

  AdvancedAnalytics: createLazyComponent(
    () => import('../Analytics/AdvancedAnalytics'),
    'جاري تحميل التحليلات المتقدمة...'
  ),

  // Settings
  Settings: createLazyComponent(
    () => import('../Settings/Settings'),
    'جاري تحميل الإعدادات...'
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