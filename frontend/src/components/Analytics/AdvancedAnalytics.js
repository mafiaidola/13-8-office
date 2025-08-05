// Advanced Analytics Component - نظام التحليلات المتقدمة
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const AdvancedAnalytics = ({ language = 'ar' }) => {
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('this_month');
  const [performanceDashboard, setPerformanceDashboard] = useState({});
  const [salesAnalytics, setSalesAnalytics] = useState({});
  const [visitAnalytics, setVisitAnalytics] = useState({});
  const [charts, setCharts] = useState({});
  const [realTimeMetrics, setRealTimeMetrics] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Get backend URL from environment
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Colors for charts
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Load performance dashboard
  const loadPerformanceDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/analytics/performance?time_range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPerformanceDashboard(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error loading performance dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, backendUrl]);

  // Load sales analytics
  const loadSalesAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/analytics/sales?time_range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSalesAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error loading sales analytics:', error);
    }
  }, [timeRange, backendUrl]);

  // Load visit analytics
  const loadVisitAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/analytics/visits?time_range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setVisitAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error loading visit analytics:', error);
    }
  }, [timeRange, backendUrl]);

  // Load chart data
  const loadCharts = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Load multiple charts
      const chartPromises = [
        axios.post(`${backendUrl}/api/analytics/charts/sales-by-product?time_range=${timeRange}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post(`${backendUrl}/api/analytics/charts/visits-by-hour?time_range=${timeRange}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ];

      const results = await Promise.allSettled(chartPromises);
      
      const newCharts = {};
      if (results[0].status === 'fulfilled' && results[0].value.data.success) {
        newCharts.salesByProduct = results[0].value.data.chart;
      }
      if (results[1].status === 'fulfilled' && results[1].value.data.success) {
        newCharts.visitsByHour = results[1].value.data.chart;
      }
      
      setCharts(newCharts);
    } catch (error) {
      console.error('Error loading charts:', error);
    }
  }, [timeRange, backendUrl]);

  // Load real-time metrics
  const loadRealTimeMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/analytics/real-time`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRealTimeMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    }
  }, [backendUrl]);

  // Initialize
  useEffect(() => {
    loadPerformanceDashboard();
    loadSalesAnalytics();
    loadVisitAnalytics();
    loadCharts();
    loadRealTimeMetrics();
  }, [loadPerformanceDashboard, loadSalesAnalytics, loadVisitAnalytics, loadCharts, loadRealTimeMetrics]);

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US').format(num || 0);
  };

  // Format percentage
  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  // Get metric color based on trend
  const getMetricColor = (trend) => {
    const colors = {
      up: 'text-green-600',
      down: 'text-red-600',
      stable: 'text-blue-600'
    };
    return colors[trend] || colors.stable;
  };

  // Get metric icon based on trend
  const getMetricIcon = (trend) => {
    const icons = {
      up: '📈',
      down: '📉',
      stable: '➡️'
    };
    return icons[trend] || icons.stable;
  };

  // Export to PDF
  const exportToPDF = async (elementId, filename) => {
    try {
      setExportLoading(true);
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
      
      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = (data, filename) => {
    try {
      setExportLoading(true);
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics Data');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      console.log('✅ Excel exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Render interactive pie chart (Recharts)
  const renderPieChart = (chartData, title) => {
    if (!chartData || !chartData.series || chartData.series.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
        </div>
      );
    }

    const data = chartData.series[0].data.slice(0, 8).map((item, index) => ({
      name: item.x || item.label,
      value: item.y,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-4 text-center">{title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100)}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render interactive bar chart (Recharts)
  const renderBarChart = (chartData, title) => {
    if (!chartData || !chartData.series || chartData.series.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
        </div>
      );
    }

    const data = chartData.series[0].data.slice(0, 12).map((item) => ({
      name: item.x || item.label,
      value: item.y
    }));

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-4 text-center">{title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={12}
            />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render line chart for performance metrics
  const renderPerformanceChart = (metrics) => {
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const data = metrics.map((metric, index) => ({
      name: metric.name,
      value: metric.value,
      target: metric.target || metric.value * 1.2,
      index: index
    }));

    return (
      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-4 text-center">
          {language === 'ar' ? 'مؤشرات الأداء' : 'Performance Indicators'}
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name={language === 'ar' ? 'القيمة الحالية' : 'Current Value'} />
            <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name={language === 'ar' ? 'الهدف' : 'Target'} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" id="analytics-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'ar' ? '📊 التحليلات المتقدمة' : '📊 Advanced Analytics'}
        </h1>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {language === 'ar' ? 'الفترة الزمنية:' : 'Time Range:'}
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">{language === 'ar' ? 'اليوم' : 'Today'}</option>
              <option value="yesterday">{language === 'ar' ? 'أمس' : 'Yesterday'}</option>
              <option value="this_week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
              <option value="last_week">{language === 'ar' ? 'الأسبوع الماضي' : 'Last Week'}</option>
              <option value="this_month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
              <option value="last_month">{language === 'ar' ? 'الشهر الماضي' : 'Last Month'}</option>
              <option value="this_year">{language === 'ar' ? 'هذا العام' : 'This Year'}</option>
            </select>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToPDF('analytics-dashboard', `analytics-report-${timeRange}`)}
              disabled={exportLoading}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
            >
              📄 {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
            </button>
            
            <button
              onClick={() => {
                const exportData = [
                  ...Object.values(salesAnalytics.top_products || []),
                  ...Object.values(visitAnalytics.rep_performance || [])
                ];
                exportToExcel(exportData, `analytics-data-${timeRange}`);
              }}
              disabled={exportLoading}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
            >
              📊 {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
            </button>
            
            <button
              onClick={() => {
                loadPerformanceDashboard();
                loadSalesAnalytics();
                loadVisitAnalytics();
                loadCharts();
                loadRealTimeMetrics();
              }}
              disabled={loading}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
            >
              🔄 {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Bar */}
      {realTimeMetrics.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {language === 'ar' ? '📡 المقاييس الفورية' : '📡 Real-time Metrics'}
            </h3>
            <div className="flex items-center gap-6">
              {realTimeMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg font-bold">{formatNumber(metric.value)}</div>
                  <div className="text-xs opacity-80">{metric.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'performance', name: language === 'ar' ? 'لوحة الأداء' : 'Performance', icon: '🎯' },
            { id: 'sales', name: language === 'ar' ? 'تحليل المبيعات' : 'Sales Analytics', icon: '💰' },
            { id: 'visits', name: language === 'ar' ? 'تحليل الزيارات' : 'Visit Analytics', icon: '🚗' },
            { id: 'charts', name: language === 'ar' ? 'الرسوم البيانية' : 'Charts', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </span>
        </div>
      )}

      {/* Performance Dashboard Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {performanceDashboard.title || (language === 'ar' ? 'لوحة الأداء' : 'Performance Dashboard')}
            </h2>
            
            {performanceDashboard.metrics && performanceDashboard.metrics.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {performanceDashboard.metrics.map((metric, index) => (
                    <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
                        <span className="text-lg">{getMetricIcon(metric.trend)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline">
                          <span className={`text-2xl font-bold ${getMetricColor(metric.trend)}`}>
                            {formatNumber(metric.value)}
                          </span>
                          {metric.unit && (
                            <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
                          )}
                        </div>
                        
                        {metric.target && (
                          <div className="text-xs text-gray-500">
                            {language === 'ar' ? 'الهدف:' : 'Target:'} {formatNumber(metric.target)} {metric.unit}
                          </div>
                        )}
                        
                        {metric.change_percentage && (
                          <div className={`text-xs ${getMetricColor(metric.trend)}`}>
                            {metric.change_percentage > 0 ? '+' : ''}{formatPercentage(metric.change_percentage)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Performance Chart */}
                {renderPerformanceChart(performanceDashboard.metrics)}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {language === 'ar' ? 'لا توجد مقاييس متاحة' : 'No metrics available'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales Analytics Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(salesAnalytics.total_sales)} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </p>
                  {salesAnalytics.sales_growth && (
                    <p className={`text-sm ${salesAnalytics.sales_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesAnalytics.sales_growth >= 0 ? '📈' : '📉'} {formatPercentage(salesAnalytics.sales_growth)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(salesAnalytics.total_orders)}
                  </p>
                  {salesAnalytics.order_growth && (
                    <p className={`text-sm ${salesAnalytics.order_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesAnalytics.order_growth >= 0 ? '📈' : '📉'} {formatPercentage(salesAnalytics.order_growth)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg Order Value'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(salesAnalytics.average_order_value)} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'معدل التحويل' : 'Conversion Rate'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatPercentage(salesAnalytics.conversion_rate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            {salesAnalytics.top_products && salesAnalytics.top_products.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? '🏆 أفضل المنتجات' : '🏆 Top Products'}
                </h3>
                <div className="space-y-3">
                  {salesAnalytics.top_products.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-sm text-gray-500">
                            {language === 'ar' ? 'الكمية:' : 'Qty:'} {formatNumber(product.quantity)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatNumber(product.total_sales)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Clients */}
            {salesAnalytics.top_clients && salesAnalytics.top_clients.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? '🏆 أفضل العملاء' : '🏆 Top Clients'}
                </h3>
                <div className="space-y-3">
                  {salesAnalytics.top_clients.slice(0, 5).map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{client.clinic_name}</p>
                          <p className="text-sm text-gray-500">
                            {formatNumber(client.order_count)} {language === 'ar' ? 'طلب' : 'orders'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatNumber(client.total_sales)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Reps */}
            {salesAnalytics.top_reps && salesAnalytics.top_reps.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? '🏆 أفضل المندوبين' : '🏆 Top Reps'}
                </h3>
                <div className="space-y-3">
                  {salesAnalytics.top_reps.slice(0, 5).map((rep, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{rep.rep_name}</p>
                          <p className="text-sm text-gray-500">
                            {formatNumber(rep.order_count)} {language === 'ar' ? 'طلب' : 'orders'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatNumber(rep.total_sales)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sales Chart */}
          {salesAnalytics.top_products && salesAnalytics.top_products.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? '📊 توزيع المبيعات حسب المنتج' : '📊 Sales Distribution by Product'}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={salesAnalytics.top_products.slice(0, 8).map((product, index) => ({
                          name: product.product_name,
                          value: product.total_sales,
                          fill: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {salesAnalytics.top_products.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatNumber(value)} ${language === 'ar' ? 'ج.م' : 'EGP'}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? '🏢 أداء العملاء' : '🏢 Client Performance'}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesAnalytics.top_clients?.slice(0, 6) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="clinic_name" fontSize={10} />
                      <YAxis />
                      <Tooltip formatter={(value) => `${formatNumber(value)} ${language === 'ar' ? 'ج.م' : 'EGP'}`} />
                      <Bar dataKey="total_sales" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visit Analytics Tab */}
      {activeTab === 'visits' && (
        <div className="space-y-6">
          {/* Visit Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🚗</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(visitAnalytics.total_visits)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'الزيارات الناجحة' : 'Successful Visits'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(visitAnalytics.successful_visits)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatPercentage(visitAnalytics.success_rate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'متوسط زيارات/مندوب' : 'Avg Visits/Rep'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(visitAnalytics.average_visits_per_rep)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Charts */}
          {visitAnalytics.visits_by_hour && visitAnalytics.visits_by_hour.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? '⏰ توزيع الزيارات حسب الساعة' : '⏰ Visits Distribution by Hour'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={visitAnalytics.visits_by_hour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Rep Performance */}
          {visitAnalytics.rep_performance && visitAnalytics.rep_performance.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? '👥 أداء المندوبين' : '👥 Rep Performance'}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-600">
                        {language === 'ar' ? 'المندوب' : 'Rep'}
                      </th>
                      <th className="text-center py-2 font-medium text-gray-600">
                        {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                      </th>
                      <th className="text-center py-2 font-medium text-gray-600">
                        {language === 'ar' ? 'الزيارات الناجحة' : 'Successful'}
                      </th>
                      <th className="text-center py-2 font-medium text-gray-600">
                        {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitAnalytics.rep_performance.slice(0, 10).map((rep, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            {rep.rep_name}
                          </div>
                        </td>
                        <td className="text-center py-3">{formatNumber(rep.total_visits)}</td>
                        <td className="text-center py-3">{formatNumber(rep.successful_visits)}</td>
                        <td className="text-center py-3">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            rep.success_rate >= 75 ? 'bg-green-100 text-green-800' :
                            rep.success_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {formatPercentage(rep.success_rate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Product Chart */}
            {charts.salesByProduct && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                {renderPieChart(charts.salesByProduct, charts.salesByProduct.title)}
              </div>
            )}

            {/* Visits by Hour Chart */}
            {charts.visitsByHour && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                {renderBarChart(charts.visitsByHour, charts.visitsByHour.title)}
              </div>
            )}
          </div>

          {/* Chart Controls */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'ar' ? '⚙️ خيارات الرسوم البيانية' : '⚙️ Chart Options'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={loadCharts}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {language === 'ar' ? '🔄 تحديث الرسوم البيانية' : '🔄 Refresh Charts'}
              </button>
              <button 
                onClick={() => exportToPDF('analytics-dashboard', 'charts-report')}
                disabled={exportLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {language === 'ar' ? '📄 تصدير كـ PDF' : '📄 Export as PDF'}
              </button>
              <button 
                onClick={() => {
                  const chartData = Object.values(charts).map(chart => ({
                    title: chart.title,
                    data: chart.series?.[0]?.data || []
                  }));
                  exportToExcel(chartData, 'charts-data');
                }}
                disabled={exportLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {language === 'ar' ? '📊 تصدير كـ Excel' : '📊 Export as Excel'}
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {language === 'ar' ? '🖨️ طباعة' : '🖨️ Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Loading Overlay */}
      {exportLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>{language === 'ar' ? 'جاري التصدير...' : 'Exporting...'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;