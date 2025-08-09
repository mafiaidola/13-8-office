// Activity Log Component - مكون سجل الأنشطة
import React, { useState, useEffect } from 'react';
import CommonDashboardComponents from './CommonDashboardComponents';

const ActivityLog = ({ 
  activities = [], 
  title = 'سجل الأنشطة الحديثة',
  maxItems = 10,
  showFilters = true,
  showRefresh = false,
  onRefresh
}) => {
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // تحديث الأنشطة المفلترة عند تغيير المرشحات
  useEffect(() => {
    let filtered = [...activities];

    // مرشح النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // مرشح الوقت
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          break;
        default:
          break;
      }

      if (timeFilter !== 'all') {
        filtered = filtered.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= filterDate;
        });
      }
    }

    // ترتيب حسب التاريخ (الأحدث أولاً)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // تحديد العدد الأقصى
    filtered = filtered.slice(0, maxItems);

    setFilteredActivities(filtered);
  }, [activities, typeFilter, timeFilter, maxItems]);

  // تحديد أيقونة النشاط
  const getActivityIcon = (type) => {
    const icons = {
      'order_created': '🛒',
      'payment_received': '💰',
      'visit_completed': '🏥',
      'clinic_registered': '🏢',
      'user_login': '🔐',
      'user_created': '👤',
      'product_added': '📦',
      'debt_created': '📋',
      'debt_paid': '💳',
      'system_alert': '⚠️',
      'report_generated': '📊',
      'target_achieved': '🎯'
    };
    return icons[type] || '📝';
  };

  // تحديد لون النشاط
  const getActivityColor = (type) => {
    const colors = {
      'order_created': 'bg-blue-100 text-blue-800',
      'payment_received': 'bg-green-100 text-green-800',
      'visit_completed': 'bg-purple-100 text-purple-800',
      'clinic_registered': 'bg-indigo-100 text-indigo-800',
      'user_login': 'bg-gray-100 text-gray-800',
      'user_created': 'bg-cyan-100 text-cyan-800',
      'product_added': 'bg-orange-100 text-orange-800',
      'debt_created': 'bg-red-100 text-red-800',
      'debt_paid': 'bg-green-100 text-green-800',
      'system_alert': 'bg-yellow-100 text-yellow-800',
      'report_generated': 'bg-teal-100 text-teal-800',
      'target_achieved': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // تحديد أنواع الأنشطة المتاحة
  const activityTypes = [
    { value: 'all', label: 'جميع الأنشطة' },
    { value: 'order_created', label: 'طلبات جديدة' },
    { value: 'payment_received', label: 'مدفوعات' },
    { value: 'visit_completed', label: 'زيارات' },
    { value: 'clinic_registered', label: 'عيادات جديدة' },
    { value: 'user_login', label: 'تسجيل دخول' },
    { value: 'debt_created', label: 'ديون جديدة' },
    { value: 'system_alert', label: 'تنبيهات النظام' }
  ];

  // خيارات مرشح الوقت
  const timeFilterOptions = [
    { value: 'all', label: 'جميع الأوقات' },
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'الأسبوع الماضي' },
    { value: 'month', label: 'الشهر الماضي' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* رأس السجل */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        {showRefresh && (
          <button
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            title="تحديث سجل الأنشطة"
          >
            🔄 تحديث
          </button>
        )}
      </div>

      {/* المرشحات */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeFilterOptions.map(time => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* قائمة الأنشطة */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-start space-x-4 space-x-reverse p-4 hover:bg-gray-50 rounded-lg transition-colors">
              {/* أيقونة النشاط */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                <span className="text-lg">
                  {getActivityIcon(activity.type)}
                </span>
              </div>

              {/* تفاصيل النشاط */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description || 'نشاط غير محدد'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.timestamp ? 
                      new Date(activity.timestamp).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'وقت غير محدد'
                    }
                  </p>
                </div>

                {/* معلومات إضافية */}
                {activity.details && (
                  <div className="mt-1 text-xs text-gray-500">
                    {activity.details.amount && (
                      <span className="mr-2">
                        المبلغ: {activity.details.amount.toLocaleString()} ج.م
                      </span>
                    )}
                    {activity.details.clinic_name && (
                      <span className="mr-2">
                        العيادة: {activity.details.clinic_name}
                      </span>
                    )}
                    {activity.user_id && (
                      <span className="mr-2">
                        المستخدم: {activity.user_id}
                      </span>
                    )}
                  </div>
                )}

                {/* تصنيف النشاط */}
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(activity.type)}`}>
                    {activityTypes.find(t => t.value === activity.type)?.label || 'نشاط عام'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <CommonDashboardComponents.EmptyState
            icon="📋"
            title="لا توجد أنشطة"
            description="لم يتم العثور على أي أنشطة حديثة مطابقة للمرشحات المحددة"
          />
        )}
      </div>

      {/* عرض المزيد */}
      {activities.length > maxItems && (
        <div className="text-center mt-6">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            عرض المزيد من الأنشطة ({activities.length - maxItems} نشاط إضافي)
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;