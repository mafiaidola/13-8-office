// Dashboard Component - لوحة التحكم
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';

const Dashboard = ({ user, language, isRTL }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClinics: 0,
    totalProducts: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { t } = useTranslation(language);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setStats({
          totalUsers: 53,
          totalClinics: 17,
          totalProducts: 20,
          totalOrders: 125
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
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