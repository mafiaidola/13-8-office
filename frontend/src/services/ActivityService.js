// Activity Service - خدمة تسجيل الأنشطة الشاملة
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://medmanage-pro-1.preview.emergentagent.com';

class ActivityService {
  constructor() {
    this.currentPosition = null;
    this.deviceInfo = null;
    this.sessionStartTime = new Date();
  }

  // طلب إذن الموقع الجغرافي
  async requestLocationPermission() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      console.log('🌍 طلب إذن الموقع الجغرافي من المستخدم...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ تم الحصول على إذن الموقع بنجاح:', position);
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          
          // الحصول على عنوان مقروء
          this.reverseGeocode(position.coords.latitude, position.coords.longitude)
            .then(address => {
              if (address) {
                this.currentPosition.address = address.display_name;
                this.currentPosition.city = address.address?.city || address.address?.town || address.address?.village;
                this.currentPosition.country = address.address?.country;
              }
              resolve(this.currentPosition);
            });
        },
        (error) => {
          console.warn('❌ فشل في الحصول على الموقع:', error.message);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.warn('المستخدم رفض طلب الموقع الجغرافي');
              break;
            case error.POSITION_UNAVAILABLE:
              console.warn('معلومات الموقع غير متاحة');
              break;
            case error.TIMEOUT:
              console.warn('انتهت مهلة طلب الموقع');
              break;
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }

  // تحويل الإحداثيات إلى عنوان
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Medical Management System/1.0'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('خطأ في تحويل الإحداثيات:', error);
      return null;
    }
  }

  // جمع معلومات الجهاز
  getDeviceInfo() {
    if (this.deviceInfo) return this.deviceInfo;

    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    this.deviceInfo = {
      user_agent: userAgent,
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      device_type: this.getDeviceType(),
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language || navigator.userLanguage,
      online: navigator.onLine,
      cookie_enabled: navigator.cookieEnabled
    };

    return this.deviceInfo;
  }

  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown Browser';
  }

  getOSInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows NT')) return 'Windows';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
  }

  // تسجيل نشاط جديد
  async logActivity(activityData) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('لا يوجد access token للمصادقة');
        return false;
      }

      // طلب الموقع إذا لم يكن متاحاً
      if (!this.currentPosition && activityData.requireLocation !== false) {
        await this.requestLocationPermission();
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        user_id: activityData.user_id,
        user_name: activityData.user_name,
        user_role: activityData.user_role,
        action: activityData.action,
        description: activityData.description,
        entity_type: activityData.entity_type || null,
        entity_id: activityData.entity_id || null,
        device_info: this.getDeviceInfo(),
        location: this.currentPosition,
        additional_data: activityData.additional_data || {},
        session_duration: this.getSessionDuration()
      };

      console.log('📝 تسجيل نشاط جديد:', payload);

      const response = await axios.post(`${API_URL}/api/activities/record`, payload, { headers });

      if (response.data.success) {
        console.log('✅ تم تسجيل النشاط بنجاح:', response.data);
        return response.data;
      }

      return false;
    } catch (error) {
      console.error('❌ خطأ في تسجيل النشاط:', error);
      return false;
    }
  }

  // حساب مدة الجلسة
  getSessionDuration() {
    const now = new Date();
    const diffMs = now - this.sessionStartTime;
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    
    if (diffHrs > 0) {
      return `${diffHrs} ساعة ${diffMins} دقيقة`;
    }
    return `${diffMins} دقيقة`;
  }

  // تسجيل تسجيل الدخول
  async logLogin(user) {
    return await this.logActivity({
      user_id: user.user_id || user.id,
      user_name: user.full_name || user.username,
      user_role: user.role,
      action: 'login',
      description: `قام ${user.full_name || user.username} بتسجيل الدخول إلى النظام`,
      requireLocation: true
    });
  }

  // تسجيل تسجيل الخروج
  async logLogout(user) {
    return await this.logActivity({
      user_id: user.user_id || user.id,
      user_name: user.full_name || user.username,
      user_role: user.role,
      action: 'logout',
      description: `قام ${user.full_name || user.username} بتسجيل الخروج من النظام`,
      requireLocation: false
    });
  }

  // تسجيل إنشاء زيارة
  async logVisitCreation(user, visitData) {
    return await this.logActivity({
      user_id: user.user_id || user.id,
      user_name: user.full_name || user.username,
      user_role: user.role,
      action: 'visit_created',
      description: `قام ${user.full_name || user.username} بإنشاء زيارة للعيادة ${visitData.clinic_name}`,
      entity_type: 'visit',
      entity_id: visitData.id,
      additional_data: {
        clinic_name: visitData.clinic_name,
        visit_type: visitData.visit_type,
        priority: visitData.priority
      },
      requireLocation: true
    });
  }

  // تسجيل إنشاء فاتورة
  async logInvoiceCreation(user, invoiceData) {
    return await this.logActivity({
      user_id: user.user_id || user.id,
      user_name: user.full_name || user.username,
      user_role: user.role,
      action: 'invoice_created',
      description: `قام ${user.full_name || user.username} بإنشاء فاتورة رقم ${invoiceData.invoice_number}`,
      entity_type: 'invoice',
      entity_id: invoiceData.id,
      additional_data: {
        invoice_number: invoiceData.invoice_number,
        amount: invoiceData.amount,
        clinic_name: invoiceData.clinic_name
      },
      requireLocation: false
    });
  }

  // تسجيل إضافة عيادة
  async logClinicRegistration(user, clinicData) {
    return await this.logActivity({
      user_id: user.user_id || user.id,
      user_name: user.full_name || user.username,
      user_role: user.role,
      action: 'clinic_registered',
      description: `قام ${user.full_name || user.username} بتسجيل عيادة ${clinicData.name}`,
      entity_type: 'clinic',
      entity_id: clinicData.id,
      additional_data: {
        clinic_name: clinicData.name,
        doctor_name: clinicData.doctor_name,
        address: clinicData.address
      },
      requireLocation: true
    });
  }

  // جلب الأنشطة
  async getActivities(filters = {}) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return [];

      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`${API_URL}/api/activities?${params}`, { headers });
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب الأنشطة:', error);
      return [];
    }
  }

  // جلب إحصائيات الأنشطة
  async getActivityStats() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/activities/stats`, { headers });
      return response.data;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الأنشطة:', error);
      return null;
    }
  }
}

// إنشاء instance واحد مشترك
const activityService = new ActivityService();

export default activityService;