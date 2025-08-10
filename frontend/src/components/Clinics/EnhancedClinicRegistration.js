import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from '../../localization/enhancedTranslations';

const EnhancedClinicRegistration = ({ language = 'en', theme = 'dark' }) => {
  const { t, tc, tcl } = useTranslation(language);
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    classifications: [],
    credit_classifications: []
  });
  
  const [errors, setErrors] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  useEffect(() => {
    console.log('🏥 EnhancedClinicRegistration component mounted');
    loadFormData();
    loadGoogleMaps();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (mapLoaded && !mapInitialized) {
      initializeMap();
      setMapInitialized(true);
    }
  }, [mapLoaded, userLocation]);

  const loadFormData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      const [linesResponse, areasResponse] = await Promise.all([
        axios.get(`${backendUrl}/api/lines`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        axios.get(`${backendUrl}/api/areas`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);
      
      const combinedFormOptions = {
        lines: linesResponse.data || [],
        areas: areasResponse.data || [],
        classifications: [
          { 
            value: 'class_a_star', 
            label: language === 'ar' ? '⭐ فئة أ نجمة - أعلى تصنيف' : '⭐ A-Star Class - Premium',
            color: 'from-yellow-400 to-orange-500', 
            icon: '⭐' 
          },
          { 
            value: 'class_a', 
            label: language === 'ar' ? '🥇 فئة أ - ممتازة' : '🥇 Class A - Excellent',
            color: 'from-green-400 to-blue-500', 
            icon: '🥇' 
          },
          { 
            value: 'class_b', 
            label: language === 'ar' ? '🥈 فئة ب - جيد جداً' : '🥈 Class B - Very Good',
            color: 'from-blue-400 to-purple-500', 
            icon: '🥈' 
          },
          { 
            value: 'class_c', 
            label: language === 'ar' ? '🥉 فئة ج - جيد' : '🥉 Class C - Good',
            color: 'from-purple-400 to-pink-500', 
            icon: '🥉' 
          },
          { 
            value: 'class_d', 
            label: language === 'ar' ? '📋 فئة د - مقبول' : '📋 Class D - Acceptable',
            color: 'from-gray-400 to-gray-600', 
            icon: '📋' 
          }
        ],
        credit_classifications: [
          { 
            value: 'green', 
            label: language === 'ar' ? '🟢 أخضر - ائتمان ممتاز' : '🟢 Green - Excellent Credit',
            color: 'from-green-400 to-green-600', 
            icon: '🟢' 
          },
          { 
            value: 'yellow', 
            label: language === 'ar' ? '🟡 أصفر - ائتمان متوسط' : '🟡 Yellow - Average Credit',
            color: 'from-yellow-400 to-yellow-600', 
            icon: '🟡' 
          },
          { 
            value: 'red', 
            label: language === 'ar' ? '🔴 أحمر - ائتمان محدود' : '🔴 Red - Limited Credit',
            color: 'from-red-400 to-red-600', 
            icon: '🔴' 
          }
        ]
      };
      
      setFormOptions(combinedFormOptions);
      console.log('✅ Form data loaded successfully:', combinedFormOptions);
    } catch (error) {
      console.error('❌ Error loading form data:', error);
      setErrors({general: t('messages', 'error')});
    }
  };

  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('🗺️ Loading Google Maps with key:', apiKey ? 'available' : 'missing');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${language}&region=EG`;
    script.async = true;
    script.onload = () => {
      console.log('✅ Google Maps loaded successfully');
      setMapLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps');
      setErrors({map: 'Failed to load Google Maps - Please check API key'});
    };
    document.head.appendChild(script);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('⚠️ Device does not support geolocation');
      setErrors(prev => ({
        ...prev,
        location: t('messages', 'featureUnavailable')
      }));
      useDefaultLocation();
      return;
    }

    console.log('🔍 Starting high-accuracy location detection...');
    
    setErrors(prev => ({
      ...prev,
      location: language === 'ar' ? '📡 جاري تحديد موقعك الحالي بدقة عالية، يرجى عدم تحريك الجهاز...' : '📡 Detecting your current location with high accuracy, please keep device steady...'
    }));
    
    const attemptHighAccuracyLocation = (attemptNumber = 1) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0
      };

      console.log(`🎯 Attempt ${attemptNumber} - High accuracy settings`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), options.timeout);
      });
      
      const locationPromise = new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
      
      Promise.race([locationPromise, timeoutPromise])
        .then((position) => {
          const { latitude, longitude, accuracy, timestamp } = position.coords;
          
          const isVeryAccurate = accuracy <= 30;
          const isGoodAccuracy = accuracy <= 100;
          const isAcceptable = accuracy <= 500;
          
          console.log(`📍 Location obtained:`, {
            lat: latitude.toFixed(8),
            lng: longitude.toFixed(8), 
            accuracy: `${Math.round(accuracy)} m`,
            quality: isVeryAccurate ? 'excellent' : (isGoodAccuracy ? 'good' : 'acceptable'),
            timestamp: new Date(timestamp).toLocaleString(),
            attempt: attemptNumber
          });
          
          if (!isAcceptable && attemptNumber < 3) {
            console.log(`⚠️ Poor accuracy (${Math.round(accuracy)}m), trying attempt ${attemptNumber + 1}...`);
            setTimeout(() => attemptHighAccuracyLocation(attemptNumber + 1), 2000);
            return;
          }
          
          const userLoc = {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            timestamp: timestamp,
            quality: isVeryAccurate ? 'excellent' : (isGoodAccuracy ? 'good' : 'acceptable'),
            source: 'gps_high_accuracy'
          };
          
          setUserLocation(userLoc);
          
          setLocationData(prev => ({
            ...prev,
            rep_latitude: latitude,
            rep_longitude: longitude,
            rep_location_accuracy: accuracy,
            clinic_latitude: latitude,
            clinic_longitude: longitude,
            clinic_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            device_info: navigator.userAgent,
            location_obtained_at: new Date().toISOString(),
            location_source: 'gps_high_accuracy',
            location_attempts: attemptNumber,
            location_quality_score: isVeryAccurate ? 100 : (isGoodAccuracy ? 80 : 60)
          }));

          if (mapInstanceRef.current) {
            updateMapLocation(userLoc);
          }
          
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.location;
            return newErrors;
          });
          
          const qualityEmoji = isVeryAccurate ? '🎯' : (isGoodAccuracy ? '✅' : '⚠️');
          const qualityText = isVeryAccurate ? 
            (language === 'ar' ? 'دقة ممتازة' : 'Excellent accuracy') : 
            (isGoodAccuracy ? 
              (language === 'ar' ? 'دقة جيدة' : 'Good accuracy') : 
              (language === 'ar' ? 'دقة مقبولة' : 'Acceptable accuracy')
            );
          
          setErrors(prev => ({
            ...prev,
            location_success: `${qualityEmoji} ${language === 'ar' ? 'تم تحديد موقعك الحالي بنجاح!' : 'Your current location detected successfully!'} ${qualityText} (±${Math.round(accuracy)} ${language === 'ar' ? 'متر' : 'm'})`
          }));
          
          setTimeout(() => {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.location_success;
              return newErrors;
            });
          }, 8000);
          
        })
        .catch((error) => {
          console.error(`❌ Attempt ${attemptNumber} failed:`, {
            code: error.code || 'TIMEOUT',
            message: error.message,
            timestamp: new Date().toISOString()
          });
          
          if (attemptNumber < 3) {
            console.log(`🔄 Trying attempt ${attemptNumber + 1} in 3 seconds...`);
            setErrors(prev => ({
              ...prev,
              location: `🔄 ${language === 'ar' ? `المحاولة ${attemptNumber} فشلت، جاري المحاولة ${attemptNumber + 1}/3...` : `Attempt ${attemptNumber} failed, trying ${attemptNumber + 1}/3...`}`
            }));
            
            setTimeout(() => attemptHighAccuracyLocation(attemptNumber + 1), 3000);
          } else {
            console.log('🌐 Switching to network location...');
            attemptNetworkLocation();
          }
        });
    };
    
    const attemptNetworkLocation = () => {
      console.log('🌐 Attempting to get location via network...');
      
      const networkOptions = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('📍 Network location obtained:', {
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            accuracy: `${Math.round(accuracy)} m`,
            source: 'network'
          });
          
          const userLoc = {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            timestamp: position.timestamp,
            quality: 'network',
            source: 'network'
          };
          
          setUserLocation(userLoc);
          
          setLocationData(prev => ({
            ...prev,
            rep_latitude: latitude,
            rep_longitude: longitude,
            rep_location_accuracy: accuracy,
            clinic_latitude: latitude,
            clinic_longitude: longitude,
            clinic_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (network)`,
            device_info: navigator.userAgent,
            location_obtained_at: new Date().toISOString(),
            location_source: 'network_location',
            location_quality_score: 40
          }));

          if (mapInstanceRef.current) {
            updateMapLocation(userLoc);
          }
          
          setErrors(prev => ({
            ...prev,
            location_success: `📶 ${language === 'ar' ? 'تم تحديد موقعك عبر الشبكة' : 'Location detected via network'} (±${Math.round(accuracy)} ${language === 'ar' ? 'متر) - للحصول على دقة أفضل، تأكد من تشغيل GPS' : 'm) - For better accuracy, ensure GPS is enabled'})`
          }));
          
          setTimeout(() => {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.location_success;
              return newErrors;
            });
          }, 10000);
        },
        (error) => {
          console.error('❌ Network location also failed:', error);
          
          setErrors(prev => ({
            ...prev,
            location: `❌ ${language === 'ar' ? 'فشل في تحديد الموقع. يرجى التأكد من:\n• تفعيل خدمة الموقع في الجهاز\n• منح الإذن للمتصفح\n• الاتصال بالإنترنت\nأو حدد موقع العيادة يدوياً على الخريطة' : 'Failed to detect location. Please ensure:\n• Location service is enabled\n• Browser permission granted\n• Internet connection\nOr manually select clinic location on map'}`
          }));
          
          useDefaultLocation();
        },
        networkOptions
      );
    };
    
    attemptHighAccuracyLocation();
  };

  const updateMapLocation = (location) => {
    if (!mapInstanceRef.current) return;
    
    console.log('🗺️ Updating map location...');
    
    let zoomLevel = 15;
    if (location.accuracy <= 30) zoomLevel = 20;
    else if (location.accuracy <= 100) zoomLevel = 18;
    else if (location.accuracy <= 500) zoomLevel = 16;
    else zoomLevel = 14;
    
    mapInstanceRef.current.panTo(location);
    mapInstanceRef.current.setZoom(zoomLevel);
    
    if (markerRef.current) {
      markerRef.current.setPosition(location);
      
      const accuracyColor = location.accuracy <= 30 ? '#10b981' : 
                           location.accuracy <= 100 ? '#f59e0b' : '#ef4444';
      
      markerRef.current.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: accuracyColor,
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8
      });
      
      markerRef.current.setAnimation(window.google.maps.Animation.DROP);
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.setAnimation(null);
        }
      }, 1500);
    }
    
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }
    
    const radiusColor = location.accuracy <= 30 ? '#10b981' : 
                       location.accuracy <= 100 ? '#f59e0b' : '#ef4444';
                       
    accuracyCircleRef.current = new window.google.maps.Circle({
      strokeColor: radiusColor,
      strokeOpacity: 1.0,
      strokeWeight: 3,
      fillColor: radiusColor,
      fillOpacity: 0.15,
      map: mapInstanceRef.current,
      center: location,
      radius: Math.max(location.accuracy || 50, 10)
    });
  };

  const useDefaultLocation = () => {
    const defaultLocation = { 
      lat: 30.0444,
      lng: 31.2357,
      accuracy: null,
      isDefault: true
    };
    
    setUserLocation(defaultLocation);
    console.log('📍 Using enhanced default location (Tahrir Square - Cairo):', defaultLocation);
    
    setLocationData(prev => ({
      ...prev,
      rep_latitude: defaultLocation.lat,
      rep_longitude: defaultLocation.lng,
      rep_location_accuracy: null,
      clinic_latitude: defaultLocation.lat,
      clinic_longitude: defaultLocation.lng,
      clinic_address: language === 'ar' ? 
        `ميدان التحرير، القاهرة (${defaultLocation.lat.toFixed(6)}, ${defaultLocation.lng.toFixed(6)})` :
        `Tahrir Square, Cairo (${defaultLocation.lat.toFixed(6)}, ${defaultLocation.lng.toFixed(6)})`,
      device_info: navigator.userAgent,
      location_obtained_at: new Date().toISOString(),
      location_source: 'default_cairo_center',
      location_note: language === 'ar' ? 
        'تم استخدام الموقع الافتراضي (ميدان التحرير، القاهرة) - يرجى تحديد الموقع الصحيح يدوياً' :
        'Default location used (Tahrir Square, Cairo) - Please select correct location manually'
    }));
    
    if (mapInstanceRef.current) {
      console.log('🗺️ Updating map to default location...');
      mapInstanceRef.current.setCenter(defaultLocation);
      mapInstanceRef.current.setZoom(11);
      
      if (markerRef.current) {
        markerRef.current.setPosition(defaultLocation);
        
        markerRef.current.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C7.031 0 3 4.031 3 9C3 14.25 12 24 12 24S21 14.25 21 9C21 4.031 16.969 0 12 0ZM12 12.5C10.069 12.5 8.5 10.931 8.5 9S10.069 5.5 12 5.5S15.5 7.069 15.5 9S13.931 12.5 12 12.5Z" fill="#FF6B35"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        });
      }
    }
    
    setErrors(prev => ({
      ...prev,
      location: language === 'ar' ? 
        '📍 تم استخدام الموقع الافتراضي (ميدان التحرير). يرجى الضغط على "تحديد موقعي الحالي" أو تحديد موقع العيادة يدوياً على الخريطة لضمان الدقة.' :
        '📍 Default location used (Tahrir Square). Please click "Get My Current Location" or manually select clinic location on map for accuracy.'
    }));
  };

  const initializeMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      console.error('❌ Google Maps not available or map element not found');
      return;
    }

    try {
      const defaultCenter = userLocation || { lat: 30.0444, lng: 31.2357 };
      const initialZoom = userLocation ? 17 : 13;
      
      console.log('🗺️ Initializing map at location:', defaultCenter);

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: initialZoom,
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
          },
          {
            featureType: "poi.business",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "poi.medical",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: language === 'ar' ? 
          'موقع العيادة - يمكنك سحبه لتحديد الموقع الدقيق' :
          'Clinic Location - You can drag to set precise location',
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        }
      });

      markerRef.current = marker;

      if (userLocation && userLocation.accuracy) {
        accuracyCircleRef.current = new window.google.maps.Circle({
          strokeColor: '#4285f4',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#4285f4',
          fillOpacity: 0.15,
          map: map,
          center: userLocation,
          radius: userLocation.accuracy
        });
      }

      const locationButton = document.createElement('button');
      locationButton.textContent = language === 'ar' ? '📍 موقعي الحالي' : '📍 My Current Location';
      locationButton.classList.add('custom-location-button');
      locationButton.style.cssText = `
        background-color: ${isDark ? '#1f2937' : 'white'};
        border: 2px solid ${isDark ? '#374151' : '#ddd'};
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 16px;
        margin: 10px;
        padding: 8px 12px;
        text-align: center;
        transition: all 0.2s ease;
        color: ${isDark ? '#f9fafb' : '#333'};
      `;
      
      locationButton.addEventListener('mouseenter', () => {
        locationButton.style.backgroundColor = isDark ? '#374151' : '#f0f0f0';
        locationButton.style.transform = 'scale(1.05)';
      });
      
      locationButton.addEventListener('mouseleave', () => {
        locationButton.style.backgroundColor = isDark ? '#1f2937' : 'white';
        locationButton.style.transform = 'scale(1)';
      });

      locationButton.addEventListener('click', () => {
        locationButton.textContent = language === 'ar' ? '⏳ جاري التحديد...' : '⏳ Detecting...';
        locationButton.disabled = true;
        getCurrentLocation();
        
        setTimeout(() => {
          locationButton.textContent = language === 'ar' ? '📍 موقعي الحالي' : '📍 My Current Location';
          locationButton.disabled = false;
        }, 3000);
      });

      map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(locationButton);

      // Handle marker drag
      marker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        setLocationData(prev => ({
          ...prev,
          clinic_latitude: lat,
          clinic_longitude: lng,
          clinic_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          location_source: 'manual_drag',
          manual_location_set: true
        }));
        
        console.log('📍 Clinic location updated by drag:', { lat, lng });
      });

      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setErrors(prev => ({
        ...prev,
        map: 'Failed to initialize map'
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clinic_name.trim()) {
      newErrors.clinic_name = t('validation', 'required');
    }
    if (!formData.doctor_name.trim()) {
      newErrors.doctor_name = t('validation', 'required');
    }
    if (!formData.clinic_phone.trim()) {
      newErrors.clinic_phone = t('validation', 'required');
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
    setSubmissionStatus('submitting');
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('access_token');
      
      const submissionData = {
        ...formData,
        ...locationData,
        submission_timestamp: new Date().toISOString(),
        form_language: language,
        user_agent: navigator.userAgent
      };
      
      console.log('📤 Submitting clinic registration:', submissionData);
      
      const response = await axios.post(`${backendUrl}/api/enhanced-clinics/register`, submissionData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Clinic registration successful:', response.data);
      
      setSubmissionStatus('success');
      
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
      
      // Show success message
      setTimeout(() => {
        setSubmissionStatus('');
      }, 5000);
      
    } catch (error) {
      console.error('❌ Clinic registration failed:', error);
      setSubmissionStatus('error');
      setErrors({
        submit: error.response?.data?.detail || t('messages', 'error')
      });
      
      setTimeout(() => {
        setSubmissionStatus('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    const totalFields = 7; // Essential fields
    let filledFields = 0;
    
    if (formData.clinic_name.trim()) filledFields++;
    if (formData.doctor_name.trim()) filledFields++;
    if (formData.clinic_phone.trim()) filledFields++;
    if (formData.line_id) filledFields++;
    if (formData.area_id) filledFields++;
    if (locationData.clinic_latitude && locationData.clinic_longitude) filledFields++;
    if (formData.classification) filledFields++;
    
    return Math.round((filledFields / totalFields) * 100);
  };

  const progressPercentage = getProgressPercentage();

  // Theme styles
  const containerStyles = `min-h-screen transition-all duration-300 ${
    isDark 
      ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
  }`;

  const cardStyles = `rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 backdrop-blur-sm' 
      : 'bg-white border-gray-200'
  }`;

  const inputStyles = `w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
    isDark 
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-600' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`;

  const buttonPrimaryStyles = `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
    isDark 
      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
      : 'bg-blue-600 hover:bg-blue-700 text-white'
  } transform hover:scale-105 focus:scale-95 shadow-lg hover:shadow-xl`;

  return (
    <div className={containerStyles}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className={`${cardStyles} p-8 text-center`}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-3xl text-white">🏥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {tcl('clinicName')}
              </h1>
              <p className={`text-lg mt-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {language === 'ar' ? 'تسجيل العيادات الطبية بنظام تصنيف متقدم وموقع جغرافي دقيق' : 'Medical clinic registration with advanced classification system and precise location'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {language === 'ar' ? 'تقدم النموذج' : 'Form Progress'}
              </span>
              <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
            </div>
            <div className={`w-full rounded-full h-3 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Submission Status */}
        {submissionStatus && (
          <div className={`${cardStyles} p-4`}>
            {submissionStatus === 'submitting' && (
              <div className="flex items-center justify-center gap-3 text-blue-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>{language === 'ar' ? 'جاري تسجيل العيادة...' : 'Registering clinic...'}</span>
              </div>
            )}
            {submissionStatus === 'success' && (
              <div className="flex items-center justify-center gap-3 text-green-600">
                <span className="text-2xl">✅</span>
                <span className="font-medium">{language === 'ar' ? 'تم تسجيل العيادة بنجاح!' : 'Clinic registered successfully!'}</span>
              </div>
            )}
            {submissionStatus === 'error' && (
              <div className="flex items-center justify-center gap-3 text-red-600">
                <span className="text-2xl">❌</span>
                <span className="font-medium">{language === 'ar' ? 'فشل في تسجيل العيادة' : 'Failed to register clinic'}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className={cardStyles}>
            <div className="p-6 border-b border-opacity-20">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {tcl('clinicName')} *
                  </label>
                  <input
                    type="text"
                    name="clinic_name"
                    value={formData.clinic_name}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder={language === 'ar' ? 'اسم العيادة' : 'Clinic name'}
                    required
                  />
                  {errors.clinic_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.clinic_name}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {tcl('doctorName')} *
                  </label>
                  <input
                    type="text"
                    name="doctor_name"
                    value={formData.doctor_name}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder={language === 'ar' ? 'اسم الطبيب' : 'Doctor name'}
                    required
                  />
                  {errors.doctor_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.doctor_name}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {tcl('clinicPhone')} *
                  </label>
                  <input
                    type="tel"
                    name="clinic_phone"
                    value={formData.clinic_phone}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder={language === 'ar' ? 'رقم هاتف العيادة' : 'Clinic phone number'}
                    required
                  />
                  {errors.clinic_phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.clinic_phone}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {tcl('clinicEmail')}
                  </label>
                  <input
                    type="email"
                    name="clinic_email"
                    value={formData.clinic_email}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder={language === 'ar' ? 'البريد الإلكتروني للعيادة' : 'Clinic email'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {language === 'ar' ? 'هاتف الطبيب' : 'Doctor Phone'}
                  </label>
                  <input
                    type="tel"
                    name="doctor_phone"
                    value={formData.doctor_phone}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder={language === 'ar' ? 'رقم هاتف الطبيب' : 'Doctor phone number'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Information */}
          <div className={cardStyles}>
            <div className="p-6 border-b border-opacity-20">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                {language === 'ar' ? 'المعلومات الجغرافية' : 'Geographic Information'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {language === 'ar' ? 'الخط' : 'Line'}
                  </label>
                  <select
                    name="line_id"
                    value={formData.line_id}
                    onChange={handleInputChange}
                    className={inputStyles}
                  >
                    <option value="">{language === 'ar' ? 'اختر الخط' : 'Select Line'}</option>
                    {formOptions.lines.map(line => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {language === 'ar' ? 'المنطقة' : 'Area'}
                  </label>
                  <select
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleInputChange}
                    className={inputStyles}
                  >
                    <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Area'}</option>
                    {formOptions.areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                  {tcl('clinicAddress')}
                </label>
                <input
                  type="text"
                  name="clinic_address"
                  value={formData.clinic_address}
                  onChange={handleInputChange}
                  className={inputStyles}
                  placeholder={language === 'ar' ? 'عنوان العيادة التفصيلي' : 'Detailed clinic address'}
                />
              </div>
            </div>
          </div>

          {/* Classification Section */}
          <div className={cardStyles}>
            <div className="p-6 border-b border-opacity-20">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                {language === 'ar' ? 'التصنيفات' : 'Classifications'}
              </h2>
            </div>
            <div className="p-6 space-y-8">
              {/* Clinic Classifications */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  {language === 'ar' ? 'تصنيف العيادة' : 'Clinic Classification'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {formOptions.classifications.map((classification) => (
                    <div
                      key={classification.value}
                      onClick={() => setFormData(prev => ({ ...prev, classification: classification.value }))}
                      className={`
                        cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105
                        ${formData.classification === classification.value 
                          ? `bg-gradient-to-r ${classification.color} text-white border-transparent shadow-lg` 
                          : `${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'} hover:shadow-md`
                        }
                      `}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{classification.icon}</div>
                        <div className="font-medium text-sm leading-tight">
                          {classification.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credit Classifications */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  {language === 'ar' ? 'التصنيف الائتماني' : 'Credit Classification'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {formOptions.credit_classifications.map((credit) => (
                    <div
                      key={credit.value}
                      onClick={() => setFormData(prev => ({ ...prev, credit_classification: credit.value }))}
                      className={`
                        cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105
                        ${formData.credit_classification === credit.value 
                          ? `bg-gradient-to-r ${credit.color} text-white border-transparent shadow-lg` 
                          : `${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'} hover:shadow-md`
                        }
                      `}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">{credit.icon}</div>
                        <div className="font-medium">
                          {credit.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location Map */}
          <div className={cardStyles}>
            <div className="p-6 border-b border-opacity-20">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-2xl">📍</span>
                {language === 'ar' ? 'موقع العيادة على الخريطة' : 'Clinic Location on Map'}
              </h2>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {language === 'ar' ? 
                  'اضغط على "موقعي الحالي" للحصول على موقعك الدقيق، أو اسحب الدبوس لتحديد موقع العيادة' :
                  'Click "My Current Location" to get your precise location, or drag the pin to set clinic location'
                }
              </p>
            </div>
            <div className="p-6">
              {/* Location Status Messages */}
              {errors.location && (
                <div className={`mb-4 p-4 rounded-lg ${
                  errors.location.includes('📡') || errors.location.includes('🔄') ?
                    'bg-blue-100 border border-blue-300 text-blue-800' :
                    'bg-yellow-100 border border-yellow-300 text-yellow-800'
                }`}>
                  <p className="text-sm whitespace-pre-line">{errors.location}</p>
                </div>
              )}
              {errors.location_success && (
                <div className="mb-4 p-4 rounded-lg bg-green-100 border border-green-300 text-green-800">
                  <p className="text-sm">{errors.location_success}</p>
                </div>
              )}
              
              {/* Map Container */}
              <div 
                ref={mapRef}
                className={`w-full h-96 rounded-lg border-2 ${
                  isDark ? 'border-slate-600' : 'border-gray-300'
                } ${!mapLoaded ? 'flex items-center justify-center bg-gray-100' : ''}`}
              >
                {!mapLoaded && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{language === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}</p>
                  </div>
                )}
              </div>

              {/* Location Coordinates Display */}
              {(locationData.clinic_latitude && locationData.clinic_longitude) && (
                <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{language === 'ar' ? 'خط العرض:' : 'Latitude:'}</span>
                      <span className="ml-2 font-mono">{locationData.clinic_latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="font-medium">{language === 'ar' ? 'خط الطول:' : 'Longitude:'}</span>
                      <span className="ml-2 font-mono">{locationData.clinic_longitude.toFixed(6)}</span>
                    </div>
                    {locationData.rep_location_accuracy && (
                      <div>
                        <span className="font-medium">{language === 'ar' ? 'الدقة:' : 'Accuracy:'}</span>
                        <span className="ml-2">±{Math.round(locationData.rep_location_accuracy)} {language === 'ar' ? 'متر' : 'm'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className={cardStyles}>
            <div className="p-6 border-b border-opacity-20">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-2xl">📝</span>
                {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                  {language === 'ar' ? 'ملاحظات التصنيف' : 'Classification Notes'}
                </label>
                <textarea
                  name="classification_notes"
                  value={formData.classification_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputStyles}
                  placeholder={language === 'ar' ? 'أي ملاحظات حول تصنيف العيادة...' : 'Any notes about clinic classification...'}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                  {language === 'ar' ? 'ملاحظات التسجيل' : 'Registration Notes'}
                </label>
                <textarea
                  name="registration_notes"
                  value={formData.registration_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputStyles}
                  placeholder={language === 'ar' ? 'أي ملاحظات إضافية حول العيادة...' : 'Any additional notes about the clinic...'}
                />
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className={cardStyles}>
            <div className="p-6">
              {errors.submit && (
                <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300 text-red-800">
                  <p className="text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || submissionStatus === 'submitting'}
                  className={`
                    flex-1 ${buttonPrimaryStyles}
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100
                    flex items-center justify-center gap-3
                  `}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {language === 'ar' ? 'جاري التسجيل...' : 'Registering...'}
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🏥</span>
                      {language === 'ar' ? 'تسجيل العيادة' : 'Register Clinic'}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(language === 'ar' ? 'هل تريد مسح جميع البيانات؟' : 'Do you want to clear all data?')) {
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
                        rep_latitude: null,
                        rep_longitude: null,
                        rep_location_accuracy: null,
                        device_info: ''
                      });
                      setErrors({});
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-slate-600 hover:bg-slate-700 border-slate-500' 
                      : 'bg-gray-600 hover:bg-gray-700 border-gray-500'
                  } text-white border transform hover:scale-105 focus:scale-95`}
                >
                  {language === 'ar' ? 'مسح' : 'Clear'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedClinicRegistration;