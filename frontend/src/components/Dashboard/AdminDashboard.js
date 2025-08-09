// Admin Dashboard - لوحة تحكم الأدمن
import React, { useState } from 'react';
import DashboardWidget from './DashboardWidget';
import StatCard from './StatCard';
import ActivityList from './ActivityList';
import SystemHealthIndicators from './SystemHealthIndicators';

const AdminDashboard = ({ user, dashboardData, timeFilter, onTimeFilterChange, onRefresh }) => {
  const [activeWidget, setActiveWidget] = useState(null);

  // تنسيق البيانات للعرض
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ج.م';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="admin-dashboard p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen" dir="rtl">
      {/* Header مخصص للأدمن */}
      <div className="dashboard-header mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">⚡</span>
              لوحة تحكم الأدمن الشاملة
            </h1>
            <p className="text-gray-600 text-lg">
              مرحباً {user?.full_name || user?.username}، إدارة النظام بالكامل
            </p>
          </div>

          {/* Time Filter للأدمن */}
          <div className="time-filters flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg">
            {[
              { key: 'today', label: 'اليوم' },
              { key: 'week', label: 'الأسبوع' },
              { key: 'month', label: 'الشهر' },
              { key: 'quarter', label: 'الربع' },
              { key: 'year', label: 'السنة' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => onTimeFilterChange(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === filter.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid الإحصائيات الرئيسية للأدمن */}
      <div className="admin-stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="إجمالي المستخدمين"
          value={formatNumber(dashboardData.total_users || 0)}
          icon="👥"
          color="blue"
          trend={`${dashboardData.user_roles_distribution?.length || 0} أدوار مختلفة`}
          onClick={() => setActiveWidget('users')}
        />
        
        <StatCard
          title="إجمالي العيادات"
          value={formatNumber(dashboardData.total_clinics || 0)}
          icon="🏥"
          color="green"
          trend={`${dashboardData.clinic_classifications?.length || 0} تصنيفات`}
          onClick={() => setActiveWidget('clinics')}
        />
        
        <StatCard
          title="إجمالي المنتجات"
          value={formatNumber(dashboardData.total_products || 0)}
          icon="📦"
          color="purple"
          trend="منتجات نشطة"
          onClick={() => setActiveWidget('products')}
        />
        
        <StatCard
          title="الطلبات"
          value={formatNumber(dashboardData.orders_in_period || 0)}
          icon="📋"
          color="orange"
          trend={`${timeFilter === 'today' ? 'اليوم' : timeFilter === 'week' ? 'هذا الأسبوع' : 'في الفترة'}`}
          onClick={() => setActiveWidget('orders')}
        />
        
        <StatCard
          title="الزيارات"
          value={formatNumber(dashboardData.visits_in_period || 0)}
          icon="👨‍⚕️"
          color="teal"
          trend={`معدل النجاح: ${dashboardData.performance_indicators?.orders_success_rate || 0}%`}
          onClick={() => setActiveWidget('visits')}
        />
      </div>

      {/* Grid الإحصائيات المالية للأدمن */}
      <div className="financial-stats-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="إجمالي الديون"
          value={formatNumber(dashboardData.financial_overview?.total_debts || 0)}
          icon="💳"
          color="red"
          trend="ديون نشطة"
          onClick={() => setActiveWidget('debts')}
          className="md:col-span-1"
        />
        
        <StatCard
          title="المبلغ المستحق"
          value={formatCurrency(dashboardData.financial_overview?.total_outstanding || 0)}
          icon="⚠️"
          color="amber"
          trend="مبلغ غير مدفوع"
          onClick={() => setActiveWidget('outstanding')}
          isFinancial={true}
          className="md:col-span-1"
        />
        
        <StatCard
          title="المبلغ المحصل"
          value={formatCurrency(dashboardData.financial_overview?.total_settled || 0)}
          icon="✅"
          color="emerald"
          trend={`معدل التحصيل: ${dashboardData.performance_indicators?.debt_collection_rate || 0}%`}
          onClick={() => setActiveWidget('collections')}
          isFinancial={true}
          className="md:col-span-1"
        />
      </div>

      {/* Widgets متقدمة للأدمن */}
      <div className="admin-widgets-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* توزيع أدوار المستخدمين */}
        <DashboardWidget
          title="توزيع أدوار المستخدمين"
          type="pie_chart"
          data={dashboardData.user_roles_distribution || []}
          className="lg:col-span-1"
        />
        
        {/* تصنيف العيادات */}
        <DashboardWidget
          title="تصنيف العيادات"
          type="bar_chart"
          data={dashboardData.clinic_classifications || []}
          className="lg:col-span-1"
        />
        
        {/* صحة النظام */}
        <DashboardWidget
          title="صحة النظام"
          type="system_health"
          data={dashboardData.system_health || {}}
          className="lg:col-span-1"
        />
      </div>

      {/* قسم الأنشطة الحديثة */}
      <div className="recent-activities-section bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-blue-500">📊</span>
            الأنشطة الحديثة
          </h2>
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            تحديث
          </button>
        </div>
        
        <ActivityList 
          activities={dashboardData.recent_activities || []}
          showDetails={true}
          maxItems={10}
        />
      </div>

      {/* مؤشرات الأداء المتقدمة للأدمن */}
      <div className="performance-indicators bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-green-500">📈</span>
          مؤشرات الأداء الشاملة
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="performance-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">معدل نجاح الطلبات</div>
            <div className="text-2xl font-bold text-blue-800">
              {dashboardData.performance_indicators?.orders_success_rate || 0}%
            </div>
            <div className="text-xs text-blue-500 mt-1">
              {formatNumber(dashboardData.performance_indicators?.completed_orders || 0)} من {formatNumber(dashboardData.performance_indicators?.total_orders || 0)}
            </div>
          </div>
          
          <div className="performance-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">معدل التحصيل</div>
            <div className="text-2xl font-bold text-green-800">
              {dashboardData.performance_indicators?.debt_collection_rate || 0}%
            </div>
            <div className="text-xs text-green-500 mt-1">
              {formatCurrency(dashboardData.performance_indicators?.total_collected_amount || 0)} محصل
            </div>
          </div>
          
          <div className="performance-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">المستخدمون النشطون</div>
            <div className="text-2xl font-bold text-purple-800">
              {formatNumber(dashboardData.system_health?.active_users || 0)}
            </div>
            <div className="text-xs text-purple-500 mt-1">
              {formatNumber(dashboardData.system_health?.recent_users || 0)} متصل مؤخراً
            </div>
          </div>
          
          <div className="performance-card bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium mb-1">وقت تشغيل النظام</div>
            <div className="text-2xl font-bold text-orange-800">
              {dashboardData.system_health?.system_uptime || '99.9%'}
            </div>
            <div className="text-xs text-orange-500 mt-1">أداء ممتاز</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;