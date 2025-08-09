// Medical Rep Dashboard - لوحة تحكم المندوب الطبي
import React, { useState } from 'react';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';

const MedicalRepDashboard = ({ user, dashboardData, timeFilter, onTimeFilterChange, onRefresh }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ج.م';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="medical-rep-dashboard p-6 bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 min-h-screen" dir="rtl">
      {/* Header شخصي للمندوب */}
      <div className="dashboard-header mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-3xl text-white">👨‍⚕️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحباً، {user?.full_name || user?.username}
                </h1>
                <p className="text-gray-600">المندوب الطبي - لوحة التحكم الشخصية</p>
                <p className="text-sm text-green-600 font-medium">
                  معدل النجاح: {dashboardData.success_rate || 0}%
                </p>
              </div>
            </div>

            {/* Time Filter */}
            <div className="time-filters flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'today', label: 'اليوم' },
                { key: 'week', label: 'الأسبوع' },
                { key: 'month', label: 'الشهر' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => onTimeFilterChange(filter.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeFilter === filter.key
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات الشخصية */}
      <div className="personal-stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="زياراتي"
          value={formatNumber(dashboardData.personal_visits || 0)}
          icon="🚗"
          color="blue"
          trend={`${timeFilter === 'today' ? 'اليوم' : timeFilter === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}`}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="الزيارات الناجحة"
          value={formatNumber(dashboardData.successful_visits || 0)}
          icon="✅"
          color="green"
          trend={`معدل النجاح: ${dashboardData.success_rate || 0}%`}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="طلباتي"
          value={formatNumber(dashboardData.orders_summary?.orders_count || 0)}
          icon="📋"
          color="orange"
          trend={formatCurrency(dashboardData.orders_summary?.total_value || 0)}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="العيادات المخصصة"
          value={formatNumber(dashboardData.assigned_clinics_count || 0)}
          icon="🏥"
          color="purple"
          trend="عيادة نشطة"
          className="hover:scale-105 transition-transform"
        />
      </div>

      {/* أقسام التفاعل */}
      <div className="interaction-sections mb-8">
        <div className="section-tabs flex gap-2 mb-6">
          {[
            { key: 'overview', label: 'نظرة عامة', icon: '📊' },
            { key: 'visits', label: 'الزيارات', icon: '🚗' },
            { key: 'targets', label: 'الأهداف', icon: '🎯' },
            { key: 'performance', label: 'الأداء', icon: '📈' }
          ].map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeSection === section.key
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* محتوى الأقسام */}
        <div className="section-content bg-white rounded-xl shadow-lg p-6">
          {activeSection === 'overview' && (
            <div className="overview-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">نظرة عامة على أدائك</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ملخص الأداء */}
                <div className="performance-summary bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <span>📈</span>
                    ملخص الأداء
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-600">إجمالي الزيارات:</span>
                      <span className="font-bold text-blue-800">{formatNumber(dashboardData.personal_visits || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">الزيارات الناجحة:</span>
                      <span className="font-bold text-blue-800">{formatNumber(dashboardData.successful_visits || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">معدل النجاح:</span>
                      <span className="font-bold text-blue-800">{dashboardData.success_rate || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* ملخص الطلبات */}
                <div className="orders-summary bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                    <span>💰</span>
                    ملخص الطلبات
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-600">عدد الطلبات:</span>
                      <span className="font-bold text-green-800">{formatNumber(dashboardData.orders_summary?.orders_count || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">إجمالي القيمة:</span>
                      <span className="font-bold text-green-800">{formatCurrency(dashboardData.orders_summary?.total_value || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">متوسط الطلبية:</span>
                      <span className="font-bold text-green-800">{formatCurrency(dashboardData.orders_summary?.avg_order_value || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'visits' && (
            <div className="visits-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>🚗</span>
                تفاصيل الزيارات
              </h2>
              
              <div className="visits-analytics bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatNumber(dashboardData.personal_visits || 0)}
                    </div>
                    <div className="text-gray-600">إجمالي الزيارات</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatNumber(dashboardData.successful_visits || 0)}
                    </div>
                    <div className="text-gray-600">زيارات ناجحة</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {dashboardData.success_rate || 0}%
                    </div>
                    <div className="text-gray-600">معدل النجاح</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'targets' && (
            <div className="targets-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>🎯</span>
                الأهداف والإنجازات
              </h2>
              
              <div className="targets-progress space-y-4">
                <ProgressBar
                  title="هدف الزيارات الشهرية"
                  current={dashboardData.personal_visits || 0}
                  target={50}
                  color="blue"
                />
                
                <ProgressBar
                  title="هدف الطلبات الشهرية"
                  current={dashboardData.orders_summary?.orders_count || 0}
                  target={20}
                  color="green"
                />
                
                <ProgressBar
                  title="هدف القيمة الشهرية"
                  current={dashboardData.orders_summary?.total_value || 0}
                  target={100000}
                  color="orange"
                  isCurrency={true}
                />
              </div>
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="performance-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📈</span>
                تحليل الأداء
              </h2>
              
              <div className="performance-metrics grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="ranking-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-purple-800 mb-4">ترتيبي بين المناديب</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      #{dashboardData.performance_ranking?.rank || 1}
                    </div>
                    <div className="text-purple-700">
                      من إجمالي {dashboardData.performance_ranking?.total_reps || 1} مندوب
                    </div>
                  </div>
                </div>
                
                <div className="efficiency-card bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-teal-800 mb-4">مؤشر الكفاءة</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                      {dashboardData.success_rate || 0}%
                    </div>
                    <div className="text-teal-700">معدل نجاح الزيارات</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* أزرار الإجراءات السريعة */}
      <div className="quick-actions bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚡</span>
          الإجراءات السريعة
        </h2>
        
        <div className="actions-grid grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="action-btn bg-blue-500 text-white rounded-lg p-4 hover:bg-blue-600 transition-colors flex flex-col items-center gap-2">
            <span className="text-2xl">📋</span>
            <span className="font-medium">إنشاء طلبية</span>
          </button>
          
          <button className="action-btn bg-green-500 text-white rounded-lg p-4 hover:bg-green-600 transition-colors flex flex-col items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="font-medium">تسجيل زيارة</span>
          </button>
          
          <button className="action-btn bg-purple-500 text-white rounded-lg p-4 hover:bg-purple-600 transition-colors flex flex-col items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="font-medium">تسجيل عيادة</span>
          </button>
          
          <button className="action-btn bg-orange-500 text-white rounded-lg p-4 hover:bg-orange-600 transition-colors flex flex-col items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="font-medium">التقارير</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalRepDashboard;