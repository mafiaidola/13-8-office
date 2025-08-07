// Live GPS Map for Clinic Registration - خريطة GPS حية لتسجيل العيادات
import React, { useEffect, useRef, useState } from 'react';

const LiveGPSMap = ({ 
  onLocationCapture, 
  language = 'ar',
  readOnly = true 
}) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    initializeGPSMap();
    
    // Update location every 30 seconds for live tracking
    const interval = setInterval(updateUserLocation, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeGPSMap = () => {
    if (!navigator.geolocation) {
      setError('GPS غير مدعوم في هذا المتصفح');
      setIsLoading(false);
      return;
    }

    // Get high accuracy location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        setUserLocation(location);
        setAccuracy(Math.round(position.coords.accuracy));
        setIsLoading(false);
        
        // Initialize map
        initializeMap(location);
        
        // Send location to parent
        if (onLocationCapture) {
          onLocationCapture(location);
        }
        
        console.log('✅ GPS location captured:', location);
      },
      (error) => {
        console.error('❌ GPS error:', error);
        setError(getGPSErrorMessage(error.code));
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Always get fresh location
      }
    );
  };

  const updateUserLocation = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        setUserLocation(newLocation);
        setAccuracy(Math.round(position.coords.accuracy));
        
        // Update map marker
        updateMapMarker(newLocation);
        
        // Send updated location to parent
        if (onLocationCapture) {
          onLocationCapture(newLocation);
        }
      },
      (error) => {
        console.warn('⚠️ Location update failed:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const initializeMap = (location) => {
    if (!window.google) {
      setError('Google Maps لم يتم تحميله');
      return;
    }

    try {
      const mapOptions = {
        center: { lat: location.latitude, lng: location.longitude },
        zoom: 18, // High zoom for accuracy
        mapTypeId: window.google.maps.MapTypeId.HYBRID, // Hybrid for better visibility
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: readOnly ? 'none' : 'cooperative', // Disable interaction if readOnly
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);

      // Add user location marker with high accuracy
      const marker = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: map,
        draggable: false, // Not draggable for GPS accuracy
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="gpsGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style="stop-color:#4285F4;stop-opacity:1" />
                  <stop offset="70%" style="stop-color:#1E88E5;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#1565C0;stop-opacity:0.9" />
                </radialGradient>
              </defs>
              <circle cx="20" cy="20" r="18" fill="url(#gpsGrad)" stroke="#FFFFFF" stroke-width="3"/>
              <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
              <circle cx="20" cy="20" r="4" fill="#1E88E5"/>
              <text x="20" y="35" text-anchor="middle" font-family="Arial" font-size="8" fill="#1565C0" font-weight="bold">GPS</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        },
        title: `موقعك الحالي (دقة: ${Math.round(location.accuracy)}م)`,
        animation: window.google.maps.Animation.DROP
      });

      // Add accuracy circle
      const accuracyCircle = new window.google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        map: map,
        center: { lat: location.latitude, lng: location.longitude },
        radius: location.accuracy
      });

      // Store references for updates
      mapRef.current.marker = marker;
      mapRef.current.accuracyCircle = accuracyCircle;
      mapRef.current.mapInstance = map;

      // Info window with detailed GPS info
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(location)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      console.log('✅ Live GPS map initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing GPS map:', error);
      setError('خطأ في تحميل الخريطة');
    }
  };

  const updateMapMarker = (location) => {
    if (mapRef.current?.marker && mapRef.current?.accuracyCircle) {
      const newPos = { lat: location.latitude, lng: location.longitude };
      
      // Update marker position
      mapRef.current.marker.setPosition(newPos);
      mapRef.current.marker.setTitle(`موقعك الحالي (دقة: ${Math.round(location.accuracy)}م)`);
      
      // Update accuracy circle
      mapRef.current.accuracyCircle.setCenter(newPos);
      mapRef.current.accuracyCircle.setRadius(location.accuracy);
      
      // Re-center map
      if (mapRef.current.mapInstance) {
        mapRef.current.mapInstance.setCenter(newPos);
      }
      
      console.log('📍 GPS location updated on map');
    }
  };

  const createInfoWindowContent = (location) => {
    return `
      <div style="padding: 12px; font-family: Arial; max-width: 280px;">
        <h4 style="margin: 0 0 8px; color: #1565C0; font-weight: bold;">
          📍 موقعك الحالي (GPS)
        </h4>
        <div style="font-size: 13px; line-height: 1.4;">
          <div><strong>خط العرض:</strong> ${location.latitude.toFixed(8)}</div>
          <div><strong>خط الطول:</strong> ${location.longitude.toFixed(8)}</div>
          <div><strong>دقة الموقع:</strong> ${Math.round(location.accuracy)}م</div>
          <div><strong>الوقت:</strong> ${new Date(location.timestamp).toLocaleString('ar-EG')}</div>
          <div style="margin-top: 8px; padding: 8px; background: #E3F2FD; border-radius: 4px;">
            <div style="font-size: 12px; color: #1565C0;">
              <strong>ملاحظة:</strong> هذا الموقع دقيق جداً ومأخوذ من GPS جهازك
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const getGPSErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 1:
        return 'تم رفض الوصول إلى الموقع. يرجى السماح بالوصول للموقع.';
      case 2:
        return 'موقعك غير متاح حالياً. تأكد من تشغيل GPS.';
      case 3:
        return 'انتهت مهلة الحصول على الموقع. يرجى المحاولة مرة أخرى.';
      default:
        return 'خطأ غير معروف في الحصول على الموقع.';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-xl border-2 border-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4 text-blue-500">🌍</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">جارٍ تحديد موقعك...</h4>
          <p className="text-sm text-gray-600">يرجى السماح بالوصول إلى الموقع عند الطلب</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-80 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4 text-red-500">⚠️</div>
          <h4 className="text-lg font-medium text-red-800 mb-2">خطأ في تحديد الموقع</h4>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={initializeGPSMap}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GPS Status Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-blue-800 font-medium">GPS متصل - موقع حي ودقيق</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <span>دقة: {accuracy}م</span>
            <span>📡</span>
          </div>
        </div>
        {userLocation && (
          <div className="mt-2 text-xs text-blue-600">
            آخر تحديث: {new Date(userLocation.timestamp).toLocaleString('ar-EG')}
          </div>
        )}
      </div>

      {/* Live GPS Map */}
      <div className="w-full h-80 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg relative">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '320px' }}
        />
        
        {/* GPS Accuracy Indicator */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <div className="text-xs space-y-1">
            <div className="font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📍</span>
              GPS حية
            </div>
            <div className="text-gray-600">دقة: {accuracy}م</div>
            <div className="text-gray-600">
              {userLocation && `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`}
            </div>
          </div>
        </div>

        {/* Read-only Notice */}
        {readOnly && (
          <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
            خريطة للعرض فقط - GPS دقيق
          </div>
        )}
      </div>

      {/* GPS Details */}
      {userLocation && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-medium text-gray-800 mb-2">تفاصيل الموقع الدقيق:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">خط العرض:</span>
              <div className="font-mono text-gray-800">{userLocation.latitude.toFixed(8)}</div>
            </div>
            <div>
              <span className="text-gray-600">خط الطول:</span>
              <div className="font-mono text-gray-800">{userLocation.longitude.toFixed(8)}</div>
            </div>
            <div>
              <span className="text-gray-600">دقة GPS:</span>
              <div className="text-gray-800">{accuracy} متر</div>
            </div>
            <div>
              <span className="text-gray-600">وقت التحديد:</span>
              <div className="text-gray-800">{new Date(userLocation.timestamp).toLocaleTimeString('ar-EG')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGPSMap;