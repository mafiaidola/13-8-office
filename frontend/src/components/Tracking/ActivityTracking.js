// Activity Tracking System - نظام تتبع الحركات والأنشطة الشامل مع GPS
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const ActivityTracking = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [activeReps, setActiveReps] = useState([]);
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
      
      // جلب جميع البيانات بشكل متوازي - إزالة GPS tracking
      const [activitiesRes, statsRes, activeRepsRes] = await Promise.allSettled([
        axios.get(`${API}/admin/activities?limit=100`, { headers }),
        axios.get(`${API}/admin/activities/stats`, { headers }),
        axios.get(`${API}/users?status=active&role=medical_rep`, { headers }) // Get active medical reps
      ]);

      if (activitiesRes.status === 'fulfilled') {
        setActivities(activitiesRes.value.data || []);
      } else {
        console.warn('فشل في جلب الأنشطة:', activitiesRes.reason);
        setActivities([]);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      } else {
        console.warn('فشل في جلب الإحصائيات:', statsRes.reason);
      }

      if (activeRepsRes.status === 'fulfilled') {
        // Mock GPS coordinates for active reps (in real app, this would come from GPS tracking API)
        const repsWithLocation = (activeRepsRes.value.data || []).map(rep => ({
          ...rep,
          lat: 30.0444 + (Math.random() - 0.5) * 0.1, // Cairo area with random offset
          lng: 31.2357 + (Math.random() - 0.5) * 0.1,
          last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time within last hour
          status: 'active',
          current_activity: ['زيارة عيادة', 'في الطريق', 'استراحة', 'اجتماع عمل'][Math.floor(Math.random() * 4)]
        }));
        setActiveReps(repsWithLocation);
      } else {
        console.warn('فشل في جلب المندوبين النشطين:', activeRepsRes.reason);
        setActiveReps([]);
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
      'order_creation': '📋',
      'order_approval': '✅',
      'order_rejection': '❌',
      'product_update': '📦',
      'user_creation': '👤',
      'login': '🔐',
      'logout': '🚪',
      'payment_record': '💰',
      'invoice_creation': '🧾',
      'system_access': '🖥️',
      'report_generation': '📊'
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      'visit_registration': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'clinic_registration': 'bg-green-500/20 text-green-300 border-green-500/30',
      'order_creation': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'order_approval': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'order_rejection': 'bg-red-500/20 text-red-300 border-red-500/30',
      'product_update': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'user_creation': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      'login': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      'logout': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'payment_record': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'invoice_creation': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'system_access': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      'report_generation': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'منذ دقائق قليلة';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.target_name && activity.target_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = activityDate >= monthAgo;
        break;
      case 'all':
      default:
        matchesDate = true;
    }
    
    return matchesType && matchesSearch && matchesDate;
  });

  const showActivityDetails = (activity) => {
    console.log('🔍 Showing activity details:', activity);
    setSelectedActivity(activity);
  };

  const closeActivityDetails = () => {
    setSelectedActivity(null);
  };

  const exportData = async (format = 'json') => {
    try {
      const dataToExport = {
        activities: filteredActivities,
        stats: stats,
        exported_at: new Date().toISOString(),
        exported_by: user?.full_name || user?.username,
        filters: { filterType, filterDate, searchTerm }
      };

      const fileName = `activity_report_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert to CSV
        const csvContent = [
          'النوع,الإجراء,المستخدم,الدور,الهدف,الوقت,الموقع,الجهاز',
          ...filteredActivities.map(act => [
            act.type,
            act.action,
            act.user_name,
            act.user_role,
            act.target_name || '',
            formatDateTime(act.timestamp),
            act.location?.address || '',
            act.device_info?.operating_system || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace('.json', '.csv');
        a.click();
        URL.revokeObjectURL(url);
      }

      // تسجيل عملية التصدير
      await logCurrentActivity(
        'report_generation',
        `تصدير تقرير الأنشطة (${format.toUpperCase()})`,
        'system',
        'activity_report',
        fileName,
        { 
          format: format,
          activities_count: filteredActivities.length,
          filters_applied: { filterType, filterDate, searchTerm }
        }
      );

    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
    }
  };

  const renderOverview = () => {
    const totalActivities = stats?.total_activities || activities.length;
    const todayActivities = stats?.today_activities || activities.filter(act => 
      new Date(act.timestamp).toDateString() === new Date().toDateString()
    ).length;
    const weekActivities = stats?.week_activities || activities.length;
    const monthActivities = stats?.month_activities || activities.length;

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">{totalActivities}</div>
                <div className="text-sm opacity-75">إجمالي الأنشطة</div>
                <div className="text-xs text-blue-300 mt-1">جميع الفترات</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">{todayActivities}</div>
                <div className="text-sm opacity-75">أنشطة اليوم</div>
                <div className="text-xs text-green-300 mt-1">{getRelativeTime(new Date().toISOString())}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">{weekActivities}</div>
                <div className="text-sm opacity-75">أنشطة الأسبوع</div>
                <div className="text-xs text-purple-300 mt-1">آخر 7 أيام</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg">
                <span className="text-2xl">🗓️</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-400">{monthActivities}</div>
                <div className="text-sm opacity-75">أنشطة الشهر</div>
                <div className="text-xs text-orange-300 mt-1">آخر 30 يوم</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Types Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📈</span>
              توزيع الأنشطة حسب النوع
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.activities_by_type || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getActivityIcon(type)}</span>
                    <span className="text-sm">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/10 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${(count / totalActivities) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>👥</span>
              أكثر المستخدمين نشاطاً
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.activities_by_user || {}).slice(0, 5).map(([username, count]) => (
                <div key={username} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <span className="text-sm font-medium">{username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-white/10 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(count / Math.max(...Object.values(stats?.activities_by_user || {}))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>⏰</span>
              آخر الأنشطة
            </h3>
            <button
              onClick={() => setActiveTab('all_activities')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              عرض الكل →
            </button>
          </div>
          <div className="space-y-3">
            {activities.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                   onClick={() => showActivityDetails(activity)}>
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm opacity-75">{activity.user_name} - {activity.target_name}</div>
                  <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                    <span>📍</span>
                    <span>{activity.location?.address || 'غير محدد'}</span>
                    <span>•</span>
                    <span>{getRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-lg border text-xs ${getActivityColor(activity.type)}`}>
                    {activity.type.replace('_', ' ')}
                  </span>
                  <div className="text-xs opacity-60 mt-1">{formatDateTime(activity.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Locations */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🗺️</span>
            أكثر المواقع نشاطاً
          </h3>
          {stats?.most_active_locations?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.most_active_locations.slice(0, 6).map((location, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📍</span>
                    <span className="text-sm font-medium">{location.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">عدد الأنشطة</span>
                    <span className="text-sm font-bold text-blue-400">{location.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🗺️</div>
              <p>لا توجد بيانات مواقع متاحة</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowMap(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <span>🗺️</span>
              عرض الخريطة التفاعلية
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>⚡</span>
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => exportData('json')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center gap-2"
            >
              <span>📊</span>
              <span>تصدير JSON</span>
            </button>
            <button
              onClick={() => exportData('csv')}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 flex items-center gap-2"
            >
              <span>📈</span>
              <span>تصدير CSV</span>
            </button>
            <button
              onClick={() => fetchData()}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 flex items-center gap-2"
            >
              <span>🔄</span>
              <span>تحديث البيانات</span>
            </button>
            <button
              onClick={() => setActiveTab('gps_tracking')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex items-center gap-2"
            >
              <span>🛰️</span>
              <span>تتبع GPS</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAllActivities = () => (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البحث</label>
            <input
              type="text"
              placeholder="ابحث في الأنشطة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <option value="order_creation">إنشاء الطلبات</option>
              <option value="order_approval">اعتماد الطلبات</option>
              <option value="product_update">تحديث المنتجات</option>
              <option value="user_creation">إنشاء المستخدمين</option>
              <option value="login">تسجيل الدخول</option>
              <option value="system_access">دخول النظام</option>
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
              <option value="month">هذا الشهر</option>
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
              className="w-full bg-gray-600/50 text-white px-4 py-2 rounded-lg hover:bg-gray-600/70 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-blue-600/50 text-white px-4 py-2 rounded-lg hover:bg-blue-600/70 transition-colors flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              تحديث
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm opacity-75">
          <div>
            عرض {filteredActivities.length} من أصل {activities.length} نشاط
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => exportData('json')}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <span>💾</span>
              تصدير JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              className="flex items-center gap-1 text-green-400 hover:text-green-300"
            >
              <span>📊</span>
              تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">النشاط</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الهدف</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الوقت</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الموقع</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الجهاز</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity, index) => (
                <tr 
                  key={activity.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <div className="font-medium text-white">{activity.action}</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getActivityColor(activity.type)}`}>
                          {activity.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">👤</span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{activity.user_name}</div>
                        <div className="text-sm opacity-75 capitalize">{activity.user_role?.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{activity.target_name || 'غير محدد'}</div>
                    <div className="text-sm opacity-75 capitalize">{activity.target_type?.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-white">{formatDateTime(activity.timestamp)}</div>
                    <div className="text-xs opacity-60">{getRelativeTime(activity.timestamp)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs">
                    {activity.location ? (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span>📍</span>
                          <span className="text-xs truncate">{activity.location.address}</span>
                        </div>
                        <div className="text-xs opacity-60">
                          دقة: {activity.location.accuracy?.toFixed(1) || 'غير محددة'}م
                        </div>
                        {activity.location.latitude && activity.location.longitude && (
                          <div className="text-xs opacity-60 mt-1">
                            {activity.location.latitude.toFixed(4)}, {activity.location.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">غير متوفر</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-white">
                        {activity.device_info?.operating_system || 'غير محدد'}
                      </div>
                      <div className="text-xs opacity-60">
                        {activity.device_info?.browser || 'غير محدد'}
                      </div>
                      <div className="text-xs opacity-60">
                        {activity.device_info?.device_type || 'غير محدد'}
                      </div>
                      {activity.device_info?.ip_address && (
                        <div className="text-xs opacity-50">
                          IP: {activity.device_info.ip_address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => showActivityDetails(activity)}
                        className="px-3 py-1 bg-blue-600/50 text-white rounded hover:bg-blue-600/70 transition-colors text-xs"
                        title="عرض التفاصيل الكاملة"
                      >
                        تفاصيل
                      </button>
                      {activity.location?.latitude && activity.location?.longitude && (
                        <button
                          onClick={() => {
                            if (GOOGLE_MAPS_API_KEY) {
                              const mapUrl = `https://www.google.com/maps?q=${activity.location.latitude},${activity.location.longitude}`;
                              window.open(mapUrl, '_blank');
                            } else {
                              alert(`الموقع: ${activity.location.latitude}, ${activity.location.longitude}`);
                            }
                          }}
                          className="px-3 py-1 bg-green-600/50 text-white rounded hover:bg-green-600/70 transition-colors text-xs"
                          title="عرض على الخريطة"
                        >
                          خريطة
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold mb-2 text-white">لا توجد أنشطة</h3>
          <p className="text-gray-400 mb-4">لم يتم العثور على أنشطة مطابقة للفلترة المحددة</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterDate('all');
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      )}

      {/* Pagination Placeholder */}
      {filteredActivities.length > 50 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            السابق
          </button>
          <span className="text-sm opacity-75">
            الصفحة 1 من 1
          </span>
          <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            التالي
          </button>
        </div>
      )}
    </div>
  );

  const renderGPSTracking = () => (
    <div className="space-y-6">
      {/* GPS Summary */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🛰️</span>
          ملخص تتبع GPS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📍</span>
              <span className="text-sm font-medium">إجمالي النقاط</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{gpsLogs.length}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🚶</span>
              <span className="text-sm font-medium">المسافة المقدرة</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {gpsLogs.reduce((total, log) => total + (log.distance_from_last || 0), 0).toFixed(1)} كم
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⏱️</span>
              <span className="text-sm font-medium">متوسط الدقة</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {gpsLogs.length > 0 
                ? (gpsLogs.reduce((total, log) => total + (log.location?.accuracy || 0), 0) / gpsLogs.length).toFixed(1)
                : 0
              }م
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔄</span>
              <span className="text-sm font-medium">آخر تحديث</span>
            </div>
            <div className="text-sm font-bold text-orange-400">
              {gpsLogs.length > 0 ? getRelativeTime(gpsLogs[0]?.created_at) : 'غير متوفر'}
            </div>
          </div>
        </div>
      </div>

      {/* GPS Logs Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>📋</span>
            سجلات تتبع GPS التفصيلية
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الموقع</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الإحداثيات</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الدقة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">نوع الحركة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الوقت</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-200">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {gpsLogs.slice(0, 50).map((log, index) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">👤</span>
                      </div>
                      <div>
                        <div className="font-medium text-white">المستخدم {log.user_id}</div>
                        <div className="text-xs opacity-60">ID: {log.user_id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-white">
                      {log.location?.address || 'غير محدد'}
                    </div>
                    <div className="text-xs opacity-60">
                      {log.location?.city || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-mono text-white">
                      {log.location?.latitude?.toFixed(6)}, {log.location?.longitude?.toFixed(6)}
                    </div>
                    <div className="text-xs opacity-60">
                      {log.location?.altitude ? `ارتفاع: ${log.location.altitude}م` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.location?.accuracy <= 10 
                        ? 'bg-green-500/20 text-green-300' 
                        : log.location?.accuracy <= 25 
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {log.location?.accuracy?.toFixed(1) || 'غ.م'}م
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="capitalize text-white">
                      {log.movement_type || 'غير محدد'}
                    </span>
                    {log.distance_from_last > 0 && (
                      <div className="text-xs opacity-60">
                        مسافة: {log.distance_from_last.toFixed(1)}م
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-white">
                      {formatDateTime(log.created_at || log.location?.timestamp)}
                    </div>
                    <div className="text-xs opacity-60">
                      {getRelativeTime(log.created_at || log.location?.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {log.location?.latitude && log.location?.longitude && (
                        <button
                          onClick={() => {
                            if (GOOGLE_MAPS_API_KEY) {
                              const mapUrl = `https://www.google.com/maps?q=${log.location.latitude},${log.location.longitude}`;
                              window.open(mapUrl, '_blank');
                            } else {
                              alert(`الموقع: ${log.location.latitude}, ${log.location.longitude}`);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600/50 text-white rounded hover:bg-blue-600/70 transition-colors text-xs"
                          title="عرض على الخريطة"
                        >
                          خريطة
                        </button>
                      )}
                      {log.activity_id && (
                        <button
                          onClick={() => {
                            const activity = activities.find(act => act.id === log.activity_id);
                            if (activity) showActivityDetails(activity);
                          }}
                          className="px-3 py-1 bg-green-600/50 text-white rounded hover:bg-green-600/70 transition-colors text-xs"
                          title="عرض النشاط المرتبط"
                        >
                          نشاط
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {gpsLogs.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <div className="text-6xl mb-4">🛰️</div>
          <h3 className="text-xl font-bold mb-2 text-white">لا توجد سجلات GPS</h3>
          <p className="text-gray-400 mb-4">لم يتم تسجيل أي بيانات GPS حتى الآن</p>
        </div>
      )}
    </div>
  );

  const renderMapView = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold mb-2 text-white">خريطة الأنشطة التفاعلية</h3>
          <p className="text-gray-400 mb-4">
            عرض جميع الأنشطة والحركات على خريطة تفاعلية مع Google Maps
          </p>
          {GOOGLE_MAPS_API_KEY ? (
            <div>
              <p className="text-sm text-green-400 mb-4">
                ✅ Google Maps API متاح - يمكن عرض الخريطة
              </p>
              <div className="bg-gray-800 rounded-lg p-8 mb-4">
                <div className="text-gray-400">
                  [هنا ستظهر الخريطة التفاعلية مع جميع النقاط والأنشطة]
                </div>
              </div>
              <button 
                onClick={() => {
                  // يمكن تطوير هذا لاحقاً لعرض خريطة حقيقية
                  alert('سيتم تطوير الخريطة التفاعلية في الإصدار القادم');
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                تفعيل الخريطة التفاعلية
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-orange-400 mb-4">
                ⚠️ يتطلب Google Maps API Key لتفعيل هذه الميزة
              </p>
              <div className="bg-gray-800/50 rounded-lg p-8 mb-4">
                <div className="text-gray-500">
                  لعرض الخريطة التفاعلية، يرجى إضافة REACT_APP_GOOGLE_MAPS_API_KEY في ملف البيئة
                </div>
              </div>
            </div>
          )}

          {/* Activity Locations Preview */}
          <div className="mt-8">
            <h4 className="text-lg font-bold mb-4 text-white">المواقع المسجلة</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.filter(act => act.location).slice(0, 6).map((activity) => (
                <div key={activity.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    <span className="text-sm font-medium text-white truncate">{activity.action}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    📍 {activity.location.address}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {activity.location.latitude?.toFixed(4)}, {activity.location.longitude?.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getRelativeTime(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">جاري تحميل بيانات الأنشطة...</p>
          <p className="text-sm text-gray-400 mt-2">يتم جلب البيانات من الخادم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-tracking-container min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">📊</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">تتبع الأنشطة والحركات</h1>
            <p className="text-lg opacity-75">مراقبة شاملة لجميع الأنشطة مع تتبع الموقع والوقت - للأدمن فقط</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📊', description: 'ملخص شامل للأنشطة' },
            { id: 'all_activities', name: 'جميع الأنشطة', icon: '📋', description: 'قائمة تفصيلية بجميع الأنشطة' },
            { id: 'gps_tracking', name: 'تتبع GPS', icon: '🛰️', description: 'سجلات المواقع والحركة' },
            { id: 'map_view', name: 'عرض الخريطة', icon: '🗺️', description: 'خريطة تفاعلية للمواقع' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-300 border-b-2 border-indigo-400 bg-white/5'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              title={tab.description}
            >
              <span className="text-lg">{tab.icon}</span>
              <div>
                <div>{tab.name}</div>
                <div className="text-xs opacity-60">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'all_activities' && renderAllActivities()}
          {activeTab === 'gps_tracking' && renderGPSTracking()}
          {activeTab === 'map_view' && renderMapView()}
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{getActivityIcon(selectedActivity.type)}</span>
                  تفاصيل النشاط
                </h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">نوع النشاط</div>
                    <div className="text-white font-medium">{selectedActivity.action}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">المستخدم</div>
                    <div className="text-white font-medium">{selectedActivity.user_name}</div>
                    <div className="text-xs text-gray-500">{selectedActivity.user_role}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">الهدف</div>
                    <div className="text-white font-medium">{selectedActivity.target_name || 'غير محدد'}</div>
                    <div className="text-xs text-gray-500">{selectedActivity.target_type}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">الوقت</div>
                    <div className="text-white font-medium">{formatDateTime(selectedActivity.timestamp)}</div>
                    <div className="text-xs text-gray-500">{getRelativeTime(selectedActivity.timestamp)}</div>
                  </div>
                </div>

                {selectedActivity.location && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">معلومات الموقع</div>
                    <div className="text-white mb-2">{selectedActivity.location.address}</div>
                    <div className="text-sm text-gray-400">
                      📍 {selectedActivity.location.latitude?.toFixed(6)}, {selectedActivity.location.longitude?.toFixed(6)}
                    </div>
                    <div className="text-sm text-gray-400">
                      دقة: {selectedActivity.location.accuracy}م
                    </div>
                  </div>
                )}

                {selectedActivity.details && Object.keys(selectedActivity.details).length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">التفاصيل الإضافية</div>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedActivity.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracking;