// Admin Dashboard Component - لوحة تحكم الأدمن المحسنة
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import CommonDashboardComponents from './CommonDashboardComponents';
import EnhancedActivityLog from './EnhancedActivityLog';
import SalesPerformance from './SalesPerformance';
import LineCharts from './LineCharts';

const AdminDashboard = ({ 
  user, 
  dashboardData = {}, 
  timeFilter, 
  onTimeFilterChange, 
  onRefresh,
  language = 'en',
  isRTL = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({});
  const { t, tc, tn, tm } = useGlobalTranslation(language);

  const API_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // تحميل صحة النظام
  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل صحة النظام:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemHealth();
  }, [timeFilter]);

  // Admin stats with better horizontal layout
  const adminStats = [
    {
      title: language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
      value: (dashboardData.total_users || 0).toLocaleString(),
      icon: '👥',
      change: language === 'ar' ? '+5 مستخدم هذا الشهر' : '+5 users this month',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: 'up'
    },
    {
      title: language === 'ar' ? 'العيادات النشطة' : 'Active Clinics',
      value: (dashboardData.total_clinics || 0).toLocaleString(),
      icon: '🏥',
      change: `${Math.round((dashboardData.total_clinics || 0) * 0.85)} ${language === 'ar' ? 'عيادة متاحة' : 'clinics available'}`,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      trend: 'up'
    },
    {
      title: language === 'ar' ? 'المنتجات المتاحة' : 'Available Products',
      value: (dashboardData.total_products || 0).toLocaleString(),
      icon: '📦',
      change: language === 'ar' ? 'جميع المنتجات متوفرة' : 'All products available',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      trend: 'neutral'
    },
    {
      title: language === 'ar' ? 'الطلبات اليوم' : 'Today\'s Orders',
      value: (dashboardData.orders_in_period || 0).toLocaleString(),
      icon: '📋',
      change: `${dashboardData.visits_in_period || 0} ${language === 'ar' ? 'زيارة مجدولة' : 'scheduled visits'}`,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      trend: 'up'
    }
  ];

  // Admin quick actions with proper navigation
  const adminQuickActions = [
    {
      label: language === 'ar' ? 'إضافة مستخدم' : 'Add User',
      icon: '👤➕',
      onClick: () => {
        // Navigate to User Management section
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'UserManagement' }));
      },
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: language === 'ar' ? 'إدارة العيادات' : 'Manage Clinics',
      icon: '🏥⚙️',
      onClick: () => {
        // Navigate to Clinics Management section
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'ClinicsManagement' }));
      },
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: language === 'ar' ? 'النظام المالي' : 'Financial Management',
      icon: '💰📊',
      onClick: () => {
        // Navigate to Financial Management section
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'UnifiedFinancialDashboard' }));
      },
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      label: language === 'ar' ? 'إدارة الزيارات' : 'Visits Management',
      icon: '🏥📋',
      onClick: () => {
        // Navigate to Visits Management section  
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'EnhancedVisitsManagement' }));
      },
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      label: language === 'ar' ? 'إدارة المنتجات' : 'Products Management',
      icon: '📦🔧',
      onClick: () => {
        // Navigate to Products Management section
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'ProductManagement' }));
      },
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
    },
    {
      label: language === 'ar' ? 'تتبع الأنشطة' : 'Activity Tracking',
      icon: '📈🔍',
      onClick: () => {
        // Navigate to Activity Tracking section
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'ActivityTrackingFixed' }));
      },
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  return (
    <div className="space-y-6 p-4" dir={isRTL ? 'rtl' : 'ltr'}> {/* Reduced padding and space */}
      {/* Enhanced Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {language === 'ar' ? 'لوحة تحكم الأدمن المتقدمة' : 'Advanced Admin Dashboard'}
            </h1>
            <p className="text-blue-100 text-lg">
              {(language === 'ar' ? 'مرحباً {name} 👨‍💻 - إدارة شاملة للنظام' : 'Welcome {name} 👨‍💻 - Comprehensive System Management').replace('{name}', user?.full_name || user?.username)}
            </p>
            <div className="flex items-center space-x-4 space-x-reverse mt-4">
              <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm">{language === 'ar' ? 'النظام يعمل بكفاءة' : 'System Running Efficiently'}</span>
              </div>
              <div className="text-sm bg-white/20 rounded-full px-3 py-1">
                📊 {Object.keys(dashboardData).length} {language === 'ar' ? 'مؤشر متاح' : 'indicators available'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                weekday: 'long'
              })}
            </div>
            <div className="text-lg text-blue-100">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Better Layout - Fixed spacing between blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
        {adminStats.map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl opacity-80">{stat.icon}</div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.title}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-75 flex-1">{stat.change}</div>
              <div className="text-xl">
                {stat.trend === 'up' ? '📈' : stat.trend === 'down' ? '📉' : '➡️'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid - Fixed spacing */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <span className="text-blue-600 mr-3 text-3xl">⚡</span>
          {language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {adminQuickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} border-2 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            >
              <div className="text-2xl mb-3">{action.icon}</div>
              <div className="text-sm font-semibold">{action.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Health Indicators - Fixed spacing */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-green-600 mr-3 text-3xl">💚</span>
            {language === 'ar' ? 'مؤشرات صحة النظام' : 'System Health Indicators'}
          </h3>
          <button
            onClick={loadSystemHealth}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl border border-green-600 hover:border-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <span className={`mr-3 text-lg ${loading ? 'animate-spin' : ''}`}>
              {loading ? '⏳' : '🔄'}
            </span>
            {loading ? tc('loading') : (language === 'ar' ? 'تحديث الحالة' : 'Update Status')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</p>
                <p className="text-4xl font-black text-green-700">
                  {systemHealth.database === 'connected' ? '✅' : '❌'}
                </p>
              </div>
              <div className="text-green-600 text-5xl">🗄️</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {systemHealth.database === 'connected' 
                ? (language === 'ar' ? 'متصلة ومستقرة' : 'Connected & Stable') 
                : (language === 'ar' ? 'غير متصلة' : 'Disconnected')
              }
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">{language === 'ar' ? 'وقت التشغيل' : 'Uptime'}</p>
                <p className="text-4xl font-black text-blue-700">99.9%</p>
              </div>
              <div className="text-blue-600 text-5xl">⏱️</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">{language === 'ar' ? 'أداء ممتاز' : 'Excellent Performance'}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">{language === 'ar' ? 'الذاكرة' : 'Memory'}</p>
                <p className="text-4xl font-black text-purple-700">68%</p>
              </div>
              <div className="text-purple-600 text-5xl">💾</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">{language === 'ar' ? 'ضمن الحدود الطبيعية' : 'Within Normal Range'}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">{language === 'ar' ? 'المعالج' : 'CPU'}</p>
                <p className="text-4xl font-black text-orange-700">45%</p>
              </div>
              <div className="text-orange-600 text-5xl">⚡</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">{language === 'ar' ? 'أداء مثالي' : 'Optimal Performance'}</p>
          </div>
        </div>
      </div>

      {/* User Distribution by Roles - Fixed spacing */}
      {dashboardData.user_roles_distribution && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-blue-600 mr-3 text-3xl">👥</span>
            {language === 'ar' ? 'توزيع المستخدمين حسب الأدوار' : 'User Distribution by Roles'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {dashboardData.user_roles_distribution.map((role, index) => (
              <div key={role._id || index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:border-blue-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 capitalize mb-2">
                      {role._id === 'admin' ? `👨‍💼 ${language === 'ar' ? 'مدير' : 'Admin'}` :
                       role._id === 'medical_rep' ? `👨‍⚕️ ${language === 'ar' ? 'مندوب طبي' : 'Medical Rep'}` :
                       role._id === 'accounting' ? `💰 ${language === 'ar' ? 'محاسب' : 'Accountant'}` :
                       role._id === 'manager' ? `👨‍💼 ${language === 'ar' ? 'مدير فرع' : 'Manager'}` :
                       `👤 ${role._id}`}
                    </p>
                    <p className="text-3xl font-black text-gray-900">{role.count}</p>
                  </div>
                  <CommonDashboardComponents.CircularProgress 
                    percentage={(role.count / dashboardData.total_users) * 100}
                    size={60}
                    strokeWidth={8}
                    showPercentage={false}
                    color="#3b82f6"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {((role.count / dashboardData.total_users) * 100).toFixed(1)}% {language === 'ar' ? 'من المستخدمين' : 'of users'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts and Analytics - Full Width Layout for Better Data Display */}
      <div className="space-y-8 mb-8">
        {/* System Performance - Full Width */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-blue-600 mr-3 text-3xl">📈</span>
              {language === 'ar' ? 'أداء النظام العام' : 'Overall System Performance'}
            </h3>
            <p className="text-gray-700 font-medium mt-2">
              {language === 'ar' ? 'تحليل شامل لأداء النظام والمبيعات - عرض محسن للبيانات' : 'Comprehensive analysis of system and sales performance - Enhanced data display'}
            </p>
          </div>
          <div className="w-full h-80">
            <SalesPerformance 
              data={[
                { period: language === 'ar' ? 'يناير' : 'January', sales: 15000, target: 12000, orders: 45 },
                { period: language === 'ar' ? 'فبراير' : 'February', sales: 18500, target: 15000, orders: 52 },
                { period: language === 'ar' ? 'مارس' : 'March', sales: 22000, target: 18000, orders: 67 },
                { period: language === 'ar' ? 'أبريل' : 'April', sales: 19000, target: 20000, orders: 58 },
                { period: language === 'ar' ? 'مايو' : 'May', sales: 25000, target: 22000, orders: 75 },
                { period: language === 'ar' ? 'يونيو' : 'June', sales: 28000, target: 25000, orders: 82 },
                { period: language === 'ar' ? 'يوليو' : 'July', sales: 31000, target: 28000, orders: 90 },
                { period: language === 'ar' ? 'أغسطس' : 'August', sales: 33500, target: 30000, orders: 98 }
              ]}
              title=""
              timeFilter={timeFilter}
              fullWidth={true}
              enhanced={true}
              onExport={(data) => console.log('Export performance data:', data)}
              onViewDetails={(data) => console.log('View performance details:', data)}
            />
          </div>
        </div>

        {/* Usage Trends - Full Width */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-purple-600 mr-3 text-3xl">📊</span>
              {language === 'ar' ? 'اتجاهات استخدام النظام' : 'System Usage Trends'}
            </h3>
            <p className="text-gray-700 font-medium mt-2">
              {language === 'ar' ? 'معدل استخدام النظام على مدار الأسبوع - عرض تفصيلي شامل' : 'System usage rate throughout the week - Comprehensive detailed view'}
            </p>
          </div>
          <div className="w-full h-80">
            <LineCharts 
              data={[
                { x: language === 'ar' ? 'السبت' : 'Saturday', y: 120, users: 45, sessions: 280 },
                { x: language === 'ar' ? 'الأحد' : 'Sunday', y: 150, users: 58, sessions: 320 },
                { x: language === 'ar' ? 'الإثنين' : 'Monday', y: 180, users: 72, sessions: 410 },
                { x: language === 'ar' ? 'الثلاثاء' : 'Tuesday', y: 165, users: 65, sessions: 380 },
                { x: language === 'ar' ? 'الأربعاء' : 'Wednesday', y: 200, users: 80, sessions: 450 },
                { x: language === 'ar' ? 'الخميس' : 'Thursday', y: 145, users: 55, sessions: 320 },
                { x: language === 'ar' ? 'الجمعة' : 'Friday', y: 110, users: 42, sessions: 260 }
              ]}
              title=""
              xAxisLabel={language === 'ar' ? 'أيام الأسبوع' : 'Days of the week'}
              yAxisLabel={language === 'ar' ? 'عدد المستخدمين النشطين' : 'Number of active users'}
              fullWidth={true}
              enhanced={true}
              interactive={true}
              onDataPointClick={(item, index) => console.log('Clicked on:', item)}
            />
          </div>
        </div>
      </div>

      {/* Financial Overview - Improved Horizontal Layout */}
      {dashboardData.financial_overview && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-green-600 mr-3 text-3xl">💰</span>
            {language === 'ar' ? 'الملخص المالي الشامل' : 'Comprehensive Financial Overview'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-lg border border-green-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">
                  {language === 'ar' ? 'إجمالي الديون' : 'Total Outstanding'}
                </h4>
                <span className="text-green-600 text-4xl">💳</span>
              </div>
              <p className="text-4xl font-black text-green-700 mb-3">
                {(dashboardData.financial_overview.total_outstanding || 0).toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
              </p>
              <p className="text-base font-semibold text-gray-800">
                {dashboardData.financial_overview.total_debts || 0} {language === 'ar' ? 'دين نشط' : 'active debts'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg border border-blue-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">
                  {language === 'ar' ? 'المبلغ المحصل' : 'Amount Collected'}
                </h4>
                <span className="text-blue-600 text-4xl">💰</span>
              </div>
              <p className="text-4xl font-black text-blue-700 mb-3">
                {(dashboardData.financial_overview.total_settled || 0).toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
              </p>
              <p className="text-base font-semibold text-gray-800">
                {language === 'ar' ? 'تم تحصيله بنجاح' : 'Successfully collected'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 shadow-lg border border-purple-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">
                  {language === 'ar' ? 'معدل التحصيل' : 'Collection Rate'}
                </h4>
                <span className="text-purple-600 text-4xl">📊</span>
              </div>
              <p className="text-4xl font-black text-purple-700 mb-3">
                {dashboardData.financial_overview.total_outstanding > 0 ? 
                  Math.round((dashboardData.financial_overview.total_settled / 
                    (dashboardData.financial_overview.total_outstanding + dashboardData.financial_overview.total_settled)) * 100) : 0}%
              </p>
              <p className="text-base font-semibold text-gray-800">
                {language === 'ar' ? 'من إجمالي المبلغ' : 'of total amount'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Activity Log - Professional System Heart */}
      <div className="mb-8">
        <EnhancedActivityLog 
          activities={dashboardData.recent_activities || []}
          title={language === 'ar' ? 'سجل أنشطة النظام الحديثة' : 'Recent System Activity Log'}
          maxItems={15}
          showFilters={true}
          showRefresh={true}
          onRefresh={onRefresh}
          language={language}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;