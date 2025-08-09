// Manager Dashboard Component - لوحة تحكم المدراء
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

  // إحصائيات مخصصة للمدراء
  const managerStats = [
    {
      title: 'أعضاء الفريق',
      value: dashboardData.team_members_count || 0,
      icon: '👥',
      change: '+2 هذا الشهر',
      color: 'bg-blue-500'
    },
    {
      title: 'إجمالي المبيعات',
      value: `${(dashboardData.team_sales_total || 0).toLocaleString()} ج.م`,
      icon: '💰',
      change: `+${dashboardData.sales_growth || 0}%`,
      color: 'bg-green-500'
    },
    {
      title: 'الزيارات المكتملة',
      value: dashboardData.visits_in_period || 0,
      icon: '🏥',
      change: `${dashboardData.visit_completion_rate || 0}% معدل الإنجاز`,
      color: 'bg-purple-500'
    },
    {
      title: 'الأهداف المحققة',
      value: `${dashboardData.targets_achieved || 0}/${dashboardData.total_targets || 0}`,
      icon: '🎯',
      change: `${Math.round((dashboardData.targets_achieved || 0) / (dashboardData.total_targets || 1) * 100)}% معدل الإنجاز`,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* رأس لوحة التحكم */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            لوحة تحكم المدير
          </h1>
          <p className="text-gray-600 mt-1">
            مرحباً {user?.full_name || user?.username} - إدارة الفريق والأداء
          </p>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* مرشح الوقت */}
          <select 
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذا العام</option>
          </select>
          
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <CommonDashboardComponents.StatsGrid stats={managerStats} />

      {/* الرسوم البيانية والتحليلات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء المبيعات */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">أداء المبيعات</h3>
          <SalesPerformance 
            data={dashboardData.sales_performance || []}
            timeFilter={timeFilter}
          />
        </div>

        {/* رسم بياني للاتجاهات */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">اتجاهات الفريق</h3>
          <LineCharts 
            data={dashboardData.team_trends || []}
            title="أداء الفريق خلال الفترة"
          />
        </div>
      </div>

      {/* أداء الفريق */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">أداء أعضاء الفريق</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المندوب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الزيارات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبيعات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    معدل النجاح
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamPerformance.length > 0 ? (
                  teamPerformance.map((member, index) => (
                    <tr key={member.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.name || 'مندوب ' + (index + 1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.visits_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(member.sales_amount || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.success_rate || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (member.success_rate || 0) >= 80 
                            ? 'bg-green-100 text-green-800' 
                            : (member.success_rate || 0) >= 60 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(member.success_rate || 0) >= 80 ? 'ممتاز' : 
                           (member.success_rate || 0) >= 60 ? 'جيد' : 'يحتاج تحسين'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      لا توجد بيانات لعرضها
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* سجل الأنشطة */}
      <ActivityLog 
        activities={dashboardData.recent_activities || []}
        title="أنشطة الفريق الحديثة"
      />
    </div>
  );
};

export default ManagerDashboard;