// Comprehensive Activity Service - خدمة تسجيل الأنشطة الشاملة والاحترافية
import axios from 'axios';

class ComprehensiveActivityService {
  constructor() {
    this.API_URL = process.env.REACT_APP_BACKEND_URL;
    this.initializeService();
  }

  // تهيئة الخدمة
  initializeService() {
    console.log('🚀 تم تهيئة خدمة تسجيل الأنشطة الشاملة');
    this.setupLocationTracking();
  }

  // إعداد تتبع الموقع الجغرافي
  setupLocationTracking() {
    if (navigator.geolocation) {
      this.watchPosition();
    }
  }

  // مراقبة الموقع المستمرة
  watchPosition() {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    this.positionWatcher = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        console.log('📍 تم تحديث الموقع الجغرافي:', this.currentLocation);
      },
      (error) => {
        console.warn('⚠️ خطأ في تتبع الموقع:', error.message);
      },
      options
    );
  }

  // الحصول على معلومات الجهاز المتقدمة
  getAdvancedDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const cookieEnabled = navigator.cookieEnabled;
    const onLine = navigator.onLine;
    
    // تحليل نوع الجهاز
    let deviceType = 'Desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'Mobile';
    else if (/iPad|Tablet/i.test(userAgent)) deviceType = 'Tablet';
    
    // تحليل المتصفح
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // تحليل نظام التشغيل
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      userAgent,
      platform,
      language,
      cookieEnabled,
      onLine,
      deviceType,
      browser,
      os,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }

  // الحصول على عنوان IP الخارجي
  async getPublicIP() {
    try {
      const response = await fetch('https://api64.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('لم يتم الحصول على IP الخارجي:', error.message);
      return null;
    }
  }

  // الحصول على معلومات الموقع من IP
  async getLocationFromIP(ip) {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      return {
        city: data.city,
        region: data.region,
        country: data.country_name,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isp: data.org
      };
    } catch (error) {
      console.warn('لم يتم الحصول على معلومات الموقع من IP:', error.message);
      return null;
    }
  }

  // تسجيل نشاط شامل
  async recordComprehensiveActivity(activityData) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ لا يوجد token للمصادقة');
        return null;
      }

      // الحصول على معلومات شاملة
      const deviceInfo = this.getAdvancedDeviceInfo();
      const publicIP = await this.getPublicIP();
      const ipLocation = publicIP ? await this.getLocationFromIP(publicIP) : null;

      // تجميع البيانات الشاملة
      const comprehensiveData = {
        ...activityData,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
        ip_address: publicIP,
        device_info: deviceInfo,
        location: this.currentLocation || ipLocation || {},
        geo_location: ipLocation,
        browser_info: {
          referrer: document.referrer,
          url: window.location.href,
          title: document.title
        },
        performance_info: {
          connection_type: navigator.connection?.effectiveType,
          memory: navigator.deviceMemory,
          cores: navigator.hardwareConcurrency
        }
      };

      console.log('📋 تسجيل نشاط شامل:', comprehensiveData);

      // إرسال البيانات للخادم
      const response = await axios.post(
        `${this.API_URL}/api/activities/record`,
        comprehensiveData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        console.log('✅ تم تسجيل النشاط بنجاح:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل النشاط:', error.message);
      return null;
    }
  }

  // تسجيل تسجيل الدخول
  async recordLogin(userInfo) {
    return await this.recordComprehensiveActivity({
      action: 'login',
      user_id: userInfo.id,
      user_name: userInfo.full_name || userInfo.username,
      user_role: userInfo.role,
      description: 'تسجيل دخول إلى النظام',
      category: 'authentication',
      success: true,
      details: {
        login_method: 'credentials',
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
  }

  // تسجيل إضافة عيادة
  async recordClinicCreation(clinicData) {
    return await this.recordComprehensiveActivity({
      action: 'clinic_create',
      description: `إضافة عيادة جديدة: ${clinicData.name}`,
      category: 'clinic_management',
      entity_type: 'clinic',
      entity_id: clinicData.id,
      success: true,
      details: {
        clinic_name: clinicData.name,
        doctor_name: clinicData.doctor_name,
        location: clinicData.location,
        clinic_type: clinicData.clinic_type
      }
    });
  }

  // تسجيل إنشاء زيارة
  async recordVisitCreation(visitData) {
    return await this.recordComprehensiveActivity({
      action: 'visit_create',
      description: `إنشاء زيارة جديدة: ${visitData.clinic_name}`,
      category: 'visit_management',
      entity_type: 'visit',
      entity_id: visitData.id,
      success: true,
      details: {
        clinic_name: visitData.clinic_name,
        visit_type: visitData.visit_type,
        visit_date: visitData.visit_date,
        priority: visitData.priority
      }
    });
  }

  // تسجيل إنشاء فاتورة
  async recordInvoiceCreation(invoiceData) {
    return await this.recordComprehensiveActivity({
      action: 'invoice_create',
      description: `إنشاء فاتورة جديدة: ${invoiceData.invoice_number}`,
      category: 'financial_management',
      entity_type: 'invoice',
      entity_id: invoiceData.id,
      success: true,
      details: {
        invoice_number: invoiceData.invoice_number,
        amount: invoiceData.amount,
        clinic_name: invoiceData.clinic_name,
        status: invoiceData.status
      }
    });
  }

  // تسجيل إنشاء طلب
  async recordOrderCreation(orderData) {
    return await this.recordComprehensiveActivity({
      action: 'order_create',
      description: `إنشاء طلب جديد: ${orderData.order_number}`,
      category: 'order_management',
      entity_type: 'order',
      entity_id: orderData.id,
      success: true,
      details: {
        order_number: orderData.order_number,
        total_amount: orderData.total_amount,
        items_count: orderData.items?.length || 0,
        status: orderData.status
      }
    });
  }

  // تسجيل إنشاء مستخدم
  async recordUserCreation(userData) {
    return await this.recordComprehensiveActivity({
      action: 'user_create',
      description: `إضافة مستخدم جديد: ${userData.full_name}`,
      category: 'user_management',
      entity_type: 'user',
      entity_id: userData.id,
      success: true,
      details: {
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        email: userData.email
      }
    });
  }

  // تسجيل عرض صفحة
  async recordPageView(pageInfo) {
    return await this.recordComprehensiveActivity({
      action: 'page_view',
      description: `عرض صفحة: ${pageInfo.title}`,
      category: 'navigation',
      success: true,
      details: {
        page_title: pageInfo.title,
        page_url: pageInfo.url,
        previous_page: document.referrer,
        time_spent: pageInfo.timeSpent || 0
      }
    });
  }

  // الحصول على معرف الجلسة
  getSessionId() {
    let sessionId = sessionStorage.getItem('activity_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('activity_session_id', sessionId);
    }
    return sessionId;
  }

  // جلب الأنشطة الحديثة
  async getRecentActivities(limit = 20, filters = {}) {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...filters
      });

      const response = await axios.get(
        `${this.API_URL}/api/activities?${params}`,
        { headers }
      );

      return response.data || [];
    } catch (error) {
      console.error('خطأ في جلب الأنشطة:', error.message);
      return [];
    }
  }

  // جلب إحصائيات الأنشطة
  async getActivityStats() {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${this.API_URL}/api/activities/stats`,
        { headers }
      );

      return response.data || {};
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الأنشطة:', error.message);
      return {};
    }
  }

  // تنظيف الموارد
  cleanup() {
    if (this.positionWatcher) {
      navigator.geolocation.clearWatch(this.positionWatcher);
    }
  }
}

// إنشاء instance وحيد
const comprehensiveActivityService = new ComprehensiveActivityService();

export default comprehensiveActivityService;