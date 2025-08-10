// Admin Dashboard Component - لوحة تحكم الأدمن المحسنة
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import CommonDashboardComponents from './CommonDashboardComponents';
import ActivityLog from './ActivityLog';
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

  // Admin quick actions with translations
  const adminQuickActions = [
    {
      label: language === 'ar' ? 'إضافة مستخدم' : 'Add User',
      icon: '👤➕',
      onClick: () => console.log('Add user'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: language === 'ar' ? 'إدارة العيادات' : 'Manage Clinics',
      icon: '🏥⚙️',
      onClick: () => console.log('Manage clinics'),
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: language === 'ar' ? 'تقارير النظام' : 'System Reports',
      icon: '📊📋',
      onClick: () => console.log('System Reports'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      label: language === 'ar' ? 'النسخ الاحتياطي' : 'Backup',
      icon: '💾🔒',
      onClick: () => console.log('Backup'),
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      label: language === 'ar' ? 'مراقبة النظام' : 'System Monitoring',
      icon: '📈🔍',
      onClick: () => loadSystemHealth(),
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
    },
    {
      label: language === 'ar' ? 'إعدادات متقدمة' : 'Advanced Settings',
      icon: '⚙️🎛️',
      onClick: () => console.log('Advanced Settings'),
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
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

      {/* Stats Grid with Better Layout - Enhanced Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
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

      {/* Quick Actions Grid - Horizontal Layout */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-blue-600 mr-3 text-3xl">⚡</span>
          {language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {adminQuickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} border-2 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm font-semibold">{action.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* مؤشرات صحة النظام */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-green-600 mr-3 text-3xl">💚</span>
            {t('system_health')}
          </h3>
          <button
            onClick={loadSystemHealth}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl border-2 border-green-600 hover:border-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <span className={`mr-3 text-lg ${loading ? 'animate-spin' : ''}`}>
              {loading ? '⏳' : '🔄'}
            </span>
            {loading ? t('updating') : t('update_status')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">قاعدة البيانات</p>
                <p className="text-4xl font-black text-green-700">
                  {systemHealth.database === 'connected' ? '✅' : '❌'}
                </p>
              </div>
              <div className="text-green-600 text-5xl">🗄️</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {systemHealth.database === 'connected' ? 'متصلة ومستقرة' : 'غير متصلة'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">وقت التشغيل</p>
                <p className="text-4xl font-black text-blue-700">99.9%</p>
              </div>
              <div className="text-blue-600 text-5xl">⏱️</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">أداء ممتاز</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">الذاكرة</p>
                <p className="text-4xl font-black text-purple-700">68%</p>
              </div>
              <div className="text-purple-600 text-5xl">💾</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">ضمن الحدود الطبيعية</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-orange-300 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">المعالج</p>
                <p className="text-4xl font-black text-orange-700">45%</p>
              </div>
              <div className="text-orange-600 text-5xl">⚡</div>
            </div>
            <p className="text-sm font-semibold text-gray-800">أداء مثالي</p>
          </div>
        </div>
      </div>

      {/* توزيع المستخدمين والأدوار */}
      {dashboardData.user_roles_distribution && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-blue-600 mr-3 text-3xl">👥</span>
            توزيع المستخدمين حسب الأدوار
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {dashboardData.user_roles_distribution.map((role, index) => (
              <div key={role._id || index} className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all hover:border-blue-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 capitalize mb-2">
                      {role._id === 'admin' ? '👨‍💼 مدير' :
                       role._id === 'medical_rep' ? '👨‍⚕️ مندوب طبي' :
                       role._id === 'accounting' ? '💰 محاسب' :
                       role._id === 'manager' ? '👨‍💼 مدير فرع' :
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
                  {((role.count / dashboardData.total_users) * 100).toFixed(1)}% من المستخدمين
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الرسوم البيانية والتحليلات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* أداء النظام */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-blue-600 mr-3 text-2xl">📈</span>
              أداء النظام العام
            </h3>
            <p className="text-gray-700 font-medium mt-2">تحليل شامل لأداء النظام والمبيعات</p>
          </div>
          <SalesPerformance 
            data={[
              { period: 'اليوم', sales: 15000, target: 12000, orders: 45 },
              { period: 'أمس', sales: 8500, target: 12000, orders: 32 },
              { period: 'قبل يومين', sales: 22000, target: 12000, orders: 67 },
              { period: 'قبل 3 أيام', sales: 18000, target: 12000, orders: 54 }
            ]}
            title=""
            timeFilter={timeFilter}
            onExport={(data) => console.log('تصدير بيانات الأداء:', data)}
            onViewDetails={(data) => console.log('عرض تفاصيل الأداء:', data)}
          />
        </div>

        {/* اتجاهات الاستخدام */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-purple-600 mr-3 text-2xl">📊</span>
              اتجاهات استخدام النظام
            </h3>
            <p className="text-gray-700 font-medium mt-2">معدل استخدام النظام خلال الأسبوع</p>
          </div>
          <LineCharts 
            data={[
              { x: 'الإثنين', y: 120 },
              { x: 'الثلاثاء', y: 150 },
              { x: 'الأربعاء', y: 180 },
              { x: 'الخميس', y: 165 },
              { x: 'الجمعة', y: 200 },
              { x: 'السبت', y: 145 },
              { x: 'الأحد', y: 110 }
            ]}
            title=""
            xAxisLabel="أيام الأسبوع"
            yAxisLabel="عدد المستخدمين النشطين"
            interactive={true}
            onDataPointClick={(item, index) => console.log('نقر على:', item)}
          />
        </div>
      </div>

      {/* الملخص المالي */}
      {dashboardData.financial_overview && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-green-600 mr-3 text-3xl">💰</span>
            الملخص المالي الشامل
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-green-400 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">إجمالي الديون</h4>
                <span className="text-green-600 text-4xl">💳</span>
              </div>
              <p className="text-4xl font-black text-green-700 mb-3">
                {(dashboardData.financial_overview.total_outstanding || 0).toLocaleString()} ج.م
              </p>
              <p className="text-base font-semibold text-gray-800">
                {dashboardData.financial_overview.total_debts || 0} دين نشط
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-400 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">المبلغ المحصل</h4>
                <span className="text-blue-600 text-4xl">💰</span>
              </div>
              <p className="text-4xl font-black text-blue-700 mb-3">
                {(dashboardData.financial_overview.total_settled || 0).toLocaleString()} ج.م
              </p>
              <p className="text-base font-semibold text-gray-800">تم تحصيله بنجاح</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-400 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">معدل التحصيل</h4>
                <span className="text-purple-600 text-4xl">📊</span>
              </div>
              <p className="text-4xl font-black text-purple-700 mb-3">
                {dashboardData.financial_overview.total_outstanding > 0 ? 
                  Math.round((dashboardData.financial_overview.total_settled / 
                    (dashboardData.financial_overview.total_outstanding + dashboardData.financial_overview.total_settled)) * 100) : 0}%
              </p>
              <p className="text-base font-semibold text-gray-800">من إجمالي المبلغ</p>
            </div>
          </div>
        </div>
      )}

      {/* سجل الأنشطة المحسن */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-2">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-indigo-600 mr-3 text-3xl">📊</span>
            سجل أنشطة النظام الحديثة
          </h3>
          <p className="text-gray-700 font-medium mb-6">متابعة شاملة لجميع الأنشطة والعمليات في النظام</p>
        </div>
        
        <ActivityLog 
          activities={dashboardData.recent_activities || []}
          title=""
          showFilters={true}
          showRefresh={true}
          onRefresh={onRefresh}
          quickActions={[
            {
              label: 'تصدير السجل الكامل',
              icon: '📋💾',
              onClick: () => console.log('تصدير السجل الكامل'),
              color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            },
            {
              label: 'إعدادات التنبيهات',
              icon: '🔔⚙️',
              onClick: () => console.log('إعدادات التنبيهات'),
              color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
            }
          ]}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;