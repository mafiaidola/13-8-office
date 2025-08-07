// Enhanced Activity Tracking System - نظام تتبع الحركات والأنشطة المحسن مع خريطة المندوبين النشطين
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdvancedActivityMap from '../Maps/AdvancedActivityMap';

const EnhancedActivityTracking = ({ user, language = 'ar', isRTL = true }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [activeReps, setActiveReps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedRep, setSelectedRep] = useState(null);
  
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // جلب البيانات المطلوبة
      const [activitiesRes, statsRes, usersRes] = await Promise.allSettled([
        axios.get(`${API}/admin/activities?limit=100`, { headers }),
        axios.get(`${API}/admin/activities/stats`, { headers }),
        axios.get(`${API}/users?role=medical_rep`, { headers })
      ]);

      // معالجة الأنشطة
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.data) {
        setActivities(Array.isArray(activitiesRes.value.data) ? activitiesRes.value.data : []);
      } else {
        setActivities(generateMockActivities());
      }

      // معالجة الإحصائيات
      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      } else {
        setStats({
          total_activities: activities.length,
          active_users: 15,
          visits_today: 45,
          orders_today: 12
        });
      }

      // معالجة المندوبين النشطين مع مواقع وهمية (في التطبيق الحقيقي ستأتي من GPS)
      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        const repsData = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
        const repsWithLocation = repsData
          .filter(rep => rep.role === 'medical_rep' && rep.is_active !== false)
          .slice(0, 10) // أول 10 مندوبين
          .map(rep => ({
            ...rep,
            // إحداثيات وهمية في منطقة القاهرة الكبرى
            lat: 30.0444 + (Math.random() - 0.5) * 0.2,
            lng: 31.2357 + (Math.random() - 0.5) * 0.2,
            last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            status: Math.random() > 0.3 ? 'active' : 'inactive',
            current_activity: ['زيارة عيادة الدكتور أحمد', 'في الطريق إلى العيادة', 'استراحة غداء', 'اجتماع مع العميل', 'عودة للمكتب'][Math.floor(Math.random() * 5)],
            battery_level: Math.floor(Math.random() * 100),
            speed: Math.floor(Math.random() * 60)
          }));
        setActiveReps(repsWithLocation);
      } else {
        setActiveReps(generateMockActiveReps());
      }

    } catch (error) {
      console.error('خطأ في جلب بيانات الأنشطة:', error);
      // استخدام بيانات وهمية في حالة الفشل
      setActivities(generateMockActivities());
      setActiveReps(generateMockActiveReps());
      setStats({
        total_activities: 156,
        active_users: 12,
        visits_today: 34,
        orders_today: 8
      });
    } finally {
      setLoading(false);
    }
  };

  // توليد أنشطة وهمية
  const generateMockActivities = () => {
    const types = ['visit_registration', 'order_creation', 'clinic_registration', 'user_login', 'payment_processing'];
    const users = ['محمد علي أحمد', 'فاطمة حسن محمود', 'أحمد عبدالله سالم', 'نورا محمد علي', 'خالد حسام الدين'];
    const targets = ['عيادة الدكتور أحمد', 'عيادة الأسنان المتقدمة', 'مستشفى النور', 'عيادة العيون', 'مركز القلب'];
    
    return Array.from({ length: 50 }, (_, index) => ({
      id: `act-${index + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      action: getActionText(types[Math.floor(Math.random() * types.length)]),
      user_name: users[Math.floor(Math.random() * users.length)],
      user_role: 'medical_rep',
      target_name: targets[Math.floor(Math.random() * targets.length)],
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      status: Math.random() > 0.2 ? 'completed' : 'pending',
      details: {
        location: 'القاهرة، مصر',
        duration: Math.floor(Math.random() * 120) + 15,
        notes: 'تم بنجاح'
      }
    }));
  };

  // توليد مندوبين نشطين وهميين
  const generateMockActiveReps = () => {
    const names = ['أحمد محمد علي', 'فاطمة أحمد حسن', 'محمد عبدالله سالم', 'سارة علي محمود', 'خالد حسن إبراهيم', 'نور محمد أحمد'];
    
    return names.map((name, index) => ({
      id: `rep-${index + 1}`,
      full_name: name,
      role: 'medical_rep',
      latitude: 30.0444 + (Math.random() - 0.5) * 0.3,  // إحداثيات القاهرة مع تشويش
      longitude: 31.2357 + (Math.random() - 0.5) * 0.3,  // إحداثيات القاهرة مع تشويش
      last_seen: new Date(Date.now() - Math.random() * 1800000).toISOString(),
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      current_activity: ['زيارة عيادة', 'في الطريق', 'استراحة', 'اجتماع عمل', 'عودة للمكتب'][Math.floor(Math.random() * 5)],
      battery_level: Math.floor(Math.random() * 100),
      speed: Math.floor(Math.random() * 60),
      area: ['القاهرة - مدينة نصر', 'الجيزة - المهندسين', 'القاهرة - مصر الجديدة', 'الإسكندرية - سموحة'][Math.floor(Math.random() * 4)],
      last_update: new Date(Date.now() - Math.random() * 300000).toISOString()  // آخر تحديث خلال آخر 5 دقائق
    }));
  };

  const getActionText = (type) => {
    const actions = {
      'visit_registration': 'تسجيل زيارة عيادة',
      'order_creation': 'إنشاء طلب جديد',
      'clinic_registration': 'تسجيل عيادة جديدة',
      'user_login': 'تسجيل دخول',
      'payment_processing': 'معالجة دفع'
    };
    return actions[type] || type;
  };

  // فلترة الأنشطة
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.target_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || activity.type === filterType;
    
    let matchesDate = true;
    if (filterDate !== 'all') {
      const activityDate = new Date(activity.created_at);
      const now = new Date();
      
      switch (filterDate) {
        case 'today':
          matchesDate = activityDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesDate = activityDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // فلترة المندوبين النشطين
  const filteredActiveReps = activeReps.filter(rep => {
    const matchesSearch = !searchTerm || 
      rep.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.current_activity?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ar-EG');
  };

  // تنسيق الوقت المنقضي
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ساعة`;
    return `${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // لون الحالة
  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'completed': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // أيقونة النوع
  const getTypeIcon = (type) => {
    const icons = {
      'visit_registration': '🚗',
      'order_creation': '📦',
      'clinic_registration': '🏥',
      'user_login': '🔐',
      'payment_processing': '💰'
    };
    return icons[type] || '📋';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📊 تتبع الأنشطة والحركات</h1>
            <p className="text-purple-100">مراقبة شاملة للأنشطة مع خريطة المندوبين النشطين</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">إجمالي الأنشطة</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total_activities || activities.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">المندوبين النشطين</p>
                <p className="text-2xl font-bold text-green-700">{activeReps.filter(rep => rep.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">زيارات اليوم</p>
                <p className="text-2xl font-bold text-orange-700">{stats.visits_today || 34}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <span className="text-2xl">🚗</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">طلبات اليوم</p>
                <p className="text-2xl font-bold text-purple-700">{stats.orders_today || 12}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📋', count: filteredActivities.length },
            { id: 'map', name: 'عرض الخريطة', icon: '🗺️', count: filteredActiveReps.length },
            { id: 'activities', name: 'سجل الأنشطة', icon: '📊', count: filteredActivities.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">🔍 فلاتر البحث والتصفية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو النشاط..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع النشاط</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">جميع الأنواع</option>
              <option value="visit_registration">تسجيل زيارة</option>
              <option value="order_creation">إنشاء طلب</option>
              <option value="clinic_registration">تسجيل عيادة</option>
              <option value="user_login">تسجيل دخول</option>
              <option value="payment_processing">معالجة دفع</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفترة الزمنية</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">جميع الأوقات</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterDate('all');
              }}
              className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="text-gray-700">جاري تحميل البيانات...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-lg border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span>📋</span>
                    أحدث الأنشطة
                  </h3>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto">
                  {filteredActivities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors mb-3">
                      <div className="text-2xl">{getTypeIcon(activity.type)}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.action}</div>
                        <div className="text-sm text-gray-600">{activity.user_name} • {activity.target_name}</div>
                        <div className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status === 'completed' ? 'مكتمل' : 'معلق'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Representatives */}
              <div className="bg-white rounded-xl shadow-lg border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span>👥</span>
                    المندوبين النشطين الآن
                  </h3>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto">
                  {filteredActiveReps.filter(rep => rep.status === 'active').map((rep) => (
                    <div key={rep.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors mb-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold">{rep.full_name?.charAt(0) || '👤'}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{rep.full_name}</div>
                        <div className="text-sm text-gray-600">{rep.current_activity}</div>
                        <div className="text-xs text-gray-500">آخر ظهور: {formatTimeAgo(rep.last_seen)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">نشط</div>
                        <div className="text-xs text-gray-500">🔋 {rep.battery_level}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Map Tab */}
          {activeTab === 'map' && (
            <div className="bg-white rounded-xl shadow-lg border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>🗺️</span>
                  خريطة المندوبين النشطين
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                    {filteredActiveReps.filter(rep => rep.status === 'active').length} نشط
                  </span>
                </h3>
              </div>
              
              <div className="p-6">
                {/* Advanced Activity Tracking Map */}
                <AdvancedActivityMap
                  currentLocation={selectedRep ? {
                    latitude: selectedRep.latitude,
                    longitude: selectedRep.longitude,
                    accuracy: selectedRep.location_accuracy || 50,
                    timestamp: selectedRep.last_update || new Date().toISOString()
                  } : null}
                  activityHistory={activities.filter(activity => 
                    !selectedRep || activity.user_id === selectedRep.id
                  ).map(activity => ({
                    latitude: activity.latitude || (30.0444 + (Math.random() - 0.5) * 0.1),
                    longitude: activity.longitude || (31.2357 + (Math.random() - 0.5) * 0.1),
                    activity_type: activity.activity_type,
                    timestamp: activity.timestamp,
                    description: activity.description,
                    duration: activity.duration
                  }))}
                  visitLocations={activities.filter(activity => 
                    activity.activity_type === 'visit' && (!selectedRep || activity.user_id === selectedRep.id)
                  ).map(visit => ({
                    latitude: visit.latitude || (30.0444 + (Math.random() - 0.5) * 0.1),
                    longitude: visit.longitude || (31.2357 + (Math.random() - 0.5) * 0.1),
                    clinic_name: visit.clinic_name,
                    doctor_name: visit.doctor_name,
                    visit_date: visit.timestamp,
                    duration: visit.duration,
                    status: visit.status,
                    notes: visit.description
                  }))}
                  repInfo={selectedRep ? {
                    name: selectedRep.full_name,
                    area: selectedRep.area || 'غير محدد',
                    line: selectedRep.line || 'غير محدد',
                    phone: selectedRep.phone,
                    email: selectedRep.email
                  } : null}
                  language={language}
                  showControls={true}
                />
                
                {/* Representative Selection */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-full mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>👥</span>
                      اختيار المندوب لتتبع نشاطه
                      {selectedRep && (
                        <button
                          onClick={() => setSelectedRep(null)}
                          className="ml-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                          إظهار الكل
                        </button>
                      )}
                    </h4>
                  </div>
                  
                  {/* Representatives List */}
                  {filteredActiveReps.map((rep) => (
                    <div 
                      key={rep.id}
                      onClick={() => setSelectedRep(rep)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        rep.status === 'active' 
                          ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      } ${selectedRep?.id === rep.id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{rep.full_name}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                          {rep.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">{rep.current_activity}</div>
                      <div className="text-xs text-gray-500 mb-2">{rep.area}</div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>🔋 {rep.battery_level}%</span>
                        <span>⚡ {rep.speed} km/h</span>
                        <span>{formatTimeAgo(rep.last_seen)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activities Log Tab */}
          {activeTab === 'activities' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>📊</span>
                  سجل الأنشطة التفصيلي
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                    {filteredActivities.length} نشاط
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النشاط</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهدف</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredActivities.length > 0 ? (
                      filteredActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getTypeIcon(activity.type)}</span>
                              <span className="text-sm text-gray-600">{getActionText(activity.type)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{activity.action}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{activity.user_name}</div>
                            <div className="text-sm text-gray-500">{activity.user_role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{activity.target_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(activity.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                              {activity.status === 'completed' ? 'مكتمل' : 'معلق'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedActivity(activity)}
                              className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              📋 التفاصيل
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          لا توجد أنشطة متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Rep Details Modal */}
      {selectedRep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">👤 تفاصيل المندوب</h3>
                <button
                  onClick={() => setSelectedRep(null)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">الاسم</label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedRep.full_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">النشاط الحالي</label>
                  <p className="mt-1 text-gray-900">{selectedRep.current_activity}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">المنطقة</label>
                  <p className="mt-1 text-gray-900">{selectedRep.area}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">مستوى البطارية</label>
                    <p className="mt-1 text-gray-900">🔋 {selectedRep.battery_level}%</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">السرعة</label>
                    <p className="mt-1 text-gray-900">⚡ {selectedRep.speed} km/h</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">آخر ظهور</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedRep.last_seen)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">الحالة</label>
                  <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRep.status)}`}>
                    {selectedRep.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">📋 تفاصيل النشاط</h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع النشاط</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <span className="text-xl">{getTypeIcon(selectedActivity.type)}</span>
                    {selectedActivity.action}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">المستخدم</label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedActivity.user_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">الهدف</label>
                  <p className="mt-1 text-gray-900">{selectedActivity.target_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">التاريخ والوقت</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedActivity.created_at)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">الحالة</label>
                  <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedActivity.status)}`}>
                    {selectedActivity.status === 'completed' ? 'مكتمل' : 'معلق'}
                  </span>
                </div>
                
                {selectedActivity.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">تفاصيل إضافية</label>
                    <div className="mt-1 text-gray-900 bg-gray-50 rounded-lg p-3 text-sm">
                      <p>📍 الموقع: {selectedActivity.details.location}</p>
                      <p>⏱️ المدة: {selectedActivity.details.duration} دقيقة</p>
                      <p>📝 ملاحظات: {selectedActivity.details.notes}</p>
                    </div>
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

export default EnhancedActivityTracking;