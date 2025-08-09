// Medical Representative Dashboard Component - لوحة تحكم المندوب الطبي
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';
import ActivityLog from './ActivityLog';
import LineCharts from './LineCharts';

const MedicalRepresentativeDashboard = ({ 
  user, 
  dashboardData = {}, 
  timeFilter, 
  onTimeFilterChange, 
  onRefresh,
  language = 'ar',
  isRTL = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [visitPlan, setVisitPlan] = useState([]);
  const [assignedClinics, setAssignedClinics] = useState([]);

  const API_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // تحميل خطة الزيارات والعيادات
  const loadRepData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // تحميل خطة الزيارات
      const visitsResponse = await fetch(
        `${API_URL}/api/visits/plan/${user?.id}?time_filter=${timeFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        setVisitPlan(visitsData.visit_plan || []);
      }

      // تحميل العيادات المخصصة
      const clinicsResponse = await fetch(
        `${API_URL}/api/clinics?rep_id=${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        setAssignedClinics(clinicsData.clinics || []);
      }
      
    } catch (error) {
      console.error('خطأ في تحميل بيانات المندوب الطبي:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadRepData();
    }
  }, [timeFilter, user?.id]);

  // إحصائيات مخصصة للمندوب الطبي
  const medicalRepStats = [
    {
      title: 'زياراتي اليوم',
      value: dashboardData.personal_visits || 0,
      icon: '🏥',
      change: `${dashboardData.successful_visits || 0} زيارة ناجحة`,
      color: 'bg-blue-500'
    },
    {
      title: 'معدل النجاح',
      value: `${dashboardData.success_rate || 0}%`,
      icon: '🎯',
      change: dashboardData.success_rate >= 80 ? 'أداء ممتاز' : 
               dashboardData.success_rate >= 60 ? 'أداء جيد' : 'يحتاج تحسين',
      color: dashboardData.success_rate >= 80 ? 'bg-green-500' : 
             dashboardData.success_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
    },
    {
      title: 'العيادات المخصصة',
      value: dashboardData.assigned_clinics_count || 0,
      icon: '🏢',
      change: `${assignedClinics.filter(c => c.is_active).length} نشطة`,
      color: 'bg-purple-500'
    },
    {
      title: 'إجمالي الطلبات',
      value: (dashboardData.orders_summary?.orders_count) || 0,
      icon: '📋',
      change: `${((dashboardData.orders_summary?.total_value) || 0).toLocaleString()} ج.م إجمالي`,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* رأس لوحة التحكم */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            لوحة تحكم المندوب الطبي
          </h1>
          <p className="text-gray-600 mt-1">
            مرحباً {user?.full_name || user?.username} - متابعة الزيارات والعيادات
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
      <CommonDashboardComponents.StatsGrid stats={medicalRepStats} />

      {/* الأداء والاتجاهات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء الزيارات */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">أداء الزيارات</h3>
          <LineCharts 
            data={dashboardData.visit_trends || []}
            title="معدل نجاح الزيارات"
          />
        </div>

        {/* خطة الزيارات اليومية */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">خطة الزيارات اليوم</h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {visitPlan.length > 0 ? (
                visitPlan.slice(0, 5).map((visit, index) => (
                  <div key={visit.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-3 h-3 rounded-full ${
                        visit.status === 'completed' ? 'bg-green-500' :
                        visit.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium text-sm">{visit.clinic_name || 'عيادة غير محددة'}</p>
                        <p className="text-xs text-gray-500">{visit.scheduled_time || 'وقت غير محدد'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      visit.priority === 'high' ? 'bg-red-100 text-red-800' :
                      visit.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {visit.priority === 'high' ? 'عالية' :
                       visit.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  لا توجد زيارات مجدولة اليوم
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* العيادات المخصصة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">العيادات المخصصة لي</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClinics.length > 0 ? (
              assignedClinics.slice(0, 6).map((clinic, index) => (
                <div key={clinic.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{clinic.clinic_name || 'عيادة غير محددة'}</h4>
                    <span className={`w-3 h-3 rounded-full ${
                      clinic.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    د. {clinic.doctor_name || 'غير محدد'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {clinic.doctor_specialty || 'التخصص غير محدد'}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      clinic.classification === 'class_a_star' ? 'bg-gold-100 text-gold-800' :
                      clinic.classification === 'class_a' ? 'bg-blue-100 text-blue-800' :
                      clinic.classification === 'class_b' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {clinic.classification === 'class_a_star' ? 'A*' :
                       clinic.classification === 'class_a' ? 'A' :
                       clinic.classification === 'class_b' ? 'B' :
                       clinic.classification === 'class_c' ? 'C' :
                       clinic.classification === 'class_d' ? 'D' : 'غير محدد'}
                    </span>
                    <span className="text-gray-500">
                      آخر زيارة: {clinic.last_visit_date ? 
                        new Date(clinic.last_visit_date).toLocaleDateString('ar-EG') : 'لم تتم'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-gray-500">
                لا توجد عيادات مخصصة حالياً
              </div>
            )}
          </div>
        )}
      </div>

      {/* سجل الأنشطة */}
      <ActivityLog 
        activities={dashboardData.recent_activities || []}
        title="أنشطتي الطبية الحديثة"
      />
    </div>
  );
};

export default MedicalRepresentativeDashboard;