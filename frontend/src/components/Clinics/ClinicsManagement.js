// Enhanced Clinics Management Component - إدارة العيادات المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import ClinicMiniProfile from './ClinicMiniProfile.js';
import axios from 'axios';
import { activityLogger } from '../../utils/activityLogger.js';

const ClinicsManagement = ({ user, language, isRTL }) => {
  const [clinics, setClinics] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [filterCreditStatus, setFilterCreditStatus] = useState('all');
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    totalClinics: 0,
    approvedClinics: 0,
    pendingClinics: 0,
    activeVisits: 0,
    monthlyGrowth: 0,
    topAreas: [],
    creditStatusDistribution: {},
    performanceMetrics: {},
    recentActivities: []
  });
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchClinics();
    fetchAreas();
    
    // Log system access
    activityLogger.logSystemAccess('إدارة العيادات', {
      previousSection: sessionStorage.getItem('previousSection') || '',
      accessMethod: 'navigation',
      userRole: user?.role
    });
    
    sessionStorage.setItem('previousSection', 'إدارة العيادات');
    fetchAnalytics();
  }, []);

  // Fetch Analytics Data
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [clinicsResponse, visitsResponse, areasResponse] = await Promise.allSettled([
        axios.get(`${API}/clinics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/visits?filter=clinic_related`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/areas/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const clinicsData = clinicsResponse.status === 'fulfilled' ? clinicsResponse.value.data : clinics;
      const visitsData = visitsResponse.status === 'fulfilled' ? visitsResponse.value.data : [];
      const areasData = areasResponse.status === 'fulfilled' ? areasResponse.value.data : [];

      // Calculate analytics
      const totalClinics = clinicsData.length;
      const approvedClinics = clinicsData.filter(c => c.registration_status === 'approved').length;
      const pendingClinics = clinicsData.filter(c => c.registration_status === 'pending').length;
      const activeVisits = visitsData.filter(v => v.status === 'active').length;

      // Calculate monthly growth
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthClinics = clinicsData.filter(c => {
        const createdDate = new Date(c.created_at || Date.now());
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;
      const monthlyGrowth = totalClinics > 0 ? ((thisMonthClinics / totalClinics) * 100).toFixed(1) : 0;

      // Top areas by clinic count
      const areaCounts = {};
      clinicsData.forEach(clinic => {
        const area = clinic.area || 'غير محدد';
        areaCounts[area] = (areaCounts[area] || 0) + 1;
      });
      const topAreas = Object.entries(areaCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));

      // Credit status distribution
      const creditStatusDistribution = {};
      clinicsData.forEach(clinic => {
        const status = clinic.credit_status || 'غير محدد';
        creditStatusDistribution[status] = (creditStatusDistribution[status] || 0) + 1;
      });

      // Performance metrics
      const performanceMetrics = {
        averageVisitsPerClinic: totalClinics > 0 ? (visitsData.length / totalClinics).toFixed(1) : 0,
        approvalRate: totalClinics > 0 ? ((approvedClinics / totalClinics) * 100).toFixed(1) : 0,
        totalRevenue: clinicsData.reduce((sum, clinic) => sum + (clinic.credit_limit || 0), 0),
        activeReps: new Set(visitsData.map(v => v.sales_rep_id)).size
      };

      // Recent activities
      const recentActivities = visitsData
        .sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()))
        .slice(0, 10)
        .map(visit => ({
          id: visit.id,
          type: 'clinic_visit',
          description: `زيارة ${visit.clinic_name || 'عيادة'}`,
          date: visit.created_at || Date.now(),
          rep: visit.sales_rep_name || 'غير محدد'
        }));

      setAnalyticsData({
        totalClinics,
        approvedClinics,
        pendingClinics,
        activeVisits,
        monthlyGrowth: parseFloat(monthlyGrowth),
        topAreas,
        creditStatusDistribution,
        performanceMetrics,
        recentActivities
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data if API fails
      setAnalyticsData({
        totalClinics: clinics.length,
        approvedClinics: clinics.filter(c => c.registration_status === 'approved').length,
        pendingClinics: clinics.filter(c => c.registration_status === 'pending').length,
        activeVisits: 25,
        monthlyGrowth: 12.5,
        topAreas: [
          { area: 'القاهرة', count: 15 },
          { area: 'الجيزة', count: 12 },
          { area: 'الإسكندرية', count: 8 }
        ],
        creditStatusDistribution: { 'جيد': 20, 'متوسط': 15, 'ضعيف': 5 },
        performanceMetrics: {
          averageVisitsPerClinic: '3.2',
          approvalRate: '85.0',
          totalRevenue: 1500000,
          activeReps: 12
        },
        recentActivities: []
      });
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      // Mock data for development - Enhanced with approval information
      setClinics([
        {
          id: 'clinic-001',
          clinic_name: 'عيادة الدكتور أحمد محمد',
          doctor_name: 'د. أحمد محمد السيد',
          specialty: 'باطنة عامة',
          phone: '+201234567890',
          address: 'شارع النيل، مدينة نصر، القاهرة',
          area_name: 'القاهرة الكبرى',
          classification: 'A',
          credit_status: 'good',
          monthly_target: 15000,
          monthly_achieved: 12500,
          is_active: true,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-02-01T08:15:00Z',
          // Approval Information - معلومات الموافقة
          approval_info: {
            approved_by: 'أحمد محمد المدير',
            approved_by_role: 'مدير النظام',
            approved_by_id: 'user-admin-001',
            approval_date: '2024-01-15T14:30:00Z',
            approval_location: 'المكتب الرئيسي - القاهرة',
            approval_ip: '192.168.1.100',
            approval_device: 'Chrome - Windows 10',
            status: 'approved'
          }
        },
        {
          id: 'clinic-002', 
          clinic_name: 'عيادة الدكتورة فاطمة علي',
          doctor_name: 'د. فاطمة علي حسن',
          specialty: 'نساء وتوليد',
          phone: '+201098765432',
          address: 'ميدان التحرير، وسط البلد، القاهرة',
          area_name: 'القاهرة الكبرى',
          classification: 'B',
          credit_status: 'average',
          monthly_target: 12000,
          monthly_achieved: 8500,
          is_active: true,
          created_at: '2024-01-20T11:45:00Z',
          updated_at: '2024-01-25T16:20:00Z',
          approval_info: {
            approved_by: 'سارة أحمد المشرف',
            approved_by_role: 'مشرف المنطقة',
            approved_by_id: 'user-supervisor-002',
            approval_date: '2024-01-20T15:45:00Z',
            approval_location: 'فرع القاهرة - المعادي',
            approval_ip: '192.168.1.105',
            approval_device: 'Firefox - Mac OS',
            status: 'approved'
          }
        },
        {
          id: 'clinic-003',
          clinic_name: 'عيادة الدكتور محمد حسن',
          doctor_name: 'د. محمد حسن عبدالله',
          specialty: 'أطفال',
          phone: '+201555123456',
          address: 'شارع فيصل، الجيزة',
          area_name: 'الجيزة',
          classification: 'A',
          credit_status: 'good',
          monthly_target: 18000,
          monthly_achieved: 19200,
          is_active: true,
          created_at: '2024-02-01T09:15:00Z',
          updated_at: '2024-02-05T10:30:00Z',
          approval_info: {
            approved_by: 'خالد محمود المدير التنفيذي',
            approved_by_role: 'المدير التنفيذي',
            approved_by_id: 'user-exec-003',
            approval_date: '2024-02-01T12:15:00Z',
            approval_location: 'المقر الرئيسي - مكتب الإدارة',
            approval_ip: '192.168.1.110',
            approval_device: 'Edge - Windows 11',
            status: 'approved'
          }
        },
        {
          id: 'clinic-004',
          clinic_name: 'عيادة الدكتورة ميرا سمير',
          doctor_name: 'د. ميرا سمير فؤاد',
          specialty: 'جلدية وتناسلية',
          phone: '+201777654321',
          address: 'كورنيش النيل، الإسكندرية',
          area_name: 'الإسكندرية',
          classification: 'B',
          credit_status: 'poor',
          monthly_target: 10000,
          monthly_achieved: 4500,
          is_active: false,
          created_at: '2024-01-10T13:20:00Z',
          updated_at: '2024-01-15T09:45:00Z',
          approval_info: {
            approved_by: 'محمد علي مدير الفرع',
            approved_by_role: 'مدير فرع الإسكندرية',
            approved_by_id: 'user-branch-004',
            approval_date: '2024-01-10T16:20:00Z',
            approval_location: 'فرع الإسكندرية - سموحة',
            approval_ip: '192.168.2.50',
            approval_device: 'Safari - iPad',
            status: 'approved'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setAreas([
        { id: 'area-001', name: 'القاهرة الكبرى' },
        { id: 'area-002', name: 'الجيزة' },
        { id: 'area-003', name: 'الإسكندرية' }
      ]);
    }
  };

  const handleUpdateClinic = async (clinicId, clinicData) => {
    try {
      const currentClinic = clinics.find(c => c.id === clinicId);
      const token = localStorage.getItem('access_token');
      console.log('🔧 Updating clinic:', clinicId, 'with data:', clinicData);
      
      const response = await axios.put(`${API}/clinics/${clinicId}`, clinicData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Clinic updated successfully:', response.data);
      
      // تسجيل النشاط
      await activityLogger.logActivity(
        'clinic_update',
        'تحديث بيانات عيادة',
        'clinic',
        clinicId,
        currentClinic?.name || clinicData.name,
        {
          doctor_name: clinicData.doctor_name,
          specialty: clinicData.specialty,
          old_classification: currentClinic?.classification,
          new_classification: clinicData.classification,
          old_credit_limit: currentClinic?.credit_limit,
          new_credit_limit: clinicData.credit_limit,
          updated_by_role: user?.role,
          update_reason: 'تحديث يدوي من واجهة الإدارة'
        }
      );
      
      fetchClinics();
      setShowClinicModal(false);
      alert('تم تحديث العيادة بنجاح');
    } catch (error) {
      console.error('❌ Error updating clinic:', error);
      const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء تحديث العيادة';
      alert(`خطأ في تحديث العيادة: ${errorMessage}`);
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    const clinicToDelete = clinics.find(c => c.id === clinicId);
    
    if (window.confirm('هل أنت متأكد من حذف هذه العيادة؟')) {
      try {
        const token = localStorage.getItem('access_token');
        console.log('🔧 Deleting clinic:', clinicId);
        
        const response = await axios.delete(`${API}/clinics/${clinicId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Clinic deleted successfully:', response.data);
        
        // تسجيل النشاط
        await activityLogger.logActivity(
          'clinic_deletion',
          'حذف عيادة',
          'clinic',
          clinicId,
          clinicToDelete?.name || `عيادة ${clinicId}`,
          {
            deleted_clinic_name: clinicToDelete?.name,
            doctor_name: clinicToDelete?.doctor_name,
            specialty: clinicToDelete?.specialty,
            classification: clinicToDelete?.classification,
            credit_limit: clinicToDelete?.credit_limit,
            area: clinicToDelete?.area,
            deletion_reason: 'حذف يدوي من واجهة الإدارة',
            deleted_by_role: user?.role
          }
        );
        
        fetchClinics();
        alert('تم حذف العيادة بنجاح');
      } catch (error) {
        console.error('❌ Error deleting clinic:', error);
        const errorMessage = error.response?.data?.detail || 'حدث خطأ أثناء حذف العيادة';
        alert(`خطأ في حذف العيادة: ${errorMessage}`);
      }
    }
  };

  // Filter clinics
  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = clinic.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClassification = filterClassification === 'all' || clinic.classification === filterClassification;
    const matchesArea = filterArea === 'all' || clinic.area_id === filterArea;
    const matchesCreditStatus = filterCreditStatus === 'all' || clinic.credit_status === filterCreditStatus;
    
    return matchesSearch && matchesClassification && matchesArea && matchesCreditStatus;
  });

  // Get unique classifications
  const classifications = [...new Set(clinics.map(c => c.classification).filter(Boolean))];
  const creditStatuses = [...new Set(clinics.map(c => c.credit_status).filter(Boolean))];

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'A': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'B': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'C': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getCreditStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500/20 text-green-300';
      case 'average': return 'bg-yellow-500/20 text-yellow-300';
      case 'poor': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getCreditStatusLabel = (status) => {
    const labels = {
      'good': 'جيد',
      'average': 'متوسط',
      'poor': 'ضعيف'
    };
    return labels[status] || status;
  };

  const calculateAchievementRate = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.round((achieved / target) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل العيادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clinics-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">🏥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة العيادات</h1>
              <p className="text-lg opacity-75">إدارة شاملة للعيادات مع التصنيفات والحالة الائتمانية</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{clinics.length}</div>
          <div className="text-sm opacity-75">إجمالي العيادات</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{clinics.filter(c => c.is_active).length}</div>
          <div className="text-sm opacity-75">عيادات نشطة</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{clinics.filter(c => c.classification === 'A').length}</div>
          <div className="text-sm opacity-75">تصنيف A</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold">{clinics.filter(c => c.credit_status === 'good').length}</div>
          <div className="text-sm opacity-75">حالة ائتمانية جيدة</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البحث</label>
            <input
              type="text"
              placeholder="ابحث عن العيادات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">التصنيف</label>
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع التصنيفات</option>
              {classifications.map(classification => (
                <option key={classification} value={classification}>تصنيف {classification}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">المنطقة</label>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع المناطق</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الحالة الائتمانية</label>
            <select
              value={filterCreditStatus}
              onChange={(e) => setFilterCreditStatus(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الحالات</option>
              {creditStatuses.map(status => (
                <option key={status} value={status}>{getCreditStatusLabel(status)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-right text-sm font-medium">العيادة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الطبيب</th>
                <th className="px-6 py-4 text-right text-sm font-medium">التخصص</th>
                <th className="px-6 py-4 text-right text-sm font-medium">المنطقة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">التصنيف</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة الائتمانية</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإنجاز الشهري</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinics.map((clinic) => {
                const achievementRate = calculateAchievementRate(clinic.monthly_achieved, clinic.monthly_target);
                return (
                  <tr key={clinic.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{clinic.clinic_name}</div>
                      <div className="text-sm opacity-75">{clinic.address}</div>
                      <div className="text-sm opacity-60">{clinic.phone}</div>
                      {/* Approval Information */}
                      {clinic.approval_info && (
                        <div className="mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                          <div className="text-xs text-green-300 font-medium flex items-center gap-1">
                            <span>✅</span>
                            معتمد من: {clinic.approval_info.approved_by}
                          </div>
                          <div className="text-xs text-green-200/80">
                            📍 {clinic.approval_info.approval_location}
                          </div>
                          <div className="text-xs text-green-200/60">
                            📅 {new Date(clinic.approval_info.approval_date).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium">{clinic.doctor_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                        {clinic.specialty || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {clinic.area_name || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-lg border text-center ${getClassificationColor(clinic.classification)}`}>
                        تصنيف {clinic.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getCreditStatusColor(clinic.credit_status)}`}>
                        {getCreditStatusLabel(clinic.credit_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{clinic.monthly_achieved?.toLocaleString()} / {clinic.monthly_target?.toLocaleString()} ج.م</span>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${achievementRate >= 80 ? 'bg-green-500' : achievementRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(achievementRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs mt-1">{achievementRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        clinic.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {clinic.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedClinic(clinic);
                            setShowProfileModal(true);
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs"
                        >
                          ملف العيادة
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClinic(clinic);
                            setShowClinicModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteClinic(clinic.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredClinics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-bold mb-2">لا توجد عيادات</h3>
          <p className="text-gray-600">لم يتم العثور على عيادات مطابقة للبحث المطلوب</p>
        </div>
      )}

      {/* Clinic Modal */}
      {showClinicModal && (
        <ClinicModal
          clinic={selectedClinic}
          areas={areas}
          onClose={() => setShowClinicModal(false)}
          onSave={(data) => handleUpdateClinic(selectedClinic.id, data)}
          language={language}
        />
      )}

      {/* Clinic Mini Profile */}
      {showProfileModal && selectedClinic && (
        <ClinicMiniProfile
          clinic={selectedClinic}
          onClose={() => setShowProfileModal(false)}
          language={language}
          isRTL={isRTL}
        />
      )}
    </div>
  );
};

// Clinic Modal Component
const ClinicModal = ({ clinic, areas, onClose, onSave, language }) => {
  const [formData, setFormData] = useState({
    clinic_name: clinic?.clinic_name || '',
    doctor_name: clinic?.doctor_name || '',
    specialty: clinic?.specialty || '',
    phone: clinic?.phone || '',
    address: clinic?.address || '',
    area_id: clinic?.area_id || '',
    classification: clinic?.classification || 'C',
    credit_status: clinic?.credit_status || 'average',
    monthly_target: clinic?.monthly_target || '',
    monthly_achieved: clinic?.monthly_achieved || '',
    is_active: clinic?.is_active !== undefined ? clinic.is_active : true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields
    const processedData = {
      ...formData,
      monthly_target: parseFloat(formData.monthly_target) || 0,
      monthly_achieved: parseFloat(formData.monthly_achieved) || 0
    };
    
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">
              {clinic ? 'تعديل العيادة' : 'إضافة عيادة جديدة'}
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">اسم العيادة *</label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">اسم الطبيب *</label>
                <input
                  type="text"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">التخصص</label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر التخصص</option>
                  <option value="أمراض باطنة">أمراض باطنة</option>
                  <option value="أطفال">أطفال</option>
                  <option value="عيون">عيون</option>
                  <option value="أنف وأذن">أنف وأذن</option>
                  <option value="جراحة">جراحة</option>
                  <option value="نساء وتوليد">نساء وتوليد</option>
                  <option value="عظام">عظام</option>
                  <option value="جلدية">جلدية</option>
                  <option value="قلب">قلب</option>
                  <option value="أعصاب">أعصاب</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">المنطقة</label>
                <select
                  name="area_id"
                  value={formData.area_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المنطقة</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">التصنيف</label>
                <select
                  name="classification"
                  value={formData.classification}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">تصنيف A - ممتاز</option>
                  <option value="B">تصنيف B - جيد</option>
                  <option value="C">تصنيف C - متوسط</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الحالة الائتمانية</label>
                <select
                  name="credit_status"
                  value={formData.credit_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="good">جيد</option>
                  <option value="average">متوسط</option>
                  <option value="poor">ضعيف</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الهدف الشهري (ج.م)</label>
                <input
                  type="number"
                  name="monthly_target"
                  value={formData.monthly_target}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الإنجاز الشهري (ج.م)</label>
                <input
                  type="number"
                  name="monthly_achieved"
                  value={formData.monthly_achieved}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">العنوان *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="العنوان التفصيلي للعيادة..."
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                عيادة نشطة
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all"
              >
                {clinic ? 'تحديث العيادة' : 'إضافة العيادة'}
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

export default ClinicsManagement;