// Common Dashboard Components - مكونات لوحة التحكم المشتركة
import React from 'react';

// شبكة الإحصائيات
const StatsGrid = ({ stats = [] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3 mr-4`}>
              <span className="text-white text-2xl">{stat.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// بطاقة إحصائيات فردية
const StatCard = ({ title, value, icon, change, color = 'bg-blue-500', trend = 'neutral' }) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️';

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3 mr-4`}>
          <span className="text-white text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-1">
            <span className={`text-sm ${trendColor}`}>{trendIcon}</span>
            <p className={`text-sm ${trendColor} mr-1`}>{change}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// شريط التقدم
const ProgressBar = ({ title, current, target, color = 'bg-blue-500' }) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-sm text-gray-500">
          {current.toLocaleString()} / {target.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600 mt-1">
        {percentage.toFixed(1)}% مكتمل
      </div>
    </div>
  );
};

// مؤشر دائري للتقدم
const CircularProgress = ({ percentage, size = 80, strokeWidth = 8, color = '#3b82f6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// جدول البيانات
const DataTable = ({ headers, data, actions = [] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(row, rowIndex)}
                        className={`${action.className || 'text-blue-600 hover:text-blue-900'} mr-2`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length + (actions.length > 0 ? 1 : 0)} 
                  className="px-6 py-4 text-center text-gray-500">
                لا توجد بيانات لعرضها
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// بطاقة معلومات سريعة
const QuickInfoCard = ({ title, subtitle, icon, actionText, onAction }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-3xl mr-3">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        {actionText && (
          <button 
            onClick={onAction}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

// مؤشرات الحالة
const StatusIndicator = ({ status, labels = {} }) => {
  const statusConfig = {
    active: { color: 'bg-green-500', label: labels.active || 'نشط' },
    inactive: { color: 'bg-gray-500', label: labels.inactive || 'غير نشط' },
    pending: { color: 'bg-yellow-500', label: labels.pending || 'قيد المراجعة' },
    error: { color: 'bg-red-500', label: labels.error || 'خطأ' },
    warning: { color: 'bg-orange-500', label: labels.warning || 'تحذير' }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span className="inline-flex items-center">
      <span className={`w-2 h-2 rounded-full ${config.color} mr-2`}></span>
      <span className="text-sm font-medium">{config.label}</span>
    </span>
  );
};

// شريط الأدوات
const Toolbar = ({ title, actions = [], filters = [], onRefresh }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* المرشحات */}
        {filters.map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
        
        {/* زر التحديث */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            title="تحديث البيانات"
          >
            🔄
          </button>
        )}
        
        {/* الإجراءات */}
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={action.className || 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// رسالة فارغة
const EmptyState = ({ icon = '📋', title = 'لا توجد بيانات', description = 'لم يتم العثور على أي بيانات لعرضها', actionText, onAction }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionText && (
        <button
          onClick={onAction}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// مكون التحميل
const LoadingSpinner = ({ size = 'medium', message = 'جاري التحميل...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// تصدير المكونات
const CommonDashboardComponents = {
  StatsGrid,
  StatCard,
  ProgressBar,
  CircularProgress,
  DataTable,
  QuickInfoCard,
  StatusIndicator,
  Toolbar,
  EmptyState,
  LoadingSpinner
};

export default CommonDashboardComponents;