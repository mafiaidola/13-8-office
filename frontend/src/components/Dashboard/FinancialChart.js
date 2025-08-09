// Financial Chart Component - مكون الرسوم البيانية المالية
import React from 'react';

const FinancialChart = ({ 
  data = [], 
  type = 'bar', 
  title = 'الرسم البياني المالي',
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`financial-chart bg-white rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500 text-lg">لا توجد بيانات للعرض</p>
          <p className="text-gray-400 text-sm mt-2">ستظهر البيانات المالية هنا عند توفرها</p>
        </div>
      </div>
    );
  }

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(item => item.value || 0));
    
    return (
      <div className="bar-chart space-y-4">
        {data.map((item, index) => (
          <div key={index} className="chart-item">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {item.label || `عنصر ${index + 1}`}
              </span>
              <span className="text-sm text-gray-600">
                {formatCurrency(item.value || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${((item.value || 0) / maxValue) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLineChart = () => {
    return (
      <div className="line-chart">
        <div className="flex items-end justify-between h-48 border-b border-l border-gray-300">
          {data.map((item, index) => {
            const maxValue = Math.max(...data.map(d => d.value || 0));
            const height = ((item.value || 0) / maxValue) * 180;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative flex-1 flex items-end">
                  <div 
                    className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: `${height}px` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {item.label || `${index + 1}`}
                </div>
                <div className="text-xs font-medium text-gray-800">
                  {formatCurrency(item.value || 0, true)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    return (
      <div className="pie-chart">
        <div className="grid grid-cols-2 gap-6">
          {/* Legend */}
          <div className="space-y-3">
            {data.map((item, index) => {
              const percentage = total > 0 ? ((item.value || 0) / total * 100) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getColorByIndex(index) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.label || `عنصر ${index + 1}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.value || 0, true)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(percentage)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Visual representation */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                  {formatCurrency(total, true)}
                </div>
                <div className="text-xs text-gray-600">الإجمالي</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount, abbreviated = false) => {
    if (abbreviated && amount >= 1000) {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}م ج.م`;
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}ك ج.م`;
      }
    }
    
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: abbreviated ? 0 : 2
    }).format(amount);
  };

  const getColorByIndex = (index) => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#8B5CF6', // purple
      '#F59E0B', // orange
      '#EF4444', // red
      '#14B8A6', // teal
      '#6366F1', // indigo
      '#F97316', // amber
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={`financial-chart bg-white rounded-lg p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">مباشر</span>
        </div>
      </div>
      
      <div className="chart-container">
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
      
      {/* Summary Stats */}
      {data.length > 1 && (
        <div className="chart-summary mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(Math.max(...data.map(d => d.value || 0)), true)}
              </div>
              <div className="text-xs text-gray-600">أعلى قيمة</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(data.reduce((sum, d) => sum + (d.value || 0), 0) / data.length, true)}
              </div>
              <div className="text-xs text-gray-600">المتوسط</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(data.reduce((sum, d) => sum + (d.value || 0), 0), true)}
              </div>
              <div className="text-xs text-gray-600">الإجمالي</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialChart;