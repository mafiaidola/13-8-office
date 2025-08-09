// Manager Dashboard Component - لوحة تحكم المدراء المحسنة
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';
import SalesPerformance from './SalesPerformance';
import ActivityLog from './ActivityLog';
import LineCharts from './LineCharts';

const ManagerDashboard = ({ 
  user, 
  dashboardData = {}, 
  timeFilter, 
  onTimeFilterChange, 
  onRefresh,
  language = 'ar',
  isRTL = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [teamPerformance, setTeamPerformance] = useState([]);

  const API_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // تحميل بيانات الفريق
  const loadTeamPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `${API_URL}/api/dashboard/team-performance?manager_id=${user?.id}&time_filter=${timeFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTeamPerformance(data.team_performance || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل أداء الفريق:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTeamPerformance();
    }
  }, [timeFilter, user?.id]);

  // إحصائيات مخصصة للمدراء مع التحسينات البصرية
  const managerStats = [
    {
      title: 'أعضاء الفريق',
      value: (dashboardData.team_members_count || 0).toLocaleString(),
      icon: '👥',
      change: '+2 عضو هذا الشهر',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: 'up'
    },
    {
      title: 'إجمالي المبيعات',
      value: `${(dashboardData.team_sales_total || 0).toLocaleString()} ج.م`,
      icon: '💰',
      change: `+${dashboardData.sales_growth || 0}% نمو`,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      trend: 'up'
    },
    {
      title: 'الزيارات المكتملة',
      value: (dashboardData.visits_in_period || 0).toLocaleString(),
      icon: '🏥',
      change: `${dashboardData.visit_completion_rate || 0}% معدل الإنجاز`,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      trend: 'up'
    },
    {
      title: 'الأهداف المحققة',
      value: `${dashboardData.targets_achieved || 0}/${dashboardData.total_targets || 0}`,
      icon: '🎯',
      change: `${Math.round((dashboardData.targets_achieved || 0) / (dashboardData.total_targets || 1) * 100)}% معدل الإنجاز`,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      trend: 'up'
    }
  ];

  // الإجراءات السريعة للمدراء
  const managerQuickActions = [
    {
      label: 'إضافة مندوب',
      icon: '👤➕',
      onClick: () => console.log('إضافة مندوب جديد'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: 'تقييم الفريق',
      icon: '📊⭐',
      onClick: () => console.log('تقييم أداء الفريق'),
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: 'جدولة زيارات',
      icon: '📅🏥',
      onClick: () => console.log('جدولة الزيارات'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      label: 'تقارير المبيعات',
      icon: '💰📈',
      onClick: () => console.log('تقارير المبيعات'),
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      label: 'تحفيز الفريق',
      icon: '🎉🏆',
      onClick: () => console.log('برامج التحفيز'),
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    {
      label: 'اجتماع فريق',
      icon: '👥💬',
      onClick: () => console.log('جدولة اجتماع'),
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
    }
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* رأس لوحة التحكم المحسن */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              لوحة تحكم المدير المتقدمة
            </h1>
            <p className="text-purple-100 text-lg">
              مرحباً {user?.full_name || user?.username} 👨‍💼 - إدارة الفريق والأداء
            </p>
            <div className="flex items-center space-x-4 space-x-reverse mt-4">
              <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm">الفريق نشط ومتفاعل</span>
              </div>
              <div className="text-sm bg-white/20 rounded-full px-3 py-1">
                👥 {dashboardData.team_members_count || 0} عضو في الفريق
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {timeFilter === 'today' ? 'اليوم' :
               timeFilter === 'week' ? 'هذا الأسبوع' :
               timeFilter === 'month' ? 'هذا الشهر' : 'الفترة الحالية'}
            </div>
            <div className="text-lg text-purple-100">
              تقرير أداء الفريق
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات الرئيسية مع الإجراءات السريعة */}
      <CommonDashboardComponents.StatsGrid 
        stats={managerStats}
        quickActions={managerQuickActions}
      />

      {/* الرسوم البيانية والتحليلات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء المبيعات */}
        <SalesPerformance 
          data={dashboardData.sales_performance || [
            { period: 'الأسبوع 1', sales: 25000, target: 20000, orders: 45 },
            { period: 'الأسبوع 2', sales: 18500, target: 20000, orders: 32 },
            { period: 'الأسبوع 3', sales: 32000, target: 20000, orders: 67 },
            { period: 'الأسبوع 4', sales: 28000, target: 20000, orders: 54 }
          ]}
          title="أداء مبيعات الفريق"
          timeFilter={timeFilter}
          onExport={(data) => console.log('تصدير بيانات مبيعات الفريق:', data)}
          onViewDetails={(data) => console.log('عرض تفاصيل المبيعات:', data)}
        />

        {/* رسم بياني للاتجاهات */}
        <LineCharts 
          data={dashboardData.team_trends || [
            { x: 'ينا', y: 85 },
            { x: 'فبر', y: 92 },
            { x: 'مار', y: 78 },
            { x: 'أبر', y: 95 },
            { x: 'ماي', y: 88 },
            { x: 'يون', y: 102 }
          ]}
          title="اتجاهات أداء الفريق"
          xAxisLabel="الأشهر"
          yAxisLabel="نسبة الإنجاز %"
          interactive={true}
          onDataPointClick={(item, index) => console.log('تفاصيل الشهر:', item)}
        />
      </div>

      {/* أداء الفريق المحسن */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="text-blue-600 mr-3">👥</span>
            أداء أعضاء الفريق التفصيلي
          </h3>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={loadTeamPerformance}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
            >
              <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>
                {loading ? '⏳' : '🔄'}
              </span>
              {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <CommonDashboardComponents.LoadingSpinner message="جاري تحميل بيانات الفريق..." />
        ) : (
          <div className="overflow-hidden">
            <CommonDashboardComponents.DataTable
              headers={['المندوب', 'الزيارات', 'المبيعات', 'معدل النجاح', 'الحالة', 'الإجراءات']}
              data={teamPerformance.length > 0 ? teamPerformance : [
                {
                  name: 'أحمد محمد',
                  visits: 45,
                  sales: '15,000 ج.م',
                  success_rate: '85%',
                  status: 'ممتاز'
                },
                {
                  name: 'فاطمة علي', 
                  visits: 38,
                  sales: '12,500 ج.م',
                  success_rate: '78%',
                  status: 'جيد'
                },
                {
                  name: 'محمود حسن',
                  visits: 52,
                  sales: '18,200 ج.م', 
                  success_rate: '92%',
                  status: 'ممتاز'
                }
              ].map(member => ({
                name: (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                ),
                visits: member.visits,
                sales: member.sales,
                success_rate: (
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          parseInt(member.success_rate) >= 80 ? 'bg-green-500' :
                          parseInt(member.success_rate) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: member.success_rate }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{member.success_rate}</span>
                  </div>
                ),
                status: (
                  <CommonDashboardComponents.StatusIndicator
                    status={member.status === 'ممتاز' ? 'active' : 
                            member.status === 'جيد' ? 'pending' : 'warning'}
                    labels={{
                      active: '🏆 ممتاز',
                      pending: '👍 جيد', 
                      warning: '⚠️ يحتاج تحسين'
                    }}
                  />
                )
              }))}
              searchable={true}
              sortable={true}
              actions={[
                {
                  label: '👁️',
                  onClick: (row, index) => console.log('عرض تفاصيل:', row),
                  className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors'
                },
                {
                  label: '📊',
                  onClick: (row, index) => console.log('تقرير تفصيلي:', row),
                  className: 'text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-colors'
                },
                {
                  label: '✉️',
                  onClick: (row, index) => console.log('إرسال رسالة:', row),
                  className: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors'
                }
              ]}
            />
          </div>
        )}
      </div>

      {/* سجل الأنشطة */}
      <ActivityLog 
        activities={dashboardData.recent_activities || []}
        title="أنشطة الفريق الحديثة"
        showFilters={true}
        showRefresh={true}
        onRefresh={onRefresh}
        quickActions={[
          {
            label: 'تقرير الأنشطة',
            icon: '📋📊',
            onClick: () => console.log('تقرير شامل للأنشطة'),
            color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          },
          {
            label: 'إشعارات الفريق',
            icon: '📢👥',
            onClick: () => console.log('إرسال إشعار للفريق'),
            color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
          }
        ]}
      />
    </div>
  );
};

export default ManagerDashboard;