// Line Charts Component - مكون الرسوم البيانية الخطية
import React, { useState, useEffect } from 'react';
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
  chartType = 'line' // line, area, bar
}) => {
  const [chartData, setChartData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewMode, setViewMode] = useState('chart'); // chart, data

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
        color: item.color || colors[index % colors.length]
      }));
    }

    // إذا كانت البيانات مصفوفة من الأرقام
    if (typeof rawData[0] === 'number') {
      return rawData.map((value, index) => ({
        x: `نقطة ${index + 1}`,
        y: value,
        label: `القيمة: ${value}`,
        color: colors[index % colors.length]
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
    setHoveredPoint({ item, index });
  };

  // معالج إزالة التمرير
  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  // الرسم البياني
  const Chart = () => {
    if (chartData.length === 0) {
      return (
        <CommonDashboardComponents.EmptyState
          icon="📊"
          title="لا توجد بيانات"
          description="لا توجد بيانات كافية لعرض الرسم البياني"
        />
      );
    }

    return (
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox="0 0 100 100"
          className="overflow-visible"
          preserveAspectRatio="none"
        >
          {/* الشبكة */}
          {showGrid && (
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
          )}
          {showGrid && (
            <rect width="100" height="100" fill="url(#grid)" />
          )}

          {/* منطقة مملوءة (للرسم البياني المساحي) */}
          {chartType === 'area' && (
            <path
              d={createAreaPath()}
              fill={colors[0]}
              fillOpacity="0.2"
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
                fill={colors[index % colors.length]}
                opacity="0.8"
                onMouseEnter={() => handlePointHover(item, index)}
                onMouseLeave={handlePointLeave}
              />
            );
          })}

          {/* النقاط */}
          {showPoints && (chartType === 'line' || chartType === 'area') && chartData.map((item, index) => {
            const point = getPoint(item, index);
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={item.color || colors[0]}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-4 transition-all"
                onMouseEnter={() => handlePointHover(item, index)}
                onMouseLeave={handlePointLeave}
              />
            );
          })}
        </svg>

        {/* تسميات المحاور */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {chartData.map((item, index) => (
            <span key={index} className="text-center" style={{ 
              width: `${100/chartData.length}%`,
              fontSize: chartData.length > 10 ? '10px' : '12px'
            }}>
              {item.x}
            </span>
          ))}
        </div>

        {/* tooltip عند التمرير */}
        {hoveredPoint && (
          <div className="absolute bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10"
               style={{
                 left: `${(hoveredPoint.index / Math.max(chartData.length - 1, 1)) * 100}%`,
                 top: '10px',
                 transform: 'translateX(-50%)'
               }}>
            <div className="font-medium">{hoveredPoint.item.x}</div>
            <div>القيمة: {hoveredPoint.item.y.toLocaleString()}</div>
            {hoveredPoint.item.label && (
              <div className="text-xs text-gray-300">{hoveredPoint.item.label}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // جدول البيانات
  const DataTable = () => {
    const headers = [xAxisLabel, yAxisLabel, 'الوصف'];
    const tableData = chartData.map(item => ({
      x: item.x,
      y: item.y.toLocaleString(),
      label: item.label || '-'
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="line">خطي</option>
            <option value="area">مساحي</option>
            <option value="bar">عمودي</option>
          </select>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="chart">رسم بياني</option>
            <option value="data">جدول البيانات</option>
          </select>
        </div>
      </div>

      {/* المحتوى */}
      {viewMode === 'chart' ? <Chart /> : <DataTable />}

      {/* الإحصائيات السريعة */}
      {chartData.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {chartData.length}
            </div>
            <div className="text-xs text-gray-500">نقاط البيانات</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.max(...chartData.map(item => item.y)).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">أعلى قيمة</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {Math.min(...chartData.map(item => item.y)).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">أقل قيمة</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {Math.round(chartData.reduce((sum, item) => sum + item.y, 0) / chartData.length).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">المتوسط</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineCharts;