// Enhanced Clinic Registration Component - تسجيل العيادات المحسن
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const RepClinicRegistration = ({ user, language, isRTL }) => {
  const [clinicData, setClinicData] = useState({
    clinic_name: '',
    address: '',
    phone: '',
    doctor_name: '',
    clinic_class: 'Class A', // تصنيف العيادة
    credit_status: 'green', // الحالة الائتمانية: green, yellow, red
    specialization: '',
    latitude: null,
    longitude: null,
    classification: 'class_c'
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  
  const { t } = useTranslation(language);
  const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
          
          // Auto-set clinic location to current location initially
          setClinicData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          
          console.log('تم الحصول على الموقع الحالي بنجاح');
        },
        (error) => {
          console.error('خطأ في الحصول على الموقع:', error);
          setLocationError('لا يمكن الحصول على الموقع الحالي');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setLocationError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClinicData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getClassificationColor = (classification) => {
    const colors = {
      'class_a': 'bg-green-500',
      'class_b': 'bg-blue-500',
      'class_c': 'bg-yellow-500',
      'class_d': 'bg-red-500'
    };
    return colors[classification] || 'bg-gray-500';
  };

  const getClassificationLabel = (classification) => {
    const labels = {
      'class_a': 'الفئة أ - ممتاز',
      'class_b': 'الفئة ب - جيد جداً',
      'class_c': 'الفئة ج - جيد',
      'class_d': 'الفئة د - مقبول'
    };
    return labels[classification] || classification;
  };

  const getCreditStatusColor = (status) => {
    const colors = {
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-500',
      'red': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getCreditStatusLabel = (status) => {
    const labels = {
      'green': 'ممتاز - ائتمان عالي',
      'yellow': 'متوسط - ائتمان محدود',
      'red': 'ضعيف - ائتمان منخفض'
    };
    return labels[status] || status;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clinicData.latitude || !clinicData.longitude) {
      setError('يرجى تحديد موقع العيادة');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const clinicPayload = {
        clinic_name: clinicData.clinic_name,
        address: clinicData.address,
        phone: clinicData.phone,
        doctor_name: clinicData.doctor_name,
        classification: clinicData.classification,
        credit_status: clinicData.credit_status,
        specialization: clinicData.specialization,
        latitude: clinicData.latitude,
        longitude: clinicData.longitude,
        status: 'approved',
        added_by: user?.id,
        registration_metadata: {
          registered_by: user?.id,
          registered_by_name: user?.full_name || user?.username,
          registration_time: new Date().toISOString(),
          rep_actual_location: currentLocation
        }
      };

      const response = await axios.post(`${API}/clinics`, clinicPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم تسجيل العيادة بنجاح! ✅');
      
      // إعادة تعيين النموذج
      setClinicData({
        clinic_name: '',
        address: '',
        phone: '',
        doctor_name: '',
        clinic_class: 'Class A',
        credit_status: 'green',
        specialization: '',
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        classification: 'class_c'
      });

    } catch (error) {
      console.error('خطأ في تسجيل العيادة:', error);
      
      let errorMessage = 'فشل في تسجيل العيادة';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية لتسجيل العيادات';
      } else if (error.response?.status === 401) {
        errorMessage = 'يرجى تسجيل الدخول مرة أخرى';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="clinic-registration-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">🏥</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('clinics', 'registerClinic')}</h1>
            <p className="text-lg opacity-75">إضافة عيادة طبية جديدة إلى النظام مع تصنيف وتقييم ائتماني</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 flex items-center gap-2">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}

      {locationError && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-200 flex items-center gap-2">
          <span>⚠️</span>
          {locationError}
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>📋</span>
              المعلومات الأساسية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'clinicName')} *
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={clinicData.clinic_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل اسم العيادة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'doctorName')} *
                </label>
                <input
                  type="text"
                  name="doctor_name"
                  value={clinicData.doctor_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل اسم الطبيب"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'clinicPhone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={clinicData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل رقم الهاتف"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('clinics', 'specialization')}
                </label>
                <select
                  name="specialization"
                  value={clinicData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">اختر التخصص</option>
                  <option value="general">طب عام</option>
                  <option value="internal">باطنة</option>
                  <option value="cardiology">قلب</option>
                  <option value="dermatology">جلدية</option>
                  <option value="orthopedics">عظام</option>
                  <option value="pediatrics">أطفال</option>
                  <option value="gynecology">نساء وولادة</option>
                  <option value="neurology">مخ وأعصاب</option>
                  <option value="ophthalmology">عيون</option>
                  <option value="ent">أنف وأذن وحنجرة</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                {t('clinics', 'clinicAddress')} *
              </label>
              <textarea
                name="address"
                value={clinicData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="أدخل عنوان العيادة التفصيلي"
                required
              />
            </div>
          </div>

          {/* Classification & Credit Status */}
          <div className="form-section">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>🏆</span>
              التصنيف والتقييم الائتماني
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  تصنيف العيادة
                </label>
                <select
                  name="classification"
                  value={clinicData.classification}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="class_a">الفئة أ - ممتاز</option>
                  <option value="class_b">الفئة ب - جيد جداً</option>
                  <option value="class_c">الفئة ج - جيد</option>
                  <option value="class_d">الفئة د - مقبول</option>
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getClassificationColor(clinicData.classification)}`}></div>
                  <span className="text-sm opacity-75">{getClassificationLabel(clinicData.classification)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  الحالة الائتمانية
                </label>
                <select
                  name="credit_status"
                  value={clinicData.credit_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="green">أخضر - ائتمان ممتاز</option>
                  <option value="yellow">أصفر - ائتمان متوسط</option>
                  <option value="red">أحمر - ائتمان ضعيف</option>
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getCreditStatusColor(clinicData.credit_status)}`}></div>
                  <span className="text-sm opacity-75">{getCreditStatusLabel(clinicData.credit_status)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>📍</span>
              معلومات الموقع
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  خط العرض (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={clinicData.latitude || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="30.0444"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  خط الطول (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={clinicData.longitude || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="31.2357"
                />
              </div>
            </div>

            {/* Location Status */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentLocation && (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <span>✅</span>
                    تم تحديد موقعك الحالي بنجاح
                  </p>
                  <p className="text-xs text-green-200 mt-1">
                    دقة التحديد: {currentLocation.accuracy?.toFixed(0)} متر
                  </p>
                </div>
              )}
              
              {clinicData.latitude && clinicData.longitude && (
                <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm flex items-center gap-2">
                    <span>📍</span>
                    تم تحديد موقع العيادة
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {clinicData.latitude.toFixed(6)}, {clinicData.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 min-w-[200px] justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <span>✅</span>
                  تسجيل العيادة
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>💡</span>
          إرشادات التسجيل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm opacity-75">
          <div>
            <h4 className="font-bold mb-2">📋 المعلومات الأساسية</h4>
            <ul className="space-y-1">
              <li>• تأكد من إدخال جميع المعلومات بدقة</li>
              <li>• اسم العيادة يجب أن يكون واضحاً ومحدداً</li>
              <li>• أدخل رقم هاتف صحيح للتواصل</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">🏆 التصنيف والتقييم</h4>
            <ul className="space-y-1">
              <li>• الفئة أ: عيادات ممتازة بمعايير عالية</li>
              <li>• الأخضر: ائتمان ممتاز، عمليات سلسة</li>
              <li>• الأصفر: يحتاج متابعة ائتمانية</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepClinicRegistration;