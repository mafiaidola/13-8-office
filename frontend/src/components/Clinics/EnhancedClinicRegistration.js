import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EnhancedClinicRegistration = () => {
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
  const accuracyCircleRef = useRef(null);

  useEffect(() => {
    console.log('🏥 EnhancedClinicRegistration component mounted');
    console.log('📊 Current formOptions:', formOptions);
    console.log('📍 Current formData:', formData);
    console.log('🗺️ Current locationData:', locationData);
    
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
      
      // تحميل البيانات من APIs النظام الأساسية
      const [linesResponse, areasResponse, formDataResponse] = await Promise.all([
        axios.get(`${backendUrl}/api/lines`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        axios.get(`${backendUrl}/api/areas`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        axios.get(`${backendUrl}/api/enhanced-clinics/registration/form-data`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).catch(() => ({ data: { success: false } })) // fallback if endpoint doesn't exist
      ]);
      
      // دمج البيانات من مصادر مختلفة
      const combinedFormOptions = {
        lines: linesResponse.data || [],
        areas: areasResponse.data || [],
        classifications: [
          { value: 'class_a_star', label: '⭐ فئة أ نجمة - أعلى تصنيف', color: 'from-yellow-400 to-orange-500', icon: '⭐' },
          { value: 'class_a', label: '🥇 فئة أ - ممتازة', color: 'from-green-400 to-blue-500', icon: '🥇' },
          { value: 'class_b', label: '🥈 فئة ب - جيد جداً', color: 'from-blue-400 to-purple-500', icon: '🥈' },
          { value: 'class_c', label: '🥉 فئة ج - جيد', color: 'from-purple-400 to-pink-500', icon: '🥉' },
          { value: 'class_d', label: '📋 فئة د - مقبول', color: 'from-gray-400 to-gray-600', icon: '📋' }
        ],
        credit_classifications: [
          { value: 'green', label: '🟢 أخضر - ائتمان ممتاز', color: 'from-green-400 to-green-600', icon: '🟢' },
          { value: 'yellow', label: '🟡 أصفر - ائتمان متوسط', color: 'from-yellow-400 to-yellow-600', icon: '🟡' },
          { value: 'red', label: '🔴 أحمر - ائتمان محدود', color: 'from-red-400 to-red-600', icon: '🔴' }
        ]
      };

      // إضافة البيانات من enhanced endpoint إذا كانت متاحة
      if (formDataResponse.data?.success) {
        const enhancedData = formDataResponse.data.data;
        if (enhancedData.classifications) {
          combinedFormOptions.classifications = enhancedData.classifications.map(c => ({
            ...c,
            color: getClassificationColor(c.value),
            icon: getClassificationIcon(c.value)
          }));
        }
        if (enhancedData.credit_classifications) {
          combinedFormOptions.credit_classifications = enhancedData.credit_classifications.map(c => ({
            ...c,
            color: getCreditClassificationColor(c.value),
            icon: getCreditClassificationIcon(c.value)
          }));
        }
      }
      
      setFormOptions(combinedFormOptions);
      console.log('✅ تم تحميل بيانات النموذج المدمجة:', combinedFormOptions);
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات النموذج:', error);
      setErrors({general: 'خطأ في تحميل بيانات النموذج'});
    }
  };

  // دوال مساعدة للألوان والأيقونات
  const getClassificationColor = (value) => {
    const colors = {
      'class_a_star': 'from-yellow-400 to-orange-500',
      'class_a': 'from-green-400 to-blue-500', 
      'class_b': 'from-blue-400 to-purple-500',
      'class_c': 'from-purple-400 to-pink-500',
      'class_d': 'from-gray-400 to-gray-600'
    };
    return colors[value] || 'from-gray-400 to-gray-600';
  };

  const getClassificationIcon = (value) => {
    const icons = {
      'class_a_star': '⭐',
      'class_a': '🥇',
      'class_b': '🥈', 
      'class_c': '🥉',
      'class_d': '📋'
    };
    return icons[value] || '📋';
  };

  const getCreditClassificationColor = (value) => {
    const colors = {
      'green': 'from-green-400 to-green-600',
      'yellow': 'from-yellow-400 to-yellow-600',
      'red': 'from-red-400 to-red-600'
    };
    return colors[value] || 'from-gray-400 to-gray-600';
  };

  const getCreditClassificationIcon = (value) => {
    const icons = {
      'green': '🟢',
      'yellow': '🟡',
      'red': '🔴'
    };
    return icons[value] || '⚪';
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

  // دالة محسنة للحصول على الموقع الحالي مع معالجة أفضل للأخطاء
  // دالة محسنة لإعدادات الموقع الجغرافي
  const getLocationOptions = (attemptNumber = 1) => {
    // إعدادات متدرجة الدقة حسب المحاولة
    const optionSets = {
      1: {
        // المحاولة الأولى: أعلى دقة ممكنة
        enableHighAccuracy: true,
        timeout: 20000, // 20 ثانية
        maximumAge: 0 // لا تستخدم cache قديم
      },
      2: {
        // المحاولة الثانية: دقة متوسطة مع timeout أقل
        enableHighAccuracy: true,
        timeout: 15000, // 15 ثانية
        maximumAge: 30000 // استخدم cache إذا كان عمره أقل من 30 ثانية
      },
      3: {
        // المحاولة الثالثة: استخدم network location
        enableHighAccuracy: false,
        timeout: 10000, // 10 ثوان
        maximumAge: 60000 // استخدم cache إذا كان عمره أقل من دقيقة
      }
    };

    const options = optionSets[attemptNumber] || optionSets[3];
    
    console.log(`⚙️ إعدادات الموقع للمحاولة ${attemptNumber}:`, {
      highAccuracy: options.enableHighAccuracy,
      timeout: options.timeout / 1000 + 's',
      maxAge: options.maximumAge / 1000 + 's'
    });
    
    return options;
  };

  // دالة للتحقق من إمكانيات الجهاز
  const checkGeolocationCapabilities = () => {
    if (!navigator.geolocation) {
      return { supported: false, reason: 'Geolocation not supported' };
    }
    
    // فحص إضافي للمتصفحات المختلفة
    const userAgent = navigator.userAgent.toLowerCase();
    const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    return {
      supported: true,
      isSecureContext,
      browser: {
        chrome: userAgent.includes('chrome'),
        firefox: userAgent.includes('firefox'),
        safari: userAgent.includes('safari') && !userAgent.includes('chrome'),
        edge: userAgent.includes('edge')
      },
      permissions: navigator.permissions ? true : false,
      capabilities: {
        watchPosition: typeof navigator.geolocation.watchPosition === 'function',
        getCurrentPosition: typeof navigator.geolocation.getCurrentPosition === 'function'
      }
    };
  };

  // Enhanced current location detection with maximum accuracy
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('⚠️ الجهاز لا يدعم تحديد الموقع');
      setErrors(prev => ({
        ...prev,
        location: 'جهازك لا يدعم تحديد الموقع الجغرافي'
      }));
      useDefaultLocation();
      return;
    }

    console.log('🔍 بدء تحديد الموقع الحالي بأقصى دقة ممكنة...');
    
    // Clear any cached location data first
    setErrors(prev => ({
      ...prev,
      location: '📡 جاري تحديد موقعك الحالي بدقة عالية، يرجى عدم تحريك الجهاز...'
    }));
    
    // Enhanced multi-attempt location detection
    const attemptHighAccuracyLocation = (attemptNumber = 1) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 25000, // 25 seconds for high accuracy
        maximumAge: 0    // Force fresh location, no cached data
      };

      console.log(`🎯 المحاولة ${attemptNumber} - إعدادات عالية الدقة`);
      
      // Create a timeout promise for better error handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), options.timeout);
      });
      
      // Create geolocation promise
      const locationPromise = new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
      
      Promise.race([locationPromise, timeoutPromise])
        .then((position) => {
          const { latitude, longitude, accuracy, timestamp } = position.coords;
          
          // Validate location accuracy
          const isVeryAccurate = accuracy <= 30;   // Excellent accuracy
          const isGoodAccuracy = accuracy <= 100;  // Good accuracy
          const isAcceptable = accuracy <= 500;    // Acceptable accuracy
          
          console.log(`📍 موقع محصل عليه:`, {
            lat: latitude.toFixed(8),
            lng: longitude.toFixed(8), 
            accuracy: `${Math.round(accuracy)} متر`,
            quality: isVeryAccurate ? 'ممتازة' : (isGoodAccuracy ? 'جيدة' : 'مقبولة'),
            timestamp: new Date(timestamp).toLocaleString('ar-EG'),
            attempt: attemptNumber
          });
          
          // If accuracy is poor and we have attempts left, try again
          if (!isAcceptable && attemptNumber < 3) {
            console.log(`⚠️ دقة ضعيفة (${Math.round(accuracy)}م)، محاولة ${attemptNumber + 1}...`);
            setTimeout(() => attemptHighAccuracyLocation(attemptNumber + 1), 2000);
            return;
          }
          
          // If accuracy is poor but we've exhausted attempts, ask user
          if (!isGoodAccuracy && attemptNumber >= 3) {
            const userChoice = confirm(
              `تم الحصول على موقعك بدقة ${Math.round(accuracy)} متر.\n\n` +
              `هل تريد:\n` +
              `✅ استخدام هذا الموقع\n` +
              `🔄 إعادة المحاولة مع خيارات مختلفة\n\n` +
              `(موافق = استخدام الموقع، إلغاء = إعادة المحاولة)`
            );
            
            if (!userChoice) {
              console.log('🔄 المستخدم اختار إعادة المحاولة...');
              attemptNetworkLocation();
              return;
            }
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
          
          // Update both rep and clinic location for accuracy
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

          // Update map with enhanced accuracy
          if (mapInstanceRef.current) {
            updateMapLocationEnhanced(userLoc);
          }
          
          // Clear loading message
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.location;
            return newErrors;
          });
          
          // Show success message
          const qualityEmoji = isVeryAccurate ? '🎯' : (isGoodAccuracy ? '✅' : '⚠️');
          const qualityText = isVeryAccurate ? 'دقة ممتازة' : (isGoodAccuracy ? 'دقة جيدة' : 'دقة مقبولة');
          
          setErrors(prev => ({
            ...prev,
            location_success: `${qualityEmoji} تم تحديد موقعك الحالي بنجاح! ${qualityText} (±${Math.round(accuracy)} متر)`
          }));
          
          // Auto-hide success message
          setTimeout(() => {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.location_success;
              return newErrors;
            });
          }, 8000);
          
        })
        .catch((error) => {
          console.error(`❌ فشلت المحاولة ${attemptNumber}:`, {
            code: error.code || 'TIMEOUT',
            message: error.message,
            timestamp: new Date().toISOString()
          });
          
          if (attemptNumber < 3) {
            console.log(`🔄 جاري المحاولة ${attemptNumber + 1} بعد 3 ثوان...`);
            setErrors(prev => ({
              ...prev,
              location: `🔄 المحاولة ${attemptNumber} فشلت، جاري المحاولة ${attemptNumber + 1}/3...`
            }));
            
            setTimeout(() => attemptHighAccuracyLocation(attemptNumber + 1), 3000);
          } else {
            console.log('🌐 التبديل لخيار الشبكة...');
            attemptNetworkLocation();
          }
        });
    };
    
    // Fallback to network-based location
    const attemptNetworkLocation = () => {
      console.log('🌐 محاولة الحصول على الموقع عبر الشبكة...');
      
      const networkOptions = {
        enableHighAccuracy: false, // Use network location
        timeout: 15000,
        maximumAge: 10000
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('📍 موقع شبكة تم الحصول عليه:', {
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            accuracy: `${Math.round(accuracy)} متر`,
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
          
          // Update location data
          setLocationData(prev => ({
            ...prev,
            rep_latitude: latitude,
            rep_longitude: longitude,
            rep_location_accuracy: accuracy,
            clinic_latitude: latitude,
            clinic_longitude: longitude,
            clinic_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (شبكة)`,
            device_info: navigator.userAgent,
            location_obtained_at: new Date().toISOString(),
            location_source: 'network_location',
            location_quality_score: 40
          }));

          if (mapInstanceRef.current) {
            updateMapLocationEnhanced(userLoc);
          }
          
          setErrors(prev => ({
            ...prev,
            location_success: `📶 تم تحديد موقعك عبر الشبكة (±${Math.round(accuracy)} متر) - للحصول على دقة أفضل، تأكد من تشغيل GPS`
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
          console.error('❌ فشل في الحصول على موقع الشبكة أيضاً:', error);
          
          setErrors(prev => ({
            ...prev,
            location: `❌ فشل في تحديد الموقع. يرجى التأكد من:\n• تفعيل خدمة الموقع في الجهاز\n• منح الإذن للمتصفح\n• الاتصال بالإنترنت\nأو حدد موقع العيادة يدوياً على الخريطة`
          }));
          
          useDefaultLocation();
        },
        networkOptions
      );
    };
    
    // Start the location detection process
    attemptHighAccuracyLocation();
  };

  // Enhanced map location update
  const updateMapLocationEnhanced = (location) => {
    if (!mapInstanceRef.current) return;
    
    console.log('🗺️ تحديث موقع الخريطة بتحسينات...');
    
    // Determine zoom level based on accuracy
    let zoomLevel = 15; // Default
    if (location.accuracy <= 30) zoomLevel = 20;      // Very accurate
    else if (location.accuracy <= 100) zoomLevel = 18; // Good accuracy  
    else if (location.accuracy <= 500) zoomLevel = 16; // Acceptable
    else zoomLevel = 14;                               // Poor accuracy
    
    // Smooth pan to location
    mapInstanceRef.current.panTo(location);
    mapInstanceRef.current.setZoom(zoomLevel);
    
    // Update marker with enhanced styling
    if (markerRef.current) {
      markerRef.current.setPosition(location);
      
      // Enhanced marker with accuracy indication
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
      
      // Add animation
      markerRef.current.setAnimation(window.google.maps.Animation.DROP);
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.setAnimation(null);
        }
      }, 1500);
    }
    
    // Remove previous accuracy circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }
    
    // Add enhanced accuracy circle
    const radiusColor = location.accuracy <= 30 ? '#10b981' : 
                       location.accuracy <= 100 ? '#f59e0b' : '#ef4444';
                       
    accuracyCircleRef.current = new google.maps.Circle({
      strokeColor: radiusColor,
      strokeOpacity: 1.0,
      strokeWeight: 3,
      fillColor: radiusColor,
      fillOpacity: 0.15,
      map: mapInstanceRef.current,
      center: location,
      radius: Math.max(location.accuracy || 50, 10)
    });
    
    // Enhanced info window
    const accuracyText = location.accuracy <= 30 ? 'دقة ممتازة جداً' : 
                        location.accuracy <= 100 ? 'دقة جيدة' : 
                        location.accuracy <= 500 ? 'دقة مقبولة' : 'دقة ضعيفة';
    
    const qualityEmoji = location.accuracy <= 30 ? '🎯' : 
                        location.accuracy <= 100 ? '✅' : 
                        location.accuracy <= 500 ? '⚠️' : '❌';
    
    const infoContent = `
      <div style="text-align: center; font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; min-width: 250px;">
        <div style="background: linear-gradient(135deg, ${radiusColor}, ${radiusColor}aa); color: white; padding: 10px; border-radius: 8px 8px 0 0; margin: -8px -8px 8px -8px;">
          <strong>${qualityEmoji} موقعك الحالي</strong>
        </div>
        <div style="padding: 8px 0;">
          <div style="color: ${radiusColor}; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
            ${accuracyText}
          </div>
          <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin: 8px 0;">
            <div style="color: #333; font-size: 12px; line-height: 1.4;">
              <strong>دقة الموقع:</strong> ±${Math.round(location.accuracy)} متر<br>
              <strong>الإحداثيات:</strong> ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}<br>
              <strong>المصدر:</strong> ${location.source === 'gps_high_accuracy' ? 'GPS عالي الدقة' : 
                                       location.source === 'network' ? 'موقع الشبكة' : 'افتراضي'}<br>
              <strong>الوقت:</strong> ${new Date().toLocaleTimeString('ar-EG')}
            </div>
          </div>
          ${location.accuracy > 100 ? 
            '<div style="background: #fff3cd; padding: 6px; border-radius: 4px; border-left: 3px solid #ffc107;">' +
            '<small style="color: #856404;">💡 للحصول على دقة أفضل، تأكد من تشغيل GPS وتحريك الجهاز للخارج</small>' +
            '</div>' : ''
          }
        </div>
      </div>
    `;
    
    const infoWindow = new google.maps.InfoWindow({
      content: infoContent,
      position: location,
      pixelOffset: new google.maps.Size(0, -15)
    });
    
    // Show info window for appropriate duration based on accuracy
    const displayDuration = location.accuracy <= 100 ? 6000 : 12000;
    infoWindow.open(mapInstanceRef.current);
    setTimeout(() => {
      if (infoWindow) {
        infoWindow.close();
      }
    }, displayDuration);
  };

  // دالة محسنة لتحديث موقع الخريطة
  const updateMapLocation = (location, isHighAccuracy) => {
    if (!mapInstanceRef.current) return;
    
    console.log('🗺️ تحديث موقع الخريطة...');
    
    // تحديد مستوى التكبير حسب دقة الموقع
    const zoomLevel = isHighAccuracy ? 19 : (location.accuracy <= 100 ? 18 : 16);
    
    // تحريك الخريطة بسلاسة إلى الموقع الجديد
    mapInstanceRef.current.panTo(location);
    mapInstanceRef.current.setZoom(zoomLevel);
    
    // تحديث موقع العلامة
    if (markerRef.current) {
      markerRef.current.setPosition(location);
      
      // إضافة أنيميشن للعلامة
      markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.setAnimation(null);
        }
      }, 2000);
    }
    
    // إزالة الدائرة السابقة
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }
    
    // إضافة دائرة دقة محسنة
    const radiusColor = isHighAccuracy ? '#10b981' : (location.accuracy <= 100 ? '#f59e0b' : '#ef4444');
    accuracyCircleRef.current = new window.google.maps.Circle({
      strokeColor: radiusColor,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      fillColor: radiusColor,
      fillOpacity: 0.1,
      map: mapInstanceRef.current,
      center: location,
      radius: Math.max(location.accuracy || 50, 10) // الحد الأدنى 10 أمتار
    });
    
    // إنشاء نافذة معلومات محسنة
    const accuracyText = location.accuracy <= 50 ? 'دقة عالية جداً' : 
                        (location.accuracy <= 100 ? 'دقة جيدة' : 'دقة مقبولة');
    
    const infoContent = `
      <div style="text-align: center; font-family: 'Segoe UI', Arial, sans-serif; direction: rtl;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px; border-radius: 8px 8px 0 0; margin: -8px -8px 8px -8px;">
          <strong>📍 موقعك الحالي</strong>
        </div>
        <div style="padding: 4px 0;">
          <div style="color: ${radiusColor}; font-weight: bold; margin-bottom: 4px;">
            ${accuracyText}
          </div>
          <small style="color: #666;">
            دقة الموقع: ±${Math.round(location.accuracy)} متر<br>
            الإحداثيات: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
          </small>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          <small style="color: #999;">
            ${new Date().toLocaleTimeString('ar-EG')}
          </small>
        </div>
      </div>
    `;
    
    const infoWindow = new window.google.maps.InfoWindow({
      content: infoContent,
      position: location,
      pixelOffset: new window.google.maps.Size(0, -10)
    });
    
    // عرض النافذة مؤقتاً
    infoWindow.open(mapInstanceRef.current);
    setTimeout(() => {
      if (infoWindow) {
        infoWindow.close();
      }
    }, 6000); // عرض لمدة 6 ثواني لإعطاء وقت أكثر للقراءة
  };

  // دالة مساعدة لتوضيح تفاصيل الخطأ
  const getLocationErrorDetails = (error) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return "المستخدم رفض طلب الوصول للموقع";
      case error.POSITION_UNAVAILABLE:
        return "معلومات الموقع غير متاحة";
      case error.TIMEOUT:
        return "انتهت مهلة طلب الموقع";
      default:
        return "خطأ غير معروف";
    }
  };

  // دالة لإرجاع رسالة خطأ للمستخدم
  const getLocationErrorMessage = (error) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return "يرجى السماح للموقع بالوصول للموقع الجغرافي من إعدادات المتصفح";
      case error.POSITION_UNAVAILABLE:
        return "تعذر تحديد موقعك الحالي، يرجى تحديد الموقع يدوياً على الخريطة";
      case error.TIMEOUT:
        return "تم تجاوز الوقت المحدد للحصول على الموقع، يرجى المحاولة مرة أخرى";
      default:
        return "خطأ في تحديد الموقع، يرجى تحديد الموقع يدوياً على الخريطة";
    }
  };

  // دالة محسنة لاستخدام الموقع الافتراضي
  const useDefaultLocation = () => {
    // إحداثيات أكثر دقة لوسط القاهرة (ميدان التحرير)
    const defaultLocation = { 
      lat: 30.0444, // خط العرض لميدان التحرير
      lng: 31.2357, // خط الطول لميدان التحرير
      accuracy: null,
      isDefault: true
    };
    
    setUserLocation(defaultLocation);
    console.log('📍 استخدام الموقع الافتراضي المحسن (ميدان التحرير - القاهرة):', defaultLocation);
    
    setLocationData(prev => ({
      ...prev,
      rep_latitude: defaultLocation.lat,
      rep_longitude: defaultLocation.lng,
      rep_location_accuracy: null,
      // إضافة موقع العيادة أيضاً
      clinic_latitude: defaultLocation.lat,
      clinic_longitude: defaultLocation.lng,
      clinic_address: `ميدان التحرير، القاهرة (${defaultLocation.lat.toFixed(6)}, ${defaultLocation.lng.toFixed(6)})`,
      device_info: navigator.userAgent,
      location_obtained_at: new Date().toISOString(),
      location_source: 'default_cairo_center',
      location_note: 'تم استخدام الموقع الافتراضي (ميدان التحرير، القاهرة) - يرجى تحديد الموقع الصحيح يدوياً'
    }));
    
    // إذا كانت الخريطة متاحة، اضبطها على الموقع الافتراضي
    if (mapInstanceRef.current) {
      console.log('🗺️ تحديث الخريطة للموقع الافتراضي...');
      mapInstanceRef.current.setCenter(defaultLocation);
      mapInstanceRef.current.setZoom(11); // zoom مناسب لعرض القاهرة
      
      if (markerRef.current) {
        markerRef.current.setPosition(defaultLocation);
        
        // تغيير لون العلامة للإشارة لأنه موقع افتراضي
        markerRef.current.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C7.031 0 3 4.031 3 9C3 14.25 12 24 12 24S21 14.25 21 9C21 4.031 16.969 0 12 0ZM12 12.5C10.069 12.5 8.5 10.931 8.5 9S10.069 5.5 12 5.5S15.5 7.069 15.5 9S13.931 12.5 12 12.5Z" fill="#FF6B35"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        });
      }
      
      // إضافة نافذة معلومات تفسيرية
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="text-align: center; font-family: 'Segoe UI', Arial, sans-serif; direction: rtl;">
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7971e 100%); color: white; padding: 8px; border-radius: 8px 8px 0 0; margin: -8px -8px 8px -8px;">
              <strong>📍 الموقع الافتراضي</strong>
            </div>
            <div style="padding: 8px 0;">
              <div style="color: #ff6b35; font-weight: bold; margin-bottom: 8px;">
                ميدان التحرير - وسط القاهرة
              </div>
              <div style="background: #fff3cd; padding: 8px; border-radius: 6px; margin: 8px 0;">
                <small style="color: #856404;">
                  ⚠️ هذا موقع افتراضي<br>
                  يرجى تحديد الموقع الصحيح للعيادة
                </small>
              </div>
              <div style="margin-top: 8px;">
                <button onclick="document.querySelector('[onclick*=getCurrentLocation]').click()" 
                        style="background: #28a745; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  📱 تحديد موقعي الحالي
                </button>
              </div>
            </div>
          </div>
        `,
        position: defaultLocation
      });
      
      // عرض النافذة لفترة أطول لأنها مهمة
      if (infoWindow && mapInstanceRef.current) {
        infoWindow.open(mapInstanceRef.current);
        setTimeout(() => {
          if (infoWindow) {
            infoWindow.close();
          }
        }, 8000); // 8 ثوان لقراءة التحذير
      }
    }
    
    // إظهار تحذير للمستخدم
    setErrors(prev => ({
      ...prev,
      location: '📍 تم استخدام الموقع الافتراضي (ميدان التحرير). يرجى الضغط على "تحديد موقعي الحالي" أو تحديد موقع العيادة يدوياً على الخريطة لضمان الدقة.'
    }));
  };

  const initializeMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      console.error('❌ Google Maps غير متاح أو عنصر الخريطة غير موجود');
      return;
    }

    try {
      // إعداد الموقع الافتراضي - استخدام الموقع الحالي إذا كان متاحاً
      const defaultCenter = userLocation || { lat: 30.0444, lng: 31.2357 }; // القاهرة
      const initialZoom = userLocation ? 17 : 13; // zoom أعلى إذا كان الموقع الحالي متاحاً
      
      console.log('🗺️ تهيئة الخريطة في الموقع:', defaultCenter);

      // إنشاء الخريطة
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

      // حفظ مرجع الخريطة
      mapInstanceRef.current = map;

      // إنشاء دبوس قابل للسحب مع icon محسن
      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: 'موقع العيادة - يمكنك سحبه لتحديد الموقع الدقيق',
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

      // حفظ مرجع الدبوس
      markerRef.current = marker;

      // إذا كان الموقع الحالي متاحاً، أضف دائرة الدقة
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
        
        console.log(`📍 تم إضافة دائرة دقة الموقع بنصف قطر ${userLocation.accuracy} متر`);
      }

      // إضافة زر "موقعي الحالي" مخصص
      const locationButton = document.createElement('button');
      locationButton.textContent = '📍 موقعي الحالي';
      locationButton.classList.add('custom-location-button');
      locationButton.style.cssText = `
        background-color: white;
        border: 2px solid #ddd;
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
      `;
      
      locationButton.addEventListener('mouseenter', () => {
        locationButton.style.backgroundColor = '#f0f0f0';
        locationButton.style.transform = 'scale(1.05)';
      });
      
      locationButton.addEventListener('mouseleave', () => {
        locationButton.style.backgroundColor = 'white';
        locationButton.style.transform = 'scale(1)';
      });

      locationButton.addEventListener('click', () => {
        locationButton.textContent = '⏳ جاري التحديد...';
        locationButton.disabled = true;
        getCurrentLocation();
        
        setTimeout(() => {
          locationButton.textContent = '📍 موقعي الحالي';
          locationButton.disabled = false;
        }, 3000);
      });

      map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(locationButton);

      // إعداد البحث في الخريطة
      if (window.google.maps.places) {
        const searchInput = document.getElementById('address-search');
        if (searchInput) {
          const searchBox = new window.google.maps.places.SearchBox(searchInput);
          map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchInput);

          // البحث عند الكتابة
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
              clinic_address: place.formatted_address || place.name || `${lat}, ${lng}`,
              search_query: searchInput.value
            }));
          });
        }
      }

      // معالج حدث سحب الدبوس
      marker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        console.log('📍 تم تحديد موقع جديد:', { lat, lng });
        
        setLocationData(prev => ({
          ...prev,
          clinic_latitude: lat,
          clinic_longitude: lng,
          clinic_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));

        // Reverse Geocoding للحصول على العنوان
        if (window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address;
              console.log('🏠 العنوان المحول:', address);
              
              setLocationData(prev => ({
                ...prev,
                clinic_address: address
              }));
            }
          });
        }
      });

      // النقر على الخريطة لتحديد موقع جديد
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        marker.setPosition({ lat, lng });
        
        setLocationData(prev => ({
          ...prev,
          clinic_latitude: lat,
          clinic_longitude: lng
        }));
        
        console.log('🖱️ تم النقر على موقع جديد:', { lat, lng });
      });

      console.log('✅ تم تهيئة الخريطة بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الخريطة:', error);
      setErrors(prev => ({
        ...prev,
        map: 'خطأ في تحميل الخريطة، يرجى إعادة تحميل الصفحة'
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // إزالة رسالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // دالة حساب نسبة إكمال النموذج
  const getFormCompletionPercentage = () => {
    const requiredFields = [
      'clinic_name', 'doctor_name', 
      'clinic_address', 'line_id', 'area_id', 
      'classification', 'credit_classification'
    ];
    const locationRequired = locationData.clinic_latitude && locationData.clinic_longitude;
    
    let completed = 0;
    const total = requiredFields.length + (locationRequired ? 1 : 0);
    
    // فحص الحقول المطلوبة
    requiredFields.forEach(field => {
      if (formData[field] && formData[field].trim() !== '') {
        completed++;
      }
    });
    
    // فحص الموقع
    if (locationRequired) {
      completed++;
    }
    
    return Math.round((completed / (requiredFields.length + 1)) * 100);
  };

  const getFilteredAreas = () => {
    if (!formData.line_id) return [];
    // فلترة المناطق حسب الخط المختار من APIs النظام الأساسية
    return formOptions.areas.filter(area => 
      area.parent_line_id === formData.line_id || area.line_id === formData.line_id
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    // التحقق من الحقول المطلوبة
    if (!formData.clinic_name.trim()) newErrors.clinic_name = 'اسم العيادة مطلوب';
    if (!formData.doctor_name.trim()) newErrors.doctor_name = 'اسم الطبيب مطلوب';
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
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg min-h-screen">
      {/* العنوان الرئيسي المحسن */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <span className="text-3xl">🏥</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          تسجيل عيادة جديدة - نظام محسن
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          يرجى ملء جميع البيانات المطلوبة وتحديد موقع العيادة على الخريطة بدقة. 
          النظام متكامل مع إدارة الخطوط والمناطق لضمان التوافق الكامل.
        </p>
      </div>

      {/* شريط التقدم */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">مدى اكتمال النموذج</span>
          <span className="text-sm text-gray-500">{getFormCompletionPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getFormCompletionPercentage()}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>معلومات أساسية</span>
          <span>موقع وخريطة</span>
          <span>تصنيفات</span>
          <span>مكتمل</span>
        </div>
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
        {/* قسم الخريطة والموقع - محسن */}
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
            🗺️ تحديد الموقع على الخريطة
          </h3>
          
          {/* رسالة خطأ الموقع */}
          {errors.location && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-yellow-800 text-sm">
                    {errors.location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* أزرار التحكم في الموقع المحسنة */}
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loading}
              className="relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              📍 تحديد موقعي الحالي بدقة عالية
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current && markerRef.current) {
                  const center = mapInstanceRef.current.getCenter();
                  markerRef.current.setPosition(center);
                  
                  setLocationData(prev => ({
                    ...prev,
                    clinic_latitude: center.lat(),
                    clinic_longitude: center.lng(),
                    location_source: 'manual_center'
                  }));
                  
                  // إظهار رسالة تأكيد
                  setErrors(prev => ({
                    ...prev,
                    location_success: '✅ تم وضع دبوس العيادة في وسط الخريطة'
                  }));
                  
                  setTimeout(() => {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.location_success;
                      return newErrors;
                    });
                  }, 3000);
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              🎯 وضع الدبوس في المنتصف
            </button>

            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  // إعادة تعيين الخريطة لموقع القاهرة الافتراضي
                  const defaultLocation = { lat: 30.0444, lng: 31.2357 };
                  mapInstanceRef.current.setCenter(defaultLocation);
                  mapInstanceRef.current.setZoom(11);
                  
                  if (markerRef.current) {
                    markerRef.current.setPosition(defaultLocation);
                  }
                  
                  setLocationData(prev => ({
                    ...prev,
                    clinic_latitude: defaultLocation.lat,
                    clinic_longitude: defaultLocation.lng,
                    location_source: 'default'
                  }));
                  
                  setErrors(prev => ({
                    ...prev,
                    location_success: '🏙️ تم إعادة تعيين الخريطة للموقع الافتراضي (القاهرة)'
                  }));
                  
                  setTimeout(() => {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.location_success;
                      return newErrors;
                    });
                  }, 3000);
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
            >
              🏙️ إعادة التعيين
            </button>
          </div>
          
          {/* رسائل حالة الموقع */}
          {errors.location_success && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-md">
              <p className="text-green-700 text-sm font-medium">
                {errors.location_success}
              </p>
            </div>
          )}

          {/* حقل البحث في العنوان */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              البحث عن عنوان أو مكان
            </label>
            <input
              id="address-search"
              type="text"
              className="w-full px-3 py-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              placeholder="اكتب اسم المكان أو العنوان للبحث..."
            />
            <p className="mt-1 text-xs text-blue-600">
              مثال: مستشفى القاهرة، شارع التحرير، أو اسم المنطقة
            </p>
          </div>

          {/* الخريطة */}
          <div className="relative">
            <div 
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-blue-300 shadow-lg"
              style={{ minHeight: '400px' }}
            />
            {/* مؤشر التحميل */}
            {!window.google && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-blue-600 text-sm">جاري تحميل الخريطة...</p>
                </div>
              </div>
            )}
          </div>

          {/* معلومات الموقع المحدد */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              معلومات الموقع المحدد:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">خط الطول:</span>
                <span className="ml-2 text-blue-600">
                  {locationData.clinic_longitude ? locationData.clinic_longitude.toFixed(6) : 'غير محدد'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">خط العرض:</span>
                <span className="ml-2 text-blue-600">
                  {locationData.clinic_latitude ? locationData.clinic_latitude.toFixed(6) : 'غير محدد'}
                </span>
              </div>
              {locationData.clinic_address && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">العنوان:</span>
                  <span className="ml-2 text-gray-800">{locationData.clinic_address}</span>
                </div>
              )}
              {userLocation && userLocation.accuracy && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">دقة الموقع:</span>
                  <span className="ml-2 text-green-600">
                    ±{Math.round(userLocation.accuracy)} متر
                  </span>
                </div>
              )}
            </div>
            
            {(!locationData.clinic_latitude || !locationData.clinic_longitude) && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  ⚡ يرجى تحديد موقع العيادة على الخريطة بسحب الدبوس أو النقر على الموقع المطلوب
                </p>
              </div>
            )}
          </div>

          {/* إرشادات الاستخدام */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">إرشادات تحديد الموقع:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• اضغط على "الحصول على موقعي الحالي" لتحديد موقعك الحالي تلقائياً</li>
              <li>• يمكنك البحث عن العنوان في مربع البحث أعلاه</li>
              <li>• اسحب الدبوس الأحمر لتحديد الموقع الدقيق للعيادة</li>
              <li>• انقر في أي مكان على الخريطة لنقل الدبوس إلى ذلك الموقع</li>
              <li>• استخدم أزرار التكبير والتصغير للحصول على دقة أفضل</li>
            </ul>
          </div>
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

        {/* قسم التقسيم الإداري - محسن مع التكامل الكامل */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center">
            🗂️ التقسيم الإداري والجغرافي
            <span className="ml-2 px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs">
              متكامل مع النظام
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* الخط - بطاقات تفاعلية */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-purple-800 mb-4">
                <span className="flex items-center">
                  🚀 اختيار الخط *
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {formOptions.lines.length} خط متاح
                  </span>
                </span>
              </label>
              
              {formOptions.lines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formOptions.lines.map((line) => (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() => {
                        handleInputChange('line_id', line.id);
                        // إعادة تعيين المنطقة عند تغيير الخط
                        handleInputChange('area_id', '');
                      }}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg text-right ${
                        formData.line_id === line.id
                          ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg scale-105'
                          : 'border-purple-200 bg-white hover:border-purple-400 text-gray-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🚀</span>
                          <span className="text-xs font-mono opacity-60">
                            {line.code || 'N/A'}
                          </span>
                        </div>
                        <div className="font-bold text-sm">
                          {line.name}
                        </div>
                        {line.description && (
                          <div className="text-xs opacity-75 leading-tight">
                            {line.description}
                          </div>
                        )}
                        {line.manager_name && (
                          <div className="text-xs opacity-60">
                            👨‍💼 مدير: {line.manager_name}
                          </div>
                        )}
                        {formData.line_id === line.id && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse mx-auto"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ لا توجد خطوط متاحة. يرجى التواصل مع الإدارة لإعداد الخطوط الجغرافية.
                  </p>
                </div>
              )}
              
              {errors.line_id && (
                <p className="mt-2 text-sm text-red-600">{errors.line_id}</p>
              )}
            </div>

            {/* المنطقة - بطاقات تفاعلية مفلترة */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-purple-800 mb-4">
                <span className="flex items-center">
                  🌍 اختيار المنطقة *
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {getFilteredAreas().length} منطقة متاحة
                  </span>
                  {!formData.line_id && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      يجب اختيار الخط أولاً
                    </span>
                  )}
                </span>
              </label>
              
              {formData.line_id ? (
                getFilteredAreas().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredAreas().map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleInputChange('area_id', area.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg text-right ${
                          formData.area_id === area.id
                            ? 'border-purple-500 bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg scale-105'
                            : 'border-purple-200 bg-white hover:border-purple-400 text-gray-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">🌍</span>
                            <span className="text-xs font-mono opacity-60">
                              {area.code || 'N/A'}
                            </span>
                          </div>
                          <div className="font-bold text-sm">
                            {area.name}
                          </div>
                          {area.description && (
                            <div className="text-xs opacity-75 leading-tight">
                              {area.description}
                            </div>
                          )}
                          {area.manager_id && (
                            <div className="text-xs opacity-60">
                              👨‍💼 مدير المنطقة
                            </div>
                          )}
                          {formData.area_id === area.id && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse mx-auto"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ لا توجد مناطق متاحة للخط المختار. يرجى اختيار خط آخر أو التواصل مع الإدارة.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-sm flex items-center">
                    👆 يرجى اختيار الخط أولاً لعرض المناطق المرتبطة به
                  </p>
                </div>
              )}
              
              {errors.area_id && (
                <p className="mt-2 text-sm text-red-600">{errors.area_id}</p>
              )}
            </div>
          </div>

          {/* ملخص الاختيار */}
          {(formData.line_id || formData.area_id) && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200 shadow-inner">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                ملخص التقسيم الإداري المختار:
              </h4>
              <div className="space-y-2">
                {formData.line_id && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                      🚀 {formOptions.lines.find(l => l.id === formData.line_id)?.name || 'خط غير محدد'}
                    </span>
                  </div>
                )}
                {formData.area_id && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-500 to-teal-600 text-white">
                      🌍 {getFilteredAreas().find(a => a.id === formData.area_id)?.name || 'منطقة غير محددة'}
                    </span>
                  </div>
                )}
              </div>
              {formData.line_id && formData.area_id && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  ✅ تم اختيار التقسيم الإداري بنجاح - مرتبط بنظام إدارة الخطوط والمناطق
                </p>
              )}
            </div>
          )}
        </div>

        {/* قسم تصنيفات العيادة - محسن مع البطاقات التفاعلية */}
        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
          <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center">
            ⭐ تصنيفات العيادة
          </h3>
          
          {/* تصنيف العيادة - بطاقات تفاعلية */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-orange-800 mb-4">
              تصنيف العيادة حسب الأداء والجودة *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formOptions.classifications.map((classification) => (
                <button
                  key={classification.value}
                  type="button"
                  onClick={() => handleInputChange('classification', classification.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    formData.classification === classification.value
                      ? `border-orange-500 bg-gradient-to-r ${classification.color} text-white shadow-lg scale-105`
                      : 'border-orange-200 bg-white hover:border-orange-400 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="text-2xl">{classification.icon}</span>
                    <span className="font-medium text-sm leading-tight">
                      {classification.label}
                    </span>
                    {formData.classification === classification.value && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {formData.classification && (
              <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                <p className="text-sm text-orange-800">
                  ✅ <strong>التصنيف المختار:</strong> {getClassificationLabel(formData.classification)}
                </p>
              </div>
            )}
          </div>

          {/* التصنيف الائتماني - بطاقات تفاعلية */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-orange-800 mb-4">
              التصنيف الائتماني للعيادة *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formOptions.credit_classifications.map((classification) => (
                <button
                  key={classification.value}
                  type="button"
                  onClick={() => handleInputChange('credit_classification', classification.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    formData.credit_classification === classification.value
                      ? `border-orange-500 bg-gradient-to-r ${classification.color} text-white shadow-lg scale-105`
                      : 'border-orange-200 bg-white hover:border-orange-400 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="text-3xl">{classification.icon}</span>
                    <span className="font-medium text-sm leading-tight">
                      {classification.label}
                    </span>
                    {formData.credit_classification === classification.value && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {formData.credit_classification && (
              <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                <p className="text-sm text-orange-800">
                  ✅ <strong>التصنيف الائتماني المختار:</strong> {getCreditClassificationLabel(formData.credit_classification)}
                </p>
              </div>
            )}
          </div>

          {/* ملاحظات التصنيف */}
          <div className="mb-6">
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

          {/* عرض التصنيفات المختارة - محسن */}
          <div className="p-4 bg-white rounded-lg border border-orange-200 shadow-inner">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              ملخص التصنيفات المختارة:
            </h4>
            <div className="flex flex-wrap gap-3">
              {formData.classification && (
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getClassificationColor(formData.classification)} text-white shadow-md`}>
                    {getClassificationIcon(formData.classification)} {getClassificationLabel(formData.classification)}
                  </span>
                </div>
              )}
              {formData.credit_classification && (
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getCreditClassificationColor(formData.credit_classification)} text-white shadow-md`}>
                    {getCreditClassificationIcon(formData.credit_classification)} {getCreditClassificationLabel(formData.credit_classification)}
                  </span>
                </div>
              )}
            </div>
            {(!formData.classification || !formData.credit_classification) && (
              <p className="text-xs text-gray-500 mt-2 italic">
                يرجى اختيار التصنيفات المطلوبة أعلاه لإكمال التسجيل
              </p>
            )}
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