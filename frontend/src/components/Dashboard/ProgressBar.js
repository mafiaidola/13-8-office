// Progress Bar Component - مكون شريط التقدم
import React from 'react';

const ProgressBar = ({ 
  title, 
  current, 
  target, 
  color = 'blue', 
  isCurrency = false,
  showPercentage = true,
  className = ''
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isCompleted = current >= target;
  
  const formatValue = (value) => {
    if (isCurrency) {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0
      }).format(value);
    }
    return new Intl.NumberFormat('ar-EG').format(value);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        light: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-500',
        light: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200'
      },
      orange: {
        bg: 'bg-orange-500',
        light: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200'
      },
      purple: {
        bg: 'bg-purple-500',
        light: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200'
      },
      red: {
        bg: 'bg-red-500',
        light: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200'
      },
      teal: {
        bg: 'bg-teal-500',
        light: 'bg-teal-100',
        text: 'text-teal-800',
        border: 'border-teal-200'
      }
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`progress-bar-component p-4 bg-white rounded-lg border-2 ${colorClasses.border} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {isCompleted && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            ✅ مكتمل
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${colorClasses.bg} relative`}
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
          
          {/* Completion celebration */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold animate-bounce">🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Values */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-600">الحالي: </span>
            <span className="font-bold text-gray-900">{formatValue(current)}</span>
          </div>
          <div>
            <span className="text-gray-600">الهدف: </span>
            <span className="font-bold text-gray-900">{formatValue(target)}</span>
          </div>
        </div>

        {showPercentage && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses.light} ${colorClasses.text}`}>
            {Math.round(percentage)}%
          </div>
        )}
      </div>

      {/* Progress Status */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {current < target 
              ? `متبقي: ${formatValue(target - current)}` 
              : current > target 
                ? `زيادة: ${formatValue(current - target)}` 
                : 'تم الوصول للهدف'
            }
          </span>
          
          <div className="flex items-center gap-1">
            {percentage >= 100 ? '🎯' : percentage >= 75 ? '🔥' : percentage >= 50 ? '⚡' : '📈'}
            <span className={percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-gray-500'}>
              {percentage >= 100 ? 'ممتاز' : 
               percentage >= 75 ? 'جيد جداً' : 
               percentage >= 50 ? 'جيد' : 'يحتاج تحسين'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;