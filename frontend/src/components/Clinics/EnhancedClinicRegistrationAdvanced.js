// Enhanced Clinic Registration - Advanced GPS & Maps Integration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';
import axios from 'axios';
import comprehensiveActivityService from '../../services/ComprehensiveActivityService';

const EnhancedClinicRegistrationAdvanced = ({ language = 'en', theme = 'dark', user }) => {
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
      console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Maps with all components
  const initializeGoogleMaps = useCallback(() => {
    if (!window.google || !mapRef.current) return;

    console.log('🗺️ Initializing enhanced Google Maps...');

    // Initialize geocoder for reverse geocoding
    geocoderRef.current = new window.google.maps.Geocoder();

    // Create map with enhanced options
    const mapOptions = {
      center: { lat: 30.0444, lng: 31.2357 }, // Default: Cairo, Egypt
      zoom: 15,
      mapTypeId: 'roadmap',
      streetViewControl: true,
      fullscreenControl: true,
      mapTypeControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

    // Initialize search autocomplete
    if (searchInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'eg' }, // Egypt
          fields: ['place_id', 'geometry', 'formatted_address', 'address_components', 'name']
        }
      );

      // Handle place selection from autocomplete
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    // Create initial marker
    markerRef.current = new window.google.maps.Marker({
      map: mapInstanceRef.current,
      draggable: true,
      title: language === 'ar' ? 'اسحب لتحديد موقع العيادة' : 'Drag to set clinic location',
      animation: window.google.maps.Animation.DROP
    });

    // Handle marker drag
    markerRef.current.addListener('dragend', handleMarkerDrag);
    
    // Handle map clicks
    mapInstanceRef.current.addListener('click', handleMapClick);

    console.log('✅ Google Maps initialized successfully');
  }, [language]);

  // Handle place selection from autocomplete search
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    console.log('🔍 Place selected from search:', place);

    if (place.geometry) {
      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      // Update map and marker
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(17);
      markerRef.current.setPosition({ lat, lng });

      // Update location data
      setLocationData({
        clinic_latitude: lat,
        clinic_longitude: lng,
        location_accuracy: 'high',
        formatted_address: place.formatted_address || '',
        place_id: place.place_id || null,
        address_components: place.address_components || []
      });

      // Update address field
      setFormData(prev => ({
        ...prev,
        clinic_address: place.formatted_address || prev.clinic_address
      }));

      setGpsStatus('found');
    }
  };

  // Handle marker drag
  const handleMarkerDrag = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    console.log(`📍 Marker dragged to: ${lat}, ${lng}`);

    // Update location immediately
    setLocationData(prev => ({
      ...prev,
      clinic_latitude: lat,
      clinic_longitude: lng,
      location_accuracy: 'manual'
    }));

    // Perform reverse geocoding to get address
    performReverseGeocoding(lat, lng);
  };

  // Handle map clicks
  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    console.log(`🗺️ Map clicked at: ${lat}, ${lng}`);

    // Move marker to clicked position
    markerRef.current.setPosition({ lat, lng });

    // Update location data
    setLocationData(prev => ({
      ...prev,
      clinic_latitude: lat,
      clinic_longitude: lng,
      location_accuracy: 'manual'
    }));

    // Get address for clicked location
    performReverseGeocoding(lat, lng);
  };

  // Perform reverse geocoding to get address from coordinates
  const performReverseGeocoding = (lat, lng) => {
    if (!geocoderRef.current) return;

    console.log(`🔄 Reverse geocoding for: ${lat}, ${lng}`);

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          console.log(`✅ Address found: ${address}`);

          // Update location data
          setLocationData(prev => ({
            ...prev,
            formatted_address: address,
            place_id: results[0].place_id || null,
            address_components: results[0].address_components || []
          }));

          // Update address field
          setFormData(prev => ({
            ...prev,
            clinic_address: address
          }));

          // Update search input
          if (searchInputRef.current) {
            searchInputRef.current.value = address;
          }
        } else {
          console.warn('⚠️ Reverse geocoding failed:', status);
        }
      }
    );
  };

  // Enhanced GPS location with proper device access
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(language === 'ar' ? 'متصفحك لا يدعم تحديد الموقع' : 'Your browser does not support geolocation');
      return;
    }

    setGpsStatus('requesting');
    console.log('📡 Requesting GPS permission and location...');

    // Request current position with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ GPS location obtained:', position);
        
        const { latitude, longitude, accuracy } = position.coords;
        
        setGpsStatus('locating');
        setCurrentPosition(position);
        
        // Update location data
        setLocationData({
          clinic_latitude: latitude,
          clinic_longitude: longitude,
          location_accuracy: accuracy,
          formatted_address: '',
          place_id: null,
          address_components: []
        });

        // Update map and marker
        if (mapInstanceRef.current && markerRef.current) {
          const location = { lat: latitude, lng: longitude };
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(18); // High zoom for accuracy
          markerRef.current.setPosition(location);
        }

        // Get address for current location
        performReverseGeocoding(latitude, longitude);
        
        setGpsStatus('found');

        // Start watching position for better accuracy
        startWatchingPosition();
        
        console.log(`✅ Current location set: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
      },
      (error) => {
        console.error('❌ GPS error:', error);
        setGpsStatus('error');
        
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = language === 'ar' 
              ? 'تم رفض الإذن لتحديد الموقع. يرجى السماح بالوصول للموقع في إعدادات المتصفح.' 
              : 'Location access denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = language === 'ar' 
              ? 'معلومات الموقع غير متاحة. يرجى التأكد من تشغيل GPS.' 
              : 'Location information unavailable. Please ensure GPS is enabled.';
            break;
          case error.TIMEOUT:
            errorMessage = language === 'ar' 
              ? 'انتهت مهلة طلب تحديد الموقع. يرجى المحاولة مرة أخرى.' 
              : 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = language === 'ar' 
              ? 'حدث خطأ غير معروف أثناء تحديد الموقع.' 
              : 'An unknown error occurred while retrieving location.';
            break;
        }
        
        alert(errorMessage);
      },
      gpsOptions
    );
  };

  // Start watching position for continuous updates
  const startWatchingPosition = () => {
    if (!navigator.geolocation || watchId) return;

    console.log('👀 Starting position watch...');

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Only update if accuracy improved
        if (!currentPosition || position.coords.accuracy < currentPosition.coords.accuracy) {
          console.log(`🎯 Better accuracy position: ${latitude}, ${longitude} (${accuracy}m)`);
          
          setCurrentPosition(position);
          setLocationData(prev => ({
            ...prev,
            clinic_latitude: latitude,
            clinic_longitude: longitude,
            location_accuracy: accuracy
          }));

          // Update marker position
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: latitude, lng: longitude });
          }
        }
      },
      (error) => {
        console.warn('⚠️ Position watch error:', error);
      },
      {
        ...gpsOptions,
        timeout: 30000 // Longer timeout for watch
      }
    );

    setWatchId(newWatchId);
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
    
    // Check if location is set (this is still required)
    if (!locationData.clinic_latitude || !locationData.clinic_longitude) {
      alert(language === 'ar' 
        ? 'يرجى تحديد موقع العيادة على الخريطة أولاً' 
        : 'Please set the clinic location on the map first'
      );
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const submitData = {
        ...formData,
        ...locationData,
        registered_by: user?.username || 'system',
        registration_timestamp: new Date().toISOString(),
        gps_accuracy: locationData.location_accuracy,
        address_source: locationData.formatted_address ? 'geocoded' : 'manual'
      };

      console.log('📤 Submitting clinic data:', submitData);

      const response = await axios.post(`${API_URL}/api/clinics`, submitData, { headers });
      
      if (response.status === 201 || response.status === 200) {
        alert(language === 'ar' ? '✅ تم تسجيل العيادة بنجاح!' : '✅ Clinic registered successfully!');
        
        // Reset form
        resetForm();
        
        console.log('✅ Clinic registered successfully');
      }
    } catch (error) {
      console.error('❌ Error saving clinic:', error);
      
      const errorMessage = error.response?.data?.detail || error.message || 
        (language === 'ar' ? 'حدث خطأ أثناء حفظ البيانات' : 'An error occurred while saving');
        
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
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
      location_accuracy: null,
      formatted_address: '',
      place_id: null,
      address_components: []
    });

    setGpsStatus('idle');
    setCurrentPosition(null);

    // Clear search input
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }

    // Reset map to default location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 30.0444, lng: 31.2357 });
      mapInstanceRef.current.setZoom(15);
    }

    // Hide marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Stop watching position
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  return (
    <div className="enhanced-clinic-registration min-h-screen p-6 space-y-8">
      {/* Header Section */}
      <div className="header-section bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              🏥 {language === 'ar' ? 'تسجيل العيادات المحسن' : 'Advanced Clinic Registration'}
            </h1>
            <p className="text-blue-100 text-lg">
              {language === 'ar' 
                ? 'نظام تسجيل متقدم مع GPS دقيق وخرائط تفاعلية' 
                : 'Advanced registration system with precise GPS and interactive maps'
              }
            </p>
          </div>
          
          {/* GPS Status Indicator */}
          <div className={`gps-status px-4 py-2 rounded-xl font-semibold ${
            gpsStatus === 'found' ? 'bg-green-500/20 text-green-100' :
            gpsStatus === 'requesting' || gpsStatus === 'locating' ? 'bg-yellow-500/20 text-yellow-100' :
            gpsStatus === 'error' ? 'bg-red-500/20 text-red-100' :
            'bg-gray-500/20 text-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <span>
                {gpsStatus === 'found' ? '📍' :
                 gpsStatus === 'requesting' || gpsStatus === 'locating' ? '🔄' :
                 gpsStatus === 'error' ? '❌' : '📡'}
              </span>
              <span>
                {gpsStatus === 'idle' ? (language === 'ar' ? 'GPS خامل' : 'GPS Idle') :
                 gpsStatus === 'requesting' ? (language === 'ar' ? 'طلب الإذن...' : 'Requesting Permission...') :
                 gpsStatus === 'locating' ? (language === 'ar' ? 'تحديد الموقع...' : 'Locating...') :
                 gpsStatus === 'found' ? (language === 'ar' ? 'تم العثور على الموقع' : 'Location Found') :
                 gpsStatus === 'error' ? (language === 'ar' ? 'خطأ GPS' : 'GPS Error') : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-section bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center border border-white/20">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-white text-lg">
            {language === 'ar' ? 'جاري تحميل بيانات النظام...' : 'Loading system data...'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Enhanced Map Section with Search */}
        <div className="map-section bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              🗺️ {language === 'ar' ? 'تحديد الموقع التفاعلي' : 'Interactive Location Selection'}
            </h2>
            <p className="text-white/70">
              {language === 'ar' 
                ? 'استخدم البحث أو GPS أو اضغط على الخريطة لتحديد موقع العيادة بدقة'
                : 'Use search, GPS, or click on the map to precisely set the clinic location'
              }
            </p>
          </div>

          {/* Location Controls */}
          <div className="location-controls grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Search Input with Autocomplete */}
            <div className="search-container lg:col-span-2">
              <label className="block text-white/90 font-medium mb-2">
                🔍 {language === 'ar' ? 'البحث عن العنوان' : 'Search Address'}
              </label>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={language === 'ar' 
                  ? 'اكتب اسم المكان أو العنوان للبحث...' 
                  : 'Type place name or address to search...'
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <p className="text-white/60 text-sm mt-1">
                {language === 'ar' 
                  ? 'البحث تلقائي مع اقتراحات العناوين' 
                  : 'Auto-complete with address suggestions'
                }
              </p>
            </div>

            {/* GPS Button */}
            <div className="gps-container">
              <label className="block text-white/90 font-medium mb-2">
                📡 {language === 'ar' ? 'الموقع الحالي' : 'Current Location'}
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsStatus === 'requesting' || gpsStatus === 'locating'}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                <span>
                  {gpsStatus === 'requesting' || gpsStatus === 'locating' ? '🔄' : '📍'}
                </span>
                {gpsStatus === 'requesting' || gpsStatus === 'locating' 
                  ? (language === 'ar' ? 'جاري التحديد...' : 'Locating...') 
                  : (language === 'ar' ? 'تحديد موقعي' : 'Find My Location')
                }
              </button>
              {locationData.location_accuracy && (
                <p className="text-white/60 text-xs mt-1">
                  {language === 'ar' ? 'دقة: ' : 'Accuracy: '}{Math.round(locationData.location_accuracy)}m
                </p>
              )}
            </div>
          </div>

          {/* Google Maps Container */}
          <div className="map-container">
            <div 
              ref={mapRef}
              className="google-map w-full h-96 rounded-xl shadow-lg border border-white/20"
              style={{ minHeight: '400px' }}
            />
            
            {/* Map Instructions */}
            <div className="map-instructions mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="instruction bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center gap-2 text-blue-300 mb-1">
                  <span>🔍</span>
                  <strong>{language === 'ar' ? 'البحث' : 'Search'}</strong>
                </div>
                <p className="text-white/70">
                  {language === 'ar' ? 'اكتب العنوان في المربع أعلاه' : 'Type address in the box above'}
                </p>
              </div>
              
              <div className="instruction bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center gap-2 text-green-300 mb-1">
                  <span>📍</span>
                  <strong>{language === 'ar' ? 'GPS' : 'GPS'}</strong>
                </div>
                <p className="text-white/70">
                  {language === 'ar' ? 'اضغط زر "تحديد موقعي"' : 'Click "Find My Location"'}
                </p>
              </div>
              
              <div className="instruction bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center gap-2 text-purple-300 mb-1">
                  <span>🖱️</span>
                  <strong>{language === 'ar' ? 'يدوي' : 'Manual'}</strong>
                </div>
                <p className="text-white/70">
                  {language === 'ar' ? 'اسحب الدبوس أو اضغط على الخريطة' : 'Drag pin or click on map'}
                </p>
              </div>
            </div>
          </div>

          {/* Location Summary */}
          {locationData.clinic_latitude && locationData.clinic_longitude && (
            <div className="location-summary mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                <span>✅</span>
                {language === 'ar' ? 'تم تحديد الموقع' : 'Location Set'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/80">
                    <strong>{language === 'ar' ? 'الإحداثيات:' : 'Coordinates:'}</strong>
                  </p>
                  <p className="text-green-200">
                    {locationData.clinic_latitude.toFixed(6)}, {locationData.clinic_longitude.toFixed(6)}
                  </p>
                </div>
                
                {locationData.formatted_address && (
                  <div>
                    <p className="text-white/80">
                      <strong>{language === 'ar' ? 'العنوان:' : 'Address:'}</strong>
                    </p>
                    <p className="text-green-200">
                      {locationData.formatted_address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clinic Information Form */}
        <div className="form-section bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            🏥 {language === 'ar' ? 'معلومات العيادة' : 'Clinic Information'}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clinic Name */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'اسم العيادة *' : 'Clinic Name *'}
              </label>
              <input
                type="text"
                name="clinic_name"
                value={formData.clinic_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={language === 'ar' ? 'ادخل اسم العيادة' : 'Enter clinic name'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Doctor Name */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'اسم الطبيب *' : 'Doctor Name *'}
              </label>
              <input
                type="text"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={language === 'ar' ? 'ادخل اسم الطبيب' : 'Enter doctor name'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Clinic Phone */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'هاتف العيادة *' : 'Clinic Phone *'}
              </label>
              <input
                type="tel"
                name="clinic_phone"
                value={formData.clinic_phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={language === 'ar' ? 'رقم هاتف العيادة' : 'Clinic phone number'}
                dir="ltr"
              />
            </div>

            {/* Doctor Phone */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'هاتف الطبيب' : 'Doctor Phone'}
              </label>
              <input
                type="tel"
                name="doctor_phone"
                value={formData.doctor_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={language === 'ar' ? 'رقم هاتف الطبيب (اختياري)' : 'Doctor phone (optional)'}
                dir="ltr"
              />
            </div>

            {/* Clinic Email */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                name="clinic_email"
                value={formData.clinic_email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email address (optional)'}
                dir="ltr"
              />
            </div>

            {/* Address - Now Optional */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'العنوان' : 'Address'} 
                <span className="text-white/60 text-sm ml-2">
                  ({language === 'ar' ? 'اختياري - يتم ملؤه تلقائياً' : 'Optional - Auto-filled'})
                </span>
              </label>
              <textarea
                name="clinic_address"
                value={formData.clinic_address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder={language === 'ar' ? 'العنوان التفصيلي (يتم ملؤه تلقائياً من الخريطة)' : 'Detailed address (auto-filled from map)'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        </div>

        {/* Administrative Information */}
        <div className="admin-section bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            ⚙️ {language === 'ar' ? 'المعلومات الإدارية' : 'Administrative Information'}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Line Selection - Card Style */}
            <div>
              <label className="block text-white/90 font-medium mb-4">
                {language === 'ar' ? 'الخط *' : 'Line *'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lines.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, line_id: line.id }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      formData.line_id === line.id
                        ? 'border-blue-400 bg-blue-500/20 text-white shadow-lg transform scale-105'
                        : 'border-white/30 bg-white/10 text-white/80 hover:bg-white/15 hover:border-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.line_id === line.id 
                          ? 'border-blue-400 bg-blue-500' 
                          : 'border-white/50'
                      }`}>
                        {formData.line_id === line.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{line.name}</h4>
                        {line.code && (
                          <p className="text-sm opacity-75">كود: {line.code}</p>
                        )}
                        {line.description && (
                          <p className="text-xs mt-1 opacity-60">{line.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {lines.length === 0 && (
                  <div className="col-span-2 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-200">
                    {language === 'ar' ? 'لا توجد خطوط متاحة' : 'No lines available'}
                  </div>
                )}
              </div>
            </div>

            {/* Area Selection - Card Style */}
            <div>
              <label className="block text-white/90 font-medium mb-4">
                {language === 'ar' ? 'المنطقة *' : 'Area *'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, area_id: area.id }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      formData.area_id === area.id
                        ? 'border-green-400 bg-green-500/20 text-white shadow-lg transform scale-105'
                        : 'border-white/30 bg-white/10 text-white/80 hover:bg-white/15 hover:border-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.area_id === area.id 
                          ? 'border-green-400 bg-green-500' 
                          : 'border-white/50'
                      }`}>
                        {formData.area_id === area.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{area.name}</h4>
                        {area.code && (
                          <p className="text-sm opacity-75">كود: {area.code}</p>
                        )}
                        {area.parent_line_name && (
                          <p className="text-xs mt-1 opacity-60">خط: {area.parent_line_name}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {areas.length === 0 && (
                  <div className="col-span-3 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-200">
                    {language === 'ar' ? 'لا توجد مناطق متاحة' : 'No areas available'}
                  </div>
                )}
              </div>
            </div>

            {/* Classification - Card Style */}
            <div>
              <label className="block text-white/90 font-medium mb-4">
                {language === 'ar' ? 'التصنيف' : 'Classification'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'class_a', label: language === 'ar' ? 'فئة أ - ممتاز' : 'Class A - Excellent', color: 'emerald', icon: '⭐' },
                  { value: 'class_b', label: language === 'ar' ? 'فئة ب - جيد' : 'Class B - Good', color: 'blue', icon: '🏆' },
                  { value: 'class_c', label: language === 'ar' ? 'فئة ج - متوسط' : 'Class C - Average', color: 'amber', icon: '📊' }
                ].map((classification) => (
                  <button
                    key={classification.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, classification: classification.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      formData.classification === classification.value
                        ? `border-${classification.color}-400 bg-${classification.color}-500/20 text-white shadow-lg transform scale-105`
                        : 'border-white/30 bg-white/10 text-white/80 hover:bg-white/15 hover:border-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{classification.icon}</div>
                      <div>
                        <h4 className="font-semibold">{classification.label}</h4>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Classification - Card Style */}
            <div>
              <label className="block text-white/90 font-medium mb-4">
                {language === 'ar' ? 'التصنيف الائتماني' : 'Credit Classification'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'green', label: language === 'ar' ? 'أخضر - ممتاز' : 'Green - Excellent', icon: '🟢' },
                  { value: 'yellow', label: language === 'ar' ? 'أصفر - جيد' : 'Yellow - Good', icon: '🟡' },
                  { value: 'red', label: language === 'ar' ? 'أحمر - يحتاج متابعة' : 'Red - Needs Follow-up', icon: '🔴' }
                ].map((creditClass) => (
                  <button
                    key={creditClass.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, credit_classification: creditClass.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      formData.credit_classification === creditClass.value
                        ? 'border-purple-400 bg-purple-500/20 text-white shadow-lg transform scale-105'
                        : 'border-white/30 bg-white/10 text-white/80 hover:bg-white/15 hover:border-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{creditClass.icon}</div>
                      <div>
                        <h4 className="font-semibold">{creditClass.label}</h4>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-section mt-6 space-y-4">
            {/* Classification Notes */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'ملاحظات التصنيف' : 'Classification Notes'}
              </label>
              <textarea
                name="classification_notes"
                value={formData.classification_notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder={language === 'ar' ? 'ملاحظات حول تصنيف العيادة...' : 'Notes about clinic classification...'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Registration Notes */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                {language === 'ar' ? 'ملاحظات التسجيل' : 'Registration Notes'}
              </label>
              <textarea
                name="registration_notes"
                value={formData.registration_notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder={language === 'ar' ? 'ملاحظات إضافية حول التسجيل...' : 'Additional registration notes...'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="submit-section bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">
                {language === 'ar' ? 'جاهز للحفظ؟' : 'Ready to Save?'}
              </h3>
              <p className="text-white/80">
                {language === 'ar' 
                  ? 'تأكد من صحة جميع البيانات والموقع قبل الحفظ'
                  : 'Please verify all data and location before saving'
                }
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-300 border border-white/30"
              >
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </button>

              <button
                type="submit"
                disabled={saving || !locationData.clinic_latitude}
                className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                <span>
                  {saving ? '🔄' : '💾'}
                </span>
                {saving 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (language === 'ar' ? 'حفظ العيادة' : 'Save Clinic')
                }
              </button>
            </div>
          </div>

          {/* Requirements Check */}
          <div className="requirements-check mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className={`requirement p-2 rounded-lg ${
              formData.clinic_name ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}>
              <span className="mr-2">{formData.clinic_name ? '✅' : '❌'}</span>
              {language === 'ar' ? 'اسم العيادة' : 'Clinic Name'}
            </div>
            
            <div className={`requirement p-2 rounded-lg ${
              locationData.clinic_latitude ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}>
              <span className="mr-2">{locationData.clinic_latitude ? '✅' : '❌'}</span>
              {language === 'ar' ? 'موقع العيادة' : 'Clinic Location'}
            </div>
            
            <div className={`requirement p-2 rounded-lg ${
              formData.line_id && formData.area_id ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}>
              <span className="mr-2">{formData.line_id && formData.area_id ? '✅' : '❌'}</span>
              {language === 'ar' ? 'الخط والمنطقة' : 'Line & Area'}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EnhancedClinicRegistrationAdvanced;