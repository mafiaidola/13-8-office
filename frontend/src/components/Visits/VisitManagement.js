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
  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';
  
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

      {/* Search and Filters */}
      {activeTab === 'visits' && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="البحث في الزيارات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value="all" className="text-black">جميع الحالات</option>
            <option value="ordered" className="text-black">تم الطلب</option>
            <option value="interested" className="text-black">مهتم</option>
            <option value="considering" className="text-black">تحت الدراسة</option>
            <option value="no_order" className="text-black">لا يوجد طلب</option>
            <option value="follow_up" className="text-black">متابعة لاحقة</option>
          </select>
          
          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          />
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'visits' && (
        <VisitsList 
          visits={filteredVisits}
          loading={loading}
          onVisitClick={handleVisitClick}
          canViewGPS={canViewGPS}
          getEffectivenessColor={getEffectivenessColor}
          getOrderStatusColor={getOrderStatusColor}
          getStatusLabel={getStatusLabel}
          getEffectivenessLabel={getEffectivenessLabel}
        />
      )}

      {activeTab === 'login-logs' && canViewAllVisits && (
        <LoginLogsList 
          loginLogs={loginLogs}
          loading={loading}
          canViewGPS={canViewGPS}
        />
      )}

      {/* New Visit Modal */}
      {showNewVisitModal && (
        <NewVisitForm
          user={user}
          language={language}
          isRTL={isRTL}
          onClose={() => setShowNewVisitModal(false)}
          onSave={handleVisitSaved}
        />
      )}

      {/* Visit Details Modal */}
      {showVisitDetails && selectedVisit && (
        <VisitDetailsModal
          visit={selectedVisit}
          onClose={() => setShowVisitDetails(false)}
          canViewGPS={canViewGPS}
          getEffectivenessColor={getEffectivenessColor}
          getOrderStatusColor={getOrderStatusColor}
          getStatusLabel={getStatusLabel}
          getEffectivenessLabel={getEffectivenessLabel}
        />
      )}
    </div>
  );
};

// Visits List Component
const VisitsList = ({ 
  visits, 
  loading, 
  onVisitClick, 
  canViewGPS, 
  getEffectivenessColor, 
  getOrderStatusColor, 
  getStatusLabel, 
  getEffectivenessLabel 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>جاري تحميل الزيارات...</p>
        </div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏥</div>
        <h3 className="text-xl font-bold mb-2">لا توجد زيارات</h3>
        <p className="text-gray-600">لم يتم العثور على زيارات مطابقة للبحث</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visits.map((visit) => (
        <div
          key={visit.id}
          onClick={() => onVisitClick(visit)}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
        >
          {/* Visit Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white mb-1">{visit.clinic_name}</h3>
              <p className="text-white/70 text-sm mb-2">{visit.doctor_name}</p>
              <p className="text-white/60 text-xs">بواسطة: {visit.medical_rep_name}</p>
            </div>
            
            {canViewGPS && visit.location && (
              <div className="text-green-400 text-lg" title="الموقع متاح">
                📍
              </div>
            )}
          </div>

          {/* Visit Info */}
          <div className="space-y-3">
            {/* Date and Time */}
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span>📅</span>
              <span>
                {new Date(visit.visit_date).toLocaleDateString('ar-EG')} - 
                {new Date(visit.visit_date).toLocaleTimeString('ar-EG', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>

            {/* Effectiveness */}
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">الفعالية:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEffectivenessColor(visit.visit_effectiveness)}`}>
                {getEffectivenessLabel(visit.visit_effectiveness)}
              </span>
            </div>

            {/* Order Status */}
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">حالة الطلب:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(visit.order_status)}`}>
                {getStatusLabel(visit.order_status)}
              </span>
            </div>

            {/* Managers */}
            {visit.managers_notified && visit.managers_notified.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-white/70 text-sm">المدراء:</span>
                <div className="flex-1">
                  {visit.managers_notified.slice(0, 2).map((manager, index) => (
                    <span key={index} className="text-blue-300 text-xs bg-blue-500/20 px-2 py-1 rounded mr-1">
                      {manager}
                    </span>
                  ))}
                  {visit.managers_notified.length > 2 && (
                    <span className="text-white/60 text-xs">+{visit.managers_notified.length - 2}</span>
                  )}
                </div>
              </div>
            )}

            {/* Products Count */}
            {visit.products_discussed && visit.products_discussed.length > 0 && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span>💊</span>
                <span>{visit.products_discussed.length} منتج تم مناقشته</span>
              </div>
            )}
          </div>

          {/* Visit Notes Preview */}
          {visit.visit_notes && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm line-clamp-2">
                {visit.visit_notes}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Login Logs List Component
const LoginLogsList = ({ loginLogs, loading, canViewGPS }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>جاري تحميل سجل تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span>🔐</span>
        سجل تسجيل الدخول
      </h3>
      
      <div className="space-y-4">
        {loginLogs.map((log) => (
          <div key={log.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Info */}
              <div>
                <div className="font-medium text-white">{log.user_name}</div>
                <div className="text-white/60 text-sm">{log.user_role}</div>
                <div className="text-white/70 text-sm">
                  {new Date(log.login_time).toLocaleString('ar-EG')}
                </div>
              </div>
              
              {/* Device & IP */}
              <div>
                <div className="text-white/70 text-sm">IP: {log.ip_address}</div>
                <div className="text-white/70 text-sm">{log.device_type}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.biometric_status === 'verified' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    📱 {log.biometric_status === 'verified' ? 'تم التحقق البيومتري' : 'لا يوجد تحقق بيومتري'}
                  </span>
                </div>
              </div>
              
              {/* Location */}
              <div>
                {canViewGPS && log.location ? (
                  <div>
                    <div className="text-white/70 text-sm flex items-center gap-1">
                      <span>📍</span>
                      {log.location.address}
                    </div>
                    <div className="text-white/60 text-xs">
                      {log.location.latitude.toFixed(4)}, {log.location.longitude.toFixed(4)}
                    </div>
                  </div>
                ) : (
                  <div className="text-white/50 text-sm">الموقع محجوب</div>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.selfie_status === 'captured' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    📸 {log.selfie_status === 'captured' ? 'تم التقاط صورة شخصية' : 'لا توجد صورة شخصية'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Visit Details Modal Component
const VisitDetailsModal = ({ 
  visit, 
  onClose, 
  canViewGPS, 
  getEffectivenessColor, 
  getOrderStatusColor, 
  getStatusLabel, 
  getEffectivenessLabel 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white">🏥</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{visit.clinic_name}</h2>
                <p className="text-white/70">{visit.doctor_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Visit Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic Info */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                معلومات الزيارة
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">المندوب:</span>
                  <span className="text-white font-medium">{visit.medical_rep_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-white/70">التاريخ:</span>
                  <span className="text-white">{new Date(visit.visit_date).toLocaleDateString('ar-EG')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-white/70">الوقت:</span>
                  <span className="text-white">
                    {new Date(visit.visit_date).toLocaleTimeString('ar-EG', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">الفعالية:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEffectivenessColor(visit.visit_effectiveness)}`}>
                    {getEffectivenessLabel(visit.visit_effectiveness)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">حالة الطلب:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(visit.order_status)}`}>
                    {getStatusLabel(visit.order_status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Info (GPS for admin only) */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <span>📍</span>
                معلومات الموقع
              </h3>
              
              {canViewGPS && visit.location ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">العنوان:</span>
                    <span className="text-white text-sm">{visit.location.address}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-white/70">خط العرض:</span>
                    <span className="text-white font-mono text-sm">{visit.location.latitude}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-white/70">خط الطول:</span>
                    <span className="text-white font-mono text-sm">{visit.location.longitude}</span>
                  </div>
                  
                  {/* Google Maps Link */}
                  <div className="pt-3">
                    <a
                      href={`https://maps.google.com/?q=${visit.location.latitude},${visit.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2 w-full justify-center"
                    >
                      <span>🗺️</span>
                      عرض على الخريطة
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/50 py-8">
                  <span className="text-4xl block mb-2">🔒</span>
                  {canViewGPS ? 'معلومات الموقع غير متاحة' : 'غير مصرح لك بعرض معلومات الموقع'}
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-6">
            {/* Managers */}
            {visit.managers_notified && visit.managers_notified.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <span>👔</span>
                  المدراء المبلغين
                </h3>
                <div className="flex flex-wrap gap-2">
                  {visit.managers_notified.map((manager, index) => (
                    <span key={index} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                      {manager}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Products Discussed */}
            {visit.products_discussed && visit.products_discussed.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <span>💊</span>
                  المنتجات المناقشة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {visit.products_discussed.map((product, index) => (
                    <span key={index} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visit Notes */}
            {visit.visit_notes && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <span>📝</span>
                  ملاحظات الزيارة
                </h3>
                <p className="text-white/80 leading-relaxed">{visit.visit_notes}</p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitManagement;