import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from '../../localization/enhancedTranslations';

const ActivityTracking = ({ language = 'en', theme = 'dark' }) => {
  const { t, ta, td } = useTranslation(language);
  const isDark = theme === 'dark';
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date_range: 'today',
    activity_type: 'all',
    user_role: 'all',
    search: ''
  });
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [stats, setStats] = useState({
    total_activities: 0,
    login_activities: 0,
    unique_users: 0,
    clinic_visits: 0
  });
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      if (filters.date_range !== 'all') params.append('date_range', filters.date_range);
      if (filters.activity_type !== 'all') params.append('activity_type', filters.activity_type);
      if (filters.user_role !== 'all') params.append('user_role', filters.user_role);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE}/api/activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActivities(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
      // Mock data for development
      setActivities([
        {
          id: '1',
          activity_type: 'login',
          user_name: language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed',
          user_role: 'admin',
          timestamp: new Date().toISOString(),
          description: language === 'ar' ? 'تسجيل دخول إلى النظام' : 'System login',
          ip_address: '192.168.1.100',
          device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt',
          latitude: 30.0444,
          longitude: 31.2357
        },
        {
          id: '2',
          activity_type: 'clinic_visit',
          user_name: language === 'ar' ? 'سارة أحمد' : 'Sara Ahmed',
          user_role: 'medical_rep',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          description: language === 'ar' ? 'زيارة عيادة الدكتور محمد' : 'Visit to Dr. Mohamed clinic',
          ip_address: '192.168.1.101',
          device_info: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          location: language === 'ar' ? 'الجيزة، مصر' : 'Giza, Egypt',
          latitude: 30.0131,
          longitude: 31.2089
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/activities/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data || stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Use mock stats
      setStats({
        total_activities: activities.length,
        login_activities: activities.filter(a => a.activity_type === 'login').length,
        unique_users: new Set(activities.map(a => a.user_name)).size,
        clinic_visits: activities.filter(a => a.activity_type === 'clinic_visit').length
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Cairo'
    };
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', options);
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      login: language === 'ar' ? 'تسجيل دخول' : 'Login',
      logout: language === 'ar' ? 'تسجيل خروج' : 'Logout',
      clinic_visit: language === 'ar' ? 'زيارة عيادة' : 'Clinic Visit',
      product_order: language === 'ar' ? 'طلب منتج' : 'Product Order',
      user_creation: language === 'ar' ? 'إنشاء مستخدم' : 'User Creation',
      clinic_registration: language === 'ar' ? 'تسجيل عيادة' : 'Clinic Registration'
    };
    return labels[type] || type;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: language === 'ar' ? 'مدير' : 'Admin',
      gm: language === 'ar' ? 'مدير عام' : 'General Manager',
      medical_rep: language === 'ar' ? 'مندوب طبي' : 'Medical Rep',
      sales_rep: language === 'ar' ? 'مندوب مبيعات' : 'Sales Rep',
      accounting: language === 'ar' ? 'محاسب' : 'Accountant',
      manager: language === 'ar' ? 'مدير منطقة' : 'Area Manager'
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      gm: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      medical_rep: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      sales_rep: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      accounting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    };
    return classes[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getActivityTypeIcon = (type) => {
    const icons = {
      login: '🚪',
      logout: '🚪',
      clinic_visit: '🏥',
      product_order: '📦',
      user_creation: '👤',
      clinic_registration: '🏥'
    };
    return icons[type] || '📊';
  };

  const parseBrowserInfo = (userAgent) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Browser detection
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Device detection
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    }

    return { browser, os, device };
  };

  const initializeMapForActivity = (activity) => {
    if (!window.google || !window.google.maps || !mapRef.current || !activity.latitude || !activity.longitude) {
      return;
    }

    const position = {
      lat: parseFloat(activity.latitude),
      lng: parseFloat(activity.longitude)
    };

    const map = new window.google.maps.Map(mapRef.current, {
      center: position,
      zoom: 15,
      mapTypeId: 'roadmap'
    });

    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      title: `${activity.user_name} - ${getActivityTypeLabel(activity.activity_type)}`,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285f4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="text-align: center; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; margin-bottom: 8px;">
            ${getActivityTypeIcon(activity.activity_type)} ${getActivityTypeLabel(activity.activity_type)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${language === 'ar' ? 'المستخدم:' : 'User:'}</strong> ${activity.user_name}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${language === 'ar' ? 'الوقت:' : 'Time:'}</strong> ${formatTimestamp(activity.timestamp)}
          </div>
          ${activity.location ? `
            <div style="margin-bottom: 4px;">
              <strong>${language === 'ar' ? 'الموقع:' : 'Location:'}</strong> ${activity.location}
            </div>
          ` : ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    mapInstanceRef.current = map;
  };

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setShowMapModal(true);
    
    // Initialize map after modal is shown
    setTimeout(() => {
      initializeMapForActivity(activity);
    }, 100);
  };

  // Theme styles
  const containerStyles = `min-h-screen transition-all duration-300 ${
    isDark 
      ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
  }`;

  const cardStyles = `rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 backdrop-blur-sm' 
      : 'bg-white border-gray-200'
  }`;

  const inputStyles = `px-4 py-2 rounded-lg border transition-all duration-200 ${
    isDark 
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`;

  if (loading) {
    return (
      <div className={containerStyles}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{ta('tracking')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerStyles}>
        <div className="max-w-4xl mx-auto p-6">
          <div className={`${cardStyles} p-8 text-center`}>
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">{ta('title')}</h3>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchActivities();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common', 'retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className={`${cardStyles} p-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-3xl text-white">📊</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {ta('title')}
                </h1>
                <p className={`text-lg mt-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'مراقبة وتتبع جميع أنشطة المستخدمين في النظام' : 'Monitor and track all user activities in the system'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`${cardStyles} p-6`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total_activities}</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'إجمالي الأنشطة' : 'Total Activities'}
                </div>
              </div>
            </div>
          </div>

          <div className={`${cardStyles} p-6`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚪</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.login_activities}</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'تسجيلات الدخول' : 'Login Activities'}
                </div>
              </div>
            </div>
          </div>

          <div className={`${cardStyles} p-6`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.unique_users}</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'مستخدمين فريدين' : 'Unique Users'}
                </div>
              </div>
            </div>
          </div>

          <div className={`${cardStyles} p-6`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.clinic_visits}</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'زيارات العيادات' : 'Clinic Visits'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${cardStyles} p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                {td('date')}
              </label>
              <select
                value={filters.date_range}
                onChange={(e) => handleFilterChange('date_range', e.target.value)}
                className={inputStyles}
              >
                <option value="today">{td('today')}</option>
                <option value="week">{td('thisWeek')}</option>
                <option value="month">{td('thisMonth')}</option>
                <option value="year">{td('thisYear')}</option>
                <option value="all">{language === 'ar' ? 'جميع التواريخ' : 'All Time'}</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                {ta('activity')}
              </label>
              <select
                value={filters.activity_type}
                onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                className={inputStyles}
              >
                <option value="all">{language === 'ar' ? 'جميع الأنشطة' : 'All Activities'}</option>
                <option value="login">{language === 'ar' ? 'تسجيل دخول' : 'Login'}</option>
                <option value="logout">{language === 'ar' ? 'تسجيل خروج' : 'Logout'}</option>
                <option value="clinic_visit">{language === 'ar' ? 'زيارة عيادة' : 'Clinic Visit'}</option>
                <option value="product_order">{language === 'ar' ? 'طلب منتج' : 'Product Order'}</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                {language === 'ar' ? 'الدور' : 'Role'}
              </label>
              <select
                value={filters.user_role}
                onChange={(e) => handleFilterChange('user_role', e.target.value)}
                className={inputStyles}
              >
                <option value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
                <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                <option value="gm">{language === 'ar' ? 'مدير عام' : 'General Manager'}</option>
                <option value="medical_rep">{language === 'ar' ? 'مندوب طبي' : 'Medical Rep'}</option>
                <option value="sales_rep">{language === 'ar' ? 'مندوب مبيعات' : 'Sales Rep'}</option>
                <option value="accounting">{language === 'ar' ? 'محاسب' : 'Accountant'}</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                {t('common', 'search')}
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={language === 'ar' ? 'ابحث في الأنشطة...' : 'Search activities...'}
                className={inputStyles}
              />
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className={`${cardStyles} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <th className="px-6 py-4 text-left text-sm font-medium">{ta('activity')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{language === 'ar' ? 'الدور' : 'Role'}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{td('datetime')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{ta('location')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr 
                    key={activity.id} 
                    className={`border-b ${isDark ? 'border-slate-700/50' : 'border-gray-100'} hover:${isDark ? 'bg-slate-700/30' : 'bg-gray-50'} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getActivityTypeIcon(activity.activity_type)}</span>
                        <div>
                          <div className="font-medium">{getActivityTypeLabel(activity.activity_type)}</div>
                          {activity.description && (
                            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                              {activity.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{activity.user_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(activity.user_role)}`}>
                        {getRoleLabel(activity.user_role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatTimestamp(activity.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {activity.location || (
                        <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>
                          {language === 'ar' ? 'غير محدد' : 'Not specified'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(activity)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        disabled={!activity.latitude || !activity.longitude}
                      >
                        {language === 'ar' ? 'التفاصيل' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {activities.length === 0 && (
          <div className={`${cardStyles} p-12 text-center`}>
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">{language === 'ar' ? 'لا توجد أنشطة' : 'No Activities'}</h3>
            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
              {language === 'ar' ? 'لم يتم العثور على أنشطة مطابقة للفلاتر المحددة' : 'No activities found matching the selected filters'}
            </p>
          </div>
        )}

        {/* Activity Details Modal */}
        {showMapModal && selectedActivity && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${cardStyles} w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden`}>
              <div className="flex items-center justify-between p-6 border-b border-opacity-20">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  🗺️ {language === 'ar' ? 'تفاصيل النشاط مع الموقع' : 'Activity Details with Location'}
                </h3>
                <button
                  onClick={() => {
                    setShowMapModal(false);
                    setSelectedActivity(null);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current = null;
                    }
                  }}
                  className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} text-2xl`}
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Activity Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'} border-b pb-2`}>
                      {language === 'ar' ? 'معلومات النشاط' : 'Activity Information'}
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                          {language === 'ar' ? 'النوع:' : 'Type:'}
                        </span>
                        <span className="font-medium">{getActivityTypeLabel(selectedActivity.activity_type)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                          {language === 'ar' ? 'المستخدم:' : 'User:'}
                        </span>
                        <span className="font-medium">{selectedActivity.user_name}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                          {language === 'ar' ? 'الدور:' : 'Role:'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(selectedActivity.user_role)}`}>
                          {getRoleLabel(selectedActivity.user_role)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                          {language === 'ar' ? 'الوقت:' : 'Time:'}
                        </span>
                        <span className="font-medium">{formatTimestamp(selectedActivity.timestamp)}</span>
                      </div>

                      {selectedActivity.description && (
                        <div className="pt-2">
                          <span className={`${isDark ? 'text-slate-400' : 'text-gray-600'} block`}>
                            {language === 'ar' ? 'الوصف:' : 'Description:'}
                          </span>
                          <p className={`text-sm ${isDark ? 'text-slate-300 bg-slate-700/50' : 'text-gray-800 bg-gray-50'} p-2 rounded mt-1`}>
                            {selectedActivity.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'} border-b pb-2`}>
                      {language === 'ar' ? 'معلومات تقنية' : 'Technical Information'}
                    </h4>
                    
                    <div className="space-y-3">
                      {selectedActivity.device_info && (() => {
                        const browserInfo = parseBrowserInfo(selectedActivity.device_info);
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                {language === 'ar' ? 'المتصفح:' : 'Browser:'}
                              </span>
                              <span className="font-medium">{browserInfo.browser}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                {language === 'ar' ? 'نظام التشغيل:' : 'OS:'}
                              </span>
                              <span className="font-medium">{browserInfo.os}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                {language === 'ar' ? 'نوع الجهاز:' : 'Device:'}
                              </span>
                              <span className="font-medium">{browserInfo.device}</span>
                            </div>
                          </>
                        );
                      })()}
                      
                      {selectedActivity.ip_address && (
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                            {language === 'ar' ? 'عنوان IP:' : 'IP Address:'}
                          </span>
                          <span className="font-medium font-mono">{selectedActivity.ip_address}</span>
                        </div>
                      )}
                      
                      {selectedActivity.location && (
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                            {language === 'ar' ? 'الموقع:' : 'Location:'}
                          </span>
                          <span className="font-medium">{selectedActivity.location}</span>
                        </div>
                      )}

                      {(selectedActivity.latitude && selectedActivity.longitude) && (
                        <div className="pt-2">
                          <span className={`${isDark ? 'text-slate-400' : 'text-gray-600'} block`}>
                            {language === 'ar' ? 'الإحداثيات:' : 'Coordinates:'}
                          </span>
                          <p className={`text-sm ${isDark ? 'text-slate-300 bg-slate-700/50' : 'text-gray-800 bg-gray-50'} p-2 rounded mt-1 font-mono`}>
                            {parseFloat(selectedActivity.latitude).toFixed(6)}, {parseFloat(selectedActivity.longitude).toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Map Section */}
                {(selectedActivity.latitude && selectedActivity.longitude) && (
                  <div className="space-y-4">
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'} border-b pb-2`}>
                      {language === 'ar' ? 'موقع النشاط على الخريطة' : 'Activity Location on Map'}
                    </h4>
                    <div 
                      ref={mapRef}
                      className={`w-full h-96 rounded-lg border ${isDark ? 'border-slate-600' : 'border-gray-300'}`}
                    />
                  </div>
                )}

                {/* Device Info Full Details */}
                {selectedActivity.device_info && (
                  <div className="space-y-4">
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'} border-b pb-2`}>
                      {language === 'ar' ? 'معلومات الجهاز الكاملة' : 'Complete Device Information'}
                    </h4>
                    <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-50'} p-4 rounded-lg`}>
                      <code className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-700'} break-all`}>
                        {selectedActivity.device_info}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTracking;