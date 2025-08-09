// Admin Dashboard Component - لوحة تحكم الأدمن المحسنة
import React, { useState, useEffect } from 'react';
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
  language = 'ar',
  isRTL = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({});

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

  // الإحصائيات المخصصة للأدمن مع التحسينات البصرية
  const adminStats = [
    {
      title: 'إجمالي المستخدمين',
      value: (dashboardData.total_users || 0).toLocaleString(),
      icon: '👥',
      change: '+5 مستخدم هذا الشهر',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: 'up'
    },
    {
      title: 'العيادات النشطة',
      value: (dashboardData.total_clinics || 0).toLocaleString(),
      icon: '🏥',
      change: `${Math.round((dashboardData.total_clinics || 0) * 0.85)} عيادة متاحة`,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      trend: 'up'
    },
    {
      title: 'المنتجات المتاحة',
      value: (dashboardData.total_products || 0).toLocaleString(),
      icon: '📦',
      change: 'جميع المنتجات متوفرة',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      trend: 'neutral'
    },
    {
      title: 'الطلبات اليوم',
      value: (dashboardData.orders_in_period || 0).toLocaleString(),
      icon: '📋',
      change: `${dashboardData.visits_in_period || 0} زيارة مجدولة`,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      trend: 'up'
    }
  ];

  // الإجراءات السريعة للأدمن
  const adminQuickActions = [
    {
      label: 'إضافة مستخدم',
      icon: '👤➕',
      onClick: () => console.log('إضافة مستخدم'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: 'إدارة العيادات',
      icon: '🏥⚙️',
      onClick: () => console.log('إدارة العيادات'),
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: 'تقارير النظام',
      icon: '📊📋',
      onClick: () => console.log('تقارير النظام'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      label: 'النسخ الاحتياطي',
      icon: '💾🔒',
      onClick: () => console.log('النسخ الاحتياطي'),
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      label: 'مراقبة النظام',
      icon: '📈🔍',
      onClick: () => loadSystemHealth(),
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
    },
    {
      label: 'إعدادات متقدمة',
      icon: '⚙️🎛️',
      onClick: () => console.log('إعدادات متقدمة'),
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* رأس لوحة التحكم المحسن */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              لوحة تحكم الأدمن المتقدمة
            </h1>
            <p className="text-blue-100 text-lg">
              مرحباً {user?.full_name || user?.username} 👨‍💻 - إدارة شاملة للنظام
            </p>
            <div className="flex items-center space-x-4 space-x-reverse mt-4">
              <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm">النظام يعمل بكفاءة</span>
              </div>
              <div className="text-sm bg-white/20 rounded-full px-3 py-1">
                📊 {Object.keys(dashboardData).length} مؤشر متاح
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {new Date().toLocaleDateString('ar-EG', { 
                weekday: 'long'
              })}
            </div>
            <div className="text-lg text-blue-100">
              {new Date().toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات الرئيسية مع الإجراءات السريعة */}
      <CommonDashboardComponents.StatsGrid 
        stats={adminStats}
        quickActions={adminQuickActions}
      />

      {/* مؤشرات صحة النظام */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-green-600 mr-3 text-3xl">💚</span>
            مؤشرات صحة النظام
          </h3>
          <button
            onClick={loadSystemHealth}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl border-2 border-green-600 hover:border-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <span className={`mr-3 text-lg ${loading ? 'animate-spin' : ''}`}>
              {loading ? '⏳' : '🔄'}
            </span>
            {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء النظام */}
        <SalesPerformance 
          data={[
            { period: 'اليوم', sales: 15000, target: 12000, orders: 45 },
            { period: 'أمس', sales: 8500, target: 12000, orders: 32 },
            { period: 'قبل يومين', sales: 22000, target: 12000, orders: 67 },
            { period: 'قبل 3 أيام', sales: 18000, target: 12000, orders: 54 }
          ]}
          title="أداء النظام العام"
          timeFilter={timeFilter}
          onExport={(data) => console.log('تصدير بيانات الأداء:', data)}
          onViewDetails={(data) => console.log('عرض تفاصيل الأداء:', data)}
        />

        {/* اتجاهات الاستخدام */}
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
          title="اتجاهات استخدام النظام"
          xAxisLabel="أيام الأسبوع"
          yAxisLabel="عدد المستخدمين النشطين"
          interactive={true}
          onDataPointClick={(item, index) => console.log('نقر على:', item)}
        />
      </div>

      {/* الملخص المالي */}
      {dashboardData.financial_overview && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-green-600 mr-3">💰</span>
            الملخص المالي الشامل
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-green-800">إجمالي الديون</h4>
                <span className="text-green-600 text-2xl">💳</span>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {(dashboardData.financial_overview.total_outstanding || 0).toLocaleString()} ج.م
              </p>
              <p className="text-sm text-green-600">
                {dashboardData.financial_overview.total_debts || 0} دين نشط
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-blue-800">المبلغ المحصل</h4>
                <span className="text-blue-600 text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {(dashboardData.financial_overview.total_settled || 0).toLocaleString()} ج.م
              </p>
              <p className="text-sm text-blue-600">تم تحصيله بنجاح</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-purple-800">معدل التحصيل</h4>
                <span className="text-purple-600 text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {dashboardData.financial_overview.total_outstanding > 0 ? 
                  Math.round((dashboardData.financial_overview.total_settled / 
                    (dashboardData.financial_overview.total_outstanding + dashboardData.financial_overview.total_settled)) * 100) : 0}%
              </p>
              <p className="text-sm text-purple-600">من إجمالي المبلغ</p>
            </div>
          </div>
        </div>
      )}

      {/* سجل الأنشطة المحسن */}
      <ActivityLog 
        activities={dashboardData.recent_activities || []}
        title="سجل أنشطة النظام الحديثة"
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
  );
};

export default AdminDashboard;