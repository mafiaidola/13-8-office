// Line Charts Component - مكون الرسوم البيانية الخطية المحسن
import React, { useState, useEffect, useRef } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';

const LineCharts = ({ 
  data = [], 
  title = 'اتجاهات البيانات',
  xAxisLabel = 'الفترة الزمنية',
  yAxisLabel = 'القيمة',
  showGrid = true,
  showPoints = true,
  height = 300,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  chartType: initialChartType = 'line', // line, area, bar
  interactive = true,
  onDataPointClick
}) => {
  const [chartData, setChartData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewMode, setViewMode] = useState('chart'); // chart, data
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [chartType, setChartType] = useState(initialChartType);
  const chartRef = useRef(null);

  // معالجة البيانات
  useEffect(() => {
    if (data && data.length > 0) {
      const processed = processChartData(data);
      setChartData(processed);
    }
  }, [data]);

  // معالجة بيانات الرسم البياني
  const processChartData = (rawData) => {
    // التأكد من أن البيانات في الشكل المطلوب
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    // إذا كانت البيانات مصفوفة من الكائنات
    if (typeof rawData[0] === 'object') {
      return rawData.map((item, index) => ({
        x: item.x || item.date || item.period || item.label || `نقطة ${index + 1}`,
        y: item.y || item.value || item.amount || item.count || 0,
        label: item.label || item.description || '',
        color: item.color || colors[index % colors.length],
        category: item.category || 'default'
      }));
    }

    // إذا كانت البيانات مصفوفة من الأرقام
    if (typeof rawData[0] === 'number') {
      return rawData.map((value, index) => ({
        x: `نقطة ${index + 1}`,
        y: value,
        label: `القيمة: ${value}`,
        color: colors[index % colors.length],
        category: 'default'
      }));
    }

    return [];
  };

  // حساب حدود الرسم البياني
  const getChartBounds = () => {
    if (chartData.length === 0) return { minY: 0, maxY: 100, minX: 0, maxX: 10 };

    const yValues = chartData.map(item => item.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    // إضافة هامش للرسم البياني
    const yRange = maxY - minY;
    const yPadding = yRange * 0.1;

    return {
      minY: Math.max(0, minY - yPadding),
      maxY: maxY + yPadding,
      minX: 0,
      maxX: chartData.length - 1
    };
  };

  const bounds = getChartBounds();

  // تحويل القيم إلى إحداثيات SVG
  const getPoint = (item, index) => {
    const x = (index / Math.max(chartData.length - 1, 1)) * 100;
    const y = 100 - ((item.y - bounds.minY) / (bounds.maxY - bounds.minY)) * 100;
    return { x, y };
  };

  // إنشاء مسار الخط
  const createPath = () => {
    if (chartData.length === 0) return '';

    let path = '';
    chartData.forEach((item, index) => {
      const point = getPoint(item, index);
      if (index === 0) {
        path += `M ${point.x} ${point.y}`;
      } else {
        path += ` L ${point.x} ${point.y}`;
      }
    });

    return path;
  };

  // إنشاء مسار المنطقة المملوءة
  const createAreaPath = () => {
    if (chartData.length === 0) return '';

    const linePath = createPath();
    const firstPoint = getPoint(chartData[0], 0);
    const lastPoint = getPoint(chartData[chartData.length - 1], chartData.length - 1);
    
    return `${linePath} L ${lastPoint.x} 100 L ${firstPoint.x} 100 Z`;
  };

  // معالج التمرير فوق النقطة
  const handlePointHover = (item, index) => {
    if (interactive) {
      setHoveredPoint({ item, index });
    }
  };

  // معالج إزالة التمرير
  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  // معالج النقر على النقطة
  const handlePointClick = (item, index) => {
    if (onDataPointClick) {
      onDataPointClick(item, index);
    }
  };

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'تصدير PNG',
      icon: '🖼️',
      onClick: () => {
        const svg = chartRef.current;
        if (svg) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const data = new XMLSerializer().serializeToString(svg);
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            link.download = `chart_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
        }
      },
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: 'تصدير CSV',
      icon: '📄',
      onClick: () => {
        const csvContent = chartData.map(item => 
          `"${item.x}","${item.y}","${item.label}"`
        ).join('\n');
        const blob = new Blob([`"${xAxisLabel}","${yAxisLabel}","الوصف"\n${csvContent}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      },
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: 'ملء الشاشة',
      icon: '🔍',
      onClick: () => {
        if (chartRef.current) {
          chartRef.current.requestFullscreen?.();
        }
      },
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      label: 'إعادة تعيين',
      icon: '🔄',
      onClick: () => {
        setHoveredPoint(null);
        setSelectedSeries([]);
        setViewMode('chart');
      },
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
    }
  ];

  // الرسم البياني المحسن
  const Chart = () => {
    if (chartData.length === 0) {
      return (
        <CommonDashboardComponents.EmptyState
          icon="📊"
          title="لا توجد بيانات"
          description="لا توجد بيانات كافية لعرض الرسم البياني"
          suggestions={[
            {
              label: 'إضافة بيانات تجريبية',
              onClick: () => console.log('إضافة بيانات تجريبية')
            }
          ]}
        />
      );
    }

    return (
      <div className="relative bg-white rounded-lg p-4">
        <svg
          ref={chartRef}
          width="100%"
          height={height}
          viewBox="0 0 100 100"
          className="overflow-visible border border-gray-100 rounded-lg"
          preserveAspectRatio="none"
        >
          {/* الخلفية المتدرجة */}
          <defs>
            <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="1"/>
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1"/>
            </linearGradient>
            
            {/* الشبكة */}
            {showGrid && (
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.5"/>
              </pattern>
            )}

            {/* تدرجات للرسم البياني */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={colors[0]} stopOpacity="0.1"/>
            </linearGradient>
          </defs>

          {/* الخلفية */}
          <rect width="100" height="100" fill="url(#backgroundGradient)" />
          
          {/* الشبكة */}
          {showGrid && (
            <rect width="100" height="100" fill="url(#grid)" />
          )}

          {/* منطقة مملوءة (للرسم البياني المساحي) */}
          {chartType === 'area' && (
            <path
              d={createAreaPath()}
              fill="url(#areaGradient)"
              stroke="none"
            />
          )}

          {/* الخط الرئيسي */}
          {(chartType === 'line' || chartType === 'area') && (
            <path
              d={createPath()}
              fill="none"
              stroke={colors[0]}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
          )}

          {/* الأعمدة (للرسم البياني العمودي) */}
          {chartType === 'bar' && chartData.map((item, index) => {
            const point = getPoint(item, index);
            const barWidth = 80 / chartData.length;
            return (
              <rect
                key={index}
                x={point.x - barWidth/2}
                y={point.y}
                width={barWidth}
                height={100 - point.y}
                fill={`url(#barGradient-${index})`}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onMouseEnter={() => handlePointHover(item, index)}
                onMouseLeave={handlePointLeave}
                onClick={() => handlePointClick(item, index)}
              />
            );
          })}

          {/* النقاط */}
          {showPoints && (chartType === 'line' || chartType === 'area') && chartData.map((item, index) => {
            const point = getPoint(item, index);
            const isHovered = hoveredPoint?.index === index;
            return (
              <g key={index}>
                {/* دائرة الخلفية */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? "5" : "3"}
                  fill="white"
                  stroke={item.color || colors[0]}
                  strokeWidth="2"
                  className={`transition-all cursor-pointer drop-shadow-sm ${
                    interactive ? 'hover:r-6' : ''
                  }`}
                  onMouseEnter={() => handlePointHover(item, index)}
                  onMouseLeave={handlePointLeave}
                  onClick={() => handlePointClick(item, index)}
                />
                
                {/* نقطة داخلية */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? "2" : "1"}
                  fill={item.color || colors[0]}
                  className="pointer-events-none"
                />
              </g>
            );
          })}
        </svg>

        {/* تسميات المحاور المحسنة */}
        <div className="flex justify-between mt-4 px-2 text-xs text-gray-600">
          {chartData.map((item, index) => (
            <span 
              key={index} 
              className={`text-center transition-colors ${
                hoveredPoint?.index === index ? 'text-blue-600 font-medium' : ''
              }`}
              style={{ 
                width: `${100/chartData.length}%`,
                fontSize: chartData.length > 10 ? '10px' : '12px'
              }}
            >
              {item.x}
            </span>
          ))}
        </div>

        {/* tooltip محسن عند التمرير */}
        {hoveredPoint && (
          <div 
            className="absolute bg-gray-900 text-white px-4 py-3 rounded-lg text-sm shadow-xl pointer-events-none z-20 transform -translate-x-1/2 transition-all duration-200"
            style={{
              left: `${(hoveredPoint.index / Math.max(chartData.length - 1, 1)) * 100}%`,
              top: '-10px'
            }}
          >
            <div className="font-semibold">{hoveredPoint.item.x}</div>
            <div className="text-blue-300">
              {yAxisLabel}: {hoveredPoint.item.y.toLocaleString()}
            </div>
            {hoveredPoint.item.label && (
              <div className="text-gray-300 text-xs mt-1">
                {hoveredPoint.item.label}
              </div>
            )}
            {/* سهم صغير */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  // جدول البيانات المحسن
  const DataTable = () => {
    const headers = [xAxisLabel, yAxisLabel, 'الوصف', 'الفئة'];
    const tableData = chartData.map(item => ({
      x: item.x,
      y: item.y.toLocaleString(),
      label: item.label || '-',
      category: item.category || '-'
    }));

    return (
      <CommonDashboardComponents.DataTable 
        headers={headers}
        data={tableData}
        searchable={true}
        sortable={true}
        pagination={true}
        itemsPerPage={10}
        actions={[
          {
            label: 'تمييز',
            icon: '📍',
            onClick: (row, index) => {
              setHoveredPoint({ item: chartData[index], index });
              setViewMode('chart');
            },
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
                <span className="text-purple-600 mr-2 text-2xl">📈</span>
                {title}
              </h3>
              <p className="text-base font-medium text-gray-700 mt-1">
                رسم بياني تفاعلي مع {chartData.length} نقطة بيانات
              </p>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="line">📈 خطي</option>
                <option value="area">📊 مساحي</option>
                <option value="bar">📊 عمودي</option>
              </select>

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="chart">📊 رسم بياني</option>
                <option value="data">📋 جدول البيانات</option>
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

      {/* المحتوى */}
      <div className="p-6">
        {viewMode === 'chart' ? <Chart /> : <DataTable />}
      </div>

      {/* الإحصائيات السريعة المحسنة */}
      {chartData.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-black text-blue-700 flex items-center justify-center mb-2">
                <span className="mr-2 text-2xl">📊</span>
                {chartData.length}
              </div>
              <div className="font-bold text-gray-900">نقاط البيانات</div>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-black text-green-700 flex items-center justify-center mb-2">
                <span className="mr-2 text-2xl">📈</span>
                {Math.max(...chartData.map(item => item.y)).toLocaleString()}
              </div>
              <div className="font-bold text-gray-900">أعلى قيمة</div>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-black text-orange-700 flex items-center justify-center mb-2">
                <span className="mr-2 text-2xl">📉</span>
                {Math.min(...chartData.map(item => item.y)).toLocaleString()}
              </div>
              <div className="font-bold text-gray-900">أقل قيمة</div>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-black text-purple-700 flex items-center justify-center mb-2">
                <span className="mr-2 text-2xl">📊</span>
                {Math.round(chartData.reduce((sum, item) => sum + item.y, 0) / chartData.length).toLocaleString()}
              </div>
              <div className="font-bold text-gray-900">المتوسط</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineCharts;