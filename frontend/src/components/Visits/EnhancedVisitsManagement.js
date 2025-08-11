// Enhanced Professional Visits Management System - إدارة الزيارات المحسنة
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EnhancedVisitsManagement = ({ user, language = 'ar', theme = 'dark' }) => {
  const API_BASE = process.env.REACT_APP_BACKEND_URL;
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [visits, setVisits] = useState([]);
  const [dashboardData, setDashboardData] = useState({});
  const [availableClinics, setAvailableClinics] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Enhanced form state with all required fields
  const [newVisit, setNewVisit] = useState({
    clinic_id: '',
    clinic_name: '',
    clinic_classification: '',
    credit_classification: '',
    visit_type: 'routine',
    scheduled_date: '',
    scheduled_time: '',
    visit_purpose: '',
    doctor_name: '',
    estimated_duration: 30, // minutes
    priority_level: 'normal',
    visit_notes: ''
  });

  // Initialize with current date and time
  useEffect(() => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);
    
    setNewVisit(prev => ({
      ...prev,
      scheduled_date: currentDate,
      scheduled_time: currentTime
    }));
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    loadVisits();
    loadRealClinics();
    loadUsers();
  }, []);

  // Check user permissions
  const canViewAllVisits = () => {
    const role = user?.role?.toLowerCase();
    return ['admin', 'gm', 'line_manager', 'area_manager'].includes(role);
  };

  const canCreateVisits = () => {
    const role = user?.role?.toLowerCase();
    return ['admin', 'gm', 'line_manager', 'area_manager', 'medical_rep'].includes(role);
  };

  // Load dashboard data with permissions
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '/visits/dashboard/overview';
      if (!canViewAllVisits()) {
        endpoint = `/visits/dashboard/overview?user_id=${user?.user_id}`;
      }
      
      const response = await axios.get(`${API_BASE}${endpoint}`, { headers });
      
      if (response.data.success) {
        setDashboardData(response.data.overview || {});
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load visits based on user permissions
  const loadVisits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '/visits/';
      if (!canViewAllVisits()) {
        endpoint = `/visits/?assigned_to=${user?.user_id}`;
      }
      
      const response = await axios.get(`${API_BASE}${endpoint}`, { headers });
      
      if (response.data.success) {
        setVisits(response.data.visits || []);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load real registered clinics with full details
  const loadRealClinics = async () => {
    try {
      console.log('🔍 بدء تحميل العيادات الحقيقية من قاعدة البيانات...');
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_BASE}/clinics`, { headers });
      console.log('📊 استجابة العيادات:', response.data);
      
      // Handle only REAL database data - no dummy/fake data allowed
      let realClinicsData = [];
      
      if (response.data && Array.isArray(response.data)) {
        realClinicsData = response.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.clinics)) {
        realClinicsData = response.data.clinics;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        realClinicsData = response.data.data;
      }
      
      // Filter ONLY active clinics from the real database
      const activeClinics = realClinicsData.filter(clinic => {
        // Only include real registered clinics that are active
        return clinic.is_active !== false && clinic.id && clinic.name;
      });
      
      console.log('🏥 العيادات الحقيقية النشطة:', activeClinics);
      console.log(`📈 تم العثور على ${activeClinics.length} عيادة حقيقية في قاعدة البيانات`);
      
      // Process real clinic data to match our interface
      const processedClinics = activeClinics.map(clinic => ({
        id: clinic.id,
        name: clinic.name || clinic.clinic_name,
        clinic_name: clinic.name || clinic.clinic_name,
        doctor_name: clinic.doctor_name || clinic.owner_name || 'غير محدد',
        address: clinic.address || clinic.location || 'العنوان غير متوفر',
        phone: clinic.phone || clinic.clinic_phone,
        email: clinic.email || clinic.clinic_email,
        classification: clinic.classification || 'class_b',
        credit_classification: clinic.credit_classification || 'yellow',
        is_active: clinic.is_active,
        line_id: clinic.line_id,
        area_id: clinic.area_id,
        // GPS coordinates if available
        clinic_latitude: clinic.clinic_latitude,
        clinic_longitude: clinic.clinic_longitude,
        // Registration info
        created_at: clinic.created_at,
        registered_by: clinic.registered_by
      }));
      
      setAvailableClinics(processedClinics);
      
      if (processedClinics.length === 0) {
        console.log('⚠️ لا توجد عيادات حقيقية مسجلة في قاعدة البيانات');
      } else {
        console.log(`✅ تم تحميل ${processedClinics.length} عيادة حقيقية بنجاح`);
        processedClinics.forEach((clinic, index) => {
          console.log(`   ${index + 1}. ${clinic.name} - د. ${clinic.doctor_name} (ID: ${clinic.id})`);
        });
      }
      
    } catch (error) {
      console.error('❌ خطأ في تحميل العيادات الحقيقية:', error);
      // Don't create fallback fake data - show empty state instead
      setAvailableClinics([]);
    }
  };

  // Load users for team filtering
  const loadUsers = async () => {
    try {
      if (!canViewAllVisits()) return;
      
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_BASE}/users`, { headers });
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Create new visit
  const createVisit = async () => {
    try {
      if (!newVisit.clinic_id || !newVisit.visit_purpose) {
        alert('يرجى اختيار العيادة وتحديد الغرض من الزيارة');
        return;
      }

      const token = localStorage.getItem('access_token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Combine date and time
      const scheduledDateTime = `${newVisit.scheduled_date}T${newVisit.scheduled_time}:00`;
      
      const visitData = {
        ...newVisit,
        scheduled_date: scheduledDateTime,
        assigned_to: user?.user_id,
        created_by: user?.user_id,
        status: 'planned'
      };

      const response = await axios.post(`${API_BASE}/visits/`, visitData, { headers });
      
      if (response.data.success) {
        alert('تم إنشاء الزيارة بنجاح');
        setShowCreateModal(false);
        resetForm();
        loadVisits();
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('حدث خطأ أثناء إنشاء الزيارة');
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);
    
    setNewVisit({
      clinic_id: '',
      clinic_name: '',
      clinic_classification: '',
      credit_classification: '',
      visit_type: 'routine',
      scheduled_date: currentDate,
      scheduled_time: currentTime,
      visit_purpose: '',
      doctor_name: '',
      estimated_duration: 30,
      priority_level: 'normal',
      visit_notes: ''
    });
  };

  // Handle clinic selection
  const handleClinicSelect = (clinic) => {
    setNewVisit(prev => ({
      ...prev,
      clinic_id: clinic.id,
      clinic_name: clinic.name || clinic.clinic_name,
      clinic_classification: clinic.classification || 'class_b',
      credit_classification: clinic.credit_classification || 'yellow',
      doctor_name: clinic.doctor_name || ''
    }));
  };

  // Get classification badge color
  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'class_a': return 'bg-emerald-500';
      case 'class_b': return 'bg-blue-500';
      case 'class_c': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getCreditColor = (credit) => {
    switch (credit) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white">🏥 إدارة الزيارات المحسنة</h1>
          <p className="text-blue-200 mt-1">نظام إدارة زيارات احترافي مع صلاحيات متقدمة</p>
        </div>
        
        {canCreateVisits() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            ➕ زيارة جديدة
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-6 bg-black/10">
        {['dashboard', 'visits', 'calendar'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            {tab === 'dashboard' && '📊 لوحة التحكم'}
            {tab === 'visits' && '📋 الزيارات'}
            {tab === 'calendar' && '📅 التقويم'}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">زيارات اليوم</p>
                  <p className="text-2xl font-bold">{dashboardData.today || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-green-200 text-sm">مكتملة</p>
                  <p className="text-2xl font-bold">{dashboardData.completed || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <div>
                  <p className="text-amber-200 text-sm">قيد التنفيذ</p>
                  <p className="text-2xl font-bold">{dashboardData.in_progress || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-purple-200 text-sm">إجمالي الشهر</p>
                  <p className="text-2xl font-bold">{dashboardData.this_month || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visits Tab */}
      {activeTab === 'visits' && (
        <div className="p-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="text-right p-4 text-blue-200">رقم الزيارة</th>
                    <th className="text-right p-4 text-blue-200">العيادة</th>
                    <th className="text-right p-4 text-blue-200">التصنيف</th>
                    <th className="text-right p-4 text-blue-200">التاريخ</th>
                    <th className="text-right p-4 text-blue-200">الحالة</th>
                    <th className="text-right p-4 text-blue-200">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit, index) => (
                    <tr key={visit.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="p-4">#{visit.visit_number || (index + 1)}</td>
                      <td className="p-4">{visit.clinic_name}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <span className={`w-3 h-3 rounded-full ${getClassificationColor(visit.clinic_classification)}`}></span>
                          <span className={`w-3 h-3 rounded-full ${getCreditColor(visit.credit_classification)}`}></span>
                        </div>
                      </td>
                      <td className="p-4">{new Date(visit.scheduled_date).toLocaleDateString('ar-EG')}</td>
                      <td className="p-4">
                        <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm">
                          {visit.status === 'planned' && 'مجدولة'}
                          {visit.status === 'in_progress' && 'جارية'}
                          {visit.status === 'completed' && 'مكتملة'}
                          {visit.status === 'cancelled' && 'ملغاة'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm">
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visits.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-gray-400">
                        لا توجد زيارات حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Create Visit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-screen overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">✨ إنشاء زيارة جديدة</h2>
              <p className="text-slate-300 mt-1">نموذج شامل لجدولة الزيارات مع ربط احترافي</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h4 className="text-yellow-300 font-semibold mb-2">🔍 معلومات Debug:</h4>
                  <p className="text-sm text-slate-300">عدد العيادات المتاحة: {availableClinics.length}</p>
                  <p className="text-sm text-slate-300">API Base: {API_BASE}</p>
                  {availableClinics.length > 0 && (
                    <p className="text-sm text-slate-300">أول عيادة: {availableClinics[0].name || availableClinics[0].clinic_name}</p>
                  )}
                </div>
              )}

              {/* Clinic Selection - Card Style */}
              <div>
                <label className="block text-white font-semibold mb-4 text-lg">
                  🏥 اختيار العيادة * <span className="text-sm text-slate-400">({availableClinics.length} عيادة متاحة)</span>
                </label>
                
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-300">جاري تحميل العيادات...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {availableClinics.map((clinic) => (
                      <div
                        key={clinic.id}
                        onClick={() => handleClinicSelect(clinic)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          newVisit.clinic_id === clinic.id
                            ? 'border-blue-400 bg-blue-500/20 scale-105 shadow-lg'
                            : 'border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-lg">
                              {clinic.name || clinic.clinic_name}
                            </h4>
                            <p className="text-slate-300 text-sm mt-1">
                              د. {clinic.doctor_name || 'غير محدد'}
                            </p>
                            <p className="text-slate-400 text-xs mt-2">
                              {clinic.address || 'العنوان غير متوفر'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              <span 
                                className={`w-4 h-4 rounded-full ${getClassificationColor(clinic.classification)}`}
                                title={`تصنيف: ${clinic.classification}`}
                              ></span>
                              <span 
                                className={`w-4 h-4 rounded-full ${getCreditColor(clinic.credit_classification)}`}
                                title={`ائتماني: ${clinic.credit_classification}`}
                              ></span>
                            </div>
                            {newVisit.clinic_id === clinic.id && (
                              <span className="text-blue-400 text-2xl">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {availableClinics.length === 0 && (
                      <div className="col-span-2 p-8 text-center">
                        <div className="text-6xl mb-4">🏥</div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">لا توجد عيادات متاحة</h3>
                        <p className="text-slate-400 mb-4">لم يتم العثور على عيادات مسجلة في النظام</p>
                        <button 
                          onClick={loadRealClinics}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          🔄 إعادة تحميل العيادات
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Clinic Info */}
              {newVisit.clinic_id && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-blue-300 font-semibold mb-2">✅ العيادة المختارة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">الاسم:</span>
                      <span className="text-white font-medium mr-2">{newVisit.clinic_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">التصنيف:</span>
                      <span className={`mr-2 px-2 py-1 rounded text-xs font-medium ${getClassificationColor(newVisit.clinic_classification)} text-white`}>
                        {newVisit.clinic_classification}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">الائتماني:</span>
                      <span className={`mr-2 px-2 py-1 rounded text-xs font-medium ${getCreditColor(newVisit.credit_classification)} text-white`}>
                        {newVisit.credit_classification}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visit Type Selection - Card Style */}
              <div>
                <label className="block text-white font-semibold mb-4 text-lg">
                  📋 نوع الزيارة *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'routine', label: 'روتينية', icon: '🔄', color: 'blue' },
                    { value: 'follow_up', label: 'متابعة', icon: '📍', color: 'green' },
                    { value: 'collection', label: 'تحصيل', icon: '💰', color: 'amber' },
                    { value: 'presentation', label: 'عرض', icon: '📊', color: 'purple' },
                    { value: 'complaint', label: 'شكوى', icon: '⚠️', color: 'red' },
                    { value: 'emergency', label: 'طارئة', icon: '🚨', color: 'rose' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewVisit(prev => ({ ...prev, visit_type: type.value }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                        newVisit.visit_type === type.value
                          ? `border-${type.color}-400 bg-${type.color}-500/20 scale-105`
                          : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="font-medium text-white text-sm">{type.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">📅 التاريخ *</label>
                  <input
                    type="date"
                    value={newVisit.scheduled_date}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">⏰ الوقت *</label>
                  <input
                    type="time"
                    value={newVisit.scheduled_time}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Visit Purpose */}
              <div>
                <label className="block text-white font-semibold mb-2">🎯 الغرض من الزيارة *</label>
                <textarea
                  value={newVisit.visit_purpose}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, visit_purpose: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="اشرح الهدف من هذه الزيارة بالتفصيل..."
                />
              </div>

              {/* Priority and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">⚡ أولوية الزيارة</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'low', label: 'منخفضة', color: 'gray' },
                      { value: 'normal', label: 'عادية', color: 'blue' },
                      { value: 'high', label: 'عالية', color: 'amber' },
                      { value: 'urgent', label: 'عاجلة', color: 'red' }
                    ].map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setNewVisit(prev => ({ ...prev, priority_level: priority.value }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          newVisit.priority_level === priority.value
                            ? `bg-${priority.color}-500 text-white`
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">⏱️ المدة المتوقعة (دقيقة)</label>
                  <input
                    type="number"
                    value={newVisit.estimated_duration}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="15"
                    max="180"
                  />
                </div>
              </div>

              {/* Visit Notes */}
              <div>
                <label className="block text-white font-semibold mb-2">📝 ملاحظات إضافية</label>
                <textarea
                  value={newVisit.visit_notes}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, visit_notes: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="أي ملاحظات أو تعليمات خاصة بالزيارة..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-slate-300 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all duration-200"
              >
                إلغاء
              </button>
              <button
                onClick={createVisit}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                ✨ إنشاء الزيارة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 flex items-center gap-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-white">جاري التحميل...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVisitsManagement;