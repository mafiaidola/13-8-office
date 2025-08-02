// Activity Tracking System - نظام تتبع الحركات والأنشطة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const ActivityTracking = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [visitActivities, setVisitActivities] = useState([]);
  const [clinicRegistrations, setClinicRegistrations] = useState([]);
  const [orderActivities, setOrderActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Mock comprehensive activity data
      setActivities([
        {
          id: 'act-001',
          type: 'visit_registration',
          action: 'تسجيل زيارة',
          user_id: 'user-001',
          user_name: 'محمد علي أحمد',
          user_role: 'medical_rep',
          target_type: 'clinic',
          target_id: 'clinic-001',
          target_name: 'عيادة الدكتور أحمد محمد',
          timestamp: '2024-02-05T09:30:00Z',
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
          device_info: 'Android - Chrome 119',
          ip_address: '192.168.1.100'
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
          timestamp: '2024-02-05T11:15:00Z',
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
          device_info: 'Android - Chrome 119',
          ip_address: '192.168.1.100'
        },
        {
          id: 'act-003',
          type: 'order_approval',
          action: 'اعتماد طلب',
          user_id: 'admin',
          user_name: 'مدير النظام',
          user_role: 'admin',
          target_type: 'order',
          target_id: 'order-001',
          target_name: 'طلب رقم ORD-2024-001',
          timestamp: '2024-02-05T12:00:00Z',
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'المكتب الرئيسي، القاهرة',
            accuracy: 8
          },
          details: {
            order_value: 1250.00,
            items_count: 5,
            clinic_name: 'عيادة الدكتور أحمد محمد',
            approved_amount: 1250.00
          },
          device_info: 'Windows - Chrome 119',
          ip_address: '192.168.1.101'
        },
        {
          id: 'act-004',
          type: 'product_update',
          action: 'تحديث منتج',
          user_id: 'admin',
          user_name: 'مدير النظام',
          user_role: 'admin',
          target_type: 'product',
          target_id: 'product-001',
          target_name: 'أموكسيسيلين 500mg',
          timestamp: '2024-02-05T14:30:00Z',
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'المكتب الرئيسي، القاهرة',
            accuracy: 5
          },
          details: {
            old_price: 85.00,
            new_price: 90.00,
            change_reason: 'زيادة سعر المورد'
          },
          device_info: 'Windows - Chrome 119',
          ip_address: '192.168.1.101'
        },
        {
          id: 'act-005',
          type: 'login',
          action: 'تسجيل دخول',
          user_id: 'user-002',
          user_name: 'سارة محمود',
          user_role: 'medical_rep',
          target_type: 'system',
          target_id: 'system',
          target_name: 'نظام EP Group',
          timestamp: '2024-02-05T08:00:00Z',
          location: {
            latitude: 30.0131,
            longitude: 31.2089,
            address: 'الجيزة',
            accuracy: 20
          },
          details: {
            biometric_verified: true,
            session_duration: 8.5
          },
          device_info: 'iPhone - Safari 17',
          ip_address: '192.168.1.102'
        }
      ]);

      // Separate activities by type for easier filtering
      setVisitActivities(activities.filter(act => act.type === 'visit_registration'));
      setClinicRegistrations(activities.filter(act => act.type === 'clinic_registration'));
      setOrderActivities(activities.filter(act => act.type === 'order_approval'));

    } catch (error) {
      console.error('خطأ في جلب بيانات الأنشطة:', error);
    } finally {
      setLoading(false);
    }
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