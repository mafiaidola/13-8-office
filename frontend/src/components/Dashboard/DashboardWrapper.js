// Dashboard Wrapper Component - مكون تغليف لوحة التحكم المحسن
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';

const DashboardWrapper = ({ 
  children, 
  user, 
  title, 
  showTimeFilter = true, 
  showRefresh = true,
  customActions = [],
  quickActions = [],
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

  // الإجراءات السريعة الافتراضية
  const defaultQuickActions = [
    {
      label: 'إضافة جديد',
      icon: '➕',
      onClick: () => console.log('إضافة جديد'),
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      label: 'تصدير البيانات',
      icon: '📊',
      onClick: () => console.log('تصدير البيانات'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      label: 'الإعدادات',
      icon: '⚙️',
      onClick: () => console.log('الإعدادات'),
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  // إعداد شريط الأدوات
  const toolbarProps = {
    title: title || 'لوحة التحكم',
    actions: [
      ...customActions,
      ...(showRefresh ? [{
        label: isRefreshing ? 'جاري التحديث...' : 'تحديث البيانات',
        icon: isRefreshing ? '⏳' : '🔄',
        onClick: handleRefresh,
        disabled: isRefreshing,
        className: `${isRefreshing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg transition-colors ${isRefreshing ? 'cursor-not-allowed' : ''}`
      }] : [])
    ],
    filters: showTimeFilter ? [{
      value: timeFilter,
      onChange: handleTimeFilterChange,
      options: timeFilters
    }] : [],
    quickActions: [...defaultQuickActions, ...quickActions]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative z-10 p-6">
          <CommonDashboardComponents.LoadingSpinner 
            size="large" 
            message="جاري تحميل لوحة التحكم..." 
          />
        </div>
        {/* خلفية متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">⚠️</div>
              <h3 className="text-xl font-bold text-red-800 mb-2">
                خطأ في تحميل لوحة التحكم
              </h3>
              <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isRefreshing ? '⏳ جاري إعادة المحاولة...' : '🔄 إعادة المحاولة'}
                </button>
                <div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    إعادة تحميل الصفحة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* شريط الأدوات العلوي */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0">
        <div className="px-6 py-4">
          <CommonDashboardComponents.Toolbar {...toolbarProps} />
        </div>
      </div>

      {/* محتوى لوحة التحكم */}
      <div className="relative z-10 p-6">
        {/* بطاقة معلومات المستخدم */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* أفاتار المستخدم */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mr-4">
                  {(user?.full_name || user?.username || 'مستخدم').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  مرحباً، {user?.full_name || user?.username || 'مستخدم'} 👋
                </h2>
                <div className="flex items-center space-x-4 space-x-reverse mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {user?.role_display || user?.role || 'غير محدد'}
                  </span>
                  
                  <span className="text-sm text-gray-500">
                    آخر تسجيل دخول: {user?.last_login ? 
                      new Date(user.last_login).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'الآن'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            {/* معلومات المرشح الحالي */}
            <div className="text-right">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-2">
                <span>📊</span>
                <span>المرشح الحالي:</span>
              </div>
              <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full font-medium shadow-sm">
                <span className="mr-2">📅</span>
                {timeFilters.find(f => f.value === timeFilter)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;