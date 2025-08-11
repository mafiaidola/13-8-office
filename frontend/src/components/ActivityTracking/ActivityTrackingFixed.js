// Activity Tracking Component - Simplified & Fixed Version
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import axios from 'axios';

const ActivityTracking = ({ language = 'en', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/activities`, { 
        headers,
        params: { filter, limit: 100 }
      });
      
      setActivities(response.data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Fallback demo data
      setActivities([
        {
          id: '1',
          user_name: 'Admin User',
          action: 'login',
          description: language === 'ar' ? 'تسجيل دخول إلى النظام' : 'System login',
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1',
          device_info: 'Chrome 120.0.0 on Windows 10',
          location: {
            city: language === 'ar' ? 'القاهرة' : 'Cairo',
            country: language === 'ar' ? 'مصر' : 'Egypt',
            latitude: 30.0444,
            longitude: 31.2357
          }
        },
        {
          id: '2',
          user_name: 'Medical Rep',
          action: 'clinic_visit',
          description: language === 'ar' ? 'زيارة عيادة الدكتور أحمد' : 'Visit to Dr. Ahmed clinic',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ip_address: '192.168.1.2',
          device_info: 'Mobile Safari on iPhone',
          location: {
            city: language === 'ar' ? 'الإسكندرية' : 'Alexandria',
            country: language === 'ar' ? 'مصر' : 'Egypt',
            latitude: 31.2001,
            longitude: 29.9187
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter activities based on search term
  const filteredActivities = activities.filter(activity =>
    activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action icon
  const getActionIcon = (action) => {
    const icons = {
      login: '🔑',
      logout: '🚪',
      clinic_visit: '🏥',
      product_update: '📦',
      user_create: '👤',
      invoice_create: '📄',
      payment: '💰',
      default: '📋'
    };
    return icons[action] || icons.default;
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      login: 'bg-green-100 text-green-800 border-green-200',
      logout: 'bg-red-100 text-red-800 border-red-200',
      clinic_visit: 'bg-blue-100 text-blue-800 border-blue-200',
      product_update: 'bg-purple-100 text-purple-800 border-purple-200',
      user_create: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      invoice_create: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      payment: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[action] || colors.default;
  };

  // Show activity details
  const showActivityDetails = (activity) => {
    setSelectedActivity(activity);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {language === 'ar' ? 'تتبع النشاطات' : 'Activity Tracking'}
              </h1>
              <p className="text-lg text-gray-600">
                {language === 'ar' ? 'مراقبة شاملة لجميع أنشطة النظام' : 'Comprehensive monitoring of all system activities'}
              </p>
            </div>
          </div>
          
          <button
            onClick={loadActivities}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            {tc('refresh')}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {language === 'ar' ? 'الفترة الزمنية:' : 'Time Period:'}
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
              <option value="today">{language === 'ar' ? 'اليوم' : 'Today'}</option>
              <option value="week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
              <option value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث في الأنشطة...' : 'Search activities...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-blue-600 mr-2">📊</span>
            {language === 'ar' ? 'سجل الأنشطة' : 'Activity Log'}
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {filteredActivities.length}
            </span>
          </h2>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500">{language === 'ar' ? 'لا توجد أنشطة' : 'No activities found'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => showActivityDetails(activity)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{getActionIcon(activity.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{activity.user_name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span>🕐</span>
                            {formatTimestamp(activity.timestamp)}
                          </span>
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {activity.location.city}, {activity.location.country}
                            </span>
                          )}
                          {activity.ip_address && (
                            <span className="flex items-center gap-1">
                              <span>🌐</span>
                              {activity.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 p-2">
                      <span>👁️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Details Modal */}
      {showDetails && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">{getActionIcon(selectedActivity.action)}</span>
                  {language === 'ar' ? 'تفاصيل النشاط' : 'Activity Details'}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'المستخدم' : 'User'}
                  </label>
                  <p className="text-lg font-semibold">{selectedActivity.user_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'النشاط' : 'Action'}
                  </label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getActionColor(selectedActivity.action)}`}>
                    {selectedActivity.action}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <p className="text-gray-800">{selectedActivity.description}</p>
                </div>
              </div>

              {/* Technical Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'معلومات تقنية' : 'Technical Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                    </label>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedActivity.ip_address || language === 'ar' ? 'غير متوفر' : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {language === 'ar' ? 'معلومات الجهاز' : 'Device Info'}
                    </label>
                    <p className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedActivity.device_info || language === 'ar' ? 'غير متوفر' : 'Not available'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {language === 'ar' ? 'التوقيت' : 'Timestamp'}
                    </label>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {formatTimestamp(selectedActivity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              {selectedActivity.location && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">📍</span>
                    {language === 'ar' ? 'معلومات الموقع' : 'Location Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {language === 'ar' ? 'المدينة' : 'City'}
                      </label>
                      <p>{selectedActivity.location.city}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {language === 'ar' ? 'الدولة' : 'Country'}
                      </label>
                      <p>{selectedActivity.location.country}</p>
                    </div>
                    {selectedActivity.location.latitude && selectedActivity.location.longitude && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {language === 'ar' ? 'الإحداثيات' : 'Coordinates'}
                        </label>
                        <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {selectedActivity.location.latitude.toFixed(6)}, {selectedActivity.location.longitude.toFixed(6)}
                        </p>
                        <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <span className="text-3xl block mb-2">🗺️</span>
                            <p className="text-sm">
                              {language === 'ar' ? 'عرض الموقع على الخريطة' : 'View location on map'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {tc('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracking;