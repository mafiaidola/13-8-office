// Sales Representative Dashboard Component - لوحة تحكم المندوب التجاري
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';
import ActivityLog from './ActivityLog';
import LineCharts from './LineCharts';

const SalesRepresentativeDashboard = ({ 
  user, 
  dashboardData = {}, 
  timeFilter, 
  onTimeFilterChange, 
  onRefresh,
  language = 'ar',
  isRTL = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const API_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // تحميل الأهداف والطلبات
  const loadRepData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // تحميل الأهداف
      const targetsResponse = await fetch(
        `${API_URL}/api/targets/rep/${user?.id}?time_filter=${timeFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (targetsResponse.ok) {
        const targetsData = await targetsResponse.json();
        setTargets(targetsData.targets || []);
      }

      // تحميل الطلبات الحديثة
      const ordersResponse = await fetch(
        `${API_URL}/api/orders?rep_id=${user?.id}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);
      }
      
    } catch (error) {
      console.error('خطأ في تحميل بيانات المندوب:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadRepData();
    }
  }, [timeFilter, user?.id]);

  // إحصائيات مخصصة للمندوب التجاري
  const repStats = [
    {
      title: 'مبيعاتي اليوم',
      value: `${(dashboardData.daily_sales || 0).toLocaleString()} ج.م`,
      icon: '💰',
      change: `من ${dashboardData.daily_target || 0} ج.م هدف`,
      color: 'bg-green-500'
    },
    {
      title: 'الطلبات الجديدة',
      value: dashboardData.orders_in_period || 0,
      icon: '📋',
      change: '+15% من الأمس',
      color: 'bg-blue-500'
    },
    {
      title: 'العيادات المتاحة',
      value: dashboardData.assigned_clinics_count || 0,
      icon: '🏥',
      change: `${dashboardData.active_clinics || 0} نشطة`,
      color: 'bg-purple-500'
    },
    {
      title: 'معدل النجاح',
      value: `${dashboardData.success_rate || 0}%`,
      icon: '🎯',
      change: `${dashboardData.successful_visits || 0}/${dashboardData.personal_visits || 0} زيارة`,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* رأس لوحة التحكم */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            لوحة تحكم المندوب التجاري
          </h1>
          <p className="text-gray-600 mt-1">
            مرحباً {user?.full_name || user?.username} - تتبع الأداء والمبيعات
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
      <CommonDashboardComponents.StatsGrid stats={repStats} />

      {/* الأهداف والإنجازات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأهداف الشهرية */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">الأهداف الشهرية</h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {targets.length > 0 ? (
                targets.map((target, index) => {
                  const progress = Math.min((target.achieved || 0) / (target.target || 1) * 100, 100);
                  return (
                    <div key={target.id || index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{target.name || `هدف ${index + 1}`}</span>
                        <span className="text-gray-500">
                          {(target.achieved || 0).toLocaleString()} / {(target.target || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress >= 100 ? 'bg-green-500' : 
                            progress >= 75 ? 'bg-blue-500' : 
                            progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {progress.toFixed(1)}% مكتمل
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  لا توجد أهداف محددة
                </div>
              )}
            </div>
          )}
        </div>

        {/* الرسم البياني للمبيعات */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">اتجاهات المبيعات</h3>
          <LineCharts 
            data={dashboardData.sales_trends || []}
            title="المبيعات اليومية"
          />
        </div>
      </div>

      {/* الطلبات الحديثة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">الطلبات الحديثة</h3>
        
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
                    رقم الطلب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العيادة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <tr key={order.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.clinic_name || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(order.total_amount || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' :
                           order.status === 'pending' ? 'قيد المعالجة' :
                           order.status || 'جديد'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      لا توجد طلبات حديثة
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
        title="أنشطتي الحديثة"
      />
    </div>
  );
};

export default SalesRepresentativeDashboard;