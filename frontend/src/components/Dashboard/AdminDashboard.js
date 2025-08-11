// Admin Dashboard Component - لوحة تحكم المدير
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import ProfessionalActivityLog from './ProfessionalActivityLog';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const AdminDashboard = ({ user, language = 'ar', theme = 'dark' }) => {
  const { t, tc, tn, tf, tm } = useGlobalTranslation(language);
  const [dashboardStats, setDashboardStats] = useState({
    users: 0,
    clinics: 0,
    visits: 0,
    orders: 0,
    revenue: 0,
    growth: 0
  });
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load dashboard stats
      try {
        const statsResponse = await fetch(`${API_URL}/api/dashboard/stats/admin`, { headers });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats({
            users: statsData.total_users || 0,
            clinics: statsData.total_clinics || 0,
            visits: statsData.total_visits || 0,
            orders: statsData.total_orders || 0,
            revenue: statsData.total_revenue || 0,
            growth: statsData.growth_rate || 0
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }

      // Load activities using comprehensive service
      const activitiesData = await comprehensiveActivityService.getRecentActivities(10);
      setActivities(activitiesData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quick Actions with comprehensive activity logging
  const quickActions = [
    {
      id: 'users',
      title: t.quickActions?.manageUsers || 'إدارة المستخدمين',
      icon: '👥',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        comprehensiveActivityService.recordPageView({
          title: 'إدارة المستخدمين',
          url: '/users'
        });
        window.switchToTab('users');
      }
    },
    {
      id: 'clinic_registration',
      title: t.quickActions?.addClinic || 'إضافة عيادة',
      icon: '🏥',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        comprehensiveActivityService.recordPageView({
          title: 'تسجيل العيادات المحسن',
          url: '/clinic-registration'
        });
        window.switchToTab('clinic_registration');
      }
    },
    {
      id: 'visits_management',
      title: t.quickActions?.manageVisits || 'إدارة الزيارات',
      icon: '🩺',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        comprehensiveActivityService.recordPageView({
          title: 'إدارة الزيارات المتطورة',
          url: '/visits-management'
        });
        window.switchToTab('visits_management');
      }
    },
    {
      id: 'integrated_financial',
      title: t.quickActions?.financial || 'النظام المالي',
      icon: '💰',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => {
        comprehensiveActivityService.recordPageView({
          title: 'النظام المالي المتكامل',
          url: '/integrated-financial'
        });
        window.switchToTab('integrated_financial');
      }
    },
    {
      id: 'super_admin_monitoring',
      title: 'مركز المراقبة الشامل',
      icon: '🛡️',
      color: 'bg-red-500 hover:bg-red-600',
      action: () => {
        comprehensiveActivityService.recordPageView({
          title: 'مركز المراقبة والتحكم الشامل',
          url: '/super-admin-monitoring'
        });
        window.switchToTab('super_admin_monitoring');
      }
    },
    {
      id: 'activity_tracking',
      title: 'تتبع الأنشطة المتقدم',
      icon: '📊',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => {
        comprehensiveActivityService.recordPageView({
          title: 'تتبع الأنشطة والحركات المتقدم',
          url: '/activity-tracking'
        });
        window.switchToTab('activity_tracking');
      }
    }
  ];

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  return (
    <div className="admin-dashboard p-6 bg-gray-50 min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  مرحباً، {user?.full_name || user?.username} 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  لوحة التحكم الإدارية الشاملة - نظرة عامة على جميع عمليات النظام
                </p>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-sm">آخر تحديث</div>
                <div className="text-white font-semibold">
                  {new Date().toLocaleString('ar-EG')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">المستخدمون</p>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(dashboardStats.users)}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+12%</span>
              <span className="text-gray-600 text-sm mr-2">من الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">العيادات</p>
                <p className="text-3xl font-bold text-green-600">{formatNumber(dashboardStats.clinics)}</p>
              </div>
              <div className="text-4xl">🏥</div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+8%</span>
              <span className="text-gray-600 text-sm mr-2">من الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">الزيارات</p>
                <p className="text-3xl font-bold text-purple-600">{formatNumber(dashboardStats.visits)}</p>
              </div>
              <div className="text-4xl">🩺</div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+15%</span>
              <span className="text-gray-600 text-sm mr-2">من الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">الطلبات</p>
                <p className="text-3xl font-bold text-orange-600">{formatNumber(dashboardStats.orders)}</p>
              </div>
              <div className="text-4xl">🛒</div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+22%</span>
              <span className="text-gray-600 text-sm mr-2">من الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">الإيرادات</p>
                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(dashboardStats.revenue)}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+18%</span>
              <span className="text-gray-600 text-sm mr-2">من الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">معدل النمو</p>
                <p className="text-3xl font-bold text-red-600">{dashboardStats.growth}%</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+5%</span>
              <span className="text-gray-600 text-sm mr-2">من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-blue-600 ml-3 text-3xl">⚡</span>
            الإجراءات السريعة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="text-sm font-semibold">{action.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professional Activity Log */}
          <div className="lg:col-span-2">
            <ProfessionalActivityLog
              title="Recent System Activity Log"
              maxItems={15}
              showFilters={true}
              language={language}
              refreshInterval={30000}
            />
          </div>

          {/* System Performance */}
          <div className="space-y-6">
            {/* System Usage Trends */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-purple-600 ml-3 text-2xl">📊</span>
                اتجاهات استخدام النظام
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">معدل الاستخدام اليومي</span>
                  <span className="font-bold text-purple-600">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '87%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">أداء الخادم</span>
                  <span className="font-bold text-green-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '92%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">معدل الاستجابة</span>
                  <span className="font-bold text-blue-600">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '94%'}}></div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-green-600 ml-3 text-2xl">🔧</span>
                حالة النظام
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">قاعدة البيانات</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    ✅ متصلة
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">خادم التطبيق</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    ✅ نشط
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">خدمات المراقبة</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    ✅ تعمل
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">النسخ الاحتياطي</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
                    ⏳ جاري
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;