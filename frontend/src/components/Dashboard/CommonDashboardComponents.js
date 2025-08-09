// Common Dashboard Components - مكونات لوحة التحكم المشتركة مع التصميم المحسن
import React from 'react';

// شبكة الإحصائيات مع التصميم المحسن
const StatsGrid = ({ stats = [], quickActions = [] }) => {
  return (
    <div className="space-y-6 mb-8">
      {/* الإجراءات السريعة */}
      {quickActions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-blue-600 mr-2">⚡</span>
            الإجراءات السريعة
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`group relative overflow-hidden rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  action.disabled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : `${action.color || 'bg-white hover:bg-blue-50'} text-gray-700 hover:text-blue-700 shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300`
                }`}
              >
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </div>
                {action.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
                {!action.disabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* شبكة الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="group relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-6">
            {/* خلفية متحركة */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            
            <div className="relative z-10 flex items-center">
              <div className={`${stat.color} rounded-xl p-3 mr-4 shadow-sm`}>
                <span className="text-white text-2xl">{stat.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <div className="flex items-center">
                  {stat.trend === 'up' && <span className="text-green-600 text-sm mr-1">↗️</span>}
                  {stat.trend === 'down' && <span className="text-red-600 text-sm mr-1">↘️</span>}
                  <p className="text-sm text-gray-500">{stat.change}</p>
                </div>
              </div>
            </div>

            {/* مؤشر الاتجاه */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-100 to-gray-200">
              <div 
                className={`h-full transition-all duration-300 ${stat.color.replace('bg-', 'bg-').replace('-500', '-400')}`}
                style={{ width: `${Math.random() * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// بطاقة إحصائيات فردية محسنة
const StatCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  color = 'bg-blue-500', 
  trend = 'neutral',
  onClick,
  actions = []
}) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️';

  return (
    <div 
      className={`group relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-6 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`${color} rounded-xl p-3 shadow-sm`}>
            <span className="text-white text-2xl">{icon}</span>
          </div>
          {actions.length > 0 && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-1 space-x-reverse">
                {actions.slice(0, 2).map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    title={action.label}
                  >
                    <span className="text-sm">{action.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          <div className="flex items-center">
            <span className={`text-sm mr-1 ${trendColor}`}>{trendIcon}</span>
            <p className={`text-sm ${trendColor}`}>{change}</p>
          </div>
        </div>
      </div>

      {/* شريط التقدم في الأسفل */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div 
          className={`h-full transition-all duration-500 ${color.replace('bg-', 'bg-').replace('-500', '-300')}`}
          style={{ width: `${trend === 'up' ? '75' : trend === 'down' ? '25' : '50'}%` }}
        ></div>
      </div>
    </div>
  );
};

// شريط التقدم المحسن
const ProgressBar = ({ 
  title, 
  current, 
  target, 
  color = 'bg-blue-500',
  showPercentage = true,
  animated = true 
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <div className="text-sm text-gray-600 space-x-1 space-x-reverse">
          <span className="font-semibold">{current.toLocaleString()}</span>
          <span className="text-gray-400">/</span>
          <span>{target.toLocaleString()}</span>
          {showPercentage && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full mr-2">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 relative ${color} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform skew-x-12 animate-slide-right"></div>
        </div>
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>{percentage >= 100 ? '🎯 تم إنجاز الهدف' : `${(100 - percentage).toFixed(1)}% متبقي`}</span>
        <span>{target.toLocaleString()}</span>
      </div>
    </div>
  );
};

// مؤشر دائري محسن
const CircularProgress = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8, 
  color = '#3b82f6',
  bgColor = '#e5e7eb',
  label,
  showPercentage = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* الخلفية */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* الشريط المتقدم */}
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
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-lg font-bold text-gray-900">{percentage.toFixed(0)}%</span>
        )}
        {label && (
          <span className="text-xs text-gray-600 mt-1 text-center max-w-16">{label}</span>
        )}
      </div>
    </div>
  );
};

// جدول البيانات المحسن
const DataTable = ({ 
  headers, 
  data, 
  actions = [],
  searchable = false,
  sortable = false,
  pagination = false,
  itemsPerPage = 10
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = React.useState(1);

  // تطبيق البحث والفرز
  let processedData = data;
  
  if (searchable && searchTerm) {
    processedData = data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }

  if (sortable && sortConfig.key) {
    processedData = [...processedData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // تطبيق التصفح
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = pagination 
    ? processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : processedData;

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* أدوات الجدول */}
      {(searchable || actions.length > 0) && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            {searchable && (
              <div className="relative max-w-sm">
                <input
                  type="text"
                  placeholder="البحث في الجدول..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            )}
            
            {actions.length > 0 && (
              <div className="flex space-x-2 space-x-reverse">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={action.className || 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className={`px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                  }`}
                  onClick={() => handleSort(Object.keys(data[0] || {})[index])}
                >
                  <div className="flex items-center justify-between">
                    {header}
                    {sortable && (
                      <span className="text-gray-400">
                        {sortConfig.key === Object.keys(data[0] || {})[index] ? 
                          (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕️'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                  {Object.values(row).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cell}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(row, rowIndex)}
                            className={action.className || 'text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors'}
                            title={action.label}
                          >
                            {action.icon || action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length + (actions.length > 0 ? 1 : 0)} 
                    className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">📋</span>
                    <span>لا توجد بيانات لعرضها</span>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        مسح البحث
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* التصفح */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, processedData.length)} 
              من أصل {processedData.length} عنصر
            </span>
            
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              
              <div className="flex space-x-1 space-x-reverse">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// بقية المكونات المحسنة...
const QuickInfoCard = ({ title, subtitle, icon, actionText, onAction, color = 'bg-blue-500' }) => {
  return (
    <div className="group relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`${color} rounded-xl p-3 mr-3 shadow-sm`}>
            <span className="text-white text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        {actionText && (
          <button 
            onClick={onAction}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

// مؤشرات الحالة المحسنة
const StatusIndicator = ({ status, labels = {}, size = 'normal' }) => {
  const statusConfig = {
    active: { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', label: labels.active || 'نشط' },
    inactive: { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', label: labels.inactive || 'غير نشط' },
    pending: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', label: labels.pending || 'قيد المراجعة' },
    error: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', label: labels.error || 'خطأ' },
    warning: { color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', label: labels.warning || 'تحذير' }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const sizeClass = size === 'small' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.textColor} ${config.bgColor} border border-current border-opacity-20`}>
      <span className={`w-2 h-2 rounded-full ${config.color} mr-2 animate-pulse`}></span>
      {config.label}
    </span>
  );
};

// شريط الأدوات المحسن
const Toolbar = ({ title, actions = [], filters = [], onRefresh, quickActions = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {quickActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    action.primary 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* المرشحات */}
          {filters.map((filter, index) => (
            <select
              key={index}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-32"
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
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
              title="تحديث البيانات"
            >
              <span className="mr-2">🔄</span>
              تحديث
            </button>
          )}
          
          {/* الإجراءات الرئيسية */}
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className || 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center'}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// رسالة فارغة محسنة
const EmptyState = ({ 
  icon = '📋', 
  title = 'لا توجد بيانات', 
  description = 'لم يتم العثور على أي بيانات لعرضها', 
  actionText, 
  onAction,
  suggestions = []
}) => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-6xl mb-4 animate-bounce">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      {actionText && (
        <button
          onClick={onAction}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-4"
        >
          {actionText}
        </button>
      )}
      
      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">اقتراحات:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={suggestion.onClick}
                className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// مكون التحميل المحسن
const LoadingSpinner = ({ size = 'medium', message = 'جاري التحميل...', overlay = false }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const Component = (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="relative">
          <div className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
          <div className={`animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 rounded-full border border-blue-400 ${sizeClasses[size]}`}></div>
        </div>
        <p className="text-gray-600 animate-pulse">{message}</p>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          {Component}
        </div>
      </div>
    );
  }

  return Component;
};

// تصدير المكونات المحسنة
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