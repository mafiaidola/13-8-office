// Activity Tracking System - نظام تتبع الحركات والأنشطة الشامل مع GPS
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const ActivityTracking = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [gpsLogs, setGpsLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // جلب جميع البيانات بشكل متوازي
      const [activitiesRes, statsRes, gpsRes] = await Promise.allSettled([
        axios.get(`${API}/admin/activities?limit=100`, { headers }),
        axios.get(`${API}/admin/activities/stats`, { headers }),
        axios.get(`${API}/admin/gps-tracking?limit=50`, { headers })
      ]);

      if (activitiesRes.status === 'fulfilled') {
        setActivities(activitiesRes.value.data);
      } else {
        console.warn('فشل في جلب الأنشطة:', activitiesRes.reason);
        setActivities([]);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      } else {
        console.warn('فشل في جلب الإحصائيات:', statsRes.reason);
      }

      if (gpsRes.status === 'fulfilled') {
        setGpsLogs(gpsRes.value.data);
      } else {
        console.warn('فشل في جلب سجلات GPS:', gpsRes.reason);
        setGpsLogs([]);
      }

    } catch (error) {
      console.error('خطأ في جلب بيانات الأنشطة:', error);
      // في حالة فشل الـ API، استخدم البيانات التجريبية
      generateFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => {
    // بيانات تجريبية في حالة فشل الـ API
    const mockActivities = [
      {
        id: 'act-001',
        type: 'visit_registration',
        action: 'تسجيل زيارة عيادة',
        user_id: 'user-001',
        user_name: 'محمد علي أحمد',
        user_role: 'medical_rep',
        target_type: 'clinic',
        target_id: 'clinic-001',
        target_name: 'عيادة الدكتور أحمد محمد',
        timestamp: new Date().toISOString(),
        location: {
          latitude: 30.0444,
          longitude: 31.2357,
          address: 'شارع النيل، المعادي، القاهرة',
          accuracy: 15
        },
        details: {
          visit_duration: 45,
          order_created: true,
          order_value: 1250.00,
          notes: 'زيارة روتينية، تم عرض المنتجات الجديدة'
        },
        device_info: {
          device_type: 'mobile',
          operating_system: 'Android 12',
          browser: 'Chrome',
          ip_address: '192.168.1.100'
        }
      },
      {
        id: 'act-002',
        type: 'clinic_registration',
        action: 'تسجيل عيادة جديدة',
        user_id: 'user-001',
        user_name: 'محمد علي أحمد',
        user_role: 'medical_rep',
        target_type: 'clinic',
        target_id: 'clinic-004',
        target_name: 'عيادة الدكتور سامي حسن',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: 30.0626,
          longitude: 31.2497,
          address: 'مدينة نصر، القاهرة',
          accuracy: 12
        },
        details: {
          doctor_name: 'د. سامي حسن',
          specialty: 'أطفال',
          classification: 'B',
          phone: '01234567890'
        },
        device_info: {
          device_type: 'mobile',
          operating_system: 'Android 12',
          browser: 'Chrome',
          ip_address: '192.168.1.100'
        }
      },
      {
        id: 'act-003',
        type: 'order_creation',
        action: 'إنشاء طلب جديد',
        user_id: 'user-002',
        user_name: 'سارة محمود علي',
        user_role: 'medical_rep',
        target_type: 'order',
        target_id: 'order-001',
        target_name: 'طلب رقم ORD-2024-001',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: 30.0131,
          longitude: 31.2089,
          address: 'الجيزة',
          accuracy: 20
        },
        details: {
          order_value: 2500.00,
          items_count: 8,
          clinic_name: 'عيادة الدكتور محمد حسن',
          payment_method: 'credit'
        },
        device_info: {
          device_type: 'mobile',
          operating_system: 'iOS 16',
          browser: 'Safari',
          ip_address: '192.168.1.102'
        }
      }
    ];

    setActivities(mockActivities);
    setStats({
      total_activities: mockActivities.length,
      today_activities: mockActivities.filter(act => 
        new Date(act.timestamp).toDateString() === new Date().toDateString()
      ).length,
      week_activities: mockActivities.length,
      month_activities: mockActivities.length,
      activities_by_type: {
        visit_registration: 1,
        clinic_registration: 1,
        order_creation: 1
      },
      activities_by_user: {
        'محمد علي أحمد': 2,
        'سارة محمود علي': 1
      },
      most_active_locations: [
        { location: 'شارع النيل، المعادي، القاهرة', count: 1 },
        { location: 'مدينة نصر، القاهرة', count: 1 }
      ],
      peak_hours: [
        { hour: new Date().getHours(), count: 3 }
      ]
    });
  };

  const logCurrentActivity = async (activityType, action, targetType, targetId, targetName, details = {}) => {
    try {
      // الحصول على الموقع الحالي
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const activityData = {
        type: activityType,
        action: action,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: await getAddressFromCoordinates(position.coords.latitude, position.coords.longitude)
        },
        device_info: {
          device_type: getMobileDeviceType(),
          operating_system: getOperatingSystem(),
          browser: getBrowserInfo(),
          screen_resolution: `${window.screen.width}x${window.screen.height}`
        },
        details: details
      };

      const token = localStorage.getItem('access_token');
      await axios.post(`${API}/activities`, activityData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // تحديث البيانات بعد التسجيل
      await fetchData();

    } catch (error) {
      console.error('خطأ في تسجيل النشاط:', error);
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=ar`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('خطأ في الحصول على العنوان:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const getMobileDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const getOperatingSystem = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Windows NT 10.0') !== -1) return 'Windows 10';
    if (ua.indexOf('Windows NT 6.2') !== -1) return 'Windows 8';
    if (ua.indexOf('Windows NT 6.1') !== -1) return 'Windows 7';
    if (ua.indexOf('Windows NT 6.0') !== -1) return 'Windows Vista';
    if (ua.indexOf('Windows NT 5.1') !== -1) return 'Windows XP';
    if (ua.indexOf('Windows NT 5.0') !== -1) return 'Windows 2000';
    if (ua.indexOf('Mac') !== -1) return 'Mac/iOS';
    if (ua.indexOf('X11') !== -1) return 'UNIX';
    if (ua.indexOf('Linux') !== -1) return 'Linux';
    if (ua.indexOf('Android') !== -1) return 'Android';
    return 'Unknown';
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1) return 'Opera';
    return 'Unknown';
  };

  const getActivityIcon = (type) => {
    const icons = {
      'visit_registration': '🏥',
      'clinic_registration': '➕',
      'order_approval': '✅',
      'product_update': '📦',
      'login': '🔐',
      'logout': '🚪',
      'payment': '💰',
      'invoice_creation': '🧾'
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      'visit_registration': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'clinic_registration': 'bg-green-500/20 text-green-300 border-green-500/30',
      'order_approval': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'product_update': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'login': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      'logout': 'bg-red-500/20 text-red-300 border-red-500/30',
      'payment': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'invoice_creation': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.target_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filtering
    const activityDate = new Date(activity.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let matchesDate = true;
    switch (filterDate) {
      case 'today':
        matchesDate = activityDate.toDateString() === today.toDateString();
        break;
      case 'yesterday':
        matchesDate = activityDate.toDateString() === yesterday.toDateString();
        break;
      case 'week':
        matchesDate = activityDate >= weekAgo;
        break;
      case 'all':
      default:
        matchesDate = true;
    }
    
    return matchesType && matchesSearch && matchesDate;
  });

  const renderOverview = () => {
    const totalActivities = activities.length;
    const todayActivities = activities.filter(act => 
      new Date(act.timestamp).toDateString() === new Date().toDateString()
    ).length;
    const visitCount = activities.filter(act => act.type === 'visit_registration').length;
    const clinicRegistrationCount = activities.filter(act => act.type === 'clinic_registration').length;

    return (
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalActivities}</div>
                <div className="text-sm opacity-75">إجمالي الأنشطة</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{todayActivities}</div>
                <div className="text-sm opacity-75">أنشطة اليوم</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-xl">🏥</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{visitCount}</div>
                <div className="text-sm opacity-75">زيارات مسجلة</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <span className="text-xl">➕</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{clinicRegistrationCount}</div>
                <div className="text-sm opacity-75">عيادات مسجلة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4">آخر الأنشطة</h3>
          <div className="space-y-3">
            {activities.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm opacity-75">{activity.user_name} - {activity.target_name}</div>
                  <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                    <span>📍</span>
                    <span>{activity.location?.address}</span>
                    <span>•</span>
                    <span>{formatDateTime(activity.timestamp)}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg border text-xs ${getActivityColor(activity.type)}`}>
                  {activity.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Map Placeholder */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4">خريطة الأنشطة</h3>
          <div className="bg-white/5 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h4 className="text-xl font-bold mb-2">خريطة تفاعلية للأنشطة</h4>
            <p className="text-gray-400 mb-4">عرض جميع الأنشطة والحركات على الخريطة مع تفاصيل الموقع والوقت</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              عرض الخريطة التفاعلية (يتطلب Google Maps API)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAllActivities = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البحث</label>
            <input
              type="text"
              placeholder="ابحث في الأنشطة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">نوع النشاط</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأنشطة</option>
              <option value="visit_registration">تسجيل الزيارات</option>
              <option value="clinic_registration">تسجيل العيادات</option>
              <option value="order_approval">اعتماد الطلبات</option>
              <option value="product_update">تحديث المنتجات</option>
              <option value="login">تسجيل الدخول</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">اليوم</option>
              <option value="yesterday">أمس</option>
              <option value="week">هذا الأسبوع</option>
              <option value="all">جميع الفترات</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterDate('today');
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">النشاط</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الهدف</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الوقت</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الموقع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الجهاز</th>
                <th className="px-6 py-4 text-right text-sm font-medium">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${getActivityColor(activity.type)}`}>
                          {activity.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{activity.user_name}</div>
                    <div className="text-sm opacity-75">{activity.user_role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{activity.target_name}</div>
                    <div className="text-sm opacity-75">{activity.target_type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDateTime(activity.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <span>📍</span>
                      <span className="text-xs">{activity.location?.address}</span>
                    </div>
                    <div className="text-xs opacity-60">
                      دقة: {activity.location?.accuracy}m
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{activity.device_info}</div>
                    <div className="text-xs opacity-60">{activity.ip_address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        // Show activity details modal
                        alert(`تفاصيل النشاط:\n${JSON.stringify(activity.details, null, 2)}`);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                    >
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold mb-2">لا توجد أنشطة</h3>
          <p className="text-gray-600">لم يتم العثور على أنشطة مطابقة للفلترة المحددة</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الأنشطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-tracking-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">📊</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">تتبع الأنشطة والحركات</h1>
            <p className="text-lg opacity-75">مراقبة شاملة لجميع الأنشطة مع تتبع الموقع والوقت</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📊' },
            { id: 'all_activities', name: 'جميع الأنشطة', icon: '📋' },
            { id: 'map_view', name: 'عرض الخريطة', icon: '🗺️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-300 border-b-2 border-indigo-400'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'all_activities' && renderAllActivities()}
          {activeTab === 'map_view' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-2">عرض الخريطة التفاعلية</h3>
              <p className="text-gray-600 mb-4">عرض جميع الأنشطة على خريطة تفاعلية مع Google Maps</p>
              <p className="text-sm text-orange-400">يتطلب Google Maps API Key لتفعيل هذه الميزة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTracking;