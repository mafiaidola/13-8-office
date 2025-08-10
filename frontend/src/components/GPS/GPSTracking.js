// Enhanced GPS Tracking Component - تتبع المواقع المحسن
import React, { useState, useEffect, useRef } from 'react';

const GPSTracking = ({ user, language = 'en', isRTL, theme = 'dark' }) => {
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Enhanced GPS options
  const gpsOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Start GPS tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert(language === 'ar' ? 'متصفحك لا يدعم تحديد الموقع' : 'Your browser does not support geolocation');
      return;
    }

    setGpsStatus('requesting');
    
    // Get current position first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date();

        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: timestamp.toISOString(),
          formatted_time: timestamp.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')
        };

        setCurrentLocation(locationData);
        setAccuracy(accuracy);
        setLocationHistory(prev => [...prev, locationData]);
        setGpsStatus('tracking');

        // Initialize map if available
        if (window.google && mapRef.current) {
          initializeMap(latitude, longitude);
        }

        // Start continuous tracking
        const newWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
            const time = new Date();

            const newLocation = {
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              timestamp: time.toISOString(),
              formatted_time: time.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')
            };

            setCurrentLocation(newLocation);
            setAccuracy(acc);
            setLocationHistory(prev => [...prev.slice(-9), newLocation]); // Keep last 10 locations

            // Update map marker
            if (markerRef.current) {
              markerRef.current.setPosition({ lat, lng });
            }
          },
          (error) => {
            console.error('GPS tracking error:', error);
            setGpsStatus('error');
          },
          gpsOptions
        );

        setWatchId(newWatchId);
      },
      (error) => {
        console.error('Initial GPS error:', error);
        setGpsStatus('error');
        
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = language === 'ar' 
              ? 'تم رفض الإذن لتحديد الموقع' 
              : 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = language === 'ar' 
              ? 'معلومات الموقع غير متاحة' 
              : 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = language === 'ar' 
              ? 'انتهت مهلة طلب تحديد الموقع' 
              : 'Location request timed out';
            break;
          default:
            errorMessage = language === 'ar' 
              ? 'حدث خطأ غير معروف' 
              : 'Unknown error occurred';
        }
        
        alert(errorMessage);
      },
      gpsOptions
    );
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setGpsStatus('stopped');
  };

  // Initialize Google Maps
  const initializeMap = (lat, lng) => {
    if (!window.google || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 16,
      mapTypeId: 'roadmap'
    });

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: language === 'ar' ? 'موقعك الحالي' : 'Your Current Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="10" fill="#4285F4" stroke="#ffffff" stroke-width="3"/>
            <circle cx="15" cy="15" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  };

  // Clear location history
  const clearHistory = () => {
    setLocationHistory([]);
  };

  return (
    <div className="gps-tracking-container min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="header-section bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              🗺️ {language === 'ar' ? 'تتبع المواقع المحسن' : 'Enhanced GPS Tracking'}
            </h1>
            <p className="text-blue-100 text-lg">
              {language === 'ar' 
                ? 'تتبع موقعك الحالي بدقة عالية ومتابعة حركتك'
                : 'Track your current location with high accuracy and monitor movement'
              }
            </p>
          </div>
          
          {/* GPS Status Indicator */}
          <div className={`gps-status px-4 py-2 rounded-xl font-semibold ${
            gpsStatus === 'tracking' ? 'bg-green-500/20 text-green-100' :
            gpsStatus === 'requesting' ? 'bg-yellow-500/20 text-yellow-100' :
            gpsStatus === 'error' ? 'bg-red-500/20 text-red-100' :
            gpsStatus === 'stopped' ? 'bg-gray-500/20 text-gray-100' :
            'bg-gray-500/20 text-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <span>
                {gpsStatus === 'tracking' ? '🟢' :
                 gpsStatus === 'requesting' ? '🔄' :
                 gpsStatus === 'error' ? '❌' : 
                 gpsStatus === 'stopped' ? '⏹️' : '📡'}
              </span>
              <span>
                {gpsStatus === 'idle' ? (language === 'ar' ? 'GPS خامل' : 'GPS Idle') :
                 gpsStatus === 'requesting' ? (language === 'ar' ? 'طلب الإذن...' : 'Requesting...') :
                 gpsStatus === 'tracking' ? (language === 'ar' ? 'يتم التتبع' : 'Tracking Active') :
                 gpsStatus === 'stopped' ? (language === 'ar' ? 'متوقف' : 'Stopped') :
                 gpsStatus === 'error' ? (language === 'ar' ? 'خطأ GPS' : 'GPS Error') : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          🎛️ {language === 'ar' ? 'لوحة التحكم' : 'Control Panel'}
        </h2>
        
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={startTracking}
            disabled={gpsStatus === 'tracking' || gpsStatus === 'requesting'}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 font-medium shadow-lg"
          >
            <span>🚀</span>
            {language === 'ar' ? 'بدء التتبع' : 'Start Tracking'}
          </button>

          <button
            onClick={stopTracking}
            disabled={gpsStatus !== 'tracking'}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 font-medium shadow-lg"
          >
            <span>⏹️</span>
            {language === 'ar' ? 'إيقاف التتبع' : 'Stop Tracking'}
          </button>

          <button
            onClick={clearHistory}
            disabled={locationHistory.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 font-medium shadow-lg"
          >
            <span>🗑️</span>
            {language === 'ar' ? 'مسح السجل' : 'Clear History'}
          </button>
        </div>
      </div>

      {/* Current Location Info */}
      {currentLocation && (
        <div className="current-location bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            📍 {language === 'ar' ? 'الموقع الحالي' : 'Current Location'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="location-item bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <div className="text-blue-300 text-sm font-medium mb-1">
                {language === 'ar' ? 'خط العرض' : 'Latitude'}
              </div>
              <div className="text-white text-lg font-bold">
                {currentLocation.latitude.toFixed(6)}
              </div>
            </div>

            <div className="location-item bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <div className="text-green-300 text-sm font-medium mb-1">
                {language === 'ar' ? 'خط الطول' : 'Longitude'}
              </div>
              <div className="text-white text-lg font-bold">
                {currentLocation.longitude.toFixed(6)}
              </div>
            </div>

            <div className="location-item bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
              <div className="text-yellow-300 text-sm font-medium mb-1">
                {language === 'ar' ? 'الدقة' : 'Accuracy'}
              </div>
              <div className="text-white text-lg font-bold">
                ±{Math.round(currentLocation.accuracy)}m
              </div>
            </div>

            <div className="location-item bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <div className="text-purple-300 text-sm font-medium mb-1">
                {language === 'ar' ? 'التوقيت' : 'Time'}
              </div>
              <div className="text-white text-sm font-bold">
                {currentLocation.formatted_time}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="map-section bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          🗺️ {language === 'ar' ? 'الخريطة التفاعلية' : 'Interactive Map'}
        </h2>
        
        <div 
          ref={mapRef}
          className="google-map w-full h-96 rounded-xl shadow-lg border border-white/20 bg-gray-300"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <div className="history-section bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            📝 {language === 'ar' ? 'سجل المواقع' : 'Location History'}
            <span className="text-sm bg-blue-500/20 text-blue-200 px-2 py-1 rounded-lg">
              {locationHistory.length} {language === 'ar' ? 'موقع' : 'locations'}
            </span>
          </h2>
          
          <div className="history-list space-y-2 max-h-64 overflow-y-auto">
            {locationHistory.slice().reverse().map((location, index) => (
              <div key={index} className="history-item bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">📍</span>
                    <div>
                      <div className="text-white text-sm">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                      <div className="text-white/60 text-xs">
                        {language === 'ar' ? 'دقة:' : 'Accuracy:'} ±{Math.round(location.accuracy)}m
                      </div>
                    </div>
                  </div>
                  <div className="text-white/60 text-xs">
                    {location.formatted_time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-section bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          ℹ️ {language === 'ar' ? 'التعليمات' : 'Instructions'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="instruction bg-white/5 rounded-lg p-3">
            <div className="text-green-300 font-medium mb-1">
              {language === 'ar' ? '1. بدء التتبع' : '1. Start Tracking'}
            </div>
            <p className="text-white/70">
              {language === 'ar' 
                ? 'اضغط "بدء التتبع" للسماح بالوصول للموقع وبدء المراقبة'
                : 'Click "Start Tracking" to allow location access and begin monitoring'
              }
            </p>
          </div>
          
          <div className="instruction bg-white/5 rounded-lg p-3">
            <div className="text-blue-300 font-medium mb-1">
              {language === 'ar' ? '2. المراقبة المستمرة' : '2. Continuous Monitoring'}
            </div>
            <p className="text-white/70">
              {language === 'ar' 
                ? 'سيتم تتبع موقعك تلقائياً وتحديث الخريطة في الوقت الفعلي'
                : 'Your location will be tracked automatically with real-time map updates'
              }
            </p>
          </div>
          
          <div className="instruction bg-white/5 rounded-lg p-3">
            <div className="text-yellow-300 font-medium mb-1">
              {language === 'ar' ? '3. دقة الموقع' : '3. Location Accuracy'}
            </div>
            <p className="text-white/70">
              {language === 'ar' 
                ? 'كلما قل رقم الدقة، كان تحديد الموقع أكثر دقة'
                : 'Lower accuracy numbers indicate more precise location detection'
              }
            </p>
          </div>
          
          <div className="instruction bg-white/5 rounded-lg p-3">
            <div className="text-red-300 font-medium mb-1">
              {language === 'ar' ? '4. إيقاف التتبع' : '4. Stop Tracking'}
            </div>
            <p className="text-white/70">
              {language === 'ar' 
                ? 'استخدم "إيقاف التتبع" لتوفير البطارية عند الانتهاء'
                : 'Use "Stop Tracking" to save battery when finished'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSTracking;