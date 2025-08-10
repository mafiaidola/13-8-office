import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActivityTrackingSimple = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await axios.get(`${API_BASE}/api/activities`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Activities loaded:', response.data);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      // Set demo data if API fails
      setActivities([
        {
          id: 'demo-1',
          activity_type: 'login',
          description: 'تسجيل دخول للنظام',
          user_name: 'أحمد محمد',
          user_role: 'admin',
          timestamp: new Date().toISOString(),
          location: 'القاهرة، مصر'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📊 تتبع الأنشطة والحركات - النسخة المبسطة
        </h1>
        <p className="text-gray-600">
          مراقبة الأنشطة في النظام
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3">جاري تحميل الأنشطة...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الأنشطة الحديثة ({activities.length})</h3>
            
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{activity.description}</h4>
                        <p className="text-sm text-gray-600">
                          بواسطة: {activity.user_name} ({activity.user_role})
                        </p>
                        {activity.location && (
                          <p className="text-sm text-gray-500">الموقع: {activity.location}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(activity.timestamp).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد أنشطة متاحة
              </div>
            )}
            
            <button
              onClick={loadActivities}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              تحديث
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTrackingSimple;