import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VisitsManagement = () => {
  // تحديد API URL
  const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [visits, setVisits] = useState([]);
  const [availableClinics, setAvailableClinics] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateVisitModal, setShowCreateVisitModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);  // إضافة حالة سجل الدخول
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);  // حالة التحميل
  
  // Form states
  const [newVisit, setNewVisit] = useState({
    clinic_id: '',
    visit_type: 'routine',
    scheduled_date: '',
    visit_purpose: '',
    doctor_id: ''
  });

  const [visitFilters, setVisitFilters] = useState({
    status: '',
    visit_type: '',
    clinic_id: '',
    start_date: '',
    end_date: ''
  });

  const [checkInData, setCheckInData] = useState({
    gps_latitude: null,
    gps_longitude: null,
    notes: ''
  });

  const [completionData, setCompletionData] = useState({
    visit_outcome: '',
    doctor_feedback: '',
    visit_effectiveness: 5,
    doctor_satisfaction: 5,
    products_presented: [],
    samples_provided: [],
    next_visit_suggestions: '',
    follow_up_required: false
  });

  useEffect(() => {
    loadDashboardData();
    loadVisits();
    loadAvailableClinics();
    loadLoginLogs();  // إضافة تحميل سجل الدخول
  }, []);

  // دالة تحميل سجل الدخول
  const loadLoginLogs = async () => {
    try {
      setLoginLogsLoading(true);
      const response = await axios.get(`${API}/visits/login-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (response.data.success) {
        setLoginLogs(response.data.login_logs || []);
      }
    } catch (error) {
      console.error('Error loading login logs:', error);
      // في حالة الخطأ، عرض رسالة للمستخدم
      if (error.response?.status === 403) {
        console.warn('Access denied to login logs - user may not have admin privileges');
      }
    } finally {
      setLoginLogsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/visits/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.overview);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadVisits = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const params = new URLSearchParams();
      
      Object.entries(visitFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${backendUrl}/api/visits/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.success) {
        setVisits(response.data.visits);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableClinics = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/visits/available-clinics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.success) {
        setAvailableClinics(response.data.available_clinics);
      }
    } catch (error) {
      console.error('Error loading available clinics:', error);
    }
  };

  const createVisit = async () => {
    try {
      if (!newVisit.clinic_id || !newVisit.scheduled_date || !newVisit.visit_purpose) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/visits/`, {
        ...newVisit,
        scheduled_date: new Date(newVisit.scheduled_date).toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        alert('تم إنشاء الزيارة بنجاح');
        setShowCreateVisitModal(false);
        setNewVisit({
          clinic_id: '',
          visit_type: 'routine',
          scheduled_date: '',
          visit_purpose: '',
          doctor_id: ''
        });
        loadVisits();
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('حدث خطأ أثناء إنشاء الزيارة');
    }
  };

  const checkInVisit = async (visitId) => {
    try {
      if (!checkInData.gps_latitude || !checkInData.gps_longitude) {
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
            const response = await axios.post(`${backendUrl}/api/visits/check-in`, {
              visit_id: visitId,
              gps_latitude: lat,
              gps_longitude: lng,
              notes: checkInData.notes
            }, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.data.success) {
              alert('تم تسجيل الدخول للزيارة بنجاح');
              loadVisits();
              loadDashboardData();
            }
          }, (error) => {
            alert('يرجى السماح بالوصول للموقع الجغرافي');
          });
        } else {
          alert('المتصفح لا يدعم تحديد الموقع الجغرافي');
        }
      }
    } catch (error) {
      console.error('Error checking in visit:', error);
      alert('حدث خطأ أثناء تسجيل الدخول للزيارة');
    }
  };

  const completeVisit = async (visitId) => {
    try {
      if (!completionData.visit_outcome) {
        alert('يرجى ملء نتيجة الزيارة');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/visits/complete`, {
        visit_id: visitId,
        ...completionData
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        alert('تم إنهاء الزيارة بنجاح');
        setSelectedVisit(null);
        setCompletionData({
          visit_outcome: '',
          doctor_feedback: '',
          visit_effectiveness: 5,
          doctor_satisfaction: 5,
          products_presented: [],
          samples_provided: [],
          next_visit_suggestions: '',
          follow_up_required: false
        });
        loadVisits();
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error completing visit:', error);
      alert('حدث خطأ أثناء إنهاء الزيارة');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'planned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      'planned': 'مجدولة',
      'in_progress': 'جارية',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getVisitTypeBadge = (type) => {
    const typeColors = {
      'routine': 'bg-green-100 text-green-800',
      'follow_up': 'bg-blue-100 text-blue-800',
      'collection': 'bg-orange-100 text-orange-800',
      'presentation': 'bg-purple-100 text-purple-800',
      'complaint': 'bg-red-100 text-red-800',
      'emergency': 'bg-pink-100 text-pink-800'
    };
    
    const typeLabels = {
      'routine': 'روتينية',
      'follow_up': 'متابعة',
      'collection': 'تحصيل',
      'presentation': 'عرض',
      'complaint': 'شكوى',
      'emergency': 'طارئة'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              إدارة الزيارات
            </h1>
            <p className="text-gray-600">
              إدارة وتتبع زيارات المناديب للعيادات
            </p>
          </div>
          <button
            onClick={() => setShowCreateVisitModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>+</span>
            زيارة جديدة
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
              { id: 'visits', label: 'الزيارات', icon: '🏥' },
              { id: 'clinics', label: 'العيادات المتاحة', icon: '🏢' },
              { id: 'login_logs', label: 'سجل تسجيل الدخول', icon: '🔐' }
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
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Today's Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">زيارات اليوم</p>
                      <p className="text-2xl font-bold">{dashboardData.today?.total_visits || 0}</p>
                      <p className="text-sm text-blue-100">مكتمل: {dashboardData.today?.completed || 0}</p>
                    </div>
                    <div className="text-3xl opacity-80">📅</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">هذا الأسبوع</p>
                      <p className="text-2xl font-bold">{dashboardData.this_week?.total_visits || 0}</p>
                      <p className="text-sm text-green-100">
                        {dashboardData.this_week?.completion_rate || 0}% إنجاز
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">📊</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">هذا الشهر</p>
                      <p className="text-2xl font-bold">{dashboardData.this_month?.total_visits || 0}</p>
                      <p className="text-sm text-purple-100">
                        {dashboardData.this_month?.completion_rate || 0}% إنجاز
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">📈</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">متوسط المدة</p>
                      <p className="text-2xl font-bold">{dashboardData.performance?.average_visit_duration || 0}</p>
                      <p className="text-sm text-orange-100">دقيقة</p>
                    </div>
                    <div className="text-3xl opacity-80">⏱️</div>
                  </div>
                </div>
              </div>

              {/* Upcoming Visits */}
              {dashboardData.upcoming_visits && dashboardData.upcoming_visits.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">الزيارات القادمة</h3>
                  <div className="space-y-3">
                    {dashboardData.upcoming_visits.map((visit) => (
                      <div key={visit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{visit.clinic_name}</p>
                          <p className="text-sm text-gray-600">{visit.visit_purpose}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(visit.scheduled_date).toLocaleDateString('ar-EG')}
                          </p>
                          {getVisitTypeBadge(visit.visit_type)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <select 
                  value={visitFilters.status}
                  onChange={(e) => setVisitFilters({...visitFilters, status: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">جميع الحالات</option>
                  <option value="planned">مجدولة</option>
                  <option value="in_progress">جارية</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
                
                <select 
                  value={visitFilters.visit_type}
                  onChange={(e) => setVisitFilters({...visitFilters, visit_type: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">جميع الأنواع</option>
                  <option value="routine">روتينية</option>
                  <option value="follow_up">متابعة</option>
                  <option value="collection">تحصيل</option>
                  <option value="presentation">عرض</option>
                </select>
                
                <input
                  type="date"
                  value={visitFilters.start_date}
                  onChange={(e) => setVisitFilters({...visitFilters, start_date: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                
                <input
                  type="date"
                  value={visitFilters.end_date}
                  onChange={(e) => setVisitFilters({...visitFilters, end_date: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                
                <button
                  onClick={loadVisits}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  بحث
                </button>
              </div>

              {/* Visits Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رقم الزيارة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          العيادة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          النوع
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          التاريخ المجدول
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {visit.visit_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visit.clinic_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getVisitTypeBadge(visit.visit_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(visit.scheduled_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(visit.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {visit.status === 'planned' && (
                              <button
                                onClick={() => checkInVisit(visit.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                تسجيل دخول
                              </button>
                            )}
                            {visit.status === 'in_progress' && (
                              <button
                                onClick={() => setSelectedVisit(visit)}
                                className="text-green-600 hover:text-green-900"
                              >
                                إنهاء الزيارة
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableClinics.map((clinic) => (
                  <div key={clinic.id} className="bg-white border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{clinic.name}</h3>
                        <p className="text-sm text-gray-600">{clinic.area_name}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        clinic.assignment_type === 'assigned' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {clinic.assignment_type === 'assigned' ? 'مخصص' : 'متاح'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>الطبيب:</strong> {clinic.doctor_name || 'غير محدد'}</p>
                      <p><strong>آخر زيارة:</strong> {
                        clinic.last_visit_date 
                          ? new Date(clinic.last_visit_date).toLocaleDateString('ar-EG')
                          : 'لا توجد زيارات سابقة'
                      }</p>
                      <p><strong>إجمالي الزيارات:</strong> {clinic.total_visits}</p>
                      <p><strong>العنوان:</strong> {clinic.address}</p>
                      {clinic.phone && <p><strong>الهاتف:</strong> {clinic.phone}</p>}
                    </div>
                    
                    {clinic.has_visit_today && (
                      <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          ⚠️ لديك زيارة مجدولة اليوم لهذه العيادة
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {availableClinics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد عيادات متاحة
                </div>
              )}
            </div>
          )}

          {activeTab === 'login_logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">سجل تسجيل الدخول</h2>
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
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  log.role === 'admin' ? 'bg-red-100 text-red-800' :
                                  log.role === 'gm' ? 'bg-purple-100 text-purple-800' :
                                  log.role === 'medical_rep' ? 'bg-green-100 text-green-800' :
                                  log.role === 'sales_rep' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {log.role === 'admin' ? 'أدمن' :
                                   log.role === 'gm' ? 'مدير عام' :
                                   log.role === 'medical_rep' ? 'مندوب طبي' :
                                   log.role === 'sales_rep' ? 'مندوب مبيعات' :
                                   log.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(log.login_time).toLocaleString('ar-EG', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
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
                                          // فتح خريطة Google Maps بالموقع
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
                                    {/* خريطة مصغرة مدمجة */}
                                    <div className="w-24 h-16 bg-gray-100 rounded border overflow-hidden">
                                      <iframe
                                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${log.latitude},${log.longitude}&zoom=15`}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title={`موقع تسجيل الدخول - ${log.username}`}
                                      />
                                    </div>
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

      {/* Create Visit Modal */}
      {showCreateVisitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إنشاء زيارة جديدة</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العيادة</label>
                <select
                  value={newVisit.clinic_id}
                  onChange={(e) => setNewVisit({...newVisit, clinic_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">اختر العيادة</option>
                  {availableClinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name} - {clinic.area_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الزيارة</label>
                <select
                  value={newVisit.visit_type}
                  onChange={(e) => setNewVisit({...newVisit, visit_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="routine">روتينية</option>
                  <option value="follow_up">متابعة</option>
                  <option value="collection">تحصيل</option>
                  <option value="presentation">عرض منتجات</option>
                  <option value="complaint">حل شكوى</option>
                  <option value="emergency">طارئة</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ والوقت</label>
                <input
                  type="datetime-local"
                  value={newVisit.scheduled_date}
                  onChange={(e) => setNewVisit({...newVisit, scheduled_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الغرض من الزيارة</label>
                <textarea
                  value={newVisit.visit_purpose}
                  onChange={(e) => setNewVisit({...newVisit, visit_purpose: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="اذكر الغرض من الزيارة..."
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowCreateVisitModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={createVisit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                إنشاء الزيارة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Visit Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">إنهاء الزيارة - {selectedVisit.clinic_name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نتيجة الزيارة *</label>
                <textarea
                  value={completionData.visit_outcome}
                  onChange={(e) => setCompletionData({...completionData, visit_outcome: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="اذكر النتائج المحققة من الزيارة..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تعليقات الطبيب</label>
                <textarea
                  value={completionData.doctor_feedback}
                  onChange={(e) => setCompletionData({...completionData, doctor_feedback: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="أي تعليقات أو ملاحظات من الطبيب..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تقييم فعالية الزيارة</label>
                  <select
                    value={completionData.visit_effectiveness}
                    onChange={(e) => setCompletionData({...completionData, visit_effectiveness: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={5}>ممتاز (5)</option>
                    <option value={4}>جيد جداً (4)</option>
                    <option value={3}>جيد (3)</option>
                    <option value={2}>مقبول (2)</option>
                    <option value={1}>ضعيف (1)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رضا الطبيب</label>
                  <select
                    value={completionData.doctor_satisfaction}
                    onChange={(e) => setCompletionData({...completionData, doctor_satisfaction: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={5}>راضٍ جداً (5)</option>
                    <option value={4}>راضٍ (4)</option>
                    <option value={3}>محايد (3)</option>
                    <option value={2}>غير راضٍ (2)</option>
                    <option value={1}>غير راضٍ جداً (1)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اقتراحات للزيارة القادمة</label>
                <textarea
                  value={completionData.next_visit_suggestions}
                  onChange={(e) => setCompletionData({...completionData, next_visit_suggestions: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-16"
                  placeholder="أي اقتراحات للزيارة القادمة..."
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={completionData.follow_up_required}
                    onChange={(e) => setCompletionData({...completionData, follow_up_required: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">تحتاج متابعة قريبة</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => completeVisit(selectedVisit.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                إنهاء الزيارة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsManagement;