// Simple Draggable Map for Clinic Registration - خريطة بسيطة لتسجيل العيادات
import React, { useEffect, useRef, useState } from 'react';

const SimpleClinicMap = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  language = 'ar' 
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (latitude && longitude) {
      initializeMap();
    }
  }, [latitude, longitude]);

  const initializeMap = () => {
    // Check if Google Maps is available
    if (!window.google) {
      setMapError('Google Maps لم يتم تحميله بعد');
      return;
    }

    try {
      const mapOptions = {
        center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        zoom: 16,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        // Disable all controls for simple interface
        disableDefaultUI: true,
        // Enable only zoom control
        zoomControl: false,
        // Disable street view
        streetViewControl: false,
        // Disable map type control
        mapTypeControl: false,
        // Disable fullscreen
        fullscreenControl: false,
        // Style the map with minimal UI
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);

      // Create draggable red marker
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        map: map,
        draggable: true,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="#DC2626"/>
              <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
              <circle cx="16" cy="16" r="4" fill="#DC2626"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40)
        },
        title: 'اسحب لتغيير موقع العيادة'
      });

      markerRef.current = marker;

      // Handle marker drag
      marker.addListener('dragend', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        
        console.log('📍 موقع جديد:', newLat, newLng);
        
        if (onLocationChange) {
          onLocationChange(newLat, newLng);
        }
      });

      // Handle map click to move marker
      map.addListener('click', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        
        marker.setPosition({ lat: newLat, lng: newLng });
        
        if (onLocationChange) {
          onLocationChange(newLat, newLng);
        }
      });

      setIsMapLoaded(true);
      console.log('✅ Simple clinic map loaded successfully');

    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setMapError('خطأ في تحميل الخريطة');
    }
  };

  return (
    <div className="w-full h-80 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '320px' }}
      />

      {/* Loading Overlay */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">🔄</div>
            <p className="text-gray-600">جارٍ تحميل الخريطة...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3 text-red-500">⚠️</div>
            <p className="text-red-600 font-medium mb-2">خطأ في تحميل الخريطة</p>
            <p className="text-gray-500 text-sm">{mapError}</p>
          </div>
        </div>
      )}

      {/* Simple Instructions Overlay */}
      {isMapLoaded && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
          <div className="text-sm space-y-1">
            <div className="font-medium text-gray-800 flex items-center gap-1">
              <span className="text-red-500">📍</span>
              تحديد موقع العيادة
            </div>
            <div className="text-gray-600">• اسحب المؤشر الأحمر لتغيير الموقع</div>
            <div className="text-gray-600">• أو انقر على الخريطة لنقل المؤشر</div>
          </div>
        </div>
      )}

      {/* Coordinates Display */}
      {latitude && longitude && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <div className="text-xs text-gray-600">
            <div>خط العرض: {parseFloat(latitude).toFixed(6)}</div>
            <div>خط الطول: {parseFloat(longitude).toFixed(6)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleClinicMap;