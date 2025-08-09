// Activity List Component - مكون قائمة الأنشطة
import React from 'react';

const ActivityList = ({ activities = [], showDetails = true, maxItems = 10 }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'غير محدد';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `منذ ${diffMinutes} دقيقة`;
      } else if (diffHours < 24) {
        return `منذ ${diffHours} ساعة`;
      } else {
        return date.toLocaleDateString('ar-EG');
      }
    } catch (error) {
      return 'غير محدد';
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      'order_created': '🛒',
      'payment_received': '💳',
      'clinic_registered': '🏥',
      'visit_completed': '👨‍⚕️',
      'debt_collection': '💰',
      'user_created': '👤',
      'product_added': '📦',
      'invoice_generated': '📄',
      'system_update': '⚙️',
      'backup_created': '💾'
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      'order_created': 'blue',
      'payment_received': 'green',
      'clinic_registered': 'purple',
      'visit_completed': 'teal',
      'debt_collection': 'orange',
      'user_created': 'indigo',
      'product_added': 'yellow',
      'invoice_generated': 'gray',
      'system_update': 'red',
      'backup_created': 'emerald'
    };
    return colors[type] || 'gray';
  };

  const limitedActivities = activities.slice(0, maxItems);

  if (!limitedActivities || limitedActivities.length === 0) {
    return (
      <div className="activity-list-empty text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أنشطة حديثة</h3>
        <p className="text-gray-500">ستظهر الأنشطة الجديدة هنا عند حدوثها</p>
      </div>
    );
  }

  return (
    <div className="activity-list space-y-4">
      {limitedActivities.map((activity, index) => {
        const color = getActivityColor(activity.type);
        const icon = getActivityIcon(activity.type);
        
        return (
          <div 
            key={activity.id || index} 
            className="activity-item bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-start gap-4">
              {/* Activity Icon */}
              <div className={`flex-shrink-0 w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center`}>
                <span className="text-lg">{icon}</span>
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.description || activity.action || 'نشاط جديد'}
                  </h4>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>

                {showDetails && (
                  <div className="mt-2 space-y-1">
                    {activity.user_id && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">المستخدم:</span> {activity.user_id}
                      </p>
                    )}
                    
                    {activity.details && activity.details.amount && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">المبلغ:</span> {
                          new Intl.NumberFormat('ar-EG', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 0
                          }).format(activity.details.amount)
                        }
                      </p>
                    )}

                    {activity.details && activity.details.order_id && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">رقم الطلبية:</span> {activity.details.order_id}
                      </p>
                    )}

                    {activity.details && activity.details.payment_id && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">رقم الدفعة:</span> {activity.details.payment_id}
                      </p>
                    )}
                  </div>
                )}

                {/* Activity Type Badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                    {icon} {getActivityTypeLabel(activity.type)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {activities.length > maxItems && (
        <div className="text-center pt-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            عرض المزيد ({activities.length - maxItems} نشاط إضافي)
          </button>
        </div>
      )}
    </div>
  );
};

const getActivityTypeLabel = (type) => {
  const labels = {
    'order_created': 'طلبية جديدة',
    'payment_received': 'دفعة مستلمة',
    'clinic_registered': 'تسجيل عيادة',
    'visit_completed': 'زيارة مكتملة',
    'debt_collection': 'تحصيل دين',
    'user_created': 'مستخدم جديد',
    'product_added': 'منتج جديد',
    'invoice_generated': 'فاتورة جديدة',
    'system_update': 'تحديث النظام',
    'backup_created': 'نسخة احتياطية'
  };
  return labels[type] || 'نشاط';
};

export default ActivityList;