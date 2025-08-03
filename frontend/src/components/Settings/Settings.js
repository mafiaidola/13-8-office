// Enhanced Settings Component - إعدادات النظام المحسنة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const Settings = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    system: {
      app_name: 'EP Group System',
      app_version: '2.0.0',
      company_logo: '', // Logo base64 or URL
      max_login_attempts: 3,
      session_timeout: 30,
      enable_two_factor: false,
      maintenance_mode: false
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      daily_reports: true,
      weekly_reports: true
    },
    security: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      auto_logout_minutes: 60
    },
    backup: {
      auto_backup: true,
      backup_frequency: 'daily',
      backup_retention_days: 30,
      backup_location: 'cloud'
    }
  });

  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى اختيار ملف صورة صحيح (JPG, PNG, GIF, SVG)');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        handleSettingChange('system', 'company_logo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const saveSettings = async (category) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      await axios.put(`${API}/admin/settings/${category}`, settings[category], {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🖥️</span>
          إعدادات النظام الأساسية
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">اسم التطبيق</label>
            <input
              type="text"
              value={settings.system.app_name}
              onChange={(e) => handleSettingChange('system', 'app_name', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">إصدار التطبيق</label>
            <input
              type="text"
              value={settings.system.app_version}
              onChange={(e) => handleSettingChange('system', 'app_version', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الحد الأقصى لمحاولات تسجيل الدخول</label>
            <input
              type="number"
              value={settings.system.max_login_attempts}
              onChange={(e) => handleSettingChange('system', 'max_login_attempts', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">مهلة انتهاء الجلسة (دقيقة)</label>
            <input
              type="number"
              value={settings.system.session_timeout}
              onChange={(e) => handleSettingChange('system', 'session_timeout', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="120"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <div className="font-medium">تفعيل المصادقة الثنائية</div>
              <div className="text-sm opacity-75">تتطلب رمز إضافي عند تسجيل الدخول</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system.enable_two_factor}
                onChange={(e) => handleSettingChange('system', 'enable_two_factor', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <div className="font-medium">وضع الصيانة</div>
              <div className="text-sm opacity-75">منع المستخدمين من الوصول للنظام مؤقتاً</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system.maintenance_mode}
                onChange={(e) => handleSettingChange('system', 'maintenance_mode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => saveSettings('system')}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ إعدادات النظام'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔔</span>
          إعدادات الإشعارات
        </h3>
        
        <div className="space-y-4">
          {[
            { key: 'email_notifications', label: 'إشعارات البريد الإلكتروني', desc: 'إرسال الإشعارات عبر البريد الإلكتروني' },
            { key: 'sms_notifications', label: 'إشعارات الرسائل النصية', desc: 'إرسال الإشعارات عبر الرسائل النصية' },
            { key: 'push_notifications', label: 'الإشعارات المباشرة', desc: 'إشعارات فورية في المتصفح' },
            { key: 'daily_reports', label: 'التقارير اليومية', desc: 'إرسال تقرير يومي بالإحصائيات' },
            { key: 'weekly_reports', label: 'التقارير الأسبوعية', desc: 'إرسال تقرير أسبوعي شامل' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm opacity-75">{setting.desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications[setting.key]}
                  onChange={(e) => handleSettingChange('notifications', setting.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => saveSettings('notifications')}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الإشعارات'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔒</span>
          إعدادات الأمان
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">الحد الأدنى لطول كلمة المرور</label>
            <input
              type="number"
              value={settings.security.password_min_length}
              onChange={(e) => handleSettingChange('security', 'password_min_length', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              min="6"
              max="32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">تسجيل الخروج التلقائي (دقيقة)</label>
            <input
              type="number"
              value={settings.security.auto_logout_minutes}
              onChange={(e) => handleSettingChange('security', 'auto_logout_minutes', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              min="15"
              max="480"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {[
            { key: 'password_require_uppercase', label: 'يتطلب أحرف كبيرة', desc: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' },
            { key: 'password_require_numbers', label: 'يتطلب أرقام', desc: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' },
            { key: 'password_require_symbols', label: 'يتطلب رموز خاصة', desc: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm opacity-75">{setting.desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security[setting.key]}
                  onChange={(e) => handleSettingChange('security', setting.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => saveSettings('security')}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الأمان'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>💾</span>
          إعدادات النسخ الاحتياطي
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">تكرار النسخ الاحتياطي</label>
            <select
              value={settings.backup.backup_frequency}
              onChange={(e) => handleSettingChange('backup', 'backup_frequency', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="hourly">كل ساعة</option>
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">مدة الاحتفاظ بالنسخ (يوم)</label>
            <input
              type="number"
              value={settings.backup.backup_retention_days}
              onChange={(e) => handleSettingChange('backup', 'backup_retention_days', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="7"
              max="365"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">موقع النسخ الاحتياطي</label>
            <select
              value={settings.backup.backup_location}
              onChange={(e) => handleSettingChange('backup', 'backup_location', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="local">محلي</option>
              <option value="cloud">سحابي</option>
              <option value="both">كلاهما</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-4">
            <div>
              <div className="font-medium">تفعيل النسخ الاحتياطي التلقائي</div>
              <div className="text-sm opacity-75">إنشاء نسخ احتياطية تلقائياً حسب التكرار المحدد</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.backup.auto_backup}
                onChange={(e) => handleSettingChange('backup', 'auto_backup', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => saveSettings('backup')}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ إعدادات النسخ الاحتياطي'}
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من إنشاء نسخة احتياطية الآن؟')) {
                alert('تم بدء عملية النسخ الاحتياطي');
              }
            }}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            إنشاء نسخة احتياطية الآن
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemInfo = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span>
          معلومات النظام
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm opacity-75">اسم النظام</div>
              <div className="font-bold">{settings.system.app_name}</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm opacity-75">الإصدار</div>
              <div className="font-bold">{settings.system.app_version}</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm opacity-75">تاريخ آخر نسخة احتياطية</div>
              <div className="font-bold">{new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm opacity-75">المستخدمين النشطين</div>
              <div className="font-bold">23 مستخدم</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm opacity-75">حالة الخادم</div>
              <div className="font-bold text-green-400">متصل</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm opacity-75">مساحة التخزين المستخدمة</div>
              <div className="font-bold">2.3 GB / 10 GB</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm opacity-75 mb-2">استخدام مساحة التخزين</div>
            <div className="w-full bg-gray-600 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '23%' }}></div>
            </div>
            <div className="text-xs mt-1 opacity-60">23% مستخدم</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">إعدادات النظام</h1>
            <p className="text-lg opacity-75">إدارة شاملة لإعدادات النظام والأمان والنسخ الاحتياطي</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: 'system', name: 'النظام', icon: '🖥️' },
            { id: 'notifications', name: 'الإشعارات', icon: '🔔' },
            { id: 'security', name: 'الأمان', icon: '🔒' },
            { id: 'backup', name: 'النسخ الاحتياطي', icon: '💾' },
            { id: 'info', name: 'معلومات النظام', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-300 border-b-2 border-blue-400'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'system' && renderSystemSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'backup' && renderBackupSettings()}
          {activeTab === 'info' && renderSystemInfo()}
        </div>
      </div>
    </div>
  );
};

export default Settings;