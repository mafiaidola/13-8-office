// GM Dashboard - لوحة تحكم المدير العام
import React, { useState } from 'react';
import StatCard from './StatCard';
import DashboardWidget from './DashboardWidget';

const GMDashboard = ({ user, dashboardData, timeFilter, onTimeFilterChange, onRefresh }) => {
  const [activeView, setActiveView] = useState('strategic');

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
    <div className="gm-dashboard p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 min-h-screen" dir="rtl">
      {/* Header استراتيجي للمدير العام */}
      <div className="dashboard-header mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-4xl">👑</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  لوحة تحكم المدير العام
                </h1>
                <p className="text-purple-100 text-lg">
                  مرحباً، {user?.full_name || user?.username} - الرؤية الاستراتيجية
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    📈 نمو الأعمال
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    🎯 الأداء الاستراتيجي
                  </span>
                </div>
              </div>
            </div>

            {/* Time Filter متقدم */}
            <div className="time-filters bg-white/20 rounded-lg p-2">
              {[
                { key: 'month', label: 'الشهر', icon: '📅' },
                { key: 'quarter', label: 'الربع', icon: '📊' },
                { key: 'year', label: 'السنة', icon: '📈' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => onTimeFilterChange(filter.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    timeFilter === filter.key
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs الاستراتيجية للمدير العام */}
      <div className="strategic-kpis-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(dashboardData.financial_kpis?.total_revenue || 0)}
          icon="💎"
          color="emerald"
          trend={`نمو ${dashboardData.growth_metrics?.revenue_growth || 0}%`}
          isFinancial={true}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="عدد العيادات الجديدة"
          value={formatNumber(dashboardData.new_clinics_count || 0)}
          icon="🏥"
          color="blue"
          trend={`نمو ${dashboardData.growth_metrics?.clinics_growth || 0}%`}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="أداء الخطوط"
          value={`${dashboardData.lines_performance?.length || 0} خط`}
          icon="📍"
          color="purple"
          trend="جميع الخطوط نشطة"
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="كفاءة المناديب"
          value={`${dashboardData.reps_performance?.length || 0} مندوب`}
          icon="👥"
          color="orange"
          trend="أداء ممتاز"
          className="hover:scale-105 transition-transform"
        />
      </div>

      {/* Views التبديل */}
      <div className="view-tabs mb-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-lg">
          {[
            { key: 'strategic', label: 'الرؤية الاستراتيجية', icon: '🎯' },
            { key: 'performance', label: 'أداء الخطوط', icon: '📊' },
            { key: 'teams', label: 'أداء الفرق', icon: '👥' },
            { key: 'growth', label: 'النمو والتطور', icon: '📈' }
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`px-6 py-3 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeView === view.key
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <span>{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوى Views */}
      <div className="view-content">
        {activeView === 'strategic' && (
          <div className="strategic-view space-y-6">
            {/* الأهداف الاستراتيجية */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-purple-500">🎯</span>
                الأهداف الاستراتيجية
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="strategic-goal bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                      📈
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800">نمو الإيرادات</h3>
                      <p className="text-sm text-green-600">الهدف السنوي</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">المحقق:</span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(dashboardData.financial_kpis?.achieved_revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">الهدف:</span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(dashboardData.financial_kpis?.target_revenue || 1000000)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="strategic-goal bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                      🏥
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-800">توسيع الشبكة</h3>
                      <p className="text-sm text-blue-600">عيادات جديدة</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">المضافة:</span>
                      <span className="font-bold text-blue-800">
                        {formatNumber(dashboardData.new_clinics_count || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">الهدف:</span>
                      <span className="font-bold text-blue-800">50 عيادة</span>
                    </div>
                  </div>
                </div>

                <div className="strategic-goal bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-800">الكفاءة التشغيلية</h3>
                      <p className="text-sm text-purple-600">تحسين العمليات</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-700">الكفاءة:</span>
                      <span className="font-bold text-purple-800">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">الهدف:</span>
                      <span className="font-bold text-purple-800">98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* المؤشرات الرئيسية */}
            <div className="kpis-overview bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                المؤشرات الرئيسية للأداء
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.financial_kpis && Object.entries({
                  'معدل النمو الشهري': `${dashboardData.growth_metrics?.monthly_growth || 0}%`,
                  'رضا العملاء': '92%',
                  'كفاءة التحصيل': `${dashboardData.financial_kpis?.collection_efficiency || 0}%`,
                  'متوسط حجم الطلبية': formatCurrency(dashboardData.financial_kpis?.avg_order_value || 0)
                }).map(([key, value]) => (
                  <div key={key} className="kpi-card bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
                    <div className="text-sm text-gray-600">{key}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'performance' && (
          <div className="performance-view">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-orange-500">📊</span>
                أداء الخطوط الجغرافية
              </h2>
              
              {dashboardData.lines_performance && dashboardData.lines_performance.length > 0 ? (
                <div className="lines-performance-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.lines_performance.slice(0, 6).map((line, index) => (
                    <div key={line._id || index} className="line-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-blue-800">{line._id || 'خط غير محدد'}</h3>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          #{index + 1}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-600">عدد الطلبات:</span>
                          <span className="font-bold text-blue-800">{formatNumber(line.orders_count || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">إجمالي الإيرادات:</span>
                          <span className="font-bold text-blue-800">{formatCurrency(line.total_revenue || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">متوسط الطلبية:</span>
                          <span className="font-bold text-blue-800">{formatCurrency(line.avg_order_value || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-500 text-lg">لا توجد بيانات أداء للخطوط حالياً</p>
                  <p className="text-gray-400 text-sm mt-2">سيتم عرض البيانات عند توفر طلبات وأنشطة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'teams' && (
          <div className="teams-view">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-green-500">👥</span>
                أداء فرق المناديب
              </h2>
              
              {dashboardData.reps_performance && dashboardData.reps_performance.length > 0 ? (
                <div className="reps-performance-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.reps_performance.slice(0, 6).map((rep, index) => (
                    <div key={rep._id || index} className="rep-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-green-800">مندوب {rep._id || index + 1}</h3>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                          #{index + 1}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-green-600">عدد الزيارات:</span>
                          <span className="font-bold text-green-800">{formatNumber(rep.visits_count || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">زيارات ناجحة:</span>
                          <span className="font-bold text-green-800">{formatNumber(rep.successful_visits || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">معدل النجاح:</span>
                          <span className="font-bold text-green-800">{Math.round(rep.success_rate || 0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-500 text-lg">لا توجد بيانات أداء للمناديب حالياً</p>
                  <p className="text-gray-400 text-sm mt-2">سيتم عرض البيانات عند توفر زيارات وأنشطة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'growth' && (
          <div className="growth-view">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-purple-500">📈</span>
                النمو والتطور
              </h2>
              
              <div className="growth-metrics grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="metric-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <h3 className="font-bold text-purple-800 mb-4">معدلات النمو</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-purple-600">النمو الشهري:</span>
                      <span className="font-bold text-purple-800">
                        {dashboardData.growth_metrics?.monthly_growth || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">النمو الربعي:</span>
                      <span className="font-bold text-purple-800">
                        {dashboardData.growth_metrics?.quarterly_growth || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">النمو السنوي:</span>
                      <span className="font-bold text-purple-800">
                        {dashboardData.growth_metrics?.yearly_growth || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="trends-card bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                  <h3 className="font-bold text-orange-800 mb-4">اتجاهات السوق</h3>
                  <div className="space-y-3">
                    <div className="trend-item">
                      <div className="text-sm text-orange-600">توسيع العيادات</div>
                      <div className="font-bold text-orange-800">اتجاه إيجابي ↗️</div>
                    </div>
                    <div className="trend-item">
                      <div className="text-sm text-orange-600">نشاط المناديب</div>
                      <div className="font-bold text-orange-800">نمو مستقر ↗️</div>
                    </div>
                    <div className="trend-item">
                      <div className="text-sm text-orange-600">الإيرادات</div>
                      <div className="font-bold text-orange-800">نمو قوي ↗️</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions panel للمدير العام */}
      <div className="gm-actions-panel bg-white rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚡</span>
          الإجراءات الإدارية السريعة
        </h2>
        
        <div className="actions-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: '📊', label: 'التقارير الشاملة', color: 'blue' },
            { icon: '🎯', label: 'تحديد الأهداف', color: 'purple' },
            { icon: '👥', label: 'إدارة الفرق', color: 'green' },
            { icon: '📈', label: 'تحليل الأداء', color: 'orange' },
            { icon: '🏆', label: 'نظام المكافآت', color: 'yellow' },
            { icon: '⚙️', label: 'إعدادات النظام', color: 'gray' }
          ].map((action, index) => (
            <button
              key={index}
              className={`action-btn bg-${action.color}-500 text-white rounded-lg p-4 hover:bg-${action.color}-600 transition-colors flex flex-col items-center gap-2 text-center`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GMDashboard;