// Professional Activity Log - سجل الأنشطة الاحترافي والدقيق
import React, { useState, useEffect } from 'react';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const ProfessionalActivityLog = ({ 
  title = 'Recent System Activity Log',
  maxItems = 15,
  showFilters = true,
  language = 'ar',
  refreshInterval = 30000 // تحديث كل 30 ثانية
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadActivities();
    loadStats();
    
    // إعداد التحديث التلقائي
    const interval = setInterval(loadActivities, refreshInterval);
    return () => clearInterval(interval);
  }, [filter, timeFilter, refreshInterval]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        time_filter: timeFilter
      };
      
      if (filter !== 'all') {
        filters.action = filter;
      }

      const data = await comprehensiveActivityService.getRecentActivities(maxItems, filters);
      
      if (Array.isArray(data)) {
        // فرز البيانات حسب التوقيت (الأحدث أولاً)
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(sortedData);
        console.log('✅ تم تحميل الأنشطة:', sortedData.length);
      } else {
        console.warn('⚠️ البيانات المُستلمة ليست array:', data);
        setActivities([]);
      }
    } catch (err) {
      console.error('❌ خطأ في تحميل الأنشطة:', err);
      setError('فشل في تحميل الأنشطة');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await comprehensiveActivityService.getActivityStats();
      setStats(statsData);
    } catch (err) {
      console.error('خطأ في تحميل الإحصائيات:', err);
    }
  };

  // تنسيق التوقيت
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على أيقونة النشاط
  const getActivityIcon = (action) => {
    const icons = {
      login: '🔑',
      logout: '🚪',
      clinic_create: '🏥',
      visit_create: '🩺',
      invoice_create: '📄',
      order_create: '🛒',
      user_create: '👤',
      page_view: '👁️',
      payment_create: '💰',
      debt_create: '💳',
      product_create: '💊',
      settings_update: '⚙️'
    };
    return icons[action] || '📝';
  };

  // الحصول على لون النشاط
  const getActivityColor = (action, success = true) => {
    if (!success) return 'bg-red-50 border-red-200 text-red-700';
    
    const colors = {
      login: 'bg-green-50 border-green-200 text-green-700',
      logout: 'bg-gray-50 border-gray-200 text-gray-700',
      clinic_create: 'bg-blue-50 border-blue-200 text-blue-700',
      visit_create: 'bg-purple-50 border-purple-200 text-purple-700',
      invoice_create: 'bg-orange-50 border-orange-200 text-orange-700',
      order_create: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      user_create: 'bg-teal-50 border-teal-200 text-teal-700',
      payment_create: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    };
    return colors[action] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  // عرض تفاصيل النشاط
  const showActivityDetails = (activity) => {
    setSelectedActivity(activity);
    setShowDetails(true);
  };

  return (
    <div className="professional-activity-log bg-white rounded-xl shadow-lg border border-gray-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-blue-600 ml-3 text-2xl">⚡</span>
              {title}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              سجل مباشر ودقيق لجميع أنشطة النظام مع التفاصيل الشاملة
            </p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={loadActivities}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-all"
            >
              {loading ? '⏳' : '🔄'} تحديث
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">جميع الأنشطة</option>
              <option value="login">تسجيل الدخول</option>
              <option value="clinic_create">إضافة عيادات</option>
              <option value="visit_create">إنشاء زيارات</option>
              <option value="invoice_create">إنشاء فواتير</option>
              <option value="order_create">إنشاء طلبات</option>
              <option value="user_create">إضافة مستخدمين</option>
            </select>
            
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="1h">آخر ساعة</option>
              <option value="24h">آخر 24 ساعة</option>
              <option value="7d">آخر أسبوع</option>
              <option value="30d">آخر شهر</option>
            </select>
          </div>
        )}

        {/* Stats */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
              <div className="text-blue-700 text-xs">إجمالي الأنشطة</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.today || 0}</div>
              <div className="text-green-700 text-xs">أنشطة اليوم</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.active_users || 0}</div>
              <div className="text-purple-700 text-xs">مستخدمون نشطون</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.success_rate || '0'}%</div>
              <div className="text-orange-700 text-xs">معدل النجاح</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-500 text-xl ml-3">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">جاري تحميل الأنشطة الحديثة...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📭</div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">لا توجد أنشطة حديثة</h4>
            <p className="text-gray-600">ابدأ باستخدام النظام لرؤية الأنشطة هنا</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.slice(0, maxItems).map((activity, index) => (
              <div
                key={activity.id || index}
                className={`${getActivityColor(activity.action, activity.success)} border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 space-x-reverse flex-1">
                    <div className="text-3xl">
                      {getActivityIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">
                          {activity.description}
                        </h4>
                        <span className="text-sm font-medium">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                        <div>
                          <strong>المستخدم:</strong>
                          <div>{activity.user_name || 'غير محدد'}</div>
                        </div>
                        <div>
                          <strong>الدور:</strong>
                          <div>{activity.user_role || 'غير محدد'}</div>
                        </div>
                        {activity.location?.city && (
                          <div>
                            <strong>الموقع:</strong>
                            <div>{activity.location.city}</div>
                          </div>
                        )}
                        {activity.ip_address && (
                          <div>
                            <strong>IP:</strong>
                            <div className="font-mono text-xs">{activity.ip_address}</div>
                          </div>
                        )}
                        {activity.device_info?.deviceType && (
                          <div>
                            <strong>الجهاز:</strong>
                            <div>{activity.device_info.deviceType}</div>
                          </div>
                        )}
                        {activity.device_info?.browser && (
                          <div>
                            <strong>المتصفح:</strong>
                            <div>{activity.device_info.browser}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => showActivityDetails(activity)}
                          className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all"
                        >
                          📄 التفاصيل الكاملة
                        </button>
                        
                        {activity.location?.latitude && (
                          <button className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all">
                            🗺️ عرض على الخريطة
                          </button>
                        )}

                        {activity.entity_id && (
                          <button className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all">
                            🔗 عرض التفاصيل
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">تفاصيل النشاط الشاملة</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">📊 معلومات أساسية</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong>النوع:</strong> {selectedActivity.action}</div>
                  <div><strong>الوصف:</strong> {selectedActivity.description}</div>
                  <div><strong>المستخدم:</strong> {selectedActivity.user_name}</div>
                  <div><strong>الدور:</strong> {selectedActivity.user_role}</div>
                  <div><strong>التوقيت:</strong> {formatTimestamp(selectedActivity.timestamp)}</div>
                  <div><strong>الحالة:</strong> 
                    <span className={`mr-2 px-2 py-1 rounded text-sm ${selectedActivity.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedActivity.success ? 'نجح' : 'فشل'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              {selectedActivity.device_info && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">💻 التفاصيل التقنية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>عنوان IP:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedActivity.ip_address}</code></div>
                    <div><strong>نوع الجهاز:</strong> {selectedActivity.device_info.deviceType}</div>
                    <div><strong>المتصفح:</strong> {selectedActivity.device_info.browser}</div>
                    <div><strong>نظام التشغيل:</strong> {selectedActivity.device_info.os}</div>
                    <div><strong>دقة الشاشة:</strong> {selectedActivity.device_info.screenResolution}</div>
                    <div><strong>المنطقة الزمنية:</strong> {selectedActivity.device_info.timezone}</div>
                  </div>
                </div>
              )}

              {/* Location Details */}
              {(selectedActivity.location || selectedActivity.geo_location) && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">📍 معلومات الموقع</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedActivity.location?.city && <div><strong>المدينة:</strong> {selectedActivity.location.city}</div>}
                    {selectedActivity.location?.country && <div><strong>البلد:</strong> {selectedActivity.location.country}</div>}
                    {selectedActivity.geo_location?.isp && <div><strong>مزود الخدمة:</strong> {selectedActivity.geo_location.isp}</div>}
                    {selectedActivity.location?.latitude && (
                      <div><strong>الإحداثيات:</strong> {selectedActivity.location.latitude}, {selectedActivity.location.longitude}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Entity Details */}
              {selectedActivity.details && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">📋 تفاصيل إضافية</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedActivity.details).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {JSON.stringify(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalActivityLog;