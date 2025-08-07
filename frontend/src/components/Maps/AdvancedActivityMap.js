// Advanced Activity Tracking Map - خريطة تتبع الأنشطة المتقدمة
import React, { useEffect, useRef, useState } from 'react';

const AdvancedActivityMap = ({ 
  currentLocation, 
  activityHistory = [], 
  visitLocations = [], 
  repInfo,
  language = 'ar',
  showControls = true 
}) => {
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapMode, setMapMode] = useState('hybrid'); // roadmap, satellite, hybrid, terrain
  const [showTrails, setShowTrails] = useState(true);
  const [showVisits, setShowVisits] = useState(true);
  const [pathPolyline, setPathPolyline] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (currentLocation || (activityHistory && activityHistory.length > 0)) {
      initializeAdvancedMap();
    }
  }, [currentLocation, activityHistory, visitLocations, mapMode]);

  const initializeAdvancedMap = () => {
    if (!window.google) {
      setMapError('Google Maps لم يتم تحميله بعد');
      return;
    }

    try {
      // Determine center point
      let centerLat = 30.0444; // Cairo default
      let centerLng = 31.2357;
      
      if (currentLocation) {
        centerLat = currentLocation.latitude;
        centerLng = currentLocation.longitude;
      } else if (activityHistory.length > 0) {
        const lastActivity = activityHistory[activityHistory.length - 1];
        centerLat = lastActivity.latitude || centerLat;
        centerLng = lastActivity.longitude || centerLng;
      }

      const mapOptions = {
        center: { lat: centerLat, lng: centerLng },
        zoom: 14,
        mapTypeId: window.google.maps.MapTypeId[mapMode.toUpperCase()],
        // Enable all controls for advanced features
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
        // Enhanced styles
        styles: [
          {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
          }
        ]
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);

      // Clear previous markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Clear previous path
      if (pathPolyline) {
        pathPolyline.setMap(null);
      }

      // Add current location marker (live position)
      if (currentLocation) {
        const currentMarker = new window.google.maps.Marker({
          position: { 
            lat: currentLocation.latitude, 
            lng: currentLocation.longitude 
          },
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="currentGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
                    <stop offset="70%" style="stop-color:#059669;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#047857;stop-opacity:0.8" />
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill="url(#currentGrad)" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
                <text x="20" y="25" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#059669">📍</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          },
          title: `الموقع الحالي للمندوب: ${repInfo?.name || 'غير محدد'}`,
          animation: window.google.maps.Animation.BOUNCE
        });

        // Info window for current location
        const currentInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: Arial;">
              <h4 style="margin: 0 0 8px; color: #059669; font-weight: bold;">
                🎯 الموقع الحالي
              </h4>
              <div style="font-size: 13px; line-height: 1.4;">
                <div><strong>المندوب:</strong> ${repInfo?.name || 'غير محدد'}</div>
                <div><strong>المنطقة:</strong> ${repInfo?.area || 'غير محدد'}</div>
                <div><strong>الخط:</strong> ${repInfo?.line || 'غير محدد'}</div>
                <div><strong>الوقت:</strong> ${new Date().toLocaleString('ar-EG')}</div>
                <div><strong>الإحداثيات:</strong> ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}</div>
                ${currentLocation.accuracy ? `<div><strong>الدقة:</strong> ${Math.round(currentLocation.accuracy)}م</div>` : ''}
              </div>
            </div>
          `
        });

        currentMarker.addListener('click', () => {
          currentInfoWindow.open(map, currentMarker);
        });

        markersRef.current.push(currentMarker);

        // Add pulsing accuracy circle
        if (currentLocation.accuracy) {
          const accuracyCircle = new window.google.maps.Circle({
            strokeColor: '#10B981',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#10B981',
            fillOpacity: 0.15,
            map: map,
            center: { lat: currentLocation.latitude, lng: currentLocation.longitude },
            radius: currentLocation.accuracy
          });

          markersRef.current.push({ setMap: (map) => accuracyCircle.setMap(map) });
        }
      }

      // Add activity history trail
      if (showTrails && activityHistory.length > 0) {
        const pathCoordinates = activityHistory
          .filter(activity => activity.latitude && activity.longitude)
          .map(activity => ({
            lat: activity.latitude,
            lng: activity.longitude
          }));

        if (pathCoordinates.length > 1) {
          const polyline = new window.google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            icons: [{
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#1E40AF',
                fillColor: '#3B82F6',
                fillOpacity: 1
              },
              offset: '100%',
              repeat: '50px'
            }]
          });

          polyline.setMap(map);
          setPathPolyline(polyline);

          // Add activity point markers
          activityHistory.forEach((activity, index) => {
            if (!activity.latitude || !activity.longitude) return;

            const isFirst = index === 0;
            const isLast = index === activityHistory.length - 1;
            
            const activityMarker = new window.google.maps.Marker({
              position: { lat: activity.latitude, lng: activity.longitude },
              map: map,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="${isFirst ? '#EF4444' : isLast ? '#10B981' : '#3B82F6'}" stroke="#FFFFFF" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#FFFFFF">${index + 1}</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
              },
              title: `نشاط ${index + 1}: ${activity.activity_type || 'غير محدد'}`
            });

            // Info window for activity
            const activityInfoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; font-family: Arial; max-width: 250px;">
                  <h4 style="margin: 0 0 6px; color: ${isFirst ? '#EF4444' : isLast ? '#10B981' : '#3B82F6'};">
                    📋 نشاط ${index + 1} ${isFirst ? '(البداية)' : isLast ? '(الحالي)' : ''}
                  </h4>
                  <div style="font-size: 12px; line-height: 1.3;">
                    <div><strong>النوع:</strong> ${activity.activity_type || 'غير محدد'}</div>
                    <div><strong>الوقت:</strong> ${activity.timestamp ? new Date(activity.timestamp).toLocaleString('ar-EG') : 'غير محدد'}</div>
                    <div><strong>المدة:</strong> ${activity.duration || 'غير محدد'}</div>
                    ${activity.description ? `<div><strong>الوصف:</strong> ${activity.description}</div>` : ''}
                    <div style="margin-top: 4px; font-size: 11px; color: #666;">
                      📍 ${activity.latitude.toFixed(6)}, ${activity.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              `
            });

            activityMarker.addListener('click', () => {
              activityInfoWindow.open(map, activityMarker);
            });

            markersRef.current.push(activityMarker);
          });
        }
      }

      // Add visit locations
      if (showVisits && visitLocations.length > 0) {
        visitLocations.forEach((visit, index) => {
          if (!visit.latitude || !visit.longitude) return;

          const visitMarker = new window.google.maps.Marker({
            position: { lat: visit.latitude, lng: visit.longitude },
            map: map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="#8B5CF6"/>
                  <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
                  <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#8B5CF6">🏥</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40)
            },
            title: `زيارة: ${visit.clinic_name || 'عيادة غير محددة'}`
          });

          // Info window for visit
          const visitInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Arial; max-width: 280px;">
                <h4 style="margin: 0 0 8px; color: #8B5CF6; font-weight: bold;">
                  🏥 ${visit.clinic_name || 'عيادة غير محددة'}
                </h4>
                <div style="font-size: 13px; line-height: 1.4;">
                  ${visit.doctor_name ? `<div><strong>الطبيب:</strong> ${visit.doctor_name}</div>` : ''}
                  ${visit.visit_date ? `<div><strong>تاريخ الزيارة:</strong> ${new Date(visit.visit_date).toLocaleString('ar-EG')}</div>` : ''}
                  ${visit.duration ? `<div><strong>مدة الزيارة:</strong> ${visit.duration}</div>` : ''}
                  ${visit.status ? `<div><strong>الحالة:</strong> ${visit.status}</div>` : ''}
                  ${visit.notes ? `<div><strong>الملاحظات:</strong> ${visit.notes}</div>` : ''}
                  <div style="margin-top: 6px; font-size: 11px; color: #666;">
                    📍 ${visit.latitude.toFixed(6)}, ${visit.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
            `
          });

          visitMarker.addListener('click', () => {
            visitInfoWindow.open(map, visitMarker);
          });

          markersRef.current.push(visitMarker);
        });
      }

      // Auto-fit bounds to show all markers
      if (markersRef.current.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        
        // Add current location
        if (currentLocation) {
          bounds.extend({ lat: currentLocation.latitude, lng: currentLocation.longitude });
        }
        
        // Add activity history
        activityHistory.forEach(activity => {
          if (activity.latitude && activity.longitude) {
            bounds.extend({ lat: activity.latitude, lng: activity.longitude });
          }
        });
        
        // Add visit locations
        visitLocations.forEach(visit => {
          if (visit.latitude && visit.longitude) {
            bounds.extend({ lat: visit.latitude, lng: visit.longitude });
          }
        });

        map.fitBounds(bounds, { padding: 50 });
      }

      setIsMapLoaded(true);
      console.log('✅ Advanced activity tracking map loaded successfully');

    } catch (error) {
      console.error('❌ Error initializing advanced map:', error);
      setMapError('خطأ في تحميل خريطة تتبع الأنشطة');
    }
  };

  return (
    <div className="w-full h-96 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">🔄</div>
            <p className="text-gray-600">جارٍ تحميل خريطة تتبع الأنشطة...</p>
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

      {/* Map Controls */}
      {showControls && isMapLoaded && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border space-y-2">
          <h4 className="font-medium text-gray-800 text-sm">🎛️ إعدادات الخريطة</h4>
          
          {/* Map Type Control */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">نوع الخريطة:</label>
            <select
              value={mapMode}
              onChange={(e) => setMapMode(e.target.value)}
              className="text-xs border rounded px-2 py-1 w-full"
            >
              <option value="roadmap">طرق</option>
              <option value="satellite">قمر صناعي</option>
              <option value="hybrid">مختلط</option>
              <option value="terrain">تضاريس</option>
            </select>
          </div>

          {/* Show/Hide Controls */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="text-xs"
              />
              إظهار مسار الحركة
            </label>
            
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showVisits}
                onChange={(e) => setShowVisits(e.target.checked)}
                className="text-xs"
              />
              إظهار الزيارات
            </label>
          </div>
        </div>
      )}

      {/* Legend */}
      {isMapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
          <h4 className="font-medium text-gray-800 text-sm mb-2">📍 دليل الرموز</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border"></div>
              <span>الموقع الحالي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border"></div>
              <span>نقاط النشاط</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full border"></div>
              <span>زيارات العيادات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-500"></div>
              <span>مسار الحركة</span>
            </div>
          </div>
          
          {/* Stats */}
          {(activityHistory.length > 0 || visitLocations.length > 0) && (
            <div className="mt-2 pt-2 border-t text-xs text-gray-600">
              <div>الأنشطة: {activityHistory.length}</div>
              <div>الزيارات: {visitLocations.length}</div>
              {repInfo && (
                <div className="mt-1 font-medium text-gray-800">
                  {repInfo.name} - {repInfo.area}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedActivityMap;