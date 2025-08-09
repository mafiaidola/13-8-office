// Dashboard Wrapper Component - مكون تغليف لوحة التحكم
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';

const DashboardWrapper = ({ 
  children, 
  user, 
  title, 
  showTimeFilter = true, 
  showRefresh = true,
  customActions = [],
  onTimeFilterChange,
  onRefresh,
  loading = false,
  error = null
}) => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // معالج تغيير المرشح الزمني
  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    if (onTimeFilterChange) {
      onTimeFilterChange(newFilter);
    }
  };

  // معالج التحديث
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('خطأ في تحديث البيانات:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // المرشحات المتاحة
  const timeFilters = [
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'quarter', label: 'هذا الربع' },
    { value: 'year', label: 'هذا العام' }
  ];

  // إعداد شريط الأدوات
  const toolbarProps = {
    title: title || 'لوحة التحكم',
    actions: [
      ...customActions,
      ...(showRefresh ? [{
        label: isRefreshing ? 'جاري التحديث...' : 'تحديث البيانات',
        onClick: handleRefresh,
        className: `${isRefreshing ? 'bg-gray-400' : 'bg-blue-600'} text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${isRefreshing ? 'cursor-not-allowed' : ''}`
      }] : [])
    ],
    filters: showTimeFilter ? [{
      value: timeFilter,
      onChange: handleTimeFilterChange,
      options: timeFilters
    }] : []
  };

  if (loading) {
    return (
      <div className="p-6">
        <CommonDashboardComponents.LoadingSpinner 
          size="large" 
          message="جاري تحميل لوحة التحكم..." 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl text-red-500">⚠️</span>
            </div>
            <div className="mr-3">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                خطأ في تحميل لوحة التحكم
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* شريط الأدوات */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <CommonDashboardComponents.Toolbar {...toolbarProps} />
        </div>
      </div>

      {/* محتوى لوحة التحكم */}
      <div className="p-6">
        {/* معلومات المستخدم */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                {(user?.full_name || user?.username || 'مستخدم').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  مرحباً، {user?.full_name || user?.username || 'مستخدم'}
                </h2>
                <p className="text-sm text-gray-600">
                  الدور: {user?.role_display || user?.role || 'غير محدد'} | 
                  آخر تسجيل دخول: {user?.last_login ? 
                    new Date(user.last_login).toLocaleDateString('ar-EG') : 
                    'غير متاح'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
              <span>المرشح الحالي:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                {timeFilters.find(f => f.value === timeFilter)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        {children}
      </div>
    </div>
  );
};

export default DashboardWrapper;