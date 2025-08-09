// Stat Card Component - مكون البطاقة الإحصائية
import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend, 
  onClick, 
  className = '',
  isFinancial = false 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 border-blue-200',
    green: 'from-green-500 to-green-600 border-green-200',
    purple: 'from-purple-500 to-purple-600 border-purple-200',
    orange: 'from-orange-500 to-orange-600 border-orange-200',
    red: 'from-red-500 to-red-600 border-red-200',
    teal: 'from-teal-500 to-teal-600 border-teal-200',
    emerald: 'from-emerald-500 to-emerald-600 border-emerald-200',
    amber: 'from-amber-500 to-amber-600 border-amber-200',
    indigo: 'from-indigo-500 to-indigo-600 border-indigo-200',
    yellow: 'from-yellow-500 to-yellow-600 border-yellow-200',
    gray: 'from-gray-500 to-gray-600 border-gray-200'
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    teal: 'text-teal-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600'
  };

  return (
    <div 
      className={`stat-card bg-white rounded-xl shadow-lg border-2 ${colorClasses[color]} p-6 transition-all duration-300 hover:shadow-xl cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center text-white text-2xl shadow-lg`}>
          {icon}
        </div>
        {isFinancial && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">مالي</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 leading-tight">
          {title}
        </h3>
        
        <div className="text-2xl font-bold text-gray-900 leading-none">
          {value}
        </div>
        
        {trend && (
          <div className={`text-xs ${textColorClasses[color]} font-medium flex items-center gap-1`}>
            <span className="w-1 h-1 bg-current rounded-full"></span>
            {trend}
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color]} opacity-0 hover:opacity-5 transition-opacity duration-300 rounded-xl pointer-events-none`}></div>
    </div>
  );
};

export default StatCard;