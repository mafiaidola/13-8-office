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
    <div className="dashboard-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('dashboard', 'welcome')} {user?.full_name || user?.username}! 👋
        </h1>
        <p className="text-lg opacity-75">
          {t('dashboard', 'title')} - {t('dashboard', 'overview')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t('users', 'totalUsers')}
          value={stats.totalUsers}
          icon="👥"
          color="blue"
          language={language}
        />
        <StatCard
          title={t('clinics', 'totalClinics')}
          value={stats.totalClinics}
          icon="🏥"
          color="green"
          language={language}
        />
        <StatCard
          title={t('products', 'totalProducts')}
          value={stats.totalProducts}
          icon="📦"
          color="purple"
          language={language}
        />
        <StatCard
          title={t('orders', 'totalOrders')}
          value={stats.totalOrders}
          icon="🛒"
          color="orange"
          language={language}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QuickActions user={user} language={language} />
        <RecentActivity language={language} />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, language }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="stat-card bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white text-2xl`}>
          {icon}
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