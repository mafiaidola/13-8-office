import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EnhancedClinicRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    clinic_email: '',
    doctor_name: '',
    doctor_specialty: '',
    doctor_phone: '',
    clinic_address: '',
    line_id: '',
    area_id: '',
    district_id: '',
    // إضافة التصنيفات المطلوبة
    classification: 'class_b', // تصنيف العيادة الافتراضي
    credit_classification: 'yellow', // التصنيف الائتماني الافتراضي
    classification_notes: '',
    registration_notes: ''
  });
  
  const [locationData, setLocationData] = useState({
    clinic_latitude: null,
    clinic_longitude: null,
    location_accuracy: null,
    rep_latitude: null,
    rep_longitude: null,
    rep_location_accuracy: null,
    device_info: ''
  });
  
  const [formOptions, setFormOptions] = useState({
    lines: [],
    areas: [],
    districts: [],
    classifications: [],
    credit_classifications: []
  });
  
  const [errors, setErrors] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    loadFormData();
    loadGoogleMaps();
    getCurrentLocation();
  }, []);

  // تهيئة الخريطة عند تحميل Google Maps
  useEffect(() => {
    if (mapLoaded && !mapInitialized) {
      initializeMap();
      setMapInitialized(true);
    }
  }, [mapLoaded, userLocation]);

  const loadFormData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/enhanced-clinics/registration/form-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.success) {
        setFormOptions(response.data.data);
        console.log('✅ تم تحميل بيانات النموذج:', response.data.data);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات النموذج:', error);
      setErrors({general: 'خطأ في تحميل بيانات النموذج'});
    }
  };

  const loadGoogleMaps = () => {
    // التحقق إذا كانت مكتبة Google Maps محملة بالفعل
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('🗺️ تحميل خرائط جوجل مع المفتاح:', apiKey ? 'موجود' : 'مفقود');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar&region=EG`;
    script.async = true;
    script.onload = () => {
      console.log('✅ تم تحميل خرائط جوجل بنجاح');
      setMapLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ فشل في تحميل خرائط جوجل');
      setErrors({map: 'فشل في تحميل خرائط جوجل - يرجى التأكد من مفتاح API'});
    };
    document.head.appendChild(script);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(userLoc);
          console.log('📍 تم الحصول على الموقع الحالي:', userLoc);
          
          // تسجيل موقع المندوب
          setLocationData(prev => ({
            ...prev,
            rep_latitude: userLoc.lat,
            rep_longitude: userLoc.lng,
            rep_location_accuracy: userLoc.accuracy,
            device_info: navigator.userAgent
          }));
        },
        (error) => {
          console.error('❌ خطأ في الحصول على الموقع:', error);
          // استخدام موقع افتراضي (القاهرة)
          const defaultLocation = { lat: 30.0444, lng: 31.2357, accuracy: null };
          setUserLocation(defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      console.warn('⚠️ الجهاز لا يدعم تحديد الموقع');
      // استخدام موقع افتراضي (القاهرة)
      const defaultLocation = { lat: 30.0444, lng: 31.2357, accuracy: null };
      setUserLocation(defaultLocation);
    }
  };

  const initializeMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      console.error('❌ Google Maps غير متاح أو عنصر الخريطة غير موجود');
      return;
    }

    try {
      // إعداد الموقع الافتراضي
      const defaultCenter = userLocation || { lat: 30.0444, lng: 31.2357 }; // القاهرة
      
      console.log('🗺️ تهيئة الخريطة في الموقع:', defaultCenter);

      // إنشاء الخريطة
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        zoomControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b7280" }]
          }
        ]
      });

      // إنشاء دبوس قابل للسحب
      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: 'موقع العيادة - يمكنك سحبه لتحديد الموقع الدقيق',
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      });

      // حفظ المراجع
      mapInstanceRef.current = map;
      markerRef.current = marker;

      // معالجة سحب الدبوس
      marker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        console.log('📍 تم تحديد موقع جديد:', { lat, lng });
        
        setLocationData(prev => ({
          ...prev,
          clinic_latitude: lat,
          clinic_longitude: lng,
          location_accuracy: 10 // دقة عالية للموقع المحدد يدوياً
        }));

        // الحصول على العنوان من الإحداثيات
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setFormData(prev => ({
              ...prev,
              clinic_address: address
            }));
            console.log('🏠 تم تحديث العنوان:', address);
          }
        });
      });

      // إضافة مربع البحث
      const searchInput = document.getElementById('address-search');
      if (searchInput) {
        const searchBox = new window.google.maps.places.SearchBox(searchInput);
        map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchInput);

        // التحديث عند البحث
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length === 0) return;

          const place = places[0];
          if (!place.geometry || !place.geometry.location) return;

          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          console.log('🔍 تم العثور على المكان:', { lat, lng, name: place.name });

          // تحديث الخريطة والدبوس
          map.setCenter({ lat, lng });
          map.setZoom(17);
          marker.setPosition({ lat, lng });
          
          setLocationData(prev => ({
            ...prev,
            clinic_latitude: lat,
            clinic_longitude: lng,
            location_accuracy: 5 // دقة عالية للبحث
          }));

          setFormData(prev => ({
            ...prev,
            clinic_address: place.formatted_address || place.name
          }));
        });
      }

      // النقر على الخريطة لتحديد الموقع
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        console.log('🖱️ تم النقر على الخريطة:', { lat, lng });
        
        marker.setPosition({ lat, lng });
        
        setLocationData(prev => ({
          ...prev,
          clinic_latitude: lat,
          clinic_longitude: lng,
          location_accuracy: 10
        }));

        // الحصول على العنوان
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setFormData(prev => ({
              ...prev,
              clinic_address: address
            }));
          }
        });
      });

      console.log('✅ تم تهيئة الخريطة بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تهيئة الخريطة:', error);
      setErrors({map: 'خطأ في تهيئة الخريطة'});
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // إزالة رسالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const getFilteredAreas = () => {
    if (!formData.line_id) return [];
    return formOptions.areas.filter(area => area.parent_line_id === formData.line_id);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // التحقق من الحقول المطلوبة
    if (!formData.clinic_name.trim()) newErrors.clinic_name = 'اسم العيادة مطلوب';
    if (!formData.doctor_name.trim()) newErrors.doctor_name = 'اسم الطبيب مطلوب';
    if (!formData.doctor_specialty.trim()) newErrors.doctor_specialty = 'التخصص مطلوب';
    if (!formData.line_id) newErrors.line_id = 'يجب اختيار الخط';
    if (!formData.area_id) newErrors.area_id = 'يجب اختيار المنطقة';
    if (!formData.clinic_address.trim()) newErrors.clinic_address = 'عنوان العيادة مطلوب';
    
    // التحقق من الموقع
    if (!locationData.clinic_latitude || !locationData.clinic_longitude) {
      newErrors.location = 'يجب تحديد موقع العيادة على الخريطة';
    }
    
    // التحقق من رقم الهاتف
    if (formData.clinic_phone && !/^[0-9+\-\s()]+$/.test(formData.clinic_phone)) {
      newErrors.clinic_phone = 'رقم الهاتف غير صحيح';
    }
    
    // التحقق من البريد الإلكتروني
    if (formData.clinic_email && !/\S+@\S+\.\S+/.test(formData.clinic_email)) {
      newErrors.clinic_email = 'البريد الإلكتروني غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const requestData = {
        ...formData,
        ...locationData
      };

      console.log('📤 إرسال بيانات تسجيل العيادة:', requestData);

      const response = await axios.post(
        `${backendUrl}/api/enhanced-clinics/register`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ تم تسجيل العيادة بنجاح!\n\nرقم التسجيل: ${response.data.registration_number}\nالحالة: ${response.data.status}\n\nتصنيف العيادة: ${getClassificationLabel(formData.classification)}\nالتصنيف الائتماني: ${getCreditClassificationLabel(formData.credit_classification)}`);
        
        // إعادة تعيين النموذج
        setFormData({
          clinic_name: '',
          clinic_phone: '',
          clinic_email: '',
          doctor_name: '',
          doctor_specialty: '',
          doctor_phone: '',
          clinic_address: '',
          line_id: '',
          area_id: '',
          district_id: '',
          classification: 'class_b',
          credit_classification: 'yellow',
          classification_notes: '',
          registration_notes: ''
        });
        
        setLocationData({
          clinic_latitude: null,
          clinic_longitude: null,
          location_accuracy: null,
          rep_latitude: userLocation?.lat || null,
          rep_longitude: userLocation?.lng || null,
          rep_location_accuracy: userLocation?.accuracy || null,
          device_info: navigator.userAgent
        });

        // إعادة تعيين الخريطة للموقع الحالي
        if (mapInstanceRef.current && markerRef.current && userLocation) {
          mapInstanceRef.current.setCenter(userLocation);
          markerRef.current.setPosition(userLocation);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل العيادة:', error);
      if (error.response?.data?.detail) {
        setErrors({general: error.response.data.detail});
      } else {
        setErrors({general: 'حدث خطأ أثناء تسجيل العيادة'});
      }
    } finally {
      setLoading(false);
    }
  };

  // دوال مساعدة للحصول على تسميات التصنيفات
  const getClassificationLabel = (value) => {
    const classification = formOptions.classifications.find(c => c.value === value);
    return classification ? classification.label : value;
  };

  const getCreditClassificationLabel = (value) => {
    const classification = formOptions.credit_classifications.find(c => c.value === value);
    return classification ? classification.label : value;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏥 تسجيل عيادة جديدة
        </h1>
        <p className="text-gray-600">
          يرجى ملء جميع البيانات المطلوبة وتحديد موقع العيادة على الخريطة بدقة
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
          <p className="text-red-700">❌ {errors.general}</p>
        </div>
      )}

      {errors.map && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
          <p className="text-yellow-700">⚠️ {errors.map}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* قسم الخريطة التفاعلية */}
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
            🗺️ تحديد موقع العيادة على الخريطة
          </h3>
          
          {/* مربع البحث */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              🔍 البحث عن العنوان (اختياري)
            </label>
            <input
              id="address-search"
              type="text"
              placeholder="ابحث عن عنوان العيادة هنا..."
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-blue-600 mt-1">
              💡 يمكنك البحث بالاسم أو العنوان، أو النقر مباشرة على الخريطة، أو سحب الدبوس الأحمر
            </p>
          </div>

          {/* الخريطة */}
          <div className="relative">
            <div 
              ref={mapRef}
              style={{ height: '400px', width: '100%' }}
              className="rounded-lg border-2 border-gray-300 bg-gray-100"
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري تحميل الخريطة...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* معلومات الموقع */}
            {locationData.clinic_latitude && locationData.clinic_longitude && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ <strong>تم تحديد الموقع:</strong><br/>
                  خط العرض: {locationData.clinic_latitude.toFixed(6)}<br/>
                  خط الطول: {locationData.clinic_longitude.toFixed(6)}
                  {locationData.location_accuracy && (
                    <><br/>دقة الموقع: {locationData.location_accuracy} متر</>
                  )}
                </p>
              </div>
            )}

            {errors.location && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">❌ {errors.location}</p>
              </div>
            )}
        </div>

        {/* قسم بيانات العيادة الأساسية */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🏥 بيانات العيادة الأساسية
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العيادة *
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل اسم العيادة"
              />
              {errors.clinic_name && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم هاتف العيادة
              </label>
              <input
                type="tel"
                value={formData.clinic_phone}
                onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="01xxxxxxxxx"
              />
              {errors.clinic_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني للعيادة
              </label>
              <input
                type="email"
                value={formData.clinic_email}
                onChange={(e) => handleInputChange('clinic_email', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="clinic@example.com"
              />
              {errors.clinic_email && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان العيادة *
              </label>
              <input
                type="text"
                value={formData.clinic_address}
                onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="سيتم ملؤه تلقائياً من الخريطة"
                readOnly
              />
              {errors.clinic_address && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* قسم بيانات الطبيب */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
            👨‍⚕️ بيانات الطبيب
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-green-800 mb-2">
                اسم الطبيب *
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => handleInputChange('doctor_name', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.doctor_name ? 'border-red-500' : 'border-green-300'
                }`}
                placeholder="د. أحمد محمد"
              />
              {errors.doctor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.doctor_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-green-800 mb-2">
                التخصص *
              </label>
              <input
                type="text"
                value={formData.doctor_specialty}
                onChange={(e) => handleInputChange('doctor_specialty', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.doctor_specialty ? 'border-red-500' : 'border-green-300'
                }`}
                placeholder="طب عام، باطنة، أطفال..."
              />
              {errors.doctor_specialty && (
                <p className="mt-1 text-sm text-red-600">{errors.doctor_specialty}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-green-800 mb-2">
                رقم هاتف الطبيب
              </label>
              <input
                type="tel"
                value={formData.doctor_phone}
                onChange={(e) => handleInputChange('doctor_phone', e.target.value)}
                className="w-full px-3 py-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* قسم التقسيم الإداري */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
            🗂️ التقسيم الإداري والجغرافي
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-800 mb-2">
                الخط *
              </label>
              <select
                value={formData.line_id}
                onChange={(e) => handleInputChange('line_id', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.line_id ? 'border-red-500' : 'border-purple-300'
                }`}
              >
                <option value="">اختر الخط</option>
                {formOptions.lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </select>
              {errors.line_id && (
                <p className="mt-1 text-sm text-red-600">{errors.line_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-800 mb-2">
                المنطقة *
              </label>
              <select
                value={formData.area_id}
                onChange={(e) => handleInputChange('area_id', e.target.value)}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.area_id ? 'border-red-500' : 'border-purple-300'
                }`}
                disabled={!formData.line_id}
              >
                <option value="">اختر المنطقة</option>
                {getFilteredAreas().map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {errors.area_id && (
                <p className="mt-1 text-sm text-red-600">{errors.area_id}</p>
              )}
              {!formData.line_id && (
                <p className="mt-1 text-xs text-purple-600">يجب اختيار الخط أولاً</p>
              )}
            </div>
          </div>
        </div>

        {/* قسم تصنيفات العيادة - الجديد */}
        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
          <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
            ⭐ تصنيفات العيادة
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* تصنيف العيادة */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-2">
                تصنيف العيادة *
              </label>
              <select
                value={formData.classification}
                onChange={(e) => handleInputChange('classification', e.target.value)}
                className="w-full px-3 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {formOptions.classifications.map((classification) => (
                  <option 
                    key={classification.value} 
                    value={classification.value}
                    style={{ color: classification.color }}
                  >
                    {classification.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-orange-600">
                تصنيف العيادة حسب الأداء والجودة
              </p>
            </div>

            {/* التصنيف الائتماني */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-2">
                التصنيف الائتماني *
              </label>
              <select
                value={formData.credit_classification}
                onChange={(e) => handleInputChange('credit_classification', e.target.value)}
                className="w-full px-3 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {formOptions.credit_classifications.map((classification) => (
                  <option 
                    key={classification.value} 
                    value={classification.value}
                    style={{ color: classification.color }}
                  >
                    {classification.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-orange-600">
                التصنيف الائتماني للعيادة (أخضر/أصفر/أحمر)
              </p>
            </div>

            {/* ملاحظات التصنيف */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-orange-800 mb-2">
                ملاحظات التصنيف
              </label>
              <textarea
                value={formData.classification_notes}
                onChange={(e) => handleInputChange('classification_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="ملاحظات حول تصنيف العيادة (اختياري)..."
              />
            </div>
          </div>

          {/* عرض التصنيفات المختارة */}
          <div className="mt-4 p-4 bg-white rounded-md border border-orange-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">التصنيفات المختارة:</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🏥 {getClassificationLabel(formData.classification)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  💳 {getCreditClassificationLabel(formData.credit_classification)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* قسم الملاحظات */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            📝 ملاحظات إضافية
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات التسجيل
            </label>
            <textarea
              value={formData.registration_notes}
              onChange={(e) => handleInputChange('registration_notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أي ملاحظات إضافية حول العيادة أو عملية التسجيل..."
            />
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            ⬅️ رجوع
          </button>
          
          <button
            type="submit"
            disabled={loading || !mapLoaded}
            className={`px-8 py-3 border border-transparent rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              loading || !mapLoaded
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري التسجيل...
              </span>
            ) : (
              '✅ تسجيل العيادة'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedClinicRegistration;

          // إذا كانت الخريطة محملة، قم بتحديث موقع العيادة الافتراضي
          if (mapLoaded && !locationData.clinic_latitude) {
            setLocationData(prev => ({
              ...prev,
              clinic_latitude: userLoc.lat,
              clinic_longitude: userLoc.lng
            }));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors({location: 'فشل في الحصول على الموقع الحالي'});
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setErrors({location: 'خدمة تحديد الموقع غير مدعومة في هذا المتصفح'});
    }
  };

  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      initializeMap();
    }
  }, [mapLoaded, userLocation]);

  const initializeMap = () => {
    if (!window.google || !window.google.maps) return;

    const defaultCenter = userLocation || { lat: 30.0444, lng: 31.2357 }; // القاهرة كافتراضي
    
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: defaultCenter,
      mapTypeId: 'roadmap',
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    });

    mapInstanceRef.current = map;

    // إنشاء الدبوس القابل للسحب
    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map: map,
      draggable: true,
      title: 'موقع العيادة - يمكنك سحب الدبوس لتحديد الموقع الدقيق',
      icon: {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#DC2626"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40)
      }
    });

    markerRef.current = marker;

    // تحديث البيانات عند سحب الدبوس
    marker.addListener('dragend', (event) => {
      const position = event.latLng;
      const lat = position.lat();
      const lng = position.lng();
      
      setLocationData(prev => ({
        ...prev,
        clinic_latitude: lat,
        clinic_longitude: lng
      }));

      // الحصول على العنوان من الإحداثيات
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({
            ...prev,
            clinic_address: results[0].formatted_address
          }));
        }
      });
    });

    // البحث في الأماكن
    const searchBox = new window.google.maps.places.SearchBox(
      document.getElementById('address-search')
    );

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places.length === 0) return;

      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;

      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      // تحديث الخريطة والدبوس
      map.setCenter({ lat, lng });
      marker.setPosition({ lat, lng });
      
      setLocationData(prev => ({
        ...prev,
        clinic_latitude: lat,
        clinic_longitude: lng
      }));

      setFormData(prev => ({
        ...prev,
        clinic_address: place.formatted_address || place.name
      }));
    });

    // تحديث الموقع الافتراضي إذا كان متوفراً
    if (locationData.clinic_latitude && locationData.clinic_longitude) {
      const clinicPosition = {
        lat: locationData.clinic_latitude,
        lng: locationData.clinic_longitude
      };
      map.setCenter(clinicPosition);
      marker.setPosition(clinicPosition);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // إزالة رسالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const getFilteredAreas = () => {
    if (!formData.line_id) return [];
    return formOptions.areas.filter(area => area.parent_line_id === formData.line_id);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // التحقق من الحقول المطلوبة
    if (!formData.clinic_name.trim()) newErrors.clinic_name = 'اسم العيادة مطلوب';
    if (!formData.doctor_name.trim()) newErrors.doctor_name = 'اسم الطبيب مطلوب';
    if (!formData.doctor_specialty.trim()) newErrors.doctor_specialty = 'التخصص مطلوب';
    if (!formData.line_id) newErrors.line_id = 'يجب اختيار الخط';
    if (!formData.area_id) newErrors.area_id = 'يجب اختيار المنطقة';
    if (!formData.clinic_address.trim()) newErrors.clinic_address = 'عنوان العيادة مطلوب';
    
    // التحقق من الموقع
    if (!locationData.clinic_latitude || !locationData.clinic_longitude) {
      newErrors.location = 'يجب تحديد موقع العيادة على الخريطة';
    }
    
    // التحقق من رقم الهاتف
    if (formData.clinic_phone && !/^[0-9+\-\s()]+$/.test(formData.clinic_phone)) {
      newErrors.clinic_phone = 'رقم الهاتف غير صحيح';
    }
    
    // التحقق من البريد الإلكتروني
    if (formData.clinic_email && !/\S+@\S+\.\S+/.test(formData.clinic_email)) {
      newErrors.clinic_email = 'البريد الإلكتروني غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const requestData = {
        ...formData,
        ...locationData
      };

      const response = await axios.post(
        `${backendUrl}/api/enhanced-clinics/register`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`تم تسجيل العيادة بنجاح!\nرقم التسجيل: ${response.data.registration_number}\nالحالة: ${response.data.status}`);
        
        // إعادة تعيين النموذج
        setFormData({
          clinic_name: '',
          clinic_phone: '',
          clinic_email: '',
          doctor_name: '',
          doctor_specialty: '',
          doctor_phone: '',
          clinic_address: '',
          line_id: '',
          area_id: '',
          district_id: '',
          registration_notes: ''
        });
        
        setLocationData({
          clinic_latitude: null,
          clinic_longitude: null,
          location_accuracy: null,
          rep_latitude: userLocation?.lat || null,
          rep_longitude: userLocation?.lng || null,
          rep_location_accuracy: userLocation?.accuracy || null,
          device_info: navigator.userAgent
        });

        // إعادة تعيين الخريطة للموقع الحالي
        if (mapInstanceRef.current && markerRef.current && userLocation) {
          mapInstanceRef.current.setCenter(userLocation);
          markerRef.current.setPosition(userLocation);
        }
      }
    } catch (error) {
      console.error('Error registering clinic:', error);
      if (error.response?.data?.detail) {
        setErrors({general: error.response.data.detail});
      } else {
        setErrors({general: 'حدث خطأ أثناء تسجيل العيادة'});
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          تسجيل عيادة جديدة
        </h1>
        <p className="text-gray-600">
          يرجى ملء جميع البيانات المطلوبة وتحديد موقع العيادة على الخريطة بدقة
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات العيادة الأساسية */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">بيانات العيادة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العيادة *
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل اسم العيادة"
              />
              {errors.clinic_name && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                هاتف العيادة
              </label>
              <input
                type="tel"
                value={formData.clinic_phone}
                onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="01xxxxxxxxx"
              />
              {errors.clinic_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={formData.clinic_email}
                onChange={(e) => handleInputChange('clinic_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="clinic@example.com"
              />
              {errors.clinic_email && (
                <p className="mt-1 text-sm text-red-600">{errors.clinic_email}</p>
              )}
            </div>
          </div>
        </div>

        {/* بيانات الطبيب */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">بيانات الطبيب الرئيسي</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الطبيب *
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => handleInputChange('doctor_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.doctor_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="د. اسم الطبيب"
              />
              {errors.doctor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.doctor_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التخصص *
              </label>
              <select
                value={formData.doctor_specialty}
                onChange={(e) => handleInputChange('doctor_specialty', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.doctor_specialty ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر التخصص</option>
                <option value="طب عام">طب عام</option>
                <option value="طب باطني">طب باطني</option>
                <option value="جراحة عامة">جراحة عامة</option>
                <option value="أطفال">أطفال</option>
                <option value="نساء وتوليد">نساء وتوليد</option>
                <option value="جلدية">جلدية</option>
                <option value="عيون">عيون</option>
                <option value="أنف وأذن">أنف وأذن</option>
                <option value="قلب وأوعية دموية">قلب وأوعية دموية</option>
                <option value="عظام">عظام</option>
                <option value="أسنان">أسنان</option>
                <option value="نفسية وعصبية">نفسية وعصبية</option>
                <option value="أخرى">أخرى</option>
              </select>
              {errors.doctor_specialty && (
                <p className="mt-1 text-sm text-red-600">{errors.doctor_specialty}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                هاتف الطبيب
              </label>
              <input
                type="tel"
                value={formData.doctor_phone}
                onChange={(e) => handleInputChange('doctor_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* الربط الجغرافي */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">الربط الجغرافي والإداري</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الخط *
              </label>
              <select
                value={formData.line_id}
                onChange={(e) => {
                  handleInputChange('line_id', e.target.value);
                  // إعادة تعيين المنطقة عند تغيير الخط
                  handleInputChange('area_id', '');
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.line_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر الخط</option>
                {formOptions.lines.map(line => (
                  <option key={line.id} value={line.id}>
                    {line.name} ({line.code})
                  </option>
                ))}
              </select>
              {errors.line_id && (
                <p className="mt-1 text-sm text-red-600">{errors.line_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنطقة *
              </label>
              <select
                value={formData.area_id}
                onChange={(e) => handleInputChange('area_id', e.target.value)}
                disabled={!formData.line_id}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.area_id ? 'border-red-500' : 'border-gray-300'
                } ${!formData.line_id ? 'bg-gray-100' : ''}`}
              >
                <option value="">اختر المنطقة</option>
                {getFilteredAreas().map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
              {errors.area_id && (
                <p className="mt-1 text-sm text-red-600">{errors.area_id}</p>
              )}
            </div>
          </div>
        </div>

        {/* تحديد الموقع */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">تحديد موقع العيادة</h3>
          
          {/* صندوق البحث */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث عن العنوان أو استخدم الخريطة أدناه
            </label>
            <input
              id="address-search"
              type="text"
              value={formData.clinic_address}
              onChange={(e) => handleInputChange('clinic_address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.clinic_address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ابحث عن العنوان أو اكتبه..."
            />
            {errors.clinic_address && (
              <p className="mt-1 text-sm text-red-600">{errors.clinic_address}</p>
            )}
          </div>

          {/* الخريطة */}
          <div className="mb-4">
            <div className="bg-blue-50 p-3 rounded-md mb-2">
              <p className="text-sm text-blue-800">
                <span className="font-medium">تعليمات:</span>
                يمكنك سحب الدبوس الأحمر لتحديد الموقع الدقيق للعيادة، أو استخدام صندوق البحث أعلاه
              </p>
            </div>
            
            <div 
              ref={mapRef}
              className="w-full h-96 border border-gray-300 rounded-md"
              style={{ minHeight: '400px' }}
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">جاري تحميل الخريطة...</p>
                  </div>
                </div>
              )}
              {errors.map && (
                <div className="flex items-center justify-center h-full bg-red-50">
                  <p className="text-red-600">{errors.map}</p>
                </div>
              )}
            </div>
            
            {errors.location && (
              <p className="mt-2 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* معلومات الموقع */}
          {locationData.clinic_latitude && locationData.clinic_longitude && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-800">
                <span className="font-medium">الموقع المحدد:</span>
                <br />
                خط العرض: {locationData.clinic_latitude.toFixed(6)}
                <br />
                خط الطول: {locationData.clinic_longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* ملاحظات إضافية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات التسجيل
          </label>
          <textarea
            value={formData.registration_notes}
            onChange={(e) => handleInputChange('registration_notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="أي ملاحظات إضافية حول العيادة..."
          />
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من إلغاء التسجيل؟ سيتم فقدان جميع البيانات المدخلة.')) {
                window.location.reload();
              }
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            إلغاء
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري التسجيل...
              </span>
            ) : (
              'تسجيل العيادة'
            )}
          </button>
        </div>
      </form>

      {/* معلومات إضافية */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h4 className="font-medium text-yellow-800 mb-2">معلومات مهمة:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• ستتم مراجعة البيانات من قبل الإدارة قبل اعتماد العيادة</li>
          <li>• يجب تحديد الموقع الدقيق للعيادة على الخريطة</li>
          <li>• تأكد من صحة جميع البيانات المدخلة</li>
          <li>• سيتم إعلامك بنتيجة المراجعة</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedClinicRegistration;