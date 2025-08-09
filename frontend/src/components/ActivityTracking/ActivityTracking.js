import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActivityTracking = () => {
  const [activeTab, setActiveTab] = useState('activities');
  const [activities, setActivities] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);
  const [filters, setFilters] = useState({
    date_range: 'today', // today, week, month, all
    activity_type: '', // all types
    user_role: '', // all roles
    search: ''
  });

  const API_BASE = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadActivities();
    loadLoginLogs();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      if (filters.date_range !== 'all') params.append('date_range', filters.date_range);
      if (filters.activity_type) params.append('activity_type', filters.activity_type);
      if (filters.user_role) params.append('user_role', filters.user_role);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE}/api/activities?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Activities loaded:', response.data);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      if (error.response?.status === 404) {
        // إنشاء أنشطة تجريبية إذا لم يتم العثور على endpoint
        setActivities([
          {
            id: 'demo-1',
            activity_type: 'login',
            description: 'تسجيل دخول للنظام',
            user_name: 'أحمد محمد',
            user_role: 'admin',
            ip_address: '192.168.1.100',
            location: 'القاهرة، مصر',
            device_info: 'Chrome Browser',
            timestamp: new Date().toISOString()
          },
          {
            id: 'demo-2',
            activity_type: 'user_created',
            description: 'إنشاء مستخدم جديد',
            user_name: 'أحمد محمد',
            user_role: 'admin',
            details: 'تم إنشاء مستخدم جديد: محمد علي',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'demo-3',
            activity_type: 'clinic_visit',
            description: 'زيارة عيادة جديدة',
            user_name: 'سارة أحمد',
            user_role: 'medical_rep',
            details: 'زيارة عيادة الدكتور محمد علي',
            location: 'الجيزة، مصر',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLoginLogs = async () => {
    try {
      setLoginLogsLoading(true);
      const token = localStorage.getItem('access_token');
      
      // استخدام endpoint صحيح لسجلات تسجيل الدخول الحقيقية
      const response = await axios.get(`${API_BASE}/api/activities?activity_type=login&limit=100`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login logs loaded from activities:', response.data);
      
      // معالجة البيانات لتحويلها من activities إلى login logs format
      const loginActivities = response.data.activities || [];
      const formattedLogs = loginActivities
        .filter(activity => activity.activity_type === 'login')
        .map(activity => ({
          id: activity.id,
          username: activity.user_name,
          full_name: activity.user_name,
          role: activity.user_role,
          login_time: activity.timestamp,
          ip_address: activity.ip_address || 'Unknown IP',
          device_info: activity.device_info || 'Unknown Device',
          location: activity.location || 'Unknown Location',
          latitude: activity.geolocation?.latitude,
          longitude: activity.geolocation?.longitude,
          city: activity.geolocation?.city,
          country: activity.geolocation?.country,
          location_accuracy: activity.geolocation?.accuracy,
          geolocation: activity.geolocation
        }));
      
      setLoginLogs(formattedLogs);
    } catch (error) {
      console.error('❌ Error loading login logs:', error);
      
      // إذا فشل الاستدعاء، جرب من endpoint سجلات الدخول المباشر
      try {
        const fallbackResponse = await axios.get(`${API_BASE}/api/visits/login-logs`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Fallback login logs loaded:', fallbackResponse.data);
        setLoginLogs(fallbackResponse.data.logs || []);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        setLoginLogs([]);
      }
    } finally {
      setLoginLogsLoading(false);
    }
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      'login': '🔐',
      'logout': '🚪',
      'user_created': '👤',
      'user_updated': '✏️',
      'user_deleted': '🗑️',
      'clinic_visit': '🏥',
      'clinic_registered': '📋',
      'product_added': '📦',
      'order_created': '🛒',
      'payment_processed': '💳',
      'system_backup': '💾',
      'settings_updated': '⚙️',
      'report_generated': '📊',
      'data_export': '📤',
      'data_import': '📥'
    };
    return icons[activityType] || '📋';
  };

  const getActivityTypeLabel = (activityType) => {
    const labels = {
      'login': 'تسجيل دخول',
      'logout': 'تسجيل خروج',
      'user_created': 'إنشاء مستخدم',
      'user_updated': 'تحديث مستخدم',
      'user_deleted': 'حذف مستخدم',
      'clinic_visit': 'زيارة عيادة',
      'clinic_registered': 'تسجيل عيادة',
      'product_added': 'إضافة منتج',
      'order_created': 'إنشاء طلب',
      'payment_processed': 'معالجة دفعة',
      'system_backup': 'نسخ احتياطي',
      'settings_updated': 'تحديث إعدادات',
      'report_generated': 'إنشاء تقرير',
      'data_export': 'تصدير بيانات',
      'data_import': 'استيراد بيانات'
    };
    return labels[activityType] || activityType;
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'أدمن',
      'gm': 'مدير عام',
      'medical_rep': 'مندوب طبي',
      'sales_rep': 'مندوب مبيعات',
      'accounting': 'محاسب',
      'line_manager': 'مدير خط',
      'area_manager': 'مدير منطقة'
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      'admin': 'bg-red-100 text-red-800',
      'gm': 'bg-purple-100 text-purple-800',
      'medical_rep': 'bg-green-100 text-green-800',
      'sales_rep': 'bg-blue-100 text-blue-800',
      'accounting': 'bg-yellow-100 text-yellow-800',
      'line_manager': 'bg-orange-100 text-orange-800',
      'area_manager': 'bg-indigo-100 text-indigo-800'
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const applyFilters = () => {
    loadActivities();
  };

  const clearFilters = () => {
    setFilters({
      date_range: 'today',
      activity_type: '',
      user_role: '',
      search: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📊 تتبع الأنشطة والحركات
            </h1>
            <p className="text-gray-600">
              مراقبة شاملة لجميع الأنشطة والحركات في النظام مع تتبع الموقع والوقت
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadActivities}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                '🔄'
              )}
              تحديث
            </button>
            <button
              onClick={() => {
                const data = activeTab === 'activities' ? activities : loginLogs;
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              📤
              تصدير
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'activities', label: 'الأنشطة العامة', icon: '📋', count: activities.length },
              { id: 'login_logs', label: 'سجل تسجيل الدخول', icon: '🔐', count: loginLogs.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.date_range}
              onChange={(e) => setFilters({...filters, date_range: e.target.value})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="all">جميع الأوقات</option>
            </select>

            <select
              value={filters.activity_type}
              onChange={(e) => setFilters({...filters, activity_type: e.target.value})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
              <option value="login">تسجيل دخول</option>
              <option value="user_created">إنشاء مستخدم</option>
              <option value="clinic_visit">زيارة عيادة</option>
              <option value="order_created">إنشاء طلب</option>
              <option value="payment_processed">معالجة دفعة</option>
            </select>

            <select
              value={filters.user_role}
              onChange={(e) => setFilters({...filters, user_role: e.target.value})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">جميع الأدوار</option>
              <option value="admin">أدمن</option>
              <option value="medical_rep">مندوب طبي</option>
              <option value="sales_rep">مندوب مبيعات</option>
              <option value="accounting">محاسب</option>
            </select>

            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="بحث في الأنشطة..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex-1"
              >
                🔍 بحث
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                ✖️
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">إجمالي الأنشطة</p>
                      <p className="text-2xl font-bold">{activities.length}</p>
                      <p className="text-sm text-blue-100">اليوم</p>
                    </div>
                    <div className="text-3xl opacity-80">📊</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">تسجيلات الدخول</p>
                      <p className="text-2xl font-bold">
                        {activities.filter(a => a.activity_type === 'login').length}
                      </p>
                      <p className="text-sm text-green-100">نشط</p>
                    </div>
                    <div className="text-3xl opacity-80">🔐</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">زيارات العيادات</p>
                      <p className="text-2xl font-bold">
                        {activities.filter(a => a.activity_type === 'clinic_visit').length}
                      </p>
                      <p className="text-sm text-purple-100">مكتمل</p>
                    </div>
                    <div className="text-3xl opacity-80">🏥</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">مستخدمين نشطين</p>
                      <p className="text-2xl font-bold">
                        {new Set(activities.map(a => a.user_name)).size}
                      </p>
                      <p className="text-sm text-orange-100">فريد</p>
                    </div>
                    <div className="text-3xl opacity-80">👥</div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3">جاري تحميل الأنشطة...</span>
                </div>
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            النشاط
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المستخدم
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الدور
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الوقت
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الموقع
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            التفاصيل
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activities.length > 0 ? activities.map((activity) => (
                          <tr key={activity.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{getActivityIcon(activity.activity_type)}</span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {getActivityTypeLabel(activity.activity_type)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {activity.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.user_name || 'غير محدد'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(activity.user_role)}`}>
                                {getRoleLabel(activity.user_role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTimestamp(activity.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.location || activity.ip_address || 'غير محدد'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {activity.details || activity.device_info || '-'}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <div className="space-y-2">
                                <div className="text-4xl">📋</div>
                                <div>لا توجد أنشطة متاحة</div>
                                <div className="text-sm text-gray-400">
                                  لم يتم العثور على أنشطة للفترة المحددة
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'login_logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">سجل تسجيل الدخول المفصل</h2>
                <button
                  onClick={loadLoginLogs}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loginLogsLoading}
                >
                  {loginLogsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      🔄
                      تحديث
                    </>
                  )}
                </button>
              </div>

              {loginLogsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3">جاري تحميل سجل تسجيل الدخول...</span>
                </div>
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المستخدم
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الدور
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            تاريخ ووقت الدخول
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الموقع الجغرافي
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            معلومات الجهاز
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            عنوان IP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loginLogs.length > 0 ? (
                          loginLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {log.full_name || log.username}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {log.username}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(log.role)}`}>
                                  {getRoleLabel(log.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatTimestamp(log.login_time)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.geolocation && log.latitude && log.longitude ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs">
                                        📍 {log.city || 'Unknown'}, {log.country || 'Unknown'}
                                      </div>
                                      <button
                                        onClick={() => {
                                          const lat = parseFloat(log.latitude).toFixed(6);
                                          const lng = parseFloat(log.longitude).toFixed(6);
                                          const url = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
                                          window.open(url, '_blank');
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                                        title="عرض على الخريطة"
                                      >
                                        🗺️ عرض
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ({parseFloat(log.latitude).toFixed(4)}, {parseFloat(log.longitude).toFixed(4)})
                                    </div>
                                    {log.location_accuracy && (
                                      <div className="text-xs text-gray-400">
                                        دقة: {Math.round(log.location_accuracy)}م
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">لا يوجد موقع</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {log.device_info ? (
                                  <div className="truncate" title={log.device_info}>
                                    {log.device_info.includes('Chrome') ? '🌐 Chrome' :
                                     log.device_info.includes('Firefox') ? '🦊 Firefox' :
                                     log.device_info.includes('Safari') ? '🧭 Safari' :
                                     log.device_info.includes('Edge') ? '🔷 Edge' :
                                     '💻 Unknown Browser'}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">غير محدد</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.ip_address && log.ip_address !== 'Unknown IP' ? 
                                  log.ip_address : 
                                  <span className="text-gray-400">غير محدد</span>
                                }
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <div className="space-y-2">
                                <div className="text-4xl">🔐</div>
                                <div>لا توجد سجلات تسجيل دخول متاحة</div>
                                <div className="text-sm text-gray-400">
                                  قد تحتاج إلى صلاحيات أدمن لعرض هذه البيانات
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {loginLogs.length > 0 && (
                    <div className="bg-gray-50 px-6 py-3 border-t">
                      <div className="text-sm text-gray-600">
                        📊 إجمالي السجلات: {loginLogs.length} | 
                        آخر تحديث: {new Date().toLocaleString('ar-EG')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTracking;