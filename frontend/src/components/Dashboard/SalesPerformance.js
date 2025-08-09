// Sales Performance Component - مكون أداء المبيعات المحسن
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';

const SalesPerformance = ({ 
  data = [], 
  timeFilter = 'month',
  showComparison = true,
  showTargets = true,
  title = 'أداء المبيعات',
  onExport,
  onViewDetails
}) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState('chart'); // chart, table, summary

  // معالجة البيانات
  useEffect(() => {
    if (data && data.length > 0) {
      const processed = processPerformanceData(data);
      setPerformanceData(processed);
    }
  }, [data, timeFilter]);

  // معالجة بيانات الأداء
  const processPerformanceData = (rawData) => {
    return rawData.map(item => ({
      period: item.period || item.date || 'غير محدد',
      sales: item.sales || item.amount || 0,
      target: item.target || 0,
      orders: item.orders_count || item.orders || 0,
      achievement: item.target > 0 ? (item.sales / item.target * 100) : 0,
      growth: item.growth_rate || 0,
      comparison: item.previous_period_comparison || 0
    }));
  };

  // حساب الإجماليات
  const calculateSummary = () => {
    const totalSales = performanceData.reduce((sum, item) => sum + item.sales, 0);
    const totalTarget = performanceData.reduce((sum, item) => sum + item.target, 0);
    const totalOrders = performanceData.reduce((sum, item) => sum + item.orders, 0);
    const avgAchievement = performanceData.length > 0 
      ? performanceData.reduce((sum, item) => sum + item.achievement, 0) / performanceData.length
      : 0;

    return {
      totalSales,
      totalTarget,
      totalOrders,
      avgAchievement,
      achievementRate: totalTarget > 0 ? (totalSales / totalTarget * 100) : 0
    };
  };

  const summary = calculateSummary();

  // تحديد لون الإنجاز
  const getAchievementColor = (achievement) => {
    if (achievement >= 100) return 'text-green-600 bg-green-100 border-green-200';
    if (achievement >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (achievement >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'تصدير البيانات',
      icon: '📊',
      onClick: () => onExport && onExport(performanceData),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: 'عرض التفاصيل',
      icon: '🔍',
      onClick: () => onViewDetails && onViewDetails(performanceData),
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: 'تحليل متقدم',
      icon: '📈',
      onClick: () => console.log('تحليل متقدم'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      label: 'طباعة التقرير',
      icon: '🖨️',
      onClick: () => window.print(),
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  // الرسم البياني البسيط المحسن
  const SimpleChart = () => {
    const maxSales = Math.max(...performanceData.map(item => item.sales), 0);
    const maxTarget = Math.max(...performanceData.map(item => item.target), 0);
    const chartMax = Math.max(maxSales, maxTarget);

    if (performanceData.length === 0 || chartMax === 0) {
      return (
        <CommonDashboardComponents.EmptyState
          icon="📊"
          title="لا توجد بيانات كافية"
          description="لا توجد بيانات كافية لعرض الرسم البياني"
        />
      );
    }

    return (
      <div className="space-y-6">
        {performanceData.slice(0, 10).map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-semibold text-gray-900">{item.period}</span>
                <div className="flex items-center space-x-4 space-x-reverse mt-1">
                  <span className="text-sm text-gray-600">
                    المبيعات: {item.sales.toLocaleString()} ج.م
                  </span>
                  <span className="text-sm text-gray-600">
                    الهدف: {item.target.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getAchievementColor(item.achievement)}`}>
                  {item.achievement.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* شريط المبيعات المحسن */}
            <div className="relative mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-700 relative"
                  style={{ width: `${(item.sales / chartMax) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform skew-x-12 animate-slide-right"></div>
                </div>
              </div>
              {/* خط الهدف */}
              <div 
                className="absolute top-0 h-4 w-1 bg-red-500 rounded shadow-sm"
                style={{ left: `${(item.target / chartMax) * 100}%` }}
                title={`الهدف: ${item.target.toLocaleString()}`}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>الإنجاز: {item.achievement.toFixed(1)}%</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span>📦 {item.orders} طلب</span>
                {item.growth !== 0 && (
                  <span className={`px-2 py-1 rounded-full ${
                    item.growth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.growth > 0 ? '↗️' : '↘️'} {Math.abs(item.growth).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // جدول الأداء المحسن
  const PerformanceTable = () => {
    const headers = ['الفترة', 'المبيعات', 'الهدف', 'الطلبات', 'معدل الإنجاز', 'النمو'];
    const tableData = performanceData.map(item => ({
      period: item.period,
      sales: `${item.sales.toLocaleString()} ج.م`,
      target: `${item.target.toLocaleString()} ج.م`,
      orders: item.orders.toLocaleString(),
      achievement: (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getAchievementColor(item.achievement)}`}>
          {item.achievement.toFixed(1)}%
        </span>
      ),
      growth: (
        <span className={`flex items-center ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {item.growth >= 0 ? '↗️' : '↘️'} {item.growth.toFixed(1)}%
        </span>
      )
    }));

    return (
      <CommonDashboardComponents.DataTable 
        headers={headers}
        data={tableData}
        searchable={true}
        sortable={true}
        pagination={true}
        itemsPerPage={5}
        actions={[
          {
            label: 'عرض',
            icon: '👁️',
            onClick: (row, index) => onViewDetails && onViewDetails(performanceData[index]),
            className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }
        ]}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* رأس المكون مع الإجراءات السريعة */}
      {title && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-blue-600 mr-2 text-2xl">📈</span>
                {title}
              </h3>
              <p className="text-base font-medium text-gray-700 mt-1">
                تحليل شامل لأداء المبيعات والأهداف
              </p>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="chart">📊 رسم بياني</option>
                <option value="table">📋 جدول</option>
                <option value="summary">📈 ملخص</option>
              </select>
            </div>
          </div>

          {/* الإجراءات السريعة */}
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-all border-2 ${action.color} shadow-sm hover:shadow-md`}
              >
                <span className="mr-2 text-lg">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* بطاقات الملخص المحسنة */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-300 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 rounded-full p-3 mr-4">
                <span className="text-white text-2xl">💰</span>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-700">
                  {summary.totalSales.toLocaleString()}
                </div>
                <div className="font-bold text-gray-900">إجمالي المبيعات</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-300 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-green-500 rounded-full p-3 mr-4">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <div>
                <div className="text-2xl font-black text-green-700">
                  {summary.totalTarget.toLocaleString()}
                </div>
                <div className="font-bold text-gray-900">إجمالي الأهداف</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-300 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500 rounded-full p-3 mr-4">
                <span className="text-white text-2xl">📦</span>
              </div>
              <div>
                <div className="text-2xl font-black text-purple-700">
                  {summary.totalOrders.toLocaleString()}
                </div>
                <div className="font-bold text-gray-900">عدد الطلبات</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-300 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-orange-500 rounded-full p-3 mr-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <div className="text-2xl font-black text-orange-700">
                  {summary.achievementRate.toFixed(1)}%
                </div>
                <div className="font-bold text-gray-900">معدل الإنجاز</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مؤشر التقدم الإجمالي المحسن */}
      <div className="p-6 border-b border-gray-200">
        <CommonDashboardComponents.ProgressBar 
          title="إجمالي الإنجاز للفترة"
          current={summary.totalSales}
          target={summary.totalTarget}
          color={summary.achievementRate >= 100 ? 'bg-green-500' : 
                 summary.achievementRate >= 80 ? 'bg-blue-500' : 
                 summary.achievementRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
          animated={true}
          showPercentage={true}
        />
      </div>

      {/* المحتوى حسب نوع العرض */}
      <div className="p-6">
        {loading ? (
          <CommonDashboardComponents.LoadingSpinner message="جاري تحميل بيانات الأداء..." />
        ) : (
          <div>
            {viewType === 'chart' && <SimpleChart />}
            {viewType === 'table' && <PerformanceTable />}
            {viewType === 'summary' && (
              <div className="space-y-6">
                {/* مؤشرات دائرية */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <CommonDashboardComponents.CircularProgress 
                      percentage={summary.achievementRate}
                      color={summary.achievementRate >= 100 ? '#10b981' : 
                             summary.achievementRate >= 80 ? '#3b82f6' : '#ef4444'}
                      size={100}
                      label="الإنجاز العام"
                    />
                  </div>

                  <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <CommonDashboardComponents.CircularProgress 
                      percentage={Math.min((summary.totalOrders / 100) * 100, 100)}
                      color="#8b5cf6"
                      size={100}
                      label="تقدم الطلبات"
                    />
                  </div>

                  <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <CommonDashboardComponents.CircularProgress 
                      percentage={summary.avgAchievement}
                      color="#f59e0b"
                      size={100}
                      label="متوسط الأداء"
                    />
                  </div>
                </div>

                {/* التحليل التفصيلي */}
                <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2 text-2xl">📋</span>
                    تحليل شامل للأداء
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">إجمالي المبيعات:</span>
                        <span className="font-black text-lg">{summary.totalSales.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">معدل الإنجاز:</span>
                        <span className="font-black text-lg">{summary.achievementRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">متوسط قيمة الطلب:</span>
                        <span className="font-black text-lg">
                          {summary.totalOrders > 0 ? (summary.totalSales / summary.totalOrders).toLocaleString() : 0} ج.م
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">عدد الفترات:</span>
                        <span className="font-black text-lg">{performanceData.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">الحالة العامة:</span>
                        <span className={`font-black px-4 py-2 rounded-full border-2 ${
                          summary.achievementRate >= 100 ? 'bg-green-100 text-green-800 border-green-300' :
                          summary.achievementRate >= 80 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          summary.achievementRate >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {summary.achievementRate >= 100 ? '🏆 ممتاز' :
                           summary.achievementRate >= 80 ? '👍 جيد' :
                           summary.achievementRate >= 60 ? '⚠️ مقبول' : '📉 يحتاج تحسين'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {performanceData.length === 0 && !loading && (
          <CommonDashboardComponents.EmptyState
            icon="📈"
            title="لا توجد بيانات أداء"
            description="لم يتم العثور على بيانات أداء المبيعات للفترة المحددة"
            suggestions={[
              {
                label: 'تحديث البيانات',
                onClick: () => window.location.reload()
              },
              {
                label: 'تغيير الفترة الزمنية',
                onClick: () => console.log('تغيير الفترة')
              }
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default SalesPerformance;