// Visit Management System - نظام إدارة الزيارات المحسن
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import { activityLogger } from '../../utils/activityLogger.js';
import NewVisitForm from './NewVisitForm.js';
import axios from 'axios';

const VisitManagement = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('visits');
  const [visits, setVisits] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';
  
  // Check user permissions for GPS viewing
  const canViewGPS = ['admin', 'gm'].includes(user?.role);
  const canViewAllVisits = ['admin', 'gm', 'district_manager', 'manager'].includes(user?.role);

  useEffect(() => {
    fetchVisitData();
    if (canViewAllVisits) {
      fetchLoginLogs();
    }
    
    // Log section access
    activityLogger.logSystemAccess('إدارة الزيارات', {
      previousSection: sessionStorage.getItem('previousSection') || '',
      accessMethod: 'navigation',
      userRole: user?.role,
      canViewGPS: canViewGPS
    });
    
    sessionStorage.setItem('previousSection', 'إدارة الزيارات');
  }, []);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch visits based on user role
      let visitsUrl = `${API}/visits`;
      if (!canViewAllVisits) {
        // Medical reps only see their own visits
        visitsUrl += `?rep_id=${user.id}`;
      }
      
      const response = await axios.get(visitsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVisits(response.data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
      // Mock data for development
      setVisits([
        {
          id: 'visit-001',
          clinic_name: 'عيادة الدكتور أحمد محمد',
          doctor_name: 'د. أحمد محمد علي',
          medical_rep_name: 'محمد المندوب',
          visit_date: '2024-01-15T10:30:00Z',
          visit_effectiveness: 'excellent',
          order_status: 'ordered',
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'المنصورة، مصر'
          },
          managers_notified: ['أحمد المدير', 'سارة مديرة المبيعات'],
          products_discussed: ['أموكسيسيلين 500mg', 'فيتامين د3'],
          visit_notes: 'زيارة ناجحة مع طلب منتجات جديدة',
          status: 'completed'
        },
        {
          id: 'visit-002',
          clinic_name: 'مركز النيل الطبي',
          doctor_name: 'د. فاطمة سعد',
          medical_rep_name: 'أحمد المندوب',
          visit_date: '2024-01-14T14:15:00Z',
          visit_effectiveness: 'good',
          order_status: 'interested',
          location: {
            latitude: 30.0626,
            longitude: 31.2497,
            address: 'القاهرة، مصر'
          },
          managers_notified: ['أحمد المدير'],
          products_discussed: ['أنسولين طويل المفعول'],
          visit_notes: 'الطبيب مهتم ولكن يحتاج وقت للقرار',
          status: 'completed'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/login-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLoginLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching login logs:', error);
      // Mock data
      setLoginLogs([
        {
          id: 'log-001',
          user_name: 'محمد المندوب',
          user_role: 'medical_rep',
          login_time: '2024-01-15T08:30:00Z',
          ip_address: '192.168.1.100',
          device_type: 'Mobile - Android',
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'المنصورة، مصر'
          },
          biometric_status: 'verified',
          selfie_status: 'captured'
        }
      ]);
    }
  };

  const handleNewVisit = () => {
    setShowNewVisitModal(true);
  };

  const handleVisitSaved = (newVisit) => {
    setVisits(prev => [newVisit, ...prev]);
    fetchVisitData(); // Refresh the list
  };

  const handleVisitClick = (visit) => {
    setSelectedVisit(visit);
    setShowVisitDetails(true);
  };

  const getEffectivenessColor = (effectiveness) => {
    const colors = {
      'excellent': 'bg-green-500/20 text-green-300 border-green-500/30',
      'very_good': 'bg-lime-500/20 text-lime-300 border-lime-500/30',
      'good': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'average': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'poor': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[effectiveness] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      'ordered': 'bg-green-500/20 text-green-300',
      'interested': 'bg-blue-500/20 text-blue-300',
      'considering': 'bg-yellow-500/20 text-yellow-300',
      'no_order': 'bg-red-500/20 text-red-300',
      'follow_up': 'bg-purple-500/20 text-purple-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'ordered': 'تم الطلب',
      'interested': 'مهتم',
      'considering': 'تحت الدراسة',
      'no_order': 'لا يوجد طلب',
      'follow_up': 'متابعة لاحقة'
    };
    return labels[status] || status;
  };

  const getEffectivenessLabel = (effectiveness) => {
    const labels = {
      'excellent': 'ممتازة',
      'very_good': 'جيدة جداً',
      'good': 'جيدة',
      'average': 'متوسطة',
      'poor': 'ضعيفة'
    };
    return labels[effectiveness] || effectiveness;
  };

  // Filter visits based on search and filters
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.medical_rep_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || visit.order_status === filterStatus;
    
    const matchesDate = !filterDate || visit.visit_date?.split('T')[0] === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="visit-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">🏥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة الزيارات</h1>
              <p className="text-lg opacity-75">متابعة زيارات المندوبين الطبيين للعيادات</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {user?.role === 'medical_rep' && (
              <button
                onClick={handleNewVisit}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <span>➕</span>
                زيارة جديدة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'visits' 
                ? 'bg-green-600 text-white' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            📋 سجل الزيارات
          </button>
          
          {canViewAllVisits && (
            <button
              onClick={() => setActiveTab('login-logs')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'login-logs' 
                  ? 'bg-green-600 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              🔐 سجل تسجيل الدخول
            </button>
          )}
        </div>
      </div>
      
      // Mock data for visits
      setVisits([
        {
          id: 'visit-001',
          visit_date: '2024-02-01T09:30:00Z',
          clinic_id: 'clinic-001',
          clinic_name: 'عيادة الدكتور أحمد محمد',
          doctor_name: 'د. أحمد محمد',
          rep_id: 'user-001',
          rep_name: 'محمد علي أحمد',
          visit_type: 'routine',
          status: 'completed',
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'شارع النيل، المعادي، القاهرة'
          },
          check_in_time: '2024-02-01T09:32:15Z',
          check_out_time: '2024-02-01T10:15:30Z',
          duration_minutes: 43,
          notes: 'زيارة روتينية، تم عرض المنتجات الجديدة وأخذ طلب بقيمة 850 ج.م',
          order_created: true,
          order_value: 850.00,
          approved_by: 'admin',
          approved_at: '2024-02-01T10:20:00Z'
        },
        {
          id: 'visit-002',
          visit_date: '2024-02-01T11:00:00Z',
          clinic_id: 'clinic-002',
          clinic_name: 'مركز الشفاء الطبي',
          doctor_name: 'د. فاطمة علي',
          rep_id: 'user-002',
          rep_name: 'سارة محمود',
          visit_type: 'follow_up',
          status: 'pending_approval',
          location: {
            latitude: 30.0131,
            longitude: 31.2089,
            address: 'شارع الجامعة، الجيزة'
          },
          check_in_time: '2024-02-01T11:05:22Z',
          check_out_time: '2024-02-01T11:35:10Z',
          duration_minutes: 30,
          notes: 'متابعة طلب سابق، مناقشة المنتجات الجديدة',
          order_created: false,
          order_value: 0,
          approved_by: null,
          approved_at: null
        }
      ]);

      // Mock data for login logs
      setLoginLogs([
        {
          id: 'login-001',
          user_id: 'user-001',
          user_name: 'محمد علي أحمد',
          user_role: 'medical_rep',
          login_time: '2024-02-01T08:00:00Z',
          logout_time: '2024-02-01T17:30:00Z',
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'المعادي، القاهرة'
          },
          device_info: 'Android - Chrome 119',
          ip_address: '192.168.1.100',
          biometric_verified: true,
          session_duration_hours: 9.5
        },
        {
          id: 'login-002',
          user_id: 'user-002',
          user_name: 'سارة محمود',
          user_role: 'medical_rep',
          login_time: '2024-02-01T08:30:00Z',
          logout_time: null,
          location: {
            latitude: 30.0131,
            longitude: 31.2089,
            address: 'الجيزة'
          },
          device_info: 'iPhone - Safari 17',
          ip_address: '192.168.1.101',
          biometric_verified: true,
          session_duration_hours: null
        }
      ]);

      // Mock clinics data
      setClinics([
        { id: 'clinic-001', name: 'عيادة الدكتور أحمد محمد', doctor_name: 'د. أحمد محمد' },
        { id: 'clinic-002', name: 'مركز الشفاء الطبي', doctor_name: 'د. فاطمة علي' },
        { id: 'clinic-003', name: 'عيادة النور', doctor_name: 'د. محمود سالم' }
      ]);

    } catch (error) {
      console.error('خطأ في جلب بيانات الزيارات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisit = async (visitData) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const visitPayload = {
        ...visitData,
        rep_id: user.id,
        rep_name: user.full_name || user.username,
        check_in_time: new Date().toISOString(),
        location: currentLocation,
        status: 'in_progress'
      };

      console.log('🔧 Creating visit:', visitPayload);
      
      const response = await axios.post(`${API}/visits`, visitPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Visit created successfully:', response.data);
      fetchVisitData();
      setShowVisitModal(false);
      alert('تم تسجيل الزيارة بنجاح');
    } catch (error) {
      console.error('❌ Error creating visit:', error);
      alert('حدث خطأ أثناء تسجيل الزيارة');
    }
  };

  const handleApproveVisit = async (visitId) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await axios.put(`${API}/visits/${visitId}/approve`, {
        approved_by: user.id,
        approved_at: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Visit approved:', response.data);
      fetchVisitData();
      alert('تم اعتماد الزيارة بنجاح');
    } catch (error) {
      console.error('❌ Error approving visit:', error);
      alert('حدث خطأ أثناء اعتماد الزيارة');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'in_progress': 'جارية',
      'completed': 'مكتملة',
      'pending_approval': 'في انتظار الاعتماد',
      'approved': 'معتمدة',
      'rejected': 'مرفوضة'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'bg-blue-500/20 text-blue-300',
      'completed': 'bg-green-500/20 text-green-300',
      'pending_approval': 'bg-yellow-500/20 text-yellow-300',
      'approved': 'bg-green-600/20 text-green-400',
      'rejected': 'bg-red-500/20 text-red-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
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

  const renderOverview = () => {
    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'completed').length;
    const pendingVisits = visits.filter(v => v.status === 'pending_approval').length;
    const averageDuration = visits.length > 0 
      ? Math.round(visits.reduce((sum, v) => sum + (v.duration_minutes || 0), 0) / visits.length) 
      : 0;

    return (
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalVisits}</div>
                <div className="text-sm opacity-75">إجمالي الزيارات</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{completedVisits}</div>
                <div className="text-sm opacity-75">زيارات مكتملة</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <span className="text-xl">⏳</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingVisits}</div>
                <div className="text-sm opacity-75">في انتظار الاعتماد</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-xl">⏱️</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatDuration(averageDuration)}</div>
                <div className="text-sm opacity-75">متوسط مدة الزيارة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Visits */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4">آخر الزيارات</h3>
          <div className="space-y-3">
            {visits.slice(0, 5).map(visit => (
              <div key={visit.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg">🏥</div>
                  <div>
                    <div className="font-medium">{visit.clinic_name}</div>
                    <div className="text-sm opacity-75">{visit.rep_name} - {formatDateTime(visit.visit_date)}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(visit.status)}`}>
                    {getStatusLabel(visit.status)}
                  </div>
                  {visit.duration_minutes && (
                    <div className="text-xs mt-1 opacity-75">{formatDuration(visit.duration_minutes)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVisits = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">سجل الزيارات</h3>
        <button
          onClick={() => setShowVisitModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          تسجيل زيارة جديدة
        </button>
      </div>

      {/* Visits Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">العيادة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المندوب</th>
                <th className="px-6 py-4 text-right text-sm font-medium">تاريخ الزيارة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المدة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الموقع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">طلب</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{visit.clinic_name}</div>
                    <div className="text-sm opacity-75">{visit.doctor_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {visit.rep_name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDateTime(visit.visit_date)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {visit.duration_minutes ? formatDuration(visit.duration_minutes) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span className="text-xs">{visit.location?.address || 'غير محدد'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {visit.order_created ? (
                      <div className="text-green-400">
                        <div>✅ تم</div>
                        <div className="text-xs">{visit.order_value?.toLocaleString()} ج.م</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">لا يوجد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(visit.status)}`}>
                      {getStatusLabel(visit.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {visit.status === 'pending_approval' && user.role === 'admin' && (
                        <button
                          onClick={() => handleApproveVisit(visit.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                        >
                          اعتماد
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`https://maps.google.com?q=${visit.location?.latitude},${visit.location?.longitude}`, '_blank')}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        disabled={!visit.location}
                      >
                        خريطة
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLoginLogs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">سجل تسجيلات الدخول</h3>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الدور</th>
                <th className="px-6 py-4 text-right text-sm font-medium">تسجيل الدخول</th>
                <th className="px-6 py-4 text-right text-sm font-medium">تسجيل الخروج</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المدة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الموقع</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الجهاز</th>
                <th className="px-6 py-4 text-right text-sm font-medium">البصمة</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{log.user_name}</div>
                    <div className="text-sm opacity-75">{log.ip_address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDateTime(log.login_time)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.logout_time ? formatDateTime(log.logout_time) : 'لا يزال متصل'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.session_duration_hours ? `${log.session_duration_hours}س` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span className="text-xs">{log.location?.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.device_info}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      log.biometric_verified ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {log.biometric_verified ? '✅ تم' : '❌ لم يتم'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الزيارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visit-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">📋</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">إدارة الزيارات وسجل الدخول</h1>
            <p className="text-lg opacity-75">تتبع الزيارات وسجلات الدخول مع نظام GPS المتقدم</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📊' },
            { id: 'visits', name: 'سجل الزيارات', icon: '🏥' },
            { id: 'login_logs', name: 'سجل الدخول', icon: '🔐' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-300 border-b-2 border-purple-400'
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
          {activeTab === 'visits' && renderVisits()}
          {activeTab === 'login_logs' && renderLoginLogs()}
        </div>
      </div>

      {/* Visit Modal */}
      {showVisitModal && (
        <VisitModal
          clinics={clinics}
          currentLocation={currentLocation}
          onClose={() => setShowVisitModal(false)}
          onSave={handleCreateVisit}
          language={language}
        />
      )}
    </div>
  );
};

// Visit Modal Component
const VisitModal = ({ clinics, currentLocation, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    clinic_id: '',
    visit_type: 'routine',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!currentLocation) {
      alert('لا يمكن تسجيل الزيارة بدون تحديد الموقع الحالي');
      return;
    }

    const selectedClinic = clinics.find(c => c.id === formData.clinic_id);
    const visitData = {
      ...formData,
      clinic_name: selectedClinic?.name,
      doctor_name: selectedClinic?.doctor_name,
      visit_date: new Date().toISOString()
    };
    
    onSave(visitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-lg w-full border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">تسجيل زيارة جديدة</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>

          {currentLocation && (
            <div className="mb-4 p-3 bg-green-500/20 rounded-lg">
              <div className="text-sm text-green-300">
                ✅ تم تحديد الموقع: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">العيادة *</label>
              <select
                name="clinic_id"
                value={formData.clinic_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">اختر العيادة</option>
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} - {clinic.doctor_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نوع الزيارة *</label>
              <select
                name="visit_type"
                value={formData.visit_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="routine">زيارة روتينية</option>
                <option value="follow_up">متابعة</option>
                <option value="urgent">طارئة</option>
                <option value="presentation">عرض منتجات</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ملاحظات حول الزيارة..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                disabled={!currentLocation}
              >
                تسجيل الزيارة
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitManagement;