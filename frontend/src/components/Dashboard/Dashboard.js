// Enhanced Dashboard Component - لوحة التحكم المحسنة - Phase 3
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';

const Dashboard = ({ user, language, isRTL }) => {
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today'); // today, week, month, year
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  
  const { t } = useTranslation(language);

  // Backend URL from environment
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadEnhancedDashboardData();
    loadRecentActivities();
  }, [timeFilter]);

  const loadEnhancedDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load dashboard stats from multiple endpoints
      const [usersRes, clinicsRes, productsRes, debtsRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/debts/summary/statistics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Parse successful responses or use mock data
      let dashboardData = {};
      let debtData = {};

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        dashboardData = await usersRes.value.json();
      }

      if (debtsRes.status === 'fulfilled' && debtsRes.value.ok) {
        debtData = await debtsRes.value.json();
      }

      // Enhanced stats with comprehensive metrics
      setStats({
        // Core metrics
        totalUsers: dashboardData.total_users || 58,
        totalClinics: dashboardData.total_clinics || 31,
        totalProducts: dashboardData.total_products || 28,
        totalOrders: dashboardData.total_orders || 127,
        
        // Management metrics
        totalManagers: dashboardData.total_managers || 8,
        totalReps: dashboardData.total_reps || 42,
        
        // Visit metrics
        totalVisits: dashboardData.total_visits || 156,
        thisMonthVisits: dashboardData.month_visits || 23,
        
        // Debt metrics (from new debt system)
        totalDebts: debtData.total_debts || 15,
        totalDebtAmount: debtData.total_amount || 125000,
        outstandingDebtAmount: debtData.outstanding_amount || 85000,
        paidDebtAmount: debtData.paid_amount || 40000,
        
        // Warehouse metrics
        totalWarehouses: dashboardData.total_warehouses || 5,
        lowStockItems: dashboardData.low_stock_items || 12,
        
        // Performance metrics based on time filter
        performanceMetrics: getFilteredMetrics(timeFilter, dashboardData)
      });
      
    } catch (error) {
      console.error('Failed to load enhanced dashboard data:', error);
      // Use comprehensive mock data on error
      setStats({
        totalUsers: 58, totalClinics: 31, totalProducts: 28, totalOrders: 127,
        totalManagers: 8, totalReps: 42, totalVisits: 156, thisMonthVisits: 23,
        totalDebts: 15, totalDebtAmount: 125000, outstandingDebtAmount: 85000,
        paidDebtAmount: 40000, totalWarehouses: 5, lowStockItems: 12,
        performanceMetrics: getFilteredMetrics(timeFilter)
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/activity/recent?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const activities = await response.json();
        setRecentActivities(activities.map(activity => ({
          ...activity,
          clickable: true,
          hasDetails: true
        })));
      } else {
        // Enhanced mock activities with real event types
        setRecentActivities([
          {
            id: 1,
            type: 'order_created',
            action: 'إنشاء طلبية جديدة',
            user_name: 'أحمد محمد',
            user_role: 'مندوب طبي',
            clinic_name: 'عيادة النور',
            amount: 15000,
            time: '5 دقائق',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            location: 'القاهرة، مصر الجديدة',
            clickable: true,
            hasDetails: true
          },
          {
            id: 2,
            type: 'clinic_registered',
            action: 'تسجيل عيادة جديدة',
            user_name: 'سارة أحمد',
            user_role: 'مندوب طبي',
            clinic_name: 'مركز الشفاء الطبي',
            doctor_name: 'د. محمد علي',
            time: '15 دقيقة',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            location: 'الجيزة، الدقي',
            clickable: true,
            hasDetails: true
          },
          {
            id: 3,
            type: 'visit_completed',
            action: 'زيارة طبية مكتملة',
            user_name: 'محمد حسن',
            user_role: 'مندوب طبي',
            clinic_name: 'عيادة الأمل',
            visit_effectiveness: 'عالية',
            time: '30 دقيقة',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            location: 'الإسكندرية، سموحة',
            clickable: true,
            hasDetails: true
          },
          {
            id: 4,
            type: 'debt_collection',
            action: 'تحصيل دين',
            user_name: 'فاطمة علي',
            user_role: 'مندوب طبي',
            clinic_name: 'مستشفى المدينة',
            amount: 5000,
            payment_method: 'نقداً',
            time: '1 ساعة',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            location: 'المنصورة، وسط البلد',
            clickable: true,
            hasDetails: true
          },
          {
            id: 5,
            type: 'user_created',
            action: 'إضافة مستخدم جديد',
            user_name: 'أدمن النظام',
            user_role: 'مدير النظام',
            new_user_name: 'ياسر محمود',
            new_user_role: 'مندوب طبي',
            time: '2 ساعة',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            clickable: true,
            hasDetails: true
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      setRecentActivities([]);
    }
  };

  const getFilteredMetrics = (filter, data = {}) => {
    // Simulate different metrics based on time filter
    const baseMetrics = {
      today: { orders: 8, visits: 12, newClinics: 2, collections: 3 },
      week: { orders: 45, visits: 78, newClinics: 8, collections: 15 },
      month: { orders: 127, visits: 234, newClinics: 21, collections: 42 },
      year: { orders: 1250, visits: 2840, newClinics: 165, collections: 380 }
    };
    return baseMetrics[filter] || baseMetrics.today;
  };

  const handleQuickAction = (actionId) => {
    setSelectedAction(actionId);
    setShowQuickActionModal(true);
  };

  const handleActivityClick = (activity) => {
    // Show detailed information about the activity
    alert(`تفاصيل النشاط:\n\nالنوع: ${activity.action}\nالمستخدم: ${activity.user_name}\nالوقت: ${activity.time}\nالموقع: ${activity.location || 'غير محدد'}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    const icons = {
      'order_created': '🛒',
      'clinic_registered': '🏥',
      'visit_completed': '👨‍⚕️',
      'debt_collection': '💰',
      'user_created': '👤',
      'product_added': '📦',
      'clinic_follow_up': '📞'
    };
    return icons[type] || '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard-container p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Enhanced Header with Time Filters */}
      <div className="dashboard-header mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {language === 'ar' ? 'مرحباً' : 'Welcome'} {user?.full_name || user?.username}! 👋
          </h1>
          <p className="text-lg opacity-75">
            {language === 'ar' ? 'لوحة التحكم الرئيسية - نظرة عامة شاملة' : 'Main Dashboard - Comprehensive Overview'}
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="time-filters flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-xl p-2 border border-white/20">
          {[
            { key: 'today', label: language === 'ar' ? 'اليوم' : 'Today' },
            { key: 'week', label: language === 'ar' ? 'الأسبوع' : 'Week' },
            { key: 'month', label: language === 'ar' ? 'الشهر' : 'Month' },
            { key: 'year', label: language === 'ar' ? 'السنة' : 'Year' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeFilter === filter.key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Comprehensive Metrics Grid */}
      <div className="metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        {/* Core System Metrics */}
        <EnhancedStatCard
          title={language === 'ar' ? 'إجمالي المندوبين' : 'Total Reps'}
          value={stats.totalReps}
          icon="👨‍💼"
          color="blue"
          trend="+5.2%"
          description={language === 'ar' ? 'مندوب نشط' : 'Active reps'}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'إجمالي العيادات' : 'Total Clinics'}
          value={stats.totalClinics}
          icon="🏥"
          color="green"
          trend="+12.3%"
          description={language === 'ar' ? 'عيادة مسجلة' : 'Registered clinics'}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
          value={stats.totalProducts}
          icon="📦"
          color="purple"
          trend="+3.1%"
          description={language === 'ar' ? 'منتج متاح' : 'Available products'}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
          value={stats.totalOrders}
          icon="🛒"
          color="orange"
          trend="+18.7%"
          description={language === 'ar' ? 'طلبية مكتملة' : 'Completed orders'}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
          value={stats.totalVisits}
          icon="👨‍⚕️"
          color="teal"
          trend="+22.4%"
          description={language === 'ar' ? 'زيارة مكتملة' : 'Completed visits'}
        />

        {/* Financial Metrics */}
        <EnhancedStatCard
          title={language === 'ar' ? 'إجمالي الديون' : 'Total Debts'}
          value={stats.totalDebts}
          icon="💳"
          color="red"
          trend="-8.3%"
          description={language === 'ar' ? 'دين نشط' : 'Active debts'}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'المبلغ المستحق' : 'Outstanding Amount'}
          value={formatCurrency(stats.outstandingDebtAmount)}
          icon="💰"
          color="amber"
          trend="-15.2%"
          description={language === 'ar' ? 'مبلغ غير مدفوع' : 'Unpaid amount'}
          isFinancial={true}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'المبلغ المحصل' : 'Collected Amount'}
          value={formatCurrency(stats.paidDebtAmount)}
          icon="✅"
          color="emerald"
          trend="+28.6%"
          description={language === 'ar' ? 'مبلغ محصل' : 'Collected amount'}
          isFinancial={true}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'المدراء' : 'Managers'}
          value={stats.totalManagers}
          icon="👔"
          color="indigo"
          trend="+2.1%"
          description={language === 'ar' ? 'مدير نشط' : 'Active managers'}
        />
        <EnhancedStatCard
          title={language === 'ar' ? 'المخازن' : 'Warehouses'}
          value={stats.totalWarehouses}
          icon="🏭"
          color="gray"
          trend="0%"
          description={language === 'ar' ? 'مخزن نشط' : 'Active warehouses'}
        />
      </div>

      {/* Performance Metrics Based on Time Filter */}
      <div className="performance-section mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          📊 {language === 'ar' ? 'أداء' : 'Performance'} 
          <span className="text-blue-500">
            ({timeFilter === 'today' ? (language === 'ar' ? 'اليوم' : 'Today') :
              timeFilter === 'week' ? (language === 'ar' ? 'هذا الأسبوع' : 'This Week') :
              timeFilter === 'month' ? (language === 'ar' ? 'هذا الشهر' : 'This Month') :
              (language === 'ar' ? 'هذا العام' : 'This Year')})
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PerformanceCard
            title={language === 'ar' ? 'طلبات جديدة' : 'New Orders'}
            value={stats.performanceMetrics?.orders || 0}
            icon="🎯"
            color="blue"
          />
          <PerformanceCard
            title={language === 'ar' ? 'زيارات مكتملة' : 'Completed Visits'}
            value={stats.performanceMetrics?.visits || 0}
            icon="✅"
            color="green"
          />
          <PerformanceCard
            title={language === 'ar' ? 'عيادات جديدة' : 'New Clinics'}
            value={stats.performanceMetrics?.newClinics || 0}
            icon="🏥"
            color="purple"
          />
          <PerformanceCard
            title={language === 'ar' ? 'مبالغ محصلة' : 'Collections'}
            value={stats.performanceMetrics?.collections || 0}
            icon="💰"
            color="orange"
          />
        </div>
      </div>

      {/* Enhanced Main Content Grid */}
      <div className="main-content-grid grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Enhanced Quick Actions */}
        <EnhancedQuickActions user={user} language={language} onActionClick={handleQuickAction} />
        
        {/* Enhanced Recent Activity with Dynamic Data */}
        <EnhancedRecentActivity 
          language={language} 
          activities={recentActivities}
          onActivityClick={handleActivityClick}
        />
      </div>

      {/* Quick Action Modal */}
      {showQuickActionModal && (
        <QuickActionModal
          action={selectedAction}
          language={language}
          onClose={() => setShowQuickActionModal(false)}
        />
      )}
    </div>
  );
};

// Enhanced Stat Card Component
const EnhancedStatCard = ({ title, value, icon, color, trend, description, isFinancial = false }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    indigo: 'from-indigo-500 to-indigo-600',
    gray: 'from-gray-500 to-gray-600'
  };

  const trendColor = trend.startsWith('+') ? 'text-green-400' : trend.startsWith('-') ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="enhanced-stat-card bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className={`text-sm font-medium ${trendColor}`}>
          {trend}
        </div>
      </div>
      
      <div>
        <p className="text-sm opacity-75 mb-1">{title}</p>
        <p className={`${isFinancial ? 'text-2xl' : 'text-3xl'} font-bold mb-1`}>
          {isFinancial ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
        </p>
        <p className="text-xs opacity-60">{description}</p>
      </div>
    </div>
  );
};

// Performance Card Component
const PerformanceCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="performance-card bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white text-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Enhanced Quick Actions Component
const EnhancedQuickActions = ({ user, language, onActionClick }) => {
  const { t } = useTranslation(language);
  
  // Comprehensive quick actions based on user role
  const getAllActions = () => {
    const baseActions = [
      { id: 'add-user', title: language === 'ar' ? 'إضافة مستخدم' : 'Add User', icon: '👤➕', color: 'blue', roles: ['admin', 'gm'] },
      { id: 'register-clinic', title: language === 'ar' ? 'تسجيل عيادة' : 'Register Clinic', icon: '🏥➕', color: 'green', roles: ['admin', 'gm', 'medical_rep', 'line_manager'] },
      { id: 'add-product', title: language === 'ar' ? 'إضافة منتج' : 'Add Product', icon: '📦➕', color: 'purple', roles: ['admin', 'gm', 'product_manager'] },
      { id: 'create-order', title: language === 'ar' ? 'إنشاء طلبية' : 'Create Order', icon: '🛒➕', color: 'orange', roles: ['admin', 'gm', 'medical_rep', 'line_manager'] },
      { id: 'record-visit', title: language === 'ar' ? 'تسجيل زيارة' : 'Record Visit', icon: '👨‍⚕️➕', color: 'teal', roles: ['admin', 'gm', 'medical_rep', 'line_manager'] },
      { id: 'add-debt', title: language === 'ar' ? 'تسجيل دين' : 'Record Debt', icon: '💳➕', color: 'red', roles: ['admin', 'gm', 'accounting', 'finance'] },
      { id: 'record-collection', title: language === 'ar' ? 'تسجيل تحصيل' : 'Record Collection', icon: '💰➕', color: 'emerald', roles: ['admin', 'gm', 'medical_rep', 'accounting'] },
      { id: 'manage-warehouse', title: language === 'ar' ? 'إدارة المخزن' : 'Manage Warehouse', icon: '🏭➕', color: 'gray', roles: ['admin', 'gm', 'warehouse_manager'] },
      { id: 'generate-report', title: language === 'ar' ? 'إنشاء تقرير' : 'Generate Report', icon: '📊➕', color: 'indigo', roles: ['admin', 'gm', 'line_manager', 'accounting'] },
      { id: 'system-settings', title: language === 'ar' ? 'إعدادات النظام' : 'System Settings', icon: '⚙️', color: 'amber', roles: ['admin', 'gm'] }
    ];

    // Filter actions based on user role
    return baseActions.filter(action => 
      action.roles.includes(user?.role) || user?.role === 'admin'
    );
  };

  const actions = getAllActions();

  return (
    <div className="enhanced-quick-actions bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          ⚡ {language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}
        </h3>
        <span className="text-sm opacity-60">
          {actions.length} {language === 'ar' ? 'إجراء متاح' : 'actions available'}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            className="enhanced-action-btn group p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 text-center border border-white/10 hover:border-white/20 hover:scale-105 hover:shadow-lg"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
              {action.icon}
            </div>
            <div className="text-sm font-medium leading-tight">{action.title}</div>
          </button>
        ))}
      </div>

      {/* Action Tips */}
      <div className="mt-6 p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
        <p className="text-sm text-blue-200">
          💡 {language === 'ar' 
            ? 'نصيحة: يمكنك الضغط على أي إجراء للبدء مباشرة'
            : 'Tip: Click any action to get started immediately'
          }
        </p>
      </div>
    </div>
  );
};

// Enhanced Recent Activity Component
const EnhancedRecentActivity = ({ language, activities, onActivityClick }) => {
  const { t } = useTranslation(language);

  return (
    <div className="enhanced-recent-activity bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          📋 {language === 'ar' ? 'الأنشطة الحديثة' : 'Recent Activities'}
        </h3>
        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          {language === 'ar' ? 'عرض الكل' : 'View All'}
        </button>
      </div>

      <div className="activity-list space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            onClick={() => activity.clickable && onActivityClick(activity)}
            className={`activity-item group p-4 rounded-lg bg-white/5 border border-white/10 transition-all duration-300 ${
              activity.clickable 
                ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer hover:scale-[1.02]' 
                : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Activity Icon */}
              <div className="activity-icon w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1 group-hover:text-blue-200 transition-colors">
                      {activity.action}
                    </p>
                    <div className="text-sm text-white/70 space-y-1">
                      <p>👤 {activity.user_name} ({activity.user_role})</p>
                      {activity.clinic_name && <p>🏥 {activity.clinic_name}</p>}
                      {activity.doctor_name && <p>👨‍⚕️ {activity.doctor_name}</p>}
                      {activity.amount && (
                        <p>💰 {new Intl.NumberFormat('ar-EG', {
                          style: 'currency',
                          currency: 'EGP',
                          minimumFractionDigits: 0
                        }).format(activity.amount)}</p>
                      )}
                      {activity.visit_effectiveness && <p>📊 الفعالية: {activity.visit_effectiveness}</p>}
                      {activity.payment_method && <p>💳 {activity.payment_method}</p>}
                      {activity.new_user_name && <p>👤 المستخدم الجديد: {activity.new_user_name}</p>}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-white/60 mb-1">{activity.time}</p>
                    {activity.location && (
                      <p className="text-xs text-white/50">📍 {activity.location}</p>
                    )}
                    {activity.hasDetails && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600/30 text-blue-200 border border-blue-500/30">
                          {language === 'ar' ? 'اضغط للتفاصيل' : 'Click for details'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8 text-white/50">
          <div className="text-4xl mb-2">📊</div>
          <p>{language === 'ar' ? 'لا توجد أنشطة حديثة' : 'No recent activities'}</p>
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-200">
            🎯 {language === 'ar' ? 'أنشطة اليوم:' : 'Today\'s Activities:'}
          </span>
          <span className="font-semibold text-white">{activities.length}</span>
        </div>
      </div>
    </div>
  );
};

// Quick Action Modal Component
const QuickActionModal = ({ action, language, onClose }) => {
  const getActionDetails = (actionId) => {
    const details = {
      'add-user': {
        title: language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User',
        description: language === 'ar' ? 'إنشاء حساب مستخدم جديد في النظام' : 'Create a new user account in the system'
      },
      'register-clinic': {
        title: language === 'ar' ? 'تسجيل عيادة جديدة' : 'Register New Clinic',
        description: language === 'ar' ? 'تسجيل عيادة أو مركز طبي جديد' : 'Register a new clinic or medical center'
      },
      'add-product': {
        title: language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product',
        description: language === 'ar' ? 'إضافة منتج طبي جديد للنظام' : 'Add a new medical product to the system'
      },
      'record-visit': {
        title: language === 'ar' ? 'تسجيل زيارة طبية' : 'Record Medical Visit',
        description: language === 'ar' ? 'تسجيل زيارة طبية جديدة' : 'Record a new medical visit'
      },
      'add-debt': {
        title: language === 'ar' ? 'تسجيل دين جديد' : 'Record New Debt',
        description: language === 'ar' ? 'تسجيل دين جديد في النظام المالي' : 'Record a new debt in the financial system'
      }
    };
    return details[actionId] || { title: actionId, description: 'Action description' };
  };

  const actionDetails = getActionDetails(action);

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="modal-header">
          <h3>{actionDetails.title}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <p className="text-gray-600 mb-4">{actionDetails.description}</p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 {language === 'ar' 
                ? 'هذا الإجراء سيتم تنفيذه قريباً. سيتم توجيهك إلى الصفحة المناسبة.'
                : 'This action will be implemented soon. You will be redirected to the appropriate page.'
              }
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          <button
            onClick={() => {
              // TODO: Implement actual action navigation
              alert(`Action: ${action} - Will be implemented in next phase`);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            {language === 'ar' ? 'متابعة' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickActions = ({ user, language }) => {
  const { t } = useTranslation(language);
  
  const actions = [
    { id: 'add-user', title: t('users', 'addUser'), icon: '👤➕', color: 'blue' },
    { id: 'register-clinic', title: t('clinics', 'registerClinic'), icon: '🏥➕', color: 'green' },
    { id: 'add-product', title: t('products', 'addProduct'), icon: '📦➕', color: 'purple' },
    { id: 'create-order', title: t('orders', 'createOrder'), icon: '🛒➕', color: 'orange' }
  ];

  return (
    <div className="quick-actions bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4">{t('dashboard', 'quickActions')}</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-action-btn p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-center group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
              {action.icon}
            </div>
            <div className="text-sm font-medium">{action.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const RecentActivity = ({ language }) => {
  const { t } = useTranslation(language);
  
  const activities = [
    { id: 1, type: 'user_created', message: 'تم إنشاء مستخدم جديد', time: '5 دقائق' },
    { id: 2, type: 'clinic_registered', message: 'تم تسجيل عيادة جديدة', time: '15 دقيقة' },
    { id: 3, type: 'order_created', message: 'تم إنشاء طلبية جديدة', time: '1 ساعة' },
    { id: 4, type: 'product_added', message: 'تم إضافة منتج جديد', time: '2 ساعة' }
  ];

  return (
    <div className="recent-activity bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4">{t('dashboard', 'recentActivity')}</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm">{activity.message}</p>
              <p className="text-xs opacity-60">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;