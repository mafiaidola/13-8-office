// Sales Performance Component - مكون أداء المبيعات
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';

const SalesPerformance = ({ 
  data = [], 
  timeFilter = 'month',
  showComparison = true,
  showTargets = true,
  title = 'أداء المبيعات'
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
    if (achievement >= 100) return 'text-green-600 bg-green-100';
    if (achievement >= 80) return 'text-blue-600 bg-blue-100';
    if (achievement >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // الرسم البياني البسيط
  const SimpleChart = () => {
    const maxSales = Math.max(...performanceData.map(item => item.sales), 0);
    const maxTarget = Math.max(...performanceData.map(item => item.target), 0);
    const chartMax = Math.max(maxSales, maxTarget);

    if (performanceData.length === 0 || chartMax === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          لا توجد بيانات كافية لعرض الرسم البياني
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {performanceData.slice(0, 10).map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.period}</span>
              <span className="text-gray-500">
                {item.sales.toLocaleString()} / {item.target.toLocaleString()} ج.م
              </span>
            </div>
            
            {/* شريط المبيعات */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(item.sales / chartMax) * 100}%` }}
                ></div>
              </div>
              {/* خط الهدف */}
              <div 
                className="absolute top-0 h-3 w-1 bg-red-500 rounded"
                style={{ left: `${(item.target / chartMax) * 100}%` }}
                title={`الهدف: ${item.target.toLocaleString()}`}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>الإنجاز: {item.achievement.toFixed(1)}%</span>
              <span className={`px-2 py-1 rounded-full ${getAchievementColor(item.achievement)}`}>
                {item.achievement >= 100 ? 'تم تجاوز الهدف' :
                 item.achievement >= 80 ? 'قريب من الهدف' :
                 item.achievement >= 60 ? 'يحتاج تحسين' : 'دون المستوى'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // جدول الأداء
  const PerformanceTable = () => {
    const headers = ['الفترة', 'المبيعات', 'الهدف', 'الطلبات', 'معدل الإنجاز', 'النمو'];
    const tableData = performanceData.map(item => ({
      period: item.period,
      sales: `${item.sales.toLocaleString()} ج.م`,
      target: `${item.target.toLocaleString()} ج.م`,
      orders: item.orders.toLocaleString(),
      achievement: `${item.achievement.toFixed(1)}%`,
      growth: `${item.growth > 0 ? '+' : ''}${item.growth.toFixed(1)}%`
    }));

    return (
      <CommonDashboardComponents.DataTable 
        headers={headers}
        data={tableData}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* رأس المكون */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="chart">رسم بياني</option>
            <option value="table">جدول</option>
            <option value="summary">ملخص</option>
          </select>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalSales.toLocaleString()}
          </div>
          <div className="text-sm text-blue-600">إجمالي المبيعات (ج.م)</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {summary.totalTarget.toLocaleString()}
          </div>
          <div className="text-sm text-green-600">إجمالي الأهداف (ج.م)</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {summary.totalOrders.toLocaleString()}
          </div>
          <div className="text-sm text-purple-600">عدد الطلبات</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {summary.achievementRate.toFixed(1)}%
          </div>
          <div className="text-sm text-orange-600">معدل الإنجاز</div>
        </div>
      </div>

      {/* مؤشر التقدم الإجمالي */}
      <div className="mb-6">
        <CommonDashboardComponents.ProgressBar 
          title="إجمالي الإنجاز"
          current={summary.totalSales}
          target={summary.totalTarget}
          color={summary.achievementRate >= 100 ? 'bg-green-500' : 
                 summary.achievementRate >= 80 ? 'bg-blue-500' : 
                 summary.achievementRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
        />
      </div>

      {/* المحتوى حسب نوع العرض */}
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
                <div className="text-center">
                  <CommonDashboardComponents.CircularProgress 
                    percentage={summary.achievementRate}
                    color={summary.achievementRate >= 100 ? '#10b981' : 
                           summary.achievementRate >= 80 ? '#3b82f6' : '#ef4444'}
                  />
                  <p className="mt-2 text-sm font-medium">معدل الإنجاز العام</p>
                </div>

                <div className="text-center">
                  <CommonDashboardComponents.CircularProgress 
                    percentage={Math.min((summary.totalOrders / 100) * 100, 100)}
                    color="#8b5cf6"
                  />
                  <p className="mt-2 text-sm font-medium">الطلبات المكتملة</p>
                </div>

                <div className="text-center">
                  <CommonDashboardComponents.CircularProgress 
                    percentage={summary.avgAchievement}
                    color="#f59e0b"
                  />
                  <p className="mt-2 text-sm font-medium">متوسط الأداء</p>
                </div>
              </div>

              {/* التحليل */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">تحليل الأداء:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• إجمالي المبيعات: {summary.totalSales.toLocaleString()} ج.م</p>
                  <p>• معدل الإنجاز: {summary.achievementRate.toFixed(1)}%</p>
                  <p>• متوسط قيمة الطلب: {summary.totalOrders > 0 ? (summary.totalSales / summary.totalOrders).toLocaleString() : 0} ج.م</p>
                  <p>• الحالة العامة: <span className={`font-medium ${
                    summary.achievementRate >= 100 ? 'text-green-600' :
                    summary.achievementRate >= 80 ? 'text-blue-600' :
                    summary.achievementRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {summary.achievementRate >= 100 ? 'ممتاز - تم تجاوز الأهداف' :
                     summary.achievementRate >= 80 ? 'جيد - قريب من الأهداف' :
                     summary.achievementRate >= 60 ? 'مقبول - يحتاج تحسين' : 'ضعيف - دون المستوى المطلوب'}
                  </span></p>
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
        />
      )}
    </div>
  );
};

export default SalesPerformance;