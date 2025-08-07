// Enhanced Clinic Registration Component - تسجيل العيادات المحسن 
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import LiveGPSMap from '../Maps/LiveGPSMap';
import axios from 'axios';

const RepClinicRegistration = ({ user, language, isRTL }) => {
  const [clinicData, setClinicData] = useState({
    clinic_name: '',
    address: '',
    phone: '',
    doctor_name: '',
    clinic_class: 'Class A',
    credit_status: 'green',
    latitude: null,
    longitude: null,
    classification: 'class_c',
    manager_name: '',
    manager_phone: ''
  });
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [userLocationAtRegistration, setUserLocationAtRegistration] = useState(null);
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
        name: clinicData.clinic_name,
        address: clinicData.address,
        phone: clinicData.phone,
        owner_name: clinicData.doctor_name,
        latitude: parseFloat(clinicData.latitude),
        longitude: parseFloat(clinicData.longitude),
        classification: clinicData.classification,
        credit_status: clinicData.credit_status,
        manager_name: clinicData.manager_name || '',
        manager_phone: clinicData.manager_phone || '',
        registered_by: user?.id || user?.user_id
      };

      console.log('إرسال بيانات العيادة:', clinicPayload);

      const response = await axios.post(`${API}/clinics`, clinicPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess('تم تسجيل العيادة بنجاح! ✅');
        
        // Reset form
        setClinicData({
          clinic_name: '',
          address: '',
          phone: '',
          doctor_name: '',
          clinic_class: 'Class A',
          credit_status: 'green',
          latitude: currentLocation?.latitude || null,
          longitude: currentLocation?.longitude || null,
          classification: 'class_c',
          manager_name: '',
          manager_phone: ''
        });
        
        console.log('✅ تم تسجيل العيادة بنجاح:', response.data);
      }

    } catch (error) {
      console.error('❌ خطأ في تسجيل العيادة:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.message || 
                           `خطأ من الخادم: ${error.response.status}`;
        setError(errorMessage);
      } else if (error.request) {
        setError('لا يمكن الوصول إلى الخادم. تأكد من الاتصال بالإنترنت.');
      } else {
        setError('خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <span className="text-5xl">🏥</span>
            تسجيل عيادة جديدة
          </h1>
          <p className="text-blue-100 text-lg">
            سجل عيادة جديدة في النظام مع تحديد الموقع الجغرافي
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-center font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📝</span>
              البيانات الأساسية
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinic Name */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  اسم العيادة *
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={clinicData.clinic_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="مثال: عيادة د. أحمد للأسنان"
                />
              </div>

              {/* Doctor Name */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  اسم الطبيب المسؤول *
                </label>
                <input
                  type="text"
                  name="doctor_name"
                  value={clinicData.doctor_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="مثال: د. أحمد محمد"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={clinicData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="مثال: 01234567890"
                />
              </div>

              {/* Manager Name */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  اسم المسؤول/المدير
                </label>
                <input
                  type="text"
                  name="manager_name"
                  value={clinicData.manager_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="مثال: أ. سارة أحمد"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-white/90 mb-2">
                العنوان التفصيلي *
              </label>
              <textarea
                name="address"
                value={clinicData.address}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                placeholder="مثال: شارع الجلاء، المعادي، القاهرة"
              />
            </div>
          </div>

          {/* Location Section - خريطة بسيطة مع مؤشر أحمر فقط */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📍</span>
              تحديد الموقع على الخريطة
            </h2>

            {/* Simple Map Display */}
            {clinicData.latitude && clinicData.longitude ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>🗺️</span>
                    موقع العيادة على الخريطة
                  </h4>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    📍 استخدم موقعي الحالي
                  </button>
                </div>
                
                  
                  {/* Live GPS Map Component - خريطة GPS حية ودقيقة */}
                  <LiveGPSMap
                    onLocationCapture={(location) => {
                      setUserLocationAtRegistration(location);
                      setClinicData(prev => ({
                        ...prev,
                        latitude: location.latitude,
                        longitude: location.longitude
                      }));
                      console.log('📍 تم التقاط موقع المستخدم:', location);
                    }}
                    language={language}
                    readOnly={false}
                  />

                {/* Location Coordinates Input */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">
                        📍 خط العرض (Latitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={clinicData.latitude || ''}
                        onChange={(e) => setClinicData(prev => ({
                          ...prev,
                          latitude: parseFloat(e.target.value) || null
                        }))}
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                        placeholder="مثال: 30.0444"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">
                        📍 خط الطول (Longitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={clinicData.longitude || ''}
                        onChange={(e) => setClinicData(prev => ({
                          ...prev,
                          longitude: parseFloat(e.target.value) || null
                        }))}
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                        placeholder="مثال: 31.2357"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Location Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClinicData(prev => ({
                          ...prev,
                          latitude: 30.0444,
                          longitude: 31.2357
                        }));
                      }}
                      className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      📍 وسط القاهرة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClinicData(prev => ({
                          ...prev,
                          latitude: 31.2001,
                          longitude: 29.9187
                        }));
                      }}
                      className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      📍 الإسكندرية
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClinicData(prev => ({
                          ...prev,
                          latitude: 30.0131,
                          longitude: 31.2089
                        }));
                      }}
                      className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      📍 الجيزة
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-500 text-xl">⚠️</span>
                    </div>
                    <div className="mr-3">
                      <h4 className="text-yellow-800 font-medium">تحديد الموقع مطلوب</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        يرجى السماح بالوصول إلى موقعك أو إدخال الإحداثيات يدوياً.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual Location Entry */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <span>📍</span>
                    إدخال الموقع يدوياً
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">
                        خط العرض (Latitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={clinicData.latitude || ''}
                        onChange={(e) => setClinicData(prev => ({
                          ...prev,
                          latitude: parseFloat(e.target.value) || null
                        }))}
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                        placeholder="مثال: 30.0444"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">
                        خط الطول (Longitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={clinicData.longitude || ''}
                        onChange={(e) => setClinicData(prev => ({
                          ...prev,
                          longitude: parseFloat(e.target.value) || null
                        }))}
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                        placeholder="مثال: 31.2357"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Error */}
            {locationError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {locationError}
                </p>
              </div>
            )}
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

        {/* Help Section */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <span>💡</span>
            نصائح مفيدة
          </h3>
          <div className="text-white/80 space-y-2">
            <ul className="space-y-1">
              <li>• تأكد من دقة الموقع الجغرافي للعيادة</li>
              <li>• اختر تصنيف العيادة حسب معايير الجودة</li>
              <li>• الحالة الائتمانية تؤثر على شروط التعامل</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepClinicRegistration;