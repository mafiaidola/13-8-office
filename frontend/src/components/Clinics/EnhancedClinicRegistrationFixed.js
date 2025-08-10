// Enhanced Clinic Registration - Advanced GPS & Maps Integration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import axios from 'axios';

const EnhancedClinicRegistration = ({ language = 'en', theme = 'dark', user }) => {
  const { t, tc, tm } = useGlobalTranslation(language);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    clinic_email: '',
    doctor_name: '',
    doctor_phone: '',
    clinic_address: '', // Now optional
    line_id: '',
    area_id: '',
    classification: 'class_b',
    credit_classification: 'yellow',
    classification_notes: '',
    registration_notes: ''
  });

  // Location state with enhanced GPS tracking
  const [locationData, setLocationData] = useState({
    clinic_latitude: null,
    clinic_longitude: null,
    location_accuracy: null,
    formatted_address: '',
    place_id: null,
    address_components: []
  });

  // Map and GPS state
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle, requesting, locating, found, error
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Options state
  const [lines, setLines] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const geocoderRef = useRef(null);
  
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Enhanced GPS options for maximum accuracy
  const gpsOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 0 // No cache, always get fresh location
  };

  // Load form options
  useEffect(() => {
    loadFormOptions();
    return () => {
      // Cleanup GPS watch if active
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Initialize Google Maps when available
  useEffect(() => {
    if (window.google && !mapLoaded) {
      initializeGoogleMaps();
      setMapLoaded(true);
    }
  }, [mapLoaded]);

  const loadFormOptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [linesRes, areasRes] = await Promise.all([
        axios.get(`${API_URL}/api/lines`, { headers }),
        axios.get(`${API_URL}/api/areas`, { headers })
      ]);

      setLines(linesRes.data || []);
      setAreas(areasRes.data || []);
    } catch (error) {
      console.error('Error loading form options:', error);
      // Fallback data
      setLines([
        { id: 'line-001', name: language === 'ar' ? 'خط القاهرة الكبرى' : 'Greater Cairo Line' },
        { id: 'line-002', name: language === 'ar' ? 'خط الإسكندرية' : 'Alexandria Line' }
      ]);
      setAreas([
        { id: 'area-001', name: language === 'ar' ? 'وسط البلد' : 'Downtown', line_id: 'line-001' },
        { id: 'area-002', name: language === 'ar' ? 'مدينة نصر' : 'Nasr City', line_id: 'line-001' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get current location with high accuracy
  const getCurrentLocation = () => {
    setGpsStatus('searching');
    
    if (!navigator.geolocation) {
      setGpsStatus('error');
      alert(language === 'ar' ? 'الجهاز لا يدعم تحديد الموقع' : 'Geolocation is not supported');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocationData({
          clinic_latitude: latitude,
          clinic_longitude: longitude,
          location_accuracy: accuracy
        });
        setGpsStatus('found');
        
        if (window.google && mapRef.current) {
          initializeMap(latitude, longitude);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGpsStatus('error');
        alert(language === 'ar' ? 'فشل في تحديد الموقع، يرجى المحاولة مرة أخرى' : 'Failed to get location, please try again');
      },
      options
    );
  };

  // Initialize Google Maps
  const initializeMap = (lat, lng) => {
    if (!window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 16,
      mapTypeId: 'roadmap'
    });

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      draggable: true,
      title: language === 'ar' ? 'موقع العيادة' : 'Clinic Location'
    });

    marker.addListener('dragend', (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      setLocationData(prev => ({
        ...prev,
        clinic_latitude: newLat,
        clinic_longitude: newLng
      }));
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!locationData.clinic_latitude || !locationData.clinic_longitude) {
      alert(language === 'ar' ? 'يرجى تحديد موقع العيادة على الخريطة' : 'Please set the clinic location on the map');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const submitData = {
        ...formData,
        ...locationData,
        registered_by: user?.username || 'system'
      };

      const response = await axios.post(`${API_URL}/api/clinics`, submitData, { headers });
      
      if (response.status === 201) {
        alert(tm('createSuccess'));
        // Reset form
        setFormData({
          clinic_name: '',
          clinic_phone: '',
          clinic_email: '',
          doctor_name: '',
          doctor_phone: '',
          clinic_address: '',
          line_id: '',
          area_id: '',
          classification: 'class_b',
          credit_classification: 'yellow',
          classification_notes: '',
          registration_notes: ''
        });
        setLocationData({
          clinic_latitude: null,
          clinic_longitude: null,
          location_accuracy: null
        });
        setGpsStatus('idle');
      }
    } catch (error) {
      console.error('Error saving clinic:', error);
      alert(tm('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Get filtered areas based on selected line
  const filteredAreas = areas.filter(area => 
    !formData.line_id || area.line_id === formData.line_id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white">🏥</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          {t('clinics', 'addClinic')}
        </h1>
        <p className="text-lg text-gray-600">
          {language === 'ar' ? 'تسجيل العيادات الطبية مع تحديد الموقع الدقيق' : 'Medical clinic registration with precise location'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-blue-600 mr-3 text-2xl">ℹ️</span>
            {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('clinics', 'clinicName')} *
              </label>
              <input
                type="text"
                name="clinic_name"
                value={formData.clinic_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ar' ? 'اسم العيادة' : 'Clinic Name'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('clinics', 'doctorName')} *
              </label>
              <input
                type="text"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ar' ? 'اسم الطبيب' : 'Doctor Name'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tc('phone')} *
              </label>
              <input
                type="tel"
                name="clinic_phone"
                value={formData.clinic_phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ar' ? 'رقم العيادة' : 'Clinic Phone'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users', 'email')}
              </label>
              <input
                type="email"
                name="clinic_email"
                value={formData.clinic_email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users', 'address')} *
            </label>
            <textarea
              name="clinic_address"
              value={formData.clinic_address}
              onChange={handleInputChange}
              required
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={language === 'ar' ? 'عنوان العيادة التفصيلي' : 'Detailed clinic address'}
            />
          </div>
        </div>

        {/* Location & Classification */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-green-600 mr-3 text-2xl">📍</span>
            {language === 'ar' ? 'الموقع والتصنيف' : 'Location & Classification'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الخط' : 'Line'} *
              </label>
              <select
                name="line_id"
                value={formData.line_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{language === 'ar' ? 'اختر الخط' : 'Select Line'}</option>
                {lines.map(line => (
                  <option key={line.id} value={line.id}>{line.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المنطقة' : 'Area'} *
              </label>
              <select
                name="area_id"
                value={formData.area_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Area'}</option>
                {filteredAreas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'تصنيف العيادة' : 'Clinic Classification'}
              </label>
              <select
                name="classification"
                value={formData.classification}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="class_a">{language === 'ar' ? 'فئة أ - ممتاز' : 'Class A - Excellent'}</option>
                <option value="class_b">{language === 'ar' ? 'فئة ب - جيد' : 'Class B - Good'}</option>
                <option value="class_c">{language === 'ar' ? 'فئة ج - مقبول' : 'Class C - Acceptable'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'التصنيف الائتماني' : 'Credit Classification'}
              </label>
              <select
                name="credit_classification"
                value={formData.credit_classification}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="green">{language === 'ar' ? 'أخضر - آمن' : 'Green - Safe'}</option>
                <option value="yellow">{language === 'ar' ? 'أصفر - متوسط' : 'Yellow - Medium'}</option>
                <option value="red">{language === 'ar' ? 'أحمر - مخاطر' : 'Red - Risk'}</option>
              </select>
            </div>
          </div>

          {/* GPS Location Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="text-blue-600 mr-2 text-xl">🗺️</span>
                {language === 'ar' ? 'تحديد الموقع الجغرافي' : 'Geographic Location'}
              </h3>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsStatus === 'searching'}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  gpsStatus === 'searching'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : gpsStatus === 'found'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {gpsStatus === 'searching' && (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                )}
                {gpsStatus === 'searching' 
                  ? (language === 'ar' ? 'جاري التحديد...' : 'Locating...')
                  : gpsStatus === 'found'
                  ? (language === 'ar' ? 'تم التحديد ✓' : 'Located ✓')
                  : (language === 'ar' ? 'تحديد موقعي' : 'Get My Location')
                }
              </button>
            </div>

            {locationData.clinic_latitude && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center text-green-700">
                  <span className="text-xl mr-2">✅</span>
                  <div>
                    <p className="font-medium">
                      {language === 'ar' ? 'تم تحديد الموقع بنجاح' : 'Location successfully determined'}
                    </p>
                    <p className="text-sm">
                      {language === 'ar' ? 'خط العرض' : 'Latitude'}: {locationData.clinic_latitude.toFixed(6)}, 
                      {language === 'ar' ? ' خط الطول' : ' Longitude'}: {locationData.clinic_longitude.toFixed(6)}
                    </p>
                    {locationData.location_accuracy && (
                      <p className="text-sm">
                        {language === 'ar' ? 'دقة الموقع' : 'Accuracy'}: {locationData.location_accuracy.toFixed(0)}m
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <div ref={mapRef} className="w-full h-full rounded-lg">
                {!locationData.clinic_latitude ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <span className="text-4xl mb-2">🗺️</span>
                    <p>{language === 'ar' ? 'اضغط "تحديد موقعي" لعرض الخريطة' : 'Click "Get My Location" to show map'}</p>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🗺️ {language === 'ar' ? 'الخريطة' : 'Map'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={saving || !locationData.clinic_latitude}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              saving || !locationData.clinic_latitude
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {saving ? (
              <>
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                {tc('loading')}
              </>
            ) : (
              <>
                <span className="mr-2">✅</span>
                {language === 'ar' ? 'تسجيل العيادة' : 'Register Clinic'}
              </>
            )}
          </button>
          
          {!locationData.clinic_latitude && (
            <p className="text-red-600 text-sm mt-2">
              {language === 'ar' ? '⚠️ يرجى تحديد موقع العيادة أولاً' : '⚠️ Please set clinic location first'}
            </p>
          )}
        </div>
      </form>

      {/* Load Google Maps Script */}
      {typeof window !== 'undefined' && !window.google && (
        <script
          async
          defer
          src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry,places"
          onLoad={() => console.log('Google Maps loaded')}
        />
      )}
    </div>
  );
};

export default EnhancedClinicRegistration;