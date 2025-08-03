// Activity Logger Utility - أداة تسجيل الأنشطة
// المطلوب: تسجيل تلقائي لجميع الأنشطة مع GPS والتفاصيل

import axios from 'axios';

class ActivityLogger {
  constructor() {
    this.API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';
    this.isEnabled = true;
    this.currentPosition = null;
    this.retryQueue = [];
  }

  // الحصول على الموقع الحالي
  async getCurrentPosition() {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return null;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes cache
          }
        );
      });

      this.currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: new Date().toISOString()
      };

      // محاولة الحصول على العنوان
      try {
        const address = await this.getAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        this.currentPosition.address = address.formatted_address;
        this.currentPosition.city = address.city;
        this.currentPosition.area = address.area;
        this.currentPosition.country = address.country;
      } catch (error) {
        console.warn('Failed to get address from coordinates:', error);
        this.currentPosition.address = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      }

      return this.currentPosition;
    } catch (error) {
      console.warn('Failed to get current position:', error);
      return null;
    }
  }

  // تحويل الإحداثيات إلى عنوان
  async getAddressFromCoordinates(lat, lng) {
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: '',
        area: '',
        country: 'مصر'
      };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=ar`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          formatted_address: result.formatted_address,
          city: this.extractAddressComponent(result, 'locality') || 
                this.extractAddressComponent(result, 'administrative_area_level_2'),
          area: this.extractAddressComponent(result, 'administrative_area_level_3') ||
                this.extractAddressComponent(result, 'sublocality'),
          country: this.extractAddressComponent(result, 'country') || 'مصر'
        };
      }
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }

    return {
      formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: '',
      area: '',
      country: 'مصر'
    };
  }

  // استخراج مكونات العنوان
  extractAddressComponent(result, type) {
    const component = result.address_components.find(
      comp => comp.types.includes(type)
    );
    return component ? component.long_name : '';
  }

  // الحصول على معلومات الجهاز
  getDeviceInfo() {
    const ua = navigator.userAgent;
    
    return {
      device_type: this.getDeviceType(),
      operating_system: this.getOperatingSystem(),
      browser: this.getBrowserInfo(),
      browser_version: this.getBrowserVersion(),
      user_agent: ua,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      online: navigator.onLine
    };
  }

  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  getOperatingSystem() {
    const ua = navigator.userAgent;
    const os = [
      { name: 'Windows 11', regex: /Windows NT 10\.0.*rv:91/ },
      { name: 'Windows 10', regex: /Windows NT 10\.0/ },
      { name: 'Windows 8.1', regex: /Windows NT 6\.3/ },
      { name: 'Windows 8', regex: /Windows NT 6\.2/ },
      { name: 'Windows 7', regex: /Windows NT 6\.1/ },
      { name: 'macOS', regex: /Mac OS X/ },
      { name: 'iOS', regex: /(iPhone|iPad|iPod)/ },
      { name: 'Android', regex: /Android/ },
      { name: 'Linux', regex: /Linux/ },
      { name: 'Unix', regex: /X11/ }
    ];

    for (const o of os) {
      if (o.regex.test(ua)) {
        return o.name;
      }
    }
    return 'Unknown';
  }

  getBrowserInfo() {
    const ua = navigator.userAgent;
    const browsers = [
      { name: 'Chrome', regex: /Chrome/ },
      { name: 'Firefox', regex: /Firefox/ },
      { name: 'Safari', regex: /Safari/ },
      { name: 'Edge', regex: /Edge/ },
      { name: 'Opera', regex: /Opera/ },
      { name: 'Internet Explorer', regex: /MSIE/ }
    ];

    for (const browser of browsers) {
      if (browser.regex.test(ua)) {
        return browser.name;
      }
    }
    return 'Unknown';
  }

  getBrowserVersion() {
    const ua = navigator.userAgent;
    const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
    return match ? match[2] : 'Unknown';
  }

  // تسجيل نشاط
  async logActivity(type, action, targetType = null, targetId = null, targetName = null, details = {}) {
    if (!this.isEnabled) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token available for activity logging');
        return;
      }

      // الحصول على الموقع (optional)
      const location = await this.getCurrentPosition();

      const activityData = {
        type,
        action,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        location: location,
        device_info: this.getDeviceInfo(),
        details: {
          ...details,
          page_url: window.location.href,
          page_title: document.title,
          referrer: document.referrer,
          session_storage_length: sessionStorage.length,
          local_storage_length: localStorage.length
        },
        metadata: {
          logged_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          connection_type: navigator.connection?.effectiveType || 'unknown',
          battery_level: navigator.getBattery ? await navigator.getBattery().then(b => b.level) : null
        }
      };

      const response = await axios.post(`${this.API}/activities`, activityData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Activity logged successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('Failed to log activity:', error);
      
      // إضافة إلى queue للمحاولة مرة أخرى لاحقاً
      this.retryQueue.push({
        type, action, targetType, targetId, targetName, details,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });

      // محاولة إعادة الإرسال بعد فترة
      this.scheduleRetry();
    }
  }

  // جدولة إعادة المحاولة
  scheduleRetry() {
    if (this.retryQueue.length === 0) return;

    setTimeout(async () => {
      const failedActivity = this.retryQueue.shift();
      if (failedActivity && failedActivity.retryCount < 3) {
        failedActivity.retryCount++;
        try {
          await this.logActivity(
            failedActivity.type,
            failedActivity.action,
            failedActivity.targetType,
            failedActivity.targetId,
            failedActivity.targetName,
            failedActivity.details
          );
        } catch (error) {
          if (failedActivity.retryCount < 3) {
            this.retryQueue.push(failedActivity);
          }
        }
      }
    }, 5000); // محاولة مرة أخرى بعد 5 ثوان
  }

  // تسجيل أنشطة محددة
  async logVisitRegistration(clinicId, clinicName, visitDetails = {}) {
    return this.logActivity(
      'visit_registration',
      'تسجيل زيارة عيادة',
      'clinic',
      clinicId,
      clinicName,
      {
        visit_duration: visitDetails.duration || null,
        doctor_present: visitDetails.doctorPresent || null,
        samples_given: visitDetails.samplesGiven || 0,
        notes: visitDetails.notes || '',
        visit_type: visitDetails.type || 'routine',
        ...visitDetails
      }
    );
  }

  async logClinicRegistration(clinicId, clinicName, clinicDetails = {}) {
    return this.logActivity(
      'clinic_registration',
      'تسجيل عيادة جديدة',
      'clinic',
      clinicId,
      clinicName,
      {
        doctor_name: clinicDetails.doctorName || '',
        specialty: clinicDetails.specialty || '',
        classification: clinicDetails.classification || '',
        phone: clinicDetails.phone || '',
        address: clinicDetails.address || '',
        ...clinicDetails
      }
    );
  }

  async logOrderCreation(orderId, orderDetails = {}) {
    return this.logActivity(
      'order_creation',
      'إنشاء طلب جديد',
      'order',
      orderId,
      `طلب رقم ${orderId}`,
      {
        order_value: orderDetails.totalValue || 0,
        items_count: orderDetails.itemsCount || 0,
        clinic_name: orderDetails.clinicName || '',
        payment_method: orderDetails.paymentMethod || '',
        ...orderDetails
      }
    );
  }

  async logProductUpdate(productId, productName, updateDetails = {}) {
    return this.logActivity(
      'product_update',
      'تحديث منتج',
      'product',
      productId,
      productName,
      {
        old_price: updateDetails.oldPrice || null,
        new_price: updateDetails.newPrice || null,
        change_reason: updateDetails.changeReason || '',
        update_type: updateDetails.updateType || 'general',
        ...updateDetails
      }
    );
  }

  async logUserCreation(userId, userName, userDetails = {}) {
    return this.logActivity(
      'user_creation',
      'إنشاء مستخدم جديد',
      'user',
      userId,
      userName,
      {
        user_role: userDetails.role || '',
        department: userDetails.department || '',
        permissions: userDetails.permissions || [],
        ...userDetails
      }
    );
  }

  async logSystemAccess(section, sectionDetails = {}) {
    return this.logActivity(
      'system_access',
      `دخول قسم ${section}`,
      'system',
      section,
      `قسم ${section}`,
      {
        access_time: new Date().toISOString(),
        previous_section: sectionDetails.previousSection || '',
        access_method: sectionDetails.accessMethod || 'navigation',
        ...sectionDetails
      }
    );
  }

  async logLogin(loginDetails = {}) {
    return this.logActivity(
      'login',
      'تسجيل دخول',
      'system',
      'login',
      'نظام EP Group',
      {
        login_method: loginDetails.method || 'password',
        biometric_verified: loginDetails.biometricVerified || false,
        failed_attempts: loginDetails.failedAttempts || 0,
        remember_me: loginDetails.rememberMe || false,
        ...loginDetails
      }
    );
  }

  // تعطيل/تفعيل التسجيل
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Log quick action - for Dashboard quick actions functionality
  logQuickAction(actionId, additionalData = {}) {
    return this.logActivity('quick_action_clicked', {
      action_id: actionId,
      action_type: 'dashboard_quick_action',
      ...additionalData
    });
  }

  // مسح queue إعادة المحاولة
  clearRetryQueue() {
    this.retryQueue = [];
  }
}

// إنشاء instance واحد للاستخدام في جميع أنحاء التطبيق
export const activityLogger = new ActivityLogger();

export default activityLogger;