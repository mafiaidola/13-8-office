import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AvailableClinics = () => {
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [filters, setFilters] = useState({
    line_id: '',
    area_id: '',
    status_filter: 'approved',
    limit: 50
  });

  const [formOptions, setFormOptions] = useState({
    lines: [],
    areas: []
  });

  const [editData, setEditData] = useState({});
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadFormOptions();
    loadAvailableClinics();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    loadAvailableClinics();
  }, [filters]);

  const loadFormOptions = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/enhanced-clinics/registration/form-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.success) {
        setFormOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading form options:', error);
    }
  };

  const loadAvailableClinics = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${backendUrl}/api/enhanced-clinics/available-for-user?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.data.success) {
        setClinics(response.data.clinics);
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Error loading available clinics:', error);
      alert('خطأ في تحميل العيادات المتاحة');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const calculateDistance = (clinicLat, clinicLng) => {
    if (!userLocation || !clinicLat || !clinicLng) return null;
    
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (clinicLat - userLocation.lat) * Math.PI / 180;
    const dLng = (clinicLng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(clinicLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const openClinicDetails = (clinic) => {
    setSelectedClinic(clinic);
    setShowModal(true);
  };

  const openEditModal = (clinic) => {
    setSelectedClinic(clinic);
    setEditData({
      clinic_name: clinic.name,
      clinic_phone: clinic.phone || '',
      primary_doctor_name: clinic.primary_doctor_name,
      primary_doctor_specialty: clinic.primary_doctor_specialty,
      clinic_address: clinic.address,
      modification_reason: ''
    });
    setShowEditModal(true);
  };

  const saveClinicModification = async () => {
    if (!selectedClinic) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      // إضافة موقع المستخدم إذا كان متوفراً
      const modificationData = { ...editData };
      if (userLocation) {
        modificationData.user_latitude = userLocation.lat;
        modificationData.user_longitude = userLocation.lng;
      }

      const response = await axios.put(
        `${backendUrl}/api/enhanced-clinics/modify/${selectedClinic.id}`,
        {
          modification_data: modificationData,
          modification_reason: editData.modification_reason
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('تم تحديث العيادة بنجاح');
        setShowEditModal(false);
        setSelectedClinic(null);
        loadAvailableClinics(); // إعادة تحميل القائمة
      }
    } catch (error) {
      console.error('Error modifying clinic:', error);
      alert('خطأ في تحديث العيادة');
    }
  };

  const getClassificationBadge = (classification) => {
    const classificationColors = {
      'excellent': 'bg-green-100 text-green-800',
      'very_good': 'bg-blue-100 text-blue-800',
      'good': 'bg-yellow-100 text-yellow-800',
      'average': 'bg-orange-100 text-orange-800',
      'poor': 'bg-red-100 text-red-800'
    };
    
    const classificationLabels = {
      'excellent': 'ممتاز',
      'very_good': 'جيد جداً',
      'good': 'جيد',
      'average': 'متوسط',
      'poor': 'ضعيف'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${classificationColors[classification] || 'bg-gray-100 text-gray-800'}`}>
        {classificationLabels[classification] || classification}
      </span>
    );
  };

  const getCreditBadge = (credit) => {
    const creditColors = {
      'aaa': 'bg-green-100 text-green-800',
      'aa': 'bg-blue-100 text-blue-800',
      'a': 'bg-purple-100 text-purple-800',
      'bbb': 'bg-yellow-100 text-yellow-800',
      'bb': 'bg-orange-100 text-orange-800',
      'b': 'bg-red-100 text-red-800',
      'ccc': 'bg-red-200 text-red-900',
      'default': 'bg-gray-800 text-white'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${creditColors[credit] || 'bg-gray-100 text-gray-800'}`}>
        {credit?.toUpperCase() || 'غير محدد'}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'لا توجد زيارات';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getFilteredAreas = () => {
    if (!filters.line_id) return formOptions.areas;
    return formOptions.areas.filter(area => area.parent_line_id === filters.line_id);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      // إعادة تعيين المنطقة عند تغيير الخط
      ...(key === 'line_id' ? { area_id: '' } : {})
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          العيادات المتاحة
        </h1>
        <p className="text-gray-600">
          العيادات المخصصة لك أو المتاحة للزيارة
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">🏥</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">إجمالي العيادات</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_available || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">✅</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">المعروضة حالياً</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.returned_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-semibold">👤</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">دورك</p>
              <p className="text-lg font-bold text-gray-900">{statistics.user_role || 'غير محدد'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">🎯</span>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">مصفى حسب</p>
              <p className="text-sm text-gray-600">
                {filters.line_id ? 'خط محدد' : 'جميع الخطوط'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الخط</label>
            <select
              value={filters.line_id}
              onChange={(e) => handleFilterChange('line_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الخطوط</option>
              {formOptions.lines.map(line => (
                <option key={line.id} value={line.id}>
                  {line.name} ({line.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
            <select
              value={filters.area_id}
              onChange={(e) => handleFilterChange('area_id', e.target.value)}
              disabled={!filters.line_id}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!filters.line_id ? 'bg-gray-100' : ''}`}
            >
              <option value="">جميع المناطق</option>
              {getFilteredAreas().map(area => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={filters.status_filter}
              onChange={(e) => handleFilterChange('status_filter', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="approved">معتمدة</option>
              <option value="pending">قيد المراجعة</option>
              <option value="all">جميع الحالات</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عدد النتائج</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({
              line_id: '',
              area_id: '',
              status_filter: 'approved',
              limit: 50
            })}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clinics.map((clinic) => {
          const distance = calculateDistance(
            clinic.location?.latitude,
            clinic.location?.longitude
          );

          return (
            <div key={clinic.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {clinic.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {clinic.registration_number}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {getClassificationBadge(clinic.classification)}
                    {getCreditBadge(clinic.credit_classification)}
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {clinic.primary_doctor_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {clinic.primary_doctor_specialty}
                  </p>
                </div>

                {/* Location Info */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    📍 {clinic.address}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{clinic.line_name}</span>
                    <span>{clinic.area_name}</span>
                  </div>
                  {distance && (
                    <p className="text-xs text-blue-600 mt-1">
                      🚗 {distance} كم من موقعك
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                {clinic.phone && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      📞 {clinic.phone}
                    </p>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{clinic.total_visits}</p>
                    <p className="text-xs text-gray-500">زيارة</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(clinic.total_revenue)}
                    </p>
                    <p className="text-xs text-gray-500">إيراد</p>
                  </div>
                </div>

                {/* Last Visit */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500">
                    آخر زيارة: {formatDate(clinic.last_visit_date)}
                  </p>
                </div>

                {/* Outstanding Debt */}
                {clinic.outstanding_debt > 0 && (
                  <div className="mb-4 p-2 bg-red-50 rounded">
                    <p className="text-sm text-red-600">
                      💳 ديون مستحقة: {formatCurrency(clinic.outstanding_debt)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openClinicDetails(clinic)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    عرض التفاصيل
                  </button>
                  <button
                    onClick={() => openEditModal(clinic)}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700"
                  >
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clinics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عيادات متاحة</h3>
          <p className="text-gray-600">
            تأكد من الفلاتر المحددة أو تواصل مع الإدارة لإضافة العيادات
          </p>
        </div>
      )}

      {/* Clinic Details Modal */}
      {showModal && selectedClinic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">تفاصيل العيادة</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">المعلومات الأساسية</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>الاسم:</strong> {selectedClinic.name}</p>
                  <p><strong>رقم التسجيل:</strong> {selectedClinic.registration_number}</p>
                  <p><strong>الهاتف:</strong> {selectedClinic.phone || 'غير محدد'}</p>
                  <p><strong>العنوان:</strong> {selectedClinic.address}</p>
                  <p><strong>التصنيف:</strong> {getClassificationBadge(selectedClinic.classification)}</p>
                  <p><strong>التصنيف الائتماني:</strong> {getCreditBadge(selectedClinic.credit_classification)}</p>
                </div>
              </div>

              {/* Doctor Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">معلومات الطبيب</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>الاسم:</strong> {selectedClinic.primary_doctor_name}</p>
                  <p><strong>التخصص:</strong> {selectedClinic.primary_doctor_specialty}</p>
                </div>
              </div>

              {/* Location Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">معلومات الموقع</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>الخط:</strong> {selectedClinic.line_name}</p>
                  <p><strong>المنطقة:</strong> {selectedClinic.area_name}</p>
                  <p><strong>المندوب المخصص:</strong> {selectedClinic.assigned_rep_name}</p>
                  {selectedClinic.location && (
                    <>
                      <p><strong>خط العرض:</strong> {selectedClinic.location.latitude}</p>
                      <p><strong>خط الطول:</strong> {selectedClinic.location.longitude}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">الإحصائيات</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>إجمالي الزيارات:</strong> {selectedClinic.total_visits}</p>
                  <p><strong>إجمالي الإيرادات:</strong> {formatCurrency(selectedClinic.total_revenue)}</p>
                  <p><strong>الديون المستحقة:</strong> {formatCurrency(selectedClinic.outstanding_debt)}</p>
                  <p><strong>آخر زيارة:</strong> {formatDate(selectedClinic.last_visit_date)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedClinic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">تعديل بيانات العيادة</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العيادة
                </label>
                <input
                  type="text"
                  value={editData.clinic_name}
                  onChange={(e) => setEditData(prev => ({...prev, clinic_name: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  هاتف العيادة
                </label>
                <input
                  type="tel"
                  value={editData.clinic_phone}
                  onChange={(e) => setEditData(prev => ({...prev, clinic_phone: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الطبيب
                  </label>
                  <input
                    type="text"
                    value={editData.primary_doctor_name}
                    onChange={(e) => setEditData(prev => ({...prev, primary_doctor_name: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التخصص
                  </label>
                  <input
                    type="text"
                    value={editData.primary_doctor_specialty}
                    onChange={(e) => setEditData(prev => ({...prev, primary_doctor_specialty: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان
                </label>
                <textarea
                  value={editData.clinic_address}
                  onChange={(e) => setEditData(prev => ({...prev, clinic_address: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب التعديل *
                </label>
                <textarea
                  value={editData.modification_reason}
                  onChange={(e) => setEditData(prev => ({...prev, modification_reason: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-16"
                  placeholder="اذكر سبب التعديل..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              
              <button
                onClick={saveClinicModification}
                disabled={!editData.modification_reason.trim()}
                className={`px-4 py-2 text-white rounded-md ${
                  editData.modification_reason.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableClinics;