// Enhanced Clinics Management Component - إدارة العيادات المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import ClinicMiniProfile from './ClinicMiniProfile.js';
import axios from 'axios';

const ClinicsManagement = ({ user, language, isRTL }) => {
  const [clinics, setClinics] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [filterCreditStatus, setFilterCreditStatus] = useState('all');
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchClinics();
    fetchAreas();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      // Mock data for development
      setClinics([
        {
          id: 'clinic-001',
          clinic_name: 'عيادة الدكتور أحمد محمد',
          doctor_name: 'د. أحمد محمد',
          specialty: 'أمراض باطنة',
          phone: '01234567890',
          address: 'شارع النيل، المعادي، القاهرة',
          area_id: 'area-001',
          area_name: 'القاهرة الكبرى',
          classification: 'A',
          credit_status: 'good',
          monthly_target: 50000,
          monthly_achieved: 42000,
          latitude: 30.0444,
          longitude: 31.2357,
          is_active: true,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'clinic-002',
          clinic_name: 'مركز الشفاء الطبي',
          doctor_name: 'د. فاطمة علي',
          specialty: 'أطفال',
          phone: '01098765432',
          address: 'شارع الجامعة، الجيزة',
          area_id: 'area-002',
          area_name: 'الجيزة',
          classification: 'B',
          credit_status: 'average',
          monthly_target: 35000,
          monthly_achieved: 30000,
          latitude: 30.0131,
          longitude: 31.2089,
          is_active: true,
          created_at: '2024-01-02T10:00:00Z'
        },
        {
          id: 'clinic-003',
          clinic_name: 'عيادة النور',
          doctor_name: 'د. محمود سالم',
          specialty: 'عيون',
          phone: '01555444333',
          address: 'شارع الثورة، الإسكندرية',
          area_id: 'area-003',
          area_name: 'الإسكندرية',
          classification: 'C',
          credit_status: 'poor',
          monthly_target: 25000,
          monthly_achieved: 15000,
          latitude: 31.2001,
          longitude: 29.9187,
          is_active: false,
          created_at: '2024-01-03T10:00:00Z'
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
      const token = localStorage.getItem('access_token');
      console.log('🔧 Updating clinic:', clinicId, 'with data:', clinicData);
      
      const response = await axios.put(`${API}/clinics/${clinicId}`, clinicData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Clinic updated successfully:', response.data);
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
    if (window.confirm('هل أنت متأكد من حذف هذه العيادة؟')) {
      try {
        const token = localStorage.getItem('access_token');
        console.log('🔧 Deleting clinic:', clinicId);
        
        const response = await axios.delete(`${API}/clinics/${clinicId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Clinic deleted successfully:', response.data);
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